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
 * Premium is intentionally isolated from the ordinary checkout and classroom
 * tables. The parent integration task owns exports and migrations.
 */
export const premiumMemberships = mysqlTable(
  "premiumMemberships",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    /** JSON array of AssessmentLevel values, kept immutable after activation. */
    levels: text("levels").notNull(),
    startDate: timestamp("startDate").notNull(),
    endDate: timestamp("endDate").notNull(),
    status: mysqlEnum("status", ["active", "paused", "cancelled"])
      .default("active")
      .notNull(),
    durationDays: int("durationDays").notNull(),
    paidAmountCents: int("paidAmountCents").notNull(),
    paymentReference: varchar("paymentReference", { length: 160 }).notNull(),
    activatedBy: int("activatedBy").notNull(),
    coachUserId: int("coachUserId"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("premium_membership_user_idx").on(table.userId),
    index("premium_membership_status_idx").on(table.status),
    index("premium_membership_coach_idx").on(table.coachUserId),
  ],
);

/** One immutable attempt row per membership and curriculum day. */
export const premiumDailyAttempts = mysqlTable(
  "premiumDailyAttempts",
  {
    id: int("id").autoincrement().primaryKey(),
    membershipId: int("membershipId").notNull(),
    dayIndex: int("dayIndex").notNull(),
    /** YYYY-MM-DD in Africa/Cairo; retained to make calendar semantics auditable. */
    cairoDate: varchar("cairoDate", { length: 10 }).notNull(),
    level: varchar("level", { length: 4 }).notNull(),
    questionIds: text("questionIds").notNull(),
    answers: text("answers"),
    score: int("score"),
    total: int("total"),
    feedback: text("feedback"),
    submittedAt: timestamp("submittedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    uniqueIndex("premium_daily_membership_day_unique").on(
      table.membershipId,
      table.dayIndex,
    ),
    index("premium_daily_membership_idx").on(table.membershipId),
  ],
);

/** Per-membership lesson progress; learning quizzes may be retried. */
export const premiumLessonProgress = mysqlTable(
  "premiumLessonProgress",
  {
    id: int("id").autoincrement().primaryKey(),
    membershipId: int("membershipId").notNull(),
    lessonId: varchar("lessonId", { length: 160 }).notNull(),
    level: varchar("level", { length: 4 }).notNull(),
    bestScore: int("bestScore").notNull().default(0),
    total: int("total").notNull(),
    attemptCount: int("attemptCount").notNull().default(0),
    completed: boolean("completed").notNull().default(false),
    lastFeedback: text("lastFeedback"),
    lastAttemptAt: timestamp("lastAttemptAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    uniqueIndex("premium_lesson_membership_lesson_unique").on(
      table.membershipId,
      table.lessonId,
    ),
    index("premium_lesson_membership_idx").on(table.membershipId),
  ],
);

/** Private owner/coach feedback, never mixed into ordinary chat. */
export const premiumCoachNotes = mysqlTable(
  "premiumCoachNotes",
  {
    id: int("id").autoincrement().primaryKey(),
    membershipId: int("membershipId").notNull(),
    studentUserId: int("studentUserId").notNull(),
    authorUserId: int("authorUserId").notNull(),
    dayIndex: int("dayIndex"),
    note: text("note").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    index("premium_notes_membership_idx").on(table.membershipId),
    index("premium_notes_student_idx").on(table.studentUserId),
  ],
);

export type PremiumMembership = typeof premiumMemberships.$inferSelect;
export type PremiumDailyAttempt = typeof premiumDailyAttempts.$inferSelect;
export type PremiumLessonProgress = typeof premiumLessonProgress.$inferSelect;
export type PremiumCoachNote = typeof premiumCoachNotes.$inferSelect;
