import { useState, useRef, useEffect } from "react";
import {
  Mic,
  MicOff,
  Volume2,
  Sparkles,
  Trophy,
  RotateCcw,
  CheckCircle2,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { awardXP } from "@/lib/gamification";
import { soundEffects } from "@/lib/sound-effects";
import { triggerConfetti } from "@/lib/confetti";
import { cn } from "@/lib/utils";

interface ShadowingItem {
  id: string;
  sentenceEn: string;
  translationAr: string;
  difficulty: "Easy" | "Medium" | "Native Speed";
  focusTipAr: string;
}

const SHADOWING_ITEMS: ShadowingItem[] = [
  {
    id: "sh-1",
    sentenceEn: "I'll catch you later, take care!",
    translationAr: "هبقى أكلمك بعدين، خلّي بالك من نفسك!",
    difficulty: "Easy",
    focusTipAr: "ادمج 'catch you' كأنها كلمة واحدة: 'catch-ya'!",
  },
  {
    id: "sh-2",
    sentenceEn: "Could you please give me a quick update?",
    translationAr: "ممكن تديني تحديث سريع بعد إذنك؟",
    difficulty: "Medium",
    focusTipAr: "نطق 'Could you' الطبيعي بيكون 'Could-ja' بنبرة صاعدة لطيفة.",
  },
  {
    id: "sh-3",
    sentenceEn: "To be completely honest, that sounds like a great idea.",
    translationAr: "بكل صراحة، الفكرة دي شكلها ممتازة جداً.",
    difficulty: "Native Speed",
    focusTipAr: "ركّز على إيقاع 'To be completely honest' بنَفَس واحد سلس.",
  },
  {
    id: "sh-4",
    sentenceEn: "Let's touch base first thing tomorrow morning.",
    translationAr: "خلينا نتواصل ونتكلم أول حاجة بكرة الصبح.",
    difficulty: "Native Speed",
    focusTipAr: "تعبير 'touch base' احترافي جداً في بيئة العمل للـ Check-in السريع.",
  },
  {
    id: "sh-5",
    sentenceEn: "I really appreciate you going out of your way to help.",
    translationAr: "مقدّر جداً تعبك وإنك بادرت بمساعدتي.",
    difficulty: "Medium",
    focusTipAr: "'Going out of your way' بتتقال لتقدير المجهود الإضافي.",
  },
];

function playNativeAudio(text: string, rate = 0.95) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-US";
    u.rate = rate;
    window.speechSynthesis.speak(u);
  } catch {}
}

export function ShadowingChallenge({ className }: { className?: string }) {
  const [index, setIndex] = useState(0);
  const [speed, setSpeed] = useState<0.8 | 1.0>(1.0);
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [score, setScore] = useState<number | null>(null);

  const recognitionRef = useRef<any>(null);
  const item = SHADOWING_ITEMS[index % SHADOWING_ITEMS.length];

  useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.stop?.();
      } catch {}
    };
  }, []);

  const handleListen = () => {
    soundEffects.playClick();
    playNativeAudio(item.sentenceEn, speed);
  };

  const startVoiceRecording = () => {
    if (typeof window === "undefined") return;
    const SpeechRec =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRec) {
      toast.error("المتصفح لا يدعم التسجيل الصوتي المباشر. استخدم Chrome أو Safari.");
      return;
    }

    if (recording) {
      recognitionRef.current?.stop?.();
      setRecording(false);
      return;
    }

    try {
      soundEffects.playClick();
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate?.(50);
      }
      setTranscript("");
      setScore(null);

      const recognition = new SpeechRec();
      recognition.lang = "en-US";
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setRecording(true);
      recognition.onerror = () => {
        setRecording(false);
        toast.error("لم نتمكن من التقاط الصوت بوضوح، حاول مجدداً.");
      };
      recognition.onend = () => setRecording(false);

      recognition.onresult = (event: any) => {
        const spoken = event.results[0][0].transcript;
        setTranscript(spoken);
        evaluatePronunciation(spoken, item.sentenceEn);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setRecording(false);
    }
  };

  const evaluatePronunciation = (spoken: string, target: string) => {
    const cleanSpoken = spoken.toLowerCase().replace(/[^a-z0-9 ]/g, "");
    const cleanTarget = target.toLowerCase().replace(/[^a-z0-9 ]/g, "");

    const targetWords = cleanTarget.split(/\s+/);
    const spokenWords = cleanSpoken.split(/\s+/);

    let matchCount = 0;
    targetWords.forEach(w => {
      if (spokenWords.includes(w)) matchCount++;
    });

    const calculatedScore = Math.min(
      100,
      Math.round((matchCount / targetWords.length) * 100)
    );
    setScore(calculatedScore);

    if (calculatedScore >= 80) {
      soundEffects.playCorrect();
      triggerConfetti(2500);
      awardXP(35);
      toast.success(`نطق رائع ومطابق بنسبة ${calculatedScore}%! +35 XP 🌟`);
    } else if (calculatedScore >= 50) {
      soundEffects.playClick();
      awardXP(15);
      toast.info(`محاولة جيدة (${calculatedScore}%)! ركّز واسمع الإيقاع تاني.`);
    } else {
      soundEffects.playIncorrect();
      toast.info("اسمع الجملة بالسرعة الهادئة 0.8x وجرّب تاني 💪");
    }
  };

  const handleNext = () => {
    soundEffects.playClick();
    setTranscript("");
    setScore(null);
    setIndex(i => i + 1);
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-card via-card to-emerald-500/10 p-5 shadow-sm sm:p-6",
        className
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
          <Sparkles className="size-3.5 text-emerald-500" /> تحدي التقليد الصوتي السريع (Shadowing) 🎙️
        </span>
        <span className="rounded-full bg-paper-deep px-2.5 py-1 text-[11px] font-bold text-ink-soft">
          {item.difficulty}
        </span>
      </div>

      {/* Target Sentence Display */}
      <div className="mt-4 rounded-2xl border border-line bg-card/90 p-4 text-center">
        <p className="latin text-lg font-black text-ink sm:text-xl" dir="ltr">
          “{item.sentenceEn}”
        </p>
        <p className="mt-1 text-xs font-semibold text-ink-soft">
          {item.translationAr}
        </p>

        {/* Pronunciation audio trigger & speed toggles */}
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          <Button
            type="button"
            size="sm"
            onClick={handleListen}
            className="rounded-full bg-iris font-bold text-white shadow-xs hover:bg-iris-deep"
          >
            <Volume2 className="me-1.5 size-4" /> اسمع النطق الأصلي
          </Button>

          <div className="flex items-center rounded-full border border-line bg-card p-0.5 text-xs font-bold">
            <button
              type="button"
              onClick={() => setSpeed(0.8)}
              className={cn(
                "rounded-full px-2.5 py-1 transition",
                speed === 0.8
                  ? "bg-iris text-white shadow-xs"
                  : "text-ink-soft hover:text-ink"
              )}
            >
              0.8x هادئ
            </button>
            <button
              type="button"
              onClick={() => setSpeed(1.0)}
              className={cn(
                "rounded-full px-2.5 py-1 transition",
                speed === 1.0
                  ? "bg-iris text-white shadow-xs"
                  : "text-ink-soft hover:text-ink"
              )}
            >
              1.0x طبيعي
            </button>
          </div>
        </div>
      </div>

      {/* Egyptian Voice Coach Tip */}
      <div className="mt-3 rounded-xl border border-dashed border-iris/30 bg-iris-soft/20 px-3.5 py-2 text-xs">
        <span className="font-bold text-iris">💡 سر النبرة الطبيعية: </span>
        <span className="text-ink">{item.focusTipAr}</span>
      </div>

      {/* Recording Action Bar */}
      <div className="mt-4 flex flex-col items-center justify-center gap-3">
        <Button
          type="button"
          onClick={startVoiceRecording}
          className={cn(
            "h-14 w-full rounded-2xl font-black text-white shadow-md transition-all active:scale-95 sm:w-auto sm:px-10",
            recording
              ? "bg-destructive animate-pulse"
              : "bg-emerald-600 hover:bg-emerald-500"
          )}
        >
          {recording ? (
            <>
              <MicOff className="me-2 size-5" /> جاري الاستماع... اضغط لإنهاء التسجيل
            </>
          ) : (
            <>
              <Mic className="me-2 size-5" /> اضغط وانطق الجملة الآن 🎙️
            </>
          )}
        </Button>

        {transcript && (
          <div className="w-full space-y-2 rounded-2xl border border-line bg-card p-3.5 text-center animate-in fade-in">
            <p className="text-xs text-ink-soft">
              سمعناك بتقول:
            </p>
            <p className="latin font-bold text-ink text-sm" dir="ltr">
              “{transcript}”
            </p>

            {score !== null && (
              <div className="mt-2 flex items-center justify-center gap-2">
                <span
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-black shadow-xs",
                    score >= 80
                      ? "bg-emerald-500 text-white"
                      : score >= 50
                      ? "bg-amber-500 text-white"
                      : "bg-destructive text-white"
                  )}
                >
                  {score >= 80 ? "🤩 نبرة أمريكية ممتازة!" : score >= 50 ? "🔥 واضحة جداً!" : "💪 كررها تاني بالإيقاع"} ({score}%)
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Next Challenge Button */}
      <div className="mt-4 flex justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleNext}
          className="rounded-full text-xs font-bold"
        >
          الجملة التالية ←
        </Button>
      </div>
    </div>
  );
}
