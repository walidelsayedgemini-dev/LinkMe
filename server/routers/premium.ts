import { and, eq } from "drizzle-orm";
import { z } from "zod";
import {
  ASSESSMENT_LEVELS,
  LEVEL_NAMES,
  PASS_PERCENT,
  type AssessmentLevel,
} from "@shared/assessment";
import {
  DAILY_QUIZ_SIZE,
  PREMIUM_DURATIONS,
  PREMIUM_LEVELS,
  PREMIUM_PRICE_CENTS,
} from "@shared/premium";
import { orders, users } from "../../drizzle/schema";
import { verifyPassword } from "../auth";
import {
  premiumCoachNotes,
  premiumDailyAttempts,
  premiumLessonProgress,
  premiumMemberships,
} from "../../drizzle/premium-schema";
import {
  adminProcedure,
  protectedProcedure,
  publicProcedure,
  router,
} from "../_core/trpc";
import {
  premiumLessonById,
  summariesForLevels,
} from "../content/premium-curriculum";
import { ASSESSMENT_BANK, publicQuestion } from "../content/assessment/engine";
import {
  activeMembershipForUser,
  unlockedLevels,
  assertActiveForQuiz,
  assertDayAllowed,
  assertStudentRole,
  canViewStudent,
  dayNumberFor,
  isActiveMembership,
  levelForDay,
  membershipForStudentView,
  nowFor,
  premiumError,
  requirePremiumDb,
} from "../premium/access";
import { cairoDateForDay, endDateForDuration } from "../premium/dates";
import { gradeQuestions } from "../premium/grading";
import { dailyQuestionsFor, assertExactAnswers } from "../premium/questions";
import { parseAttemptAnswers } from "../premium/access";
import {
  encodeJson,
  membershipLevels,
  parseJson,
  publicMembership,
} from "../premium/serialization";
import { snapshotForMembership } from "../premium/snapshot";
import type { PremiumContext } from "../premium/types";
import { dailyView } from "../premium/views";

const levelSchema = z.enum(ASSESSMENT_LEVELS);
const durationSchema = z.union([z.literal(30), z.literal(365)]);
const answersSchema = z.record(
  z.string().trim().min(1).max(160),
  z.number().int().min(0).max(3)
);
const userIdSchema = z.number().int().positive();
const membershipIdSchema = z.number().int().positive();
const DEMO_INSTRUCTOR_PASSWORD = "linkme123";

const activationInput = z.object({
  userId: userIdSchema,
  levels: z.array(levelSchema).min(1).max(PREMIUM_LEVELS.length),
  durationDays: durationSchema,
  paymentConfirmed: z.literal(true),
  paymentReference: z.string().trim().min(1).max(100),
  coachUserId: userIdSchema.nullable().optional(),
});

function assertUniqueLevels(
  levels: readonly AssessmentLevel[]
): AssessmentLevel[] {
  const unique = [...new Set(levels)];
  if (unique.length !== levels.length)
    premiumError("BAD_REQUEST", "كل مستوى يتحدد مرة واحدة بس.");
  return unique;
}

function insertedId(result: unknown): number {
  const header = Array.isArray(result) ? result[0] : result;
  const id = Number(
    (header as { insertId?: number | string } | undefined)?.insertId
  );
  if (!Number.isSafeInteger(id) || id < 1)
    premiumError(
      "INTERNAL_SERVER_ERROR",
      "معرف السجل ما رجعش من قاعدة البيانات."
    );
  return id;
}

function dbRows<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

async function oneById(db: any, table: any, column: any, id: number) {
  const rows = await db.select().from(table).where(eq(column, id)).limit(1);
  return rows[0] ?? null;
}

async function lockOneById(tx: any, table: any, column: any, id: number) {
  const query = tx.select().from(table).where(eq(column, id)).limit(1);
  return typeof query.for === "function" ? query.for("update") : query;
}

async function findAttempt(db: any, membershipId: number, dayIndex: number) {
  const rows = await db
    .select()
    .from(premiumDailyAttempts)
    .where(
      and(
        eq(premiumDailyAttempts.membershipId, membershipId),
        eq(premiumDailyAttempts.dayIndex, dayIndex)
      )
    )
    .limit(1);
  return rows[0] ?? null;
}

async function findAttemptLocked(
  tx: any,
  membershipId: number,
  dayIndex: number
) {
  const query = tx
    .select()
    .from(premiumDailyAttempts)
    .where(
      and(
        eq(premiumDailyAttempts.membershipId, membershipId),
        eq(premiumDailyAttempts.dayIndex, dayIndex)
      )
    )
    .limit(1);
  return typeof query.for === "function" ? query.for("update") : query;
}

function bankQuestionsForIds(ids: readonly string[]) {
  const byId = new Map(
    ASSESSMENT_BANK.map(question => [question.id, question])
  );
  const questions = ids.map(id => byId.get(id));
  if (questions.some(question => !question))
    premiumError("INTERNAL_SERVER_ERROR", "بنك الأسئلة مش متاح بالكامل.");
  return questions as (typeof ASSESSMENT_BANK)[number][];
}

function ensureAnswerShape(
  questions: readonly (typeof ASSESSMENT_BANK)[number][],
  answers: Record<string, number>
) {
  try {
    assertExactAnswers(questions, answers);
  } catch (error) {
    premiumError(
      "BAD_REQUEST",
      error instanceof Error ? error.message : "الإجابات غير صالحة."
    );
  }
}

function sameAnswers(
  left: Record<string, number>,
  right: Record<string, number>
): boolean {
  const keys = Object.keys(left).sort();
  const otherKeys = Object.keys(right).sort();
  return (
    keys.length === otherKeys.length &&
    keys.every(
      (key, index) => key === otherKeys[index] && left[key] === right[key]
    )
  );
}

function membershipSummary(
  membership: typeof premiumMemberships.$inferSelect,
  now: Date
) {
  return {
    ...publicMembership(membership),
    active: isActiveMembership(membership, now),
    dayNumber: dayNumberFor(membership, now),
    currentLevel: levelForDay(
      membershipLevels(membership),
      dayNumberFor(membership, now),
      membership.durationDays
    ),
  };
}

async function ensureDailyAttempt(
  db: any,
  membership: any,
  dayIndex: number,
  now: Date
) {
  const existing = await findAttempt(db, membership.id, dayIndex);
  if (existing) return existing;
  const level = levelForDay(
    membershipLevels(membership),
    dayIndex,
    membership.durationDays
  );
  if (!level)
    premiumError("BAD_REQUEST", "اليوم ده مش مرتبط بمستوى في العضوية.");
  const questions = dailyQuestionsFor(membership.id, dayIndex, level);
  const values = {
    membershipId: membership.id,
    dayIndex,
    cairoDate: cairoDateForDay(membership.startDate, dayIndex),
    level,
    questionIds: encodeJson(questions.map(question => question.id)),
    answers: null,
    score: null,
    total: DAILY_QUIZ_SIZE,
    feedback: null,
    submittedAt: null,
    createdAt: now,
    updatedAt: now,
  };
  try {
    const result = await db.insert(premiumDailyAttempts).values(values);
    const inserted = await findAttempt(db, membership.id, dayIndex);
    if (inserted) return inserted;
    return {
      id: insertedId(result),
      ...values,
    };
  } catch (error) {
    // The unique membership/day index is the concurrency guard. A racing
    // opener simply reads the durable winner.
    const winner = await findAttempt(db, membership.id, dayIndex);
    if (winner) return winner;
    throw error;
  }
}

async function studentUser(db: any, userId: number) {
  return oneById(db, users, users.id, userId);
}

function isDemoInstructorAccount(
  user:
    | {
        role?: string;
        openId?: string | null;
        passwordHash?: string | null;
      }
    | null
    | undefined
): boolean {
  if (user?.role !== "instructor" || !user.openId?.startsWith("seed_"))
    return false;
  try {
    return verifyPassword(DEMO_INSTRUCTOR_PASSWORD, user.passwordHash ?? null);
  } catch {
    return false;
  }
}

export const premiumRouter = router({
  /** Public metadata only: no quiz prompts, options, or answer keys. */
  catalog: publicProcedure.query(() => ({
    priceCents: PREMIUM_PRICE_CENTS,
    pricePerLevelCents: PREMIUM_PRICE_CENTS,
    currency: "EGP",
    levels: PREMIUM_LEVELS.map(level => ({ level, name: LEVEL_NAMES[level] })),
    durations: PREMIUM_DURATIONS.map(durationDays => ({
      durationDays,
      label: `${durationDays} يوم`,
    })),
    terms: {
      manualActivation: true,
      dailyQuestions: DAILY_QUIZ_SIZE,
      passPercent: PASS_PERCENT,
      timezone: "Africa/Cairo",
      retryPolicy: {
        daily: "once-only",
        lessons: "best-score-with-retries",
      },
    },
  })),

  mine: protectedProcedure.query(async ({ ctx }) => {
    const db = await requirePremiumDb();
    const now = nowFor(ctx as PremiumContext);
    const membership = await membershipForStudentView(db, ctx.user.id, now);
    return snapshotForMembership(
      db,
      membership,
      ctx as PremiumContext,
      ctx.user.id
    );
  }),

  day: protectedProcedure
    .input(z.object({ dayIndex: z.number().int().positive().optional() }))
    .query(async ({ ctx, input }) => {
      const db = await requirePremiumDb();
      const premiumCtx = ctx as PremiumContext;
      const now = nowFor(premiumCtx);
      const membership = await activeMembershipForUser(db, ctx.user.id, now);
      if (!membership)
        premiumError("NOT_FOUND", "مفيش عضوية Premium مفعّلة للحساب ده.");
      assertActiveForQuiz(membership, now);
      const dayIndex = input.dayIndex ?? dayNumberFor(membership, now);
      assertDayAllowed(membership, dayIndex, now);
      const attempt = await ensureDailyAttempt(db, membership, dayIndex, now);
      return dailyView(
        attempt,
        bankQuestionsForIds(parseJson<string[]>(attempt.questionIds, []))
      );
    }),

  submitDaily: protectedProcedure
    .input(
      z.object({
        dayIndex: z.number().int().positive(),
        answers: answersSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await requirePremiumDb();
      const premiumCtx = ctx as PremiumContext;
      const now = nowFor(premiumCtx);
      const membership = await activeMembershipForUser(db, ctx.user.id, now);
      if (!membership)
        premiumError("NOT_FOUND", "مفيش عضوية Premium مفعّلة للحساب ده.");
      assertActiveForQuiz(membership, now);
      assertDayAllowed(membership, input.dayIndex, now);

      return db.transaction(async (tx: any) => {
        const lockedRows = await findAttemptLocked(
          tx,
          membership.id,
          input.dayIndex
        );
        let attempt = dbRows<any>(lockedRows)[0] ?? null;
        if (!attempt)
          attempt = await ensureDailyAttempt(
            tx,
            membership,
            input.dayIndex,
            now
          );
        const questions = bankQuestionsForIds(
          parseJson<string[]>(attempt.questionIds, [])
        );
        ensureAnswerShape(questions, input.answers);
        if (attempt.submittedAt !== null || attempt.score !== null) {
          const previous = parseAttemptAnswers(attempt.answers);
          if (!sameAnswers(previous, input.answers))
            premiumError(
              "CONFLICT",
              "الاختبار اليومي اتقفل ومينفعش نغيّر إجاباته."
            );
          return dailyView(attempt, questions);
        }
        const graded = gradeQuestions(questions, input.answers);
        const submittedAt = now;
        await tx
          .update(premiumDailyAttempts)
          .set({
            answers: encodeJson(input.answers),
            score: graded.score,
            total: graded.total,
            feedback: encodeJson(graded.feedback),
            submittedAt,
            updatedAt: submittedAt,
          })
          .where(eq(premiumDailyAttempts.id, attempt.id));
        const saved = (await findAttempt(
          tx,
          membership.id,
          input.dayIndex
        )) ?? {
          ...attempt,
          answers: encodeJson(input.answers),
          score: graded.score,
          total: graded.total,
          feedback: encodeJson(graded.feedback),
          submittedAt,
          updatedAt: submittedAt,
        };
        return dailyView(saved, questions);
      });
    }),

  lesson: protectedProcedure
    .input(z.object({ lessonId: z.string().trim().min(1).max(160) }))
    .query(async ({ ctx, input }) => {
      const db = await requirePremiumDb();
      const now = nowFor(ctx as PremiumContext);
      const membership = await activeMembershipForUser(db, ctx.user.id, now);
      if (!membership)
        premiumError("NOT_FOUND", "مفيش عضوية Premium مفعّلة للحساب ده.");
      assertActiveForQuiz(membership, now);
      const lesson = premiumLessonById(input.lessonId);
      if (!lesson) premiumError("NOT_FOUND", "الدرس مش موجود.");
      if (!unlockedLevels(membership, now).includes(lesson.level))
        premiumError("FORBIDDEN", "الدرس ده مش مفتوح في مرحلة خطتك دلوقتي.");
      const progressRows = await db
        .select()
        .from(premiumLessonProgress)
        .where(
          and(
            eq(premiumLessonProgress.membershipId, membership.id),
            eq(premiumLessonProgress.lessonId, lesson.id)
          )
        )
        .limit(1);
      return {
        lesson: {
          ...lesson,
          quiz: lesson.quiz.map(publicQuestion),
        },
        progress: progressRows[0]
          ? {
              lessonId: progressRows[0].lessonId,
              bestScore: progressRows[0].bestScore,
              total: progressRows[0].total,
              attemptCount: progressRows[0].attemptCount,
              completed: progressRows[0].completed,
              lastAttemptAt: progressRows[0].lastAttemptAt,
            }
          : null,
        membership: membershipSummary(membership, now),
      };
    }),

  submitLesson: protectedProcedure
    .input(
      z.object({
        lessonId: z.string().trim().min(1).max(160),
        answers: answersSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await requirePremiumDb();
      const now = nowFor(ctx as PremiumContext);
      const membership = await activeMembershipForUser(db, ctx.user.id, now);
      if (!membership)
        premiumError("NOT_FOUND", "مفيش عضوية Premium مفعّلة للحساب ده.");
      assertActiveForQuiz(membership, now);
      const lesson = premiumLessonById(input.lessonId);
      if (!lesson) premiumError("NOT_FOUND", "الدرس مش موجود.");
      if (!unlockedLevels(membership, now).includes(lesson.level))
        premiumError("FORBIDDEN", "الدرس ده مش مفتوح في مرحلة خطتك دلوقتي.");
      const graded = gradeQuestions(lesson.quiz, input.answers);
      return db.transaction(async (tx: any) => {
        const locked = await lockOneById(
          tx,
          premiumMemberships,
          premiumMemberships.id,
          membership.id
        );
        const durable =
          dbRows<typeof premiumMemberships.$inferSelect>(locked)[0];
        if (!durable) premiumError("NOT_FOUND", "العضوية مش موجودة.");
        assertActiveForQuiz(durable, now);
        const rows = await tx
          .select()
          .from(premiumLessonProgress)
          .where(
            and(
              eq(premiumLessonProgress.membershipId, membership.id),
              eq(premiumLessonProgress.lessonId, lesson.id)
            )
          )
          .limit(1);
        const existing = rows[0];
        const bestScore = Math.max(existing?.bestScore ?? 0, graded.score);
        const attemptCount = (existing?.attemptCount ?? 0) + 1;
        const completed =
          Math.round((bestScore / graded.total) * 100) >= PASS_PERCENT;
        const values = {
          membershipId: membership.id,
          lessonId: lesson.id,
          level: lesson.level,
          bestScore,
          total: graded.total,
          attemptCount,
          completed,
          lastFeedback: encodeJson(graded.feedback),
          lastAttemptAt: now,
          updatedAt: now,
        };
        if (existing) {
          await tx
            .update(premiumLessonProgress)
            .set(values)
            .where(eq(premiumLessonProgress.id, existing.id));
        } else {
          await tx
            .insert(premiumLessonProgress)
            .values({ ...values, createdAt: now });
        }
        return {
          lessonId: lesson.id,
          score: graded.score,
          total: graded.total,
          percent: graded.percent,
          bestScore,
          bestPercent: Math.round((bestScore / graded.total) * 100),
          attemptCount,
          completed,
          feedback: graded.feedback,
        };
      });
    }),

  staff: adminProcedure.query(async () => {
    const db = await requirePremiumDb();
    const rows = await db
      .select({
        id: users.id,
        name: users.name,
        role: users.role,
        openId: users.openId,
        passwordHash: users.passwordHash,
      })
      .from(users);
    return rows
      .filter(
        row =>
          (row.role === "admin" || row.role === "instructor") &&
          !isDemoInstructorAccount(row)
      )
      .map(({ id, name, role }) => ({ id, name, role }));
  }),
  members: adminProcedure.query(async () => {
    const db = await requirePremiumDb();
    const rows = await db.select().from(premiumMemberships);
    const userRows = await db.select().from(users);
    const now = new Date();
    return rows
      .sort((a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime())
      .map((membership: any) => ({
        ...membershipSummary(membership, now),
        student: (() => {
          const user = userRows.find(
            (item: any) => item.id === membership.userId
          );
          return user
            ? {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
              }
            : null;
        })(),
      }));
  }),

  student: protectedProcedure
    .input(z.object({ userId: userIdSchema }))
    .query(async ({ ctx, input }) => {
      const db = await requirePremiumDb();
      const now = nowFor(ctx as PremiumContext);
      const membership = await membershipForStudentView(db, input.userId, now);
      if (!membership) {
        if (ctx.user.role !== "admin")
          premiumError("FORBIDDEN", "الطالب مش ضمن المتابعة المسموحة.");
        return snapshotForMembership(
          db,
          null,
          ctx as PremiumContext,
          input.userId
        );
      }
      if (!canViewStudent(ctx as PremiumContext, membership, input.userId))
        premiumError("FORBIDDEN", "الوصول ده للمالك أو الكوتش المعيّن بس.");
      return snapshotForMembership(
        db,
        membership,
        ctx as PremiumContext,
        input.userId
      );
    }),

  feedback: protectedProcedure
    .input(
      z.object({
        userId: userIdSchema,
        note: z.string().trim().min(1).max(4000),
        dayIndex: z.number().int().positive().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await requirePremiumDb();
      const now = nowFor(ctx as PremiumContext);
      const membership = await membershipForStudentView(db, input.userId, now);
      if (
        !membership ||
        !canViewStudent(ctx as PremiumContext, membership, input.userId)
      )
        premiumError("FORBIDDEN", "الملاحظات دي للمالك أو الكوتش المعيّن بس.");
      if (input.dayIndex !== undefined)
        assertDayAllowed(membership, input.dayIndex, now);
      const result = await db.insert(premiumCoachNotes).values({
        membershipId: membership.id,
        studentUserId: input.userId,
        authorUserId: ctx.user.id,
        dayIndex: input.dayIndex ?? null,
        note: input.note,
      });
      return {
        ok: true,
        userId: input.userId,
        membershipId: membership.id,
        dayIndex: input.dayIndex ?? null,
        note: input.note,
        authorUserId: ctx.user.id,
        id: Number((result as any)?.insertId ?? 0),
        createdAt: now,
      };
    }),

  coachStudents: protectedProcedure.query(async ({ ctx }) => {
    if (!["admin", "instructor"].includes(ctx.user.role))
      premiumError("FORBIDDEN", "المتابعة دي للمالك أو مدرس مسجّل بس.");
    const db = await requirePremiumDb();
    const rows = await db
      .select()
      .from(premiumMemberships)
      .where(eq(premiumMemberships.coachUserId, ctx.user.id));
    const studentRows = await db
      .select({ id: users.id, name: users.name })
      .from(users);
    const now = nowFor(ctx as PremiumContext);
    return Promise.all(
      rows.map(async membership => {
        const student = studentRows.find(row => row.id === membership.userId);
        return {
          userId: membership.userId,
          name: student?.name ?? null,
          membership: membershipSummary(membership, now),
          snapshot: await snapshotForMembership(
            db,
            membership,
            ctx as PremiumContext,
            membership.userId
          ),
        };
      })
    );
  }),

  activate: adminProcedure
    .input(activationInput)
    .mutation(async ({ ctx, input }) => {
      const levels = assertUniqueLevels(input.levels);
      const amountCents = PREMIUM_PRICE_CENTS * levels.length;
      const db = await requirePremiumDb();
      const now = nowFor(ctx as PremiumContext);
      return db.transaction(async (tx: any) => {
        const lockedQuery = await lockOneById(
          tx,
          users,
          users.id,
          input.userId
        );
        const student = dbRows<any>(lockedQuery)[0];
        assertStudentRole(student);
        const coachUserId = input.coachUserId ?? null;
        if (coachUserId !== null) {
          const coach = await studentUser(tx, coachUserId);
          if (!coach)
            premiumError("NOT_FOUND", "الكوتش لازم يكون حساب مسجّل بالفعل.");
          if (isDemoInstructorAccount(coach))
            premiumError(
              "BAD_REQUEST",
              "حساب المدرس التجريبي محتاج كلمة مرور خاصة قبل تعيينه"
            );
          if (!["admin", "instructor"].includes(coach.role))
            premiumError(
              "BAD_REQUEST",
              "اختار حساب مدرس مسجّل أو المالك للمتابعة، مش حساب طالب."
            );
          if (coach.id === student.id)
            premiumError("BAD_REQUEST", "مينفعش الطالب يبقى الكوتش لنفسه.");
        }
        const existingRows = await tx
          .select()
          .from(premiumMemberships)
          .where(eq(premiumMemberships.userId, input.userId));
        if (existingRows.some((row: any) => isActiveMembership(row, now)))
          premiumError("CONFLICT", "الطالب عنده عضوية Premium مفعّلة بالفعل.");
        const endDate = endDateForDuration(now, input.durationDays);
        const values = {
          userId: input.userId,
          levels: encodeJson(levels),
          startDate: now,
          endDate,
          status: "active" as const,
          durationDays: input.durationDays,
          paidAmountCents: amountCents,
          paymentReference: input.paymentReference,
          activatedBy: ctx.user.id,
          coachUserId,
          createdAt: now,
          updatedAt: now,
        };
        const result = await tx.insert(premiumMemberships).values(values);
        const membershipId = insertedId(result);
        await tx.insert(orders).values({
          userId: input.userId,
          kind: "subscription",
          courseId: null,
          planId: null,
          amountCents,
          currency: "EGP",
          status: "paid",
          provider: "manual",
          reference: `premium:${membershipId} ${input.paymentReference}`,
        });
        return {
          membership: {
            id: membershipId,
            ...values,
            levels,
          },
          amountCents,
          paymentConfirmed: true,
        };
      });
    }),

  pause: adminProcedure
    .input(z.object({ membershipId: membershipIdSchema }))
    .mutation(async ({ input }) => {
      const db = await requirePremiumDb();
      const membership = await oneById(
        db,
        premiumMemberships,
        premiumMemberships.id,
        input.membershipId
      );
      if (!membership) premiumError("NOT_FOUND", "العضوية مش موجودة.");
      if (membership.status === "cancelled")
        premiumError("CONFLICT", "العضوية اتلغت بالفعل.");
      if (membership.status === "paused")
        return {
          membership: publicMembership(membership),
          status: "paused" as const,
        };
      await db
        .update(premiumMemberships)
        .set({ status: "paused" })
        .where(eq(premiumMemberships.id, membership.id));
      return {
        membership: publicMembership({ ...membership, status: "paused" }),
        status: "paused" as const,
      };
    }),

  cancel: adminProcedure
    .input(z.object({ membershipId: membershipIdSchema }))
    .mutation(async ({ input }) => {
      const db = await requirePremiumDb();
      const membership = await oneById(
        db,
        premiumMemberships,
        premiumMemberships.id,
        input.membershipId
      );
      if (!membership) premiumError("NOT_FOUND", "العضوية مش موجودة.");
      if (membership.status === "cancelled")
        return {
          membership: publicMembership(membership),
          status: "cancelled" as const,
        };
      await db
        .update(premiumMemberships)
        .set({ status: "cancelled" })
        .where(eq(premiumMemberships.id, membership.id));
      return {
        membership: publicMembership({ ...membership, status: "cancelled" }),
        status: "cancelled" as const,
      };
    }),

  assignCoach: adminProcedure
    .input(
      z.object({
        membershipId: membershipIdSchema,
        coachUserId: userIdSchema.nullable(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await requirePremiumDb();
      const membership = await oneById(
        db,
        premiumMemberships,
        premiumMemberships.id,
        input.membershipId
      );
      if (!membership) premiumError("NOT_FOUND", "العضوية مش موجودة.");
      if (input.coachUserId !== null) {
        const coach = await studentUser(db, input.coachUserId);
        if (!coach)
          premiumError("NOT_FOUND", "الكوتش لازم يكون حساب مسجّل بالفعل.");
        if (isDemoInstructorAccount(coach))
          premiumError(
            "BAD_REQUEST",
            "حساب المدرس التجريبي محتاج كلمة مرور خاصة قبل تعيينه"
          );
        if (!["admin", "instructor"].includes(coach.role))
          premiumError(
            "BAD_REQUEST",
            "اختار حساب مدرس مسجّل أو المالك للمتابعة، مش حساب طالب."
          );
        if (coach.id === membership.userId)
          premiumError("BAD_REQUEST", "مينفعش الطالب يبقى الكوتش لنفسه.");
      }
      await db
        .update(premiumMemberships)
        .set({ coachUserId: input.coachUserId })
        .where(eq(premiumMemberships.id, membership.id));
      return {
        membership: publicMembership({
          ...membership,
          coachUserId: input.coachUserId,
        }),
        coachUserId: input.coachUserId,
      };
    }),
});
