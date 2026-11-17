/**
 * Link Me — Gamification & Daily Streak Engine
 * Tracks streaks, XP points, and achievements locally and reactively.
 */

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  accent: string;
}

export const ALL_BADGES: Badge[] = [
  {
    id: "first_step",
    title: "أول خطوة 🎯",
    description: "بدء أول تدريب أو درس في المنصة",
    icon: "🎯",
    accent: "from-blue-500 to-indigo-600",
  },
  {
    id: "streak_3",
    title: "شعلة الحماس 🔥",
    description: "الاستمرار في المذاكرة لـ 3 أيام متتالية",
    icon: "🔥",
    accent: "from-amber-500 to-orange-600",
  },
  {
    id: "streak_7",
    title: "محارب الأسبوع 🏆",
    description: "الاستمرار لـ 7 أيام متتالية بدون انقطاع",
    icon: "🏆",
    accent: "from-yellow-400 to-amber-600",
  },
  {
    id: "audio_hero",
    title: "صوت الثقة 🎙️",
    description: "التدريب على النطق الصوتي أو تسليم واجب صوتي",
    icon: "🎙️",
    accent: "from-purple-500 to-pink-600",
  },
  {
    id: "level_conqueror",
    title: "فاتح المستويات 🚀",
    description: "إتمام اختبار تحديد المستوى في بنك الـ 1000 سؤال",
    icon: "🚀",
    accent: "from-sky-400 to-blue-600",
  },
  {
    id: "fluent_heart",
    title: "قلب نابض بالإنجليزي 💖",
    description: "المذاكرة اليومية والتفاعل مع مرشدك المفضل",
    icon: "💖",
    accent: "from-pink-400 to-rose-600",
  },
];

export interface GamificationState {
  streak: number;
  lastActiveDate: string; // YYYY-MM-DD
  xp: number;
  unlockedBadgeIds: string[];
}

const STORAGE_KEY = "linkme_gamification_state";

function getTodayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getYesterdayString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function getGamificationState(): GamificationState {
  if (typeof window === "undefined") {
    return { streak: 1, lastActiveDate: getTodayString(), xp: 50, unlockedBadgeIds: ["first_step"] };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {}
  // Default fresh state
  const initial: GamificationState = {
    streak: 1,
    lastActiveDate: getTodayString(),
    xp: 50,
    unlockedBadgeIds: ["first_step"],
  };
  saveGamificationState(initial);
  return initial;
}

function saveGamificationState(state: GamificationState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent("linkme:gamification-update", { detail: state }));
  } catch {}
}

/** Record active learning activity today. Increments streak if continuous! */
export function recordDailyActivity(): { streak: number; streakUpdated: boolean; newBadge: Badge | null } {
  const state = getGamificationState();
  const today = getTodayString();
  const yesterday = getYesterdayString();

  let streakUpdated = false;
  let newBadge: Badge | null = null;

  if (state.lastActiveDate === today) {
    // Already recorded today, no streak increment needed
    return { streak: state.streak, streakUpdated: false, newBadge: null };
  }

  if (state.lastActiveDate === yesterday) {
    // Continuous daily streak!
    state.streak += 1;
    streakUpdated = true;
  } else {
    // Streak reset or fresh start
    state.streak = 1;
    streakUpdated = true;
  }

  state.lastActiveDate = today;
  state.xp += 25; // Daily check-in XP bonus

  // Check streak badges
  if (state.streak >= 3 && !state.unlockedBadgeIds.includes("streak_3")) {
    state.unlockedBadgeIds.push("streak_3");
    newBadge = ALL_BADGES.find((b) => b.id === "streak_3") || null;
  }
  if (state.streak >= 7 && !state.unlockedBadgeIds.includes("streak_7")) {
    state.unlockedBadgeIds.push("streak_7");
    newBadge = ALL_BADGES.find((b) => b.id === "streak_7") || null;
  }

  saveGamificationState(state);
  return { streak: state.streak, streakUpdated, newBadge };
}

/** Award XP points and optionally unlock a specific badge */
export function awardXP(points: number, badgeIdToUnlock?: string): { totalXP: number; newBadge: Badge | null } {
  const state = getGamificationState();
  state.xp += points;

  let newBadge: Badge | null = null;
  if (badgeIdToUnlock && !state.unlockedBadgeIds.includes(badgeIdToUnlock)) {
    state.unlockedBadgeIds.push(badgeIdToUnlock);
    newBadge = ALL_BADGES.find((b) => b.id === badgeIdToUnlock) || null;
  }

  saveGamificationState(state);
  return { totalXP: state.xp, newBadge };
}
