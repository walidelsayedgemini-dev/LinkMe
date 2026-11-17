import { randomUUID } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { studentTasks, users } from "../../drizzle/schema";
import {
  canSubmitHomework,
  isSafeHttpsUrl,
  reviewHomework,
} from "../../shared/homework";
import { getDb } from "../db";
import { adminProcedure, protectedProcedure, router } from "../_core/trpc";
import { storagePut } from "../storage";

const studentIdsSchema = z
  .array(z.number().int().positive())
  .min(1)
  .max(200)
  .refine(
    ids => new Set(ids).size === ids.length,
    "اختار كل طالب مرة واحدة فقط."
  );

const dueAtSchema = z.string().datetime({ offset: true }).nullable().optional();

const createInput = z.object({
  studentIds: studentIdsSchema,
  title: z.string().trim().min(2).max(200),
  instructions: z.string().trim().min(2).max(5000),
  dueAt: dueAtSchema,
});

const submissionInput = z
  .object({
    taskId: z.number().int().positive(),
    submissionText: z.string().trim().max(20000).optional(),
    submissionUrl: z.string().trim().max(1000).optional(),
    submissionAudio: z.string().optional(),
  })
  .superRefine((input, ctx) => {
    const text = input.submissionText?.trim() ?? "";
    const url = input.submissionUrl?.trim() ?? "";
    const audio = input.submissionAudio?.trim() ?? "";
    if (!text && !url && !audio) {
      ctx.addIssue({
        code: "custom",
        message: "اكتب إجابتك أو سجّل صوتك أو ضيف رابط HTTPS للحل.",
        path: ["submissionText"],
      });
    }
    if (url && !isSafeHttpsUrl(url)) {
      ctx.addIssue({
        code: "custom",
        message:
          "رابط الحل لازم يبدأ بـ https:// ومن غير اسم مستخدم أو كلمة مرور جوّه الرابط.",
        path: ["submissionUrl"],
      });
    }
  });

const reviewInput = z
  .object({
    taskId: z.number().int().positive(),
    action: z.enum(["review", "return"]),
    score: z.number().int().min(0).max(100).nullable().optional(),
    feedback: z.string().trim().max(2000),
  })
  .superRefine((input, ctx) => {
    const transition = reviewHomework(
      "submitted",
      input.action,
      input.score,
      input.feedback
    );
    if (!transition) {
      ctx.addIssue({
        code: "custom",
        message:
          input.action === "return"
            ? "اكتب ملاحظة توضّح للطالب المطلوب تعديله."
            : "اكتب درجة أو ملاحظة للتصحيح.",
        path: ["feedback"],
      });
    }
  });

const taskFields = {
  id: studentTasks.id,
  userId: studentTasks.userId,
  assignedBy: studentTasks.assignedBy,
  title: studentTasks.title,
  instructions: studentTasks.instructions,
  dueAt: studentTasks.dueAt,
  status: studentTasks.status,
  feedback: studentTasks.feedback,
  score: studentTasks.score,
  submissionText: studentTasks.submissionText,
  submissionUrl: studentTasks.submissionUrl,
  submissionAudioUrl: studentTasks.submissionAudioUrl,
  submittedAt: studentTasks.submittedAt,
  reviewedAt: studentTasks.reviewedAt,
  reviewedBy: studentTasks.reviewedBy,
  submissionCount: studentTasks.submissionCount,
  createdAt: studentTasks.createdAt,
  updatedAt: studentTasks.updatedAt,
};

async function requireDb() {
  const db = await getDb();
  if (!db) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "قاعدة البيانات غير متاحة دلوقتي، جرّب تاني.",
    });
  }
  return db;
}

function affectedRows(result: unknown): number {
  if (!Array.isArray(result)) return 0;
  const header = result[0];
  if (
    typeof header !== "object" ||
    header === null ||
    !("affectedRows" in header)
  ) {
    return 0;
  }
  return Number(header.affectedRows);
}

async function taskForConflict(
  db: Awaited<ReturnType<typeof requireDb>>,
  taskId: number
) {
  const [task] = await db
    .select({
      id: studentTasks.id,
      userId: studentTasks.userId,
      status: studentTasks.status,
    })
    .from(studentTasks)
    .where(eq(studentTasks.id, taskId))
    .limit(1);
  return task ?? null;
}

export const homeworkRouter = router({
  mine: protectedProcedure.query(async ({ ctx }) => {
    const db = await requireDb();
    return db
      .select()
      .from(studentTasks)
      .where(eq(studentTasks.userId, ctx.user.id))
      .orderBy(desc(studentTasks.createdAt));
  }),

  list: adminProcedure.query(async () => {
    const db = await requireDb();
    return db
      .select({
        ...taskFields,
        studentName: users.name,
        studentEmail: users.email,
      })
      .from(studentTasks)
      .leftJoin(users, eq(users.id, studentTasks.userId))
      .orderBy(desc(studentTasks.createdAt));
  }),

  create: adminProcedure.input(createInput).mutation(async ({ ctx, input }) => {
    const db = await requireDb();
    const dueAt = input.dueAt ? new Date(input.dueAt) : null;
    return db.transaction(async tx => {
      const learners = await tx
        .select({ id: users.id, role: users.role })
        .from(users)
        .where(inArray(users.id, input.studentIds));
      if (
        learners.length !== input.studentIds.length ||
        learners.some(learner => learner.role !== "user")
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "اختار طلابًا مسجّلين على الموقع فقط.",
        });
      }
      await tx.insert(studentTasks).values(
        input.studentIds.map(userId => ({
          userId,
          assignedBy: ctx.user.id,
          title: input.title,
          instructions: input.instructions,
          dueAt,
        }))
      );
      return { count: input.studentIds.length };
    });
  }),

  submit: protectedProcedure
    .input(submissionInput)
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      const submissionText = input.submissionText?.trim() || null;
      const submissionUrl = input.submissionUrl?.trim() || null;

      let submissionAudioUrl: string | null = null;
      if (input.submissionAudio?.startsWith("data:")) {
        const matches = input.submissionAudio.match(
          /^data:(audio\/[a-zA-Z0-9.-]+|video\/webm);base64,(.+)$/
        );
        if (matches && matches[2]) {
          const contentType = matches[1].startsWith("video")
            ? "audio/webm"
            : matches[1];
          const ext = contentType.includes("mp4")
            ? "m4a"
            : contentType.includes("wav")
              ? "wav"
              : "webm";
          const buffer = Buffer.from(matches[2], "base64");
          if (buffer.length <= 15 * 1024 * 1024) {
            const key = `homework-audio/user-${ctx.user.id}/${randomUUID()}.${ext}`;
            const stored = await storagePut(key, buffer, contentType);
            submissionAudioUrl = stored.url;
          }
        }
      } else if (input.submissionAudio?.startsWith("http")) {
        submissionAudioUrl = input.submissionAudio;
      }

      const updateValues: Record<string, unknown> = {
        status: "submitted",
        submissionText,
        submissionUrl,
        submittedAt: new Date(),
        submissionCount: sql`${studentTasks.submissionCount} + 1`,
      };
      if (submissionAudioUrl) {
        updateValues.submissionAudioUrl = submissionAudioUrl;
      }

      const result = await db
        .update(studentTasks)
        .set(updateValues)
        .where(
          and(
            eq(studentTasks.id, input.taskId),
            eq(studentTasks.userId, ctx.user.id),
            inArray(studentTasks.status, ["assigned", "in_progress"])
          )
        );
      if (affectedRows(result) === 0) {
        const task = await taskForConflict(db, input.taskId);
        if (!task) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "الواجب غير موجود.",
          });
        }
        if (task.userId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "الواجب ده مش مخصص لحسابك.",
          });
        }
        if (!canSubmitHomework(task.status)) {
          throw new TRPCError({
            code: "CONFLICT",
            message:
              "الواجب اتسلّم بالفعل أو اتصحّح؛ استنى المدرّس يرجّعه للتعديل.",
          });
        }
        throw new TRPCError({
          code: "CONFLICT",
          message: "حالة الواجب اتغيرت أثناء التسليم، حدّث الصفحة وجرّب تاني.",
        });
      }
      return { ok: true as const };
    }),

  review: adminProcedure.input(reviewInput).mutation(async ({ ctx, input }) => {
    const db = await requireDb();
    const feedback = input.feedback.trim() || null;
    const transition = reviewHomework(
      "submitted",
      input.action,
      input.score,
      feedback
    );
    if (!transition) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "بيانات التصحيح غير صحيحة.",
      });
    }
    const result = await db
      .update(studentTasks)
      .set({
        status: transition.status,
        feedback: transition.feedback,
        score: transition.score,
        reviewedAt: new Date(),
        reviewedBy: ctx.user.id,
      })
      .where(
        and(
          eq(studentTasks.id, input.taskId),
          eq(studentTasks.status, "submitted")
        )
      );
    if (affectedRows(result) === 0) {
      const task = await taskForConflict(db, input.taskId);
      if (!task) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "الواجب غير موجود.",
        });
      }
      if (task.status !== "submitted") {
        throw new TRPCError({
          code: "CONFLICT",
          message: "التصحيح متاح للواجبات اللي الطالب سلّمها بس.",
        });
      }
      throw new TRPCError({
        code: "CONFLICT",
        message: "حالة الواجب اتغيرت أثناء التصحيح، حدّث الصفحة وجرّب تاني.",
      });
    }
    return { ok: true as const };
  }),
});
