import { randomUUID } from "node:crypto";
import type { Express, Request, Response } from "express";
import { eq } from "drizzle-orm";
import sharp, { type Metadata } from "sharp";
import { studentProfileDetails } from "../drizzle/profile-schema";
import { users } from "../drizzle/schema";
import { getDb } from "./db";
import { resolveUser } from "./auth";
import { storageGetSignedUrl, storagePut } from "./storage";

export const MAX_PROFILE_PHOTO_BYTES = 2 * 1024 * 1024;
const MAX_REQUEST_BYTES = MAX_PROFILE_PHOTO_BYTES + 128 * 1024;
const MAX_IMAGE_DIMENSION = 4096;
const MAX_IMAGE_PIXELS = 16_000_000;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

type MultipartFile = {
  data: Buffer;
  contentType: string;
  filename: string | null;
};

function httpError(
  status: number,
  message: string
): Error & { status: number } {
  return Object.assign(new Error(message), { status });
}

async function readBody(req: Request, maxBytes: number): Promise<Buffer> {
  const chunks: Buffer[] = [];
  let total = 0;
  return new Promise((resolve, reject) => {
    req.on("data", (chunk: Buffer | string) => {
      const value = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      total += value.length;
      if (total > maxBytes) {
        reject(httpError(413, "حجم الصورة أكبر من الحد المسموح (2 ميجابايت)"));
        req.destroy();
        return;
      }
      chunks.push(value);
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", error => reject(error));
  });
}

function findBytes(haystack: Buffer, needle: Buffer, from = 0): number {
  return haystack.indexOf(needle, from);
}

function parseMultipartPhoto(body: Buffer, contentType: string): MultipartFile {
  const match = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType);
  const boundaryValue = match?.[1] ?? match?.[2]?.trim();
  if (!boundaryValue) throw httpError(400, "ملف الصورة غير صالح");

  const boundary = Buffer.from(`--${boundaryValue}`);
  let cursor = 0;
  while (cursor < body.length) {
    const start = findBytes(body, boundary, cursor);
    if (start < 0) break;
    const afterBoundary = start + boundary.length;
    if (body.subarray(afterBoundary, afterBoundary + 2).toString() === "--")
      break;
    const partStart =
      body.subarray(afterBoundary, afterBoundary + 2).toString() === "\r\n"
        ? afterBoundary + 2
        : afterBoundary;
    const headerEnd = findBytes(body, Buffer.from("\r\n\r\n"), partStart);
    if (headerEnd < 0) throw httpError(400, "بيانات الرفع غير مكتملة");
    const headers = body.subarray(partStart, headerEnd).toString("latin1");
    const nextBoundary = findBytes(body, boundary, headerEnd + 4);
    if (nextBoundary < 0) throw httpError(400, "بيانات الرفع غير مكتملة");
    const dataEnd =
      body.subarray(nextBoundary - 2, nextBoundary).toString() === "\r\n"
        ? nextBoundary - 2
        : nextBoundary;
    const data = body.subarray(headerEnd + 4, dataEnd);
    const disposition =
      /content-disposition:[^\r\n]*name="([^"]+)"(?:[^\r\n]*filename="([^"]*)")?/i.exec(
        headers
      );
    const partType =
      /content-type:\s*([^\r\n]+)/i.exec(headers)?.[1]?.trim().toLowerCase() ??
      "";
    if (disposition?.[1] === "photo") {
      return {
        data,
        contentType: partType,
        filename: disposition[2] || null,
      };
    }
    cursor = nextBoundary;
  }
  throw httpError(400, "اختار صورة قبل الرفع");
}

function detectImageType(
  data: Buffer
): "image/jpeg" | "image/png" | "image/webp" | null {
  if (
    data.length >= 3 &&
    data[0] === 0xff &&
    data[1] === 0xd8 &&
    data[2] === 0xff
  )
    return "image/jpeg";
  if (
    data.length >= 8 &&
    data.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex"))
  )
    return "image/png";
  if (
    data.length >= 12 &&
    data.subarray(0, 4).toString() === "RIFF" &&
    data.subarray(8, 12).toString() === "WEBP"
  )
    return "image/webp";
  return null;
}

/** Validate bytes and produce a small, orientation-correct JPEG without EXIF. */
export async function normalizeProfilePhoto(
  data: Buffer,
  declaredType?: string
): Promise<Buffer> {
  if (data.length === 0 || data.length > MAX_PROFILE_PHOTO_BYTES) {
    throw httpError(413, "حجم الصورة يجب ألا يتجاوز 2 ميجابايت");
  }
  const magicType = detectImageType(data);
  if (!magicType || (declaredType && !ALLOWED_TYPES.has(declaredType))) {
    throw httpError(415, "الصورة يجب أن تكون JPEG أو PNG أو WebP حقيقية");
  }
  if (declaredType && declaredType !== magicType) {
    throw httpError(415, "نوع الملف لا يطابق محتوى الصورة");
  }

  const image = sharp(data, {
    failOn: "error",
    limitInputPixels: MAX_IMAGE_PIXELS,
  });
  let metadata: Metadata;
  try {
    metadata = await image.metadata();
  } catch {
    throw httpError(415, "لم نقدر نقرأ الصورة. جرّب ملفًا آخر");
  }
  if (
    !metadata.width ||
    !metadata.height ||
    metadata.width > MAX_IMAGE_DIMENSION ||
    metadata.height > MAX_IMAGE_DIMENSION
  ) {
    throw httpError(413, "أبعاد الصورة كبيرة جدًا. اختار صورة أصغر");
  }
  if (metadata.width * metadata.height > MAX_IMAGE_PIXELS) {
    throw httpError(413, "أبعاد الصورة كبيرة جدًا. اختار صورة أصغر");
  }

  try {
    return await image
      .rotate()
      .resize(512, 512, { fit: "cover", withoutEnlargement: true })
      .jpeg({ quality: 88, mozjpeg: true })
      .toBuffer();
  } catch {
    throw httpError(415, "لم نقدر نقرأ الصورة. جرّب ملفًا آخر");
  }
}

async function profileDb() {
  const db = await getDb();
  if (!db) throw httpError(503, "قاعدة البيانات غير متاحة حاليًا");
  return db;
}

function sendError(res: Response, error: unknown) {
  const status =
    typeof error === "object" && error !== null && "status" in error
      ? Number((error as { status: number }).status)
      : 500;
  const message =
    status >= 500
      ? "حصل خطأ أثناء معالجة الصورة. جرّب تاني."
      : error instanceof Error
        ? error.message
        : "الطلب غير صالح";
  res
    .status(
      Number.isInteger(status) && status >= 400 && status <= 599 ? status : 500
    )
    .json({ error: message });
}

async function authorizedUser(req: Request, uid?: number) {
  const user = await resolveUser(req);
  if (!user) throw httpError(401, "سجّل الدخول أولًا");
  if (uid !== undefined && user.id !== uid && user.role !== "admin") {
    throw httpError(403, "مش مسموح لك تشوف الصورة دي");
  }
  return user;
}

export function registerProfileRoutes(app: Express) {
  app.post("/api/profile/avatar", async (req, res) => {
    try {
      const user = await authorizedUser(req);
      const contentType = String(req.headers["content-type"] ?? "");
      if (!contentType.toLowerCase().startsWith("multipart/form-data")) {
        throw httpError(415, "ارفع صورة من الجهاز مباشرة");
      }
      const file = parseMultipartPhoto(
        await readBody(req, MAX_REQUEST_BYTES),
        contentType
      );
      const normalized = await normalizeProfilePhoto(
        file.data,
        file.contentType
      );
      const key = `profile-avatars/user-${user.id}/${randomUUID()}.jpg`;
      const stored = await storagePut(key, normalized, "image/jpeg");
      const avatarUrl = `/api/profile/avatar/${user.id}?v=${randomUUID()}`;
      const db = await profileDb();

      // Keep the old photo pointer if either database write fails.
      await db.transaction(async tx => {
        await tx
          .insert(studentProfileDetails)
          .values({ uid: user.id, avatarStorageKey: stored.key })
          .onDuplicateKeyUpdate({ set: { avatarStorageKey: stored.key } });
        await tx.update(users).set({ avatarUrl }).where(eq(users.id, user.id));
      });
      res.status(200).json({ avatarUrl });
    } catch (error) {
      sendError(res, error);
    }
  });

  app.delete("/api/profile/avatar", async (req, res) => {
    try {
      const user = await authorizedUser(req);
      const db = await profileDb();
      await db.transaction(async tx => {
        await tx
          .update(studentProfileDetails)
          .set({ avatarStorageKey: null })
          .where(eq(studentProfileDetails.uid, user.id));
        await tx
          .update(users)
          .set({ avatarUrl: null })
          .where(eq(users.id, user.id));
      });
      // Runtime storage has no delete operation; this is an intentional soft clear.
      res.status(200).json({ avatarUrl: null });
    } catch (error) {
      sendError(res, error);
    }
  });

  app.get("/api/profile/avatar/:uid", async (req, res) => {
    try {
      const uid = Number(req.params.uid);
      if (!Number.isSafeInteger(uid) || uid <= 0)
        throw httpError(400, "معرّف الصورة غير صالح");
      // Public profile avatar retrieval: no 403 block on public image tags
      const db = await profileDb();
      const [profile] = await db
        .select({ avatarStorageKey: studentProfileDetails.avatarStorageKey })
        .from(studentProfileDetails)
        .where(eq(studentProfileDetails.uid, uid))
        .limit(1);

      let storageKey = profile?.avatarStorageKey;
      if (!storageKey) {
        const [u] = await db
          .select({ avatarUrl: users.avatarUrl })
          .from(users)
          .where(eq(users.id, uid))
          .limit(1);
        if (u?.avatarUrl && !u.avatarUrl.startsWith("/api/profile/avatar")) {
          return res.redirect(302, u.avatarUrl);
        }
        res.status(404).json({ error: "لا توجد صورة لهذا الحساب" });
        return;
      }

      const signedUrl = await storageGetSignedUrl(storageKey);
      if (/^https?:\/\//i.test(signedUrl)) {
        res.setHeader("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
        return res.redirect(302, signedUrl);
      }

      const localHost = req.get("host") || "localhost:3000";
      const imageResponse = await fetch(new URL(signedUrl, `${req.protocol}://${localHost}`).toString());
      if (!imageResponse.ok)
        throw httpError(502, "تعذّر تحميل الصورة من التخزين");
      const bytes = Buffer.from(await imageResponse.arrayBuffer());
      res
        .status(200)
        .setHeader("Content-Type", "image/jpeg")
        .setHeader("Cache-Control", "public, max-age=3600")
        .setHeader("X-Content-Type-Options", "nosniff")
        .send(bytes);
    } catch (error) {
      sendError(res, error);
    }
  });
}
