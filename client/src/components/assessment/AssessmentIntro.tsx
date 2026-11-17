import { useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  Check,
  ChevronLeft,
  LockKeyhole,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CompanionSays, useCompanion } from "@/components/companion";
import { getCompanionQuote } from "@/lib/companion-motivational-bank";
import { cn } from "@/lib/utils";
import type { AssessmentLevel } from "@shared/assessment";
import { LEVEL_NAMES, LEVELS, formatNumber, levelIndex } from "./shared";

export type AssessmentCatalog = {
  total: number;
  stageSize: number;
  passPercent: number;
  levels: { level: AssessmentLevel; name: string; questionCount: number }[];
};

type LatestPlacement =
  | {
      level: string;
      score: number;
      total: number;
      createdAt?: Date | string;
      belowA1?: boolean;
    }
  | null
  | undefined;

type AssessmentIntroProps = {
  catalog: AssessmentCatalog;
  latest: LatestPlacement;
  loggedIn: boolean;
  hasResume: boolean;
  resumeLoading?: boolean;
  onResume: () => void;
  onStartPlacement: () => void;
  onStartPractice: (level: AssessmentLevel) => void;
  onForgetResume: () => void;
};

export function AssessmentIntro({
  catalog,
  latest,
  loggedIn,
  hasResume,
  resumeLoading,
  onResume,
  onStartPlacement,
  onStartPractice,
  onForgetResume,
}: AssessmentIntroProps) {
  const { companion } = useCompanion();
  const quote = getCompanionQuote(companion.id, "levelTestStart");
  const [mode, setMode] = useState<"placement" | "practice">("placement");
  const [practiceLevel, setPracticeLevel] = useState<AssessmentLevel>("A1");
  const currentLevelIndex =
    latest &&
    !latest.belowA1 &&
    LEVELS.includes(latest.level as AssessmentLevel)
      ? levelIndex(latest.level as AssessmentLevel)
      : -1;

  return (
    <div className="assessment-intro-grid">
      <section className="assessment-panel assessment-intro-main">
        <div className="assessment-kicker">
          <BookOpen className="size-4" /> اختبار تفاعلي على مراحل
        </div>
        <h2 className="assessment-title">
          نحدد نقطة بدايتك، مش بنحط عليك ضغط.
        </h2>
        <p className="assessment-lede">
          بنك الأسئلة فيه{" "}
          <strong className="latin">{formatNumber(catalog.total)}</strong> سؤال
          للتنوع والتدريب، لكن كل مرحلة قصيرة فيها {catalog.stageSize} سؤال بس.
          القياس نصّي وتقديري، ومش بديل لاختبار CEFR رسمي أو قياس التحدث
          والاستماع.
        </p>

        <CompanionSays
          className="mt-6"
          message={quote.text}
          hint={quote.subtext}
        />

        <div
          className="assessment-mode-switch"
          role="tablist"
          aria-label="نوع الجلسة"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === "placement"}
            className={cn(
              "assessment-mode-tab",
              mode === "placement" && "is-active"
            )}
            onClick={() => setMode("placement")}
          >
            <span className="assessment-mode-icon">
              <Sparkles className="size-4" />
            </span>
            <span>
              <strong>قياس المستوى</strong>
              <small>يبدأ من A1 ويتدرج حسب أدائك</small>
            </span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "practice"}
            className={cn(
              "assessment-mode-tab",
              mode === "practice" && "is-active"
            )}
            onClick={() => setMode("practice")}
          >
            <span className="assessment-mode-icon">
              <BookOpen className="size-4" />
            </span>
            <span>
              <strong>تدريب على مرحلة</strong>
              <small>اختار أي مستوى للتمرين فقط</small>
            </span>
          </button>
        </div>

        {mode === "practice" ? (
          <div
            className="assessment-practice-picker"
            aria-label="اختار مرحلة التدريب"
          >
            <div>
              <p className="text-sm font-semibold text-ink">
                اختار نقطة التدريب
              </p>
              <p className="mt-1 text-xs text-ink-soft">
                التدريب لا يحفظ نتيجة رسمية ولا يغيّر قياس المستوى.
              </p>
            </div>
            <div className="assessment-level-picker">
              {LEVELS.map(level => (
                <button
                  type="button"
                  key={level}
                  className={cn(
                    "assessment-level-choice",
                    practiceLevel === level && "is-selected"
                  )}
                  aria-pressed={practiceLevel === level}
                  onClick={() => setPracticeLevel(level)}
                >
                  <span className="latin">{level}</span>
                  <small>{LEVEL_NAMES[level]}</small>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="assessment-action-row">
          <Button
            className="h-12 rounded-2xl bg-iris px-6 text-base text-white hover:bg-iris-deep"
            onClick={() =>
              mode === "placement"
                ? onStartPlacement()
                : onStartPractice(practiceLevel)
            }
          >
            {mode === "placement"
              ? "ابدأ قياس المستوى"
              : `ابدأ تدريب ${practiceLevel}`}
            <ArrowLeft className="size-4" />
          </Button>
          <span className="assessment-action-note">
            <span className="latin">{catalog.stageSize}</span> سؤال في كل مرحلة
            · بدون مؤقت
          </span>
        </div>

        {hasResume ? (
          <div className="assessment-resume-callout">
            <div>
              <p className="font-semibold text-ink">عندك جلسة متوقفة</p>
              <p className="mt-1 text-xs text-ink-soft">
                نقدر نرجعها من السيرفر ونكمّل من آخر إجابة محفوظة.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                onClick={onResume}
                disabled={resumeLoading}
                className="rounded-full bg-navy text-white hover:bg-navy/90"
              >
                {resumeLoading ? "بنرجّع الجلسة…" : "كمّل الجلسة"}{" "}
                <ChevronLeft className="size-4" />
              </Button>
              <button
                type="button"
                className="text-xs font-semibold text-ink-soft underline-offset-4 hover:underline"
                onClick={onForgetResume}
              >
                ابدأ من جديد
              </button>
            </div>
          </div>
        ) : null}
      </section>

      <aside className="assessment-intro-side">
        <div className="assessment-panel assessment-stage-panel">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="assessment-eyebrow">خريطة المراحل</p>
              <h3 className="mt-1 text-xl text-ink">من A1 لحد C2</h3>
            </div>
            <span className="assessment-bank-pill">
              <span className="latin">{formatNumber(catalog.total)}</span> سؤال
            </span>
          </div>
          <div className="assessment-stage-list">
            {LEVELS.map((level, index) => {
              const item = catalog.levels.find(entry => entry.level === level);
              const reached = currentLevelIndex >= index;
              return (
                <div
                  key={level}
                  className={cn(
                    "assessment-stage-row",
                    reached && "is-reached"
                  )}
                >
                  <div className="assessment-stage-number">
                    <span className="latin">{level}</span>
                    {reached ? <Check className="size-3.5" /> : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-ink">
                      {item?.name || LEVEL_NAMES[level]}
                    </p>
                    <p className="text-xs text-ink-soft">
                      {item?.questionCount ?? catalog.stageSize} سؤال متاح
                      للجلسة
                    </p>
                  </div>
                  {index > 0 ? (
                    <LockKeyhole
                      className="size-4 text-ink-soft/60"
                      aria-hidden
                    />
                  ) : (
                    <span className="assessment-stage-start">ابدأ هنا</span>
                  )}
                </div>
              );
            })}
          </div>
          <div className="assessment-rule-note">
            <span className="latin">{catalog.passPercent}%</span> أو أكثر ينقلك
            للمرحلة التالية في القياس.
          </div>
        </div>

        <div className="assessment-panel assessment-latest-panel">
          <p className="assessment-eyebrow">قبل ما تبدأ</p>
          <ul className="assessment-check-list">
            <li>
              <Check className="size-4" /> كل الأسئلة والإجابات بتوصلنا من جلسة
              سرية محفوظة.
            </li>
            <li>
              <Check className="size-4" /> تقدر توقف في أي وقت وترجع من نفس
              الجهاز والمتصفح؛ النتيجة النهائية بتتحفظ في حسابك لو بدأت وأنت
              مسجل.
            </li>
            <li>
              <Check className="size-4" /> النتيجة تقديرية، وهنقترح عليك خطوات
              مناسبة مش حكم نهائي.
            </li>
          </ul>
          {!loggedIn ? (
            <p className="assessment-soft-note">
              تقدر تبدأ كضيف. تسجيل الدخول يساعدنا نحفظ آخر نتيجة قياس في حسابك.
            </p>
          ) : null}
          {latest ? (
            <div className="assessment-latest-result">
              <p className="text-xs text-ink-soft">آخر قياس محفوظ</p>
              <p className="mt-1 text-lg font-bold text-ink">
                <span className="latin">
                  {latest.belowA1 ? "< A1" : latest.level}
                </span>{" "}
                · {latest.score}/{latest.total}
              </p>
            </div>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
