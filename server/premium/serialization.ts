import { ASSESSMENT_LEVELS, type AssessmentLevel } from "@shared/assessment";
import type { PremiumDuration, PremiumStatus } from "@shared/premium";
import type { PremiumMembership } from "../../drizzle/premium-schema";

export function parseJson<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function encodeJson(value: unknown): string {
  return JSON.stringify(value);
}

export function parseLevels(raw: string): AssessmentLevel[] {
  const parsed = parseJson<unknown>(raw, []);
  if (!Array.isArray(parsed)) return [];
  return parsed.filter(
    (value): value is AssessmentLevel =>
      typeof value === "string" && ASSESSMENT_LEVELS.includes(value as AssessmentLevel),
  );
}

export function normalizeLevels(levels: readonly AssessmentLevel[]): AssessmentLevel[] {
  return [...new Set(levels)];
}

export function isDuration(value: number): value is PremiumDuration {
  return value === 30 || value === 365;
}

export function isStatus(value: string): value is PremiumStatus {
  return value === "active" || value === "paused" || value === "cancelled";
}

export function membershipLevels(membership: PremiumMembership): AssessmentLevel[] {
  return parseLevels(membership.levels);
}

export type PublicPremiumMembership = Omit<PremiumMembership, "levels" | "durationDays"> & { levels: AssessmentLevel[]; durationDays: PremiumDuration };
export function publicMembership(membership: PremiumMembership): PublicPremiumMembership;
export function publicMembership(membership: null): null;
export function publicMembership(membership: PremiumMembership | null): PublicPremiumMembership | null;
export function publicMembership(membership: PremiumMembership | null): PublicPremiumMembership | null {
  if (!membership) return null;
  if (!isDuration(membership.durationDays)) throw new Error("Stored membership duration is invalid");
  return {
    id: membership.id,
    userId: membership.userId,
    levels: membershipLevels(membership),
    startDate: membership.startDate,
    endDate: membership.endDate,
    status: membership.status,
    durationDays: membership.durationDays,
    paidAmountCents: membership.paidAmountCents,
    paymentReference: membership.paymentReference,
    activatedBy: membership.activatedBy,
    coachUserId: membership.coachUserId,
    createdAt: membership.createdAt,
    updatedAt: membership.updatedAt,
  };
}
