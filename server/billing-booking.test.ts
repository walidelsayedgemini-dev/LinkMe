import { describe, expect, it } from "vitest";
import { paidTotalsByCurrency } from "../shared/billing";
import {
  normalizeEgyptianPhone,
  egyptianWhatsAppNumber,
} from "../shared/booking-catalog";
import { bookingMessage } from "../client/src/lib/whatsapp";

describe("billing and booking integrity (no database)", () => {
  it("separates currencies and counts only paid orders", () => {
    expect(
      paidTotalsByCurrency([
        { status: "paid", currency: "EGP", amountCents: 300000 },
        { status: "paid", currency: "EGP", amountCents: 100000 },
        { status: "paid", currency: "USD", amountCents: 3900 },
        { status: "refunded", currency: "EGP", amountCents: 100000 },
        { status: "pending", currency: "USD", amountCents: 7900 },
      ])
    ).toEqual([
      { currency: "EGP", amountCents: 400000 },
      { currency: "USD", amountCents: 3900 },
    ]);
  });
  it("normalizes local, national, international and Arabic phone forms", () => {
    for (const phone of [
      "01112345678",
      "1112345678",
      "+201112345678",
      "201112345678",
      "٠١١١٢٣٤٥٦٧٨",
      "+20 111-234-5678",
    ]) {
      expect(normalizeEgyptianPhone(phone)).toBe("01112345678");
      expect(egyptianWhatsAppNumber(phone)).toBe("201112345678");
    }
  });
  it("rejects malformed numbers instead of producing a wrong WhatsApp contact", () => {
    for (const phone of [
      "123",
      "+441112345678",
      "javascript:1112345678",
      "01912345678",
    ]) {
      expect(normalizeEgyptianPhone(phone)).toBeNull();
      expect(egyptianWhatsAppNumber(phone)).toBeNull();
    }
  });
  it("includes the optional booking note without undefined output", () => {
    const input = {
      name: "متعلم",
      phone: "01112345678",
      courseTitle: "المحادثة",
      packageTitle: "مستوى",
      priceLabel: "1000 جنيه",
    };
    expect(bookingMessage({ ...input, note: " مناسب مساءً " })).toContain(
      "ملاحظتي: مناسب مساءً"
    );
    expect(bookingMessage(input)).not.toContain("undefined");
  });
});
