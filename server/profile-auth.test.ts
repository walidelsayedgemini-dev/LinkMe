import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";
import { hashPassword } from "./auth";
import { sessions } from "../drizzle/schema";

const mocks = vi.hoisted(() => ({ getDb: vi.fn() }));
vi.mock("./db", () => ({ getDb: mocks.getDb }));

import { authRouter } from "./routers/auth";

function context(user: any): TrpcContext {
  return {
    req: { headers: {}, ip: "profile-auth-test" } as TrpcContext["req"],
    res: { cookie: vi.fn() } as unknown as TrpcContext["res"],
    user,
  };
}

describe("profile auth regressions", () => {
  beforeEach(() => vi.clearAllMocks());

  it("allows English level to be explicitly cleared with null", async () => {
    const set = vi
      .fn()
      .mockReturnValue({ where: vi.fn(async () => undefined) });
    const db = {
      update: vi.fn(() => ({ set })),
      select: vi.fn(() => {
        const query: any = {};
        query.from = () => query;
        query.where = () => query;
        query.limit = () =>
          Promise.resolve([{ id: 4, name: "طالب", englishLevel: null }]);
        return query;
      }),
    };
    mocks.getDb.mockResolvedValue(db);
    const user = {
      id: 4,
      role: "user",
      passwordHash: hashPassword("old-password"),
    };

    await authRouter
      .createCaller(context(user))
      .updateProfile({ englishLevel: null });
    expect(set).toHaveBeenCalledWith({ englishLevel: null });
  });

  it("invalidates all sessions, then creates a rotated current session", async () => {
    const txDelete = vi
      .fn()
      .mockReturnValue({ where: vi.fn(() => Promise.resolve()) });
    const txUpdate = vi.fn(() => ({
      set: vi.fn(() => ({ where: vi.fn(() => Promise.resolve()) })),
    }));
    const db = {
      transaction: vi.fn(async (callback: (tx: any) => Promise<void>) =>
        callback({ update: txUpdate, delete: txDelete })
      ),
      insert: vi.fn(() => ({ values: vi.fn(() => Promise.resolve()) })),
    };
    mocks.getDb.mockResolvedValue(db);
    const user = {
      id: 12,
      role: "admin",
      passwordHash: hashPassword("old-password"),
    };
    const ctx = context(user);

    await authRouter.createCaller(ctx).changePassword({
      currentPassword: "old-password",
      newPassword: "new-password-123",
    });

    expect(txDelete).toHaveBeenCalledWith(sessions);
    expect(txUpdate).toHaveBeenCalled();
    expect(db.insert).toHaveBeenCalled();
    expect((ctx.res as any).cookie).toHaveBeenCalled();
  });
});
