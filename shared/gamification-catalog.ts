/**
 * Link Me — Shared Avatars, Streak Skins, Competitions, and Privacy Helpers
 */

/**
 * Privacy helper: strictly returns ONLY the first name of a student so
 * classmates and leaderboard peers never see last names or full identities.
 */
export function firstNameOnly(fullName: string | null | undefined): string {
  const cleaned = (fullName ?? "").trim();
  if (!cleaned) return "متعلّم";
  return cleaned.split(/\s+/)[0] || "متعلّم";
}

export interface AvatarPreset {
  id: string;
  label: string;
  emoji: string;
  bgClass: string;
}

export const AVATAR_PRESETS: AvatarPreset[] = [
  { id: "lion", label: "شبل الطلاقة", emoji: "🦁", bgClass: "from-blue-500 to-indigo-600" },
  { id: "flower", label: "نجمة اللطف", emoji: "🌸", bgClass: "from-pink-400 to-rose-500" },
  { id: "rocket", label: "رائد الفضاء", emoji: "🚀", bgClass: "from-violet-500 to-purple-700" },
  { id: "owl", label: "البومة الذكية", emoji: "🦉", bgClass: "from-slate-700 to-indigo-900" },
  { id: "fox", label: "الثعلب السريع", emoji: "🦊", bgClass: "from-orange-400 to-amber-600" },
  { id: "cat", label: "القطة الكيوت", emoji: "🐱", bgClass: "from-fuchsia-400 to-pink-500" },
  { id: "panda", label: "الباندا الهادئ", emoji: "🐼", bgClass: "from-emerald-400 to-teal-600" },
  { id: "tiger", label: "النمر المتحمس", emoji: "🐯", bgClass: "from-amber-500 to-red-500" },
  { id: "butterfly", label: "فراشة الإنجليزي", emoji: "🦋", bgClass: "from-sky-400 to-cyan-600" },
  { id: "crown", label: "بطل القمة", emoji: "👑", bgClass: "from-yellow-400 to-amber-600" },
  { id: "headphones", label: "عاشق النطق", emoji: "🎧", bgClass: "from-cyan-500 to-blue-600" },
  { id: "book", label: "عبقري الكلمات", emoji: "📚", bgClass: "from-teal-500 to-emerald-700" },
];

export function getAvatarPreset(id?: string | null): AvatarPreset {
  return AVATAR_PRESETS.find(a => a.id === id) ?? AVATAR_PRESETS[0];
}

export interface StreakSkin {
  id: string;
  name: string;
  badgeEmoji: string;
  minStreak: number;
  description: string;
  ringClass: string;
  cardGlowClass: string;
  pillClass: string;
}

export const STREAK_SKINS: StreakSkin[] = [
  {
    id: "classic",
    name: "الإطار الكلاسيكي",
    badgeEmoji: "⭐",
    minStreak: 0,
    description: "بداية الأبطال — متاح للجميع من اليوم الأول",
    ringClass: "ring-2 ring-iris/40",
    cardGlowClass: "border-line bg-card",
    pillClass: "bg-iris/10 text-iris",
  },
  {
    id: "bronze_flame",
    name: "شعلة البرونز",
    badgeEmoji: "🔥",
    minStreak: 3,
    description: "يفتح عند الوصول إلى 3 أيام حماسة متتالية",
    ringClass: "ring-[3px] ring-amber-600 shadow-[0_0_14px_rgba(217,119,6,0.45)]",
    cardGlowClass: "border-amber-500/40 bg-gradient-to-br from-amber-50/50 to-card dark:from-amber-950/25",
    pillClass: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  },
  {
    id: "silver_spark",
    name: "وميض الفضة",
    badgeEmoji: "⚡",
    minStreak: 7,
    description: "يفتح عند الوصول إلى 7 أيام حماسة متتالية (أسبوع كامل)",
    ringClass: "ring-[3px] ring-sky-400 shadow-[0_0_16px_rgba(56,189,248,0.55)]",
    cardGlowClass: "border-sky-400/50 bg-gradient-to-br from-sky-50/50 to-card dark:from-sky-950/25",
    pillClass: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  },
  {
    id: "golden_star",
    name: "النجم الذهبي",
    badgeEmoji: "✨",
    minStreak: 14,
    description: "يفتح عند الوصول إلى 14 يوم حماسة متتالية (أسبوعين)",
    ringClass: "ring-[3px] ring-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.7)]",
    cardGlowClass: "border-yellow-400/60 bg-gradient-to-br from-yellow-50/60 via-amber-50/30 to-card dark:from-yellow-950/30",
    pillClass: "bg-yellow-500/20 text-yellow-800 dark:text-yellow-300",
  },
  {
    id: "diamond_aura",
    name: "الأسطورة الماسية",
    badgeEmoji: "💎",
    minStreak: 30,
    description: "يفتح عند الوصول إلى 30 يوم حماسة متتالية (شهر كامل!)",
    ringClass: "ring-[3px] ring-cyan-400 shadow-[0_0_22px_rgba(34,211,238,0.75)] animate-pulse",
    cardGlowClass: "border-cyan-400/60 bg-gradient-to-br from-cyan-50/60 via-blue-50/30 to-card dark:from-cyan-950/30",
    pillClass: "bg-cyan-500/20 text-cyan-800 dark:text-cyan-300",
  },
  {
    id: "royal_crown",
    name: "التاج الملكي",
    badgeEmoji: "👑",
    minStreak: 60,
    description: "يفتح للأساطير عند 60 يوم حماسة متتالية!",
    ringClass: "ring-[3px] ring-fuchsia-500 shadow-[0_0_24px_rgba(217,70,239,0.75)]",
    cardGlowClass: "border-fuchsia-500/60 bg-gradient-to-br from-fuchsia-50/60 via-purple-50/40 to-amber-50/30 dark:from-fuchsia-950/30",
    pillClass: "bg-fuchsia-500/20 text-fuchsia-700 dark:text-fuchsia-300",
  },
];

export function getStreakSkin(id?: string | null): StreakSkin {
  return STREAK_SKINS.find(s => s.id === id) ?? STREAK_SKINS[0];
}

export type CompetitionPeriod = "daily" | "weekly" | "monthly" | "yearly";

export interface ChallengeQuest {
  id: string;
  period: CompetitionPeriod;
  title: string;
  description: string;
  rewardXp: number;
  icon: string;
}

export const CHALLENGE_QUESTS: ChallengeQuest[] = [
  {
    id: "daily_checkin",
    period: "daily",
    title: "شعلة اليوم 🔥",
    description: "افتح المنصة وحافظ على سلسلة حماستك اليومية",
    rewardXp: 25,
    icon: "🔥",
  },
  {
    id: "daily_voice",
    period: "daily",
    title: "تحدي النطق السريع 🎙️",
    description: "تدرّب على جملة واحدة على الأقل في معمل النطق بالصوت",
    rewardXp: 40,
    icon: "🎙️",
  },
  {
    id: "weekly_lessons",
    period: "weekly",
    title: "سباق الأسبوع ⚡",
    description: "أكمل 3 دروس أو اختبار تحديد مستوى خلال هذا الأسبوع",
    rewardXp: 150,
    icon: "⚡",
  },
  {
    id: "weekly_streak3",
    period: "weekly",
    title: "ثبات 3 أيام متواصلة 🛡️",
    description: "احفظ حماستك 3 أيام ورا بعض وافتح سكن شعلة البرونز",
    rewardXp: 120,
    icon: "🛡️",
  },
  {
    id: "monthly_champ",
    period: "monthly",
    title: "بطل الشهر 🏆",
    description: "اجمع 500 نقطة خبرة XP هذا الشهر ونافس على المراكز الثلاثة الأولى",
    rewardXp: 400,
    icon: "🏆",
  },
  {
    id: "yearly_legend",
    period: "yearly",
    title: "أسطورة دوري السنة 👑",
    description: "حقق 30 يوم حماسة وافتح السكن الماسي وتصدّر دوري Link Me السنوي",
    rewardXp: 1500,
    icon: "👑",
  },
];

interface VirtualCompetitorSeed {
  id: string;
  firstName: string;
  avatarPreset: string;
  streakDays: number;
  equippedSkin: string;
  baseDaily: number;
  baseWeekly: number;
  baseMonthly: number;
  baseYearly: number;
}

/**
 * Realistic Egyptian first-name competitors so students always experience an
 * energetic, motivating leaderboard across daily, weekly, monthly, and yearly challenges.
 */
const VIRTUAL_SEEDS: VirtualCompetitorSeed[] = [
  { id: "v1", firstName: "سلمى", avatarPreset: "flower", streakDays: 34, equippedSkin: "diamond_aura", baseDaily: 115, baseWeekly: 680, baseMonthly: 2450, baseYearly: 18400 },
  { id: "v2", firstName: "يوسف", avatarPreset: "lion", streakDays: 21, equippedSkin: "golden_star", baseDaily: 95, baseWeekly: 590, baseMonthly: 2120, baseYearly: 15900 },
  { id: "v3", firstName: "ملك", avatarPreset: "butterfly", streakDays: 16, equippedSkin: "golden_star", baseDaily: 130, baseWeekly: 720, baseMonthly: 2290, baseYearly: 14200 },
  { id: "v4", firstName: "آدم", avatarPreset: "rocket", streakDays: 11, equippedSkin: "silver_spark", baseDaily: 80, baseWeekly: 460, baseMonthly: 1750, baseYearly: 12100 },
  { id: "v5", firstName: "نور", avatarPreset: "cat", streakDays: 63, equippedSkin: "royal_crown", baseDaily: 145, baseWeekly: 810, baseMonthly: 2890, baseYearly: 24600 },
  { id: "v6", firstName: "زياد", avatarPreset: "fox", streakDays: 9, equippedSkin: "silver_spark", baseDaily: 65, baseWeekly: 390, baseMonthly: 1480, baseYearly: 9800 },
  { id: "v7", firstName: "فريدة", avatarPreset: "crown", streakDays: 18, equippedSkin: "golden_star", baseDaily: 105, baseWeekly: 615, baseMonthly: 1990, baseYearly: 13700 },
  { id: "v8", firstName: "عمر", avatarPreset: "headphones", streakDays: 5, equippedSkin: "bronze_flame", baseDaily: 55, baseWeekly: 310, baseMonthly: 1180, baseYearly: 8200 },
  { id: "v9", firstName: "هنا", avatarPreset: "panda", streakDays: 14, equippedSkin: "golden_star", baseDaily: 90, baseWeekly: 520, baseMonthly: 1860, baseYearly: 11500 },
  { id: "v10", firstName: "كريم", avatarPreset: "tiger", streakDays: 4, equippedSkin: "bronze_flame", baseDaily: 45, baseWeekly: 270, baseMonthly: 940, baseYearly: 6900 },
  { id: "v11", firstName: "جنى", avatarPreset: "book", streakDays: 8, equippedSkin: "silver_spark", baseDaily: 70, baseWeekly: 430, baseMonthly: 1590, baseYearly: 10400 },
  { id: "v12", firstName: "طارق", avatarPreset: "owl", streakDays: 31, equippedSkin: "diamond_aura", baseDaily: 120, baseWeekly: 700, baseMonthly: 2610, baseYearly: 20100 },
  { id: "v13", firstName: "مريم", avatarPreset: "flower", streakDays: 6, equippedSkin: "bronze_flame", baseDaily: 60, baseWeekly: 345, baseMonthly: 1290, baseYearly: 8700 },
  { id: "v14", firstName: "حمزة", avatarPreset: "rocket", streakDays: 3, equippedSkin: "bronze_flame", baseDaily: 35, baseWeekly: 215, baseMonthly: 810, baseYearly: 5400 },
];

export interface LeaderboardEntry {
  id: string;
  firstName: string;
  avatarPreset: string;
  equippedSkin: string;
  streakDays: number;
  xp: number;
  isCurrentUser?: boolean;
}

export function buildVirtualCompetitors(
  period: CompetitionPeriod,
  now = new Date()
): LeaderboardEntry[] {
  // Deterministic gentle daily variance so leaderboard stays lively each day
  const daySeed = now.getUTCFullYear() * 1000 + now.getUTCMonth() * 40 + now.getUTCDate();
  const hourBoost = Math.floor(now.getUTCHours() * 1.5);

  return VIRTUAL_SEEDS.map((seed, idx) => {
    const jitter = ((daySeed * (idx + 7)) % 35) - 10;
    const base =
      period === "daily"
        ? seed.baseDaily + hourBoost
        : period === "weekly"
          ? seed.baseWeekly + hourBoost * 3
          : period === "monthly"
            ? seed.baseMonthly + hourBoost * 6
            : seed.baseYearly + hourBoost * 15;

    return {
      id: seed.id,
      firstName: seed.firstName,
      avatarPreset: seed.avatarPreset,
      equippedSkin: seed.equippedSkin,
      streakDays: seed.streakDays,
      xp: Math.max(15, base + jitter),
    };
  });
}
