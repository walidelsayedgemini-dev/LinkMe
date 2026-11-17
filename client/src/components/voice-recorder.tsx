import { useState, useRef, useEffect } from "react";
import {
  Mic,
  Square,
  Play,
  Pause,
  RotateCcw,
  Trash2,
  Volume2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  onAudioChange: (base64DataUrl: string | null) => void;
  maxDurationSeconds?: number;
  className?: string;
};

export function VoiceRecorder({
  onAudioChange,
  maxDurationSeconds = 180, // 3 minutes max
  className,
}: Props) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playProgress, setPlayProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Clean up streams & timers on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const startRecording = async () => {
    setError(null);
    audioChunksRef.current = [];

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError("متصفحك لا يدعم تسجيل الصوت المباشر.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Select supported audio mimeType
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/mp4")
          ? "audio/mp4"
          : "audio/webm";

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = event => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const objectUrl = URL.createObjectURL(audioBlob);
        setAudioUrl(objectUrl);

        // Convert blob to base64 Data URL for upload
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          onAudioChange(base64);
        };
        reader.readAsDataURL(audioBlob);

        // Stop microphone stream tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };

      mediaRecorder.start(250); // collect data chunks every 250ms
      setIsRecording(true);
      setRecordingSeconds(0);

      timerIntervalRef.current = window.setInterval(() => {
        setRecordingSeconds(prev => {
          if (prev + 1 >= maxDurationSeconds) {
            stopRecording();
            return maxDurationSeconds;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err: unknown) {
      console.error("Microphone error:", err);
      setError("يرجى إعطاء الإذن للمتصفح للوصول إلى الميكروفون للتسجيل.");
    }
  };

  const stopRecording = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const handlePlayPause = () => {
    if (!audioElementRef.current) return;
    if (isPlaying) {
      audioElementRef.current.pause();
      setIsPlaying(false);
    } else {
      audioElementRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleReset = () => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
    }
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setIsPlaying(false);
    setPlayProgress(0);
    setRecordingSeconds(0);
    onAudioChange(null);
  };

  return (
    <div
      className={cn(
        "rounded-2xl border border-line bg-paper/70 p-4 transition-all space-y-3",
        isRecording && "border-rose-500/60 bg-rose-500/5 ring-1 ring-rose-500/30",
        audioUrl && "border-iris/40 bg-iris/5",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-ink flex items-center gap-1.5">
          <Volume2 className="size-4 text-iris" /> تسجيل إجابة صوتية (Speaking)
        </span>
        {isRecording && (
          <span className="flex items-center gap-1.5 text-xs font-mono font-bold text-rose-600 dark:text-rose-400">
            <span className="size-2 rounded-full bg-rose-600 animate-ping" />
            {formatTime(recordingSeconds)} / {formatTime(maxDurationSeconds)}
          </span>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400">
          <AlertCircle className="size-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Case 1: Currently Recording */}
      {isRecording && (
        <div className="flex flex-col items-center justify-center py-4 space-y-3">
          <div className="relative flex items-center justify-center">
            <div className="absolute size-20 rounded-full bg-rose-500/20 animate-ping pointer-events-none" />
            <div className="size-16 rounded-full bg-rose-600 text-white grid place-items-center shadow-lg">
              <Mic className="size-8" />
            </div>
          </div>
          <p className="text-xs font-medium text-ink-soft animate-pulse">
            الميكروفون يسجل الآن، تحدث بوضوح…
          </p>
          <Button
            type="button"
            onClick={stopRecording}
            className="rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs gap-1.5 px-6 h-9 shadow-sm"
          >
            <Square className="size-3.5 fill-current" /> إيقاف وحفظ التسجيل
          </Button>
        </div>
      )}

      {/* Case 2: Audio Recorded - Playback View */}
      {!isRecording && audioUrl && (
        <div className="space-y-3 pt-1">
          <audio
            ref={audioElementRef}
            src={audioUrl}
            onTimeUpdate={e => {
              const audio = e.currentTarget;
              if (audio.duration) {
                setPlayProgress((audio.currentTime / audio.duration) * 100);
              }
            }}
            onEnded={() => {
              setIsPlaying(false);
              setPlayProgress(0);
            }}
          />

          <div className="flex items-center gap-3 bg-card p-3 rounded-xl border border-line">
            <button
              type="button"
              onClick={handlePlayPause}
              className="size-10 rounded-full bg-iris hover:bg-iris-deep text-white grid place-items-center shrink-0 transition-transform active:scale-95"
              aria-label={isPlaying ? "إيقاف مؤقت" : "تشغيل"}
            >
              {isPlaying ? (
                <Pause className="size-5 fill-current" />
              ) : (
                <Play className="size-5 fill-current ms-0.5" />
              )}
            </button>

            <div className="flex-1 space-y-1">
              <div className="h-2 w-full bg-paper rounded-full overflow-hidden border border-line">
                <div
                  className="h-full bg-iris rounded-full transition-all duration-150"
                  style={{ width: `${playProgress}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-ink-soft font-mono">
                <span>تم التسجيل بنجاح</span>
                <span>{formatTime(recordingSeconds)}</span>
              </div>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="size-9 p-0 text-ink-soft hover:text-rose-600 rounded-full shrink-0"
              title="حذف وإعادة التسجيل"
            >
              <RotateCcw className="size-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Case 3: Initial idle state (Start recording button) */}
      {!isRecording && !audioUrl && (
        <div className="flex items-center justify-between gap-3 bg-card p-3 rounded-xl border border-line">
          <p className="text-xs text-ink-soft">
            اضغط لتسجيل نطقك أو إجابتك بالصوت ليستمع إليها المدرس ويقيمك.
          </p>
          <Button
            type="button"
            onClick={startRecording}
            variant="outline"
            className="rounded-full gap-2 border-iris/40 bg-iris/5 hover:bg-iris/15 text-iris text-xs font-bold shrink-0 h-9"
          >
            <Mic className="size-4" /> ابدأ التسجيل
          </Button>
        </div>
      )}
    </div>
  );
}
