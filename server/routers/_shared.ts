import type { User } from "../../drizzle/schema";

export type PublicUser = Omit<User, "passwordHash">;

export function publicUser(user: User): PublicUser {
  const { passwordHash: _passwordHash, ...rest } = user;
  return rest;
}

export const LEVEL_LABELS: Record<string, string> = {
  beginner: "مبتدئ",
  intermediate: "متوسط",
  advanced: "متقدم",
  all: "كل المستويات",
};

export function parseList(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return value
      .split("\n")
      .map(line => line.trim())
      .filter(Boolean);
  }
}

export function ratingOf(ratingSum: number, ratingCount: number): number {
  if (!ratingCount) return 0;
  return Math.round((ratingSum / ratingCount) * 10) / 10;
}
