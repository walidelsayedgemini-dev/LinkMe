import { TRPCError } from "@trpc/server";
import type { Request } from "express";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

function clientKey(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  const ip = raw?.split(",")[0]?.trim() || req.socket?.remoteAddress || "unknown";
  return ip;
}

function sweep(now: number) {
  if (buckets.size < 5_000) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

/**
 * Fixed-window limiter for sensitive endpoints (auth, checkout, contact form).
 * Keyed by client IP + action so one noisy action cannot block the others.
 */
export function enforceRateLimit(req: Request, action: string, limit: number, windowMs: number): void {
  const now = Date.now();
  sweep(now);
  const key = `${action}:${clientKey(req)}`;
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }

  bucket.count += 1;
  if (bucket.count > limit) {
    const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: `محاولات كثيرة في وقت قصير. جرّب تاني بعد ${Math.max(1, Math.ceil(retryAfter / 60))} دقيقة.`,
    });
  }
}

export function resetRateLimits(): void {
  buckets.clear();
}
