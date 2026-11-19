import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Flame, Zap, Trophy, Award, Lock, Sparkles, Check, Snowflake } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getGamificationState,
  recordDailyActivity,
  ALL_BADGES,
  getLevelInfo,
  toggleStreakFreeze,
  type GamificationState,
  type Badge,
} from "@/lib/gamification";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { soundEffects } from "@/lib/sound-effects";
import { useCompanion } from "@/components/companion";
import { triggerConfetti } from "@/lib/confetti";

export function useGamification() {
  const [state, setState] = useState<GamificationState>(getGamificationState());

  useEffect(() => {
    // Record check-in today
    const res = recordDailyActivity();
    if (res.streakUpdated) {
      soundEffects.playStreak();
    }
    setState(getGamificationState());

    const handleUpdate = (e: Event) => {
      const custom = e as CustomEvent<GamificationState>;
      if (custom.detail) {
        setState(custom.detail);
      }
    };

    window.addEventListener("linkme:gamification-update", handleUpdate);
    return () => window.removeEventListener("linkme:gamification-update", handleUpdate);
  }, []);

  return state;
}

/** Streak Indicator Button for Header */
export function HeaderStreakIndicator({ className }: { className?: string }) {
  const { streak, xp, streakFreeze } = useGamification();
  const [dialogOpen, setDialogOpen] = useState(false);
  const { level } = getLevelInfo(xp);

  return (
    <>
      <button
        type="button"
        onClick={() => setDialogOpen(true)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold shadow-sm transition hover:scale-105 active:scale-95",
          streakFreeze
            ? "border-sky-300/80 bg-sky-50 text-sky-700 dark:border-sky-700 dark:bg-sky-950/40 dark:text-sky-300"
            : "border-amber-300/60 bg-amber-50/80 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
          className
        )}
        title={`استمرارك: ${streak} أيام | المستوى ${level} (${xp} XP) ${streakFreeze ? "| حماية الشعلة مفعلة ❄️" : ""}`}
      >
        {streakFreeze ? (
          <Snowflake className="size-3.5 text-sky-500 animate-spin-slow" />
        ) : (
          <Flame className="size-3.5 fill-amber-500 text-amber-500" />
        )}
        <span className="latin font-extrabold">{streak}</span>
        <span className="hidden md:inline text-[11px] font-normal">
          {streakFreeze ? "محمية ❄️" : "أيام 🔥"}
        </span>
        <span className="latin ms-0.5 rounded-full bg-iris/15 px-1.5 py-0.2 text-[10px] font-bold text-iris">
          L{level}
        </span>
      </button>

      <BadgesModal open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}

/** Badges & XP Modal */
export function BadgesModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { streak, xp, unlockedBadgeIds, streakFreeze } = useGamification();
  const { companion } = useCompanion();
  const { level, currentLevelXp, nextLevelXp, progress } = getLevelInfo(xp);
  const [freezeMsg, setFreezeMsg] = useState<string | null>(null);

  const handleFreeze = () => {
    const res = toggleStreakFreeze();
    setFreezeMsg(res.message);
    if (res.active) {
      soundEffects.playTrophy();
      triggerConfetti(1500);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6 bg-card text-ink" dir="rtl">
        <DialogHeader>
          <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
            <Trophy className="size-6 text-amber-500" />
          </div>
          <DialogTitle className="text-center text-xl font-bold">
            إنجازاتك ومستوى تقدمك 🏆🔥
          </DialogTitle>
          <DialogDescription className="text-center text-sm text-ink-soft">
            استمرارك اليومي هو سر تفوقك في الإنجليزي!
          </DialogDescription>
        </DialogHeader>

        {/* Level & XP Progress Card */}
        <div className="my-2 rounded-2xl border border-iris/25 bg-iris/5 p-3.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-iris flex items-center gap-1.5">
              <Zap className="size-4 fill-iris text-iris" />
              المستوى الحالي: <b>Level {level}</b>
            </span>
            <span className="latin font-bold text-ink-soft">
              {currentLevelXp} / {nextLevelXp} XP للمستوى التالي
            </span>
          </div>
          <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-iris/15">
            <div
              className="h-full rounded-full bg-gradient-to-r from-iris via-indigo-500 to-amber-500 transition-all duration-500"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-3 my-2">
          <div className="rounded-2xl border border-amber-200 bg-amber-50/60 dark:border-amber-900/40 dark:bg-amber-950/20 p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-amber-600 dark:text-amber-400">
              <Flame className="size-4 fill-amber-500 text-amber-500" />
              <span className="text-xs font-semibold">التتابع اليومي</span>
            </div>
            <p className="mt-1 text-2xl font-black text-amber-700 dark:text-amber-300 latin">
              {streak} <span className="text-xs font-normal">أيام</span>
            </p>
          </div>

          <div className="rounded-2xl border border-purple-200 bg-purple-50/60 dark:border-purple-900/40 dark:bg-purple-950/20 p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-purple-600 dark:text-purple-400">
              <Zap className="size-4 fill-purple-500 text-purple-500" />
              <span className="text-xs font-semibold">إجمالي الخبرة</span>
            </div>
            <p className="mt-1 text-2xl font-black text-purple-700 dark:text-purple-300 latin">
              {xp} <span className="text-xs font-normal">XP</span>
            </p>
          </div>
        </div>

        {/* Streak Freeze Feature Card */}
        <div className="rounded-2xl border border-sky-400/40 bg-sky-500/10 p-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-sky-500 text-white shadow-xs">
              <Snowflake className="size-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-ink">حماية الشعلة (Streak Freeze ❄️)</p>
              <p className="text-[11px] text-ink-soft">
                {streakFreeze ? "مفعّلة — شعلتك في أمان لو فاتك يوم!" : "تحمي تتابعك من الضياع لو انشغلت يوماً"}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={handleFreeze}
            variant={streakFreeze ? "secondary" : "default"}
            className={cn(
              "h-8 rounded-full text-xs font-bold shrink-0",
              streakFreeze
                ? "bg-sky-200 text-sky-900 hover:bg-sky-300"
                : "bg-sky-600 text-white hover:bg-sky-700"
            )}
          >
            {streakFreeze ? "إلغاء التفعيل" : "تفعيل (50 XP)"}
          </Button>
        </div>
        {freezeMsg && (
          <p className="text-center text-xs font-semibold text-sky-600 dark:text-sky-400">
            {freezeMsg}
          </p>
        )}

        {/* Companion Cheer */}
        <div className="rounded-2xl border border-line bg-paper/70 p-3 text-xs leading-relaxed text-ink flex items-center gap-3">
          <span className="text-2xl">{companion.favoriteEmoji}</span>
          <p>
            <b>{companion.name}:</b> "
            {companion.id === "khadija"
              ? "فخورة بيكي يا سكر وبكل يوم بتذاكري فيه.. كملي وشوفي الشارات بتنور إزاي! 🌸✨"
              : "عاش يا بطل! التتابع ده هو طريق الأساطير، متوقفش الشعلة واكتسح المستويات! 🚀🔥"}
            "
          </p>
        </div>

        {/* Badges List */}
        <div className="mt-4 space-y-2 max-h-60 overflow-y-auto pe-1">
          <p className="text-xs font-bold text-ink-soft mb-1">شارات الإتقان:</p>
          {ALL_BADGES.map((badge) => {
            const isUnlocked = unlockedBadgeIds.includes(badge.id);
            return (
              <div
                key={badge.id}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border p-2.5 transition-all",
                  isUnlocked
                    ? "border-emerald-200 bg-emerald-50/40 dark:border-emerald-900/40 dark:bg-emerald-950/20"
                    : "border-line bg-card opacity-60"
                )}
              >
                <div
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-xl text-lg shadow-sm",
                    isUnlocked ? "bg-white dark:bg-background" : "bg-paper-deep"
                  )}
                >
                  {badge.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-ink">{badge.title}</p>
                    {isUnlocked ? (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                        <Check className="size-3" /> تم الحصول عليها
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 text-[10px] text-ink-soft">
                        <Lock className="size-2.5" /> مقفولة
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-ink-soft truncate">{badge.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex flex-col gap-2">
          <Button
            asChild
            onClick={() => onOpenChange(false)}
            className="rounded-full w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold shadow-sm"
          >
            <Link href="/competitions">
              <Sparkles className="me-1.5 size-4" />
              افتح ساحة المسابقات والأفتارات والسكنات 🏆
            </Link>
          </Button>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-full w-full"
          >
            يلا نكمّل المذاكرة! 🚀
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
