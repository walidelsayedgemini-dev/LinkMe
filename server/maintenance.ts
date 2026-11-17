import { lt } from "drizzle-orm";
import { passwordResetTokens, sessions } from "../drizzle/schema";
import { getDb } from "./db";

const INTERVAL_MS = 6 * 60 * 60 * 1000;

async function cleanupOnce(): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const now = new Date();
  try {
    const [expiredSessions] = await db.delete(sessions).where(lt(sessions.expiresAt, now));
    const [expiredTokens] = await db.delete(passwordResetTokens).where(lt(passwordResetTokens.expiresAt, now));
    const removed = Number(expiredSessions?.affectedRows ?? 0) + Number(expiredTokens?.affectedRows ?? 0);
    if (removed > 0) console.log(`[maintenance] removed ${removed} expired auth record(s)`);
  } catch (error) {
    console.error("[maintenance] cleanup failed:", (error as Error).message);
  }
}

/** Periodically drops expired sessions and password-reset tokens. */
export function startMaintenance(): void {
  void cleanupOnce();
  const timer = setInterval(() => void cleanupOnce(), INTERVAL_MS);
  timer.unref?.();
}
