import { TRPCError } from "@trpc/server";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { bookings, courses, plans } from "../../drizzle/schema";
import {
  STATIC_BOOKING_CATALOG,
  normalizeArabicNumerals,
  normalizeEgyptianPhone,
} from "../../shared/booking-catalog";
import { getDb } from "../db";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { enforceRateLimit } from "../rate-limit";

const phonePattern = /^(\+?20|0)?1[0125]\d{8}$/;
const cycleSchema = z.enum(["monthly", "yearly"]);
const phoneSchema = z
  .string()
  .trim()
  .max(32)
  .transform(normalizeArabicNumerals)
  .transform(value => value.replace(/[\s-]/g, ""))
  .refine(value => phonePattern.test(value), "رقم هاتف مصري غير صالح");

const bookingInput = z.object({
  name: z.string().trim().min(2).max(120),
  phone: phoneSchema,
  courseSlug: z.string().trim().max(140).optional(),
  packageId: z.string().trim().min(1).max(80),
  planSlug: z.string().trim().max(60).optional(),
  cycle: cycleSchema.optional(),
  note: z.string().trim().max(500).optional(),
});

type ResolvedBooking = {
  courseSlug: string | null;
  courseTitle: string;
  packageTitle: string;
  priceCents: number;
  currency: string;
};

async function resolveBookingOffer(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  input: z.infer<typeof bookingInput>
): Promise<ResolvedBooking> {
  if (input.planSlug) {
    if (input.courseSlug || !input.cycle || input.packageId !== input.cycle) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "اختيار الاشتراك غير صالح",
      });
    }
    const [plan] = await db
      .select()
      .from(plans)
      .where(eq(plans.slug, input.planSlug))
      .limit(1);
    if (!plan)
      throw new TRPCError({ code: "NOT_FOUND", message: "الخطة غير موجودة" });
    const priceCents =
      input.cycle === "monthly"
        ? plan.priceMonthlyCents
        : plan.priceYearlyCents;
    if (priceCents <= 0)
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "الباقة دي مش متاحة للحجز. اختار باقة مدفوعة.",
      });
    const cycleLabel = input.cycle === "monthly" ? "شهري" : "سنوي";
    return {
      courseSlug: null,
      courseTitle: plan.nameAr,
      packageTitle: `${plan.nameAr} — ${cycleLabel}`,
      priceCents,
      currency: "EGP",
    };
  }

  if (!input.courseSlug) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "اختار الكورس أو الاشتراك",
    });
  }
  const staticOffer = Object.hasOwn(STATIC_BOOKING_CATALOG, input.courseSlug)
    ? STATIC_BOOKING_CATALOG[input.courseSlug]
    : undefined;
  if (staticOffer) {
    const selected = Object.hasOwn(staticOffer.packages, input.packageId)
      ? staticOffer.packages[input.packageId]
      : undefined;
    if (!selected)
      throw new TRPCError({ code: "BAD_REQUEST", message: "الباقة غير متاحة" });
    return {
      courseSlug: input.courseSlug,
      courseTitle: staticOffer.title,
      packageTitle: selected.title,
      priceCents: selected.priceCents,
      currency: selected.currency,
    };
  }

  const [course] = await db
    .select()
    .from(courses)
    .where(eq(courses.slug, input.courseSlug))
    .limit(1);
  if (!course)
    throw new TRPCError({ code: "NOT_FOUND", message: "الكورس غير موجود" });
  if (!course.isPublished || course.priceCents <= 0)
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "الكورس ده مش متاح للحجز حاليًا.",
    });
  if (input.packageId !== "course") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "الباقة غير متاحة لهذا الكورس",
    });
  }
  return {
    courseSlug: course.slug,
    courseTitle: course.titleAr,
    packageTitle: `${course.titleAr} — حجز مباشر`,
    priceCents: course.priceCents,
    currency: course.currency,
  };
}

export const bookingsRouter = router({
  /** Public: capture a booking lead right before handing off to WhatsApp. */
  create: publicProcedure
    .input(bookingInput)
    .mutation(async ({ ctx, input }) => {
      enforceRateLimit(ctx.req, "booking", 12, 10 * 60 * 1000);
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "تعذر الاتصال بقاعدة البيانات. لم يتم تسجيل الحجز.",
        });

      const offer = await resolveBookingOffer(db, input);
      const digits = normalizeEgyptianPhone(input.phone);
      if (!digits)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "رقم الموبايل مش صالح.",
        });
      await db.insert(bookings).values({
        name: input.name,
        phone: digits,
        courseSlug: offer.courseSlug,
        courseTitle: offer.courseTitle,
        packageTitle: offer.packageTitle,
        priceCents: offer.priceCents,
        currency: offer.currency,
        note: input.note ?? null,
        userId: ctx.user?.id ?? null,
      });

      return {
        ok: true as const,
        courseTitle: offer.courseTitle,
        packageTitle: offer.packageTitle,
        priceCents: offer.priceCents,
        currency: offer.currency,
      };
    }),
  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        status: z.enum(["new", "contacted", "confirmed", "canceled"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin")
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "صلاحية الإدارة مطلوبة",
        });
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "تعذر الاتصال بقاعدة البيانات",
        });
      await db
        .update(bookings)
        .set({ status: input.status })
        .where(eq(bookings.id, input.id));
      return { ok: true };
    }),
  /** Admin: latest leads. */
  list: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user?.role !== "admin")
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "صلاحية الإدارة مطلوبة",
      });
    const db = await getDb();
    if (!db) return [];
    return db
      .select()
      .from(bookings)
      .orderBy(desc(bookings.createdAt))
      .limit(100);
  }),
});
