import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Check,
  ChevronLeft,
  Clock3,
  Lightbulb,
  MessageCircleWarning,
  RotateCcw,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import type { PremiumLessonSummary } from "@shared/premium";
import { SKILL_NAMES } from "@shared/assessment";
import { Button } from "@/components/ui/button";
import { PronounceButton } from "@/components/pronounce-button";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "explanation", label: "الشرح" },
  { id: "examples", label: "أمثلة" },
  { id: "mistakes", label: "أخطاء شائعة" },
  { id: "quiz", label: "اختبر نفسك" },
] as const;
type LessonTab = (typeof TABS)[number]["id"];

export function LessonBrowser({
  lessons,
  progress,
}: {
  lessons: PremiumLessonSummary[];
  progress: Record<string, number>;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(
    lessons[0]?.id ?? null
  );
  const [tab, setTab] = useState<LessonTab>("explanation");
  const [flippedMistake, setFlippedMistake] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  useEffect(() => {
    if (selectedId && lessons.some(lesson => lesson.id === selectedId)) return;
    setSelectedId(lessons[0]?.id ?? null);
  }, [lessons, selectedId]);
  useEffect(() => {
    setTab("explanation");
    setFlippedMistake(null);
    setAnswers({});
    setSubmitted(false);
  }, [selectedId]);
  const lessonQuery = trpc.premium.lesson.useQuery(
    { lessonId: selectedId ?? "" },
    { enabled: Boolean(selectedId) }
  );
  const submitLesson = trpc.premium.submitLesson.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      toast.success("اتحفظ تدريب الدرس");
    },
    onError: error => toast.error(error.message),
  });
  const lesson = lessonQuery.data?.lesson;
  const quizFeedback = submitLesson.data?.feedback ?? [];
  const feedbackById = useMemo(
    () => new Map(quizFeedback.map(item => [item.questionId, item])),
    [quizFeedback]
  );
  const completedPercent = selectedId ? (progress[selectedId] ?? 0) : 0;
  const submit = () => {
    if (!lesson || !selectedId) return;
    if (lesson.quiz.some(question => answers[question.id] === undefined)) {
      toast.error("جاوب على كل أسئلة الدرس قبل الحفظ");
      return;
    }
    submitLesson.mutate({ lessonId: selectedId, answers });
  };
  return (
    <section
      className="premium-lesson-browser"
      aria-labelledby="lesson-browser-title"
    >
      <div className="premium-section-heading">
        <div>
          <p className="premium-kicker">المسار اليومي</p>
          <h2 id="lesson-browser-title">دروسك بالترتيب</h2>
          <p className="premium-muted">
            كل درس فيه شرح وأمثلة وتدريب. تقدمك بيتحفظ بعد التسليم.
          </p>
        </div>
        <BookOpen className="premium-section-icon" aria-hidden="true" />
      </div>
      <div className="premium-lesson-layout">
        <nav className="premium-lesson-list" aria-label="دروس خطة الإتقان">
          {lessons.length === 0 && (
            <p className="premium-muted">
              الدروس هتظهر أول ما خطة مستواك تتجهز.
            </p>
          )}
          {lessons.map((item, index) => {
            const percent = progress[item.id] ?? 0;
            const isSelected = item.id === selectedId;
            return (
              <button
                key={item.id}
                type="button"
                className={cn(
                  "premium-lesson-item",
                  isSelected && "premium-lesson-item-active"
                )}
                onClick={() => setSelectedId(item.id)}
                aria-current={isSelected ? "page" : undefined}
              >
                <span className="premium-lesson-index latin">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0 flex-1 text-start">
                  <strong>{item.title}</strong>
                  <small>
                    {SKILL_NAMES[item.skill]} · {item.minutes} دقيقة
                  </small>
                </span>
                <span className="premium-lesson-progress latin">
                  {percent}%
                </span>
              </button>
            );
          })}
        </nav>
        <div className="premium-lesson-panel">
          {lessonQuery.isLoading && (
            <div
              className="premium-loading-block"
              aria-label="جارٍ تحميل الدرس"
            />
          )}
          {lessonQuery.error && (
            <p className="premium-empty">
              الدرس مش متاح حاليًا. جرّب تاني بعد شوية.
            </p>
          )}
          {lesson && (
            <>
              <header className="premium-lesson-header">
                <div>
                  <div className="premium-chip-row">
                    <span className="premium-chip">{lesson.level}</span>
                    <span className="premium-chip premium-chip-muted">
                      <Clock3 className="size-3.5" /> {lesson.minutes} دقيقة
                    </span>
                  </div>
                  <h3>{lesson.title}</h3>
                  <p>{lesson.description}</p>
                </div>
                <div
                  className="premium-lesson-completion"
                  aria-label={`تقدم الدرس ${completedPercent}%`}
                >
                  <span className="latin">{completedPercent}%</span>
                  <small>مكتمل</small>
                </div>
              </header>
              <div
                className="premium-tabs"
                role="tablist"
                aria-label="أقسام الدرس"
              >
                {TABS.map(item => (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={tab === item.id}
                    className={cn(tab === item.id && "premium-tab-active")}
                    onClick={() => setTab(item.id)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              {tab === "explanation" && (
                <div className="premium-prose" role="tabpanel">
                  <h4>الفكرة ببساطة</h4>
                  <p>{lesson.explanation}</p>
                  <div className="premium-rule-box">
                    <Lightbulb className="size-5" />
                    <div>
                      <strong>القاعدة</strong>
                      <p>{lesson.rule}</p>
                    </div>
                  </div>
                  <div className="premium-tip-box">
                    <strong>نصيحة ياسين</strong>
                    <p>{lesson.practiceTip}</p>
                  </div>
                </div>
              )}
              {tab === "examples" && (
                <div className="premium-example-grid" role="tabpanel">
                  {lesson.examples.map((example, index) => (
                    <article
                      key={`${example.kind}-${index}`}
                      className="premium-example-card"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span>
                          {example.kind === "affirmative"
                            ? "مثبت"
                            : example.kind === "negative"
                              ? "منفي"
                              : example.kind === "question"
                                ? "سؤال"
                                : "مقارنة"}
                        </span>
                        <PronounceButton text={example.english} size="sm" />
                      </div>
                      <p className="latin" dir="ltr">
                        {example.english}
                      </p>
                      <p>{example.egyptian}</p>
                    </article>
                  ))}
                </div>
              )}
              {tab === "mistakes" && (
                <div className="premium-mistake-grid" role="tabpanel">
                  {lesson.commonMistakes.map((mistake, index) => {
                    const open = flippedMistake === index;
                    return (
                      <button
                        type="button"
                        key={`${mistake.wrong}-${index}`}
                        className={cn(
                          "premium-mistake-card",
                          open && "premium-mistake-card-open"
                        )}
                        onClick={() => setFlippedMistake(open ? null : index)}
                        aria-expanded={open}
                      >
                        <MessageCircleWarning className="size-5" />
                        {open ? (
                          <>
                            <div className="flex items-center justify-between gap-2">
                              <strong className="latin" dir="ltr">
                                {mistake.right}
                              </strong>
                              <PronounceButton text={mistake.right} size="sm" />
                            </div>
                            <span>{mistake.why}</span>
                          </>
                        ) : (
                          <>
                            <strong className="latin" dir="ltr">
                              {mistake.wrong}
                            </strong>
                            <span>اضغط علشان تعرف التصحيح</span>
                          </>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
              {tab === "quiz" && (
                <div className="premium-lesson-quiz" role="tabpanel">
                  {lesson.quiz.map((question, index) => {
                    const feedback = feedbackById.get(question.id);
                    return (
                      <fieldset
                        key={question.id}
                        disabled={submitted || submitLesson.isPending}
                        className="premium-question"
                      >
                        <legend>
                          <span className="premium-question-number latin">
                            {index + 1}
                          </span>
                          {question.prompt}
                        </legend>
                        {question.context && (
                          <p className="premium-question-context">
                            {question.context}
                          </p>
                        )}
                        <div className="premium-options">
                          {question.options.map((option, optionIndex) => (
                            <label
                              key={`${question.id}-${optionIndex}`}
                              className={cn(
                                "premium-option",
                                answers[question.id] === optionIndex &&
                                  "premium-option-selected",
                                submitted &&
                                  feedback?.correctIndex === optionIndex &&
                                  "premium-option-correct",
                                submitted &&
                                  feedback?.chosenIndex === optionIndex &&
                                  !feedback.correct &&
                                  "premium-option-wrong"
                              )}
                            >
                              <input
                                type="radio"
                                name={`lesson-${question.id}`}
                                checked={answers[question.id] === optionIndex}
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
                              {submitted &&
                                feedback?.correctIndex === optionIndex && (
                                  <Check className="ms-auto size-4" />
                                )}
                            </label>
                          ))}
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
                            <p>{feedback.explanationAr}</p>
                          </div>
                        )}
                      </fieldset>
                    );
                  })}
                  <div className="premium-quiz-actions">
                    {submitted && (
                      <p className="premium-result-line">
                        نتيجتك:{" "}
                        <strong className="latin">
                          {submitLesson.data?.score ?? "—"}/
                          {submitLesson.data?.total ?? lesson.quiz.length}
                        </strong>
                      </p>
                    )}
                    <Button
                      type="button"
                      className="rounded-full bg-iris text-white hover:bg-iris-deep"
                      disabled={submitLesson.isPending || submitted}
                      onClick={submit}
                    >
                      {submitLesson.isPending ? (
                        "جارٍ الحفظ…"
                      ) : submitted ? (
                        "تم حفظ التدريب"
                      ) : (
                        <>
                          <Send className="me-2 size-4" /> سلّم تدريب الدرس
                        </>
                      )}
                    </Button>
                    {submitted && (
                      <button
                        type="button"
                        className="premium-text-button"
                        onClick={() => {
                          setAnswers({});
                          setSubmitted(false);
                        }}
                      >
                        <RotateCcw className="size-3.5" /> إعادة المحاولة
                      </button>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      {selectedId &&
        lessons.findIndex(item => item.id === selectedId) <
          lessons.length - 1 && (
          <button
            type="button"
            className="premium-next-lesson"
            onClick={() =>
              setSelectedId(
                lessons[lessons.findIndex(item => item.id === selectedId) + 1]
                  ?.id ?? null
              )
            }
          >
            الدرس التالي <ChevronLeft className="size-4" />
          </button>
        )}
    </section>
  );
}
