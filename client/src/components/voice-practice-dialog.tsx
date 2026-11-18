import { useEffect, useRef, useState } from "react";
import {
  Mic,
  MicOff,
  Volume2,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Headphones,
  Award,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useCompanion, CompanionAvatar } from "@/components/companion";
import { soundEffects } from "@/lib/sound-effects";
import { recordDailyActivity } from "@/lib/gamification";
import { toast } from "sonner";

interface PracticePhrase {
  id: string;
  en: string;
  ar: string;
  category: "daily" | "business" | "travel";
  tip: string;
}

const PHRASES: PracticePhrase[] = [
  {
    id: "p1",
    en: "Could you please tell me how to get to the station?",
    ar: "ممكن تقولي إزاي أوصل للمحطة لو سمحت؟",
    category: "daily",
    tip: "ركز على نطق Could you كأنها كلمة واحدة خفيفة /kʊdʒuː/.",
  },
  {
    id: "p2",
    en: "I'd like to order a cup of coffee with milk, please.",
    ar: "عايز أطلب فنجان قهوة بحليب، من فضلك.",
    category: "daily",
    tip: "انطق cup of كأنها cuppa سريعة ومترابطة.",
  },
  {
    id: "p3",
    en: "I'm looking forward to working with your team.",
    ar: "أنا متطلع ومتحمس للعمل مع فريقكم.",
    category: "business",
    tip: "لاحظ إن بعد looking forward to بييجي الفعل فيه -ing.",
  },
  {
    id: "p4",
    en: "Let's schedule a follow-up meeting next Thursday.",
    ar: "خلّينا نحدد ميعاد اجتماع متابعة الخميس الجاي.",
    category: "business",
    tip: "انطق schedule بالطريقة الأمريكية sked-jool.",
  },
  {
    id: "p5",
    en: "Where is the baggage claim area for my flight?",
    ar: "فين مكان استلام الحقائب لرحلتي؟",
    category: "travel",
    tip: "انطق baggage بـ g ناعمة /ɪdʒ/ مش جافّة.",
  },
  {
    id: "p6",
    en: "Could I have a window seat, please?",
    ar: "ممكن أحصل على مقعد جنب الشباك، لو سمحت؟",
    category: "travel",
    tip: "انطق Could I متصلة /kʊdaɪ/ بسلاسة.",
  },
];

function calculateSimilarity(str1: string, str2: string): number {
  const clean1 = str1.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
  const clean2 = str2.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();

  if (!clean1 || !clean2) return 0;
  if (clean1 === clean2) return 100;

  const words1 = clean1.split(/\s+/);
  const words2 = clean2.split(/\s+/);

  let matches = 0;
  for (const w1 of words1) {
    if (words2.includes(w1)) matches++;
  }

  const wordScore = (matches / Math.max(words1.length, words2.length)) * 100;
  return Math.min(100, Math.round(wordScore));
}

export function VoicePracticeDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { companion } = useCompanion();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [score, setScore] = useState<number | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  // Web Speech Recognition instance
  const recognitionRef = useRef<any>(null);

  const phrase = PHRASES[currentIndex];

  useEffect(() => {
    // Check speech recognition support
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        finalTranscript += event.results[i][0].transcript;
      }
      setTranscript(finalTranscript);

      if (event.results[event.results.length - 1]?.isFinal) {
        evaluateSpeech(finalTranscript, phrase.en);
      }
    };

    recognition.onerror = (event: any) => {
      console.warn("Speech recognition error:", event.error);
      setIsListening(false);
      if (event.error === "not-allowed") {
        toast.error("يرجى السماح بالوصول للمايكروفون من إعدادات المتصفح");
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // Ignore
        }
      }
    };
  }, [currentIndex, phrase.en]);

  const evaluateSpeech = (spoken: string, target: string) => {
    const accuracy = calculateSimilarity(spoken, target);
    setScore(accuracy);

    if (accuracy >= 80) {
      soundEffects.playCorrect();
      recordDailyActivity();
      toast.success("نطق ممتاز! تم إضافة +15 XP إلى رصيدك 🎉");
    } else if (accuracy >= 55) {
      soundEffects.playClick();
    } else {
      soundEffects.playIncorrect();
    }
  };

  const startListening = () => {
    if (!recognitionRef.current) {
      toast.error("ميزة التعرف على الصوت غير مدعومة في هذا المتصفح");
      return;
    }
    soundEffects.playClick();
    setTranscript("");
    setScore(null);
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch {
      // In case it's already running
      try {
        recognitionRef.current.stop();
      } catch {}
      setIsListening(false);
    }
  };

  const stopListening = () => {
    soundEffects.playClick();
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setIsListening(false);
  };

  const playNativeAudio = () => {
    if ("speechSynthesis" in window) {
      soundEffects.playClick();
      setIsPlayingAudio(true);
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(phrase.en);
      utterance.lang = "en-US";
      utterance.rate = 0.9;
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
    } else {
      toast.info("ميزة نطق النص غير متوفرة في متصفحك");
    }
  };

  const handleNext = () => {
    soundEffects.playClick();
    setTranscript("");
    setScore(null);
    setCurrentIndex((prev) => (prev + 1) % PHRASES.length);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl overflow-hidden rounded-2xl p-6 bg-paper">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="size-9 rounded-xl bg-iris/10 text-iris flex items-center justify-center font-bold">
                <Headphones className="size-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold">معمل التحدث ونطق الإنجليزية</DialogTitle>
                <DialogDescription className="text-xs text-ink-soft">
                  تدرّب على النطق الطبيعي واسمع تقييمك الفوري
                </DialogDescription>
              </div>
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-paper-deep px-3 py-1 text-xs font-semibold text-ink-soft">
              <span>{currentIndex + 1}</span>
              <span>/</span>
              <span>{PHRASES.length}</span>
            </div>
          </div>
        </DialogHeader>

        {/* Phrase Card */}
        <div className="space-y-4 pt-2">
          <div className="relative overflow-hidden rounded-2xl border border-line bg-card p-5 shadow-sm text-center">
            {/* Category tag */}
            <span className="inline-block rounded-full bg-iris/10 text-iris px-2.5 py-0.5 text-[11px] font-bold mb-2">
              {phrase.category === "daily" ? "محادثات يومية" : phrase.category === "business" ? "بيئة العمل" : "سفر ومطارات"}
            </span>

            {/* Target English phrase */}
            <div className="py-2" dir="ltr">
              <p className="text-lg sm:text-xl font-bold tracking-tight text-ink">
                "{phrase.en}"
              </p>
            </div>

            {/* Arabic translation */}
            <p className="text-xs text-ink-soft font-medium pb-2">
              {phrase.ar}
            </p>

            {/* Native pronunciation listen button */}
            <div className="flex justify-center pt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={playNativeAudio}
                disabled={isPlayingAudio}
                className="h-8 gap-1.5 rounded-full text-xs font-bold text-iris hover:bg-iris/10 border-iris/30"
              >
                <Volume2 className={`size-3.5 ${isPlayingAudio ? "animate-pulse" : ""}`} />
                {isPlayingAudio ? "جاري الاستماع..." : "اسمع النطق السليم (Native)"}
              </Button>
            </div>
          </div>

          {/* Pronunciation Tip from Companion */}
          <div className="flex items-start gap-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 p-3 text-xs">
            <CompanionAvatar size={34} className="shrink-0" />
            <div className="space-y-0.5">
              <span className="font-bold text-amber-800 dark:text-amber-300">
                نصيحة {companion.name}:
              </span>
              <p className="text-ink-soft leading-relaxed">{phrase.tip}</p>
            </div>
          </div>

          {/* Live Recording Area */}
          <div className="rounded-2xl border border-line bg-paper-deep p-4 text-center space-y-3">
            {isListening ? (
              <div className="flex flex-col items-center gap-2">
                <div className="relative size-16 rounded-full bg-red-500/10 flex items-center justify-center animate-pulse">
                  <div className="size-12 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg">
                    <Mic className="size-6 animate-bounce" />
                  </div>
                </div>
                <p className="text-xs font-bold text-red-600 animate-pulse">
                  اتكلم بالإنجليزي دلوقتي، أنا سامعك...
                </p>
                {transcript && (
                  <p className="text-xs italic text-ink font-serif" dir="ltr">
                    "{transcript}"
                  </p>
                )}
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={stopListening}
                  className="h-8 rounded-full text-xs"
                >
                  <MicOff className="size-3.5 ml-1" /> إيقاف التسجيل
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={startListening}
                  className="group relative size-16 rounded-full bg-iris text-white shadow-lg transition-transform hover:scale-105 active:scale-95 flex items-center justify-center cursor-pointer"
                  title="اضغط وتحدث بالإنجليزي"
                >
                  <Mic className="size-7" />
                  <span className="absolute -inset-1 rounded-full border-2 border-iris/40 animate-ping pointer-events-none" />
                </button>
                <span className="text-xs font-bold text-ink">
                  اضغط على المايك وتكلم الجملة
                </span>
                {transcript && !score && (
                  <p className="text-xs text-ink-soft" dir="ltr">
                    "{transcript}"
                  </p>
                )}
              </div>
            )}

            {/* Score Feedback */}
            {score !== null && (
              <div className="animate-in fade-in zoom-in-95 duration-200 rounded-xl bg-card border border-line p-3 text-center space-y-1.5">
                <div className="flex items-center justify-center gap-2">
                  {score >= 80 ? (
                    <CheckCircle2 className="size-5 text-emerald-500" />
                  ) : score >= 55 ? (
                    <Sparkles className="size-5 text-amber-500" />
                  ) : (
                    <AlertCircle className="size-5 text-rose-500" />
                  )}
                  <span className="text-sm font-bold text-ink">
                    دقة النطق: <span className="font-mono text-iris">{score}%</span>
                  </span>
                </div>
                <p className="text-xs font-medium text-ink-soft">
                  {score >= 80
                    ? companion.id === "khadija"
                      ? "إيه الشطارة دي! نطقك طالع زي الأجانب تماماً يا قمر 🌸✨"
                      : "وحش الإنجليزي! نطقك ممتاز ومخارج حروفك في الجون يا صاحبي 🔥"
                    : score >= 55
                    ? companion.id === "khadija"
                      ? "قريب جداً يا عسل! ركزي بس في سرعة الكلام وحاولي تاني 💛"
                      : "عاش جداً يا بطل! لسه محتاج تظبط الربط بين الكلمات بس النتيجة حلوة 💪"
                    : companion.id === "khadija"
                      ? "ولا يهمك، اسمعي النطق الصوتي فوق وجربي تقوليها تاني بهدوء 🎧"
                      : "عادي جداً دي بداية! اسمع النطق الأصلي من الزرار اللي فوق وعيدها معايا 🎧"}
                </p>
              </div>
            )}
          </div>

          {/* Dialog Action Buttons */}
          <div className="flex items-center justify-between pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={handleNext}
              className="h-8 rounded-full text-xs font-semibold gap-1.5"
            >
              <RefreshCw className="size-3.5" />
              الجملة التالية
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 rounded-full text-xs text-ink-soft hover:text-ink"
            >
              إغلاق
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
