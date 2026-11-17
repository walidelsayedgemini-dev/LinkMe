import { createHash } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";
import { assessmentRouter } from "./routers/assessment";
import {
  catalogLevels,
  feedbackFor,
  gradeStage,
  makeSummary,
} from "./content/assessment/engine";
import type {
  AssessmentLevel,
  BankQuestion,
  StageReport,
} from "../shared/assessment";

const mockDb = vi.hoisted(() => ({
  select: vi.fn(),
  insert: vi.fn(),
  transaction: vi.fn(),
}));
vi.mock("./db", () => ({ getDb: vi.fn(async () => mockDb) }));

beforeEach(() => {
  vi.clearAllMocks();
});

const context = (user: TrpcContext["user"]) =>
  ({
    req: { headers: {}, ip: "assessment-test" },
    res: {},
    user,
  }) as TrpcContext;

function question(
  id: string,
  answer: number,
  skill: BankQuestion["skill"]
): BankQuestion {
  return {
    id,
    level: "A1",
    skill,
    format: "choice",
    prompt: id,
    context: "",
    options: ["one", "two", "three", "four"],
    answer,
    explanationAr: `شرح ${id}`,
  };
}

function report(
  level: AssessmentLevel,
  score: number,
  passed: boolean
): StageReport {
  return {
    level,
    score,
    total: 12,
    percent: Math.round((score / 12) * 100),
    passed,
    skills: {
      grammar: { correct: score >= 3 ? 3 : score, total: 3 },
      vocabulary: { correct: score >= 6 ? 3 : 0, total: 3 },
      usage: { correct: score >= 9 ? 3 : 0, total: 3 },
      reading: { correct: score === 12 ? 3 : 0, total: 3 },
    },
    feedback: [],
  };
}

function selectRows(rows: unknown[]) {
  const builder: Record<string, unknown> = {};
  builder.from = () => builder;
  builder.where = () => builder;
  builder.limit = async () => rows;
  return builder;
}

const tokenHash = (token: string) =>
  createHash("sha256").update(token).digest("hex");

describe("assessment engine", () => {
  it("keeps answer data out of public feedback questions", () => {
    const item = question("a1", 2, "grammar");
    expect(feedbackFor(item, 1)).toEqual({
      questionId: "a1",
      correct: false,
      correctIndex: 2,
      chosenIndex: 1,
      explanationAr: "شرح a1",
    });
    expect(Object.keys(item)).toContain("answer");
  });

  it("grades a twelve-question stage by skill and pass threshold", () => {
    const skills: BankQuestion["skill"][] = [
      "grammar",
      "vocabulary",
      "usage",
      "reading",
    ];
    const bank = Array.from({ length: 12 }, (_, index) =>
      question(`q${index}`, 0, skills[index % 4])
    );
    const answers = Object.fromEntries(
      bank.map(item => [item.id, item.answer])
    );
    const result = gradeStage(
      "A1",
      bank.map(item => item.id),
      answers,
      bank
    );
    expect(result.score).toBe(12);
    expect(result.percent).toBe(100);
    expect(result.passed).toBe(true);
    expect(result.skills.grammar).toEqual({ correct: 3, total: 3 });
    expect(result.feedback).toHaveLength(12);
  });

  it("aggregates reports and marks a failed A1 as below A1", () => {
    const summary = makeSummary(
      "placement",
      "A1",
      [report("A1", 8, false)],
      false,
      []
    );
    expect(summary.level).toBe("A1");
    expect(summary.belowA1).toBe(true);
    expect(summary.score).toBe(8);
    expect(summary.total).toBe(12);
    expect(summary.saved).toBe(false);
  });

  it("exposes the fixed six-level catalog counts", () => {
    expect(catalogLevels()).toEqual([
      { level: "A1", name: "أول خطوة", questionCount: 180 },
      { level: "A2", name: "أساس قوي", questionCount: 180 },
      { level: "B1", name: "اتكلم بثقة", questionCount: 180 },
      { level: "B2", name: "طلاقة ودقة", questionCount: 180 },
      { level: "C1", name: "فروق دقيقة", questionCount: 160 },
      { level: "C2", name: "تحدي الإتقان", questionCount: 120 },
    ]);
  });
});

describe("assessment session access boundaries", () => {
  it("rejects an invalid bearer token before exposing session state", async () => {
    const token = "correct-token-123456789012345678901234";
    mockDb.select.mockReturnValueOnce(
      selectRows([
        {
          id: "session-1",
          userId: null,
          tokenHash: tokenHash(token),
          state: JSON.stringify({
            mode: "placement",
            level: "A1",
            phase: "answering",
            questionIds: [],
            answers: {},
            reports: [],
            feedback: null,
            summary: null,
          }),
          updatedAt: new Date(),
          expiresAt: new Date(Date.now() + 60_000),
        },
      ])
    );
    const caller = assessmentRouter.createCaller(context(null));
    await expect(
      caller.resume({
        sessionId: "session-1",
        token: "wrong-token-123456789012345678901234",
      })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("refuses a saved account session to a different logged-in account", async () => {
    const token = "saved-session-token-12345678901234567890";
    mockDb.select.mockReturnValueOnce(
      selectRows([
        {
          id: "session-2",
          userId: 7,
          tokenHash: tokenHash(token),
          state: JSON.stringify({
            mode: "placement",
            level: "A1",
            phase: "answering",
            questionIds: [],
            answers: {},
            reports: [],
            feedback: null,
            summary: null,
          }),
          updatedAt: new Date(),
          expiresAt: new Date(Date.now() + 60_000),
        },
      ])
    );
    const caller = assessmentRouter.createCaller(
      context({ id: 8, role: "user" } as TrpcContext["user"])
    );
    await expect(
      caller.resume({ sessionId: "session-2", token })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("keeps catalog public without touching the database", async () => {
    const caller = assessmentRouter.createCaller(context(null));
    const result = await caller.catalog();
    expect(result.total).toBe(1000);
    expect(result.stageSize).toBe(12);
    expect(result.passPercent).toBe(75);
    expect(mockDb.select).not.toHaveBeenCalled();
  });
});
