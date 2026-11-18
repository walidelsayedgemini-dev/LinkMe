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
  imageUrl: string;
  bgClass: string;
  isPro?: boolean;
}

export const AVATAR_PRESETS: AvatarPreset[] = [
  { id: "lion", label: "شبل الطلاقة", emoji: "🦁", imageUrl: "/avatars/lion.webp", bgClass: "from-blue-500 to-indigo-600" },
  { id: "flower", label: "نجمة اللطف", emoji: "🌸", imageUrl: "/avatars/flower.webp", bgClass: "from-pink-400 to-rose-500" },
  { id: "rocket", label: "رائد الفضاء", emoji: "🚀", imageUrl: "/avatars/rocket.webp", bgClass: "from-violet-500 to-purple-700" },
  { id: "cat", label: "القطة الكيوت", emoji: "🐱", imageUrl: "/avatars/cat.webp", bgClass: "from-fuchsia-400 to-pink-500" },
  { id: "butterfly", label: "فراشة الإنجليزي", emoji: "🦋", imageUrl: "/avatars/butterfly.webp", bgClass: "from-sky-400 to-cyan-600" },
  { id: "headphones", label: "عاشق النطق", emoji: "🎧", imageUrl: "/avatars/headphones.webp", bgClass: "from-cyan-500 to-blue-600" },
  { id: "book", label: "عبقري الكلمات", emoji: "📚", imageUrl: "/avatars/book.webp", bgClass: "from-teal-500 to-emerald-700" },
  { id: "yassin_hero", label: "شخصية ياسين", emoji: "⚡", imageUrl: "/avatars/yassin_hero.webp", bgClass: "from-sky-500 to-blue-700" },
  { id: "khadija_star", label: "شخصية خديجة", emoji: "✨", imageUrl: "/avatars/khadija_star.webp", bgClass: "from-pink-500 to-rose-600" },
  // Exclusive VIP / PRO Avatars
  { id: "vip_king", label: "ملك الإنجليزي PRO", emoji: "🤴", imageUrl: "/avatars/vip_king.webp", bgClass: "from-amber-400 via-yellow-500 to-orange-600", isPro: true },
  { id: "vip_queen", label: "ملكة الطلاقة PRO", emoji: "👸", imageUrl: "/avatars/vip_queen.webp", bgClass: "from-rose-400 via-fuchsia-500 to-purple-700", isPro: true },
  { id: "vip_eagle", label: "نسر القمة PRO", emoji: "🦅", imageUrl: "/avatars/vip_eagle.webp", bgClass: "from-sky-500 via-indigo-600 to-slate-900", isPro: true },
  { id: "vip_astronaut", label: "رائد المجرة PRO", emoji: "👨‍🚀", imageUrl: "/avatars/vip_astronaut.webp", bgClass: "from-purple-600 via-indigo-600 to-cyan-500", isPro: true },
];

const LEGACY_AVATAR_FALLBACK: Record<string, string> = {
  owl: "book",
  fox: "lion",
  panda: "cat",
  tiger: "yassin_hero",
  crown: "vip_king",
};

export function getAvatarPreset(id?: string | null): AvatarPreset {
  const resolved = (id && LEGACY_AVATAR_FALLBACK[id]) || id;
  return AVATAR_PRESETS.find(a => a.id === resolved) ?? AVATAR_PRESETS[0];
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
  isPro?: boolean;
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
  // Exclusive VIP / PRO Skins (unlocked immediately for paid subscribers!)
  {
    id: "vip_gold_emperor",
    name: "هالة الإمبراطور الذهبية PRO",
    badgeEmoji: "👑",
    minStreak: 0,
    isPro: true,
    description: "سكن ملكي حصري لمشتركي الباقات المدفوعة مع شارة PRO الذهبية",
    ringClass: "ring-[3px] ring-amber-400 shadow-[0_0_26px_rgba(245,158,11,0.85)]",
    cardGlowClass: "border-amber-400/80 bg-gradient-to-br from-amber-100/70 via-yellow-50/40 to-card dark:from-amber-950/40",
    pillClass: "bg-gradient-to-r from-amber-500 to-yellow-500 text-white",
  },
  {
    id: "vip_cosmic_galaxy",
    name: "المجرة الكونية VIP",
    badgeEmoji: "🌌",
    minStreak: 0,
    isPro: true,
    description: "سكن كوني متوهج حصري لمشتركي PRO — يفتح فوراً عند التفعيل",
    ringClass: "ring-[3px] ring-purple-500 shadow-[0_0_26px_rgba(168,85,247,0.85)]",
    cardGlowClass: "border-purple-500/70 bg-gradient-to-br from-purple-100/60 via-indigo-50/40 to-card dark:from-purple-950/40",
    pillClass: "bg-gradient-to-r from-purple-600 to-indigo-600 text-white",
  },
  {
    id: "vip_emerald_elite",
    name: "الزمرد النخبوي VIP",
    badgeEmoji: "❇️",
    minStreak: 0,
    isPro: true,
    description: "سكن النخبة الأخضر المتألق حصري لطلاب الباقات والكورسات المدفوعة",
    ringClass: "ring-[3px] ring-emerald-400 shadow-[0_0_24px_rgba(16,185,129,0.8)]",
    cardGlowClass: "border-emerald-400/70 bg-gradient-to-br from-emerald-100/60 via-teal-50/30 to-card dark:from-emerald-950/35",
    pillClass: "bg-gradient-to-r from-emerald-600 to-teal-500 text-white",
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
  isPro?: boolean;
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
    description: "تدرّب على موقف واحد في محاكي المواقف أو 5 بطاقات فلاش كاردز",
    rewardXp: 40,
    icon: "🎙️",
  },
  {
    id: "daily_pro_boost",
    period: "daily",
    title: "مكافأة PRO اليومية 👑",
    description: "هدية حصرية يومية لمشتركي الباقات المدفوعة (تُضاعف تلقائياً ×2!)",
    rewardXp: 75,
    icon: "👑",
    isPro: true,
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
    id: "weekly_pro_roleplay",
    period: "weekly",
    title: "بطل مواقف PRO الأسبوعي 🎭",
    description: "أنهِ موقفين من مواقف PRO (آيلتس / بزنس / سفر) هذا الأسبوع",
    rewardXp: 250,
    icon: "🎭",
    isPro: true,
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
    id: "monthly_pro_master",
    period: "monthly",
    title: "إتقان حزم PRO الشهرية 💎",
    description: "أتقن 30 بطاقة من حزم C1 / IELTS / Business / Idioms هذا الشهر",
    rewardXp: 500,
    icon: "💎",
    isPro: true,
  },
  {
    id: "yearly_legend",
    period: "yearly",
    title: "أسطورة دوري السنة 👑",
    description: "حقق 30 يوم حماسة وافتح السكن الماسي وتصدّر دوري Link Me السنوي",
    rewardXp: 500,
    icon: "👑",
  },
  {
    id: "yearly_pro_emperor",
    period: "yearly",
    title: "إمبراطور الطلاقة PRO 🌌",
    description: "مكافأة سنوية كبرى لأعضاء PRO الملتزمين بمسار الإتقان الكامل",
    rewardXp: 500,
    icon: "🌌",
    isPro: true,
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
  { id: "v1", firstName: "سلمى", avatarPreset: "vip_queen", streakDays: 34, equippedSkin: "vip_cosmic_galaxy", baseDaily: 115, baseWeekly: 680, baseMonthly: 2450, baseYearly: 18400 },
  { id: "v2", firstName: "يوسف", avatarPreset: "lion", streakDays: 21, equippedSkin: "golden_star", baseDaily: 95, baseWeekly: 590, baseMonthly: 2120, baseYearly: 15900 },
  { id: "v3", firstName: "ملك", avatarPreset: "butterfly", streakDays: 16, equippedSkin: "golden_star", baseDaily: 130, baseWeekly: 720, baseMonthly: 2290, baseYearly: 14200 },
  { id: "v4", firstName: "آدم", avatarPreset: "rocket", streakDays: 11, equippedSkin: "silver_spark", baseDaily: 80, baseWeekly: 460, baseMonthly: 1750, baseYearly: 12100 },
  { id: "v5", firstName: "نور", avatarPreset: "vip_king", streakDays: 63, equippedSkin: "vip_gold_emperor", baseDaily: 145, baseWeekly: 810, baseMonthly: 2890, baseYearly: 24600 },
  { id: "v6", firstName: "زياد", avatarPreset: "yassin_hero", streakDays: 9, equippedSkin: "silver_spark", baseDaily: 65, baseWeekly: 390, baseMonthly: 1480, baseYearly: 9800 },
  { id: "v7", firstName: "فريدة", avatarPreset: "khadija_star", streakDays: 18, equippedSkin: "golden_star", baseDaily: 105, baseWeekly: 615, baseMonthly: 1990, baseYearly: 13700 },
  { id: "v8", firstName: "عمر", avatarPreset: "headphones", streakDays: 5, equippedSkin: "bronze_flame", baseDaily: 55, baseWeekly: 310, baseMonthly: 1180, baseYearly: 8200 },
  { id: "v9", firstName: "هنا", avatarPreset: "cat", streakDays: 14, equippedSkin: "golden_star", baseDaily: 90, baseWeekly: 520, baseMonthly: 1860, baseYearly: 11500 },
  { id: "v10", firstName: "كريم", avatarPreset: "book", streakDays: 4, equippedSkin: "bronze_flame", baseDaily: 45, baseWeekly: 270, baseMonthly: 940, baseYearly: 6900 },
  { id: "v11", firstName: "جنى", avatarPreset: "flower", streakDays: 8, equippedSkin: "silver_spark", baseDaily: 70, baseWeekly: 430, baseMonthly: 1590, baseYearly: 10400 },
  { id: "v12", firstName: "طارق", avatarPreset: "vip_eagle", streakDays: 31, equippedSkin: "vip_emerald_elite", baseDaily: 120, baseWeekly: 700, baseMonthly: 2610, baseYearly: 20100 },
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
  isVip?: boolean;
}

const VIP_VIRTUAL_IDS = new Set(["v1", "v5", "v12"]);

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
      isVip: VIP_VIRTUAL_IDS.has(seed.id),
    };
  });
}
