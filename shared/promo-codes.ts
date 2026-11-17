/**
 * Link Me — Promo Codes & Discount Engine
 */

export interface PromoCode {
  code: string;
  type: "percent" | "fixed_cents";
  value: number; // e.g. 20 for 20% or 10000 for 100 EGP
  descriptionAr: string;
  companionMessage?: {
    yassin: string;
    khadija: string;
  };
}

export const PROMO_CODES: Record<string, PromoCode> = {
  LINKME20: {
    code: "LINKME20",
    type: "percent",
    value: 20,
    descriptionAr: "خصم خاص 20% على إجمالي المبلغ",
    companionMessage: {
      yassin: "عاش يا بطل! وفّرت 20%، استثمر في نفسك بقوة! 🔥",
      khadija: "مبروك يا قمر! كود خصم 20% شغال ومتحمسة أبدأ معاكي 🌸",
    },
  },
  EGYPT100: {
    code: "EGYPT100",
    type: "fixed_cents",
    value: 10000, // 100 EGP
    descriptionAr: "خصم مباشر بقيمة 100 جنيه مصري",
    companionMessage: {
      yassin: "خصم 100 جنيه اتطبّق على طول! جاهز للانطلاق؟ 🚀",
      khadija: "وفّرتي 100 جنيه فوراً، خطوة حلوة أوي في طريقك 💫",
    },
  },
  YASSIN: {
    code: "YASSIN",
    type: "percent",
    value: 25,
    descriptionAr: "كود الكابتن ياسين — خصم حصري 25%",
    companionMessage: {
      yassin: "كودي الخاص ليك يا غالي! خصم 25% ومنتظرك في أول كورس! 💪🔥",
      khadija: "ياسين كريم أهو! خصم 25% ممتاز، يلا نذاكر! 🌟",
    },
  },
  KHADIJA: {
    code: "KHADIJA",
    type: "percent",
    value: 25,
    descriptionAr: "كود خديجة اللطيف — خصم حصري 25%",
    companionMessage: {
      yassin: "كود خديجة الجامد! خصم 25% مبروك عليك يا بطل 🚀",
      khadija: "هديتي ليكي مخصوص! خصم 25% ويلا نشد حيلنا من النهاردة 🌸✨",
    },
  },
  NEWME: {
    code: "NEWME",
    type: "percent",
    value: 15,
    descriptionAr: "خصم 15% لبداية السنة الجديدة وتجديد الشغف",
  },
};

export function applyPromoCode(
  rawCode: string,
  totalAmountCents: number
): {
  valid: boolean;
  promo?: PromoCode;
  discountCents: number;
  finalAmountCents: number;
  messageAr: string;
} {
  const normalized = rawCode.trim().toUpperCase();
  const promo = PROMO_CODES[normalized];

  if (!promo) {
    return {
      valid: false,
      discountCents: 0,
      finalAmountCents: totalAmountCents,
      messageAr: "كود الخصم غير صحيح أو منتهي الصلاحية",
    };
  }

  let discountCents = 0;
  if (promo.type === "percent") {
    discountCents = Math.round((totalAmountCents * promo.value) / 100);
  } else {
    discountCents = promo.value;
  }

  // Cap discount so price does not fall below zero
  discountCents = Math.min(discountCents, totalAmountCents);
  const finalAmountCents = Math.max(0, totalAmountCents - discountCents);

  return {
    valid: true,
    promo,
    discountCents,
    finalAmountCents,
    messageAr: promo.descriptionAr,
  };
}
