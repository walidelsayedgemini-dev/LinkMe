import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const mocks = vi.hoisted(() => ({ getDb: vi.fn() }));
vi.mock("./db", () => ({ getDb: mocks.getDb }));

import { profileRouter } from "./routers/profile";

function builder(rows: unknown[]) {
  const query: any = {};
  query.from = () => query;
  query.where = () => query;
  query.limit = () => Promise.resolve(rows);
  return query;
}

function context(id = 7): TrpcContext {
  return {
    req: { headers: {}, ip: "profile-test" } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
    user: { id, role: "user" } as TrpcContext["user"],
  };
}

describe("student profile router", () => {
  beforeEach(() => vi.clearAllMocks());

  it("reads only the authenticated user's profile and never accepts a target id", async () => {
    const db = {
      select: vi
        .fn()
        .mockImplementationOnce(() =>
          builder([{ id: 7, name: "سارة", phone: null, country: "مصر" }])
        )
        .mockImplementationOnce(() =>
          builder([{ uid: 7, city: "القاهرة", bio: "أحب المحادثة" }])
        ),
    };
    mocks.getDb.mockResolvedValue(db);

    const result = await profileRouter.createCaller(context(7)).mine();
    expect(result.user.id).toBe(7);
    expect(result.details?.city).toBe("القاهرة");
    expect(result).not.toHaveProperty("userId");
  });

  it("writes the authenticated id even when an untrusted target id is supplied", async () => {
    const setUser = vi
      .fn()
      .mockReturnValue({ where: vi.fn(async () => undefined) });
    const setDetails = vi.fn().mockReturnValue({
      onDuplicateKeyUpdate: vi.fn(async () => undefined),
    });
    const db = {
      update: vi.fn(() => ({ set: setUser })),
      insert: vi.fn(() => ({
        values: vi.fn(() => ({ onDuplicateKeyUpdate: setDetails })),
      })),
      select: vi
        .fn()
        .mockImplementationOnce(() =>
          builder([{ id: 7, name: "سارة", phone: null, country: null }])
        )
        .mockImplementationOnce(() =>
          builder([{ uid: 7, city: null, bio: null }])
        ),
    };
    Object.assign(db, { transaction: vi.fn(async (callback: (tx: typeof db) => unknown) => callback(db)) });
    mocks.getDb.mockResolvedValue(db);

    await profileRouter.createCaller(context(7)).update({
      name: "سارة الجديدة",
      city: "الإسكندرية",
      bio: null,
      // This is intentionally outside the public input contract.
      userId: 999,
    } as never);

    expect(setUser).toHaveBeenCalledWith({ name: "سارة الجديدة", bio: null });
    expect(setDetails).toHaveBeenCalledWith({
      set: { city: "الإسكندرية", bio: null },
    });
    expect(db.update).toHaveBeenCalledTimes(1);
    expect(db.insert).toHaveBeenCalledTimes(1);
  });

  it("requires authentication for mine", async () => {
    await expect(
      profileRouter.createCaller({ ...context(7), user: null }).mine()
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
