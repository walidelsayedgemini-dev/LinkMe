import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import type { AssessmentLevel } from "@shared/assessment";
import type { PremiumMembership } from "../../drizzle/premium-schema";
import { premiumMemberships } from "../../drizzle/premium-schema";
import type { PremiumContext } from "./types";
import { currentDayNumber } from "./dates";
import { membershipLevels, parseJson, publicMembership } from "./serialization";

export function premiumError(
  code:
    | "BAD_REQUEST"
    | "CONFLICT"
    | "FORBIDDEN"
    | "INTERNAL_SERVER_ERROR"
    | "NOT_FOUND"
    | "UNAUTHORIZED",
  message: string,
): never {
  throw new TRPCError({ code, message });
}

export async function requirePremiumDb() {
  const { getDb } = await import("../db");
  const db = await getDb();
  if (!db) premiumError("INTERNAL_SERVER_ERROR", "قاعدة البيانات غير متاحة دلوقتي.");
  return db;
}

export function nowFor(ctx: PremiumContext): Date {
  return ctx.premiumNow ? new Date(ctx.premiumNow.getTime()) : new Date();
}

export function isActiveMembership(
  membership: PremiumMembership,
  now: Date,
): boolean {
  const dayNumber = currentDayNumber(membership.startDate, membership.durationDays, now);
  return (
    membership.status === "active" &&
    now.getTime() >= membership.startDate.getTime() &&
    now.getTime() < membership.endDate.getTime() &&
    dayNumber >= 1 &&
    dayNumber <= membership.durationDays
  );
}

export function totalDaysFor(membership: PremiumMembership): number {
  return membership.durationDays;
}

export function dayNumberFor(membership: PremiumMembership, now: Date): number {
  return Math.min(membership.durationDays, currentDayNumber(membership.startDate, membership.durationDays, now));
}

/** Levels advance in contiguous blocks; a mixed membership never jumps backwards. */
export function levelForDay(
  levels: readonly AssessmentLevel[],
  dayIndex: number,
  totalDays: number,
): AssessmentLevel | null {
  if (!levels.length || dayIndex < 1 || totalDays < 1) return null;
  const block = Math.min(levels.length - 1, Math.floor(((dayIndex - 1) * levels.length) / totalDays));
  return levels[block] ?? null;
}

export function unlockedLevels(membership: PremiumMembership, now: Date): AssessmentLevel[] {
  const levels = membershipLevels(membership);
  const day = dayNumberFor(membership, now);
  if (day < 1) return [];
  const current = levelForDay(levels, day, membership.durationDays);
  return current ? levels.slice(0, levels.indexOf(current) + 1) : [];
}

export function membershipPublic(membership: PremiumMembership | null) {
  return publicMembership(membership);
}

export async function membershipsForUser(db: any, userId: number): Promise<PremiumMembership[]> {
  const rows = await db
    .select()
    .from(premiumMemberships)
    .where(eq(premiumMemberships.userId, userId));
  return [...rows]
    .filter(row => row.userId === userId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function latestMembershipForUser(db: any, userId: number): Promise<PremiumMembership | null> {
  const rows = await membershipsForUser(db, userId);
  return rows[0] ?? null;
}

export async function activeMembershipForUser(
  db: any,
  userId: number,
  now: Date,
): Promise<PremiumMembership | null> {
  const rows = await membershipsForUser(db, userId);
  return (
    rows.find(row => isActiveMembership(row, now)) ?? null
  );
}

export async function membershipForStudentView(
  db: any,
  userId: number,
  now: Date,
): Promise<PremiumMembership | null> {
  const rows = await membershipsForUser(db, userId);
  return (
    rows.find(row => isActiveMembership(row, now)) ??
    rows.find(row => row.status === "paused") ??
    rows[0] ??
    null
  );
}

export function assertActiveForQuiz(
  membership: PremiumMembership,
  now: Date,
): void {
  if (!isActiveMembership(membership, now))
    premiumError("FORBIDDEN", "العضوية مش مفعّلة حاليًا للوصول للاختبار اليومي.");
}

export function assertDayAllowed(
  membership: PremiumMembership,
  dayIndex: number,
  now: Date,
): void {
  const currentDay = dayNumberFor(membership, now);
  if (!Number.isInteger(dayIndex) || dayIndex < 1 || dayIndex > membership.durationDays)
    premiumError("BAD_REQUEST", "رقم اليوم لازم يكون داخل مدة البرنامج.");
  if (dayIndex > currentDay)
    premiumError("FORBIDDEN", "اليوم ده لسه ماجاش بتوقيت القاهرة.");
}

export function parseAttemptAnswers(raw: string | null): Record<string, number> {
  return parseJson<Record<string, number>>(raw, {});
}

export function parseAttemptFeedback(raw: string | null): any[] {
  return parseJson<any[]>(raw, []);
}

export function assertStudentRole(user: { role: string } | null | undefined): void {
  if (!user) premiumError("NOT_FOUND", "حساب الطالب غير موجود.");
  if (user.role !== "user")
    premiumError("BAD_REQUEST", "تفعيل Premium متاح لحساب طالب عادي فقط.");
}

export function canViewStudent(
  ctx: PremiumContext,
  membership: PremiumMembership,
  requestedUserId: number,
): boolean {
  return (
    ctx.user?.role === "admin" ||
    (ctx.user?.role === "instructor" &&
      membership.userId === requestedUserId &&
      membership.coachUserId === ctx.user.id)
  );
}
