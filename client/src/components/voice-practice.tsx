import { useEffect, useRef, useState } from "react";
import { Download, Mic, Square } from "lucide-react";
import { Button } from "@/components/ui/button";

/** A local, opt-in recorder. It never uploads audio or claims an automated assessment. */
export function VoicePractice() {
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const timer = useRef<number | null>(null);
  const objectUrl = useRef<string | null>(null);
  const mounted = useRef(true);
  const [status, setStatus] = useState<"idle" | "asking" | "recording">("idle");
  const [seconds, setSeconds] = useState(0);
  const [audio, setAudio] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const stop = () => {
    if (timer.current !== null) window.clearInterval(timer.current);
    timer.current = null;
    if (recorder.current?.state === "recording") recorder.current.stop();
    stream.current?.getTracks().forEach(track => track.stop());
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
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setError("المتصفح ده مش بيدعم التسجيل. جرّب متصفح حديث وافتح الموقع مباشرة.");
      return;
    }
    setStatus("asking");
    try {
      const media = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!mounted.current) {
        media.getTracks().forEach(track => track.stop());
        return;
      }
      stream.current = media;
      const chunks: BlobPart[] = [];
      const instance = new MediaRecorder(media);
      recorder.current = instance;
      instance.ondataavailable = event => {
        if (event.data.size) chunks.push(event.data);
      };
      instance.onstop = () => {
        if (!mounted.current) return;
        if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
        const blob = new Blob(chunks, { type: instance.mimeType || "audio/webm" });
        objectUrl.current = URL.createObjectURL(blob);
        setAudio(objectUrl.current);
        setStatus("idle");
      };
      instance.onerror = () => {
        if (mounted.current) setError("التسجيل وقف بسبب مشكلة في المتصفح. جرّب تاني.");
        stop();
      };
      instance.start();
      setSeconds(0);
      setStatus("recording");
      const started = Date.now();
      timer.current = window.setInterval(() => {
        const elapsed = Math.floor((Date.now() - started) / 1000);
        if (mounted.current) setSeconds(Math.min(60, elapsed));
        if (elapsed >= 60) stop();
      }, 250);
    } catch {
      stream.current?.getTracks().forEach(track => track.stop());
      stream.current = null;
      if (mounted.current) {
        setStatus("idle");
        setError("اسمح باستخدام الميكروفون من إعدادات المتصفح، وبعدين جرّب تاني. التسجيل اختياري.");
      }
    }
  };

  return (
    <section className="rounded-3xl border border-line bg-card p-6 sm:p-8" aria-label="تدريب نطق اختياري">
      <p className="flex items-center gap-2 text-xs font-semibold text-iris"><Mic className="size-4" /> اسمع نفسك، وخد بالك من الفرق</p>
      <h2 className="mt-2 text-xl font-semibold text-ink">اقرأ مثالين من الدرس <span className="hl-word">بصوتك.</span></h2>
      <p className="mt-2 text-sm leading-7 text-ink-soft">سجّل لحد دقيقة، اسمع النطق، وبعدها حاول تاني بجملة أوضح. التسجيل بيبقى مؤقت في الصفحة دي بس؛ مش بيتبعت لحد ومفيش تقييم صوتي آلي.</p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {status === "recording" ? (
          <Button type="button" onClick={stop} className="rounded-full bg-iris text-white"><Square className="me-2 size-4" /> وقّف التسجيل ({seconds}/60)</Button>
        ) : (
          <Button type="button" onClick={() => void start()} disabled={status === "asking"} className="rounded-full bg-iris text-white"><Mic className="me-2 size-4" /> {status === "asking" ? "بنطلب إذن الميكروفون…" : audio ? "سجّل محاولة جديدة" : "ابدأ التسجيل"}</Button>
        )}
        {audio && status === "idle" && (
          <a href={audio} download="link-me-speaking.webm" className="inline-flex items-center gap-2 text-sm font-semibold text-iris"><Download className="size-4" /> نزّل محاولتك</a>
        )}
      </div>
      <p className="sr-only" aria-live="polite">{status === "recording" ? "التسجيل شغال" : "التسجيل متوقف"}</p>
      {error && <p className="mt-3 text-sm text-destructive" role="alert">{error}</p>}
      {audio && <audio controls src={audio} className="mt-4 w-full" aria-label="اسمع تسجيلك" />}
    </section>
  );
}
