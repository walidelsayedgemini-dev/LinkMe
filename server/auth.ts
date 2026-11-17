import {
  randomBytes,
  randomInt,
  scryptSync,
  timingSafeEqual,
  createHash,
} from "node:crypto";
import { parse as parseCookie } from "cookie";
import type { Request, Response } from "express";
import { and, desc, eq, gt, isNull } from "drizzle-orm";
import {
  ownerAccessCodes,
  passwordResetTokens,
  sessions,
  users,
  type User,
} from "../drizzle/schema";
import { getDb } from "./db";
import { getSessionCookieOptions } from "./_core/cookies";

export const SESSION_COOKIE = "linkme_session";
const SESSION_DAYS = 30;
const RESET_MINUTES = 45;

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${derived}`;
}

export function verifyPassword(
  password: string,
  stored: string | null
): boolean {
  if (!stored) return false;
  const [scheme, salt, hash] = stored.split(":");
  if (scheme !== "scrypt" || !salt || !hash) return false;
  const derived = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  if (expected.length !== derived.length) return false;
  return timingSafeEqual(derived, expected);
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export async function createSession(
  userId: number,
  res: Response
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة");
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await db
    .insert(sessions)
    .values({ tokenHash: sha256(token), userId, expiresAt });
  res.cookie(SESSION_COOKIE, token, {
    ...getSessionCookieOptions({} as Request),
    maxAge: SESSION_DAYS * 24 * 60 * 60 * 1000,
  });
}

function sessionTokenFrom(req: Request): string | undefined {
  const header = req.headers?.cookie;
  if (!header) return undefined;
  try {
    const value = parseCookie(header)[SESSION_COOKIE];
    return typeof value === "string" ? value : undefined;
  } catch {
    return undefined;
  }
}

export async function destroySession(
  req: Request,
  res: Response
): Promise<void> {
  const token = sessionTokenFrom(req);
  const db = await getDb();
  if (db && typeof token === "string" && token.length > 0) {
    await db.delete(sessions).where(eq(sessions.tokenHash, sha256(token)));
  }
  res.clearCookie(SESSION_COOKIE, {
    ...getSessionCookieOptions(req),
    maxAge: -1,
  });
}

export async function resolveUser(req: Request): Promise<User | null> {
  const token = sessionTokenFrom(req);
  if (typeof token !== "string" || token.length < 20) return null;
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select({ user: users })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(
      and(
        eq(sessions.tokenHash, sha256(token)),
        gt(sessions.expiresAt, new Date())
      )
    )
    .limit(1);
  return rows[0]?.user ?? null;
}

export async function issueResetToken(userId: number): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة");
  const token = randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + RESET_MINUTES * 60 * 1000);
  await db
    .insert(passwordResetTokens)
    .values({ userId, tokenHash: sha256(token), expiresAt });
  return token;
}

export async function consumeResetToken(
  token: string,
  newPassword: string
): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة");
  return db.transaction(async tx => {
    const [record] = await tx
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.tokenHash, sha256(token)),
          gt(passwordResetTokens.expiresAt, new Date()),
          isNull(passwordResetTokens.usedAt)
        )
      )
      .limit(1)
      .for("update");
    if (!record) return false;
    await tx
      .update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(eq(passwordResetTokens.id, record.id));
    await tx
      .update(users)
      .set({ passwordHash: hashPassword(newPassword) })
      .where(eq(users.id, record.userId));
    await tx.delete(sessions).where(eq(sessions.userId, record.userId));
    return true;
  });
}

/** The owner code alphabet skips look-alike characters (0/O, 1/I/L). */
const OWNER_CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const OWNER_CODE_LENGTH = 20;

export function normalizeOwnerCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/[\s-]/g, "");
}

/** Issue a fresh owner code and revoke any previous one for that account. */
export async function issueOwnerCode(userId: number): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة");
  const raw = Array.from(
    { length: OWNER_CODE_LENGTH },
    () => OWNER_CODE_ALPHABET[randomInt(OWNER_CODE_ALPHABET.length)]
  ).join("");
  await db.transaction(async tx => {
    await tx
      .update(ownerAccessCodes)
      .set({ revokedAt: new Date() })
      .where(
        and(eq(ownerAccessCodes.userId, userId), isNull(ownerAccessCodes.revokedAt))
      );
    await tx.insert(ownerAccessCodes).values({
      userId,
      codeHash: sha256(raw),
      label: "رمز المالك",
    });
  });
  return raw.replace(/(.{4})/g, "$1-").replace(/-$/, "");
}

/** Resolve the owner account for a valid code, or null when it is wrong/revoked. */
export async function resolveOwnerCode(raw: string): Promise<User | null> {
  const normalized = normalizeOwnerCode(raw);
  if (normalized.length !== OWNER_CODE_LENGTH) return null;
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select({ user: users, id: ownerAccessCodes.id })
    .from(ownerAccessCodes)
    .innerJoin(users, eq(users.id, ownerAccessCodes.userId))
    .where(
      and(
        eq(ownerAccessCodes.codeHash, sha256(normalized)),
        isNull(ownerAccessCodes.revokedAt),
        eq(users.role, "admin")
      )
    )
    .limit(1);
  const match = rows[0];
  if (!match) return null;
  await db
    .update(ownerAccessCodes)
    .set({ lastUsedAt: new Date() })
    .where(eq(ownerAccessCodes.id, match.id));
  return match.user;
}

export async function ownerCodeStatus(userId: number) {
  const db = await getDb();
  if (!db) return { active: false, createdAt: null as Date | null, lastUsedAt: null as Date | null };
  const [row] = await db
    .select({
      createdAt: ownerAccessCodes.createdAt,
      lastUsedAt: ownerAccessCodes.lastUsedAt,
    })
    .from(ownerAccessCodes)
    .where(
      and(eq(ownerAccessCodes.userId, userId), isNull(ownerAccessCodes.revokedAt))
    )
    .orderBy(desc(ownerAccessCodes.createdAt))
    .limit(1);
  return row
    ? { active: true, createdAt: row.createdAt, lastUsedAt: row.lastUsedAt }
    : { active: false, createdAt: null, lastUsedAt: null };
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
