import {
  Check,
  ChevronDown,
  CircleAlert,
  LockKeyhole,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { YassinSays } from "@/components/yassin";
import { cn } from "@/lib/utils";
import type {
  AssessmentLevel,
  AssessmentQuestion,
  StageReport,
} from "@shared/assessment";
import { LEVEL_NAMES, SKILL_NAMES, percent } from "./shared";

type StageResultProps = {
  report: StageReport;
  questions: AssessmentQuestion[];
  mode: "placement" | "practice";
  passPercent: number;
  canAdvance: boolean;
  isFinalLevel: boolean;
  pending: boolean;
  error?: string | null;
  onNextStage: () => void;
  onFinish: () => void;
};

export function StageResult({
  report,
  questions,
  mode,
  passPercent,
  canAdvance,
  isFinalLevel,
  pending,
  error,
  onNextStage,
  onFinish,
}: StageResultProps) {
  const passed = report.passed;
  const resultMessage =
    mode === "practice"
      ? "كل سؤال بيخلّيك أقرب لفهم النقطة اللي تتمرن عليها. راجع الشرح براحتك."
      : passed
        ? "أداؤك يسمح لنا نفتح المرحلة التالية. خُد نفسًا صغيرًا وكمّل لما تكون جاهز."
        : "النتيجة دي بتحدد نقطة تدريب مناسبة دلوقتي — مش حكم نهائي على مستواك.";

  return (
    <div className="assessment-result-wrap">
      <YassinSays
        message={
          passed
            ? "خلصت المرحلة دي بنجاح."
            : "خلصت المرحلة — وده في حد ذاته خطوة مهمة."
        }
        hint={resultMessage}
        size={62}
      />

      <section
        className={cn(
          "assessment-result-hero",
          passed ? "is-passed" : "is-review"
        )}
      >
        <div>
          <p className="assessment-eyebrow">تقرير المرحلة</p>
          <div className="mt-2 flex flex-wrap items-baseline gap-3">
            <span className="latin text-5xl font-bold tracking-tight text-ink">
              {report.level}
            </span>
            <span className="text-lg font-semibold text-ink">
              {LEVEL_NAMES[report.level as AssessmentLevel] ?? report.level}
            </span>
          </div>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-soft">
            {passed
              ? `جبت ${report.score} من ${report.total} — مستوفي حد الانتقال ${passPercent}% أو أكثر.`
              : `جبت ${report.score} من ${report.total}. نقدر نثبت الأساس هنا قبل ما نطلع للمرحلة التالية.`}
          </p>
        </div>
        <div
          className="assessment-score-ring"
          aria-label={`${report.percent}%`}
        >
          <span className="latin">{report.percent}%</span>
          <small>{passed ? "مستوفي" : "نراجعها"}</small>
        </div>
      </section>

      <section className="assessment-result-grid">
        <div className="assessment-panel p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-iris" />
            <h2 className="text-lg text-ink">أداؤك حسب المهارة</h2>
          </div>
          <div className="mt-5 space-y-4">
            {(Object.keys(report.skills) as (keyof typeof report.skills)[]).map(
              skill => {
                const item = report.skills[skill];
                const value = percent(item.correct, item.total);
                return (
                  <div key={skill}>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-ink">{SKILL_NAMES[skill]}</span>
                      <span className="latin text-xs text-ink-soft">
                        {item.correct}/{item.total}
                      </span>
                    </div>
                    <div className="assessment-skill-track">
                      <span style={{ width: `${value}%` }} />
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </div>
        <div className="assessment-panel assessment-next-panel p-5 sm:p-6">
          <p className="assessment-eyebrow">الخطوة الجاية</p>
          {mode === "practice" ? (
            <>
              <h2 className="mt-2 text-xl text-ink">تحب تتمرن مرة تانية؟</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                التدريب مستقل عن قياس المستوى، فممكن تغيّر المرحلة من شاشة
                البداية في أي وقت.
              </p>
            </>
          ) : canAdvance && !isFinalLevel ? (
            <>
              <h2 className="mt-2 text-xl text-ink">المرحلة التالية جاهزة</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                نفتحها لك ونرسل 12 سؤالًا جديدًا من السيرفر.
              </p>
            </>
          ) : (
            <>
              <h2 className="mt-2 text-xl text-ink">كفاية لحد هنا؟</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                ممكن تنهي القياس وتشوف التقدير الأقرب والتوصيات، حتى لو ما كملتش
                كل المراحل.
              </p>
            </>
          )}
          <div className="mt-5 flex flex-wrap gap-2">
            {mode === "placement" && canAdvance && !isFinalLevel ? (
              <Button
                onClick={onNextStage}
                disabled={pending}
                className="rounded-xl bg-iris text-white hover:bg-iris-deep"
              >
                {pending ? "بنفتح المرحلة…" : "افتح المرحلة التالية"}
              </Button>
            ) : null}
            <Button
              onClick={onFinish}
              disabled={pending}
              variant={
                mode === "placement" && canAdvance && !isFinalLevel
                  ? "ghost"
                  : "default"
              }
              className="rounded-xl"
            >
              {pending
                ? "بنجهز التقرير…"
                : mode === "practice"
                  ? "إنهاء التدريب"
                  : "اعرض تقديرك"}
            </Button>
          </div>
          {error && (
            <p className="assessment-inline-error mt-3" role="alert">
              {error}
            </p>
          )}
        </div>
      </section>

      <section className="assessment-feedback-section">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <p className="assessment-eyebrow">مراجعة المرحلة</p>
            <h2 className="mt-1 text-2xl text-ink">كل سؤال وشرحه</h2>
          </div>
          <span className="text-xs text-ink-soft">
            {report.feedback.length} سؤال
          </span>
        </div>
        <div className="space-y-2">
          {report.feedback.map((item, index) => {
            const question = questions.find(
              entry => entry.id === item.questionId
            );
            return (
              <details
                key={item.questionId}
                className="assessment-feedback-item"
                open={index === 0}
              >
                <summary>
                  <span
                    className={cn(
                      "assessment-feedback-status",
                      item.correct ? "is-correct" : "is-wrong"
                    )}
                  >
                    {item.correct ? (
                      <Check className="size-3.5" />
                    ) : (
                      <CircleAlert className="size-3.5" />
                    )}
                  </span>
                  <span className="latin text-xs text-ink-soft">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="assessment-bidi flex-1 text-start">
                    {question?.prompt ?? "سؤال من المرحلة"}
                  </span>
                  <ChevronDown className="size-4 text-ink-soft transition-transform" />
                </summary>
                <div className="assessment-feedback-body">
                  <p className="text-sm text-ink-soft">
                    إجابتك:{" "}
                    <strong className="assessment-bidi text-ink">
                      {question?.options[item.chosenIndex] ?? "—"}
                    </strong>
                  </p>
                  <p className="mt-1 text-sm text-ink-soft">
                    الإجابة الصحيحة:{" "}
                    <strong className="assessment-bidi text-ink">
                      {question?.options[item.correctIndex] ?? "—"}
                    </strong>
                  </p>
                  <p className="mt-3 rounded-xl bg-paper-deep p-3 text-sm leading-relaxed text-ink">
                    {item.explanationAr}
                  </p>
                </div>
              </details>
            );
          })}
        </div>
      </section>

      <p className="assessment-disclaimer">
        <LockKeyhole className="size-3.5" /> القياس تقديري ومبني على الأسئلة
        النصية المتاحة هنا، وليس اعتماد CEFR كاملًا ولا يقيس التحدث أو الاستماع.
      </p>
    </div>
  );
}
