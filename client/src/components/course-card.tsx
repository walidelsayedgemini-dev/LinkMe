import { ArrowUpLeft, Clock, Users } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { accentOf, formatCount, formatPrice, levelLabel } from "@/lib/format";
import { Stars, UserAvatar } from "./bits";

export type CourseCardData = {
  id: number;
  slug: string;
  titleAr: string;
  title: string;
  subtitle: string;
  level: string;
  priceCents: number;
  currency?: string;
  durationHours: number;
  studentsCount?: number;
  rating: number;
  ratingCount?: number;
  coverImage?: string | null;
  accent?: string | null;
  categoryNameAr?: string | null;
  instructorName?: string | null;
  instructorAvatar?: string | null;
};

export function CourseCover({
  title,
  coverImage,
  accent,
  className,
}: {
  title: string;
  coverImage?: string | null;
  accent?: string | null;
  className?: string;
}) {
  const tone = accentOf(accent);
  if (coverImage) {
    return (
      <div className={cn("relative overflow-hidden bg-paper-deep", className)}>
        <img
          src={coverImage}
          alt={title}
          onError={(e) => {
            e.currentTarget.src = "/img/hero.webp";
          }}
          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.05]"
          loading="lazy"
          decoding="async"
        />
      </div>
    );
  }
  const word = title.split(" ").slice(0, 2).join(" ");
  return (
    <div className={cn("relative overflow-hidden", className)} style={{ background: tone.solid }}>
      <div className="absolute inset-0 opacity-[0.14] dot-grid" />
      <span
        className={cn(
          "absolute -bottom-4 right-3 text-[3.2rem] font-bold leading-none tracking-tight",
          accent === "navy" ? "text-white/25" : "text-white/30",
        )}
        style={{ fontFamily: "var(--font-mono)" }}
      >
        {word}
      </span>
      <span className="absolute left-4 top-4 size-10 rounded-full border-2 border-ink/25" />
    </div>
  );
}

export function CourseCard({ course, className }: { course: CourseCardData; className?: string }) {
  return (
    <Link href={`/courses/${course.slug}`} className={cn("card-soft group flex flex-col overflow-hidden [content-visibility:auto]", className)}>
      <div className="relative">
        <CourseCover title={course.title} coverImage={course.coverImage} accent={course.accent} className="h-44 w-full" />
        <span className="absolute right-3 top-3 rounded-full bg-paper/95 px-2.5 py-1 text-[11px] font-semibold text-ink shadow-xs">
          {course.categoryNameAr}
        </span>
        <span className="absolute left-3 top-3 rounded-full bg-iris-deep px-2.5 py-1 text-[11px] font-medium text-white">
          {levelLabel(course.level)}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-center gap-2 text-xs text-ink-soft">
          <span className="latin">{course.title}</span>
        </div>
        <h3 className="text-lg font-semibold leading-snug text-ink transition-colors group-hover:text-iris">
          {course.titleAr}
        </h3>
        <p className="line-clamp-2 text-sm leading-relaxed text-ink-soft">{course.subtitle}</p>

        <div className="mt-1 flex items-center gap-2 text-xs text-ink-soft">
          <UserAvatar name={course.instructorName} src={course.instructorAvatar} size={24} />
          <span>{course.instructorName}</span>
        </div>

        <div className="mt-auto flex items-end justify-between border-t border-line pt-3">
          <div className="flex flex-col gap-1">
            <span className="flex items-center gap-1.5 text-xs text-ink-soft">
              <Stars value={course.rating} />
              <span className="latin font-medium text-ink">{course.rating ? course.rating.toFixed(1) : "جديد"}</span>
            </span>
            <span className="flex items-center gap-3 text-[11px] text-ink-soft">
              <span className="flex items-center gap-1">
                <Clock className="size-3" /> {course.durationHours} س
              </span>
              <span className="flex items-center gap-1">
                <Users className="size-3" /> {formatCount(course.studentsCount ?? 0)}
              </span>
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-base font-bold text-ink">{formatPrice(course.priceCents, course.currency)}</span>
            <ArrowUpLeft className="size-4 text-ink-soft transition-transform group-hover:-translate-y-0.5 group-hover:-translate-x-0.5" />
          </div>
        </div>
      </div>
    </Link>
  );
}
