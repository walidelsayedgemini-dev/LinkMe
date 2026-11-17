import { TRPCError } from "@trpc/server";
import { and, asc, count, desc, eq, gt, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { publicCurriculumLesson } from "../course-visibility";
import {
  categories,
  courses,
  enrollments,
  instructors,
  lessonProgress,
  lessons,
  modules,
  reviews,
  subscriptions,
  users,
  wishlist,
} from "../../drizzle/schema";
import { getDb } from "../db";
import { protectedProcedure, router } from "../_core/trpc";
import { ratingOf } from "./_shared";

async function hasActiveSubscription(userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const rows = await db
    .select({ id: subscriptions.id })
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.status, "active"),
        gt(subscriptions.currentPeriodEnd, new Date())
      )
    )
    .limit(1);
  return rows.length > 0;
}

async function enrollmentFor(userId: number, courseId: number) {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db
    .select()
    .from(enrollments)
    .where(
      and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId))
    )
    .limit(1);
  if (row?.source === "subscription" && !(await hasActiveSubscription(userId))) return null;
  return row ?? null;
}

export const learningRouter = router({
  dashboard: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db)
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "قاعدة البيانات غير متاحة",
      });
    const userId = ctx.user.id;

    const enrolledRows = await db
      .select({
        enrollmentId: enrollments.id,
        enrolledAt: enrollments.enrolledAt,
        lastLessonId: enrollments.lastLessonId,
        completedAt: enrollments.completedAt,
        source: enrollments.source,
        courseId: courses.id,
        slug: courses.slug,
        title: courses.title,
        titleAr: courses.titleAr,
        subtitle: courses.subtitle,
        level: courses.level,
        durationHours: courses.durationHours,
        coverImage: courses.coverImage,
        accent: courses.accent,
        categoryNameAr: categories.nameAr,
        instructorName: users.name,
        instructorSlug: instructors.slug,
        instructorAvatar: users.avatarUrl,
      })
      .from(enrollments)
      .innerJoin(courses, eq(courses.id, enrollments.courseId))
      .innerJoin(categories, eq(categories.id, courses.categoryId))
      .innerJoin(instructors, eq(instructors.id, courses.instructorId))
      .innerJoin(users, eq(users.id, instructors.userId))
      .where(eq(enrollments.userId, userId))
      .orderBy(desc(enrollments.enrolledAt));

    const subscriptionActive = await hasActiveSubscription(userId);
    const enrolled = subscriptionActive ? enrolledRows : enrolledRows.filter(item => item.source !== "subscription");
    const courseIds = enrolled.map(item => item.courseId);
    const lessonCounts = courseIds.length
      ? await db
          .select({ courseId: lessons.courseId, value: count() })
          .from(lessons)
          .where(inArray(lessons.courseId, courseIds))
          .groupBy(lessons.courseId)
      : [];
    const completedCounts = courseIds.length
      ? await db
          .select({ courseId: lessonProgress.courseId, value: count() })
          .from(lessonProgress)
          .where(
            and(
              eq(lessonProgress.userId, userId),
              inArray(lessonProgress.courseId, courseIds)
            )
          )
          .groupBy(lessonProgress.courseId)
      : [];

    const items = enrolled.map(item => {
      const total = Number(
        lessonCounts.find(row => row.courseId === item.courseId)?.value ?? 0
      );
      const done = Number(
        completedCounts.find(row => row.courseId === item.courseId)?.value ?? 0
      );
      return {
        ...item,
        totalLessons: total,
        completedLessons: done,
        progress: total ? Math.round((done / total) * 100) : 0,
      };
    });

    const [lessonStats] = await db
      .select({
        completedLessons: count(),
        minutes: sql<number>`coalesce(sum(${lessons.durationMinutes}), 0)`,
      })
      .from(lessonProgress)
      .innerJoin(lessons, eq(lessons.id, lessonProgress.lessonId))
      .where(eq(lessonProgress.userId, userId));

    const activeCourseIds = courseIds;
    const available = await db
      .select({
        id: courses.id,
        slug: courses.slug,
        title: courses.title,
        titleAr: courses.titleAr,
        subtitle: courses.subtitle,
        level: courses.level,
        priceCents: courses.priceCents,
        durationHours: courses.durationHours,
        studentsCount: courses.studentsCount,
        ratingSum: courses.ratingSum,
        ratingCount: courses.ratingCount,
        coverImage: courses.coverImage,
        accent: courses.accent,
        categoryNameAr: categories.nameAr,
        instructorName: users.name,
        instructorSlug: instructors.slug,
      })
      .from(courses)
      .innerJoin(categories, eq(categories.id, courses.categoryId))
      .innerJoin(instructors, eq(instructors.id, courses.instructorId))
      .innerJoin(users, eq(users.id, instructors.userId))
      .where(eq(courses.isPublished, true))
      .orderBy(desc(courses.studentsCount))
      .limit(12);

    const recommendations = available
      .filter(item => !activeCourseIds.includes(item.id))
      .slice(0, 3)
      .map(item => ({
        ...item,
        rating: ratingOf(item.ratingSum, item.ratingCount),
      }));

    const [subscription] = await db
      .select({
        id: subscriptions.id,
        status: subscriptions.status,
        currentPeriodEnd: subscriptions.currentPeriodEnd,
      })
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.status, "active")
        )
      )
      .orderBy(desc(subscriptions.createdAt))
      .limit(1);

    const recentReviews = await db
      .select({
        id: reviews.id,
        rating: reviews.rating,
        comment: reviews.comment,
        createdAt: reviews.createdAt,
      })
      .from(reviews)
      .where(eq(reviews.userId, userId))
      .orderBy(desc(reviews.createdAt))
      .limit(5);

    return {
      items,
      recommendations,
      subscription: subscription ?? null,
      stats: {
        courses: items.length,
        completedCourses: items.filter(item => item.progress === 100).length,
        completedLessons: Number(lessonStats?.completedLessons ?? 0),
        minutes: Number(lessonStats?.minutes ?? 0),
      },
      recentReviews,
    };
  }),

  access: protectedProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "قاعدة البيانات غير متاحة",
        });
      const [course] = await db
        .select()
        .from(courses)
        .where(eq(courses.slug, input.slug))
        .limit(1);
      if (!course) return null;

      const [enrollment, subscribed] = await Promise.all([
        enrollmentFor(ctx.user.id, course.id),
        hasActiveSubscription(ctx.user.id),
      ]);
      const access = Boolean(enrollment) || subscribed;

      const moduleRows = await db
        .select()
        .from(modules)
        .where(eq(modules.courseId, course.id))
        .orderBy(asc(modules.position));
      const lessonRows = await db
        .select()
        .from(lessons)
        .where(eq(lessons.courseId, course.id))
        .orderBy(asc(lessons.position));
      const progressRows = await db
        .select({ lessonId: lessonProgress.lessonId })
        .from(lessonProgress)
        .where(
          and(
            eq(lessonProgress.userId, ctx.user.id),
            eq(lessonProgress.courseId, course.id)
          )
        );

      return {
        course: {
          id: course.id,
          slug: course.slug,
          title: course.title,
          titleAr: course.titleAr,
          subtitle: course.subtitle,
          level: course.level,
          priceCents: course.priceCents,
          coverImage: course.coverImage,
          accent: course.accent,
        },
        access,
        subscribed,
        enrollment: enrollment ?? null,
        modules: moduleRows.map(module => ({
          ...module,
          lessons: lessonRows.filter(lesson => lesson.moduleId === module.id).map(publicCurriculumLesson),
        })),
        completedLessonIds: progressRows.map(row => row.lessonId),
        lastLessonId: enrollment?.lastLessonId ?? null,
      };
    }),

  lesson: protectedProcedure
    .input(z.object({ lessonId: z.number().int() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "قاعدة البيانات غير متاحة",
        });
      const [lesson] = await db
        .select()
        .from(lessons)
        .where(eq(lessons.id, input.lessonId))
        .limit(1);
      if (!lesson) return null;
      const [course] = await db
        .select()
        .from(courses)
        .where(eq(courses.id, lesson.courseId))
        .limit(1);
      if (!course) return null;
      const [enrollment, subscribed] = await Promise.all([
        enrollmentFor(ctx.user.id, course.id),
        hasActiveSubscription(ctx.user.id),
      ]);
      const unlocked =
        Boolean(enrollment) ||
        subscribed;
      if (!unlocked)
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "الدرس متاح بعد تأكيد الحجز وتفعيل الكورس.",
        });
      const [progress] = await db
        .select({ id: lessonProgress.id })
        .from(lessonProgress)
        .where(
          and(
            eq(lessonProgress.userId, ctx.user.id),
            eq(lessonProgress.lessonId, lesson.id)
          )
        )
        .limit(1);

      if (!enrollment && subscribed) {
        await db.insert(enrollments).values({ userId: ctx.user.id, courseId: course.id, source: "subscription", lastLessonId: lesson.id }).onDuplicateKeyUpdate({ set: { lastLessonId: lesson.id } });
      }
      if (enrollment) {
        await db
          .update(enrollments)
          .set({ lastLessonId: lesson.id })
          .where(eq(enrollments.id, enrollment.id));
      }

      return { lesson, course, unlocked, completed: Boolean(progress) };
    }),

  toggleLesson: protectedProcedure
    .input(z.object({ lessonId: z.number().int(), completed: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "قاعدة البيانات غير متاحة",
        });
      const [lesson] = await db
        .select()
        .from(lessons)
        .where(eq(lessons.id, input.lessonId))
        .limit(1);
      if (!lesson)
        throw new TRPCError({ code: "NOT_FOUND", message: "الدرس غير موجود" });
      const [course] = await db
        .select()
        .from(courses)
        .where(eq(courses.id, lesson.courseId))
        .limit(1);
      if (!course)
        throw new TRPCError({ code: "NOT_FOUND", message: "الكورس غير موجود" });
      const [enrollmentRow, subscribedRow] = await Promise.all([
        enrollmentFor(ctx.user.id, course.id),
        hasActiveSubscription(ctx.user.id),
      ]);
      const canLearn =
        Boolean(enrollmentRow) ||
        subscribedRow;
      if (!canLearn) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "التحق بالكورس أولًا لتسجيل تقدمك في دروسه",
        });
      }
      if (input.completed && !lesson.content?.trim() && !lesson.videoUrl?.trim()) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "الدرس لسه محتاج محتواه أو تسجيله من المدرّس. مينفعش نعتبره خلص من غير شرح." });
      if (input.completed) {
        await db
          .insert(lessonProgress)
          .values({
            userId: ctx.user.id,
            courseId: lesson.courseId,
            lessonId: lesson.id,
          })
          .onDuplicateKeyUpdate({ set: { completedAt: new Date() } });
      } else {
        await db
          .delete(lessonProgress)
          .where(
            and(
              eq(lessonProgress.userId, ctx.user.id),
              eq(lessonProgress.lessonId, lesson.id)
            )
          );
      }

      const [totalRow] = await db
        .select({ value: count() })
        .from(lessons)
        .where(eq(lessons.courseId, lesson.courseId));
      const [doneRow] = await db
        .select({ value: count() })
        .from(lessonProgress)
        .where(
          and(
            eq(lessonProgress.userId, ctx.user.id),
            eq(lessonProgress.courseId, lesson.courseId)
          )
        );
      const total = Number(totalRow?.value ?? 0);
      const done = Number(doneRow?.value ?? 0);
      const enrollment = await enrollmentFor(ctx.user.id, lesson.courseId);
      if (enrollment) {
        await db
          .update(enrollments)
          .set({ completedAt: total > 0 && done >= total ? new Date() : null })
          .where(eq(enrollments.id, enrollment.id));
      }
      return {
        total,
        done,
        progress: total ? Math.round((done / total) * 100) : 0,
      };
    }),

  enrollFree: protectedProcedure
    .input(z.object({ courseId: z.number().int() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "قاعدة البيانات غير متاحة",
        });
      const [course] = await db
        .select()
        .from(courses)
        .where(eq(courses.id, input.courseId))
        .limit(1);
      if (!course)
        throw new TRPCError({ code: "NOT_FOUND", message: "الكورس غير موجود" });
      if (course.priceCents > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "هذا الكورس مدفوع، أكمل الدفع للالتحاق به",
        });
      }
      await db
        .insert(enrollments)
        .values({ userId: ctx.user.id, courseId: course.id, source: "free" })
        .onDuplicateKeyUpdate({ set: { courseId: course.id } });
      return { ok: true, slug: course.slug };
    }),

  submitReview: protectedProcedure
    .input(
      z.object({
        courseId: z.number().int(),
        rating: z.number().int().min(1).max(5),
        comment: z.string().trim().max(1000).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "قاعدة البيانات غير متاحة",
        });
      const enrollment = await enrollmentFor(ctx.user.id, input.courseId);
      if (!enrollment) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "يمكنك تقييم الكورسات بعد الالتحاق بها",
        });
      }
      const [existing] = await db
        .select()
        .from(reviews)
        .where(
          and(
            eq(reviews.userId, ctx.user.id),
            eq(reviews.courseId, input.courseId)
          )
        )
        .limit(1);

      if (existing) {
        await db
          .update(reviews)
          .set({ rating: input.rating, comment: input.comment ?? null })
          .where(eq(reviews.id, existing.id));
        await db
          .update(courses)
          .set({
            ratingSum: sql`${courses.ratingSum} - ${existing.rating} + ${input.rating}`,
          })
          .where(eq(courses.id, input.courseId));
      } else {
        await db
          .insert(reviews)
          .values({
            userId: ctx.user.id,
            courseId: input.courseId,
            rating: input.rating,
            comment: input.comment ?? null,
          });
        await db
          .update(courses)
          .set({
            ratingSum: sql`${courses.ratingSum} + ${input.rating}`,
            ratingCount: sql`${courses.ratingCount} + 1`,
          })
          .where(eq(courses.id, input.courseId));
      }
      return { ok: true };
    }),

  myReview: protectedProcedure
    .input(z.object({ courseId: z.number().int() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return null;
      const [row] = await db
        .select()
        .from(reviews)
        .where(
          and(
            eq(reviews.userId, ctx.user.id),
            eq(reviews.courseId, input.courseId)
          )
        )
        .limit(1);
      return row ?? null;
    }),

  wishlist: protectedProcedure.query(async ({ ctx }) => {
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
        durationHours: courses.durationHours,
        ratingSum: courses.ratingSum,
        ratingCount: courses.ratingCount,
        coverImage: courses.coverImage,
        accent: courses.accent,
        categoryNameAr: categories.nameAr,
        instructorName: users.name,
      })
      .from(wishlist)
      .innerJoin(courses, eq(courses.id, wishlist.courseId))
      .innerJoin(categories, eq(categories.id, courses.categoryId))
      .innerJoin(instructors, eq(instructors.id, courses.instructorId))
      .innerJoin(users, eq(users.id, instructors.userId))
      .where(eq(wishlist.userId, ctx.user.id))
      .orderBy(desc(wishlist.createdAt));
    return rows.map(row => ({
      ...row,
      rating: ratingOf(row.ratingSum, row.ratingCount),
    }));
  }),

  toggleWishlist: protectedProcedure
    .input(z.object({ courseId: z.number().int() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "قاعدة البيانات غير متاحة",
        });
      const [existing] = await db
        .select({ id: wishlist.id })
        .from(wishlist)
        .where(
          and(
            eq(wishlist.userId, ctx.user.id),
            eq(wishlist.courseId, input.courseId)
          )
        )
        .limit(1);
      if (existing) {
        await db.delete(wishlist).where(eq(wishlist.id, existing.id));
        return { saved: false };
      }
      await db
        .insert(wishlist)
        .values({ userId: ctx.user.id, courseId: input.courseId });
      return { saved: true };
    }),
});
