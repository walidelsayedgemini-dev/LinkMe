import { useId } from "react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

/**
 * Link Me mark: a rounded blue tile holding an open book whose pages lift
 * upwards like a path of progress, with a bookmark ribbon marking the place.
 * Reads clearly at 20px, works on light and dark surfaces.
 */
export function LogoMark({
  className,
  tone = "solid",
  animated = true,
}: {
  className?: string;
  tone?: "solid" | "ghost" | "light";
  animated?: boolean;
}) {
  const gradientId = `lm-grad-${useId().replace(/:/g, "")}`;
  const page = tone === "solid" ? "#ffffff" : "currentColor";
  const pageSoft = tone === "solid" ? "rgba(255,255,255,0.78)" : "currentColor";
  const ribbon =
    tone === "solid"
      ? "#2f63ff"
      : tone === "light"
        ? "#0f2a5c"
        : "var(--color-iris)";
  return (
    <svg
      viewBox="0 0 40 40"
      className={cn("logo-mark shrink-0", className)}
      role="img"
      aria-label="Link Me"
      data-animated={animated ? "true" : "false"}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#4d80ff" />
          <stop offset="55%" stopColor="#2f63ff" />
          <stop offset="100%" stopColor="#1a3fc4" />
        </linearGradient>
      </defs>
      {tone !== "ghost" && (
        <rect
          width="40"
          height="40"
          rx="11.5"
          fill={
            tone === "solid" ? `url(#${gradientId})` : "rgba(255,255,255,0.12)"
          }
        />
      )}
      {tone === "solid" && (
        <rect width="40" height="20" rx="11.5" fill="rgba(255,255,255,0.10)" />
      )}
      <g className={animated ? "lm-pages" : undefined}>
        <path
          d="M8.2 15.1c3.6-1.5 7.9-1.3 11.3.9v13.6c-3.4-2.2-7.7-2.4-11.3-.9z"
          fill={page}
        />
        <path
          d="M31.8 15.1c-3.6-1.5-7.9-1.3-11.3.9v13.6c3.4-2.2 7.7-2.4 11.3-.9z"
          fill={pageSoft}
        />
        <path
          d="M20.3 16.6v13"
          stroke={ribbon}
          strokeWidth="1.4"
          strokeLinecap="round"
          opacity="0.55"
        />
        <path
          d="M25.4 14.2h4.6v8.4l-2.3-1.6-2.3 1.6z"
          fill={ribbon}
          className={animated ? "lm-ribbon" : undefined}
        />
      </g>
    </svg>
  );
}

export function LogoWord({
  className,
  invert = false,
}: {
  className?: string;
  invert?: boolean;
}) {
  return (
    <span
      className={cn(
        "latin inline-flex items-baseline font-bold leading-none tracking-[-0.045em]",
        className
      )}
    >
      <span className={invert ? "text-white" : "text-ink"}>link</span>
      <span className={invert ? "text-[#a8c4ff]" : "text-iris"}>me</span>
      <span className={invert ? "text-[#a8c4ff]" : "text-iris"}>.</span>
    </span>
  );
}

export function Logo({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <Link
      href="/"
      className={cn("group inline-flex items-center gap-2", className)}
      aria-label="Link Me — الصفحة الرئيسية"
    >
      <LogoMark className="size-9 transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-105" />
      {!compact && <LogoWord className="text-[22px]" />}
    </Link>
  );
}
