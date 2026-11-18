import {
  boolean,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

/**
 * Core user table. Holds every account type: students, instructors and admins.
 */
export const users = mysqlTable(
  "users",
  {
    id: int("id").autoincrement().primaryKey(),
    /** Internal identifier kept for compatibility with the starter auth flow. */
    openId: varchar("openId", { length: 64 }).notNull().unique(),
    name: text("name"),
    email: varchar("email", { length: 320 }),
    passwordHash: varchar("passwordHash", { length: 255 }),
    loginMethod: varchar("loginMethod", { length: 64 }).default("password"),
    role: mysqlEnum("role", ["user", "admin", "instructor"]).default("user").notNull(),
    avatarUrl: text("avatarUrl"),
    headline: varchar("headline", { length: 160 }),
    bio: text("bio"),
    country: varchar("country", { length: 80 }),
    phone: varchar("phone", { length: 40 }),
    englishLevel: mysqlEnum("englishLevel", ["A1", "A2", "B1", "B2", "C1", "C2"]),
    learningGoal: varchar("learningGoal", { length: 120 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
    lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  },
  table => [uniqueIndex("users_email_unique").on(table.email)],
);

export const sessions = mysqlTable(
  "sessions",
  {
    id: int("id").autoincrement().primaryKey(),
    tokenHash: varchar("tokenHash", { length: 64 }).notNull(),
    userId: int("userId").notNull(),
    expiresAt: timestamp("expiresAt").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [uniqueIndex("sessions_token_unique").on(table.tokenHash), index("sessions_user_idx").on(table.userId)],
);

export const passwordResetTokens = mysqlTable("passwordResetTokens", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  tokenHash: varchar("tokenHash", { length: 64 }).notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  usedAt: timestamp("usedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 80 }).notNull().unique(),
  nameAr: varchar("nameAr", { length: 120 }).notNull(),
  nameEn: varchar("nameEn", { length: 120 }).notNull(),
  description: text("description"),
  icon: varchar("icon", { length: 60 }),
  accent: varchar("accent", { length: 40 }),
  coverImage: text("coverImage"),
  position: int("position").default(0).notNull(),
});

export const instructors = mysqlTable("instructors", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  title: varchar("title", { length: 160 }).notNull(),
  bio: text("bio").notNull(),
  experienceYears: int("experienceYears").default(0).notNull(),
  specialties: text("specialties"),
  education: text("education"),
  certifications: text("certifications"),
  languages: varchar("languages", { length: 160 }).default("العربية والإنجليزية"),
  city: varchar("city", { length: 80 }),
  rating: int("rating").default(50).notNull(),
  studentsCount: int("studentsCount").default(0).notNull(),
  featured: boolean("featured").default(false).notNull(),
  linkedinUrl: text("linkedinUrl"),
  websiteUrl: text("websiteUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const courses = mysqlTable(
  "courses",
  {
    id: int("id").autoincrement().primaryKey(),
    slug: varchar("slug", { length: 140 }).notNull().unique(),
    title: varchar("title", { length: 200 }).notNull(),
    titleAr: varchar("titleAr", { length: 200 }).notNull(),
    subtitle: varchar("subtitle", { length: 280 }).notNull(),
    description: text("description").notNull(),
    level: mysqlEnum("level", ["beginner", "intermediate", "advanced", "all"]).notNull(),
    categoryId: int("categoryId").notNull(),
    instructorId: int("instructorId").notNull(),
    priceCents: int("priceCents").default(0).notNull(),
    compareAtCents: int("compareAtCents"),
    currency: varchar("currency", { length: 8 }).default("EGP").notNull(),
    durationHours: int("durationHours").default(0).notNull(),
    studentsCount: int("studentsCount").default(0).notNull(),
    ratingSum: int("ratingSum").default(0).notNull(),
    ratingCount: int("ratingCount").default(0).notNull(),
    coverImage: text("coverImage"),
    accent: varchar("accent", { length: 40 }),
    featured: boolean("featured").default(false).notNull(),
    isPublished: boolean("isPublished").default(true).notNull(),
    outcomes: text("outcomes"),
    requirements: text("requirements"),
    audience: text("audience"),
    tags: text("tags"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("courses_category_idx").on(table.categoryId), index("courses_instructor_idx").on(table.instructorId)],
);

export const modules = mysqlTable(
  "modules",
  {
    id: int("id").autoincrement().primaryKey(),
    courseId: int("courseId").notNull(),
    title: varchar("title", { length: 200 }).notNull(),
    summary: varchar("summary", { length: 280 }),
    position: int("position").default(0).notNull(),
  },
  table => [index("modules_course_idx").on(table.courseId)],
);

export const lessons = mysqlTable(
  "lessons",
  {
    id: int("id").autoincrement().primaryKey(),
    courseId: int("courseId").notNull(),
    moduleId: int("moduleId").notNull(),
    title: varchar("title", { length: 200 }).notNull(),
    description: text("description"),
    content: text("content"),
    durationMinutes: int("durationMinutes").default(10).notNull(),
    videoUrl: text("videoUrl"),
    isPreview: boolean("isPreview").default(false).notNull(),
    position: int("position").default(0).notNull(),
  },
  table => [index("lessons_module_idx").on(table.moduleId), index("lessons_course_idx").on(table.courseId)],
);

export const enrollments = mysqlTable(
  "enrollments",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    courseId: int("courseId").notNull(),
    source: mysqlEnum("source", ["purchase", "subscription", "free"]).default("purchase").notNull(),
    lastLessonId: int("lastLessonId"),
    completedAt: timestamp("completedAt"),
    enrolledAt: timestamp("enrolledAt").defaultNow().notNull(),
  },
  table => [uniqueIndex("enrollments_user_course_unique").on(table.userId, table.courseId)],
);

export const lessonProgress = mysqlTable(
  "lessonProgress",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    courseId: int("courseId").notNull(),
    lessonId: int("lessonId").notNull(),
    completedAt: timestamp("completedAt").defaultNow().notNull(),
  },
  table => [uniqueIndex("lesson_progress_unique").on(table.userId, table.lessonId)],
);

export const reviews = mysqlTable(
  "reviews",
  {
    id: int("id").autoincrement().primaryKey(),
    courseId: int("courseId").notNull(),
    userId: int("userId").notNull(),
    rating: int("rating").notNull(),
    comment: text("comment"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [uniqueIndex("reviews_user_course_unique").on(table.userId, table.courseId)],
);

export const wishlist = mysqlTable(
  "wishlist",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    courseId: int("courseId").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [uniqueIndex("wishlist_user_course_unique").on(table.userId, table.courseId)],
);

export const plans = mysqlTable("plans", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 60 }).notNull().unique(),
  nameAr: varchar("nameAr", { length: 80 }).notNull(),
  tagline: varchar("tagline", { length: 200 }),
  priceMonthlyCents: int("priceMonthlyCents").default(0).notNull(),
  priceYearlyCents: int("priceYearlyCents").default(0).notNull(),
  features: text("features"),
  highlighted: boolean("highlighted").default(false).notNull(),
  position: int("position").default(0).notNull(),
});

export const subscriptions = mysqlTable("subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  planId: int("planId").notNull(),
  billingCycle: mysqlEnum("billingCycle", ["monthly", "yearly"]).default("monthly").notNull(),
  status: mysqlEnum("status", ["active", "canceled", "expired"]).default("active").notNull(),
  currentPeriodEnd: timestamp("currentPeriodEnd").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  kind: mysqlEnum("kind", ["course", "subscription"]).notNull(),
  courseId: int("courseId"),
  planId: int("planId"),
  amountCents: int("amountCents").notNull(),
  currency: varchar("currency", { length: 8 }).default("USD").notNull(),
  status: mysqlEnum("status", ["pending", "paid", "failed", "refunded"]).default("pending").notNull(),
  provider: varchar("provider", { length: 40 }).default("sandbox").notNull(),
  reference: varchar("reference", { length: 120 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const contactMessages = mysqlTable("contactMessages", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  email: varchar("email", { length: 320 }),
  subject: varchar("subject", { length: 200 }).notNull(),
  message: text("message").notNull(),
  userId: int("userId"),
  status: mysqlEnum("status", ["new", "replied", "closed"]).default("new").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const placementAttempts = mysqlTable("placementAttempts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  score: int("score").notNull(),
  total: int("total").notNull(),
  level: varchar("level", { length: 4 }).notNull(),
  skills: text("skills"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});


/* ------------------------------------------------------------------ */
/*  Live online classroom                                             */
/* ------------------------------------------------------------------ */

export const liveSessions = mysqlTable(
  "liveSessions",
  {
    id: int("id").autoincrement().primaryKey(),
    courseId: int("courseId").notNull(),
    title: varchar("title", { length: 200 }).notNull(),
    agenda: text("agenda"),
    startsAt: timestamp("startsAt").notNull(),
    durationMinutes: int("durationMinutes").default(60).notNull(),
    meetingUrl: varchar("meetingUrl", { length: 500 }),
    status: mysqlEnum("status", ["scheduled", "live", "done", "canceled"]).default("scheduled").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("live_sessions_course_idx").on(table.courseId), index("live_sessions_start_idx").on(table.startsAt)],
);

export const sessionAttendance = mysqlTable(
  "sessionAttendance",
  {
    id: int("id").autoincrement().primaryKey(),
    sessionId: int("sessionId").notNull(),
    userId: int("userId").notNull(),
    status: mysqlEnum("status", ["present", "late", "absent", "excused"]).default("absent").notNull(),
    note: varchar("note", { length: 300 }),
    markedBy: int("markedBy"),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [uniqueIndex("attendance_session_user_unique").on(table.sessionId, table.userId)],
);

export const studentTasks = mysqlTable(
  "studentTasks",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    assignedBy: int("assignedBy"),
    title: varchar("title", { length: 200 }).notNull(),
    instructions: text("instructions"),
    dueAt: timestamp("dueAt"),
    status: mysqlEnum("status", ["assigned", "in_progress", "submitted", "reviewed"]).default("assigned").notNull(),
    feedback: text("feedback"),
    score: int("score"),
    submissionText: text("submissionText"),
    submissionUrl: varchar("submissionUrl", { length: 1000 }),
    submissionAudioUrl: varchar("submissionAudioUrl", { length: 1000 }),
    submittedAt: timestamp("submittedAt"),
    reviewedAt: timestamp("reviewedAt"),
    reviewedBy: int("reviewedBy"),
    submissionCount: int("submissionCount").default(0).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [index("tasks_user_idx").on(table.userId)],
);

export const studentRatings = mysqlTable(
  "studentRatings",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    ratedBy: int("ratedBy").notNull(),
    stars: int("stars").notNull(),
    speaking: int("speaking"),
    listening: int("listening"),
    grammar: int("grammar"),
    vocabulary: int("vocabulary"),
    note: text("note"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("student_ratings_user_idx").on(table.userId)],
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Course = typeof courses.$inferSelect;
export type Instructor = typeof instructors.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Lesson = typeof lessons.$inferSelect;
export type Module = typeof modules.$inferSelect;
export type Plan = typeof plans.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type Order = typeof orders.$inferSelect;

/** Quick "book now" leads captured before handing off to WhatsApp. */
export const bookings = mysqlTable(
  "bookings",
  {
    id: int("id").autoincrement().primaryKey(),
    name: varchar("name", { length: 120 }).notNull(),
    phone: varchar("phone", { length: 24 }).notNull(),
    courseSlug: varchar("courseSlug", { length: 140 }),
    courseTitle: varchar("courseTitle", { length: 200 }).notNull(),
    packageTitle: varchar("packageTitle", { length: 160 }).notNull(),
    priceCents: int("priceCents").default(0).notNull(),
    currency: varchar("currency", { length: 8 }).default("EGP").notNull(),
    note: text("note"),
    status: varchar("status", { length: 24 }).default("new").notNull(),
    userId: int("userId"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("bookings_created_idx").on(table.createdAt)],
);

/**
 * Owner access codes: the owner signs in with a long secret code instead of an
 * email + password. Only a SHA-256 hash is stored; rotating a code revokes the
 * previous one.
 */
export const ownerAccessCodes = mysqlTable("ownerAccessCodes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  codeHash: varchar("codeHash", { length: 128 }).notNull().unique(),
  label: varchar("label", { length: 80 }).default("رمز المالك").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  lastUsedAt: timestamp("lastUsedAt"),
  revokedAt: timestamp("revokedAt"),
});

/**
 * Direct messages between a student and the owner (a private one-to-one thread
 * per user). `senderRole` says who wrote it; read markers drive unread badges.
 */
export const chatMessages = mysqlTable(
  "chatMessages",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    senderRole: varchar("senderRole", { length: 12 }).notNull(),
    body: text("body").notNull(),
    readByStudentAt: timestamp("readByStudentAt"),
    readByOwnerAt: timestamp("readByOwnerAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    index("chat_user_idx").on(table.userId),
    index("chat_created_idx").on(table.createdAt),
  ],
);

/** Durable bearer-token assessment sessions; state is the server-only JSON state machine. */
export const assessmentSessions = mysqlTable(
  "assessmentSessions",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    userId: int("userId"),
    tokenHash: varchar("tokenHash", { length: 64 }).notNull(),
    state: text("state").notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
    expiresAt: timestamp("expiresAt").notNull(),
  },
  table => [
    index("assessment_sessions_user_idx").on(table.userId),
    index("assessment_sessions_expiry_idx").on(table.expiresAt),
  ],
);

export * from "./premium-schema";
export * from "./profile-schema";
export * from "./receipts-schema";
export * from "./certificates-schema";
export * from "./community-schema";
