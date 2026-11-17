import React, { useState } from "react";
import { Sparkles, RefreshCw, Heart, Check, Volume2, MessageCircle, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCompanion, COMPANIONS, CompanionId } from "@/contexts/CompanionContext";
import { getCompanionQuote } from "@/lib/companion-motivational-bank";
import { PronounceButton } from "@/components/pronounce-button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export { useCompanion, COMPANIONS, type CompanionId, type CompanionConfig } from "@/contexts/CompanionContext";

export function CompanionAvatar({
  size = 48,
  className,
  forceId,
}: {
  size?: number;
  className?: string;
  forceId?: CompanionId;
}) {
  const { companion: activeCompanion } = useCompanion();
  const companion = forceId ? COMPANIONS[forceId] : activeCompanion;
  const [imgError, setImgError] = useState(false);

  return (
    <span
      className={cn("companion-avatar relative inline-grid shrink-0 place-items-center rounded-full select-none", className)}
      style={{ width: size, height: size }}
    >
      <span
        aria-hidden
        className="absolute inset-[-3px] rounded-full opacity-90 transition-all duration-500"
        style={{ background: companion.auraGradient }}
      />
      <span
        aria-hidden
        className="absolute inset-0 rounded-full bg-card shadow-lg transition-all duration-500"
        style={{ boxShadow: `0 14px 30px -16px ${companion.shadowColor}` }}
      />
      <img
        src={imgError ? companion.fallbackAvatarUrl : companion.avatarUrl}
        alt={`${companion.name} — ${companion.role}`}
        onError={() => setImgError(true)}
        className="relative size-[calc(100%-5px)] rounded-full object-cover transition-transform duration-300 hover:scale-105"
        style={{ objectPosition: companion.id === "yassin" ? "50% 22%" : "50% 30%" }}
        loading="lazy"
      />
      <span
        className={cn(
          "absolute -bottom-0.5 -end-0.5 size-3.5 rounded-full border-2 border-white shadow-sm transition-colors",
          companion.id === "khadija" ? "bg-pink-500" : "bg-emerald-500"
        )}
      />
    </span>
  );
}

export function CompanionSays({
  message,
  hint,
  className,
  size = 52,
  showSwitch = true,
}: {
  message?: React.ReactNode;
  hint?: React.ReactNode;
  className?: string;
  size?: number;
  showSwitch?: boolean;
}) {
  const { companion, toggleCompanion, setIsModalOpen } = useCompanion();
  const otherId = companion.id === "yassin" ? "khadija" : "yassin";
  const other = COMPANIONS[otherId];

  return (
    <div className={cn("flex items-start gap-3", className)}>
      <CompanionAvatar size={size} className="animate-float-sm" />
      <div
        className={cn(
          "relative flex-1 rounded-2xl rounded-ss-sm border bg-card px-4 py-3 shadow-[0_18px_40px_-30px_rgba(10,27,51,0.55)] transition-all duration-300",
          companion.borderClass
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <p className={cn("text-[12px] font-bold", companion.accentText)}>
            {companion.name}{" "}
            <span className="font-normal text-ink-soft">· {companion.role}</span>
          </p>

          {showSwitch && (
            <button
              type="button"
              onClick={toggleCompanion}
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium transition hover:scale-105 active:scale-95",
                companion.id === "yassin"
                  ? "border-pink-300 bg-pink-50 text-pink-700 hover:bg-pink-100 dark:bg-pink-950/40 dark:text-pink-300"
                  : "border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300"
              )}
              title={`التبديل إلى ${other.name}`}
            >
              <RefreshCw className="size-3" />
              <span>بدّل لـ {other.name} {other.favoriteEmoji}</span>
            </button>
          )}
        </div>

        <div className="mt-1 text-sm leading-relaxed text-ink">
          {message ?? companion.welcomeMessage}
        </div>
        {hint ? <p className="mt-1.5 text-xs leading-relaxed text-ink-soft">{hint}</p> : null}
      </div>
    </div>
  );
}

export function CompanionHero({
  message,
  hint,
  className,
}: {
  message?: React.ReactNode;
  hint?: React.ReactNode;
  className?: string;
}) {
  const { companion, toggleCompanion, setIsModalOpen } = useCompanion();
  const otherId = companion.id === "yassin" ? "khadija" : "yassin";
  const other = COMPANIONS[otherId];

  return (
    <div className={cn("relative overflow-hidden rounded-3xl border border-line bg-card p-6 text-center", className)}>
      <div
        aria-hidden
        className={cn(
          "absolute inset-0 transition-opacity duration-500",
          companion.id === "khadija"
            ? "bg-[radial-gradient(120%_90%_at_50%_-10%,#ffe4ec_0%,transparent_65%)] dark:bg-[radial-gradient(120%_90%_at_50%_-10%,#5a1b38_0%,transparent_65%)]"
            : "bg-[radial-gradient(120%_90%_at_50%_-10%,#dff1ff_0%,transparent_65%)] dark:bg-[radial-gradient(120%_90%_at_50%_-10%,#1b3563_0%,transparent_65%)]"
        )}
      />
      <div aria-hidden className="absolute inset-0 notebook-grid opacity-40" />

      <div className="relative mx-auto grid size-[190px] place-items-center">
        <span
          aria-hidden
          className={cn(
            "companion-orbit absolute inset-0 rounded-full border transition-colors",
            companion.borderClass
          )}
        />
        <span
          aria-hidden
          className="absolute inset-4 rounded-full blur-xl transition-all"
          style={{ background: companion.accentColor, opacity: 0.15 }}
        />
        <CompanionAvatar size={150} className="companion-bob relative" />
        <span
          className={cn(
            "absolute -bottom-1 start-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-[11px] font-bold text-white shadow-lg rtl:translate-x-1/2 transition-colors",
            companion.accentBg
          )}
        >
          {companion.name} {companion.favoriteEmoji}
        </span>
      </div>

      <div className="relative mt-5">
        <p className="text-base font-bold text-ink">{message ?? companion.tagline}</p>
        {hint ? (
          <p className="mx-auto mt-1.5 max-w-sm text-xs leading-relaxed text-ink-soft">{hint}</p>
        ) : (
          <p className="mx-auto mt-1.5 max-w-sm text-xs leading-relaxed text-ink-soft">{companion.description}</p>
        )}

        <div className="mt-4 flex items-center justify-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={toggleCompanion}
            className="rounded-full text-xs gap-1.5 border-line shadow-sm hover:scale-105"
          >
            <RefreshCw className="size-3.5" />
            <span>اختر {other.name} ({other.badge})</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsModalOpen(true)}
            className="rounded-full text-xs text-ink-soft hover:text-ink"
          >
            تفاصيل الشخصية
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Interactive Companion Switcher Dialog */
export function CompanionSelectionDialog() {
  const { companionId, setCompanionId, isModalOpen, setIsModalOpen } = useCompanion();

  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogContent className="max-w-xl p-6 bg-card text-ink" dir="rtl">
        <DialogHeader>
          <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-2xl bg-iris/10 text-iris">
            <Sparkles className="size-6 text-iris" />
          </div>
          <DialogTitle className="text-center text-xl font-bold">
            اختر مرشدك التعليمي في Link Me ✨
          </DialogTitle>
          <DialogDescription className="text-center text-sm text-ink-soft">
            مين تحب يرافقك ويشجعك في الدروس واختبارات المستوى والمذاكرة؟ تقدر تغيّره في أي وقت!
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Yassin Card */}
          <div
            onClick={() => setCompanionId("yassin")}
            className={cn(
              "group relative flex flex-col items-center rounded-2xl border-2 p-5 text-center cursor-pointer transition-all duration-300 hover:shadow-md",
              companionId === "yassin"
                ? "border-iris bg-iris/5 shadow-md ring-2 ring-iris/20"
                : "border-line bg-paper/50 hover:border-iris/40"
            )}
          >
            {companionId === "yassin" && (
              <span className="absolute top-3 end-3 flex size-6 items-center justify-center rounded-full bg-iris text-white shadow-sm">
                <Check className="size-3.5" />
              </span>
            )}
            <CompanionAvatar size={84} forceId="yassin" />
            <h3 className="mt-3 text-lg font-bold text-ink">ياسين 🚀</h3>
            <span className="rounded-full bg-blue-100 dark:bg-blue-950 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700 dark:text-blue-300">
              المرشد الذكي والنشيط
            </span>
            <p className="mt-2 text-xs leading-relaxed text-ink-soft">
              بطل المغامرة، بيشرح بأسلوب منطقي وسريع، وبيشجعك تتكلم وتكسر حاجز الخوف من غير تعقيد.
            </p>
            <div className="mt-3 flex flex-wrap justify-center gap-1">
              {COMPANIONS.yassin.personalityTraits.map((t, idx) => (
                <span key={idx} className="rounded-md bg-card border border-line px-2 py-0.5 text-[10px] text-ink-soft">
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Khadija Card */}
          <div
            onClick={() => setCompanionId("khadija")}
            className={cn(
              "group relative flex flex-col items-center rounded-2xl border-2 p-5 text-center cursor-pointer transition-all duration-300 hover:shadow-md",
              companionId === "khadija"
                ? "border-pink-500 bg-pink-50/50 dark:bg-pink-950/20 shadow-md ring-2 ring-pink-400/20"
                : "border-line bg-paper/50 hover:border-pink-300/60"
            )}
          >
            {companionId === "khadija" && (
              <span className="absolute top-3 end-3 flex size-6 items-center justify-center rounded-full bg-pink-500 text-white shadow-sm">
                <Check className="size-3.5" />
              </span>
            )}
            <CompanionAvatar size={84} forceId="khadija" />
            <h3 className="mt-3 text-lg font-bold text-ink">خديجة 🌸</h3>
            <span className="rounded-full bg-pink-100 dark:bg-pink-950 px-2.5 py-0.5 text-[11px] font-semibold text-pink-700 dark:text-pink-300">
              المرشدة الكيوت واللطيفة
            </span>
            <p className="mt-2 text-xs leading-relaxed text-ink-soft">
              لطيفة وكيوت خالص، صبورة وبتفهمك خطوة خطوة، ومعاها المذاكرة هتبقى زي السكر ومسلية جداً! ✨
            </p>
            <div className="mt-3 flex flex-wrap justify-center gap-1">
              {COMPANIONS.khadija.personalityTraits.map((t, idx) => (
                <span key={idx} className="rounded-md bg-card border border-line px-2 py-0.5 text-[10px] text-ink-soft">
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <Button onClick={() => setIsModalOpen(false)} className="rounded-full w-full sm:w-auto">
            تأكيد الاختيار والاستمرار
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Floating Interactive Companion Mascot on screen */
export function CompanionFloatingWidget() {
  const { companion, toggleCompanion, setIsModalOpen } = useCompanion();
  const [expanded, setExpanded] = useState(false);
  const [quoteIdx, setQuoteIdx] = useState(0);

  const nextQuote = () => {
    setQuoteIdx((prev) => (prev + 1) % companion.quotes.length);
  };

  const otherId = companion.id === "yassin" ? "khadija" : "yassin";
  const other = COMPANIONS[otherId];

  return (
    <div className="fixed bottom-6 start-6 z-40 flex flex-col items-start gap-2 select-none" dir="rtl">
      {expanded && (
        <div className="w-72 rounded-3xl border border-line bg-card/95 p-4 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-3 duration-300">
          <div className="flex items-center justify-between pb-2 border-b border-line">
            <div className="flex items-center gap-2">
              <CompanionAvatar size={34} />
              <div>
                <p className={cn("text-xs font-bold leading-tight", companion.accentText)}>
                  {companion.name} {companion.favoriteEmoji}
                </p>
                <p className="text-[10px] text-ink-soft">{companion.badge}</p>
              </div>
            </div>
            <button
              onClick={() => setExpanded(false)}
              className="text-xs text-ink-soft hover:text-ink p-1"
            >
              ✕
            </button>
          </div>

          <div className="my-3 rounded-2xl bg-paper/70 p-3 text-xs leading-relaxed text-ink">
            <p className="font-medium">"{companion.quotes[quoteIdx % companion.quotes.length]}"</p>
            <button
              onClick={nextQuote}
              className="mt-2 text-[11px] font-semibold text-iris hover:underline block"
            >
              نصيحة تانية ✨
            </button>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={toggleCompanion}
              className={cn(
                "flex-1 rounded-full py-1.5 px-3 text-xs font-bold transition flex items-center justify-center gap-1 shadow-sm",
                companion.id === "yassin"
                  ? "bg-pink-100 text-pink-700 hover:bg-pink-200 dark:bg-pink-950 dark:text-pink-300"
                  : "bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-950 dark:text-blue-300"
              )}
            >
              <RefreshCw className="size-3" />
              <span>بدّل لـ {other.name} {other.favoriteEmoji}</span>
            </button>
            <button
              onClick={() => {
                setExpanded(false);
                setIsModalOpen(true);
              }}
              className="rounded-full border border-line p-1.5 text-xs text-ink-soft hover:text-ink hover:bg-paper"
              title="تعديل الشخصية"
            >
              ⚙️
            </button>
          </div>
        </div>
      )}

      {/* Floating Avatar Trigger Button */}
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="group relative flex items-center gap-2 rounded-full border border-line bg-card/90 p-1.5 pe-4 shadow-xl backdrop-blur-md transition-all hover:scale-105 active:scale-95"
        title={`اضغط للتحدث مع ${companion.name}`}
      >
        <CompanionAvatar size={44} className="group-hover:rotate-6 transition-transform" />
        <div className="text-start">
          <p className={cn("text-xs font-bold leading-tight", companion.accentText)}>
            {companion.name}
          </p>
          <p className="text-[10px] text-ink-soft">
            {companion.id === "khadija" ? "معاك يا سكر 🌸" : "معاك يا بطل 🚀"}
          </p>
        </div>
        <span className="ms-1 rounded-full bg-iris/10 px-1.5 py-0.5 text-[9px] font-bold text-iris">
          اضغطني ✨
        </span>
      </button>
    </div>
  );
}

export function CompanionMotivationalBanner({ className }: { className?: string }) {
  const { companion, toggleCompanion, setIsModalOpen } = useCompanion();
  const [quoteIdx, setQuoteIdx] = useState(0);
  const [animating, setAnimating] = useState(false);

  const quote = getCompanionQuote(companion.id, "home", quoteIdx);
  const otherId = companion.id === "yassin" ? "khadija" : "yassin";
  const other = COMPANIONS[otherId];

  const handleNext = () => {
    setAnimating(true);
    setTimeout(() => {
      setQuoteIdx((prev) => prev + 1);
      setAnimating(false);
    }, 150);
  };

  const englishMotto =
    companion.id === "khadija"
      ? "You are doing amazing! Every small step leads to big confidence. Keep smiling and shining!"
      : "Believe in yourself and take action! Fluency is built by showing up every single day!";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl border p-6 sm:p-8 transition-all duration-500 shadow-md",
        companion.id === "khadija"
          ? "border-pink-200 bg-gradient-to-r from-pink-50/90 via-rose-50/70 to-purple-50/80 dark:border-pink-950/60 dark:from-pink-950/20 dark:via-purple-950/20 dark:to-background"
          : "border-blue-200 bg-gradient-to-r from-blue-50/90 via-indigo-50/70 to-sky-50/80 dark:border-blue-950/60 dark:from-blue-950/20 dark:via-indigo-950/20 dark:to-background",
        className
      )}
      dir="rtl"
    >
      <div className="flex flex-col md:flex-row items-center gap-6">
        <div className="relative shrink-0 text-center">
          <CompanionAvatar size={96} className="hover:scale-105 transition-transform" />
          <span
            className={cn(
              "mt-2 inline-block rounded-full px-3 py-0.5 text-xs font-bold text-white shadow-sm",
              companion.accentBg
            )}
          >
            {companion.name} {companion.favoriteEmoji}
          </span>
        </div>

        <div className="flex-1 text-center md:text-start">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-2">
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-[11px] font-bold",
                companion.id === "khadija"
                  ? "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300"
                  : "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
              )}
            >
              {companion.id === "khadija" ? "نصيحة خديجة الكيوت 🌸" : "جرعة حماس من ياسين 🚀"}
            </span>
            <span className="text-xs text-ink-soft">· {companion.badge}</span>
          </div>

          <p
            className={cn(
              "text-lg sm:text-xl font-bold leading-relaxed text-ink transition-opacity duration-200",
              animating ? "opacity-0" : "opacity-100"
            )}
          >
            "{quote.text}"
          </p>
          <p className="mt-1.5 text-xs sm:text-sm text-ink-soft">{quote.subtext}</p>

          <div className="mt-4 flex flex-wrap items-center justify-center md:justify-start gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleNext}
              className="rounded-full text-xs gap-1.5 border-line bg-card shadow-sm hover:scale-105"
            >
              <Sparkles className="size-3.5 text-amber-500" />
              <span>{companion.id === "khadija" ? "نصيحة كيوت تانية 🌸" : "جرعة حماس تانية ⚡"}</span>
            </Button>

            <PronounceButton
              text={englishMotto}
              size="sm"
              label={`اسمع نصيحة ${companion.name} بالإنجليزي 🔊`}
              className="bg-card text-ink"
            />

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={toggleCompanion}
              className="rounded-full text-xs gap-1.5 text-ink-soft hover:text-ink hover:bg-paper"
            >
              <RefreshCw className="size-3.5" />
              <span>بدّل لـ {other.name} ({other.badge})</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Backward compatibility exports for existing components
export const YASSIN_NAME = "ياسين";
export const YASSIN_ROLE = "مساعدك في الرحلة";
export const YassinAvatar = CompanionAvatar;
export const YassinSays = CompanionSays;
export const YassinHero = CompanionHero;
