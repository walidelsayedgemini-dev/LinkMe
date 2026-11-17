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
}: {
  name?: string | null;
  src?: string | null;
  size?: number;
  className?: string;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const tone = AVATAR_TONES[(name?.length ?? 0) % AVATAR_TONES.length];
  if (src && src !== failedSrc) {
    return (
      <img
        src={src}
        alt={name ?? ""}
        onError={() => setFailedSrc(src)}
        width={size}
        height={size}
        className={cn("shrink-0 rounded-full object-cover ring-2 ring-card", className)}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      className={cn("grid shrink-0 place-items-center rounded-full font-semibold ring-2 ring-card", tone, className)}
      style={{ width: size, height: size, fontSize: size * (initials(name).length > 1 ? 0.3 : 0.42), lineHeight: 1, transform: "translateY(0.1em)" }}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
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
