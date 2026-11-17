import {
  int,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

/**
 * Student-only profile details. This table intentionally stays separate from
 * the shared users schema so education preferences are returned only by the
 * protected profile API.
 */
export const studentProfileDetails = mysqlTable(
  "studentProfileDetails",
  {
    id: int("id").autoincrement().primaryKey(),
    uid: int("uid").notNull(),
    city: varchar("city", { length: 80 }),
    birthYear: int("birthYear"),
    schoolGrade: varchar("schoolGrade", { length: 80 }),
    learningGoal: varchar("learningGoal", { length: 120 }),
    preferredStudyTime: varchar("preferredStudyTime", { length: 20 }),
    dailyStudyMinutes: int("dailyStudyMinutes"),
    bio: text("bio"),
    /** Never return this key to the browser; it indexes the durable object. */
    avatarStorageKey: varchar("avatarStorageKey", { length: 300 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [uniqueIndex("student_profile_details_uid_unique").on(table.uid)]
);

export type StudentProfileDetails = typeof studentProfileDetails.$inferSelect;
export type InsertStudentProfileDetails =
  typeof studentProfileDetails.$inferInsert;
