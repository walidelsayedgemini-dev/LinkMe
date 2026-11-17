import { Backpack, BookOpen, Eraser, Globe2, GraduationCap, NotebookPen, Paperclip, Pencil, Ruler, Scissors } from "lucide-react";
import { cn } from "@/lib/utils";

const ICONS = {
  pencil: Pencil,
  book: BookOpen,
  cap: GraduationCap,
  ruler: Ruler,
  scissors: Scissors,
  clip: Paperclip,
  globe: Globe2,
  notes: NotebookPen,
  bag: Backpack,
  eraser: Eraser,
};

type Doodle = {
  icon: keyof typeof ICONS;
  className: string;
  size: number;
  delay?: number;
  motion?: "float" | "drift" | "sway";
  opacity?: number;
};

const SETS: Record<"hero" | "panel" | "section" | "soft", Doodle[]> = {
  hero: [
    { icon: "pencil", className: "end-[3%] top-[6%] rotate-12", size: 46, delay: 0 },
    { icon: "cap", className: "start-[1%] bottom-[26%] -rotate-12", size: 52, delay: 1.1, motion: "drift" },
    { icon: "book", className: "end-[6%] bottom-[8%] rotate-6", size: 44, delay: 0.6 },
    { icon: "clip", className: "start-[12%] top-[8%] -rotate-6", size: 30, delay: 1.6, motion: "drift" },
    { icon: "globe", className: "end-[26%] top-[2%] rotate-0", size: 26, delay: 2.1 },
  ],
  panel: [
    { icon: "pencil", className: "end-[8%] top-[12%] rotate-[18deg]", size: 54, delay: 0, opacity: 0.5 },
    { icon: "book", className: "start-[10%] top-[30%] -rotate-12", size: 60, delay: 1.2, motion: "drift", opacity: 0.45 },
    { icon: "cap", className: "end-[14%] bottom-[24%] rotate-6", size: 64, delay: 0.5, opacity: 0.5 },
    { icon: "ruler", className: "start-[6%] bottom-[14%] rotate-[24deg]", size: 58, delay: 1.8, motion: "drift", opacity: 0.4 },
    { icon: "globe", className: "start-[42%] top-[6%] rotate-0", size: 40, delay: 2.2, opacity: 0.35 },
  ],
  section: [
    { icon: "notes", className: "end-[3%] top-[8%] rotate-6", size: 40, delay: 0.3 },
    { icon: "scissors", className: "start-[2%] bottom-[10%] -rotate-12", size: 38, delay: 1.4, motion: "drift" },
    { icon: "eraser", className: "end-[8%] bottom-[6%] rotate-12", size: 34, delay: 0.8 },
  ],
  soft: [
    { icon: "pencil", className: "end-[6%] top-[12%] rotate-12", size: 34, delay: 0 },
    { icon: "book", className: "start-[4%] bottom-[14%] -rotate-6", size: 34, delay: 1.3 },
  ],
};

/**
 * Scattered, slowly drifting school supplies used as a background texture.
 * Purely decorative: hidden from assistive tech and never interactive.
 */
export function StudyDoodles({
  variant = "section",
  className,
}: {
  variant?: keyof typeof SETS;
  className?: string;
}) {
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      {SETS[variant].map((doodle, index) => {
        const Icon = ICONS[doodle.icon];
        return (
          <span
            key={`${doodle.icon}-${index}`}
            className={cn("study-doodle", doodle.className, doodle.motion === "drift" ? "animate-drift" : "animate-float-sm")}
            style={{ animationDelay: `${doodle.delay ?? 0}s`, opacity: doodle.opacity ?? 0.14 }}
          >
            <Icon size={doodle.size} strokeWidth={1.5} />
          </span>
        );
      })}
    </div>
  );
}

/** Soft, slowly morphing colour field used behind hero and auth panels. */
export function AnimatedAurora({ className, dark = false }: { className?: string; dark?: boolean }) {
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      <div
        className={cn(
          "aurora absolute -start-24 -top-32 size-[26rem] rounded-full blur-3xl",
          dark ? "bg-iris/35" : "bg-iris/20",
        )}
      />
      <div
        className={cn(
          "aurora absolute -end-20 top-1/3 size-80 rounded-full blur-3xl [animation-delay:-6s]",
          dark ? "bg-[#7aa2ff]/25" : "bg-[#9fc0ff]/30",
        )}
      />
      <div
        className={cn(
          "animate-blob absolute bottom-0 start-1/3 size-72 rounded-full blur-3xl",
          dark ? "bg-[#5b8cff]/20" : "bg-acid/25",
        )}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  True 3D alphabet (SVG extrusion)                                   */
/* ------------------------------------------------------------------ */

const FONT_STACK = '"Space Grotesk", "IBM Plex Sans Arabic", system-ui, sans-serif';

function Letter3D({
  char,
  front,
  side,
  depth = 14,
  className,
  delay = 0,
  tilt = 0,
}: {
  char: string;
  front: [string, string];
  side: string;
  depth?: number;
  className?: string;
  delay?: number;
  tilt?: number;
}) {
  const id = `l3d-${char}-${front[1].replace(/[^a-z0-9]/gi, "")}`;
  const layers = Array.from({ length: depth }, (_, index) => depth - index);
  return (
    <span className={cn("animate-float block", className)} style={{ animationDelay: `${delay}s` }}>
      <span
        className="abc3d block"
        style={{ animationDelay: `${delay}s`, ["--tilt" as string]: `${tilt}deg` }}
      >
        <svg viewBox="0 0 150 170" className="h-full w-full overflow-visible">
          <defs>
            <linearGradient id={`${id}-front`} x1="0" y1="0" x2="0.3" y2="1">
              <stop offset="0%" stopColor={front[0]} />
              <stop offset="100%" stopColor={front[1]} />
            </linearGradient>
            <linearGradient id={`${id}-gloss`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(255,255,255,0.85)" />
              <stop offset="55%" stopColor="rgba(255,255,255,0)" />
            </linearGradient>
          </defs>
          {layers.map(layer => (
            <text
              key={layer}
              x="72"
              y={128 + layer * 1.7}
              textAnchor="middle"
              fontFamily={FONT_STACK}
              fontWeight="700"
              fontSize="150"
              letterSpacing="-6"
              fill={side}
            >
              {char}
            </text>
          ))}
          <text
            x="72"
            y="128"
            textAnchor="middle"
            fontFamily={FONT_STACK}
            fontWeight="700"
            fontSize="150"
            letterSpacing="-6"
            fill={`url(#${id}-front)`}
          >
            {char}
          </text>
          <text
            x="72"
            y="128"
            textAnchor="middle"
            fontFamily={FONT_STACK}
            fontWeight="700"
            fontSize="150"
            letterSpacing="-6"
            fill={`url(#${id}-gloss)`}
            opacity="0.16"
          >
            {char}
          </text>
        </svg>
      </span>
    </span>
  );
}

/**
 * Three chunky 3D letters (A B C) plus a speech bubble. Built from real SVG
 * extrusion layers so the depth stays crisp at any size and in both themes.
 */
export function AbcStack({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("relative select-none", className)}>
      <div dir="ltr" className="flex items-end justify-center gap-[3%]">
        <Letter3D
          char="A"
          front={["#8fb0ff", "#2f63ff"]}
          side="#1c40b8"
          tilt={-6}
          delay={0}
          className="h-[clamp(7rem,22vw,13rem)] w-[clamp(5.5rem,17vw,10.5rem)]"
        />
        <Letter3D
          char="B"
          front={["#ffffff", "#dfe7ff"]}
          side="#9aabd8"
          tilt={3}
          delay={0.6}
          className="h-[clamp(7.6rem,24vw,14rem)] w-[clamp(5.8rem,18vw,11rem)] translate-y-2"
        />
        <Letter3D
          char="C"
          front={["#8fb0ff", "#2f63ff"]}
          side="#1c40b8"
          tilt={7}
          delay={1.2}
          className="h-[clamp(7rem,22vw,13rem)] w-[clamp(5.5rem,17vw,10.5rem)]"
        />
      </div>
    </div>
  );
}

/** Cluster of 3D-ish supply tiles, used as a decorative corner piece. */
export function SuppliesCluster({ className }: { className?: string }) {
  const items: { icon: keyof typeof ICONS; rotate: string; delay: number }[] = [
    { icon: "pencil", rotate: "-rotate-12", delay: 0 },
    { icon: "book", rotate: "rotate-6", delay: 0.5 },
    { icon: "cap", rotate: "-rotate-3", delay: 1 },
  ];
  return (
    <div aria-hidden className={cn("flex items-end gap-2", className)}>
      {items.map(({ icon, rotate, delay }) => {
        const Icon = ICONS[icon];
        return (
          <span
            key={icon}
            className={cn(
              "animate-float-sm grid place-items-center rounded-2xl border border-white/25 bg-white/10 text-white/80 backdrop-blur",
              rotate,
              icon === "cap" ? "size-12" : "size-10",
            )}
            style={{ animationDelay: `${delay}s` }}
          >
            <Icon size={icon === "cap" ? 22 : 18} strokeWidth={1.6} />
          </span>
        );
      })}
    </div>
  );
}

/**
 * Playful school props tucked into the page corners — backpack, English books
 * and a ruler — to keep the study mood light and cheerful.
 */
export function CornerProps({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("pointer-events-none fixed inset-0 z-0 select-none", className)}>
      {/* English book stack — bottom start corner */}
      <div className="corner-books animate-float-sm absolute -bottom-2 -start-3 origin-bottom rotate-[-8deg] opacity-90 scale-[0.62] sm:scale-75 lg:scale-100">
        <div className="relative">
          <div className="h-4 w-40 rounded-md bg-[#1a3fc4] shadow-lg" />
          <div className="absolute -top-4 start-3 h-4 w-36 rounded-md bg-[#4d80ff] shadow-lg" />
          <div className="absolute -top-8 start-1 h-4 w-40 rounded-md bg-[#ffd166] shadow-lg" />
          <div className="absolute -top-12 start-6 h-4 w-32 rounded-md bg-card ring-1 ring-line shadow-lg" />
          <span className="latin absolute -top-12 start-8 text-[9px] font-bold leading-[16px] text-iris">English</span>
        </div>
      </div>

      {/* Ruler — top start corner, just under the navbar */}
      <div className="corner-ruler animate-sway absolute start-2 top-[84px] rotate-[24deg] opacity-80 scale-[0.7] lg:top-24 lg:start-3 lg:scale-100">
        <div className="flex h-6 w-28 items-end gap-1 rounded-md bg-[#ffd166] px-1.5 pb-1 shadow-md ring-1 ring-[#e7b53a]/40">
          {Array.from({ length: 9 }).map((_, index) => (
            <span key={index} className="w-px flex-1 bg-[#a67c00]/50" style={{ height: index % 2 ? 5 : 9 }} />
          ))}
        </div>
      </div>

      {/* Backpack — bottom end corner, lifted above the WhatsApp button */}
      <div className="animate-drift absolute -end-2 bottom-44 rotate-[10deg] scale-[0.75] sm:scale-90 lg:scale-100">
        <div className="grid size-20 place-items-center rounded-[1.6rem] bg-gradient-to-br from-[#4d80ff] to-[#1a3fc4] shadow-[0_18px_40px_-18px_rgba(26,63,196,0.9)]">
          <Backpack className="size-10 text-white" strokeWidth={1.7} />
        </div>
      </div>

      {/* Pencil — top end corner */}
      <div className="animate-float-sm absolute end-2 top-[92px] -rotate-[18deg] opacity-80 scale-[0.8] lg:top-28 lg:end-4 lg:scale-100">
        <div className="grid size-12 place-items-center rounded-2xl bg-card shadow-md ring-1 ring-line">
          <Pencil className="size-6 text-iris" strokeWidth={1.8} />
        </div>
      </div>
    </div>
  );
}
