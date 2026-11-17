export type BookingCatalogPackage = {
  title: string;
  priceCents: number;
  currency: "EGP";
};

export type StaticBookingCatalogEntry = {
  title: string;
  packages: Record<string, BookingCatalogPackage>;
};

const KIDS_PACKAGES: Record<string, BookingCatalogPackage> = {
  term: {
    title: "فيديوهات الترم (مسجّلة)",
    priceCents: 100_000,
    currency: "EGP",
  },
  session: {
    title: "سيشن خاصة أونلاين",
    priceCents: 20_000,
    currency: "EGP",
  },
};

/** Kids school years: each year is booked on its own. */
export const KIDS_GRADES = [
  { key: "kg1", title: "كي جي 1", stage: "kg" },
  { key: "kg2", title: "كي جي 2", stage: "kg" },
  { key: "g1", title: "الصف الأول الابتدائي", stage: "primary" },
  { key: "g2", title: "الصف الثاني الابتدائي", stage: "primary" },
  { key: "g3", title: "الصف الثالث الابتدائي", stage: "primary" },
  { key: "g4", title: "الصف الرابع الابتدائي", stage: "primary" },
  { key: "g5", title: "الصف الخامس الابتدائي", stage: "primary" },
  { key: "g6", title: "الصف السادس الابتدائي", stage: "primary" },
  { key: "p1", title: "الصف الأول الإعدادي", stage: "prep" },
  { key: "p2", title: "الصف الثاني الإعدادي", stage: "prep" },
  { key: "p3", title: "الصف الثالث الإعدادي", stage: "prep" },
] as const;

/** Kids lessons that are not part of the school curriculum. */
export const KIDS_EXTRA_LESSONS = [
  { key: "phonics", title: "أصوات الحروف (Phonics)" },
  { key: "stories", title: "قصص إنجليزية مصوّرة" },
  { key: "conversation", title: "محادثة وألعاب كلمات" },
  { key: "exam-prep", title: "مراجعة ونماذج امتحانات" },
] as const;

/**
 * Offers that are intentionally not represented as individual catalog rows.
 * The client may display a copy of these values, but booking persistence always
 * resolves them here on the server before writing a lead.
 */
export const STATIC_BOOKING_CATALOG: Record<string, StaticBookingCatalogEntry> =
  {
    "independence-path": {
      title: "مسار الاستقلال اللغوي",
      packages: {
        one: {
          title: "مستوى واحد",
          priceCents: 100_000,
          currency: "EGP",
        },
        three: {
          title: "3 مستويات مع بعض — خصم 500 ج.م",
          priceCents: 250_000,
          currency: "EGP",
        },
      },
    },
    "english-for-kids": {
      title: "إنجليزي الأطفال",
      packages: {
        term: {
          title: "فيديوهات الترم (مسجّلة)",
          priceCents: 100_000,
          currency: "EGP",
        },
        session: {
          title: "سيشن خاصة أونلاين",
          priceCents: 20_000,
          currency: "EGP",
        },
      },
    },
    ...Object.fromEntries(
      KIDS_GRADES.map(grade => [
        `english-for-kids-${grade.key}`,
        {
          title: `إنجليزي الأطفال — ${grade.title}`,
          packages: KIDS_PACKAGES,
        },
      ])
    ),
    ...Object.fromEntries(
      KIDS_EXTRA_LESSONS.map(lesson => [
        `kids-extra-${lesson.key}`,
        {
          title: `دروس إضافية للأطفال — ${lesson.title}`,
          packages: KIDS_PACKAGES,
        },
      ])
    ),
  };

export function normalizeArabicNumerals(value: string): string {
  return value.replace(/[٠-٩۰-۹]/g, character => {
    const code = character.charCodeAt(0);
    if (code >= 0x660 && code <= 0x669) return String(code - 0x660);
    return String(code - 0x6f0);
  });
}

/** Canonical local form. Reject malformed inputs rather than opening an incorrect contact. */
export function normalizeEgyptianPhone(value: string): string | null {
  const clean = normalizeArabicNumerals(value).replace(/[\s().-]/g, "");
  if (!/^(\+?20|0)?1[0125]\d{8}$/.test(clean)) return null;
  const national = clean.replace(/^\+?20/, "").replace(/^0/, "");
  return `0${national}`;
}

export function egyptianWhatsAppNumber(value: string): string | null {
  const local = normalizeEgyptianPhone(value);
  return local ? `20${local.slice(1)}` : null;
}
