import { describe, expect, it } from "vitest";
import type { TrpcContext } from "./_core/context";
import { receiptsRouter } from "./routers/receipts";
import {
  PAYMENT_METHODS_CONFIG,
  RECEIPT_STATUS_LABELS,
} from "../shared/payment-config";

const context = (user: TrpcContext["user"]) =>
  ({
    req: { headers: {}, ip: "127.0.0.1" },
    res: {},
    user,
  }) as unknown as TrpcContext;

const studentUser = { id: 101, role: "user" } as TrpcContext["user"];
const adminUser = { id: 1, role: "admin" } as TrpcContext["user"];
const guestContext = context(null);

describe("payment receipts and automation", () => {
  it("verifies payment methods configuration integrity", () => {
    expect(PAYMENT_METHODS_CONFIG.vodafone_cash).toBeDefined();
    expect(PAYMENT_METHODS_CONFIG.vodafone_cash.numberOrHandle).toBeTruthy();
    expect(PAYMENT_METHODS_CONFIG.vodafone_cash.instructions.length).toBeGreaterThan(0);

    expect(PAYMENT_METHODS_CONFIG.instapay).toBeDefined();
    expect(PAYMENT_METHODS_CONFIG.instapay.numberOrHandle).toBeTruthy();
    expect(PAYMENT_METHODS_CONFIG.instapay.instructions.length).toBeGreaterThan(0);

    expect(RECEIPT_STATUS_LABELS.pending.labelAr).toBe("قيد المراجعة");
    expect(RECEIPT_STATUS_LABELS.approved.labelAr).toBe("تم التأكيد والتفعيل");
    expect(RECEIPT_STATUS_LABELS.rejected.labelAr).toBe("مرفوض");
  });

  it("enforces authentication on student procedures", async () => {
    const guestCaller = receiptsRouter.createCaller(guestContext);

    await expect(guestCaller.myReceipts()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });

    await expect(
      guestCaller.submit({
        method: "vodafone_cash",
        targetType: "course",
        targetId: "grammar",
        targetTitle: "كورس الجرامر",
        amountCents: 90000,
        senderPhoneOrHandle: "01022412243",
        receiptImage: "data:image/jpeg;base64,sample",
      })
    ).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("enforces admin authorization on management procedures", async () => {
    const studentCaller = receiptsRouter.createCaller(context(studentUser));

    await expect(studentCaller.adminList()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });

    await expect(studentCaller.adminStats()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });

    await expect(
      studentCaller.adminApprove({ receiptId: 1 })
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
    });

    await expect(
      studentCaller.adminReject({ receiptId: 1, reason: "بيانات خاطئة" })
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("rejects invalid input at schema validation boundary", async () => {
    const studentCaller = receiptsRouter.createCaller(context(studentUser));

    // @ts-expect-error invalid payment method
    await expect(
      studentCaller.submit({
        method: "bitcoin",
        targetType: "course",
        targetId: "test",
        targetTitle: "test",
        amountCents: 100,
        senderPhoneOrHandle: "0100",
        receiptImage: "data:image/jpeg;base64,sample",
      })
    ).rejects.toThrow();

    // Negative amount rejected
    await expect(
      studentCaller.submit({
        method: "vodafone_cash",
        targetType: "course",
        targetId: "test",
        targetTitle: "test",
        amountCents: -500,
        senderPhoneOrHandle: "0100",
        receiptImage: "data:image/jpeg;base64,sample",
      })
    ).rejects.toThrow();
  });
});
