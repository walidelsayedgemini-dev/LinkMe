import { TRPCError } from "@trpc/server";
import { and, asc, count, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import {
  courses,
  plans,
  subscriptions,
  orders,
  enrollments,
  lessonProgress,
  lessons,
  liveSessions,
  sessionAttendance,
  studentRatings,
  studentTasks,
  users,
} from "../../drizzle/schema";
import { studentProfileDetails } from "../../drizzle/profile-schema";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { publicUser } from "./_shared";
import { getDb } from "../db";
import { issueOwnerCode, ownerCodeStatus } from "../auth";

/** Whole-school records are restricted to the owner/admin; instructor access requires a scoped roster. */
const staffProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "الصفحة دي لحساب الإدارة فقط.",
    });
  }
  return next({ ctx });
});

const levelSchema = z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]);
const attendanceSchema = z.enum(["present", "late", "absent", "excused"]);

export type ClassroomSessionLike = {
  id: number;
  courseId: number | null;
  startsAt: Date | string;
  status: string;
};

export function isSafeHttpsMeetingUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password;
  } catch {
    return false;
  }
}

/** Only past or explicitly completed sessions affect attendance statistics. */
export function isAttendanceEligibleSession(
  session: Pick<ClassroomSessionLike, "startsAt" | "status">,
  now = new Date()
) {
  if (session.status === "canceled") return false;
  const startsAt = new Date(session.startsAt);
  if (Number.isNaN(startsAt.getTime())) return false;
  return session.status === "done" || startsAt.getTime() <= now.getTime();
}

/** Global sessions (legacy/null courseId) include all students; course sessions use enrollments only. */
export function isStudentEligibleForSession(
  courseId: number | null,
  userId: number,
  enrolledCourseIds: ReadonlySet<number>
) {
  return courseId === null || enrolledCourseIds.has(courseId);
}

/** A learner cannot be absent from a class before joining that course. */
export function isSessionWithinEnrollment(
  session: Pick<ClassroomSessionLike, "courseId" | "startsAt">,
  ownEnrollments: ReadonlyArray<{
    courseId: number;
    enrolledAt: Date | string;
  }>,
  joinedAt?: Date | string
) {
  const start = new Date(session.startsAt).getTime();
  if (!Number.isFinite(start)) return false;
  if (session.courseId === null)
    return !joinedAt || start >= new Date(joinedAt).getTime();
  const enrollment = ownEnrollments.find(
    row => row.courseId === session.courseId
  );
  return Boolean(
    enrollment && start >= new Date(enrollment.enrolledAt).getTime()
  );
}

export function attendanceStatsForStudent(
  sessions: ClassroomSessionLike[],
  marks: Array<{ sessionId: number; userId: number; status: string }>,
  userId: number,
  enrolledCourseIds: ReadonlySet<number>,
  now = new Date()
) {
  const eligible = sessions.filter(
    session =>
      isAttendanceEligibleSession(session, now) &&
      isStudentEligibleForSession(session.courseId, userId, enrolledCourseIds)
  );
  const eligibleIds = new Set(eligible.map(session => session.id));
  const ownMarks = marks.filter(
    mark => mark.userId === userId && eligibleIds.has(mark.sessionId)
  );
  const attended = ownMarks.filter(
    mark => mark.status === "present" || mark.status === "late"
  ).length;
  return {
    totalSessions: eligible.length,
    attended,
    unmarkedCount: Math.max(eligible.length - ownMarks.length, 0),
    attendanceRate: eligible.length
      ? Math.round((attended / eligible.length) * 100)
      : null,
  };
}

async function requireDb() {
  const db = await getDb();
  if (!db)
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "قاعدة البيانات غير متاحة حاليًا.",
    });
  return db;
}

/** Aggregate learning stats for every learner on the platform. */
async function studentRows() {
  const db = await requireDb();
  const learners = await db
    .select()
    .from(users)
    .where(eq(users.role, "user"))
    .orderBy(desc(users.createdAt));

  if (learners.length === 0) return [];
  const ids = learners.map(learner => learner.id);

  const enrollmentRows = await db
    .select()
    .from(enrollments)
    .where(inArray(enrollments.userId, ids));
  const sessionRows = await db.select().from(liveSessions);
  const progressRows = await db
    .select({
      userId: lessonProgress.userId,
      lessons: count(lessonProgress.id),
    })
    .from(lessonProgress)
    .where(inArray(lessonProgress.userId, ids))
    .groupBy(lessonProgress.userId);
  const attendanceRows = await db
    .select({
      sessionId: sessionAttendance.sessionId,
      userId: sessionAttendance.userId,
      status: sessionAttendance.status,
    })
    .from(sessionAttendance)
    .where(inArray(sessionAttendance.userId, ids));
  const ratingRows = await db
    .select({
      userId: studentRatings.userId,
      avg: sql<number>`avg(${studentRatings.stars})`,
      total: count(studentRatings.id),
    })
    .from(studentRatings)
    .where(inArray(studentRatings.userId, ids))
    .groupBy(studentRatings.userId);
  const taskRows = await db
    .select({
      userId: studentTasks.userId,
      status: studentTasks.status,
      total: count(studentTasks.id),
    })
    .from(studentTasks)
    .where(inArray(studentTasks.userId, ids))
    .groupBy(studentTasks.userId, studentTasks.status);

  return learners.map(learner => {
    const enrollmentsCount = enrollmentRows.filter(
      row => row.userId === learner.id
    ).length;
    const completedLessons = Number(
      progressRows.find(row => row.userId === learner.id)?.lessons ?? 0
    );
    const enrolledCourseIds = new Set(
      enrollmentRows
        .filter(row => row.userId === learner.id)
        .map(row => row.courseId)
    );
    const attendance = attendanceStatsForStudent(
      sessionRows.filter(session =>
        isSessionWithinEnrollment(
          session,
          enrollmentRows.filter(row => row.userId === learner.id),
          learner.createdAt
        )
      ),
      attendanceRows,
      learner.id,
      enrolledCourseIds
    );
    const rating = ratingRows.find(row => row.userId === learner.id);
    const tasks = taskRows.filter(row => row.userId === learner.id);
    const openTasks = tasks
      .filter(row => row.status === "assigned" || row.status === "in_progress")
      .reduce((sum, row) => sum + Number(row.total), 0);
    return {
      ...publicUser(learner),
      enrollmentsCount,
      completedLessons,
      attendedSessions: attendance.attended,
      totalSessions: attendance.totalSessions,
      unmarkedSessions: attendance.unmarkedCount,
      attendanceRate: attendance.attendanceRate,
      ratingAvg: rating ? Math.round(Number(rating.avg) * 10) / 10 : null,
      ratingCount: rating ? Number(rating.total) : 0,
      openTasks,
    };
  });
}

export const adminRouter = router({
  accessOptions: staffProcedure.query(async () => {
    const db = await requireDb();
    const courseRows = await db
      .select({ id: courses.id, title: courses.titleAr })
      .from(courses)
      .where(eq(courses.isPublished, true));
    const planRows = await db
      .select({ id: plans.id, title: plans.nameAr })
      .from(plans)
      .where(sql`${plans.priceMonthlyCents} > 0`);
    return { courses: courseRows, plans: planRows };
  }),

  grantAccess: staffProcedure
    .input(
      z.object({
        userId: z.number().int().positive(),
        kind: z.enum(["course", "plan"]),
        itemId: z.number().int().positive(),
        cycle: z.enum(["monthly", "yearly"]).default("monthly"),
        paymentVerified: z.literal(true),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await requireDb();
      return db.transaction(async tx => {
        const [learner] = await tx
          .select({ id: users.id })
          .from(users)
          .where(eq(users.id, input.userId))
          .for("update");
        if (!learner)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "حساب الطالب غير موجود",
          });
        const reference = `manual_${ctx.user.id}_${Date.now()}_${input.userId}`;
        if (input.kind === "course") {
          const [course] = await tx
            .select()
            .from(courses)
            .where(
              and(eq(courses.id, input.itemId), eq(courses.isPublished, true))
            )
            .limit(1);
          if (!course)
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "الكورس غير موجود",
            });
          const [existing] = await tx
            .select({ id: enrollments.id })
            .from(enrollments)
            .where(
              and(
                eq(enrollments.userId, input.userId),
                eq(enrollments.courseId, course.id)
              )
            )
            .limit(1);
          if (existing) return { alreadyActive: true };
          await tx.insert(enrollments).values({
            userId: input.userId,
            courseId: course.id,
            source: course.priceCents ? "purchase" : "free",
          });
          await tx.insert(orders).values({
            userId: input.userId,
            courseId: course.id,
            kind: "course",
            amountCents: course.priceCents,
            currency: course.currency,
            provider: "manual",
            status: "paid",
            reference,
          });
        } else {
          const [plan] = await tx
            .select()
            .from(plans)
            .where(eq(plans.id, input.itemId))
            .limit(1);
          if (!plan)
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "الخطة غير موجودة",
            });
          const [active] = await tx
            .select()
            .from(subscriptions)
            .where(
              and(
                eq(subscriptions.userId, input.userId),
                eq(subscriptions.planId, plan.id),
                eq(subscriptions.status, "active")
              )
            )
            .limit(1);
          if (
            active &&
            active.currentPeriodEnd &&
            active.currentPeriodEnd > new Date()
          )
            return { alreadyActive: true };
          await tx
            .update(subscriptions)
            .set({ status: "canceled" })
            .where(eq(subscriptions.userId, input.userId));
          await tx.insert(subscriptions).values({
            userId: input.userId,
            planId: plan.id,
            billingCycle: input.cycle,
            status: "active",
            currentPeriodEnd: new Date(
              Date.now() + (input.cycle === "monthly" ? 30 : 365) * 86400000
            ),
          });
          await tx.insert(orders).values({
            userId: input.userId,
            planId: plan.id,
            kind: "subscription",
            amountCents:
              input.cycle === "monthly"
                ? plan.priceMonthlyCents
                : plan.priceYearlyCents,
            currency: "EGP",
            provider: "manual",
            status: "paid",
            reference,
          });
        }
        return { alreadyActive: false };
      });
    }),

  /** Console overview: counters + the learners table. */
  overview: staffProcedure.query(async () => {
    const rows = await studentRows();
    const db = await requireDb();
    const [sessions] = await db
      .select({ total: count(liveSessions.id) })
      .from(liveSessions);
    const [tasks] = await db
      .select({ total: count(studentTasks.id) })
      .from(studentTasks);
    return {
      students: rows,
      totals: {
        students: rows.length,
        sessions: Number(sessions?.total ?? 0),
        tasks: Number(tasks?.total ?? 0),
        avgRating:
          rows.filter(row => row.ratingAvg !== null).length > 0
            ? Math.round(
                (rows.reduce((sum, row) => sum + (row.ratingAvg ?? 0), 0) /
                  rows.filter(row => row.ratingAvg !== null).length) *
                  10
              ) / 10
            : null,
      },
    };
  }),

  /** Everything about one learner: courses, progress, attendance, tasks, ratings. */
  student: staffProcedure
    .input(z.object({ userId: z.number().int() }))
    .query(async ({ input }) => {
      const db = await requireDb();
      const [student] = await db
        .select()
        .from(users)
        .where(eq(users.id, input.userId))
        .limit(1);
      if (!student)
        throw new TRPCError({ code: "NOT_FOUND", message: "الطالب غير موجود" });

      const [studentDetails] = await db
        .select({
          city: studentProfileDetails.city,
          birthYear: studentProfileDetails.birthYear,
          schoolGrade: studentProfileDetails.schoolGrade,
          learningGoal: studentProfileDetails.learningGoal,
          preferredStudyTime: studentProfileDetails.preferredStudyTime,
          dailyStudyMinutes: studentProfileDetails.dailyStudyMinutes,
          bio: studentProfileDetails.bio,
        })
        .from(studentProfileDetails)
        .where(eq(studentProfileDetails.uid, input.userId))
        .limit(1);

      const courseRows = await db
        .select({
          courseId: enrollments.courseId,
          title: courses.title,
          titleAr: courses.titleAr,
          slug: courses.slug,
          enrolledAt: enrollments.enrolledAt,
        })
        .from(enrollments)
        .leftJoin(courses, eq(courses.id, enrollments.courseId))
        .where(eq(enrollments.userId, input.userId));

      const progressRows = await db
        .select({
          courseId: lessonProgress.courseId,
          completed: count(lessonProgress.id),
        })
        .from(lessonProgress)
        .where(eq(lessonProgress.userId, input.userId))
        .groupBy(lessonProgress.courseId);

      const lessonTotals = await db
        .select({ courseId: lessons.courseId, total: count(lessons.id) })
        .from(lessons)
        .groupBy(lessons.courseId);

      const sessionRows = await db.select().from(liveSessions);
      const attendanceMarks = await db
        .select({
          id: sessionAttendance.id,
          sessionId: sessionAttendance.sessionId,
          userId: sessionAttendance.userId,
          status: sessionAttendance.status,
          note: sessionAttendance.note,
        })
        .from(sessionAttendance)
        .where(eq(sessionAttendance.userId, input.userId))
        .orderBy(desc(sessionAttendance.updatedAt));

      const enrolledCourseIds = new Set(courseRows.map(row => row.courseId));
      const eligibleSessionRows = sessionRows.filter(session =>
        isSessionWithinEnrollment(session, courseRows, student.createdAt)
      );
      const attendance = eligibleSessionRows
        .filter(
          session =>
            isAttendanceEligibleSession(session) &&
            isStudentEligibleForSession(
              session.courseId,
              input.userId,
              enrolledCourseIds
            )
        )
        .sort(
          (a, b) =>
            new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime()
        )
        .map(session => {
          const mark = attendanceMarks.find(
            item => item.sessionId === session.id
          );
          const course = courseRows.find(
            item => item.courseId === session.courseId
          );
          return {
            id: mark?.id ?? null,
            sessionId: session.id,
            status: mark?.status ?? "pending",
            note: mark?.note ?? null,
            title: session.title,
            startsAt: session.startsAt,
            meetingUrl: session.meetingUrl,
            durationMinutes: session.durationMinutes,
            courseId: session.courseId,
            courseTitle: course?.titleAr ?? null,
          };
        });
      const attendanceStats = attendanceStatsForStudent(
        eligibleSessionRows,
        attendanceMarks,
        input.userId,
        enrolledCourseIds
      );

      const tasks = await db
        .select()
        .from(studentTasks)
        .where(eq(studentTasks.userId, input.userId))
        .orderBy(desc(studentTasks.createdAt));

      const ratings = await db
        .select()
        .from(studentRatings)
        .where(eq(studentRatings.userId, input.userId))
        .orderBy(desc(studentRatings.createdAt));

      return {
        student: publicUser(student),
        studentProfileDetails: studentDetails ?? null,
        courses: courseRows.map(row => {
          const completed = Number(
            progressRows.find(item => item.courseId === row.courseId)
              ?.completed ?? 0
          );
          const total = Number(
            lessonTotals.find(item => item.courseId === row.courseId)?.total ??
              0
          );
          return {
            ...row,
            completed,
            total,
            progress: total ? Math.round((completed / total) * 100) : 0,
          };
        }),
        attendance,
        attendanceStats,
        tasks,
        ratings,
      };
    }),

  /** Update profile-level fields an admin controls (level, goal, role). */
  updateStudent: staffProcedure
    .input(
      z.object({
        userId: z.number().int(),
        englishLevel: levelSchema.nullish(),
        learningGoal: z.string().max(120).nullish(),
        role: z.enum(["user", "admin", "instructor"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (input.role && ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "تغيير الصلاحيات للإدارة فقط.",
        });
      }
      const db = await requireDb();
      await db
        .update(users)
        .set({
          englishLevel: input.englishLevel ?? null,
          learningGoal: input.learningGoal ?? null,
          ...(input.role ? { role: input.role } : {}),
        })
        .where(eq(users.id, input.userId));
      return { ok: true };
    }),

  rateStudent: staffProcedure
    .input(
      z.object({
        userId: z.number().int(),
        stars: z.number().min(1).max(5),
        speaking: z.number().min(0).max(5).nullish(),
        listening: z.number().min(0).max(5).nullish(),
        grammar: z.number().min(0).max(5).nullish(),
        vocabulary: z.number().min(0).max(5).nullish(),
        note: z.string().max(1000).nullish(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      await db.insert(studentRatings).values({
        userId: input.userId,
        ratedBy: ctx.user.id,
        stars: input.stars,
        speaking: input.speaking ?? null,
        listening: input.listening ?? null,
        grammar: input.grammar ?? null,
        vocabulary: input.vocabulary ?? null,
        note: input.note ?? null,
      });
      return { ok: true };
    }),

  // Homework creation, submission and review live exclusively in homeworkRouter.

  /** Owner security: status of the passwordless owner code. */
  ownerSecurity: staffProcedure.query(async ({ ctx }) =>
    ownerCodeStatus(ctx.user.id)
  ),

  /** Rotate the owner code. The plaintext is returned once and never stored. */
  rotateOwnerCode: staffProcedure.mutation(async ({ ctx }) => {
    if (ctx.user.email?.toLowerCase() !== "walidelsayedgemini@gmail.com") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "توليد رمز المالك متاح لصاحب الحساب الأساسي فقط.",
      });
    }
    const code = await issueOwnerCode(ctx.user.id);
    return { code };
  }),

  /** Live online sessions with attendance + the roster. */
  sessions: staffProcedure.query(async () => {
    const db = await requireDb();
    const rows = await db
      .select({
        id: liveSessions.id,
        courseId: liveSessions.courseId,
        title: liveSessions.title,
        agenda: liveSessions.agenda,
        startsAt: liveSessions.startsAt,
        durationMinutes: liveSessions.durationMinutes,
        meetingUrl: liveSessions.meetingUrl,
        status: liveSessions.status,
        courseTitle: courses.titleAr,
        courseSlug: courses.slug,
      })
      .from(liveSessions)
      .leftJoin(courses, eq(courses.id, liveSessions.courseId))
      .orderBy(desc(liveSessions.startsAt));

    const attendance = await db.select().from(sessionAttendance);
    const learners = await db
      .select({
        id: users.id,
        name: users.name,
        englishLevel: users.englishLevel,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.role, "user"));
    const enrollmentRows = await db.select().from(enrollments);

    return rows.map(row => {
      const roster = learners.filter(
        learner =>
          isSessionWithinEnrollment(
            row,
            enrollmentRows.filter(
              enrollment => enrollment.userId === learner.id
            ),
            learner.createdAt
          ) &&
          isStudentEligibleForSession(
            row.courseId,
            learner.id,
            new Set(
              enrollmentRows
                .filter(enrollment => enrollment.userId === learner.id)
                .map(enrollment => enrollment.courseId)
            )
          )
      );
      const rosterIds = new Set(roster.map(learner => learner.id));
      const marks = attendance.filter(
        item => item.sessionId === row.id && rosterIds.has(item.userId)
      );
      return {
        ...row,
        present: marks.filter(item => item.status === "present").length,
        late: marks.filter(item => item.status === "late").length,
        absent: marks.filter(item => item.status === "absent").length,
        marks,
        roster,
      };
    });
  }),

  createSession: staffProcedure
    .input(
      z.object({
        courseId: z.number().int().positive(),
        title: z.string().min(2).max(200),
        agenda: z.string().max(2000).nullish(),
        startsAt: z.string().datetime({ offset: true }),
        durationMinutes: z.number().min(15).max(240).default(60),
        meetingUrl: z
          .string()
          .trim()
          .max(500)
          .nullish()
          .refine(value => !value || isSafeHttpsMeetingUrl(value), {
            message:
              "رابط الجلسة لازم يبدأ بـ https:// ومن غير اسم مستخدم أو كلمة مرور.",
          }),
      })
    )
    .mutation(async ({ input }) => {
      const db = await requireDb();
      const [course] = await db
        .select({ id: courses.id })
        .from(courses)
        .where(
          and(eq(courses.id, input.courseId), eq(courses.isPublished, true))
        )
        .limit(1);
      if (!course)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "الكورس غير موجود أو غير منشور.",
        });
      const [created] = await db
        .insert(liveSessions)
        .values({
          courseId: input.courseId,
          title: input.title,
          agenda: input.agenda ?? null,
          startsAt: new Date(input.startsAt),
          durationMinutes: input.durationMinutes,
          meetingUrl: input.meetingUrl || null,
        })
        .$returningId();
      return { id: created.id };
    }),

  markAttendance: staffProcedure
    .input(
      z.object({
        sessionId: z.number().int(),
        userId: z.number().int(),
        status: attendanceSchema,
        note: z.string().max(300).nullish(),
        allowLive: z.boolean().optional().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      const [session] = await db
        .select()
        .from(liveSessions)
        .where(eq(liveSessions.id, input.sessionId))
        .limit(1);
      if (!session)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "الجلسة غير موجودة.",
        });
      if (session.status === "canceled")
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "لا يمكن تسجيل حضور جلسة ملغاة.",
        });
      if (!input.allowLive && new Date(session.startsAt).getTime() > Date.now())
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "لا يمكن تسجيل الحضور قبل بدء الجلسة.",
        });
      const [student] = await db
        .select({ id: users.id, role: users.role })
        .from(users)
        .where(eq(users.id, input.userId))
        .limit(1);
      if (!student || student.role !== "user")
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "الطالب غير موجود.",
        });
      if (session.courseId !== null) {
        const [enrollment] = await db
          .select({ id: enrollments.id, enrolledAt: enrollments.enrolledAt })
          .from(enrollments)
          .where(
            and(
              eq(enrollments.userId, input.userId),
              eq(enrollments.courseId, session.courseId)
            )
          )
          .limit(1);
        if (!enrollment)
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "الطالب مش مشترك في كورس الجلسة.",
          });
        if (
          new Date(session.startsAt).getTime() <
          new Date(enrollment.enrolledAt).getTime()
        )
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "الطالب ماكانش ملتحق بالكورس وقت الجلسة دي.",
          });
      }
      await db
        .insert(sessionAttendance)
        .values({
          sessionId: input.sessionId,
          userId: input.userId,
          status: input.status,
          note: input.note ?? null,
          markedBy: ctx.user.id,
        })
        .onDuplicateKeyUpdate({
          set: {
            status: input.status,
            note: input.note ?? null,
            markedBy: ctx.user.id,
          },
        });
      return { ok: true };
    }),

  /** Every assigned task across the classroom. */
  allTasks: staffProcedure.query(async () => {
    const db = await requireDb();
    return db
      .select({
        id: studentTasks.id,
        title: studentTasks.title,
        instructions: studentTasks.instructions,
        dueAt: studentTasks.dueAt,
        status: studentTasks.status,
        feedback: studentTasks.feedback,
        score: studentTasks.score,
        createdAt: studentTasks.createdAt,
        userId: studentTasks.userId,
        studentName: users.name,
      })
      .from(studentTasks)
      .leftJoin(users, eq(users.id, studentTasks.userId))
      .orderBy(desc(studentTasks.createdAt));
  }),

  /** Public: upcoming online sessions shown on course pages and the dashboard. */
  upcoming: protectedProcedure
    .input(z.object({ courseId: z.number().int().optional() }).optional())
    .query(async ({ input, ctx }) => {
      const db = await requireDb();
      const conditions = [
        eq(liveSessions.status, "scheduled"),
        gte(liveSessions.startsAt, new Date()),
      ];
      if (input?.courseId)
        conditions.push(eq(liveSessions.courseId, input.courseId));
      if (ctx.user.role !== "admin") {
        const ownEnrollments = await db
          .select({ courseId: enrollments.courseId })
          .from(enrollments)
          .where(eq(enrollments.userId, ctx.user.id));
        if (ownEnrollments.length === 0) return [];
        conditions.push(
          inArray(
            liveSessions.courseId,
            ownEnrollments.map(row => row.courseId)
          )
        );
      }
      return db
        .select({
          id: liveSessions.id,
          title: liveSessions.title,
          startsAt: liveSessions.startsAt,
          durationMinutes: liveSessions.durationMinutes,
          meetingUrl: liveSessions.meetingUrl,
          courseSlug: courses.slug,
          courseTitle: courses.titleAr,
        })
        .from(liveSessions)
        .leftJoin(courses, eq(courses.id, liveSessions.courseId))
        .where(and(...conditions))
        .orderBy(asc(liveSessions.startsAt))
        .limit(6);
    }),

  /** Public: sessions of one course (shown on the course page as "محاضرات أونلاين"). */
  courseSessions: publicProcedure
    .input(z.object({ courseId: z.number().int() }))
    .query(async ({ input }) => {
      const db = await requireDb();
      return db
        .select({
          id: liveSessions.id,
          title: liveSessions.title,
          agenda: liveSessions.agenda,
          startsAt: liveSessions.startsAt,
          durationMinutes: liveSessions.durationMinutes,
          status: liveSessions.status,
        })
        .from(liveSessions)
        .where(eq(liveSessions.courseId, input.courseId))
        .orderBy(asc(liveSessions.startsAt));
    }),

  /** The signed-in learner's own classroom record. */
  myClassroom: protectedProcedure.query(async ({ ctx }) => {
    const db = await requireDb();
    const ownEnrollments = await db
      .select({
        courseId: enrollments.courseId,
        enrolledAt: enrollments.enrolledAt,
      })
      .from(enrollments)
      .where(eq(enrollments.userId, ctx.user.id));
    const sessionRows = await db.select().from(liveSessions);
    const attendanceMarks = await db
      .select({
        id: sessionAttendance.id,
        sessionId: sessionAttendance.sessionId,
        userId: sessionAttendance.userId,
        status: sessionAttendance.status,
        note: sessionAttendance.note,
      })
      .from(sessionAttendance)
      .where(eq(sessionAttendance.userId, ctx.user.id))
      .orderBy(desc(sessionAttendance.updatedAt));

    const enrolledCourseIds = new Set(ownEnrollments.map(row => row.courseId));
    const eligibleSessionRows = sessionRows.filter(session =>
      isSessionWithinEnrollment(session, ownEnrollments, ctx.user.createdAt)
    );
    const attendance = eligibleSessionRows
      .filter(
        session =>
          isAttendanceEligibleSession(session) &&
          isStudentEligibleForSession(
            session.courseId,
            ctx.user.id,
            enrolledCourseIds
          )
      )
      .sort(
        (a, b) =>
          new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime()
      )
      .map(session => {
        const mark = attendanceMarks.find(
          item => item.sessionId === session.id
        );
        return {
          id: mark?.id ?? null,
          sessionId: session.id,
          status: mark?.status ?? "pending",
          note: mark?.note ?? null,
          title: session.title,
          startsAt: session.startsAt,
          meetingUrl: session.meetingUrl,
          durationMinutes: session.durationMinutes,
          courseId: session.courseId,
        };
      });

    const tasks = await db
      .select()
      .from(studentTasks)
      .where(eq(studentTasks.userId, ctx.user.id))
      .orderBy(desc(studentTasks.createdAt));

    const ratings = await db
      .select()
      .from(studentRatings)
      .where(eq(studentRatings.userId, ctx.user.id))
      .orderBy(desc(studentRatings.createdAt));

    const attendanceStats = attendanceStatsForStudent(
      eligibleSessionRows,
      attendanceMarks,
      ctx.user.id,
      enrolledCourseIds
    );
    return {
      attendance,
      tasks,
      ratings,
      stats: {
        totalSessions: attendanceStats.totalSessions,
        attended: attendanceStats.attended,
        unmarkedCount: attendanceStats.unmarkedCount,
        attendanceRate: attendanceStats.attendanceRate,
        openTasks: tasks.filter(
          task => task.status === "assigned" || task.status === "in_progress"
        ).length,
        latestRating: ratings[0] ?? null,
      },
    };
  }),
});
