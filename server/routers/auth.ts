import { randomBytes } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { contactMessages, sessions, users } from "../../drizzle/schema";
import { getDb } from "../db";
import {
  consumeResetToken,
  createSession,
  destroySession,
  hashPassword,
  normalizeEmail,
  resolveOwnerCode,
  verifyPassword,
} from "../auth";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { publicUser } from "./_shared";
import { enforceRateLimit } from "../rate-limit";

const emailSchema = z.string().trim().email("اكتب بريدًا إلكترونيًا صحيحًا");
const passwordSchema = z
  .string()
  .min(8, "كلمة المرور لا تقل عن 8 أحرف")
  .max(100);

export const authRouter = router({
  me: publicProcedure.query(({ ctx }) =>
    ctx.user ? publicUser(ctx.user) : null
  ),

  signup: publicProcedure
    .input(
      z.object({
        name: z.string().trim().min(2, "الاسم قصير جدًا").max(120),
        email: emailSchema,
        password: passwordSchema,
        role: z.literal("user").default("user"),
        headline: z.string().trim().max(160).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      enforceRateLimit(ctx.req, "signup", 8, 60 * 60 * 1000);
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "قاعدة البيانات غير متاحة",
        });
      const email = normalizeEmail(input.email);
      const existing = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      if (existing.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "هذا البريد مسجل بالفعل. جرّب تسجيل الدخول.",
        });
      }
      const openId = `local_${randomBytes(12).toString("hex")}`;
      const result = await db.insert(users).values({
        openId,
        name: input.name,
        email,
        passwordHash: hashPassword(input.password),
        role: "user",
        headline: input.headline ?? "متعلّم لغة إنجليزية",
      });
      const userId = Number(result[0].insertId);

      await createSession(userId, ctx.res);
      const [created] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      return publicUser(created);
    }),

  /** Owner sign-in: one secret code, no email or password needed. */
  ownerLogin: publicProcedure
    .input(
      z.object({
        code: z
          .string()
          .trim()
          .min(8, "اكتب رمز المالك")
          .max(80),
      })
    )
    .mutation(async ({ input, ctx }) => {
      enforceRateLimit(ctx.req, "owner-code", 10, 15 * 60 * 1000);
      const user = await resolveOwnerCode(input.code);
      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "الرمز مش صحيح. راجع الرمز أو ولّد رمزًا جديدًا.",
        });
      }
      await createSession(user.id, ctx.res);
      return { ok: true as const, role: user.role };
    }),
  login: publicProcedure
    .input(
      z.object({
        email: emailSchema,
        password: z.string().min(1, "اكتب كلمة المرور"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      enforceRateLimit(ctx.req, "login", 12, 15 * 60 * 1000);
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "قاعدة البيانات غير متاحة",
        });
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, normalizeEmail(input.email)))
        .limit(1);
      if (!user || !verifyPassword(input.password, user.passwordHash)) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "البريد أو كلمة المرور غير صحيحة",
        });
      }
      await db
        .update(users)
        .set({ lastSignedIn: new Date() })
        .where(eq(users.id, user.id));
      await createSession(user.id, ctx.res);
      return publicUser(user);
    }),

  logout: publicProcedure.mutation(async ({ ctx }) => {
    await destroySession(ctx.req, ctx.res);
    return { success: true } as const;
  }),

  requestPasswordReset: publicProcedure
    .input(z.object({ email: emailSchema }))
    .mutation(async ({ input, ctx }) => {
      enforceRateLimit(ctx.req, "password-reset", 6, 60 * 60 * 1000);
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "قاعدة البيانات غير متاحة",
        });
      await db.insert(contactMessages).values({
        name: "طلب استعادة حساب",
        email: normalizeEmail(input.email),
        subject: "مساعدة آمنة في استعادة الحساب",
        message:
          "طلب المساعدة في استعادة الحساب. يجب التحقق من ملكية البريد قبل إرسال أي رابط خاص. لا يُصدر هذا الطلب رمز استعادة.",
      });
      return { ok: true };
    }),

  resetPassword: publicProcedure
    .input(z.object({ token: z.string().min(10), password: passwordSchema }))
    .mutation(async ({ input }) => {
      const ok = await consumeResetToken(input.token, input.password);
      if (!ok) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "رابط إعادة التعيين غير صالح أو منتهي",
        });
      }
      return { ok: true };
    }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().trim().min(2).max(120).optional(),
        headline: z.string().trim().max(160).optional(),
        bio: z.string().trim().max(1200).optional(),
        country: z.string().trim().max(80).optional(),
        phone: z.string().trim().max(40).optional(),
        englishLevel: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]).nullable().optional(),
        learningGoal: z.string().trim().max(120).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "قاعدة البيانات غير متاحة",
        });
      await db.update(users).set(input).where(eq(users.id, ctx.user.id));
      const [updated] = await db
        .select()
        .from(users)
        .where(eq(users.id, ctx.user.id))
        .limit(1);
      return publicUser(updated);
    }),

  changePassword: protectedProcedure
    .input(
      z.object({
        currentPassword: z.string().min(1),
        newPassword: passwordSchema,
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "قاعدة البيانات غير متاحة",
        });
      if (!verifyPassword(input.currentPassword, ctx.user.passwordHash)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "كلمة المرور الحالية غير صحيحة",
        });
      }
      await db.transaction(async tx => {
        await tx
          .update(users)
          .set({ passwordHash: hashPassword(input.newPassword) })
          .where(eq(users.id, ctx.user.id));
        // Rotate the current session after invalidating every other device.
        // Owner access codes are intentionally unrelated and remain untouched.
        await tx.delete(sessions).where(eq(sessions.userId, ctx.user.id));
      });
      await createSession(ctx.user.id, ctx.res);
      return { ok: true };
    }),
});
