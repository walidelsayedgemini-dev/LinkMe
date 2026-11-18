import { randomInt } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import {
  sessions,
  studentGameProfiles,
  studyGroupMembers,
  studyGroups,
  users,
} from "../../drizzle/schema";
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
});
