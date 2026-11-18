import { randomInt } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { issuedCertificates } from "../../drizzle/schema";
import { getDb } from "../db";
import { enforceRateLimit } from "../rate-limit";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateCertificateCode(): string {
  let suffix = "";
  for (let i = 0; i < 8; i++) {
    suffix += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  }
  return `LM-${suffix}`;
}

function normalizeCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

export const certificatesRouter = router({
  /**
   * Issue or update an officially verifiable certificate in the database.
   */
  issue: publicProcedure
    .input(
      z.object({
        existingCode: z.string().trim().max(32).optional(),
        studentName: z.string().trim().min(2, "اكتب اسمك بشكل صحيح").max(160),
        courseTitle: z.string().trim().min(2).max(240),
        levelTitle: z.string().trim().min(2).max(160),
        scorePercentage: z.number().int().min(0).max(100).default(100),
      })
    )
    .mutation(async ({ ctx, input }) => {
      enforceRateLimit(ctx.req, "cert_issue", 20, 15 * 60 * 1000);
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "قاعدة البيانات غير متاحة مؤقتاً.",
        });
      }

      if (input.existingCode) {
        const normalized = normalizeCode(input.existingCode);
        const [existing] = await db
          .select()
          .from(issuedCertificates)
          .where(eq(issuedCertificates.code, normalized))
          .limit(1);

        if (existing && (!existing.userId || existing.userId === ctx.user?.id)) {
          await db
            .update(issuedCertificates)
            .set({
              studentName: input.studentName,
              courseTitle: input.courseTitle,
              levelTitle: input.levelTitle,
              scorePercentage: input.scorePercentage,
            })
            .where(eq(issuedCertificates.id, existing.id));

          return {
            code: existing.code,
            studentName: input.studentName,
            courseTitle: input.courseTitle,
            levelTitle: input.levelTitle,
            scorePercentage: input.scorePercentage,
            issuedAt: existing.issuedAt,
          };
        }
      }

      // Generate unique code with retry on rare collision
      for (let attempt = 0; attempt < 5; attempt++) {
        const code = generateCertificateCode();
        const [clash] = await db
          .select({ id: issuedCertificates.id })
          .from(issuedCertificates)
          .where(eq(issuedCertificates.code, code))
          .limit(1);
        if (clash) continue;

        await db.insert(issuedCertificates).values({
          code,
          userId: ctx.user?.id ?? null,
          studentName: input.studentName,
          courseTitle: input.courseTitle,
          levelTitle: input.levelTitle,
          scorePercentage: input.scorePercentage,
          revoked: false,
        });

        const [created] = await db
          .select()
          .from(issuedCertificates)
          .where(eq(issuedCertificates.code, code))
          .limit(1);

        return {
          code: created.code,
          studentName: created.studentName,
          courseTitle: created.courseTitle,
          levelTitle: created.levelTitle,
          scorePercentage: created.scorePercentage,
          issuedAt: created.issuedAt,
        };
      }

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "تعذر توليد كود الشهادة، حاول مرة أخرى.",
      });
    }),

  /**
   * Public verification endpoint for /verify/:code and QR scans.
   */
  verify: publicProcedure
    .input(z.object({ code: z.string().trim().min(3).max(40) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "قاعدة البيانات غير متاحة مؤقتاً.",
        });
      }

      const normalized = normalizeCode(input.code);
      const [cert] = await db
        .select()
        .from(issuedCertificates)
        .where(eq(issuedCertificates.code, normalized))
        .limit(1);

      if (!cert) {
        return { valid: false as const, reason: "not_found" as const };
      }
      if (cert.revoked) {
        return { valid: false as const, reason: "revoked" as const };
      }

      return {
        valid: true as const,
        certificate: {
          code: cert.code,
          studentName: cert.studentName,
          courseTitle: cert.courseTitle,
          levelTitle: cert.levelTitle,
          scorePercentage: cert.scorePercentage,
          issuedAt: cert.issuedAt,
        },
      };
    }),

  /**
   * List all verified certificates issued to the current student.
   */
  myCertificates: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return db
      .select()
      .from(issuedCertificates)
      .where(eq(issuedCertificates.userId, ctx.user.id))
      .orderBy(desc(issuedCertificates.issuedAt));
  }),
});
