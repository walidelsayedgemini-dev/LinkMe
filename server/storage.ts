// Unified storage helpers for Link Me:
// 1. Vercel Blob (when BLOB_READ_WRITE_TOKEN is configured — production cloud storage)
// 2. Forge S3 presigned URLs (when MANUS_API_URL & MANUS_API_KEY are configured)
// 3. Local ./uploads directory (local development fallback)

import fs from "node:fs/promises";
import path from "node:path";
import { put as vercelBlobPut } from "@vercel/blob";
import { ENV } from "./_core/env";

function isVercelBlobAvailable(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function isForgeAvailable(): boolean {
  return Boolean(ENV.forgeApiUrl && ENV.forgeApiKey);
}

function getForgeConfig() {
  const forgeUrl = ENV.forgeApiUrl;
  const forgeKey = ENV.forgeApiKey;

  if (!forgeUrl || !forgeKey) {
    throw new Error(
      "Storage config missing: set BLOB_READ_WRITE_TOKEN or MANUS_API_URL/MANUS_API_KEY",
    );
  }

  return { forgeUrl: forgeUrl.replace(/\/+$/, ""), forgeKey };
}

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

function appendHashSuffix(relKey: string): string {
  const hash = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const lastDot = relKey.lastIndexOf(".");
  if (lastDot === -1) return `${relKey}_${hash}`;
  return `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}

export function isCloudStorageConfigured(): boolean {
  return isVercelBlobAvailable() || isForgeAvailable();
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream",
): Promise<{ key: string; url: string }> {
  const key = appendHashSuffix(normalizeKey(relKey));

  // 1. Prefer Vercel Blob in cloud/production deployments
  if (isVercelBlobAvailable()) {
    const buffer =
      typeof data === "string" ? Buffer.from(data) : Buffer.from(data);
    const blob = await vercelBlobPut(key, buffer, {
      access: "public",
      contentType,
      addRandomSuffix: false,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    return { key: blob.url, url: blob.url };
  }

  // 2. Local filesystem fallback for development
  if (!isForgeAvailable()) {
    const localDir = path.resolve(process.cwd(), "uploads");
    const filePath = path.join(localDir, key);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    const buffer =
      typeof data === "string" ? Buffer.from(data) : Buffer.from(data);
    await fs.writeFile(filePath, buffer);
    return { key, url: `/uploads/${key}` };
  }

  // 3. Forge S3 presigned upload
  const { forgeUrl, forgeKey } = getForgeConfig();

  const presignUrl = new URL("v1/storage/presign/put", forgeUrl + "/");
  presignUrl.searchParams.set("path", key);

  const presignResp = await fetch(presignUrl, {
    headers: { Authorization: `Bearer ${forgeKey}` },
  });

  if (!presignResp.ok) {
    const msg = await presignResp.text().catch(() => presignResp.statusText);
    throw new Error(`Storage presign failed (${presignResp.status}): ${msg}`);
  }

  const { url: s3Url } = (await presignResp.json()) as { url: string };
  if (!s3Url) throw new Error("Forge returned empty presign URL");

  const blob =
    typeof data === "string"
      ? new Blob([data], { type: contentType })
      : new Blob([data as any], { type: contentType });

  const uploadResp = await fetch(s3Url, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: blob,
  });

  if (!uploadResp.ok) {
    throw new Error(`Storage upload to S3 failed (${uploadResp.status})`);
  }

  return { key, url: `/manus-storage/${key}` };
}

export async function storageGet(
  relKey: string,
): Promise<{ key: string; url: string }> {
  if (/^https?:\/\//i.test(relKey)) {
    return { key: relKey, url: relKey };
  }
  const key = normalizeKey(relKey);
  if (!isForgeAvailable()) {
    return { key, url: `/uploads/${key}` };
  }
  return { key, url: `/manus-storage/${key}` };
}

export async function storageGetSignedUrl(relKey: string): Promise<string> {
  if (/^https?:\/\//i.test(relKey)) {
    return relKey;
  }
  const key = normalizeKey(relKey);
  if (!isForgeAvailable()) {
    return `/uploads/${key}`;
  }
  const { forgeUrl, forgeKey } = getForgeConfig();

  const getUrl = new URL("v1/storage/presign/get", forgeUrl + "/");
  getUrl.searchParams.set("path", key);

  const resp = await fetch(getUrl, {
    headers: { Authorization: `Bearer ${forgeKey}` },
  });

  if (!resp.ok) {
    const msg = await resp.text().catch(() => resp.statusText);
    throw new Error(`Storage signed URL failed (${resp.status}): ${msg}`);
  }

  const { url } = (await resp.json()) as { url: string };
  if (!url) throw new Error("Storage did not return a download URL");
  return url;
}
