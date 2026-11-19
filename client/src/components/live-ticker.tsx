import { useState, useEffect } from "react";
import { Sparkles, Trophy, Zap, MessageCircle, PenTool, Flame } from "lucide-react";
import { cn } from "@/lib/utils";

const PULSES = [
  {
    icon: Flame,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    text: "عمر (القاهرة) وصل لشعلة 5 أيام متتالية وحصل على +50 XP 🔥",
  },
  {
    icon: MessageCircle,
    color: "text-sky-500",
    bg: "bg-sky-500/10",
    text: "سارة (الإسكندرية) أتمّت موقف 'Job Interview' بمستوى احترافي B2 💼",
  },
  {
    icon: Zap,
    color: "text-indigo-500",
    bg: "bg-indigo-500/10",
    text: "محمد (الجيزة) حقق 100% في تحدي الـ 60 ثانية اليومي ⚡",
  },
  {
    icon: PenTool,
    color: "text-rose-500",
    bg: "bg-rose-500/10",
    text: "ياسمين صحّحت مقال Business Email بالذكاء الاصطناعي ورفعت مستواها ✍️",
  },
  {
    icon: Trophy,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
    text: "كريم تصدّر دوري الأسبوع وفتح أفتار 'المحارب الملكي' 👑",
  },
  {
    icon: Sparkles,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    text: "نور أتمت كورس 'التحدث بطلاقة' وحصلت على شهادة معتمدة بالـ QR 🎓",
  },
];

export function LiveActivityTicker({ className }: { className?: string }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setCurrentIndex(prev => (prev + 1) % PULSES.length);
        setFade(true);
      }, 350);
    }, 5500);

    return () => clearInterval(interval);
  }, []);

  const active = PULSES[currentIndex];
  const Icon = active.icon;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-full border border-line bg-card/80 px-3.5 py-1.5 backdrop-blur-md shadow-xs transition-colors",
        className
      )}
    >
      <div
        className={cn(
          "flex items-center gap-2 text-xs transition-opacity duration-300",
          fade ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1"
        )}
      >
        <span className={cn("grid size-5 shrink-0 place-items-center rounded-full", active.bg, active.color)}>
          <Icon className="size-3" />
        </span>
        <span className="font-medium text-ink truncate">
          {active.text}
        </span>
        <span className="ms-auto flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
          <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
          مباشر
        </span>
      </div>
    </div>
  );
}
