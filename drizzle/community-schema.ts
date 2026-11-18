import {
  index,
  int,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

/**
 * Classrooms / Study Groups created and named by the admin,
 * where groups of students learn together with first-name-only privacy.
 */
export const studyGroups = mysqlTable("studyGroups", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  level: varchar("level", { length: 24 }).default("A1").notNull(),
  description: text("description"),
  accent: varchar("accent", { length: 32 }).default("indigo").notNull(),
  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const studyGroupMembers = mysqlTable(
  "studyGroupMembers",
  {
    id: int("id").autoincrement().primaryKey(),
    groupId: int("groupId").notNull(),
    userId: int("userId").notNull(),
    joinedAt: timestamp("joinedAt").defaultNow().notNull(),
  },
  table => [
    uniqueIndex("study_group_members_group_user_unique").on(
      table.groupId,
      table.userId
    ),
    index("study_group_members_group_idx").on(table.groupId),
    index("study_group_members_user_idx").on(table.userId),
  ]
);

/**
 * Student gamification profile: selectable avatar, streak-unlocked skin,
 * and daily/weekly/monthly/yearly competition XP.
 */
export const studentGameProfiles = mysqlTable(
  "studentGameProfiles",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    avatarPreset: varchar("avatarPreset", { length: 48 })
      .default("lion")
      .notNull(),
    equippedSkin: varchar("equippedSkin", { length: 48 })
      .default("classic")
      .notNull(),
    streakDays: int("streakDays").default(1).notNull(),
    dailyXp: int("dailyXp").default(25).notNull(),
    weeklyXp: int("weeklyXp").default(25).notNull(),
    monthlyXp: int("monthlyXp").default(25).notNull(),
    yearlyXp: int("yearlyXp").default(25).notNull(),
    lastActivityDate: varchar("lastActivityDate", { length: 16 }),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [uniqueIndex("student_game_profiles_user_unique").on(table.userId)]
);

export type StudyGroup = typeof studyGroups.$inferSelect;
export type StudyGroupMember = typeof studyGroupMembers.$inferSelect;
export type StudentGameProfile = typeof studentGameProfiles.$inferSelect;
