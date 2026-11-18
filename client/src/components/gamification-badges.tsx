import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Flame, Zap, Trophy, Award, Lock, Sparkles, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getGamificationState,
  recordDailyActivity,
  ALL_BADGES,
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
  const { streak, xp } = useGamification();
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setDialogOpen(true)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border border-amber-300/60 bg-amber-50/80 px-2.5 py-1 text-xs font-bold text-amber-700 shadow-sm transition hover:scale-105 active:scale-95 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
          className
        )}
        title={`استمرارك: ${streak} أيام متتالية | ${xp} نقطة خبرة XP`}
      >
        <Flame className="size-3.5 fill-amber-500 text-amber-500 animate-pulse" />
        <span className="latin font-extrabold">{streak}</span>
        <span className="hidden md:inline text-[11px] font-normal text-amber-600 dark:text-amber-400">
          أيام 🔥
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
  const { streak, xp, unlockedBadgeIds } = useGamification();
  const { companion } = useCompanion();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6 bg-card text-ink" dir="rtl">
        <DialogHeader>
          <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
            <Trophy className="size-6 text-amber-500" />
          </div>
          <DialogTitle className="text-center text-xl font-bold">
            إنجازاتك وشعلة الحماس 🏆🔥
          </DialogTitle>
          <DialogDescription className="text-center text-sm text-ink-soft">
            استمرارك اليومي هو سر تفوقك في الإنجليزي!
          </DialogDescription>
        </DialogHeader>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-3 my-3">
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
              <span className="text-xs font-semibold">نقاط الخبرة XP</span>
            </div>
            <p className="mt-1 text-2xl font-black text-purple-700 dark:text-purple-300 latin">
              {xp} <span className="text-xs font-normal">XP</span>
            </p>
          </div>
        </div>

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
