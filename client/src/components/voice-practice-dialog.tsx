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
  Play,
  Pause,
  AlertTriangle,
  RotateCcw,
  Flame,
  Check,
  ChevronDown,
  ChevronUp,
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
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
    tip: "ركز على نطق Could you كأنها كلمة واحدة خفيفة /kʊdʒuː/ بدون نطق حرف الـ L.",
  },
  {
    id: "p2",
    en: "I'd like to order a cup of coffee with milk, please.",
    ar: "عايز أطلب فنجان قهوة بحليب، من فضلك.",
    category: "daily",
    tip: "انطق cup of كأنها cuppa سريعة ومترابطة /kʌpəv/.",
  },
  {
    id: "p3",
    en: "I'm looking forward to working with your team on this project.",
    ar: "أنا متطلع ومتحمس للعمل مع فريقكم على هذا المشروع.",
    category: "business",
    tip: "لاحظ إن بعد looking forward to بييجي الفعل متبوعاً بـ -ing، واضغط على مقطع proj- في project.",
  },
  {
    id: "p4",
    en: "Let's schedule a follow-up meeting next Thursday morning.",
    ar: "خلّينا نحدد ميعاد اجتماع متابعة صباح الخميس القادم.",
    category: "business",
    tip: "انطق schedule بالطريقة الأمريكية sked-jool وانطق TH في Thursday بإخراج طرف اللسان.",
  },
  {
    id: "p5",
    en: "Where is the baggage claim area for international arrivals?",
    ar: "فين مكان استلام الحقائب للرحلات الدولية؟",
    category: "travel",
    tip: "انطق baggage بـ g ناعمة /ɪdʒ/ وخفّف حرف الـ t في international.",
  },
  {
    id: "p6",
    en: "Could I have a window seat near the front of the plane, please?",
    ar: "ممكن أحصل على مقعد جنب الشباك قريب من مقدمة الطائرة، لو سمحت؟",
    category: "travel",
    tip: "انطق Could I متصلة كأنها /kʊdaɪ/ بسلاسة تامة.",
  },
];

type SpeechAiResult = {
  overallScore: number;
  pronunciationScore: number;
  fluencyScore: number;
  grammarScore: number;
  transcribedText: string;
  correctedSentence: string;
  mispronouncedWords: {
    word: string;
    phoneticGuide: string;
    correctionTip: string;
    exampleCorrect: string;
  }[];
  grammarMistakes: {
    mistake: string;
    explanationAr: string;
    correction: string;
  }[];
  fluencyNotes: string[];
  actionableArabicTips: string[];
  teacherFeedback: string;
  modelUsed?: string;
};

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(",")[1];
      if (base64) resolve(base64);
      else reject(new Error("Failed to encode audio to base64"));
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
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
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isPlayingUserAudio, setIsPlayingUserAudio] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "words" | "tips">("overview");

  // AI Evaluation State
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evalResult, setEvalResult] = useState<SpeechAiResult | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  // Audio recording refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);
  const userAudioPlayerRef = useRef<HTMLAudioElement | null>(null);

  const phrase = PHRASES[currentIndex];
  const evaluateAudioMutation = trpc.writing.evaluateAudioSpeech.useMutation();

  // Clean up recording timer and audio URLs on unmount / change
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const startRecording = async () => {
    setApiError(null);
    setEvalResult(null);
    setAudioUrl(null);
    audioChunksRef.current = [];

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setApiError("متصفحك الحالي لا يدعم تسجيل الصوت من الميكروفون.");
      toast.error("متصفحك لا يدعم تسجيل الصوت.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/mp4")
        ? "audio/mp4"
        : "";

      const options = mimeType ? { mimeType } : undefined;
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const finalBlob = new Blob(audioChunksRef.current, {
          type: mediaRecorder.mimeType || "audio/webm",
        });

        if (finalBlob.size < 500) {
          setApiError("التسجيل الصوتي قصير جداً أو فارغ. حاول التحدث بصوت أوضح.");
          return;
        }

        const url = URL.createObjectURL(finalBlob);
        setAudioUrl(url);

        // Send to Gemini Backend
        await sendAudioToGemini(finalBlob);
      };

      mediaRecorder.start(200);
      setIsRecording(true);
      setRecordingSeconds(0);
      soundEffects.playClick();

      const startTime = Date.now();
      timerIntervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setRecordingSeconds(elapsed);
        if (elapsed >= 30) {
          stopRecording();
        }
      }, 500);
    } catch (err: any) {
      console.error("Mic access error:", err);
      setIsRecording(false);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setApiError("تم رفض إذن الوصول للمايكروفون. يرجى السماح بالمايك من إعدادات المتصفح.");
        toast.error("يرجى السماح بالوصول للمايكروفون من إعدادات المتصفح.");
      } else {
        setApiError(`فشل بدء التسجيل: ${err.message || String(err)}`);
      }
    }
  };

  const stopRecording = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      soundEffects.playClick();
    }
    setIsRecording(false);
  };

  const sendAudioToGemini = async (audioBlob: Blob) => {
    setIsEvaluating(true);
    setApiError(null);

    try {
      const base64Audio = await blobToBase64(audioBlob);
      const cleanMime = audioBlob.type || "audio/webm";

      const response = await evaluateAudioMutation.mutateAsync({
        audioBase64: base64Audio,
        mimeType: cleanMime,
        targetPhrase: phrase.en,
      });

      if (response && response.success) {
        setEvalResult(response as unknown as SpeechAiResult);
        soundEffects.playCorrect();
        recordDailyActivity();
        toast.success(`تم تقييم النطق بنجاح عبر Gemini (${response.modelUsed || "AI"}) ⚡`);
      } else {
        throw new Error("لم يتم استلام تقييم صالح من الذكاء الاصطناعي.");
      }
    } catch (err: any) {
      console.error("Gemini Speech Evaluation Error:", err);
      soundEffects.playIncorrect();
      const errorMsg =
        err?.message ||
        err?.shape?.message ||
        "تعذر تحليل التسجيل الصوتي عبر Gemini API. تأكد من جودة الصوت واتصالك بالإنترنت.";
      setApiError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsEvaluating(false);
    }
  };

  const playNativeAudio = () => {
    if ("speechSynthesis" in window) {
      soundEffects.playClick();
      setIsPlayingAudio(true);
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(phrase.en);
      utterance.lang = "en-US";
      utterance.rate = 0.88;
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
    } else {
      toast.info("ميزة نطق النص غير متوفرة في متصفحك");
    }
  };

  const toggleUserAudio = () => {
    if (!audioUrl) return;
    if (!userAudioPlayerRef.current) {
      userAudioPlayerRef.current = new Audio(audioUrl);
      userAudioPlayerRef.current.onended = () => setIsPlayingUserAudio(false);
    }

    if (isPlayingUserAudio) {
      userAudioPlayerRef.current.pause();
      setIsPlayingUserAudio(false);
    } else {
      userAudioPlayerRef.current.play();
      setIsPlayingUserAudio(true);
    }
  };

  const handleNext = () => {
    soundEffects.playClick();
    setEvalResult(null);
    setApiError(null);
    setAudioUrl(null);
    setCurrentIndex((prev) => (prev + 1) % PHRASES.length);
  };

  const handleReset = () => {
    soundEffects.playClick();
    setEvalResult(null);
    setApiError(null);
    setAudioUrl(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl p-6 bg-paper border border-line shadow-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="size-10 rounded-2xl bg-iris/10 text-iris flex items-center justify-center font-bold shadow-xs">
                <Headphones className="size-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-extrabold text-ink flex items-center gap-2">
                  <span>معمل التحدث وتحليل النطق بالذكاء الاصطناعي</span>
                  <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    Gemini Live ⚡
                  </span>
                </DialogTitle>
                <DialogDescription className="text-xs text-ink-soft">
                  سجّل صوتك بالميكروفون ليقوم Google Gemini بتحليل مخارج الحروف والطلاقة والقواعد
                </DialogDescription>
              </div>
            </div>
            <div className="flex items-center gap-1.5 rounded-full border border-line bg-card px-3 py-1 text-xs font-bold text-ink-soft">
              <Flame className="size-3.5 text-amber-500" />
              <span>{currentIndex + 1}</span>
              <span>/</span>
              <span>{PHRASES.length}</span>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Target Practice Phrase Card */}
          <div className="relative overflow-hidden rounded-2xl border border-line bg-gradient-to-b from-card to-paper-deep/50 p-5 shadow-xs text-center">
            <span className="inline-block rounded-full bg-iris/10 text-iris px-3 py-0.5 text-[11px] font-extrabold mb-2">
              {phrase.category === "daily"
                ? "محادثات يومية"
                : phrase.category === "business"
                ? "بيئة العمل والشركات"
                : "سفر ومطارات"}
            </span>

            <div className="py-2" dir="ltr">
              <p className="text-lg sm:text-xl font-extrabold tracking-tight text-ink font-sans">
                "{phrase.en}"
              </p>
            </div>

            <p className="text-xs text-ink-soft font-medium pb-2">{phrase.ar}</p>

            <div className="flex justify-center pt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={playNativeAudio}
                disabled={isPlayingAudio}
                className="h-8 gap-2 rounded-full text-xs font-bold text-iris hover:bg-iris/10 border-iris/30 shadow-2xs"
              >
                <Volume2 className={cn("size-3.5", isPlayingAudio && "animate-pulse text-iris")} />
                {isPlayingAudio ? "جاري الاستماع للنموذج..." : "اسمع النطق السليم (Native Speaker)"}
              </Button>
            </div>
          </div>

          {/* Golden Tip from Companion */}
          <div className="flex items-start gap-3 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/40 p-3.5 text-xs">
            <CompanionAvatar size={36} className="shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-extrabold text-amber-800 dark:text-amber-300">
                سر النطق من {companion.name}:
              </span>
              <p className="text-ink-soft leading-relaxed">{phrase.tip}</p>
            </div>
          </div>

          {/* Audio Recording & Mic Interaction Area */}
          <div className="rounded-3xl border border-line bg-paper-deep/60 p-5 text-center space-y-4">
            {isRecording ? (
              <div className="flex flex-col items-center gap-3 py-2">
                <div className="relative size-20 rounded-full bg-red-500/15 flex items-center justify-center animate-pulse">
                  <div className="size-14 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg animate-bounce">
                    <Mic className="size-7" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-extrabold text-red-600 animate-pulse">
                    جارٍ تسجيل صوتك... ({recordingSeconds}/30 ثانية)
                  </p>
                  <p className="text-xs text-ink-soft mt-0.5">
                    تحدّث بوضوح الآن، وسيتم تحليل صوتك مباشرة بالذكاء الاصطناعي
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={stopRecording}
                  className="rounded-full px-5 font-bold shadow-md text-xs"
                >
                  <MicOff className="size-3.5 me-1.5" /> إنهاء وإرسال للتحليل
                </Button>
              </div>
            ) : isEvaluating ? (
              <div className="flex flex-col items-center gap-3 py-6">
                <div className="size-16 rounded-full border-4 border-iris/25 border-t-iris animate-spin flex items-center justify-center">
                  <Sparkles className="size-6 text-iris animate-pulse" />
                </div>
                <div>
                  <p className="text-sm font-extrabold text-ink">
                    Google Gemini يستمع لصوتك ويحلل مخارج الحروف...
                  </p>
                  <p className="text-xs text-ink-soft mt-1">
                    جاري تقييم النطق، الطلاقة، والقواعد واكتشاف المقاطع غير الدقيقة ⚡
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 py-2">
                <button
                  type="button"
                  onClick={startRecording}
                  className="group relative size-20 rounded-full bg-iris text-white shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center cursor-pointer hover:bg-iris-deep"
                  title="اضغط وتحدث بالإنجليزي"
                >
                  <Mic className="size-8" />
                  <span className="absolute -inset-1.5 rounded-full border-2 border-iris/40 animate-ping pointer-events-none" />
                </button>
                <div>
                  <span className="text-sm font-extrabold text-ink block">
                    اضغط على المايك وانطق الجملة بصوتك 🎙️
                  </span>
                  <span className="text-xs text-ink-soft">
                    مسموح حتى 30 ثانية لكل محاولة · التقييم بالذكاء الاصطناعي مباشرة
                  </span>
                </div>
              </div>
            )}

            {/* User audio playback */}
            {audioUrl && !isRecording && !isEvaluating && (
              <div className="flex items-center justify-center gap-2 pt-1 border-t border-line/60">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={toggleUserAudio}
                  className="h-8 gap-1.5 rounded-full text-xs text-ink-soft hover:text-ink font-semibold"
                >
                  {isPlayingUserAudio ? (
                    <>
                      <Pause className="size-3.5 text-iris" /> إيقاف صوتك
                    </>
                  ) : (
                    <>
                      <Play className="size-3.5 text-iris" /> استمع لتسجيلك الصوتي 🎧
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleReset}
                  className="h-8 gap-1 rounded-full text-xs text-ink-soft hover:text-ink"
                >
                  <RotateCcw className="size-3" /> إعادة التسجيل
                </Button>
              </div>
            )}
          </div>

          {/* Real Error Card (No fake fallback) */}
          {apiError && (
            <div className="rounded-2xl border border-rose-300 bg-rose-50/90 dark:bg-rose-950/40 p-4 text-xs text-rose-900 dark:text-rose-200 space-y-1.5 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 font-extrabold text-rose-700 dark:text-rose-300">
                <AlertTriangle className="size-4 shrink-0" />
                <span>تعذر تحليل التسجيل الصوتي:</span>
              </div>
              <p className="leading-relaxed text-ink-soft">{apiError}</p>
              <div className="pt-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={startRecording}
                  className="h-7 text-xs rounded-full border-rose-300 text-rose-700 hover:bg-rose-100"
                >
                  حاول التسجيل مرة أخرى 🎙️
                </Button>
              </div>
            </div>
          )}

          {/* Ultra-Chic Gemini Speech Coaching Result */}
          {evalResult && (
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
              {/* Score Header Card */}
              <div className="rounded-3xl border border-iris/25 bg-gradient-to-br from-iris-soft/40 via-card to-paper p-5 shadow-sm">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-center sm:text-start">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400">
                      <Sparkles className="size-3 text-emerald-500" />
                      تحليل حقيقي عبر Google Gemini ({evalResult.modelUsed || "Flash"})
                    </span>
                    <h3 className="mt-2 text-2xl font-black text-ink">
                      النتيجة الكلية للنطق:{" "}
                      <span className="text-iris font-mono">{evalResult.overallScore}%</span>
                    </h3>
                    <p className="text-xs text-ink-soft mt-1 leading-relaxed max-w-md">
                      {evalResult.teacherFeedback}
                    </p>
                  </div>

                  {/* Subscores Grid */}
                  <div className="grid grid-cols-3 gap-2.5 shrink-0 w-full sm:w-auto">
                    <div className="rounded-2xl border border-line bg-card p-3 text-center shadow-2xs">
                      <span className="block text-[10px] font-bold text-ink-soft">النطق</span>
                      <span className="text-lg font-black text-iris">
                        {evalResult.pronunciationScore}%
                      </span>
                    </div>
                    <div className="rounded-2xl border border-line bg-card p-3 text-center shadow-2xs">
                      <span className="block text-[10px] font-bold text-ink-soft">الطلاقة</span>
                      <span className="text-lg font-black text-sky-600">
                        {evalResult.fluencyScore}%
                      </span>
                    </div>
                    <div className="rounded-2xl border border-line bg-card p-3 text-center shadow-2xs">
                      <span className="block text-[10px] font-bold text-ink-soft">القواعد</span>
                      <span className="text-lg font-black text-purple-600">
                        {evalResult.grammarScore}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* What Gemini Heard & Polished Version */}
              <div className="grid gap-3 sm:grid-cols-2 text-xs">
                <div className="rounded-2xl border border-line bg-card p-3.5 space-y-1">
                  <span className="font-extrabold text-ink-soft block">
                    ما سمعه الذكاء الاصطناعي من صوتك:
                  </span>
                  <p className="font-sans font-bold text-ink text-sm leading-relaxed" dir="ltr">
                    "{evalResult.transcribedText || "—"}"
                  </p>
                </div>
                <div className="rounded-2xl border border-emerald-300/40 bg-emerald-50/40 dark:bg-emerald-950/20 p-3.5 space-y-1">
                  <span className="font-extrabold text-emerald-800 dark:text-emerald-300 block">
                    الصياغة النموذجية السليمة:
                  </span>
                  <p
                    className="font-sans font-bold text-emerald-700 dark:text-emerald-300 text-sm leading-relaxed"
                    dir="ltr"
                  >
                    "{evalResult.correctedSentence || phrase.en}"
                  </p>
                </div>
              </div>

              {/* Navigation Tabs for Details */}
              <div className="flex border-b border-line gap-2 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setActiveTab("overview")}
                  className={cn(
                    "pb-2 px-2 transition-colors border-b-2",
                    activeTab === "overview"
                      ? "border-iris text-iris"
                      : "border-transparent text-ink-soft hover:text-ink"
                  )}
                >
                  نصائح اللهجة ومخارج الحروف ({evalResult.actionableArabicTips.length})
                </button>
                {evalResult.mispronouncedWords.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab("words")}
                    className={cn(
                      "pb-2 px-2 transition-colors border-b-2",
                      activeTab === "words"
                        ? "border-iris text-iris"
                        : "border-transparent text-ink-soft hover:text-ink"
                    )}
                  >
                    الكلمات التي تحتاج تدريباً ({evalResult.mispronouncedWords.length})
                  </button>
                )}
                {evalResult.fluencyNotes.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab("tips")}
                    className={cn(
                      "pb-2 px-2 transition-colors border-b-2",
                      activeTab === "tips"
                        ? "border-iris text-iris"
                        : "border-transparent text-ink-soft hover:text-ink"
                    )}
                  >
                    ملاحظات الإيقاع والطلاقة ({evalResult.fluencyNotes.length})
                  </button>
                )}
              </div>

              {/* Tab 1: Actionable Arabic Tips */}
              {activeTab === "overview" && (
                <div className="space-y-2">
                  {evalResult.actionableArabicTips.map((tip, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2.5 rounded-2xl border border-line bg-card p-3 text-xs leading-relaxed"
                    >
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-iris/10 text-iris text-[10px] font-bold">
                        {idx + 1}
                      </span>
                      <p className="text-ink">{tip}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Tab 2: Mispronounced Words Breakdown */}
              {activeTab === "words" && (
                <div className="space-y-2.5">
                  {evalResult.mispronouncedWords.map((item, idx) => (
                    <div
                      key={idx}
                      className="rounded-2xl border border-amber-300/40 bg-amber-50/40 dark:bg-amber-950/20 p-3.5 space-y-1.5 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-sans font-extrabold text-sm text-amber-900 dark:text-amber-200" dir="ltr">
                          "{item.word}"
                        </span>
                        <span className="font-mono text-[11px] bg-amber-200/50 dark:bg-amber-900/40 px-2 py-0.5 rounded-md text-amber-800 dark:text-amber-300" dir="ltr">
                          {item.phoneticGuide}
                        </span>
                      </div>
                      <p className="text-ink-soft leading-relaxed">{item.correctionTip}</p>
                      {item.exampleCorrect && (
                        <p className="text-[11px] text-ink font-sans pt-0.5" dir="ltr">
                          Example: <em>"{item.exampleCorrect}"</em>
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Tab 3: Fluency & Rhythm Notes */}
              {activeTab === "tips" && (
                <div className="space-y-2">
                  {evalResult.fluencyNotes.map((note, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2.5 rounded-2xl border border-line bg-card p-3 text-xs leading-relaxed"
                    >
                      <Check className="size-4 shrink-0 text-sky-500 mt-0.5" />
                      <p className="text-ink">{note}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Dialog Action Buttons */}
          <div className="flex items-center justify-between pt-2 border-t border-line">
            <Button
              variant="outline"
              size="sm"
              onClick={handleNext}
              className="h-8 rounded-full text-xs font-bold gap-1.5"
            >
              <RefreshCw className="size-3.5" />
              الجملة التالية
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 rounded-full text-xs text-ink-soft hover:text-ink font-semibold"
            >
              إغلاق
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
