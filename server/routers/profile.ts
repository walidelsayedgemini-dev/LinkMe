import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { studentProfileDetails } from "../../drizzle/profile-schema";
import { users } from "../../drizzle/schema";
import { getDb } from "../db";
import { protectedProcedure, router } from "../_core/trpc";
import { publicUser } from "./_shared";

const currentYear = new Date().getFullYear();
const optionalText = (max: number) => z.string().trim().max(max).nullable().optional();
export const profileUpdateSchema = z.object({
  name: z.string().trim().min(2, "اكتب اسمك من حرفين على الأقل").max(120).nullable().optional(),
  phone: z.string().trim().min(6, "اكتب رقم تليفون صحيح").max(40).regex(/^[+\d\s().-]+$/, "اكتب رقم تليفون صحيح").nullable().optional(),
  country: optionalText(80), city: optionalText(80),
  birthYear: z.number().int().min(1900).max(currentYear).nullable().optional(),
  schoolGrade: optionalText(80), learningGoal: optionalText(120),
  preferredStudyTime: z.enum(["morning", "afternoon", "evening", "flexible"]).nullable().optional(),
  dailyStudyMinutes: z.number().int().min(5).max(300).nullable().optional(),
  bio: optionalText(1200),
});
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
async function requireDb() {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "قاعدة البيانات مش متاحة دلوقتي. جرّب تاني." });
  return db;
}
type Database = NonNullable<Awaited<ReturnType<typeof getDb>>>;
type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];
async function readOwnProfile(userId: number, connection?: Database | Transaction) {
  const db = connection ?? await requireDb();
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "الحساب مش موجود" });
  const [details] = await db.select().from(studentProfileDetails).where(eq(studentProfileDetails.uid, userId)).limit(1);
  return {
    user: publicUser(user),
    details: details ? {
      city: details.city, birthYear: details.birthYear, schoolGrade: details.schoolGrade,
      learningGoal: details.learningGoal, preferredStudyTime: details.preferredStudyTime,
      dailyStudyMinutes: details.dailyStudyMinutes, bio: details.bio,
    } : null,
  };
}
export const profileRouter = router({
  mine: protectedProcedure.query(({ ctx }) => readOwnProfile(ctx.user.id)),
  update: protectedProcedure.input(profileUpdateSchema).mutation(async ({ input, ctx }) => {
    const db = await requireDb();
    const userChanges: Record<string, unknown> = {};
    const detailChanges: Record<string, unknown> = {};
    for (const field of ["name", "phone", "country", "learningGoal", "bio"] as const) {
      if (Object.prototype.hasOwnProperty.call(input, field)) userChanges[field] = input[field] ?? null;
    }
    for (const field of ["city", "birthYear", "schoolGrade", "learningGoal", "preferredStudyTime", "dailyStudyMinutes", "bio"] as const) {
      if (Object.prototype.hasOwnProperty.call(input, field)) detailChanges[field] = input[field] ?? null;
    }
    return db.transaction(async tx => {
      if (Object.keys(userChanges).length) await tx.update(users).set(userChanges).where(eq(users.id, ctx.user.id));
      if (Object.keys(detailChanges).length) await tx.insert(studentProfileDetails)
        .values({ uid: ctx.user.id, ...detailChanges } as typeof studentProfileDetails.$inferInsert)
        .onDuplicateKeyUpdate({ set: detailChanges });
      return readOwnProfile(ctx.user.id, tx);
    });
  }),
});
