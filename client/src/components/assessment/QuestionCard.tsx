import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  Loader2,
} from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CompanionSays, useCompanion } from "@/components/companion";
import { getCompanionQuote } from "@/lib/companion-motivational-bank";
import { soundEffects } from "@/lib/sound-effects";
import { PronounceButton } from "@/components/pronounce-button";
import { cn } from "@/lib/utils";
import type { AssessmentQuestion, QuestionFeedback } from "@shared/assessment";

const LETTERS = ["A", "B", "C", "D"];
const MOTIVATIONS = [
  "يلا نبدأ بهدوء — كل سؤال خطوة أقرب لنقطة بدايتك.",
  "مش مطلوب تحفظ كل حاجة، خلّي السياق يساعدك.",
  "خد وقتك. فهم جملة واحدة كويس أحسن من استعجال كتير.",
  "شاطر إنك مكمل — الثقة بتتبني خطوة بخطوة.",
  "لو السؤال صعب، ده طبيعي. إحنا بنكتشف اللي نتمرن عليه.",
  "قربت تخلص الجزء ده. وخد بريك وقت ما تحتاج.",
];

export type QuestionCardProps = {
  question: AssessmentQuestion;
  questionIndex: number;
  total: number;
  answeredCount: number;
  answeredIndex?: number;
  feedback: QuestionFeedback | null;
  mode: "placement" | "practice";
  answerPending: boolean;
  actionPending: boolean;
  error?: string | null;
  onChoose: (optionIndex: number) => void;
  onPrevious: () => void;
  onNext: () => void;
  onPause: () => void;
};

export function QuestionCard({
  question,
  questionIndex,
  total,
  answeredCount,
  answeredIndex,
  feedback,
  mode,
  answerPending,
  actionPending,
  error,
  onChoose,
  onPrevious,
  onNext,
  onPause,
}: QuestionCardProps) {
  const { companion } = useCompanion();
  const companionPhrase = getCompanionQuote(companion.id, "levelTestQuestion", questionIndex);
  const hasAnswer = answeredIndex !== undefined;
  const isLast = questionIndex === total - 1;
  const canAdvance = hasAnswer && !answerPending && !actionPending;
  const currentFeedback =
    feedback?.questionId === question.id ? feedback : null;

  useEffect(() => {
    if (currentFeedback) {
      if (currentFeedback.correct) {
        soundEffects.playCorrect();
      } else {
        soundEffects.playIncorrect();
      }
    }
  }, [currentFeedback?.questionId, currentFeedback?.chosenIndex, currentFeedback?.correct]);

  return (
    <div className="assessment-question-layout">
      <section className="assessment-question-panel">
        <div className="assessment-question-meta">
          <span className="assessment-question-count">
            سؤال <b className="latin">{questionIndex + 1}</b> من{" "}
            <b className="latin">{total}</b>
          </span>
          <span className="assessment-question-tag">
            <span className="latin">{question.level}</span> ·{" "}
            {question.skill === "grammar"
              ? "القواعد"
              : question.skill === "vocabulary"
                ? "المفردات"
                : question.skill === "usage"
                  ? "مواقف يومية"
                  : "فهم المقروء"}
          </span>
        </div>

        <div
          className="mb-5"
          role="progressbar"
          aria-label="تقدم المرحلة"
          aria-valuenow={answeredCount}
          aria-valuemin={0}
          aria-valuemax={total}
        >
          <div className="h-1.5 overflow-hidden rounded-full bg-iris-soft">
            <div
              className="h-full rounded-full bg-iris transition-[width] duration-300 motion-reduce:transition-none"
              style={{ width: `${(answeredCount / total) * 100}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-ink-soft">
            اتحفظ {answeredCount} من {total} إجابة
          </p>
        </div>
        <div className="assessment-question-copy" dir="ltr">
          {question.context ? (
            <div className="flex items-start justify-between gap-3 mb-2">
              <p className="assessment-context assessment-bidi flex-1">
                {question.context}
              </p>
              <PronounceButton text={question.context} size="sm" />
            </div>
          ) : null}
          <div className="flex items-start justify-between gap-3">
            <h2 className="assessment-prompt assessment-bidi flex-1">
              {question.prompt}
            </h2>
            <PronounceButton text={question.prompt} size="md" />
          </div>
        </div>

        <div
          className="assessment-options"
          role="radiogroup"
          aria-label="اختيارات الإجابة"
          dir="ltr"
        >
          {question.options.map((option, optionIndex) => {
            const selected = answeredIndex === optionIndex;
            const correct = currentFeedback?.correctIndex === optionIndex;
            const chosenWrong =
              currentFeedback?.chosenIndex === optionIndex &&
              currentFeedback.correct === false;
            return (
              <button
                type="button"
                role="radio"
                aria-checked={selected}
                disabled={answerPending || actionPending}
                key={`${question.id}-${optionIndex}`}
                onClick={() => onChoose(optionIndex)}
                className={cn(
                  "assessment-option assessment-bidi",
                  selected && "is-selected",
                  correct && "is-correct",
                  chosenWrong && "is-wrong"
                )}
              >
                <span className="assessment-option-letter">
                  <span className="latin">{LETTERS[optionIndex]}</span>
                </span>
                <span className="assessment-option-text">{option}</span>
                {selected && answerPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : null}
                {correct && currentFeedback ? (
                  <CheckCircle2
                    className="size-4"
                    aria-label="الإجابة الصحيحة"
                  />
                ) : null}
                {chosenWrong ? (
                  <CircleAlert
                    className="size-4"
                    aria-label="إجابة غير صحيحة"
                  />
                ) : null}
              </button>
            );
          })}
        </div>

        {hasAnswer && !answerPending && (
          <p className="text-[11px] text-ink-soft py-1 text-center font-medium">
            💡 لو اخترت بالغلط تقدر تضغط على أي اختيار تاني وتعدّل إجابتك بحرية
          </p>
        )}

        {currentFeedback && mode === "practice" ? (
          <div
            className={cn(
              "assessment-feedback",
              currentFeedback.correct ? "is-correct" : "is-wrong"
            )}
            role="status"
          >
            <p className="font-bold">
              {currentFeedback.correct
                ? "اختيار مضبوط في السؤال ده."
                : "اختيارك اتسجل — خلّينا نفهم الإجابة."}
            </p>
            <p className="mt-1 text-sm leading-relaxed">
              {currentFeedback.explanationAr}
            </p>
          </div>
        ) : null}

        {error ? (
          <p className="assessment-inline-error" role="alert">
            {error}
          </p>
        ) : null}

        <div className="assessment-question-actions">
          <Button
            type="button"
            variant="ghost"
            className="rounded-xl text-ink-soft"
            onClick={onPrevious}
            disabled={questionIndex === 0 || answerPending || actionPending}
          >
            <ArrowRight className="size-4" /> السابق
          </Button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="assessment-pause-button"
              onClick={onPause}
              disabled={answerPending || actionPending}
            >
              وقّف دلوقتي
            </button>
            <Button
              type="button"
              className="h-11 rounded-xl bg-iris px-5 text-white hover:bg-iris-deep"
              onClick={onNext}
              disabled={!canAdvance}
            >
              {actionPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : null}
              {isLast ? "راجع المرحلة" : "السؤال التالي"}
              {!isLast ? <ArrowLeft className="size-4" /> : null}
            </Button>
          </div>
        </div>
      </section>

      <aside className="assessment-question-aside">
        <CompanionSays
          message={
            hasAnswer
              ? mode === "practice" && currentFeedback
                ? currentFeedback.correct
                  ? companion.id === "khadija"
                    ? "يا روحي عليك! إجابة سكر وشطورة خالص 🧁✨ بص على السبب عشان تثبت يا عسل!"
                    : "عاش يا وحش! ضربة معلم وتركيز في الجون 🎯💥 اقرأ السبب وثبّت الفكرة!"
                  : companion.id === "khadija"
                    ? "فداك يا قمراية! كل غلطة بنتعلم منها وبنقوى أكتر 🌸🧸 بص على الشرح ويلا نكمل!"
                    : "ولا يهمك يا بطل! الأبطال بيتعلموا من كل حركة 💪🚀 بص على الشرح وانطلق!"
                : companion.id === "khadija"
                  ? "إجابتك السكر اتسجلت 🌸 خدي وقتك ويلا للسؤال الجاي!"
                  : "إجابتك اتسجلت يا بطل 🚀 خد وقتك قبل ما تروح للتالي!"
              : companionPhrase.text
          }
          hint={
            hasAnswer
              ? mode === "practice"
                ? "التدريب بيعرض شرح الإجابة بعد الاختيار."
                : "في قياس المستوى، التقرير التفصيلي بيظهر بعد ما تخلص المرحلة."
              : companionPhrase.subtext ?? "جاوب بإحساسك، ومش مطلوب تكون متأكد 100%."
          }
        />
        <div className="assessment-keyboard-hint">
          <span className="latin">1–4</span> للاختيار ·{" "}
          <span className="latin">Enter</span> للمتابعة
        </div>
      </aside>
    </div>
  );
}
