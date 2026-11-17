import { TRPCError } from "@trpc/server";
import { desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import {
  categories,
  courses,
  instructors,
  placementAttempts,
  users,
} from "../../drizzle/schema";
import { getDb } from "../db";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { enforceRateLimit } from "../rate-limit";
import { ratingOf } from "./_shared";
import {
  grade,
  LEVEL_COURSE_FOCUS,
  levelIndex,
  publicQuestions,
  type Level,
} from "../content/placement";

type CourseLevel = "beginner" | "intermediate" | "advanced" | "all";

const COURSE_LEVELS: Record<Level, CourseLevel[]> = {
  A1: ["beginner", "all"],
  A2: ["beginner", "all"],
  B1: ["intermediate", "beginner", "all"],
  B2: ["intermediate", "advanced", "all"],
  C1: ["advanced", "intermediate", "all"],
};

const ORDER: Level[] = ["A1", "A2", "B1", "B2", "C1"];

function levelDistance(courseLevel: string, level: Level): number {
  const target = levelIndex(level);
  const map: Record<string, number> = {
    beginner: 0,
    all: 1,
    intermediate: 2,
    advanced: 4,
  };
  const value = map[courseLevel] ?? 2;
  return Math.abs(value - target);
}

export async function recommendationsFor(level: Level) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({
      id: courses.id,
      slug: courses.slug,
      title: courses.title,
      titleAr: courses.titleAr,
      subtitle: courses.subtitle,
      level: courses.level,
      priceCents: courses.priceCents,
      currency: courses.currency,
      durationHours: courses.durationHours,
      studentsCount: courses.studentsCount,
      ratingSum: courses.ratingSum,
      ratingCount: courses.ratingCount,
      coverImage: courses.coverImage,
      accent: courses.accent,
      categorySlug: categories.slug,
      categoryNameAr: categories.nameAr,
      instructorName: users.name,
      instructorAvatar: users.avatarUrl,
    })
    .from(courses)
    .leftJoin(categories, eq(categories.id, courses.categoryId))
    .leftJoin(instructors, eq(instructors.id, courses.instructorId))
    .leftJoin(users, eq(users.id, instructors.userId))
    .where(inArray(courses.level, COURSE_LEVELS[level]))
    .orderBy(desc(courses.featured), desc(courses.studentsCount));

  const focus = LEVEL_COURSE_FOCUS[level];
  const scored = rows
    .map(row => {
      const focusBonus =
        focus.indexOf(row.categorySlug ?? "") >= 0
          ? 10 - focus.indexOf(row.categorySlug ?? "")
          : 0;
      const freeBonus = row.priceCents === 0 ? 3 : 0;
      return {
        row,
        score:
          focusBonus +
          freeBonus -
          levelDistance(row.level, level) * 2 +
          ratingOf(row.ratingSum, row.ratingCount),
      };
    })
    .sort((a, b) => b.score - a.score);

  const picked = scored.slice(0, 3).map(item => ({
    ...item.row,
    rating: ratingOf(item.row.ratingSum, item.row.ratingCount),
    free: item.row.priceCents === 0,
  }));

  if (picked.length > 0) return picked;

  const fallback = await db
    .select({
      id: courses.id,
      slug: courses.slug,
      title: courses.title,
      titleAr: courses.titleAr,
      subtitle: courses.subtitle,
      level: courses.level,
      priceCents: courses.priceCents,
      currency: courses.currency,
      durationHours: courses.durationHours,
      studentsCount: courses.studentsCount,
      ratingSum: courses.ratingSum,
      ratingCount: courses.ratingCount,
      coverImage: courses.coverImage,
      accent: courses.accent,
      categorySlug: categories.slug,
      categoryNameAr: categories.nameAr,
      instructorName: users.name,
      instructorAvatar: users.avatarUrl,
    })
    .from(courses)
    .leftJoin(categories, eq(categories.id, courses.categoryId))
    .leftJoin(instructors, eq(instructors.id, courses.instructorId))
    .leftJoin(users, eq(users.id, instructors.userId))
    .orderBy(desc(courses.studentsCount))
    .limit(3);

  return fallback.map(row => ({
    ...row,
    rating: ratingOf(row.ratingSum, row.ratingCount),
    free: row.priceCents === 0,
  }));
}

export const placementRouter = router({
  // The old 12-question endpoint cannot overwrite a staged assessment result.
  questions: publicProcedure.query(() => {
    throw new TRPCError({ code: "NOT_FOUND", message: "الاختبار القديم اتوقف. افتح اختبار المراحل من صفحة تحديد المستوى." });
  }),
  submit: publicProcedure.input(z.object({ answers: z.record(z.string(), z.number().int()) })).mutation(() => {
    throw new TRPCError({ code: "NOT_FOUND", message: "النتيجة بتتحفظ من اختبار المراحل بس." });
  }),

  myLatest: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;
    const [latest] = await db
      .select()
      .from(placementAttempts)
      .where(eq(placementAttempts.userId, ctx.user.id))
      .orderBy(desc(placementAttempts.createdAt))
      .limit(1);
    if (!latest) return null;
    let belowA1 = false;
    try {
      belowA1 =
        JSON.parse(latest.skills ?? "{}")?._assessment?.belowA1 === true;
    } catch {
      // Historical results may not contain structured metadata.
    }
    return {
      ...latest,
      belowA1,
      levelLabel: belowA1 ? "أقل من A1" : latest.level,
      order: belowA1 ? -1 : [...ORDER, "C2"].indexOf(latest.level),
    };
  }),

  clearMine: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { ok: false };
    await db
      .delete(placementAttempts)
      .where(eq(placementAttempts.userId, ctx.user.id));
    return { ok: true };
  }),
});
