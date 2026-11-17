import { createHash } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";
import { assessmentRouter } from "./routers/assessment";
import { placementRouter } from "./routers/placement";
import type { StageReport } from "../shared/assessment";

const mocks = vi.hoisted(() => ({ getDb: vi.fn(), recommendationDb: null }));
vi.mock("./db", () => ({ getDb: mocks.getDb }));

const token = "test-only-bearer-token-with-32-characters";
const failingReport: StageReport = {
  level: "A1",
  score: 0,
  total: 12,
  percent: 0,
  passed: false,
  skills: {
    grammar: { correct: 0, total: 3 },
    vocabulary: { correct: 0, total: 3 },
    usage: { correct: 0, total: 3 },
    reading: { correct: 0, total: 3 },
  },
  feedback: [],
};
const context = (id: number) =>
  ({
    req: { headers: {}, ip: "fake-db-test" },
    res: {},
    user: { id, role: "user" },
  }) as TrpcContext;

function builder(rows: unknown[]) {
  const b: any = {};
  b.from = () => b;
  b.where = () => b;
  b.orderBy = () => b;
  b.limit = () => ({
    then: (resolve: any) => Promise.resolve(rows).then(resolve),
    for: async () => rows,
  });
  return b;
}

beforeEach(() => vi.clearAllMocks());

describe("assessment result ownership and lower-level metadata", () => {
  it.each([
    { sessionUserId: null, callerId: 7, shouldSave: false },
    { sessionUserId: 7, callerId: 7, shouldSave: true },
  ])(
    "does not attribute a guest result to the logged-in caller ($sessionUserId)",
    async ({ sessionUserId, callerId, shouldSave }) => {
      const row: any = {
        id: "fake-session",
        userId: sessionUserId,
        tokenHash: createHash("sha256").update(token).digest("hex"),
        state: JSON.stringify({
          mode: "placement",
          level: "A1",
          phase: "stage-result",
          questionIds: [],
          answers: {},
          reports: [failingReport],
          feedback: null,
          summary: null,
        }),
        expiresAt: new Date(Date.now() + 60_000),
        updatedAt: new Date(),
      };
      const values = vi.fn(async () => undefined);
      const db: any = {
        select: vi.fn(() => builder([row])),
        insert: vi.fn(() => ({ values })),
        update: vi.fn(() => ({
          set: (update: any) => ({
            where: async () => Object.assign(row, update),
          }),
        })),
      };
      db.transaction = (callback: any) => callback(db);
      // First DB call supplies the session; the recommendation lookup gets no DB.
      mocks.getDb.mockResolvedValueOnce(db).mockResolvedValueOnce(null);
      const caller = assessmentRouter.createCaller(context(callerId));
      const result = await caller.finish({ sessionId: row.id, token });
      expect(result.phase).toBe("completed");
      expect(result.summary?.saved).toBe(shouldSave);
      expect(result.summary?.belowA1).toBe(true);
      expect(values).toHaveBeenCalledTimes(shouldSave ? 1 : 0);
      if (shouldSave) {
        const inserted = values.mock.calls[0][0] as any;
        expect(inserted.userId).toBe(callerId);
        expect(JSON.parse(inserted.skills)._assessment.belowA1).toBe(true);
      }
      mocks.getDb.mockResolvedValueOnce(db);
      await caller.finish({ sessionId: row.id, token });
      expect(values).toHaveBeenCalledTimes(shouldSave ? 1 : 0);
    }
  );

  it("exposes the below-A1 flag in the latest saved result", async () => {
    mocks.getDb.mockResolvedValueOnce({
      select: () =>
        builder([
          {
            id: 1,
            userId: 7,
            level: "A1",
            score: 0,
            total: 12,
            skills: JSON.stringify({ _assessment: { belowA1: true } }),
          },
        ]),
    });
    const latest = await placementRouter.createCaller(context(7)).myLatest();
    expect(latest?.belowA1).toBe(true);
    expect(latest?.levelLabel).toBe("أقل من A1");
    expect(latest?.order).toBe(-1);
  });

  it("keeps historical rows without metadata compatible", async () => {
    mocks.getDb.mockResolvedValueOnce({
      select: () =>
        builder([
          { id: 1, userId: 7, level: "B1", score: 7, total: 12, skills: null },
        ]),
    });
    const latest = await placementRouter.createCaller(context(7)).myLatest();
    expect(latest?.belowA1).toBe(false);
    expect(latest?.levelLabel).toBe("B1");
  });
});
