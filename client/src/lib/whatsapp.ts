/**
 * The support line is stored base64-encoded and only decoded in the browser to
 * build a wa.me link, so it is never rendered as visible text on the site.
 */
const PAYLOAD = "MjAxMDIyNDEyMjQz";

function decode(value: string): string {
  try {
    return atob(value);
  } catch {
    return "";
  }
}

export function whatsappLink(message?: string): string {
  const number = decode(PAYLOAD);
  const text = message ?? "أهلًا 👋 عندي سؤال عن كورسات Link Me";
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

export function openWhatsApp(message?: string): void {
  window.open(whatsappLink(message), "_blank", "noopener,noreferrer");
}

export function bookingMessage(input: {
  name: string;
  phone: string;
  courseTitle: string;
  packageTitle: string;
  priceLabel: string;
  note?: string;
}): string {
  return [
    "السلام عليكم 👋",
    `أنا ${input.name} وعايز أحجز في Link Me.`,
    "",
    `📚 الكورس: ${input.courseTitle}`,
    `🎟️ الباقة: ${input.packageTitle}`,
    `💰 السعر: ${input.priceLabel}`,
    `📱 رقمي: ${input.phone}`,
    ...(input.note?.trim() ? [`ملاحظتي: ${input.note.trim()}`] : []),
    "",
    "الدفع: فودافون كاش أو إنستاباي",
    "مستني التأكيد وطريقة الدفع 🙏",
  ].join("\n");
}
