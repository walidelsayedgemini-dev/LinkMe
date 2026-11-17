import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import {
  contactMessages,
  courses,
  enrollments,
  orders,
  plans,
  subscriptions,
} from "../../drizzle/schema";
import { getDb } from "../db";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { parseList } from "./_shared";
import { enforceRateLimit } from "../rate-limit";

/** Paid bookings are verified by the owner. Public APIs never simulate a successful payment. */
export const billingRouter = router({
  plans: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    const rows = await db.select().from(plans).orderBy(asc(plans.position));
    return rows
      .filter(row => row.priceMonthlyCents > 0 && row.priceYearlyCents > 0)
      .map(row => ({ ...row, featureList: parseList(row.features) }));
  }),

  mySubscription: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;
    const [row] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, ctx.user.id))
      .orderBy(desc(subscriptions.createdAt))
      .limit(1);
    return row ?? null;
  }),

  checkoutCourse: protectedProcedure
    .input(z.object({ courseId: z.number().int() }))
    .mutation(async ({ input, ctx }) => {
      enforceRateLimit(ctx.req, "checkout", 20, 60 * 60 * 1000);
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "قاعدة البيانات غير متاحة",
        });
      const [course] = await db
        .select()
        .from(courses)
        .where(eq(courses.id, input.courseId))
        .limit(1);
      if (!course)
        throw new TRPCError({ code: "NOT_FOUND", message: "الكورس غير موجود" });

      const [existing] = await db
        .select({ id: enrollments.id })
        .from(enrollments)
        .where(
          and(
            eq(enrollments.userId, ctx.user.id),
            eq(enrollments.courseId, course.id)
          )
        )
        .limit(1);

      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message:
          "الكورس المدفوع بيتفعّل من الإدارة بعد تأكيد الحجز والدفع على واتساب.",
      });
    }),

  checkoutPlan: protectedProcedure
    .input(
      z.object({
        planId: z.number().int(),
        cycle: z.enum(["monthly", "yearly"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "قاعدة البيانات غير متاحة",
        });
      const [plan] = await db
        .select()
        .from(plans)
        .where(eq(plans.id, input.planId))
        .limit(1);
      if (!plan)
        throw new TRPCError({ code: "NOT_FOUND", message: "الخطة غير موجودة" });
      const amount =
        input.cycle === "monthly"
          ? plan.priceMonthlyCents
          : plan.priceYearlyCents;

      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message:
          "الاشتراك بيتفعّل بعد تأكيد الحجز والدفع؛ مفيش دفع تجريبي على الموقع.",
      });
    }),

  cancelSubscription: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db)
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "قاعدة البيانات غير متاحة",
      });
    await db
      .update(subscriptions)
      .set({ status: "canceled" })
      .where(eq(subscriptions.userId, ctx.user.id));
    return { ok: true };
  }),

  orders: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return db
      .select({
        id: orders.id,
        kind: orders.kind,
        amountCents: orders.amountCents,
        currency: orders.currency,
        status: orders.status,
        provider: orders.provider,
        reference: orders.reference,
        createdAt: orders.createdAt,
        courseTitle: courses.titleAr,
        courseSlug: courses.slug,
        planName: plans.nameAr,
      })
      .from(orders)
      .leftJoin(courses, eq(courses.id, orders.courseId))
      .leftJoin(plans, eq(plans.id, orders.planId))
      .where(eq(orders.userId, ctx.user.id))
      .orderBy(desc(orders.createdAt));
  }),

  sendMessage: publicProcedure
    .input(
      z.object({
        name: z.string().trim().min(2, "اكتب اسمك").max(160),
        email: z.string().trim().email("بريد إلكتروني غير صحيح"),
        subject: z.string().trim().min(3, "اكتب موضوع الرسالة").max(200),
        message: z.string().trim().min(10, "اكتب رسالة أطول قليلًا").max(3000),
      })
    )
    .mutation(async ({ input, ctx }) => {
      enforceRateLimit(ctx.req, "contact", 6, 60 * 60 * 1000);
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "قاعدة البيانات غير متاحة",
        });
      await db.insert(contactMessages).values({
        name: input.name,
        email: input.email.toLowerCase(),
        subject: input.subject,
        message: input.message,
        userId: ctx.user?.id ?? null,
      });
      return { ok: true };
    }),
});
