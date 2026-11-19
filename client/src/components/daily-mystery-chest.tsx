import { useEffect, useState } from "react";
import {
  Gift,
  Sparkles,
  Trophy,
  CheckCircle2,
  Volume2,
  Snowflake,
  Flame,
  ArrowRight,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { awardXP, toggleStreakFreeze } from "@/lib/gamification";
import { useGamification } from "@/components/gamification-badges";
import { soundEffects } from "@/lib/sound-effects";
import { triggerConfetti } from "@/lib/confetti";
import { useCompanion } from "@/components/companion";
import { cn } from "@/lib/utils";

const DAILY_CHEST_KEY = "linkme_daily_chest_date";

interface ChestReward {
  type: "xp" | "freeze" | "slang";
  titleAr: string;
  descAr: string;
  badge: string;
  xpAmount?: number;
  slangEn?: string;
  slangAr?: string;
  nativeTipEn?: string;
}

const REWARDS_POOL: ChestReward[] = [
  {
    type: "xp",
    titleAr: "كنز الـ 150 نقطة XP! ⚡",
    descAr: "دفعة طاقة جبارة ترفع مستواك وتقربك من صدارة المتصدرين!",
    badge: "+150 XP 🚀",
    xpAmount: 150,
  },
  {
    type: "xp",
    titleAr: "الضربة الذهبية: 250 نقطة XP! 👑",
    descAr: "جائزة نادرة جداً! زادت نقاطك دفعة واحدة!",
    badge: "+250 XP 🏆",
    xpAmount: 250,
  },
  {
    type: "freeze",
    titleAr: "درع حماية الشعلة (Streak Freeze ❄️)",
    descAr: "شعلتك متأمنة ليوم كامل حتى لو انشغلت ومفتحتش الموقع!",
    badge: "تجميد الشعلة ❄️",
    xpAmount: 75,
  },
  {
    type: "slang",
    titleAr: "تعبير الشارع الأمريكي اليومي 🇺🇸",
    descAr: "المصري بيقول: 'كبّر مخك' — الأمريكي بيقول:",
    badge: "Slang of the Day 💡",
    slangEn: "Let it slide / Brush it off",
    slangAr: "كبّر مخك ومتدقّقش",
    nativeTipEn: "Native tip: 'Don't enlarge your brain' is wrong! Always use 'Let it slide'!",
    xpAmount: 100,
  },
  {
    type: "slang",
    titleAr: "تعبير الشارع الأمريكي اليومي 🇺🇸",
    descAr: "المصري بيقول: 'على عيني وراسي' — الأمريكي بيقول:",
    badge: "Slang of the Day 💡",
    slangEn: "With pleasure / You got it!",
    slangAr: "من عينيّا الاتنين وبكل سرور",
    nativeTipEn: "Native tip: Use 'You got it!' when a colleague or client asks for a quick favor.",
    xpAmount: 100,
  },
  {
    type: "slang",
    titleAr: "تعبير الشارع الأمريكي اليومي 🇺🇸",
    descAr: "المصري بيقول: 'في الهوا سوا' — الأمريكي بيقول:",
    badge: "Slang of the Day 💡",
    slangEn: "We're in the same boat",
    slangAr: "ظروفنا واحدة وبنمر بنفس التحدي",
    nativeTipEn: "Native tip: Super natural in work meetings and casual chats!",
    xpAmount: 100,
  },
];

function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-US";
    u.rate = 0.92;
    window.speechSynthesis.speak(u);
  } catch {}
}

export function DailyMysteryChestModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const gamification = useGamification();
  const { companion } = useCompanion();
  const [opening, setOpening] = useState(false);
  const [reward, setReward] = useState<ChestReward | null>(null);

  const todayStr = new Date().toISOString().slice(0, 10);
  const alreadyOpenedToday =
    typeof window !== "undefined" &&
    localStorage.getItem(DAILY_CHEST_KEY) === todayStr;

  const handleOpenChest = () => {
    if (opening || reward) return;
    setOpening(true);
    soundEffects.playClick();
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate?.([60, 120, 80]);
    }

    setTimeout(() => {
      // Pick reward
      const randomIndex = Math.floor(Math.random() * REWARDS_POOL.length);
      const chosen = REWARDS_POOL[randomIndex];
      setReward(chosen);
      setOpening(false);

      // Award XP
      if (chosen.xpAmount) {
        awardXP(chosen.xpAmount);
      }
      if (chosen.type === "freeze") {
        toggleStreakFreeze();
      }

      // Mark today
      try {
        localStorage.setItem(DAILY_CHEST_KEY, todayStr);
      } catch {}

      // Play sound and confetti
      soundEffects.playTrophy();
      triggerConfetti(3500);
      toast.success(`مبروك! ربحت ${chosen.badge}`);
    }, 1200);
  };

  const handleResetForTest = () => {
    localStorage.removeItem(DAILY_CHEST_KEY);
    setReward(null);
    setOpening(false);
    toast.info("تم إعادة تعيين صندوق اليوم لتجربته مجدداً ✨");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md overflow-hidden rounded-3xl border border-amber-400/40 bg-gradient-to-b from-[#091833] via-[#0f2147] to-[#081329] p-0 text-white shadow-2xl">
        <div className="relative p-6 text-center">
          {/* Glowing ambient background */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 left-1/2 size-72 -translate-x-1/2 rounded-full bg-amber-500/20 blur-3xl"
          />

          <DialogHeader className="space-y-1">
            <span className="inline-flex items-center justify-center gap-1.5 self-center rounded-full border border-amber-400/30 bg-amber-500/15 px-3 py-1 text-xs font-bold text-amber-300">
              <Sparkles className="size-3.5" /> مكافأة الحضور اليومي 🎁
            </span>
            <DialogTitle className="text-2xl font-black tracking-tight text-white">
              صندوق المفاجآت اليومي
            </DialogTitle>
            <p className="text-xs text-white/70">
              افتح صندوقك كل 24 ساعة واكسب نقاط XP، حماية للشعلة، ومصطلحات أمريكية فخمة!
            </p>
          </DialogHeader>

          {/* Interactive Chest View */}
          {!reward ? (
            <div className="my-6 flex flex-col items-center">
              <div
                onClick={alreadyOpenedToday ? undefined : handleOpenChest}
                className={cn(
                  "relative flex size-44 cursor-pointer select-none items-center justify-center rounded-3xl border-2 transition-all duration-300",
                  alreadyOpenedToday
                    ? "border-white/20 bg-white/5 opacity-70 cursor-not-allowed"
                    : "border-amber-400/80 bg-gradient-to-br from-amber-400/20 via-amber-600/10 to-transparent shadow-[0_0_50px_rgba(245,158,11,0.25)] hover:scale-105 active:scale-95",
                  opening && "animate-bounce"
                )}
              >
                {/* 3D Chest Visual */}
                <div className="relative text-7xl transition-transform duration-300">
                  {opening ? "✨" : alreadyOpenedToday ? "📦" : "🎁"}
                </div>

                {!alreadyOpenedToday && (
                  <span className="absolute -bottom-3 rounded-full bg-amber-500 px-3 py-1 text-[11px] font-black text-slate-950 shadow-md animate-pulse">
                    اضغط للفتح الآن ⚡
                  </span>
                )}
              </div>

              {alreadyOpenedToday ? (
                <div className="mt-4 space-y-2 text-center">
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                    <CheckCircle2 className="size-4" /> فتحت صندوقك اليوم! شعلتك مستمرة 🔥
                  </div>
                  <p className="text-[11px] text-white/60">
                    الصندوق القادم يفتح بعد منتصف الليل.
                  </p>
                  <button
                    type="button"
                    onClick={handleResetForTest}
                    className="text-[10px] text-white/40 underline hover:text-white/80"
                  >
                    (إعادة فتح للتجربة)
                  </button>
                </div>
              ) : (
                <Button
                  type="button"
                  onClick={handleOpenChest}
                  disabled={opening}
                  className="mt-6 w-full rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 font-black text-slate-950 shadow-lg hover:brightness-110 active:scale-95"
                >
                  {opening ? "جاري فتح الصندوق... 🌟" : "افتح صندوق اليوم واستلم هديتك 🔓"}
                </Button>
              )}
            </div>
          ) : (
            /* Revealed Reward View */
            <div className="my-6 space-y-4 animate-in fade-in zoom-in-95 duration-300">
              <div className="rounded-2xl border border-amber-400/50 bg-gradient-to-br from-amber-400/15 to-transparent p-5 text-center shadow-inner">
                <span className="inline-block rounded-full bg-amber-400 px-3 py-1 text-xs font-black text-slate-950 shadow-xs">
                  {reward.badge}
                </span>

                <h3 className="mt-3 text-lg font-black text-amber-200">
                  {reward.titleAr}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-white/80">
                  {reward.descAr}
                </p>

                {reward.slangEn && (
                  <div className="mt-3 rounded-xl border border-white/10 bg-slate-950/60 p-3 text-start">
                    <div className="flex items-center justify-between gap-2">
                      <p className="latin font-bold text-white text-sm" dir="ltr">
                        “{reward.slangEn}”
                      </p>
                      <button
                        type="button"
                        onClick={() => speak(reward.slangEn || "")}
                        aria-label="استمع للنطق"
                        className="rounded-full bg-white/10 p-1.5 text-white hover:bg-white/20"
                      >
                        <Volume2 className="size-4" />
                      </button>
                    </div>
                    {reward.nativeTipEn && (
                      <p className="latin mt-1 text-[11px] text-amber-300" dir="ltr">
                        💡 {reward.nativeTipEn}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-bold">
                <span className="flex items-center gap-1.5 text-amber-300">
                  <Flame className="size-4 text-orange-400" /> شعلتك الحالية: {gamification.streak} يوم
                </span>
                <span className="text-emerald-400">
                  مجموع نقاطك: {gamification.xp} XP 🏆
                </span>
              </div>

              <Button
                type="button"
                onClick={() => onOpenChange(false)}
                className="w-full rounded-full bg-emerald-600 font-bold text-white hover:bg-emerald-500"
              >
                استلام ومتابعة التعلم 🚀
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Header Quick Trigger Pill */
export function DailyMysteryChestHeaderButton() {
  const [open, setOpen] = useState(false);
  const [openedToday, setOpenedToday] = useState(false);

  useEffect(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    setOpenedToday(localStorage.getItem(DAILY_CHEST_KEY) === todayStr);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          soundEffects.playClick();
          setOpen(true);
        }}
        aria-label="صندوق المفاجآت اليومي"
        title={openedToday ? "صندوق اليوم مفتوح — اضغط للتفاصيل" : "صندوق اليوم بانتظارك! 🎁"}
        className={cn(
          "relative flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold transition duration-200 hover:scale-105 active:scale-95 shadow-xs",
          openedToday
            ? "border-line bg-card text-ink-soft opacity-75"
            : "border-amber-400/80 bg-amber-500/15 text-amber-600 dark:text-amber-300 hover:bg-amber-500/25 animate-pulse"
        )}
      >
        <Gift className={cn("size-3.5", !openedToday && "text-amber-500 animate-bounce")} />
        <span className="hidden sm:inline">هدية اليوم</span>
        {!openedToday && (
          <span className="size-2 rounded-full bg-amber-500" />
        )}
      </button>

      <DailyMysteryChestModal open={open} onOpenChange={setOpen} />
    </>
  );
}
