import {
  boolean,
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

/**
 * Referral rewards tracking: students share their invite link and both
 * inviter (+150 XP) and friend (+100 XP) earn instant rewards on signup.
 */
export const studentReferrals = mysqlTable(
  "studentReferrals",
  {
    id: int("id").autoincrement().primaryKey(),
    referrerUserId: int("referrerUserId").notNull(),
    referredUserId: int("referredUserId").notNull(),
    referralCode: varchar("referralCode", { length: 32 }).notNull(),
    rewardXp: int("rewardXp").default(150).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    uniqueIndex("student_referrals_referred_unique").on(table.referredUserId),
    index("student_referrals_referrer_idx").on(table.referrerUserId),
  ]
);

/**
 * Admin broadcast announcements — can target all students (targetGroupId = null)
 * or a specific classroom (targetGroupId = studyGroups.id).
 */
export const announcements = mysqlTable(
  "announcements",
  {
    id: int("id").autoincrement().primaryKey(),
    title: varchar("title", { length: 180 }).notNull(),
    body: text("body").notNull(),
    targetGroupId: int("targetGroupId"),
    priority: varchar("priority", { length: 24 }).default("info").notNull(),
    createdBy: int("createdBy"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("announcements_group_idx").on(table.targetGroupId)]
);

export const announcementReads = mysqlTable(
  "announcementReads",
  {
    id: int("id").autoincrement().primaryKey(),
    announcementId: int("announcementId").notNull(),
    userId: int("userId").notNull(),
    readAt: timestamp("readAt").defaultNow().notNull(),
  },
  table => [
    uniqueIndex("announcement_reads_unique").on(
      table.announcementId,
      table.userId
    ),
    index("announcement_reads_user_idx").on(table.userId),
  ]
);

/**
 * Dynamic admin-managed promo codes with discount %, optional max uses, and expiry.
 */
export const promoCodes = mysqlTable(
  "promoCodes",
  {
    id: int("id").autoincrement().primaryKey(),
    code: varchar("code", { length: 40 }).notNull(),
    discountPercent: int("discountPercent").notNull(),
    label: varchar("label", { length: 160 }).notNull(),
    maxUses: int("maxUses"),
    usedCount: int("usedCount").default(0).notNull(),
    isActive: boolean("isActive").default(true).notNull(),
    expiresAt: timestamp("expiresAt"),
    createdBy: int("createdBy"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [uniqueIndex("promo_codes_code_unique").on(table.code)]
);

export type StudyGroup = typeof studyGroups.$inferSelect;
export type StudyGroupMember = typeof studyGroupMembers.$inferSelect;
export type StudentGameProfile = typeof studentGameProfiles.$inferSelect;
export type StudentReferral = typeof studentReferrals.$inferSelect;
export type Announcement = typeof announcements.$inferSelect;
export type PromoCodeRow = typeof promoCodes.$inferSelect;
