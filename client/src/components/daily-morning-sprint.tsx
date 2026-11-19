import { useState, useEffect, useRef } from "react";
import {
  Zap,
  Timer,
  CheckCircle2,
  XCircle,
  Trophy,
  Volume2,
  Sparkles,
  ArrowRight,
  Shield,
  RotateCcw,
  Flame,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { awardXP } from "@/lib/gamification";
import { soundEffects } from "@/lib/sound-effects";
import { triggerConfetti } from "@/lib/confetti";
import { cn } from "@/lib/utils";

interface SprintQuestion {
  id: string;
  situationAr: string;
  situationEn: string;
  emoji: string;
  category: string;
  options: {
    id: string;
    textEn: string;
    isBest: boolean;
    feedbackAr: string;
  }[];
}

const SPRINT_QUESTIONS: SprintQuestion[] = [
  {
    id: "sp-1",
    situationAr: "أنت في كافيه في لندن وبدك تطلب قهوة بحليب شوفان وسكر برة:",
    situationEn: "Ordering coffee with custom options in London",
    emoji: "☕",
    category: "كافيه ويوميات",
    options: [
      {
        id: "a",
        textEn: "Hi! Could I please get a large iced latte with oat milk, and sugar on the side?",
        isBest: true,
        feedbackAr: "أسلوب native بريطاني أنيق جداً (Could I please get... on the side) 👏",
      },
      {
        id: "b",
        textEn: "Give me coffee with oat milk and sugar now.",
        isBest: false,
        feedbackAr: "صيغة أمر مباشرة وغير لطيفة في الكافيهات العالمية.",
      },
      {
        id: "c",
        textEn: "I want coffee please.",
        isBest: false,
        feedbackAr: "عامة جداً ونسيت تطلب تفاصيل حليب الشوفان والسكر.",
      },
    ],
  },
  {
    id: "sp-2",
    situationAr: "في اجتماع زووم مع مدير أجنبي وبدك تقوله إنك خلصت مهمتك وهتبدأ في اللي بعدها:",
    situationEn: "Daily standup status update with international team",
    emoji: "💻",
    category: "عمل واجتماعات",
    options: [
      {
        id: "a",
        textEn: "I've wrapped up the API integration, and I'm pivoting to the dashboard UI today.",
        isBest: true,
        feedbackAr: "استخدام مصطلحات شغل ممتازة (wrapped up = أنهيت، pivoting to = منتقل إلى) 🚀",
      },
      {
        id: "b",
        textEn: "I finished work. Now I do another work.",
        isBest: false,
        feedbackAr: "المعنى واصل لكن صياغة مبتدئة جداً لا تليق باجتماعات الشركات.",
      },
      {
        id: "c",
        textEn: "Everything is done, bye.",
        isBest: false,
        feedbackAr: "رد سريع وغير مهني في اجتماعات العمل.",
      },
    ],
  },
  {
    id: "sp-3",
    situationAr: "صديق أجنبي بيسألك عن إجازة نهاية الأسبوع وعاوز تفتح معاه حوار ودي:",
    situationEn: "Casual weekend small talk with international friend",
    emoji: "🌟",
    category: "صداقات وسوالف",
    options: [
      {
        id: "a",
        textEn: "It was pretty relaxing, thanks for asking! Caught up on some reading. How about yours?",
        isBest: true,
        feedbackAr: "أسلوب سوالف اجتماعي طبيعي ومتبادل (Caught up on... How about yours?) 🌟",
      },
      {
        id: "b",
        textEn: "Good.",
        isBest: false,
        feedbackAr: "إجابة كلمة واحدة بتقفل باب الحوار فوراً.",
      },
      {
        id: "c",
        textEn: "I slept all day because I hate people.",
        isBest: false,
        feedbackAr: "رد غريب شوية ومحرج في المحادثات الودية العادية.",
      },
    ],
  },
];

function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-US";
    u.rate = 0.94;
    window.speechSynthesis.speak(u);
  } catch {}
}

export function DailyMorningSprintModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [step, setStep] = useState<"intro" | "playing" | "results">("intro");
  const [roundIndex, setRoundIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);

  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (open && step === "playing") {
      setTimeLeft(60);
      timerRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            clearInterval(timerRef.current);
            finishSprint();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [open, step, roundIndex]);

  const startSprint = () => {
    soundEffects.playClick();
    setStep("playing");
    setRoundIndex(0);
    setCorrectCount(0);
    setSelectedOption(null);
  };

  const currentQ = SPRINT_QUESTIONS[roundIndex % SPRINT_QUESTIONS.length];

  const handlePick = (opt: { id: string; textEn: string; isBest: boolean; feedbackAr: string }) => {
    if (selectedOption !== null) return;
    setSelectedOption(opt.id);

    if (opt.isBest) {
      soundEffects.playCorrect();
      setCorrectCount(c => c + 1);
    } else {
      soundEffects.playIncorrect();
    }

    setTimeout(() => {
      if (roundIndex + 1 < SPRINT_QUESTIONS.length) {
        setRoundIndex(r => r + 1);
        setSelectedOption(null);
      } else {
        finishSprint();
      }
    }, 1800);
  };

  const finishSprint = () => {
    clearInterval(timerRef.current);
    setStep("results");
    soundEffects.playTrophy();
    triggerConfetti(3000);
    awardXP(50);
    toast.success("أنهيت ماراثون الـ 3 دقائق بنجاح! +50 XP وحماية الستريك 🛡️🔥");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-b from-[#120e24] via-[#1a1236] to-[#0c0818] p-0 text-white shadow-2xl">
        {step === "intro" ? (
          /* ================= INTRO ================= */
          <div className="p-7 text-center space-y-5">
            <div className="relative mx-auto flex size-24 items-center justify-center rounded-full bg-gradient-to-br from-amber-500/25 to-orange-500/25 text-5xl border border-amber-400/40 shadow-[0_0_35px_rgba(245,158,11,0.3)] animate-pulse">
              ⚡
            </div>

            <div className="space-y-1.5">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-500/15 px-3 py-1 text-xs font-black text-amber-300">
                <Flame className="size-3.5 fill-amber-400 text-amber-400" /> تسخين سريع يومي
              </span>
              <h2 className="text-2xl font-black text-white">
                ماراثون الإنجليزي في 3 دقائق ⚡
              </h2>
              <p className="text-xs text-white/70 leading-relaxed max-w-xs mx-auto">
                3 مواقف حقيقية سريعة تنشّط بيها عقلك وتدرّب لسانك على الرد التلقائي بالإنجليزي قبل ما تبدأ يومك!
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-3.5 text-start space-y-2 text-xs">
              <div className="flex items-center gap-2 text-white/90">
                <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
                <span>3 مواقف سريعة بتوقيت 60 ثانية</span>
              </div>
              <div className="flex items-center gap-2 text-white/90">
                <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
                <span>جائزة حماية الستريك (Streak Shield 🛡️)</span>
              </div>
              <div className="flex items-center gap-2 text-white/90">
                <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
                <span>مضاعفة نقاط XP بمقدار +50 XP فوري</span>
              </div>
            </div>

            <Button
              type="button"
              onClick={startSprint}
              className="w-full rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 font-black text-white shadow-xl hover:from-amber-600 hover:to-orange-600 py-6 text-base cursor-pointer"
            >
              <Zap className="me-2 size-5 fill-white" /> ابدأ الماراثون الآن 🔥
            </Button>
          </div>
        ) : step === "playing" ? (
          /* ================= PLAYING ROUND ================= */
          <div className="p-6 space-y-4">
            {/* Header: Progress & Timer */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <span>الجولة {roundIndex + 1} من {SPRINT_QUESTIONS.length}</span>
                <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px]">
                  {currentQ.category}
                </span>
              </span>

              <div className="flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/15 px-2.5 py-1 text-xs font-black text-red-400">
                <Timer className="size-3.5 animate-spin" />
                <span>{timeLeft} ثانية</span>
              </div>
            </div>

            {/* Question Card */}
            <div className="rounded-2xl border border-iris/30 bg-iris-deep/20 p-4 space-y-2">
              <div className="text-3xl">{currentQ.emoji}</div>
              <h3 className="font-extrabold text-white text-sm leading-relaxed">
                {currentQ.situationAr}
              </h3>
            </div>

            {/* Options */}
            <div className="space-y-2.5">
              <span className="text-xs font-bold text-white/70 block">
                اختار أذكى وأنسب رد:
              </span>
              {currentQ.options.map(opt => {
                const isSelected = selectedOption === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={selectedOption !== null}
                    onClick={() => handlePick(opt)}
                    className={cn(
                      "latin w-full rounded-2xl border p-3.5 text-start font-semibold text-xs leading-relaxed transition-all cursor-pointer",
                      selectedOption === null &&
                        "border-white/15 bg-white/5 hover:border-amber-400/80 hover:bg-white/10 text-white",
                      isSelected &&
                        opt.isBest &&
                        "border-emerald-500 bg-emerald-500/20 text-emerald-200 shadow-md",
                      isSelected &&
                        !opt.isBest &&
                        "border-destructive bg-destructive/20 text-destructive-foreground",
                      selectedOption !== null &&
                        !isSelected &&
                        "border-white/5 bg-white/5 opacity-40 text-white/50"
                    )}
                    dir="ltr"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span>{opt.textEn}</span>
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          speak(opt.textEn);
                        }}
                        className="text-white/60 hover:text-white p-1 shrink-0"
                        title="استمع"
                      >
                        <Volume2 className="size-3.5" />
                      </button>
                    </div>

                    {isSelected && (
                      <p className="mt-2 text-[11px] font-normal text-amber-200" dir="rtl">
                        💡 {opt.feedbackAr}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* ================= RESULTS CELEBRATION ================= */
          <div className="p-7 text-center space-y-5">
            <div className="relative mx-auto flex size-24 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500/25 to-teal-500/25 text-5xl border border-emerald-400/40 shadow-[0_0_35px_rgba(16,185,129,0.3)] animate-bounce">
              🏆
            </div>

            <div className="space-y-1.5">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-3 py-1 text-xs font-black text-emerald-300">
                🎉 ماراثون ناجح ومبهر!
              </span>
              <h2 className="text-2xl font-black text-white">
                أبدعت وسخّنت إنجليزيتك بامتياز! ⚡
              </h2>
              <p className="text-xs text-white/70 leading-relaxed">
                حققت <b className="text-amber-300">{correctCount} من {SPRINT_QUESTIONS.length}</b> إجابات نموذجية وسريعة زي أهل اللغة بالظبط!
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <span className="text-[11px] text-white/60 block">نقاط XP</span>
                <span className="text-xl font-black text-emerald-400">+50 XP ⚡</span>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <span className="text-[11px] text-white/60 block">حماية الستريك</span>
                <span className="text-xl font-black text-amber-300 flex items-center justify-center gap-1">
                  <Shield className="size-4 text-amber-400" /> مفعّل 24h
                </span>
              </div>
            </div>

            <Button
              type="button"
              onClick={() => onOpenChange(false)}
              className="w-full rounded-full bg-iris font-black text-white shadow-xl hover:bg-iris-deep py-5 cursor-pointer"
            >
              تم ورجوع للموقع 🚀
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** Standalone Launcher Button */
export function DailyMorningSprintButton({
  className,
}: {
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          soundEffects.playClick();
          setOpen(true);
        }}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-gradient-to-r from-amber-500/15 to-orange-500/15 px-3.5 py-1.5 text-xs font-black text-amber-800 dark:text-amber-300 transition hover:scale-105 active:scale-95 shadow-xs cursor-pointer",
          className
        )}
      >
        <Zap className="size-3.5 text-amber-500 fill-amber-500 animate-pulse" />
        <span>تسخين الإنجليزي في 3 دقائق ⚡</span>
      </button>

      <DailyMorningSprintModal open={open} onOpenChange={setOpen} />
    </>
  );
}
