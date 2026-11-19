import { useEffect, useRef, useState } from "react";
import { Download, Mic, Square, Sparkles, CheckCircle2, AlertTriangle, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { soundEffects } from "@/lib/sound-effects";
import { toast } from "sonner";

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(",")[1];
      if (base64) resolve(base64);
      else reject(new Error("Failed to encode audio"));
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/** Real Gemini-powered voice practice and speech coaching recorder */
export function VoicePractice() {
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const timer = useRef<number | null>(null);
  const objectUrl = useRef<string | null>(null);
  const audioBlobRef = useRef<Blob | null>(null);
  const userAudioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const mounted = useRef(true);

  const [status, setStatus] = useState<"idle" | "asking" | "recording">("idle");
  const [seconds, setSeconds] = useState(0);
  const [audio, setAudio] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Gemini AI Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<any | null>(null);

  const evaluateMutation = trpc.writing.evaluateAudioSpeech.useMutation();

  const stop = () => {
    if (timer.current !== null) window.clearInterval(timer.current);
    timer.current = null;
    if (recorder.current?.state === "recording") recorder.current.stop();
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
    if (mounted.current) setStatus("idle");
  };

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      stop();
      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    };
  }, []);

  const start = async () => {
    if (status !== "idle") return;
    setError(null);
    setAiResult(null);
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setError("المتصفح الحالي لا يدعم تسجيل الصوت. يرجى استخدام متصفح حديث.");
      return;
    }
    setStatus("asking");
    try {
      const media = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      if (!mounted.current) {
        media.getTracks().forEach((track) => track.stop());
        return;
      }
      stream.current = media;
      const chunks: BlobPart[] = [];
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const instance = new MediaRecorder(media, { mimeType });
      recorder.current = instance;
      instance.ondataavailable = (event) => {
        if (event.data.size) chunks.push(event.data);
      };
      instance.onstop = () => {
        if (!mounted.current) return;
        if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
        const blob = new Blob(chunks, { type: instance.mimeType || "audio/webm" });
        audioBlobRef.current = blob;
        objectUrl.current = URL.createObjectURL(blob);
        setAudio(objectUrl.current);
        setStatus("idle");
      };
      instance.onerror = () => {
        if (mounted.current) setError("توقف التسجيل بسبب مشكلة في المتصفح. جرّب مجدداً.");
        stop();
      };
      instance.start(250);
      setSeconds(0);
      setStatus("recording");
      const started = Date.now();
      timer.current = window.setInterval(() => {
        const elapsed = Math.floor((Date.now() - started) / 1000);
        if (mounted.current) setSeconds(Math.min(60, elapsed));
        if (elapsed >= 60) stop();
      }, 250);
    } catch {
      stream.current?.getTracks().forEach((track) => track.stop());
      stream.current = null;
      if (mounted.current) {
        setStatus("idle");
        setError("يرجى السماح باستخدام الميكروفون من إعدادات المتصفح ثم المحاولة مجدداً.");
      }
    }
  };

  const handleAnalyzeWithGemini = async () => {
    if (!audioBlobRef.current) return;
    setIsAnalyzing(true);
    setError(null);

    try {
      const base64 = await blobToBase64(audioBlobRef.current);
      const res = await evaluateMutation.mutateAsync({
        audioBase64: base64,
        mimeType: audioBlobRef.current.type || "audio/webm",
      });

      if (res && res.success) {
        setAiResult(res);
        soundEffects.playCorrect();
        toast.success(`تم تقييم النطق عبر Gemini (${res.modelUsed || "Flash"}) ⚡`);
      } else {
        throw new Error("لم يتم استلام تقييم من الذكاء الاصطناعي");
      }
    } catch (err: any) {
      console.error(err);
      soundEffects.playIncorrect();
      const msg = err.message || "تعذر تحليل التسجيل عبر Gemini API.";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const togglePlayAudio = () => {
    if (!audio) return;
    if (!userAudioPlayerRef.current) {
      userAudioPlayerRef.current = new Audio(audio);
      userAudioPlayerRef.current.onended = () => setIsPlayingAudio(false);
    }
    if (isPlayingAudio) {
      userAudioPlayerRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      userAudioPlayerRef.current.play();
      setIsPlayingAudio(true);
    }
  };

  return (
    <section
      className="rounded-3xl border border-line bg-card p-6 sm:p-8 space-y-4 shadow-xs"
      aria-label="تدريب النطق ومخارج الحروف بالذكاء الاصطناعي"
    >
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 text-xs font-bold text-iris">
          <Mic className="size-4" /> معمل النطق المباشر عبر Google Gemini
        </p>
        <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
          AI Speech Coach ⚡
        </span>
      </div>

      <h2 className="text-xl font-extrabold text-ink">
        اقرأ أي جملة من الدرس <span className="hl-word">بصوتك.</span>
      </h2>
      <p className="text-sm leading-relaxed text-ink-soft">
        سجّل صوتك حتى 60 ثانية، واضغط على "تحليل النطق بـ Gemini" ليقوم الذكاء الاصطناعي بتقييم مخارج الحروف، الطلاقة، والقواعد واقتراح تصحيحات فورية.
      </p>

      {error && (
        <div className="rounded-2xl border border-rose-300 bg-rose-50/90 dark:bg-rose-950/40 p-3.5 text-xs text-rose-900 dark:text-rose-200 flex items-center gap-2">
          <AlertTriangle className="size-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 pt-1">
        {status === "recording" ? (
          <Button type="button" onClick={stop} className="rounded-full bg-red-600 text-white font-bold">
            <Square className="me-2 size-4" /> وقّف التسجيل ({seconds}/60)
          </Button>
        ) : (
          <Button
            type="button"
            onClick={() => void start()}
            disabled={status === "asking" || isAnalyzing}
            className="rounded-full bg-iris text-white font-bold hover:bg-iris-deep shadow-md"
          >
            <Mic className="me-2 size-4" />{" "}
            {status === "asking"
              ? "نطلب إذن الميكروفون…"
              : audio
              ? "سجّل محاولة صوتية جديدة"
              : "ابدأ التسجيل الصوتي"}
          </Button>
        )}

        {audio && status === "idle" && (
          <>
            <Button
              type="button"
              variant="outline"
              onClick={togglePlayAudio}
              className="rounded-full text-xs font-semibold"
            >
              {isPlayingAudio ? (
                <>
                  <Pause className="me-1.5 size-3.5 text-iris" /> إيقاف صوتك
                </>
              ) : (
                <>
                  <Play className="me-1.5 size-3.5 text-iris" /> استمع لتسجيلك 🎧
                </>
              )}
            </Button>

            <Button
              type="button"
              onClick={handleAnalyzeWithGemini}
              disabled={isAnalyzing}
              className="rounded-full bg-emerald-600 text-white font-bold hover:bg-emerald-700 shadow-md text-xs"
            >
              <Sparkles className="me-1.5 size-3.5" />
              {isAnalyzing ? "Gemini يحلل نطقك الآن..." : "حلل نطقي بذكاء Gemini AI ⚡"}
            </Button>

            <a
              href={audio}
              download="link-me-speaking.webm"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-soft hover:text-ink ms-auto"
            >
              <Download className="size-3.5" /> تنزيل
            </a>
          </>
        )}
      </div>

      {/* AI Speech Analysis Result */}
      {aiResult && (
        <div className="mt-4 rounded-3xl border border-iris/25 bg-gradient-to-br from-iris-soft/30 via-card to-paper p-5 space-y-3.5 text-xs animate-in fade-in duration-200">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
            <div>
              <span className="text-base font-black text-ink">
                النتيجة الكلية للنطق: <span className="text-iris font-mono">{aiResult.overallScore}%</span>
              </span>
              <span className="ms-2 text-[10px] text-ink-soft font-mono">({aiResult.modelUsed})</span>
            </div>
            <div className="flex gap-2">
              <span className="rounded-lg bg-card border border-line px-2 py-0.5 font-bold">
                نطق: {aiResult.pronunciationScore}%
              </span>
              <span className="rounded-lg bg-card border border-line px-2 py-0.5 font-bold text-sky-600">
                طلاقة: {aiResult.fluencyScore}%
              </span>
              <span className="rounded-lg bg-card border border-line px-2 py-0.5 font-bold text-purple-600">
                قواعد: {aiResult.grammarScore}%
              </span>
            </div>
          </div>

          <p className="text-ink leading-relaxed font-medium">{aiResult.teacherFeedback}</p>

          {aiResult.transcribedText && (
            <div className="rounded-xl bg-card border border-line p-3" dir="ltr">
              <span className="text-[10px] text-ink-soft block font-sans">Transcribed speech:</span>
              <p className="font-bold text-ink font-sans">"{aiResult.transcribedText}"</p>
            </div>
          )}

          {aiResult.actionableArabicTips?.length > 0 && (
            <div className="space-y-1 pt-1">
              <span className="font-extrabold text-ink block">نصائح ذهبية لتحسين نطقك:</span>
              {aiResult.actionableArabicTips.map((tip: string, i: number) => (
                <div key={i} className="flex items-start gap-2 text-ink-soft">
                  <CheckCircle2 className="size-3.5 text-emerald-500 mt-0.5 shrink-0" />
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
