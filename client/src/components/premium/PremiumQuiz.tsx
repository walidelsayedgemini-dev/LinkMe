import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  CircleHelp,
  RotateCcw,
  Send,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import type { PremiumDailyView } from "@shared/premium";
import { SKILL_NAMES } from "@shared/assessment";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

export function PremiumDailyQuiz({ view }: { view: PremiumDailyView }) {
  const utils = trpc.useUtils();
  const [answers, setAnswers] = useState<Record<string, number>>(
    view.answers ?? {}
  );

  useEffect(() => {
    setAnswers(view.answers ?? {});
  }, [view.dayIndex, view.answers]);

  const submit = trpc.premium.submitDaily.useMutation({
    onSuccess: async () => {
      toast.success("اتحفظت إجاباتك — شوف التصحيح تحت كل سؤال");
      await Promise.all([
        utils.premium.day.invalidate(),
        utils.premium.mine.invalidate(),
      ]);
    },
    onError: error => toast.error(error.message),
  });

  const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);
  const submitted = view.completed && view.feedback.length > 0;
  const feedbackByQuestion = useMemo(
    () => new Map(view.feedback.map(item => [item.questionId, item])),
    [view.feedback]
  );

  const handleSubmit = () => {
    if (view.questions.some(question => answers[question.id] === undefined)) {
      toast.error("جاوب على الأسئلة العشرة الأول — مفيش استعجال");
      return;
    }
    submit.mutate({ dayIndex: view.dayIndex, answers });
  };

  return (
    <section
      className="premium-card premium-quiz"
      aria-labelledby="daily-quiz-title"
    >
      <div className="premium-card-header">
        <div>
          <p className="premium-kicker">مراجعة النهارده · {view.total} أسئلة</p>
          <h2 id="daily-quiz-title" className="premium-card-title">
            اختبار قصير يثبت اللي اتعلمته
          </h2>
          <p className="premium-muted">
            اختار إجابة واحدة لكل سؤال. التصحيح والشرح بالمصري بيظهروا بعد الضغط
            على «سلّم الإجابات».
          </p>
        </div>
        <div
          className="premium-score-orb"
          aria-label={`${answeredCount} من ${view.total} أسئلة مجاوبة`}
        >
          <strong className="latin">{answeredCount}</strong>
          <span className="latin">/{view.total}</span>
        </div>
      </div>

      <div className="premium-question-list">
        {view.questions.map((question, index) => {
          const feedback = feedbackByQuestion.get(question.id);
          const chosenIndex = answers[question.id];
          return (
            <fieldset
              key={question.id}
              className="premium-question"
              disabled={submitted || submit.isPending}
            >
              <legend>
                <span className="premium-question-number latin">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span>
                  <span className="premium-question-skill">
                    {SKILL_NAMES[question.skill]}
                  </span>
                  <span className="premium-question-prompt">
                    {question.prompt}
                  </span>
                </span>
              </legend>
              {question.context && (
                <p className="premium-question-context">{question.context}</p>
              )}
              <div className="premium-options">
                {question.options.map((option, optionIndex) => {
                  const isChosen = chosenIndex === optionIndex;
                  const isCorrect = feedback?.correctIndex === optionIndex;
                  const isWrongChoice =
                    feedback && isChosen && !feedback.correct;
                  return (
                    <label
                      key={`${question.id}-${optionIndex}`}
                      className={cn(
                        "premium-option",
                        isChosen && "premium-option-selected",
                        submitted && isCorrect && "premium-option-correct",
                        submitted && isWrongChoice && "premium-option-wrong"
                      )}
                    >
                      <input
                        type="radio"
                        name={`daily-${question.id}`}
                        value={optionIndex}
                        checked={isChosen}
                        onChange={() =>
                          setAnswers(previous => ({
                            ...previous,
                            [question.id]: optionIndex,
                          }))
                        }
                      />
                      <span className="premium-option-index latin">
                        {String.fromCharCode(65 + optionIndex)}
                      </span>
                      <span>{option}</span>
                      {submitted && isCorrect && (
                        <CheckCircle2
                          aria-hidden="true"
                          className="size-4 text-emerald-500"
                        />
                      )}
                      {submitted && isWrongChoice && (
                        <XCircle
                          aria-hidden="true"
                          className="size-4 text-rose-500"
                        />
                      )}
                    </label>
                  );
                })}
              </div>
              {feedback && (
                <div
                  className={cn(
                    "premium-feedback",
                    feedback.correct
                      ? "premium-feedback-good"
                      : "premium-feedback-bad"
                  )}
                >
                  {feedback.correct ? (
                    <CheckCircle2 className="size-4 shrink-0" />
                  ) : (
                    <CircleHelp className="size-4 shrink-0" />
                  )}
                  <p>{feedback.explanationAr}</p>
                </div>
              )}
            </fieldset>
          );
        })}
      </div>

      <div className="premium-quiz-actions">
        {submitted && (
          <p className="premium-result-line">
            نتيجتك:{" "}
            <strong className="latin">
              {view.score ?? "—"}/{view.total}
            </strong>
            <span> · الإجابات محفوظة في سجلّك</span>
          </p>
        )}
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={submit.isPending || submitted}
          className="rounded-full bg-iris text-white hover:bg-iris-deep"
        >
          {submit.isPending ? (
            "جارٍ التصحيح…"
          ) : submitted ? (
            "تم التسليم"
          ) : (
            <>
              <Send className="me-2 size-4" /> سلّم الإجابات
            </>
          )}
        </Button>
        {submitted && (
          <button
            type="button"
            className="premium-text-button"
            onClick={() => setAnswers(view.answers ?? {})}
          >
            <RotateCcw className="size-3.5" /> راجع إجاباتك
          </button>
        )}
      </div>
    </section>
  );
}
