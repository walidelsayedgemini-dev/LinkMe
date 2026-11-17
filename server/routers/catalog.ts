import { and, asc, count, desc, eq, gte, like, or, sql, type SQL } from "drizzle-orm";
import { z } from "zod";
import { categories, courses, instructors, lessons, modules, reviews, users } from "../../drizzle/schema";
import { getDb } from "../db";
import { publicProcedure, router } from "../_core/trpc";
import { publicCurriculumLesson } from "../course-visibility";
import { parseList, ratingOf } from "./_shared";

const levelSchema = z.enum(["beginner", "intermediate", "advanced", "all"]);

const courseCard = {
  id: courses.id,
  slug: courses.slug,
  title: courses.title,
  titleAr: courses.titleAr,
  subtitle: courses.subtitle,
  level: courses.level,
  priceCents: courses.priceCents,
  compareAtCents: courses.compareAtCents,
  currency: courses.currency,
  durationHours: courses.durationHours,
  studentsCount: courses.studentsCount,
  ratingSum: courses.ratingSum,
  ratingCount: courses.ratingCount,
  coverImage: courses.coverImage,
  accent: courses.accent,
  featured: courses.featured,
  categoryNameAr: categories.nameAr,
  categorySlug: categories.slug,
  categoryNameEn: categories.nameEn,
  instructorId: instructors.id,
  instructorSlug: instructors.slug,
  instructorName: users.name,
  instructorAvatar: users.avatarUrl,
  createdAt: courses.createdAt,
};

function baseQuery(db: Awaited<ReturnType<typeof getDb>>) {
  return db!
    .select(courseCard)
    .from(courses)
    .innerJoin(categories, eq(categories.id, courses.categoryId))
    .innerJoin(instructors, eq(instructors.id, courses.instructorId))
    .innerJoin(users, eq(users.id, instructors.userId));
}

function decorate<T extends { ratingSum: number; ratingCount: number; outcomes?: string | null }>(row: T) {
  return {
    ...row,
    rating: ratingOf(row.ratingSum, row.ratingCount),
  };
}

export const catalogRouter = router({
  categories: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    const rows = await db
      .select({
        id: categories.id,
        slug: categories.slug,
        nameAr: categories.nameAr,
        nameEn: categories.nameEn,
        description: categories.description,
        icon: categories.icon,
        accent: categories.accent,
        coverImage: categories.coverImage,
        courseCount: count(courses.id),
      })
      .from(categories)
      .leftJoin(courses, and(eq(courses.categoryId, categories.id), eq(courses.isPublished, true)))
      .groupBy(categories.id)
      .orderBy(asc(categories.position));
    return rows;
  }),

  homeStats: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { courses: 0, students: 0, instructors: 0, lessons: 0, hours: 0 };
    const [[courseRow], [studentRow], [instructorRow], [lessonRow]] = await Promise.all([
      db.select({ value: count() }).from(courses).where(eq(courses.isPublished, true)),
      db.select({ value: sql<number>`coalesce(sum(${courses.studentsCount}), 0)` }).from(courses),
      db.select({ value: count() }).from(instructors),
      db.select({ value: count() }).from(lessons),
    ]);
    return {
      courses: Number(courseRow?.value ?? 0),
      students: Number(studentRow?.value ?? 0),
      instructors: Number(instructorRow?.value ?? 0),
      lessons: Number(lessonRow?.value ?? 0),
      hours: 0,
    };
  }),

  courses: publicProcedure
    .input(
      z
        .object({
          q: z.string().trim().max(120).optional(),
          category: z.string().max(80).optional(),
          instructor: z.string().max(100).optional(),
          level: levelSchema.optional(),
          price: z.enum(["all", "free", "paid"]).default("all"),
          minRating: z.number().min(0).max(5).default(0),
          sort: z.enum(["popular", "newest", "rating", "price_asc", "price_desc"]).default("popular"),
          page: z.number().int().min(1).default(1),
          pageSize: z.number().int().min(1).max(48).default(9),
        })
        .default({ price: "all", minRating: 0, sort: "popular", page: 1, pageSize: 9 }),
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { items: [], total: 0, page: input.page, pageSize: input.pageSize };
      const filters: SQL[] = [eq(courses.isPublished, true)];
      if (input.q) {
        const needle = `%${input.q}%`;
        const search = or(
          like(courses.title, needle),
          like(courses.titleAr, needle),
          like(courses.subtitle, needle),
          like(courses.tags, needle),
          like(users.name, needle),
          like(categories.nameAr, needle),
        );
        if (search) filters.push(search);
      }
      if (input.category) filters.push(eq(categories.slug, input.category));
      if (input.instructor) filters.push(eq(instructors.slug, input.instructor));
      if (input.level) filters.push(eq(courses.level, input.level));
      if (input.price === "free") filters.push(eq(courses.priceCents, 0));
      if (input.price === "paid") filters.push(gte(courses.priceCents, 1));
      if (input.minRating > 0) {
        filters.push(sql`(${courses.ratingSum} / greatest(${courses.ratingCount}, 1)) >= ${input.minRating}`);
      }
      const where = and(...filters);

      const orderBy =
        input.sort === "newest"
          ? desc(courses.createdAt)
          : input.sort === "rating"
            ? desc(sql`(${courses.ratingSum} / greatest(${courses.ratingCount}, 1))`)
            : input.sort === "price_asc"
              ? asc(courses.priceCents)
              : input.sort === "price_desc"
                ? desc(courses.priceCents)
                : desc(courses.studentsCount);

      const [items, [totalRow]] = await Promise.all([
        baseQuery(db)
          .where(where)
          .orderBy(orderBy)
          .limit(input.pageSize)
          .offset((input.page - 1) * input.pageSize),
        db
          .select({ value: count() })
          .from(courses)
          .innerJoin(categories, eq(categories.id, courses.categoryId))
          .innerJoin(instructors, eq(instructors.id, courses.instructorId))
          .innerJoin(users, eq(users.id, instructors.userId))
          .where(where),
      ]);

      return {
        items: items.map(decorate),
        total: Number(totalRow?.value ?? 0),
        page: input.page,
        pageSize: input.pageSize,
      };
    }),

  featured: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    const rows = await baseQuery(db)
      .where(and(eq(courses.isPublished, true), eq(courses.featured, true)))
      .orderBy(desc(courses.studentsCount))
      .limit(6);
    return rows.map(decorate);
  }),

  bySlug: publicProcedure.input(z.object({ slug: z.string() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return null;
    const [row] = await baseQuery(db).where(and(eq(courses.slug, input.slug), eq(courses.isPublished, true))).limit(1);
    if (!row) return null;

    const [course] = await db.select().from(courses).where(eq(courses.id, row.id)).limit(1);
    const moduleRows = await db.select().from(modules).where(eq(modules.courseId, row.id)).orderBy(asc(modules.position));
    const lessonRows = await db
      .select()
      .from(lessons)
      .where(eq(lessons.courseId, row.id))
      .orderBy(asc(lessons.position));

    const [instructorRow] = await db
      .select({
        id: instructors.id,
        slug: instructors.slug,
        title: instructors.title,
        bio: instructors.bio,
        experienceYears: instructors.experienceYears,
        specialties: instructors.specialties,
        rating: instructors.rating,
        studentsCount: instructors.studentsCount,
        name: users.name,
        avatarUrl: users.avatarUrl,
      })
      .from(instructors)
      .innerJoin(users, eq(users.id, instructors.userId))
      .where(eq(instructors.id, course.instructorId))
      .limit(1);

    const reviewRows = await db
      .select({
        id: reviews.id,
        rating: reviews.rating,
        comment: reviews.comment,
        createdAt: reviews.createdAt,
        userName: users.name,
        avatarUrl: users.avatarUrl,
      })
      .from(reviews)
      .innerJoin(users, eq(users.id, reviews.userId))
      .where(eq(reviews.courseId, row.id))
      .orderBy(desc(reviews.createdAt))
      .limit(12);

    const distribution = await db
      .select({ rating: reviews.rating, value: count() })
      .from(reviews)
      .where(eq(reviews.courseId, row.id))
      .groupBy(reviews.rating);

    const related = await baseQuery(db)
      .where(and(eq(courses.isPublished, true), eq(courses.categoryId, course.categoryId), sql`${courses.id} <> ${row.id}`))
      .orderBy(desc(courses.studentsCount))
      .limit(3);

    return {
      ...decorate(row),
      description: course.description,
      outcomes: parseList(course.outcomes),
      requirements: parseList(course.requirements),
      audience: parseList(course.audience),
      tags: parseList(course.tags),
      lessonCount: lessonRows.length,
      instructor: instructorRow ?? null,
      modules: moduleRows.map(module => ({
        ...module,
        lessons: lessonRows.filter(lesson => lesson.moduleId === module.id).map(publicCurriculumLesson),
      })),
      reviews: reviewRows,
      ratingDistribution: [5, 4, 3, 2, 1].map(stars => ({
        stars,
        count: Number(distribution.find(item => item.rating === stars)?.value ?? 0),
      })),
      related: related.map(decorate),
    };
  }),

  instructors: publicProcedure
    .input(z.object({ q: z.string().trim().max(120).optional() }).default({}))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const filters: SQL[] = [];
      if (input.q) {
        const needle = `%${input.q}%`;
        const search = or(like(users.name, needle), like(instructors.title, needle), like(instructors.specialties, needle));
        if (search) filters.push(search);
      }
      const rows = await db
        .select({
          id: instructors.id,
          slug: instructors.slug,
          title: instructors.title,
          bio: instructors.bio,
          experienceYears: instructors.experienceYears,
          specialties: instructors.specialties,
          city: instructors.city,
          rating: instructors.rating,
          studentsCount: instructors.studentsCount,
          featured: instructors.featured,
          name: users.name,
          avatarUrl: users.avatarUrl,
          courseCount: count(courses.id),
        })
        .from(instructors)
        .innerJoin(users, eq(users.id, instructors.userId))
        .leftJoin(courses, and(eq(courses.instructorId, instructors.id), eq(courses.isPublished, true)))
        .where(filters.length ? and(...filters) : undefined)
        .groupBy(instructors.id, users.id)
        .orderBy(desc(instructors.featured), desc(instructors.studentsCount));
      return rows.map(row => ({ ...row, specialtyList: parseList(row.specialties) }));
    }),

  instructorBySlug: publicProcedure.input(z.object({ slug: z.string() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return null;
    const [row] = await db
      .select({
        id: instructors.id,
        slug: instructors.slug,
        title: instructors.title,
        bio: instructors.bio,
        experienceYears: instructors.experienceYears,
        specialties: instructors.specialties,
        education: instructors.education,
        certifications: instructors.certifications,
        languages: instructors.languages,
        city: instructors.city,
        rating: instructors.rating,
        studentsCount: instructors.studentsCount,
        linkedinUrl: instructors.linkedinUrl,
        websiteUrl: instructors.websiteUrl,
        createdAt: instructors.createdAt,
        name: users.name,
        avatarUrl: users.avatarUrl,
        country: users.country,
      })
      .from(instructors)
      .innerJoin(users, eq(users.id, instructors.userId))
      .where(eq(instructors.slug, input.slug))
      .limit(1);
    if (!row) return null;

    const courseRows = await baseQuery(db)
      .where(and(eq(courses.instructorId, row.id), eq(courses.isPublished, true)))
      .orderBy(desc(courses.studentsCount));

    const reviewRows = await db
      .select({
        id: reviews.id,
        rating: reviews.rating,
        comment: reviews.comment,
        createdAt: reviews.createdAt,
        userName: users.name,
        avatarUrl: users.avatarUrl,
        courseTitleAr: courses.titleAr,
      })
      .from(reviews)
      .innerJoin(courses, eq(courses.id, reviews.courseId))
      .innerJoin(users, eq(users.id, reviews.userId))
      .where(eq(courses.instructorId, row.id))
      .orderBy(desc(reviews.createdAt))
      .limit(8);

    const lessonTotal = await db
      .select({ value: count() })
      .from(lessons)
      .innerJoin(courses, eq(courses.id, lessons.courseId))
      .where(eq(courses.instructorId, row.id));

    return {
      ...row,
      specialtyList: parseList(row.specialties),
      educationList: parseList(row.education),
      certificationList: parseList(row.certifications),
      courses: courseRows.map(decorate),
      reviews: reviewRows,
      lessonCount: Number(lessonTotal[0]?.value ?? 0),
    };
  }),

  testimonials: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db
      .select({
        id: reviews.id,
        rating: reviews.rating,
        comment: reviews.comment,
        userName: users.name,
        avatarUrl: users.avatarUrl,
        englishLevel: users.englishLevel,
        courseTitleAr: courses.titleAr,
        courseSlug: courses.slug,
      })
      .from(reviews)
      .innerJoin(users, eq(users.id, reviews.userId))
      .innerJoin(courses, eq(courses.id, reviews.courseId))
      .where(gte(reviews.rating, 5))
      .orderBy(desc(reviews.createdAt))
      .limit(6);
  }),
});
