import { describe, expect, it, vi } from "vitest";
const mock = vi.hoisted(() => ({ select: vi.fn() }));
vi.mock("./db", () => ({
  getDb: vi.fn(async () => ({ select: mock.select })),
}));
import { adminRouter } from "./routers/admin";
import type { TrpcContext } from "./_core/context";
describe("public launch keeps classroom links private", () => {
  it("does not retain legacy task endpoints that bypass submission checks", () => {
    expect(adminRouter._def.procedures).not.toHaveProperty("assignTask");
    expect(adminRouter._def.procedures).not.toHaveProperty("updateTask");
  });
  it("does not query live meeting links for a student with no enrollment", async () => {
    const where = vi.fn(async () => []);
    mock.select.mockReturnValue({ from: vi.fn(() => ({ where })) });
    const user = { id: 31, role: "user" } as TrpcContext["user"];
    const caller = adminRouter.createCaller({
      req: {},
      res: {},
      user,
    } as TrpcContext);
    expect(await caller.upcoming()).toEqual([]);
    expect(mock.select).toHaveBeenCalledTimes(1);
  });
  it("does not expose upcoming meeting URLs anonymously", async () => {
    const caller = adminRouter.createCaller({
      req: {},
      res: {},
      user: null,
    } as TrpcContext);
    await expect(caller.upcoming()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });
});
