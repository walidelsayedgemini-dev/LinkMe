import {
  createHash,
  randomBytes,
  randomUUID,
  timingSafeEqual,
} from "node:crypto";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { assessmentSessions, placementAttempts } from "../../drizzle/schema";
import {
  ASSESSMENT_BANK,
  catalogLevels,
  consecutivePlacementLevel,
  feedbackFor,
  gradeStage,
  makeSummary,
  publicQuestion,
  questionsForIds,
  selectStageQuestions,
} from "../content/assessment/engine";
import { getDb } from "../db";
import { publicProcedure, router } from "../_core/trpc";
import { enforceRateLimit } from "../rate-limit";
import {
  ASSESSMENT_LEVELS,
  PASS_PERCENT,
  STAGE_SIZE,
  type AssessmentLevel,
  type AssessmentSummary,
  type AssessmentView,
  type QuestionFeedback,
  type StageReport,
} from "@shared/assessment";

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const levelSchema = z.enum(ASSESSMENT_LEVELS);
const sessionInput = z.object({
  sessionId: z.string().trim().min(1).max(64),
  token: z.string().min(32).max(256),
});
const answerInput = sessionInput.extend({
  questionId: z.string().trim().min(1).max(128),
  optionIndex: z.number().int().min(0).max(3),
});
const startInput = z.object({
  mode: z.enum(["placement", "practice"]),
  level: levelSchema.optional(),
});

type AssessmentState = {
  mode: "placement" | "practice";
  level: AssessmentLevel;
  phase: AssessmentView["phase"];
  questionIds: string[];
  answers: Record<string, number>;
  reports: StageReport[];
  feedback: QuestionFeedback | null;
  summary: AssessmentSummary | null;
};

type SessionRow = typeof assessmentSessions.$inferSelect;
type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;
type Transaction = Parameters<Parameters<Db["transaction"]>[0]>[0];

type AuthenticatedSession = { row: SessionRow; state: AssessmentState };

function error(
  code:
    | "BAD_REQUEST"
    | "CONFLICT"
    | "FORBIDDEN"
    | "INTERNAL_SERVER_ERROR"
    | "NOT_FOUND"
    | "UNAUTHORIZED",
  message: string
): never {
  throw new TRPCError({ code, message });
}

async function requireDb(): Promise<Db> {
  const db = await getDb();
  if (!db)
    error(
      "INTERNAL_SERVER_ERROR",
      "قاعدة البيانات غير متاحة دلوقتي، جرّب تاني."
    );
  return db;
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function tokenMatches(token: string, storedHash: string): boolean {
  const candidate = Buffer.from(hashToken(token), "utf8");
  const expected = Buffer.from(storedHash, "utf8");
  return (
    candidate.length === expected.length && timingSafeEqual(candidate, expected)
  );
}

function parseState(raw: string): AssessmentState {
  try {
    const state = JSON.parse(raw) as AssessmentState;
    if (
      !state ||
      !Array.isArray(state.questionIds) ||
      !state.answers ||
      !Array.isArray(state.reports)
    ) {
      throw new Error("invalid state");
    }
    return {
      ...state,
      feedback: state.feedback ?? null,
      summary: state.summary ?? null,
    };
  } catch {
    error("INTERNAL_SERVER_ERROR", "جلسة التقييم تالفة.");
  }
}

function serializeState(state: AssessmentState): string {
  return JSON.stringify(state);
}

function assertOwner(
  row: SessionRow,
  ctxUserId: number | null | undefined
): void {
  if (row.userId !== null && row.userId !== ctxUserId) {
    error("FORBIDDEN", "الجلسة دي مرتبطة بحساب تاني.");
  }
}

function assertUsable(
  row: SessionRow,
  token: string,
  ctxUserId: number | null | undefined
): void {
  if (!tokenMatches(token, row.tokenHash))
    error("UNAUTHORIZED", "رمز جلسة التقييم غير صحيح.");
  if (row.expiresAt.getTime() <= Date.now())
    error("UNAUTHORIZED", "انتهت صلاحية جلسة التقييم.");
  assertOwner(row, ctxUserId);
}

async function lockedSession(
  tx: Transaction,
  input: z.infer<typeof sessionInput>,
  ctxUserId: number | null | undefined
): Promise<AuthenticatedSession> {
  // The lock serializes answer/finish/next operations for one session.
  const rows = await tx
    .select()
    .from(assessmentSessions)
    .where(eq(assessmentSessions.id, input.sessionId))
    .limit(1)
    .for("update");
  const row = rows[0];
  if (!row) error("NOT_FOUND", "جلسة التقييم غير موجودة.");
  assertUsable(row, input.token, ctxUserId);
  return { row, state: parseState(row.state) };
}

async function readSession(
  db: Db,
  input: z.infer<typeof sessionInput>,
  ctxUserId: number | null | undefined
): Promise<AuthenticatedSession> {
  const rows = await db
    .select()
    .from(assessmentSessions)
    .where(eq(assessmentSessions.id, input.sessionId))
    .limit(1);
  const row = rows[0];
  if (!row) error("NOT_FOUND", "جلسة التقييم غير موجودة.");
  assertUsable(row, input.token, ctxUserId);
  return { row, state: parseState(row.state) };
}

function currentQuestions(state: AssessmentState) {
  try {
    return questionsForIds(state.questionIds, ASSESSMENT_BANK);
  } catch {
    error("INTERNAL_SERVER_ERROR", "بنك أسئلة التقييم غير متاح.");
  }
}

function toView(
  state: AssessmentState,
  sessionId: string,
  token: string
): AssessmentView {
  const questions = currentQuestions(state);
  const lastReport = state.reports[state.reports.length - 1];
  return {
    sessionId,
    token,
    mode: state.mode,
    level: state.level,
    phase: state.phase,
    questions: questions.map(publicQuestion),
    answers: { ...state.answers },
    reports: state.reports,
    canAdvance:
      state.mode === "placement" &&
      state.phase === "stage-result" &&
      state.level !== "C2" &&
      Boolean(lastReport?.level === state.level && lastReport.passed),
    feedback: state.mode === "practice" ? state.feedback : null,
    feedbackByQuestionId: state.mode === "practice"
      ? Object.fromEntries(questions.filter(q => state.answers[q.id] !== undefined).map(q => [q.id, feedbackFor(q, state.answers[q.id])]))
      : {},
    summary: state.summary,
  };
}

async function saveState(
  tx: Transaction,
  sessionId: string,
  state: AssessmentState
): Promise<void> {
  await tx
    .update(assessmentSessions)
    .set({ state: serializeState(state), updatedAt: new Date() })
    .where(eq(assessmentSessions.id, sessionId));
}

function nextLevel(level: AssessmentLevel): AssessmentLevel | null {
  const index = ASSESSMENT_LEVELS.indexOf(level);
  return index >= 0 && index < ASSESSMENT_LEVELS.length - 1
    ? ASSESSMENT_LEVELS[index + 1]
    : null;
}

async function recommendationsForLevel(
  level: AssessmentLevel
): Promise<AssessmentSummary["recommendations"]> {
  // placement.ts owns the existing course recommendation policy. The dynamic import
  // avoids a router initialization cycle and lets the parent export that helper.
  const placementModule = (await import("./placement")) as unknown as {
    recommendationsFor?: (
      level: "A1" | "A2" | "B1" | "B2" | "C1"
    ) => Promise<unknown[]>;
  };
  if (typeof placementModule.recommendationsFor !== "function") return [];
  const recommendationLevel = level === "C2" ? "C1" : level;
  const rows = await placementModule.recommendationsFor(recommendationLevel);
  return rows.map(row => {
    const item = row as Record<string, unknown>;
    return {
      id: Number(item.id),
      slug: String(item.slug),
      titleAr: String(item.titleAr),
      title: String(item.title),
      coverImage: item.coverImage == null ? null : String(item.coverImage),
      priceCents: Number(item.priceCents),
      currency: String(item.currency),
      level: String(item.level),
    };
  });
}

function ensureAllAnswered(state: AssessmentState): void {
  if (
    state.questionIds.length !== STAGE_SIZE ||
    state.questionIds.some(id => !Number.isInteger(state.answers[id]))
  ) {
    error("CONFLICT", "جاوب على الأسئلة الـ12 كلها قبل إنهاء المرحلة.");
  }
}

export const assessmentRouter = router({
  catalog: publicProcedure.query(() => ({
    total: 1000,
    stageSize: STAGE_SIZE,
    passPercent: PASS_PERCENT,
    levels: catalogLevels(),
  })),

  start: publicProcedure.input(startInput).mutation(async ({ ctx, input }) => {
    enforceRateLimit(ctx.req, "assessment-start", 20, 10 * 60 * 1000);
    const db = await requireDb();
    const token = randomBytes(32).toString("base64url");
    const sessionId = randomUUID();
    const level: AssessmentLevel =
      input.mode === "placement" ? "A1" : (input.level ?? "A1");
    const questions = selectStageQuestions(level, ASSESSMENT_BANK);
    const now = new Date();
    const state: AssessmentState = {
      mode: input.mode,
      level,
      phase: "answering",
      questionIds: questions.map(question => question.id),
      answers: {},
      reports: [],
      feedback: null,
      summary: null,
    };
    await db.insert(assessmentSessions).values({
      id: sessionId,
      userId: ctx.user?.id ?? null,
      tokenHash: hashToken(token),
      state: serializeState(state),
      updatedAt: now,
      expiresAt: new Date(now.getTime() + SESSION_TTL_MS),
    });
    return toView(state, sessionId, token);
  }),

  resume: publicProcedure.input(sessionInput).query(async ({ ctx, input }) => {
    const db = await requireDb();
    const { state } = await readSession(db, input, ctx.user?.id);
    return toView(state, input.sessionId, input.token);
  }),

  answer: publicProcedure
    .input(answerInput)
    .mutation(async ({ ctx, input }) => {
      enforceRateLimit(ctx.req, "assessment-answer", 240, 60 * 60 * 1000);
      const db = await requireDb();
      const state = await db.transaction(async tx => {
        const session = await lockedSession(tx, input, ctx.user?.id);
        if (session.state.phase !== "answering")
          error("CONFLICT", "المرحلة دي اتقفلت بالفعل.");
        if (!session.state.questionIds.includes(input.questionId))
          error("BAD_REQUEST", "السؤال مش موجود في المرحلة الحالية.");
        const existing = session.state.answers[input.questionId];
        if (existing !== undefined) {
          if (existing !== input.optionIndex)
            error("CONFLICT", "الإجابة لا يمكن تغييرها بعد إرسالها.");
          return session.state;
        }
        const question = currentQuestions(session.state).find(
          item => item.id === input.questionId
        );
        if (!question)
          error("BAD_REQUEST", "السؤال مش موجود في المرحلة الحالية.");
        const nextState: AssessmentState = {
          ...session.state,
          answers: {
            ...session.state.answers,
            [input.questionId]: input.optionIndex,
          },
          feedback:
            session.state.mode === "practice"
              ? feedbackFor(question, input.optionIndex)
              : null,
        };
        await saveState(tx, input.sessionId, nextState);
        return nextState;
      });
      return toView(state, input.sessionId, input.token);
    }),

  finishStage: publicProcedure
    .input(sessionInput)
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      const state = await db.transaction(async tx => {
        const session = await lockedSession(tx, input, ctx.user?.id);
        if (session.state.phase === "stage-result") return session.state;
        if (session.state.phase === "completed") return session.state;
        if (session.state.phase !== "answering")
          error("CONFLICT", "تسلسل المرحلة غير صحيح.");
        ensureAllAnswered(session.state);
        const report = gradeStage(
          session.state.level,
          session.state.questionIds,
          session.state.answers,
          ASSESSMENT_BANK
        );
        const nextState: AssessmentState = {
          ...session.state,
          phase: "stage-result",
          reports: [...session.state.reports, report],
          feedback: null,
        };
        await saveState(tx, input.sessionId, nextState);
        return nextState;
      });
      return toView(state, input.sessionId, input.token);
    }),

  nextStage: publicProcedure
    .input(sessionInput)
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      const state = await db.transaction(async tx => {
        const session = await lockedSession(tx, input, ctx.user?.id);
        if (session.state.mode !== "placement")
          error("CONFLICT", "وضع التدريب لا ينتقل لمستوى جديد.");
        if (session.state.phase !== "stage-result")
          error("CONFLICT", "لازم تنهي المرحلة الحالية الأول.");
        const report = session.state.reports[session.state.reports.length - 1];
        if (!report || report.level !== session.state.level || !report.passed) {
          error("CONFLICT", "لا يمكن الانتقال بعد عدم اجتياز المرحلة.");
        }
        const level = nextLevel(session.state.level);
        if (!level) error("CONFLICT", "وصلت لآخر مستوى في القياس.");
        const questions = selectStageQuestions(level, ASSESSMENT_BANK);
        const nextState: AssessmentState = {
          ...session.state,
          level,
          phase: "answering",
          questionIds: questions.map(question => question.id),
          answers: {},
          feedback: null,
        };
        await saveState(tx, input.sessionId, nextState);
        return nextState;
      });
      return toView(state, input.sessionId, input.token);
    }),

  finish: publicProcedure
    .input(sessionInput)
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      const snapshot = await readSession(db, input, ctx.user?.id);
      if (snapshot.state.phase === "completed")
        return toView(snapshot.state, input.sessionId, input.token);
      if (snapshot.state.phase !== "stage-result")
        error("CONFLICT", "كمّل المرحلة الحالية قبل عرض النتيجة.");
      const recommendationLevel =
        snapshot.state.mode === "placement"
          ? consecutivePlacementLevel(snapshot.state.reports).level
          : snapshot.state.level;
      const recommendations =
        await recommendationsForLevel(recommendationLevel);
      const state = await db.transaction(async tx => {
        const session = await lockedSession(tx, input, ctx.user?.id);
        if (session.state.phase === "completed") return session.state;
        if (session.state.phase !== "stage-result")
          error("CONFLICT", "كمّل المرحلة الحالية قبل عرض النتيجة.");
        const saved =
          session.state.mode === "placement" &&
          session.row.userId !== null &&
          session.row.userId === ctx.user?.id;
        const summary = makeSummary(
          session.state.mode,
          session.state.level,
          session.state.reports,
          saved,
          recommendations
        );
        if (saved && session.state.summary === null) {
          await tx.insert(placementAttempts).values({
            userId: ctx.user!.id,
            score: summary.score,
            total: summary.total,
            level: summary.level,
            skills: JSON.stringify({
              ...summary.skills,
              _assessment: {
                belowA1: summary.belowA1,
                source: "staged-text-v1",
              },
            }),
          });
        }
        const nextState: AssessmentState = {
          ...session.state,
          phase: "completed",
          summary,
          feedback: null,
        };
        await saveState(tx, input.sessionId, nextState);
        return nextState;
      });
      return toView(state, input.sessionId, input.token);
    }),
});
