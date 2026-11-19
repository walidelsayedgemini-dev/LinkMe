import { useState } from "react";
import {
  Sparkles,
  Volume2,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Flame,
  RotateCcw,
  Trophy,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { awardXP } from "@/lib/gamification";
import { soundEffects } from "@/lib/sound-effects";
import { triggerConfetti } from "@/lib/confetti";
import { cn } from "@/lib/utils";

interface SlangItem {
  id: string;
  egyptianAr: string;
  literalTrapAr: string;
  nativeEn: string;
  trap1En: string;
  trap2En: string;
  whyAr: string;
  contextEn: string;
}

export const SLANG_ITEMS: SlangItem[] = [
  {
    id: "slang-1",
    egyptianAr: "كبّر مخك ومتدقّقش 🧠",
    literalTrapAr: "أوعى تقول: Enlarge your brain!",
    nativeEn: "Let it slide",
    trap1En: "Enlarge your brain",
    trap2En: "Blow your mind off",
    whyAr: "في الشارع الأمريكي تعبير 'Let it slide' بيتقال لما تعدّي موقف أو تسامح حد ومتعقّدش الأمور.",
    contextEn: "Don't sweat the small stuff, just let it slide!",
  },
  {
    id: "slang-2",
    egyptianAr: "على عيني وراسي ومن عنيا 👁️",
    literalTrapAr: "أوعى تقول: On my eyes and head!",
    nativeEn: "With pleasure / You got it!",
    trap1En: "On my eye and head",
    trap2En: "From my both eyes",
    whyAr: "لما حد يطلب منك طلب في الشغل وتقوله بحماس 'من عينيا'، الأنسب دايماً 'You got it!' أو 'With pleasure!'.",
    contextEn: "Need those slides by 2 PM? You got it!",
  },
  {
    id: "slang-3",
    egyptianAr: "من غير لف ودوران وهات من الآخر 🎯",
    literalTrapAr: "أوعى تقول: Without wrapping and spinning!",
    nativeEn: "Don't beat around the bush",
    trap1En: "Without turning around",
    trap2En: "Cut the wrapping",
    whyAr: "تعبير إنجليزي شهير جداً معناه ادخل في صلب الموضوع وماتضيّعش وقت.",
    contextEn: "Please don't beat around the bush, what's the real budget?",
  },
  {
    id: "slang-4",
    egyptianAr: "إحنا في الهوا سوا ⛵",
    literalTrapAr: "أوعى تقول: We are in the air together!",
    nativeEn: "We're in the same boat",
    trap1En: "We are in the air together",
    trap2En: "We fly in one sky",
    whyAr: "بنستخدم 'In the same boat' لما نكون كلنا بنواجه نفس المشكلة أو الصعوبة مع بعض.",
    contextEn: "Don't panic about the deadline, we're all in the same boat.",
  },
  {
    id: "slang-5",
    egyptianAr: "على قد لحافك مد رجليك 🛏️",
    literalTrapAr: "أوعى تقول: Stretch your legs according to your blanket!",
    nativeEn: "Live within your means",
    trap1En: "Stretch your legs to blanket",
    trap2En: "Measure your feet to bed",
    whyAr: "المعنى الحقيقي هو أنك تصرف وتعيش على قد إمكانياتك المادية بدون ديون.",
    contextEn: "He always advises his kids to live within their means.",
  },
  {
    id: "slang-6",
    egyptianAr: "قلبي حاسس ومطمنش 🔮",
    literalTrapAr: "أوعى تقول: My heart feels it!",
    nativeEn: "I have a gut feeling",
    trap1En: "My heart is feeling it",
    trap2En: "My chest tells me",
    whyAr: "الحدس والإحساس الداخلي في الإنجليزي بيسمّوه 'gut feeling'.",
    contextEn: "I have a gut feeling this client will say yes!",
  },
  {
    id: "slang-7",
    egyptianAr: "حقك عليا وغلطتي 🤝",
    literalTrapAr: "أوعى تقول: Your right is on me!",
    nativeEn: "My bad / I own it",
    trap1En: "Your right is upon me",
    trap2En: "I give you your right",
    whyAr: "'My bad' هو التعبير الكاجوال الأشهر للاعتراف بالخطأ بلباقة واعتذار سريع.",
    contextEn: "Sorry I was late, traffic was crazy. My bad!",
  },
  {
    id: "slang-8",
    egyptianAr: "رجلي على رجلك وأنا معاك 🚀",
    literalTrapAr: "أوعى تقول: My leg on your leg!",
    nativeEn: "Count me in!",
    trap1En: "My leg follows yours",
    trap2En: "Leg on leg with you",
    whyAr: "لما حد يقترح خروجة أو فكرة مشروع وعايز تقوله 'أنا معاك وفي ضهرك'، بتقوله 'Count me in!'.",
    contextEn: "Going for burgers tonight? Count me in!",
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

export function SlangChallengeCard({ className }: { className?: string }) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [streak, setStreak] = useState(0);

  const current = SLANG_ITEMS[index % SLANG_ITEMS.length];

  // Options shuffled deterministically
  const options = [
    { text: current.nativeEn, isCorrect: true },
    { text: current.trap1En, isCorrect: false },
    { text: current.trap2En, isCorrect: false },
  ].sort((a, b) => a.text.localeCompare(b.text));

  const handleSelect = (text: string, isCorrect: boolean) => {
    if (showResult) return;
    setSelected(text);
    setShowResult(true);

    if (isCorrect) {
      soundEffects.playCorrect();
      triggerConfetti(2200);
      awardXP(20);
      setStreak(s => s + 1);
      toast.success("إجابة صحيحة! +20 XP 🚀");
    } else {
      soundEffects.playIncorrect();
      setStreak(0);
      toast.error("إجابة خاطئة! ركّز في التعبير الطبيعي 😉");
    }
  };

  const handleNext = () => {
    soundEffects.playClick();
    setSelected(null);
    setShowResult(false);
    setIndex(i => i + 1);
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-card via-card to-iris-soft/20 p-5 shadow-sm sm:p-6",
        className
      )}
    >
      {/* Decorative Badge */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-500/15 px-3 py-1 text-xs font-bold text-amber-700 dark:text-amber-300">
          <Sparkles className="size-3.5 text-amber-500" /> تحدي: إزاي تقولها بالإنجليزي الطبيعي؟ ⚡
        </span>
        {streak > 1 && (
          <span className="flex items-center gap-1 rounded-full bg-orange-500/15 px-2.5 py-0.5 text-xs font-bold text-orange-600 dark:text-orange-400 animate-pulse">
            <Flame className="size-3.5 text-orange-500" /> تتابع صح: {streak} 🔥
          </span>
        )}
      </div>

      {/* Egyptian Saying Banner */}
      <div className="mt-4 rounded-2xl border border-iris/25 bg-iris-soft/30 p-4 text-center">
        <p className="text-xs font-semibold text-ink-soft">
          لو عايز تقول بالمصري:
        </p>
        <h3 className="mt-1 text-lg font-black text-ink sm:text-xl">
          “{current.egyptianAr}”
        </h3>
        <p className="mt-1 text-[11px] font-bold text-destructive">
          ⚠️ {current.literalTrapAr}
        </p>
      </div>

      {/* 3 Interactive Choices */}
      <div className="mt-4 space-y-2.5">
        <p className="text-xs font-bold text-ink-soft">
          اختر التعبير الطبيعي اللي الأمريكيين بيقولوه فعلياً:
        </p>
        <div className="grid gap-2 sm:grid-cols-3">
          {options.map((opt, i) => {
            const isPicked = selected === opt.text;
            return (
              <button
                key={i}
                type="button"
                disabled={showResult}
                onClick={() => handleSelect(opt.text, opt.isCorrect)}
                className={cn(
                  "latin relative flex items-center justify-between rounded-2xl border p-3.5 text-start font-bold text-sm transition-all duration-200 active:scale-98",
                  !showResult &&
                    "border-line bg-card hover:border-iris hover:bg-iris-soft/40 hover:-translate-y-0.5 text-ink",
                  showResult &&
                    opt.isCorrect &&
                    "border-emerald-500 bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 shadow-sm",
                  showResult &&
                    isPicked &&
                    !opt.isCorrect &&
                    "border-destructive bg-destructive/15 text-destructive",
                  showResult &&
                    !isPicked &&
                    !opt.isCorrect &&
                    "border-line bg-card/60 opacity-40 text-ink-soft"
                )}
                dir="ltr"
              >
                <span>{opt.text}</span>
                {showResult && opt.isCorrect && (
                  <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                )}
                {showResult && isPicked && !opt.isCorrect && (
                  <XCircle className="size-4 shrink-0 text-destructive" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Explanation & Native Pronunciation Audio */}
      {showResult && (
        <div className="mt-4 space-y-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 animate-in fade-in duration-200">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="latin text-sm font-black text-emerald-800 dark:text-emerald-200" dir="ltr">
                “{current.nativeEn}”
              </span>
              <button
                type="button"
                onClick={() => speak(current.nativeEn)}
                aria-label="استمع للنطق الأمريكي"
                className="rounded-full bg-emerald-600 p-1.5 text-white shadow-xs hover:bg-emerald-700 active:scale-90"
              >
                <Volume2 className="size-3.5" />
              </button>
            </div>
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
              +20 XP تم إضافتها! ⚡
            </span>
          </div>

          <p className="text-xs leading-relaxed text-ink">
            💡 {current.whyAr}
          </p>

          <div className="rounded-xl bg-card/80 p-2.5 text-xs">
            <span className="font-bold text-ink-soft">مثال حي في سياق جملة: </span>
            <span className="latin font-semibold text-iris" dir="ltr">
              “{current.contextEn}”
            </span>
          </div>

          <Button
            type="button"
            onClick={handleNext}
            className="w-full rounded-full bg-iris font-bold text-white shadow-md hover:bg-iris-deep"
          >
            التعبير التالي 🚀 ←
          </Button>
        </div>
      )}
    </div>
  );
}
