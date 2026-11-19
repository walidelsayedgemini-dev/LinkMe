import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { initials } from "@/lib/format";

export function Stars({ value, size = 14, className }: { value: number; size?: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} aria-label={`${value} من 5`}>
      {[1, 2, 3, 4, 5].map(star => {
        const filled = value >= star - 0.25;
        const half = !filled && value >= star - 0.75;
        return (
          <Star
            key={star}
            width={size}
            height={size}
            className={cn(filled || half ? "fill-acid-deep text-acid-deep" : "fill-transparent text-ink/25")}
            strokeWidth={1.8}
          />
        );
      })}
    </span>
  );
}

const AVATAR_TONES = [
  "bg-acid text-ink",
  "bg-iris-soft text-iris",
  "bg-coral-soft text-coral",
  "bg-navy text-acid",
];

export function UserAvatar({
  name,
  src,
  size = 40,
  className,
  xpProgress,
}: {
  name?: string | null;
  src?: string | null;
  size?: number;
  className?: string;
  xpProgress?: number; // 0 to 1
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const tone = AVATAR_TONES[(name?.length ?? 0) % AVATAR_TONES.length];

  const content = src && src !== failedSrc ? (
    <img
      src={src}
      alt={name ?? ""}
      onError={() => setFailedSrc(src)}
      width={size}
      height={size}
      className={cn("shrink-0 rounded-full object-cover", className)}
      style={{ width: size, height: size }}
    />
  ) : (
    <span
      className={cn("grid shrink-0 place-items-center rounded-full font-semibold", tone, className)}
      style={{
        width: size,
        height: size,
        fontSize: size * (initials(name).length > 1 ? 0.3 : 0.42),
        lineHeight: 1,
        transform: "translateY(0.1em)",
      }}
      aria-hidden
    >
      {initials(name)}
    </span>
  );

  if (typeof xpProgress === "number") {
    const strokeWidth = 2.5;
    const radius = size / 2 + 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - Math.min(1, Math.max(0, xpProgress)) * circumference;
    const svgSize = size + 8;

    return (
      <div className="relative inline-flex items-center justify-center shrink-0" style={{ width: svgSize, height: svgSize }}>
        <svg
          className="absolute inset-0 -rotate-90 pointer-events-none"
          width={svgSize}
          height={svgSize}
          viewBox={`0 0 ${svgSize} ${svgSize}`}
        >
          {/* Background Ring */}
          <circle
            cx={svgSize / 2}
            cy={svgSize / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-line/60"
          />
          {/* Progress Ring */}
          <circle
            cx={svgSize / 2}
            cy={svgSize / 2}
            r={radius}
            fill="none"
            stroke="url(#xp-grad)"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-500 ease-out"
          />
          <defs>
            <linearGradient id="xp-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4f46e5" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>
          </defs>
        </svg>
        {content}
      </div>
    );
  }

  return content;
}

export function ProgressBar({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-ink/10", className)}>
      <div
        className="h-full rounded-full bg-iris transition-[width] duration-500"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-ink/15 bg-card/70 px-3 py-1 text-xs font-medium text-ink-soft",
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-acid-deep" />
      {children}
    </span>
  );
}

/** Paints the last word of a plain-text heading in the brand colour. */
function highlightTail(title: React.ReactNode): React.ReactNode {
  if (typeof title !== "string") return title;
  const trimmed = title.trim();
  const cut = trimmed.lastIndexOf(" ");
  if (cut === -1) return <span className="hl-word">{trimmed}</span>;
  return (
    <>
      {trimmed.slice(0, cut + 1)}
      <span className="hl-word">{trimmed.slice(cut + 1)}</span>
    </>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "start",
  action,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: string;
  align?: "start" | "center";
  action?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 md:flex-row md:items-end md:justify-between",
        align === "center" && "md:flex-col md:items-center md:text-center",
      )}
    >
      <div className={cn("max-w-2xl", align === "center" && "mx-auto")}>
        {eyebrow && <Eyebrow className="mb-4">{eyebrow}</Eyebrow>}
        <h2 className="text-3xl leading-[1.2] text-ink sm:text-4xl md:text-[2.6rem]">{highlightTail(title)}</h2>
        {description && <p className="mt-3 text-base leading-relaxed text-ink-soft">{description}</p>}
      </div>
      {action}
    </div>
  );
}
