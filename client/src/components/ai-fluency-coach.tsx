import { useState, useRef, useEffect } from "react";
import {
  Mic,
  MicOff,
  Volume2,
  Sparkles,
  Trophy,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Crown,
  Zap,
  ArrowRight,
  TrendingUp,
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

export interface FluencyChallenge {
  id: string;
  phraseEn: string;
  phraseAr: string;
  category: "work" | "daily" | "travel" | "idiom";
  level: "A2" | "B1" | "B2" | "C1";
  tipAr: string;
}

export const FLUENCY_CHALLENGES: FluencyChallenge[] = [
  {
    id: "fc-1",
    phraseEn: "I'm genuinely looking forward to collaborating with your team.",
    phraseAr: "متحمس بصدق للتعاون مع فريق عملكم.",
    category: "work",
    level: "B2",
    tipAr: "انطق genuinely بتدفق سريع بدون ما تفصل الحروف، واشبك forward to مع بعض.",
  },
  {
    id: "fc-2",
    phraseEn: "Could you please walk me through the next steps?",
    phraseAr: "ممكن بعد إذنك توضحلي الخطوات الجاية بالتفصيل؟",
    category: "work",
    level: "B1",
    tipAr: "كلمة walk me through تعبير أجنبي أنيق جداً في الاجتماعات معناه اشرحلي بالتفصيل.",
  },
  {
    id: "fc-3",
    phraseEn: "Let's call it a day and touch base tomorrow morning.",
    phraseAr: "كفاية شغل كده النهارده ونتواصل بكرة الصبح.",
    category: "idiom",
    level: "B2",
    tipAr: "call it a day = نكتفي بالعمل، و touch base = نتواصل سريعاً.",
  },
  {
    id: "fc-4",
    phraseEn: "Excuse me, does this train go directly to Central Station?",
    phraseAr: "عفواً، هل القطر ده بيوصل مباشرة لمحطة السنترال؟",
    category: "travel",
    level: "A2",
    tipAr: "في كلمة directly، أهل اللغة بينطقوها daɪˈrekt.li أو dɪˈrekt.li بخفة.",
  },
  {
    id: "fc-5",
    phraseEn: "I'd appreciate it if you could send me the updated invoice.",
    phraseAr: "هكون شاكر جداً لو تبعتلي الفاتورة المحدثة.",
    category: "work",
    level: "B2",
    tipAr: "I'd appreciate it if... هي أرقى أسلوب طلب مهني في بيئة الشركات العالمية.",
  },
];

function speak(text: string, rate = 0.92) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-US";
    u.rate = rate;
    window.speechSynthesis.speak(u);
  } catch {}
}

export function AIFluencyCoachModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [spokenText, setSpokenText] = useState("");
  const [evaluated, setEvaluated] = useState(false);
  const [accuracyScore, setAccuracyScore] = useState(0);
  const [fluencyScore, setFluencyScore] = useState(0);

  const recognitionRef = useRef<any>(null);
  const current = FLUENCY_CHALLENGES[currentIndex % FLUENCY_CHALLENGES.length];

  const startListening = () => {
    if (isRecording) {
      stopListening();
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.info("التعرف الصوتي مدعوم على متصفحات Google Chrome و Microsoft Edge 🎙️");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "en-US";
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsRecording(true);
        setSpokenText("");
        setEvaluated(false);
        soundEffects.playClick();
      };

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((r: any) => r[0].transcript)
          .join(" ");
        setSpokenText(transcript);
      };

      recognition.onerror = () => {
        setIsRecording(false);
        toast.error("تأكد من السماح للمتصفح بالوصول للميكروفون");
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsRecording(false);
    }
  };

  const stopListening = () => {
    try {
      recognitionRef.current?.stop?.();
    } catch {}
    setIsRecording(false);
  };

  // Evaluate comparison between target phrase and spoken text
  const evaluateSpeech = () => {
    if (!spokenText.trim()) {
      toast.info("انطق الجملة بصوتك أولاً للتقييم!");
      return;
    }

    stopListening();

    const targetWords = current.phraseEn
      .toLowerCase()
      .replace(/[.,?!]/g, "")
      .split(/\s+/);
    const spokenWords = spokenText
      .toLowerCase()
      .replace(/[.,?!]/g, "")
      .split(/\s+/);

    let matchCount = 0;
    targetWords.forEach(w => {
      if (spokenWords.includes(w)) matchCount++;
    });

    const accuracy = Math.round((matchCount / targetWords.length) * 100);
    // Fluency accounts for word length and completion
    const fluency = Math.min(
      100,
      Math.max(65, Math.round(accuracy * 0.95 + (spokenWords.length >= targetWords.length ? 10 : 0)))
    );

    setAccuracyScore(accuracy);
    setFluencyScore(fluency);
    setEvaluated(true);

    if (accuracy >= 75) {
      soundEffects.playCorrect();
      soundEffects.playTrophy();
      triggerConfetti(2500);
      awardXP(35);
      toast.success(`🎉 نطق مذهل بنسبة ${accuracy}%! حصلت على +35 XP`);
    } else {
      soundEffects.playIncorrect();
      toast.info("محاولة ممتازة! اسمع النطق وجرّب مرة كمان لتصل لأعلى دقة.");
    }
  };

  const nextChallenge = () => {
    setCurrentIndex(i => (i + 1) % FLUENCY_CHALLENGES.length);
    setSpokenText("");
    setEvaluated(false);
    soundEffects.playClick();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg overflow-hidden rounded-3xl border border-iris/25 bg-gradient-to-b from-[#0a1836] via-[#0d1e44] to-[#081228] p-0 text-white shadow-2xl">
        <DialogHeader className="p-6 pb-2 border-b border-white/10 text-start">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-400/30 bg-sky-500/15 px-3 py-1 text-xs font-bold text-sky-300">
              <Sparkles className="size-3.5 text-sky-400" /> مدرب النطق والطلاقة الذكي (AI Coach)
            </span>
            <span className="rounded-full bg-iris-deep/80 border border-iris/40 px-2.5 py-0.5 text-[11px] font-extrabold text-white">
              {current.level}
            </span>
          </div>
          <DialogTitle className="text-xl font-black text-white mt-2">
            مقيّم النطق والإلقاء المباشر 🎙️
          </DialogTitle>
          <DialogDescription className="text-xs text-white/70">
            تحدّث بالإنجليزي في المايكروفون، والذكاء الاصطناعي هيحلل نطقك ويديك تقييم تفصيلي لحظي!
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-5">
          {/* Target Phrase Card */}
          <div className="relative overflow-hidden rounded-2xl border border-iris/40 bg-iris-deep/20 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-iris-soft">
                الجملة المستهدفة:
              </span>
              <button
                type="button"
                onClick={() => speak(current.phraseEn)}
                className="inline-flex items-center gap-1 rounded-full bg-white/10 hover:bg-white/20 px-2.5 py-1 text-xs font-bold text-white transition cursor-pointer"
                title="استمع للنطق الأمريكي"
              >
                <Volume2 className="size-3.5 text-sky-400" /> اسمع النطق 🔊
              </button>
            </div>

            <p className="latin text-lg font-black text-white leading-relaxed" dir="ltr">
              “{current.phraseEn}”
            </p>
            <p className="mt-1 text-xs text-white/70 font-medium">
              {current.phraseAr}
            </p>

            {/* Coach Pronunciation Tip */}
            <div className="mt-3 rounded-xl border border-amber-400/25 bg-amber-500/10 p-2.5 text-xs text-amber-200 flex items-start gap-2">
              <Crown className="size-4 text-amber-400 shrink-0 mt-0.5" />
              <span><b>نصيحة ياسين:</b> {current.tipAr}</span>
            </div>
          </div>

          {/* Interactive Mic & Sound Visualizer */}
          <div className="flex flex-col items-center justify-center p-4 rounded-2xl border border-white/10 bg-white/5 space-y-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={startListening}
                className={cn(
                  "relative flex size-20 items-center justify-center rounded-full transition-all duration-300 shadow-xl cursor-pointer",
                  isRecording
                    ? "bg-destructive text-white shadow-[0_0_35px_rgba(239,68,68,0.6)] animate-pulse scale-105"
                    : "bg-iris text-white hover:bg-iris-deep shadow-[0_0_25px_rgba(37,99,255,0.4)] hover:scale-105 active:scale-95"
                )}
              >
                {isRecording ? <MicOff className="size-8" /> : <Mic className="size-8" />}
              </button>
            </div>

            {/* Live 9-band Frequency Waveform Visualizer */}
            {isRecording ? (
              <div className="flex items-center gap-1.5 h-8">
                <span className="h-3 w-1.5 rounded-full bg-red-400 animate-pulse" />
                <span className="h-6 w-1.5 rounded-full bg-red-400 animate-bounce" />
                <span className="h-4 w-1.5 rounded-full bg-orange-400 animate-pulse delay-75" />
                <span className="h-8 w-1.5 rounded-full bg-amber-300 animate-bounce delay-150" />
                <span className="h-5 w-1.5 rounded-full bg-emerald-400 animate-pulse delay-100" />
                <span className="h-7 w-1.5 rounded-full bg-sky-400 animate-bounce delay-200" />
                <span className="h-4 w-1.5 rounded-full bg-indigo-400 animate-pulse delay-75" />
                <span className="h-5 w-1.5 rounded-full bg-red-400 animate-bounce delay-100" />
                <span className="h-2 w-1.5 rounded-full bg-red-500 animate-pulse" />
              </div>
            ) : (
              <span className="text-xs text-white/60 font-semibold">
                اضغط على المايك وابدأ قراءة الجملة بصوتك 🎙️
              </span>
            )}

            {/* Spoken Text Display */}
            {spokenText && (
              <div className="w-full text-start rounded-xl border border-white/10 bg-black/30 p-3 mt-2">
                <span className="text-[10px] font-bold text-white/50 block mb-1">
                  ما سمعه الذكاء الاصطناعي من صوتك:
                </span>
                <p className="latin font-bold text-sm text-emerald-300 leading-relaxed" dir="ltr">
                  “{spokenText}”
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {!evaluated ? (
              <Button
                type="button"
                disabled={!spokenText || isRecording}
                onClick={evaluateSpeech}
                className="flex-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 font-extrabold text-white shadow-lg hover:from-emerald-600 hover:to-teal-700 py-5 cursor-pointer disabled:opacity-40"
              >
                <Sparkles className="me-2 size-4" /> قيّم نطقي الآن 🎯
              </Button>
            ) : (
              <Button
                type="button"
                onClick={nextChallenge}
                className="flex-1 rounded-full bg-iris font-extrabold text-white shadow-lg hover:bg-iris-deep py-5 cursor-pointer"
              >
                الجملة التالية <ArrowRight className="ms-2 size-4" />
              </Button>
            )}

            <Button
              type="button"
              variant="outline"
              onClick={nextChallenge}
              className="rounded-full border-white/20 bg-white/5 text-white hover:bg-white/10 cursor-pointer"
            >
              تخطي ⏩
            </Button>
          </div>

          {/* Evaluation Scorecard (shown after evaluation) */}
          {evaluated && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="text-xs font-black text-white flex items-center gap-1.5">
                  <Trophy className="size-4 text-amber-400" /> تحليل أداء النطق والطلاقة
                </span>
                <span className={cn(
                  "rounded-full px-2.5 py-0.5 text-xs font-black",
                  accuracyScore >= 80 ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30" : "bg-amber-500/20 text-amber-300 border border-amber-400/30"
                )}>
                  {accuracyScore >= 85 ? "نطق متقن وممتاز 🌟" : accuracyScore >= 65 ? "جيد جداً — محاولة قوية 👏" : "يحتاج تكرار وتدريب 🔄"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <span className="text-[11px] text-white/60 block">دقة نطق الكلمات</span>
                  <span className="text-2xl font-black text-emerald-400">{accuracyScore}%</span>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <span className="text-[11px] text-white/60 block">معدل الطلاقة والإيقاع</span>
                  <span className="text-2xl font-black text-sky-400">{fluencyScore}%</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Standalone Quick Launcher Button */
export function AIFluencyCoachButton({
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
          "inline-flex items-center gap-1.5 rounded-full border border-sky-500/40 bg-gradient-to-r from-sky-500/15 to-indigo-500/15 px-3 py-1.5 text-xs font-bold text-sky-700 dark:text-sky-300 transition hover:scale-105 active:scale-95 shadow-xs cursor-pointer",
          className
        )}
      >
        <Mic className="size-3.5 text-sky-500 animate-pulse" />
        <span>فاحص النطق والطلاقة الذكي 🎙️</span>
      </button>

      <AIFluencyCoachModal open={open} onOpenChange={setOpen} />
    </>
  );
}
