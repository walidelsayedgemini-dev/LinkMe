import { TRPCError } from "@trpc/server";
import { asc, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { courses, lessons, modules } from "../../drizzle/schema";
import { getDb } from "../db";
import { adminProcedure, router } from "../_core/trpc";
import { publicCurriculumLesson } from "../course-visibility";

async function requireDb() {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "قاعدة البيانات مش متاحة دلوقتي." });
  return db;
}
const recordingUrl = z.string().trim().max(2000).nullable().optional().refine(value => {
  if (!value) return true;
  try { const url = new URL(value); return url.protocol === "https:" && !url.username && !url.password; } catch { return false; }
}, "رابط المحاضرة لازم يبدأ بـ https ومن غير بيانات دخول");
export const curriculumRouter = router({
  courses: adminProcedure.query(async () => {
    const db = await requireDb();
    const rows = await db.select({ id: courses.id, title: courses.title, titleAr: courses.titleAr, slug: courses.slug }).from(courses).orderBy(desc(courses.createdAt));
    return rows;
  }),
  lessons: adminProcedure.input(z.object({ courseId: z.number().int().positive() })).query(async ({ input }) => {
    const db = await requireDb();
    const [course] = await db.select().from(courses).where(eq(courses.id, input.courseId)).limit(1);
    if (!course) throw new TRPCError({ code: "NOT_FOUND", message: "الكورس مش موجود." });
    const [moduleRows, lessonRows] = await Promise.all([
      db.select().from(modules).where(eq(modules.courseId, input.courseId)).orderBy(asc(modules.position)),
      db.select().from(lessons).where(eq(lessons.courseId, input.courseId)).orderBy(asc(lessons.position)),
    ]);
    return { course: { id: course.id, title: course.titleAr || course.title }, modules: moduleRows.map(module => ({ ...module, lessons: lessonRows.filter(lesson => lesson.moduleId === module.id).map(lesson => ({ ...lesson, hasContent: publicCurriculumLesson(lesson).hasContent })) })) };
  }),
  save: adminProcedure.input(z.object({ lessonId: z.number().int().positive(), content: z.string().max(60000), videoUrl: recordingUrl })).mutation(async ({ input }) => {
    const db = await requireDb();
    const [lesson] = await db.select().from(lessons).where(eq(lessons.id, input.lessonId)).limit(1);
    if (!lesson) throw new TRPCError({ code: "NOT_FOUND", message: "الدرس مش موجود." });
    const content = input.content.trim() || null;
    const videoUrl = input.videoUrl?.trim() || null;
    if (!content && !videoUrl) throw new TRPCError({ code: "BAD_REQUEST", message: "اكتب شرح الدرس أو حط رابط محاضرة شغّال قبل الحفظ." });
    await db.update(lessons).set({ content, videoUrl, isPreview: false }).where(eq(lessons.id, input.lessonId));
    return { ok: true, lessonId: input.lessonId };
  }),
});
