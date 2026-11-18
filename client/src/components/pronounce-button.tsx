import { useState, useEffect, useRef } from "react";
import { Volume2, VolumeX, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  text: string;
  lang?: string;
  rate?: number;
  pitch?: number;
  className?: string;
  size?: "sm" | "md" | "lg";
  label?: string;
};

export function PronounceButton({
  text,
  lang = "en-US",
  rate = 0.9, // slightly slower for language learners
  pitch = 1.0,
  className,
  size = "md",
  label,
}: Props) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setIsSupported(false);
    }
  }, []);

  const cleanText = text
    .replace(/[#*_~`]/g, "") // strip markdown
    .replace(/\(.*?\)/g, "") // optional: strip parentheticals
    .trim();

  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (!isSupported || !cleanText) return;

    const synth = window.speechSynthesis;

    // If currently speaking, stop it
    if (isSpeaking) {
      synth.cancel();
      setIsSpeaking(false);
      return;
    }

    synth.cancel(); // stop any other speech first

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utteranceRef.current = utterance;
    utterance.lang = lang;
    utterance.rate = rate;
    utterance.pitch = pitch;

    // Attempt to pick a premium natural English voice if available
    const voices = synth.getVoices();
    const preferredVoice = voices.find(
      v =>
        (v.lang.startsWith("en-US") || v.lang.startsWith("en-GB") || v.lang.startsWith("en")) &&
        (v.name.includes("Google") ||
          v.name.includes("Natural") ||
          v.name.includes("Samantha") ||
          v.name.includes("Daniel") ||
          v.name.includes("Siri"))
    ) ?? voices.find(v => v.lang.startsWith("en"));

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    synth.speak(utterance);
  };

  if (!isSupported || !cleanText) return null;

  const sizeClasses = label
    ? {
        sm: "h-8 px-3 text-xs gap-1.5",
        md: "h-9 px-3.5 text-xs gap-1.5",
        lg: "h-10 px-4 text-xs gap-2",
      }
    : {
        sm: "size-7 text-xs",
        md: "size-8 text-sm",
        lg: "size-9 text-xs",
      };

  const iconSizes = {
    sm: "size-3.5",
    md: "size-4",
    lg: "size-4",
  };

  return (
    <button
      type="button"
      onClick={handleSpeak}
      title={isSpeaking ? "إيقاف الصوت" : "استمع لنطق الجملة 🔊"}
      aria-label={isSpeaking ? "إيقاف النطق" : `استمع لنطق: ${cleanText}`}
      className={cn(
        "inline-flex items-center justify-center rounded-full border transition-all shrink-0 select-none",
        isSpeaking
          ? "border-iris bg-iris text-white shadow-md animate-pulse ring-2 ring-iris/30 scale-105"
          : "border-line bg-paper/80 hover:bg-paper-deep text-iris hover:border-iris/50 hover:scale-105",
        sizeClasses[size],
        className
      )}
    >
      <Volume2
        className={cn(
          iconSizes[size],
          isSpeaking && "animate-bounce"
        )}
      />
      {label && <span className="font-semibold text-xs">{label}</span>}
    </button>
  );
}
