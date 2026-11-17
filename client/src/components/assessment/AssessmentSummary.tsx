import { ArrowLeft, BookOpen, Check, RefreshCw, Target } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { CompanionSays, useCompanion } from "@/components/companion";
import { getCompanionQuote } from "@/lib/companion-motivational-bank";
import { formatPrice } from "@/lib/format";
import type { AssessmentSummary as Summary } from "@shared/assessment";
import {
  LEVEL_DESCRIPTIONS,
  LEVEL_NAMES,
  SKILL_NAMES,
  percent,
} from "./shared";

type AssessmentSummaryProps = {
  summary: Summary;
  mode: "placement" | "practice";
  loggedIn: boolean;
  onRestart: () => void;
};

export function AssessmentSummary({
  summary,
  mode,
  loggedIn,
  onRestart,
}: AssessmentSummaryProps) {
  const { companion } = useCompanion();
  const quote = getCompanionQuote(companion.id, "levelTestResult");
  const skills = (
    Object.keys(summary.skills) as (keyof typeof summary.skills)[]
  ).map(skill => ({
    skill,
    value: summary.skills[skill],
    percentage: percent(
      summary.skills[skill].correct,
      summary.skills[skill].total
    ),
  }));
  const strongest = [...skills].sort((a, b) => b.percentage - a.percentage)[0];

  return (
    <div className="assessment-summary-wrap">
      <CompanionSays
        size={64}
        message={quote.text}
        hint={
          strongest
            ? `${quote.subtext} واضح إن عندك أساس كويس جداً في ${SKILL_NAMES[strongest.skill]}!`
            : quote.subtext
        }
      />

      <section className="assessment-summary-hero">
        <div className="assessment-summary-copy">
          <p className="assessment-eyebrow">
            {mode === "practice" ? "ملخص التدريب" : "تقدير مبدئي"}
          </p>
          <h1 className="mt-2 text-3xl text-white sm:text-4xl">
            {summary.belowA1 ? (
              "قبل A1 — نبدأ من الأساس"
            ) : (
              <>
                نقطة بدايتك الأقرب:{" "}
                <span className="latin">{summary.level}</span>
              </>
            )}
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/70">
            {summary.belowA1
              ? "ده معناه إن كورس البداية والتمرين على الأساسيات هيكونوا مفيدين ليك دلوقتي."
              : (LEVEL_DESCRIPTIONS[summary.level] ??
                "تقدير مبني على إجاباتك في الجلسة دي.")}
          </p>
          <p className="mt-5 text-sm text-white/75">
            النتيجة:{" "}
            <strong className="latin text-white">
              {summary.score}/{summary.total} · {summary.percent}%
            </strong>
          </p>
        </div>
        <div className="assessment-summary-badge">
          <Target className="size-5" />
          <span className="latin">
            {summary.belowA1 ? "< A1" : summary.level}
          </span>
          <small>تقديري</small>
        </div>
      </section>

      <div className="assessment-summary-grid">
        <section className="assessment-panel p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <BookOpen className="size-4 text-iris" />
            <h2 className="text-lg text-ink">مهاراتك في الجلسة</h2>
          </div>
          <div className="mt-5 space-y-4">
            {skills.map(item => (
              <div key={item.skill}>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-ink">{SKILL_NAMES[item.skill]}</span>
                  <span className="latin text-xs text-ink-soft">
                    {item.value.correct}/{item.value.total}
                  </span>
                </div>
                <div className="assessment-skill-track">
                  <span style={{ width: `${item.percentage}%` }} />
                </div>
              </div>
            ))}
          </div>
          {!loggedIn && mode === "placement" ? (
            <p className="assessment-save-note">
              لو أنشأت حساب، نقدر نحفظ نتيجة قياس المستوى في ملفك ونستخدمها
              لتخصيص البداية.
            </p>
          ) : summary.saved ? (
            <p className="assessment-save-note">
              <Check className="size-4" /> اتّحفظت نتيجة قياس المستوى في حسابك.
            </p>
          ) : null}
        </section>

        <section className="assessment-panel assessment-recommendations-panel p-5 sm:p-6">
          <p className="assessment-eyebrow">اقتراحات البداية</p>
          <h2 className="mt-2 text-xl text-ink">خطوات مناسبة للمرحلة دي</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            اختار كورسًا وابدأ من صفحة التفاصيل. الترشيحات مساعدة، ومش بديل عن
            قرارك.
          </p>
          <div className="mt-4 space-y-2">
            {summary.recommendations.length ? (
              summary.recommendations.map(course => (
                <Link
                  key={course.id}
                  href={`/courses/${course.slug}`}
                  className="assessment-course-link group"
                >
                  <span className="assessment-course-thumb">
                    {course.coverImage ? (
                      <img src={course.coverImage} alt="" loading="lazy" />
                    ) : (
                      <BookOpen className="size-4" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <strong className="line-clamp-1 text-sm text-ink">
                      {course.titleAr}
                    </strong>
                    <small className="line-clamp-1 text-xs text-ink-soft">
                      {course.title} · {course.level}
                    </small>
                  </span>
                  <ArrowLeft className="size-4 text-iris transition-transform group-hover:-translate-x-1" />
                </Link>
              ))
            ) : (
              <p className="rounded-xl bg-paper-deep p-4 text-sm text-ink-soft">
                مفيش ترشيحات متاحة دلوقتي، لكن تقدر تتصفح كل الكورسات.
              </p>
            )}
          </div>
          <Link
            href="/courses"
            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-iris"
          >
            شوف كل الكورسات <ArrowLeft className="size-4" />
          </Link>
        </section>
      </div>

      <div className="assessment-summary-actions">
        <Button
          type="button"
          variant="outline"
          className="rounded-xl"
          onClick={onRestart}
        >
          <RefreshCw className="size-4" />{" "}
          {mode === "practice" ? "تدريب مرحلة تانية" : "إعادة قياس المستوى"}
        </Button>
        <p className="assessment-disclaimer">
          النتيجة تقديرية مبنية على النص فقط، ولا تمثل اعتماد CEFR أو اختبار
          تحدث واستماع.
        </p>
      </div>
    </div>
  );
}
