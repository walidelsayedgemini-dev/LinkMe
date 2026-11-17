import { randomUUID } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import {
  chatMessages,
  courses,
  enrollments,
  orders,
  paymentReceipts,
  plans,
  premiumMemberships,
  subscriptions,
  users,
} from "../../drizzle/schema";
import { endDateForDuration } from "../premium/dates";
import { enforceRateLimit } from "../rate-limit";
import { storagePut } from "../storage";
import { adminProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";

async function requireDb() {
  const db = await getDb();
  if (!db) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "تعذر الاتصال بقاعدة البيانات. حاول مرة أخرى.",
    });
  }
  return db;
}

const methodSchema = z.enum(["vodafone_cash", "instapay"]);
const targetTypeSchema = z.enum(["course", "premium", "plan"]);

export const receiptsRouter = router({
  /**
   * Student submits a payment receipt for review.
   */
  submit: protectedProcedure
    .input(
      z.object({
        method: methodSchema,
        targetType: targetTypeSchema,
        targetId: z.string().trim().min(1).max(120),
        targetTitle: z.string().trim().min(1).max(200),
        amountCents: z.number().int().positive("المبلغ يجب أن يكون أكبر من صفر"),
        senderPhoneOrHandle: z
          .string()
          .trim()
          .min(3, "اكتب رقم المحفظة أو اسم حساب إنستاباي")
          .max(100),
        transactionReference: z.string().trim().max(120).optional(),
        receiptImage: z
          .string()
          .min(10, "برجاء إرفاق صورة الإيصال"),
        note: z.string().trim().max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      enforceRateLimit(ctx.req, "receipt_submit", 10, 10 * 60 * 1000);
      const db = await requireDb();

      let imageUrl = input.receiptImage;

      // If client supplied a data URL (Base64), save it safely to storage
      if (input.receiptImage.startsWith("data:image/")) {
        const matches = input.receiptImage.match(
          /^data:image\/(jpeg|jpg|png|webp);base64,(.+)$/
        );
        if (!matches || !matches[2]) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "صيغة صورة الإيصال غير مدعومة. استخدم JPEG أو PNG أو WEBP.",
          });
        }
        const ext = matches[1] === "jpeg" ? "jpg" : matches[1];
        const contentType = `image/${matches[1] === "jpg" ? "jpeg" : matches[1]}`;
        const buffer = Buffer.from(matches[2], "base64");

        if (buffer.length > 5 * 1024 * 1024) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "حجم صورة الإيصال أكبر من 5 ميجابايت.",
          });
        }

        const key = `receipts/user-${ctx.user.id}/${randomUUID()}.${ext}`;
        const stored = await storagePut(key, buffer, contentType);
        imageUrl = stored.url;
      }

      const [result] = await db.insert(paymentReceipts).values({
        userId: ctx.user.id,
        method: input.method,
        targetType: input.targetType,
        targetId: input.targetId,
        targetTitle: input.targetTitle,
        amountCents: input.amountCents,
        currency: "EGP",
        senderPhoneOrHandle: input.senderPhoneOrHandle,
        transactionReference: input.transactionReference ?? null,
        receiptImageUrl: imageUrl,
        note: input.note ?? null,
        status: "pending",
      });

      return {
        ok: true as const,
        id: result?.insertId,
        status: "pending" as const,
      };
    }),

  /**
   * Get all receipts submitted by the current student.
   */
  myReceipts: protectedProcedure.query(async ({ ctx }) => {
    const db = await requireDb();
    return db
      .select()
      .from(paymentReceipts)
      .where(eq(paymentReceipts.userId, ctx.user.id))
      .orderBy(desc(paymentReceipts.createdAt));
  }),

  /**
   * Check if the user has an active pending receipt for a specific course or package.
   */
  activePendingReceipt: protectedProcedure
    .input(
      z.object({
        targetType: targetTypeSchema,
        targetId: z.string().trim().min(1),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await requireDb();
      const [pending] = await db
        .select()
        .from(paymentReceipts)
        .where(
          and(
            eq(paymentReceipts.userId, ctx.user.id),
            eq(paymentReceipts.targetType, input.targetType),
            eq(paymentReceipts.targetId, input.targetId),
            eq(paymentReceipts.status, "pending")
          )
        )
        .orderBy(desc(paymentReceipts.createdAt))
        .limit(1);

      return pending ?? null;
    }),

  /**
   * Admin: List receipts with optional status filter and student details.
   */
  adminList: adminProcedure
    .input(
      z
        .object({
          status: z.enum(["all", "pending", "approved", "rejected"]).default("all"),
        })
        .default({ status: "all" })
    )
    .query(async ({ input }) => {
      const db = await requireDb();

      const query = db
        .select({
          id: paymentReceipts.id,
          userId: paymentReceipts.userId,
          method: paymentReceipts.method,
          targetType: paymentReceipts.targetType,
          targetId: paymentReceipts.targetId,
          targetTitle: paymentReceipts.targetTitle,
          amountCents: paymentReceipts.amountCents,
          currency: paymentReceipts.currency,
          senderPhoneOrHandle: paymentReceipts.senderPhoneOrHandle,
          transactionReference: paymentReceipts.transactionReference,
          receiptImageUrl: paymentReceipts.receiptImageUrl,
          note: paymentReceipts.note,
          status: paymentReceipts.status,
          rejectionReason: paymentReceipts.rejectionReason,
          reviewedBy: paymentReceipts.reviewedBy,
          reviewedAt: paymentReceipts.reviewedAt,
          createdAt: paymentReceipts.createdAt,
          studentName: users.name,
          studentEmail: users.email,
          studentPhone: users.phone,
        })
        .from(paymentReceipts)
        .leftJoin(users, eq(paymentReceipts.userId, users.id))
        .orderBy(desc(paymentReceipts.createdAt))
        .limit(200);

      if (input.status !== "all") {
        return query.where(eq(paymentReceipts.status, input.status));
      }
      return query;
    }),

  /**
   * Admin: Get statistics on receipts.
   */
  adminStats: adminProcedure.query(async () => {
    const db = await requireDb();
    const all = await db
      .select({
        status: paymentReceipts.status,
        amountCents: paymentReceipts.amountCents,
      })
      .from(paymentReceipts);

    let pendingCount = 0;
    let approvedCount = 0;
    let rejectedCount = 0;
    let totalApprovedCents = 0;

    for (const item of all) {
      if (item.status === "pending") pendingCount++;
      else if (item.status === "approved") {
        approvedCount++;
        totalApprovedCents += item.amountCents;
      } else if (item.status === "rejected") {
        rejectedCount++;
      }
    }

    return {
      pendingCount,
      approvedCount,
      rejectedCount,
      totalApprovedCents,
      totalCount: all.length,
    };
  }),

  /**
   * Admin: Approve a receipt, verify payment, and immediately activate access in one transaction.
   */
  adminApprove: adminProcedure
    .input(
      z.object({
        receiptId: z.number().int().positive(),
        coachUserId: z.number().int().positive().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();

      return db.transaction(async tx => {
        const [receipt] = await tx
          .select()
          .from(paymentReceipts)
          .where(eq(paymentReceipts.id, input.receiptId))
          .for("update")
          .limit(1);

        if (!receipt) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "طلب الإيصال غير موجود.",
          });
        }

        if (receipt.status === "approved") {
          return { ok: true, alreadyApproved: true };
        }

        const now = new Date();

        // 1. Activate based on targetType
        if (receipt.targetType === "course") {
          const [course] = await tx
            .select()
            .from(courses)
            .where(eq(courses.slug, receipt.targetId))
            .limit(1);

          if (course) {
            const [existing] = await tx
              .select({ id: enrollments.id })
              .from(enrollments)
              .where(
                and(
                  eq(enrollments.userId, receipt.userId),
                  eq(enrollments.courseId, course.id)
                )
              )
              .limit(1);

            if (!existing) {
              await tx.insert(enrollments).values({
                userId: receipt.userId,
                courseId: course.id,
                source: "purchase",
                enrolledAt: now,
              });
            }

            await tx.insert(orders).values({
              userId: receipt.userId,
              kind: "course",
              courseId: course.id,
              amountCents: receipt.amountCents,
              currency: receipt.currency,
              status: "paid",
              provider: receipt.method,
              reference: `receipt:${receipt.id} ref:${receipt.transactionReference ?? "none"}`,
              createdAt: now,
            });
          }
        } else if (receipt.targetType === "premium") {
          let levels = ["A1"];
          try {
            const parsed = JSON.parse(receipt.targetId);
            if (Array.isArray(parsed) && parsed.length > 0) {
              levels = parsed;
            }
          } catch {
            levels = [receipt.targetId];
          }

          const durationDays = 365; // standard duration for mastery plan
          const endDate = endDateForDuration(now, durationDays);

          const membershipValues = {
            userId: receipt.userId,
            levels: JSON.stringify(levels),
            startDate: now,
            endDate,
            status: "active" as const,
            durationDays,
            paidAmountCents: receipt.amountCents,
            paymentReference: `receipt:${receipt.id} ${receipt.method}`,
            activatedBy: ctx.user.id,
            coachUserId: input.coachUserId ?? null,
            createdAt: now,
            updatedAt: now,
          };

          const [membershipResult] = await tx
            .insert(premiumMemberships)
            .values(membershipValues);

          const membershipId = membershipResult?.insertId;

          await tx.insert(orders).values({
            userId: receipt.userId,
            kind: "subscription",
            amountCents: receipt.amountCents,
            currency: receipt.currency,
            status: "paid",
            provider: receipt.method,
            reference: `premium:${membershipId ?? receipt.id} receipt:${receipt.id}`,
            createdAt: now,
          });
        } else if (receipt.targetType === "plan") {
          const [plan] = await tx
            .select()
            .from(plans)
            .where(eq(plans.slug, receipt.targetId))
            .limit(1);

          if (plan) {
            const currentPeriodEnd = new Date(
              now.getTime() + 30 * 24 * 60 * 60 * 1000
            );

            await tx.insert(subscriptions).values({
              userId: receipt.userId,
              planId: plan.id,
              billingCycle: "monthly",
              status: "active",
              currentPeriodEnd,
              createdAt: now,
            });

            await tx.insert(orders).values({
              userId: receipt.userId,
              kind: "subscription",
              planId: plan.id,
              amountCents: receipt.amountCents,
              currency: receipt.currency,
              status: "paid",
              provider: receipt.method,
              reference: `plan:${plan.id} receipt:${receipt.id}`,
              createdAt: now,
            });
          }
        }

        // 2. Mark receipt as approved
        await tx
          .update(paymentReceipts)
          .set({
            status: "approved",
            reviewedBy: ctx.user.id,
            reviewedAt: now,
            updatedAt: now,
          })
          .where(eq(paymentReceipts.id, receipt.id));

        // 3. Send automated confirmation chat message to student
        await tx.insert(chatMessages).values({
          userId: receipt.userId,
          senderRole: "owner",
          body: `🎉 مرحباً بك! تم مراجعة وتأكيد تحويلك بنجاح (${receipt.method === "vodafone_cash" ? "فودافون كاش" : "إنستاباي"}).\nتم تفعيل وصولك إلى "${receipt.targetTitle}". نتمنى لك تجربة ممتعة وموفقة في رحلة التعلم! 🚀`,
          readByStudentAt: null,
          readByOwnerAt: now,
          createdAt: now,
        });

        return { ok: true as const, targetTitle: receipt.targetTitle };
      });
    }),

  /**
   * Admin: Reject a receipt with a clear reason sent to the student.
   */
  adminReject: adminProcedure
    .input(
      z.object({
        receiptId: z.number().int().positive(),
        reason: z
          .string()
          .trim()
          .min(3, "برجاء كتابة سبب الرفض لتوضيحه للطالب")
          .max(500),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();

      return db.transaction(async tx => {
        const [receipt] = await tx
          .select()
          .from(paymentReceipts)
          .where(eq(paymentReceipts.id, input.receiptId))
          .for("update")
          .limit(1);

        if (!receipt) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "طلب الإيصال غير موجود.",
          });
        }

        const now = new Date();

        await tx
          .update(paymentReceipts)
          .set({
            status: "rejected",
            rejectionReason: input.reason,
            reviewedBy: ctx.user.id,
            reviewedAt: now,
            updatedAt: now,
          })
          .where(eq(paymentReceipts.id, receipt.id));

        // Send chat notification explaining the rejection
        await tx.insert(chatMessages).values({
          userId: receipt.userId,
          senderRole: "owner",
          body: `⚠️ بخصوص طلبك لـ "${receipt.targetTitle}": تعذر التحقق من صحة التحويل للسبب التالي:\n"${input.reason}"\nيرجى مراجعة بيانات التحويل وإعادة رفع الإيصال الصحيح. نحن هنا لمساعدتك!`,
          readByStudentAt: null,
          readByOwnerAt: now,
          createdAt: now,
        });

        return { ok: true as const };
      });
    }),
});
