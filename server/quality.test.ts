import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import {
  STATIC_BOOKING_CATALOG,
  normalizeArabicNumerals,
} from "../shared/booking-catalog";
import type { TrpcContext } from "./_core/context";

const context = (user: TrpcContext["user"]) =>
  ({ req: { headers: {}, ip: "test" }, res: {}, user }) as TrpcContext;

describe("Link Me quality and access rules (no DB writes)", () => {
  it("does not permit public instructor signup", async () => {
    const caller = appRouter.createCaller(context(null));
    await expect(
      caller.auth.signup({
        name: "اختبار",
        email: "quality@example.invalid",
        password: "test-password",
        role: "instructor" as "user",
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
  it("does not expose whole-school data anonymously", async () => {
    const caller = appRouter.createCaller(context(null));
    await expect(caller.admin.overview()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });
  it("does not allow an instructor to access every student", async () => {
    const user = { id: 1, role: "instructor" } as TrpcContext["user"];
    const caller = appRouter.createCaller(context(user));
    await expect(caller.admin.overview()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(caller.bookings.list()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });
  it("does not allow a student to grant paid access", async () => {
    const caller = appRouter.createCaller(
      context({ id: 1, role: "user" } as TrpcContext["user"])
    );
    await expect(
      caller.admin.grantAccess({
        userId: 1,
        kind: "course",
        itemId: 1,
        cycle: "monthly",
        paymentVerified: true,
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
  it("preserves the path bundle discount and kids prices", () => {
    expect(
      STATIC_BOOKING_CATALOG["independence-path"].packages.one.priceCents
    ).toBe(100_000);
    expect(
      STATIC_BOOKING_CATALOG["independence-path"].packages.three.priceCents
    ).toBe(250_000);
    expect(
      STATIC_BOOKING_CATALOG["english-for-kids"].packages.term.priceCents
    ).toBe(100_000);
    expect(
      STATIC_BOOKING_CATALOG["english-for-kids"].packages.session.priceCents
    ).toBe(20_000);
  });
  it("accepts Arabic and Persian digits without losing phone leading zero", () => {
    expect(normalizeArabicNumerals("٠١٠٢٢٤١٢٢٤٣")).toBe("01022412243");
    expect(normalizeArabicNumerals("۰۱۰۲۲۴۱۲۲۴۳")).toBe("01022412243");
  });
});
