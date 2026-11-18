import { createHash, randomInt } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import {
  announcementReads,
  announcements,
  courses,
  enrollments,
  lessonProgress,
  orders,
  paymentReceipts,
  promoCodes,
  sessionAttendance,
  sessions,
  studentGameProfiles,
  studentRatings,
  studentReferrals,
  studentTasks,
  studyGroupMembers,
  studyGroups,
  subscriptions,
  users,
} from "../../drizzle/schema";
import { applyPromoCode as applyStaticPromoCode } from "../../shared/promo-codes";
import {
  AVATAR_PRESETS,
  CHALLENGE_QUESTS,
  STREAK_SKINS,
  buildVirtualCompetitors,
  firstNameOnly,
  type CompetitionPeriod,
  type LeaderboardEntry,
} from "../../shared/gamification-catalog";
import { hashPassword } from "../auth";
import { getDb } from "../db";
import {
  adminProcedure,
  protectedProcedure,
  publicProcedure,
  router,
} from "../_core/trpc";

const VALID_AVATAR_IDS = new Set(AVATAR_PRESETS.map(a => a.id));
const SKIN_BY_ID = new Map(STREAK_SKINS.map(s => [s.id, s]));

function todayKey(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-${String(now.getUTCDate()).padStart(2, "0")}`;
}

function yesterdayKey(): string {
  const d = new Date(Date.now() - 86_400_000);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

function generateReadablePassword(): string {
  const digits = String(randomInt(100000, 999999));
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const tail =
    letters[randomInt(letters.length)] + letters[randomInt(letters.length)];
  return `LM-${digits}${tail}`;
}

export function buildReferralCode(userId: number): string {
  const checksum = createHash("sha256")
    .update(`linkme-ref-${userId}`)
    .digest("hex")
    .slice(0, 4)
    .toUpperCase();
  return `LM${userId}-${checksum}`;
}

export function parseReferralCode(code: string): number | null {
  const match = code.trim().toUpperCase().match(/^LM(\d+)-([A-F0-9]{4})$/);
  if (!match) return null;
  const userId = Number(match[1]);
  if (!Number.isInteger(userId) || userId <= 0) return null;
  return buildReferralCode(userId) === match[0] ? userId : null;
}

async function ensureGameProfile(userId: number) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "قاعدة البيانات غير متاحة" });

  const [existing] = await db
    .select()
    .from(studentGameProfiles)
    .where(eq(studentGameProfiles.userId, userId))
    .limit(1);

  const today = todayKey();

  if (!existing) {
    await db.insert(studentGameProfiles).values({
      userId,
      avatarPreset: "lion",
      equippedSkin: "classic",
      streakDays: 1,
      dailyXp: 25,
      weeklyXp: 25,
      monthlyXp: 25,
      yearlyXp: 25,
      lastActivityDate: today,
    });
    const [created] = await db
      .select()
      .from(studentGameProfiles)
      .where(eq(studentGameProfiles.userId, userId))
      .limit(1);
    return created;
  }

  // Update streak if first activity today
  if (existing.lastActivityDate !== today) {
    const nextStreak =
      existing.lastActivityDate === yesterdayKey()
        ? existing.streakDays + 1
        : Math.max(1, existing.streakDays);
    await db
      .update(studentGameProfiles)
      .set({
        streakDays: nextStreak,
        dailyXp: 25,
        weeklyXp: existing.weeklyXp + 25,
        monthlyXp: existing.monthlyXp + 25,
        yearlyXp: existing.yearlyXp + 25,
        lastActivityDate: today,
      })
      .where(eq(studentGameProfiles.id, existing.id));

    return {
      ...existing,
      streakDays: nextStreak,
      dailyXp: 25,
      weeklyXp: existing.weeklyXp + 25,
      monthlyXp: existing.monthlyXp + 25,
      yearlyXp: existing.yearlyXp + 25,
      lastActivityDate: today,
    };
  }

  return existing;
}

export const communityRouter = router({
  /* =========================================================
   * 1. ADMIN: STUDENT PASSWORD RECOVERY / RESET
   * ========================================================= */
  adminResetStudentPassword: adminProcedure
    .input(
      z.object({
        studentId: z.number().int().positive(),
        customPassword: z.string().trim().min(6, "كلمة المرور لا تقل عن 6 أحرف").max(80).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "قاعدة البيانات غير متاحة" });

      const [student] = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          phone: users.phone,
          role: users.role,
        })
        .from(users)
        .where(eq(users.id, input.studentId))
        .limit(1);

      if (!student) {
        throw new TRPCError({ code: "NOT_FOUND", message: "الطالب غير موجود" });
      }
      if (student.role === "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "لا يمكن إعادة تعيين حساب المالك من هنا" });
      }

      const newPassword = input.customPassword || generateReadablePassword();
      await db
        .update(users)
        .set({
          passwordHash: hashPassword(newPassword),
          loginMethod: "password",
        })
        .where(eq(users.id, student.id));

      // Clear old sessions so the new password takes clean effect
      await db.delete(sessions).where(eq(sessions.userId, student.id));

      return {
        studentId: student.id,
        name: student.name ?? "طالب",
        email: student.email ?? "",
        phone: student.phone ?? "",
        newPassword,
      };
    }),

  /* =========================================================
   * 2. ADMIN: CLASSROOMS / STUDY GROUPS MANAGEMENT
   * ========================================================= */
  adminListGroups: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { groups: [], allStudents: [] };

    const [groups, memberships, allStudents, profiles] = await Promise.all([
      db.select().from(studyGroups).orderBy(desc(studyGroups.createdAt)),
      db.select().from(studyGroupMembers),
      db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          phone: users.phone,
          englishLevel: users.englishLevel,
          role: users.role,
        })
        .from(users)
        .where(eq(users.role, "user"))
        .orderBy(desc(users.createdAt)),
      db.select().from(studentGameProfiles),
    ]);

    const profileMap = new Map(profiles.map(p => [p.userId, p]));
    const studentMap = new Map(allStudents.map(s => [s.id, s]));

    const enrichedGroups = groups.map(group => {
      const members = memberships
        .filter(m => m.groupId === group.id)
        .map(m => {
          const s = studentMap.get(m.userId);
          if (!s) return null;
          const gp = profileMap.get(s.id);
          return {
            id: s.id,
            name: s.name ?? "طالب",
            firstName: firstNameOnly(s.name),
            email: s.email ?? "",
            englishLevel: s.englishLevel,
            avatarPreset: gp?.avatarPreset ?? "lion",
            equippedSkin: gp?.equippedSkin ?? "classic",
            streakDays: gp?.streakDays ?? 1,
          };
        })
        .filter((m): m is NonNullable<typeof m> => Boolean(m));

      return {
        ...group,
        members,
        memberIds: members.map(m => m.id),
      };
    });

    return {
      groups: enrichedGroups,
      allStudents: allStudents.map(s => ({
        ...s,
        avatarPreset: profileMap.get(s.id)?.avatarPreset ?? "lion",
        streakDays: profileMap.get(s.id)?.streakDays ?? 1,
      })),
    };
  }),

  adminCreateGroup: adminProcedure
    .input(
      z.object({
        name: z.string().trim().min(2, "اكتب اسم الفصل").max(160),
        level: z.string().trim().min(1).max(24).default("A1"),
        description: z.string().trim().max(500).optional(),
        accent: z.string().trim().max(32).default("indigo"),
        memberIds: z.array(z.number().int().positive()).default([]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "قاعدة البيانات غير متاحة" });

      const [res] = await db.insert(studyGroups).values({
        name: input.name,
        level: input.level,
        description: input.description ?? null,
        accent: input.accent,
        createdBy: ctx.user.id,
      });
      const groupId = Number(res.insertId);

      if (input.memberIds.length > 0) {
        const uniqueIds = Array.from(new Set(input.memberIds));
        await db.insert(studyGroupMembers).values(
          uniqueIds.map(userId => ({ groupId, userId }))
        );
      }

      return { id: groupId, ok: true as const };
    }),

  adminUpdateGroup: adminProcedure
    .input(
      z.object({
        groupId: z.number().int().positive(),
        name: z.string().trim().min(2).max(160),
        level: z.string().trim().min(1).max(24),
        description: z.string().trim().max(500).optional(),
        memberIds: z.array(z.number().int().positive()),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "قاعدة البيانات غير متاحة" });

      await db
        .update(studyGroups)
        .set({
          name: input.name,
          level: input.level,
          description: input.description ?? null,
        })
        .where(eq(studyGroups.id, input.groupId));

      await db
        .delete(studyGroupMembers)
        .where(eq(studyGroupMembers.groupId, input.groupId));

      if (input.memberIds.length > 0) {
        const uniqueIds = Array.from(new Set(input.memberIds));
        await db.insert(studyGroupMembers).values(
          uniqueIds.map(userId => ({ groupId: input.groupId, userId }))
        );
      }

      return { ok: true as const };
    }),

  adminDeleteGroup: adminProcedure
    .input(z.object({ groupId: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "قاعدة البيانات غير متاحة" });

      await db
        .delete(studyGroupMembers)
        .where(eq(studyGroupMembers.groupId, input.groupId));
      await db.delete(studyGroups).where(eq(studyGroups.id, input.groupId));
      return { ok: true as const };
    }),

  /* =========================================================
   * 3. STUDENT: MY CLASSROOMS (STRICT FIRST-NAME-ONLY PRIVACY!)
   * ========================================================= */
  myGroups: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    const myMemberships = await db
      .select({ groupId: studyGroupMembers.groupId })
      .from(studyGroupMembers)
      .where(eq(studyGroupMembers.userId, ctx.user.id));

    if (myMemberships.length === 0) return [];

    const groupIds = myMemberships.map(m => m.groupId);
    const [groups, allMembers] = await Promise.all([
      db.select().from(studyGroups).where(inArray(studyGroups.id, groupIds)),
      db
        .select()
        .from(studyGroupMembers)
        .where(inArray(studyGroupMembers.groupId, groupIds)),
    ]);

    const memberUserIds = Array.from(new Set(allMembers.map(m => m.userId)));
    const [memberUsers, memberProfiles] =
      memberUserIds.length > 0
        ? await Promise.all([
            db
              .select({ id: users.id, name: users.name })
              .from(users)
              .where(inArray(users.id, memberUserIds)),
            db
              .select()
              .from(studentGameProfiles)
              .where(inArray(studentGameProfiles.userId, memberUserIds)),
          ])
        : [[], []];

    const userMap = new Map(memberUsers.map(u => [u.id, u]));
    const profileMap = new Map(memberProfiles.map(p => [p.userId, p]));

    return groups.map(group => {
      const classmates = allMembers
        .filter(m => m.groupId === group.id)
        .map(m => {
          const u = userMap.get(m.userId);
          const gp = profileMap.get(m.userId);
          return {
            id: m.userId,
            // STRICT PRIVACY: ONLY first name is exposed to classmates!
            firstName: firstNameOnly(u?.name),
            avatarPreset: gp?.avatarPreset ?? "lion",
            equippedSkin: gp?.equippedSkin ?? "classic",
            streakDays: gp?.streakDays ?? 1,
            weeklyXp: gp?.weeklyXp ?? 25,
            isCurrentUser: m.userId === ctx.user.id,
          };
        })
        .sort((a, b) => b.weeklyXp - a.weeklyXp);

      return {
        id: group.id,
        name: group.name,
        level: group.level,
        description: group.description,
        accent: group.accent,
        classmates,
      };
    });
  }),

  /* =========================================================
   * 4. GAMIFICATION PROFILE, AVATARS & STREAK SKINS
   * ========================================================= */
  myGameProfile: protectedProcedure.query(async ({ ctx }) => {
    const profile = await ensureGameProfile(ctx.user.id);
    return {
      ...profile,
      firstName: firstNameOnly(ctx.user.name),
      unlockedSkins: STREAK_SKINS.filter(s => profile.streakDays >= s.minStreak).map(s => s.id),
    };
  }),

  updateCustomization: protectedProcedure
    .input(
      z.object({
        avatarPreset: z.string().trim().min(1).max(48).optional(),
        equippedSkin: z.string().trim().min(1).max(48).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "قاعدة البيانات غير متاحة" });

      const profile = await ensureGameProfile(ctx.user.id);
      const updates: Partial<typeof studentGameProfiles.$inferInsert> = {};

      if (input.avatarPreset) {
        if (!VALID_AVATAR_IDS.has(input.avatarPreset)) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "الأفتار المختار غير صالح" });
        }
        updates.avatarPreset = input.avatarPreset;
      }

      if (input.equippedSkin) {
        const skin = SKIN_BY_ID.get(input.equippedSkin);
        if (!skin) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "السكن المختار غير صالح" });
        }
        if (profile.streakDays < skin.minStreak) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: `هذا السكن يفتح عند الوصول إلى ${skin.minStreak} أيام حماسة متتالية 🔥`,
          });
        }
        updates.equippedSkin = input.equippedSkin;
      }

      if (Object.keys(updates).length > 0) {
        await db
          .update(studentGameProfiles)
          .set(updates)
          .where(eq(studentGameProfiles.id, profile.id));
      }

      return {
        ...profile,
        ...updates,
        ok: true as const,
      };
    }),

  addXp: protectedProcedure
    .input(
      z.object({
        amount: z.number().int().min(5).max(500),
        questId: z.string().trim().max(64).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "قاعدة البيانات غير متاحة" });

      const profile = await ensureGameProfile(ctx.user.id);
      const next = {
        dailyXp: profile.dailyXp + input.amount,
        weeklyXp: profile.weeklyXp + input.amount,
        monthlyXp: profile.monthlyXp + input.amount,
        yearlyXp: profile.yearlyXp + input.amount,
      };

      await db
        .update(studentGameProfiles)
        .set(next)
        .where(eq(studentGameProfiles.id, profile.id));

      return { ...profile, ...next, ok: true as const };
    }),

  /* =========================================================
   * 5. COMPETITIONS & LEADERBOARDS (DAILY/WEEKLY/MONTHLY/YEARLY)
   *    Real Students (FIRST NAME ONLY!) + Realistic Egyptian Rivals
   * ========================================================= */
  leaderboard: publicProcedure
    .input(
      z.object({
        period: z.enum(["daily", "weekly", "monthly", "yearly"]).default("weekly"),
      })
    )
    .query(async ({ ctx, input }) => {
      const period: CompetitionPeriod = input.period;
      const virtuals = buildVirtualCompetitors(period);

      const db = await getDb();
      let realEntries: LeaderboardEntry[] = [];

      if (db) {
        if (ctx.user) {
          await ensureGameProfile(ctx.user.id).catch(() => {});
        }
        const [profiles, studentUsers] = await Promise.all([
          db.select().from(studentGameProfiles),
          db
            .select({ id: users.id, name: users.name, role: users.role })
            .from(users),
        ]);

        const userMap = new Map(studentUsers.map(u => [u.id, u]));
        realEntries = profiles
          .map(p => {
            const u = userMap.get(p.userId);
            if (!u) return null;
            const xp =
              period === "daily"
                ? p.dailyXp
                : period === "weekly"
                  ? p.weeklyXp
                  : period === "monthly"
                    ? p.monthlyXp
                    : p.yearlyXp;
            return {
              id: `u_${p.userId}`,
              // STRICT PRIVACY: ONLY first name is shown in public/peer leaderboards!
              firstName: firstNameOnly(u.name),
              avatarPreset: p.avatarPreset,
              equippedSkin: p.equippedSkin,
              streakDays: p.streakDays,
              xp,
              isCurrentUser: ctx.user?.id === p.userId,
            };
          })
          .filter((e): e is NonNullable<typeof e> => Boolean(e));
      }

      const combined = [...realEntries, ...virtuals]
        .sort((a, b) => b.xp - a.xp)
        .map((entry, idx) => ({
          ...entry,
          rank: idx + 1,
        }));

      const myEntry = combined.find(e => e.isCurrentUser) ?? null;

      return {
        period,
        entries: combined.slice(0, 25),
        myEntry,
        quests: CHALLENGE_QUESTS.filter(q => q.period === period),
      };
    }),

  /* =========================================================
   * 6. REFERRAL REWARDS ("ادعُ صاحبك واكسب")
   * ========================================================= */
  myReferral: protectedProcedure.query(async ({ ctx }) => {
    const code = buildReferralCode(ctx.user.id);
    const shareUrl = `https://www.link-me.tech/signup?ref=${encodeURIComponent(code)}`;
    const db = await getDb();
    if (!db) {
      return {
        code,
        shareUrl,
        invitedCount: 0,
        totalBonusXp: 0,
        invitedFriends: [] as { id: number; firstName: string; rewardXp: number; joinedAt: Date }[],
      };
    }

    const rows = await db
      .select()
      .from(studentReferrals)
      .where(eq(studentReferrals.referrerUserId, ctx.user.id))
      .orderBy(desc(studentReferrals.createdAt));

    const referredIds = rows.map(r => r.referredUserId);
    const friendUsers =
      referredIds.length > 0
        ? await db
            .select({ id: users.id, name: users.name })
            .from(users)
            .where(inArray(users.id, referredIds))
        : [];

    const friendMap = new Map(friendUsers.map(u => [u.id, u.name]));
    const invitedFriends = rows.map(r => ({
      id: r.id,
      firstName: firstNameOnly(friendMap.get(r.referredUserId)),
      rewardXp: r.rewardXp,
      joinedAt: r.createdAt,
    }));

    return {
      code,
      shareUrl,
      invitedCount: rows.length,
      totalBonusXp: rows.reduce((sum, r) => sum + r.rewardXp, 0),
      invitedFriends,
    };
  }),

  /* =========================================================
   * 7. ADMIN ANALYTICS & INACTIVE STUDENT ALERTS
   * ========================================================= */
  adminAnalytics: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) {
      return {
        summary: {
          totalStudents: 0,
          activeSubscribers: 0,
          approvedRevenueEgp: 0,
          pendingReceiptsCount: 0,
          totalEnrollments: 0,
          totalReferrals: 0,
        },
        monthlyRevenue: [] as { monthKey: string; label: string; revenueEgp: number; ordersCount: number }[],
        topCourses: [] as { id: number; titleAr: string; level: string; enrollmentsCount: number }[],
        levelDistribution: [] as { level: string; count: number }[],
        inactiveStudents: [] as {
          id: number;
          name: string;
          email: string;
          phone: string;
          englishLevel: string | null;
          daysSinceActive: number;
          streakDays: number;
        }[],
      };
    }

    const [
      allUsers,
      allEnrollments,
      allCourses,
      allReceipts,
      allOrders,
      allSubs,
      allProfiles,
      allReferrals,
    ] = await Promise.all([
      db.select().from(users).where(eq(users.role, "user")),
      db.select().from(enrollments),
      db.select({ id: courses.id, titleAr: courses.titleAr, level: courses.level }).from(courses),
      db.select().from(paymentReceipts),
      db.select().from(orders),
      db.select().from(subscriptions),
      db.select().from(studentGameProfiles),
      db.select().from(studentReferrals),
    ]);

    const now = Date.now();
    const activeSubscribers = allSubs.filter(
      s => s.status === "active" && new Date(s.currentPeriodEnd).getTime() > now
    ).length;

    const paidOrders = allOrders.filter(o => o.status === "paid");
    const approvedReceipts = allReceipts.filter(r => r.status === "approved");
    const pendingReceiptsCount = allReceipts.filter(r => r.status === "pending").length;

    const revenueCentsFromOrders = paidOrders.reduce((s, o) => s + o.amountCents, 0);
    const revenueCentsFromReceipts = approvedReceipts.reduce((s, r) => s + r.amountCents, 0);
    const approvedRevenueEgp = Math.round(
      Math.max(revenueCentsFromOrders, revenueCentsFromReceipts) / 100
    );

    // Monthly revenue over the last 6 months
    const monthNamesAr = [
      "يناير",
      "فبراير",
      "مارس",
      "أبريل",
      "مايو",
      "يونيو",
      "يوليو",
      "أغسطس",
      "سبتمبر",
      "أكتوبر",
      "نوفمبر",
      "ديسمبر",
    ];
    const dNow = new Date();
    const monthsBucket = Array.from({ length: 6 }, (_, idx) => {
      const d = new Date(dNow.getFullYear(), dNow.getMonth() - (5 - idx), 1);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      return {
        monthKey,
        label: monthNamesAr[d.getMonth()],
        revenueEgp: 0,
        ordersCount: 0,
      };
    });
    const monthMap = new Map(monthsBucket.map(m => [m.monthKey, m]));
    const revenueSource = paidOrders.length >= approvedReceipts.length ? paidOrders : approvedReceipts;
    for (const item of revenueSource) {
      const dt = new Date(item.createdAt);
      const mk = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
      const bucket = monthMap.get(mk);
      if (bucket) {
        bucket.revenueEgp += Math.round(item.amountCents / 100);
        bucket.ordersCount += 1;
      }
    }

    // Top courses by enrollment count
    const courseCounts = new Map<number, number>();
    for (const enr of allEnrollments) {
      courseCounts.set(enr.courseId, (courseCounts.get(enr.courseId) ?? 0) + 1);
    }
    const topCourses = allCourses
      .map(c => ({
        id: c.id,
        titleAr: c.titleAr,
        level: c.level,
        enrollmentsCount: courseCounts.get(c.id) ?? 0,
      }))
      .sort((a, b) => b.enrollmentsCount - a.enrollmentsCount)
      .slice(0, 6);

    // Level distribution
    const levelOrder = ["A1", "A2", "B1", "B2", "C1", "C2", "غير محدد"];
    const levelCounts = new Map<string, number>();
    for (const u of allUsers) {
      const lvl = u.englishLevel ?? "غير محدد";
      levelCounts.set(lvl, (levelCounts.get(lvl) ?? 0) + 1);
    }
    const levelDistribution = levelOrder
      .map(level => ({ level, count: levelCounts.get(level) ?? 0 }))
      .filter(row => row.count > 0);

    // Inactive students (> 3 days since last sign-in or activity)
    const profileMap = new Map(allProfiles.map(p => [p.userId, p]));
    const inactiveStudents = allUsers
      .map(u => {
        const lastTs = u.lastSignedIn ? new Date(u.lastSignedIn).getTime() : 0;
        const daysSinceActive = lastTs
          ? Math.floor((now - lastTs) / 86_400_000)
          : 99;
        return {
          id: u.id,
          name: u.name ?? "طالب",
          email: u.email ?? "",
          phone: u.phone ?? "",
          englishLevel: u.englishLevel,
          daysSinceActive,
          streakDays: profileMap.get(u.id)?.streakDays ?? 0,
        };
      })
      .filter(s => s.daysSinceActive >= 3)
      .sort((a, b) => b.daysSinceActive - a.daysSinceActive)
      .slice(0, 20);

    return {
      summary: {
        totalStudents: allUsers.length,
        activeSubscribers,
        approvedRevenueEgp,
        pendingReceiptsCount,
        totalEnrollments: allEnrollments.length,
        totalReferrals: allReferrals.length,
      },
      monthlyRevenue: monthsBucket,
      topCourses,
      levelDistribution,
      inactiveStudents,
    };
  }),

  /* =========================================================
   * 8. ADMIN: ONE-CLICK PARENT PROGRESS REPORT
   * ========================================================= */
  adminParentReport: adminProcedure
    .input(z.object({ studentId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "قاعدة البيانات غير متاحة",
        });
      }

      const [student] = await db
        .select()
        .from(users)
        .where(eq(users.id, input.studentId))
        .limit(1);

      if (!student) {
        throw new TRPCError({ code: "NOT_FOUND", message: "الطالب غير موجود" });
      }

      const [enrs, progress, attendance, tasks, ratings, profiles] =
        await Promise.all([
          db
            .select()
            .from(enrollments)
            .where(eq(enrollments.userId, student.id)),
          db
            .select()
            .from(lessonProgress)
            .where(eq(lessonProgress.userId, student.id)),
          db
            .select()
            .from(sessionAttendance)
            .where(eq(sessionAttendance.userId, student.id)),
          db
            .select()
            .from(studentTasks)
            .where(eq(studentTasks.userId, student.id)),
          db
            .select()
            .from(studentRatings)
            .where(eq(studentRatings.userId, student.id))
            .orderBy(desc(studentRatings.createdAt)),
          db
            .select()
            .from(studentGameProfiles)
            .where(eq(studentGameProfiles.userId, student.id))
            .limit(1),
        ]);

      const attended = attendance.filter(
        a => a.status === "present" || a.status === "late"
      ).length;
      const attendanceRate =
        attendance.length > 0
          ? Math.round((attended / attendance.length) * 100)
          : null;
      const completedLessons = progress.length;
      const reviewedTasks = tasks.filter(
        t => t.status === "reviewed" || t.status === "submitted"
      ).length;
      const openTasks = tasks.filter(
        t => t.status === "assigned" || t.status === "in_progress"
      ).length;
      const latestRating = ratings[0] ?? null;
      const gameProfile = profiles[0] ?? null;

      return {
        studentId: student.id,
        name: student.name ?? "طالب Link Me",
        email: student.email ?? "",
        phone: student.phone ?? "",
        englishLevel: student.englishLevel ?? "قيد التحديد",
        enrollmentsCount: enrs.length,
        completedLessons,
        attendedSessions: attended,
        totalSessions: attendance.length,
        attendanceRate,
        reviewedTasks,
        openTasks,
        streakDays: gameProfile?.streakDays ?? 1,
        weeklyXp: gameProfile?.weeklyXp ?? 25,
        latestRatingStars: latestRating?.stars ?? null,
        latestRatingNote: latestRating?.note ?? null,
      };
    }),

  /* =========================================================
   * 9. ANNOUNCEMENTS & STUDENT NOTIFICATION BELL
   * ========================================================= */
  adminListAnnouncements: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { items: [], groups: [] };
    const [items, groups] = await Promise.all([
      db.select().from(announcements).orderBy(desc(announcements.createdAt)),
      db.select({ id: studyGroups.id, name: studyGroups.name, level: studyGroups.level }).from(studyGroups),
    ]);
    const groupMap = new Map(groups.map(g => [g.id, g.name]));
    return {
      items: items.map(item => ({
        ...item,
        targetGroupName: item.targetGroupId
          ? groupMap.get(item.targetGroupId) ?? "فصل محذوف"
          : "كل الطلبة",
      })),
      groups,
    };
  }),

  adminCreateAnnouncement: adminProcedure
    .input(
      z.object({
        title: z.string().trim().min(2, "اكتب عنوان الإعلان").max(180),
        body: z.string().trim().min(3, "اكتب نص الإعلان").max(2000),
        targetGroupId: z.number().int().positive().nullable().optional(),
        priority: z.enum(["info", "urgent", "celebration"]).default("info"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "قاعدة البيانات غير متاحة" });

      const [res] = await db.insert(announcements).values({
        title: input.title,
        body: input.body,
        targetGroupId: input.targetGroupId ?? null,
        priority: input.priority,
        createdBy: ctx.user.id,
      });
      return { id: Number(res.insertId), ok: true as const };
    }),

  adminDeleteAnnouncement: adminProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "قاعدة البيانات غير متاحة" });

      await db
        .delete(announcementReads)
        .where(eq(announcementReads.announcementId, input.id));
      await db.delete(announcements).where(eq(announcements.id, input.id));
      return { ok: true as const };
    }),

  myAnnouncements: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { items: [], unreadCount: 0 };

    const [myGroupRows, allAnnouncements, myReads, groups] = await Promise.all([
      db
        .select({ groupId: studyGroupMembers.groupId })
        .from(studyGroupMembers)
        .where(eq(studyGroupMembers.userId, ctx.user.id)),
      db.select().from(announcements).orderBy(desc(announcements.createdAt)).limit(30),
      db
        .select({ announcementId: announcementReads.announcementId })
        .from(announcementReads)
        .where(eq(announcementReads.userId, ctx.user.id)),
      db.select({ id: studyGroups.id, name: studyGroups.name }).from(studyGroups),
    ]);

    const myGroupSet = new Set(myGroupRows.map(g => g.groupId));
    const readSet = new Set(myReads.map(r => r.announcementId));
    const groupMap = new Map(groups.map(g => [g.id, g.name]));

    const visible = allAnnouncements
      .filter(a => a.targetGroupId === null || myGroupSet.has(a.targetGroupId))
      .map(a => ({
        ...a,
        targetGroupName: a.targetGroupId ? groupMap.get(a.targetGroupId) ?? null : null,
        isRead: readSet.has(a.id),
      }));

    return {
      items: visible,
      unreadCount: visible.filter(i => !i.isRead).length,
    };
  }),

  markAnnouncementsRead: protectedProcedure
    .input(z.object({ ids: z.array(z.number().int().positive()).max(50) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db || input.ids.length === 0) return { ok: true as const };

      for (const announcementId of input.ids) {
        try {
          await db.insert(announcementReads).values({
            announcementId,
            userId: ctx.user.id,
          });
        } catch {
          // ignore duplicate unique key if already read
        }
      }
      return { ok: true as const };
    }),

  /* =========================================================
   * 10. DYNAMIC PROMO CODES MANAGER & CHECKOUT VALIDATOR
   * ========================================================= */
  adminListPromos: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(promoCodes).orderBy(desc(promoCodes.createdAt));
  }),

  adminCreatePromo: adminProcedure
    .input(
      z.object({
        code: z
          .string()
          .trim()
          .min(3, "الكود لا يقل عن 3 أحرف")
          .max(40)
          .transform(s => s.toUpperCase().replace(/\s+/g, "")),
        discountPercent: z.number().int().min(5).max(95),
        label: z.string().trim().min(2, "اكتب وصف الكود").max(160),
        maxUses: z.number().int().positive().nullable().optional(),
        expiresAt: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "قاعدة البيانات غير متاحة" });

      const [existing] = await db
        .select({ id: promoCodes.id })
        .from(promoCodes)
        .where(eq(promoCodes.code, input.code))
        .limit(1);
      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "كود الخصم ده موجود بالفعل" });
      }

      const [res] = await db.insert(promoCodes).values({
        code: input.code,
        discountPercent: input.discountPercent,
        label: input.label,
        maxUses: input.maxUses ?? null,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
        isActive: true,
        createdBy: ctx.user.id,
      });

      return { id: Number(res.insertId), ok: true as const };
    }),

  adminTogglePromo: adminProcedure
    .input(z.object({ id: z.number().int().positive(), isActive: z.boolean() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "قاعدة البيانات غير متاحة" });

      await db
        .update(promoCodes)
        .set({ isActive: input.isActive })
        .where(eq(promoCodes.id, input.id));
      return { ok: true as const };
    }),

  adminDeletePromo: adminProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "قاعدة البيانات غير متاحة" });

      await db.delete(promoCodes).where(eq(promoCodes.id, input.id));
      return { ok: true as const };
    }),

  validatePromoCode: publicProcedure
    .input(
      z.object({
        code: z.string().trim().min(1).max(40),
        amountCents: z.number().int().nonnegative(),
      })
    )
    .mutation(async ({ input }) => {
      const normalized = input.code.trim().toUpperCase();
      const db = await getDb();

      if (db) {
        const [dbPromo] = await db
          .select()
          .from(promoCodes)
          .where(eq(promoCodes.code, normalized))
          .limit(1);

        if (dbPromo) {
          if (!dbPromo.isActive) {
            return {
              valid: false as const,
              messageAr: "عذراً، كود الخصم ده موقوف حالياً.",
              discountCents: 0,
              finalCents: input.amountCents,
              promo: null,
            };
          }
          if (dbPromo.expiresAt && new Date(dbPromo.expiresAt).getTime() < Date.now()) {
            return {
              valid: false as const,
              messageAr: "عذراً، انتهت صلاحية كود الخصم ده.",
              discountCents: 0,
              finalCents: input.amountCents,
              promo: null,
            };
          }
          if (dbPromo.maxUses !== null && dbPromo.usedCount >= dbPromo.maxUses) {
            return {
              valid: false as const,
              messageAr: "عذراً، تم استنفاد الحد الأقصى لاستخدام هذا الكود.",
              discountCents: 0,
              finalCents: input.amountCents,
              promo: null,
            };
          }

          const discountCents = Math.round(
            (input.amountCents * dbPromo.discountPercent) / 100
          );
          await db
            .update(promoCodes)
            .set({ usedCount: dbPromo.usedCount + 1 })
            .where(eq(promoCodes.id, dbPromo.id));

          return {
            valid: true as const,
            messageAr: `تم تفعيل ${dbPromo.label} بنجاح!`,
            discountCents,
            finalAmountCents: Math.max(0, input.amountCents - discountCents),
            promo: {
              code: dbPromo.code,
              type: "percent" as const,
              value: dbPromo.discountPercent,
              descriptionAr: dbPromo.label,
              active: true,
            },
          };
        }
      }

      // Fallback to built-in static promo codes (LINKME10, YASSIN20, etc.)
      const fallback = applyStaticPromoCode(normalized, input.amountCents);
      return {
        valid: fallback.valid,
        messageAr: fallback.messageAr,
        discountCents: fallback.discountCents,
        finalAmountCents: fallback.finalAmountCents,
        promo: fallback.promo ?? null,
      };
    }),
});
