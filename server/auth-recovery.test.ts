import { beforeEach, describe, expect, it, vi } from "vitest";
const mock = vi.hoisted(() => ({
  values: vi.fn().mockResolvedValue({}),
  insert: vi.fn(),
}));
vi.mock("./db", () => ({
  getDb: vi.fn(async () => ({ insert: mock.insert })),
}));
vi.mock("./rate-limit", () => ({ enforceRateLimit: vi.fn() }));
import { authRouter } from "./routers/auth";
import type { TrpcContext } from "./_core/context";
describe("account recovery never exposes password reset tokens", () => {
  beforeEach(() => {
    mock.insert.mockReturnValue({ values: mock.values });
    mock.values.mockClear();
  });
  it("accepts a support request without issuing a token or identifying account existence", async () => {
    const caller = authRouter.createCaller({
      req: {},
      res: {},
      user: null,
    } as TrpcContext);
    const result = await caller.requestPasswordReset({
      email: "owner@example.com",
    });
    expect(result).toEqual({ ok: true });
    expect(result).not.toHaveProperty("resetToken");
    expect(mock.values).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "owner@example.com",
        subject: "مساعدة آمنة في استعادة الحساب",
      })
    );
  });
});
