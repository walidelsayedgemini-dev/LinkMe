import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  Clock3,
  Layers3,
  ShieldCheck,
} from "lucide-react";
import { PageShell } from "@/components/layout/site-footer";
import { useAuth } from "@/contexts/AuthContext";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import type { AssessmentLevel, AssessmentView } from "@shared/assessment";
import "@/assessment.css";
import {
  AssessmentIntro,
  type AssessmentCatalog,
} from "@/components/assessment/AssessmentIntro";
import { AssessmentSummary } from "@/components/assessment/AssessmentSummary";
import {
  AssessmentError,
  AssessmentLoading,
  AssessmentPause,
  HalfwayBreak,
} from "@/components/assessment/AssessmentStates";
import { QuestionCard } from "@/components/assessment/QuestionCard";
import { StageMap } from "@/components/assessment/StageMap";
import { StageResult } from "@/components/assessment/StageResult";
import { errorText, latestReport } from "@/components/assessment/shared";

const STORAGE_PREFIX = "fluently:assessment-session:v1";

type IdentityKey = `user:${number}` | "guest";
type SessionRef = { sessionId: string; token: string };

type StoredSession = SessionRef & { mode?: "placement" | "practice" };

function storageKey(identity: IdentityKey) {
  return `${STORAGE_PREFIX}:${identity}`;
}

function readStoredSession(identity: IdentityKey): StoredSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(storageKey(identity));
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<StoredSession>;
    if (
      typeof value.sessionId !== "string" ||
      typeof value.token !== "string" ||
      !value.sessionId ||
      !value.token
    )
      return null;
    return { sessionId: value.sessionId, token: value.token, mode: value.mode };
  } catch {
    return null;
  }
}

function unansweredIndex(view: AssessmentView) {
  const first = view.questions.findIndex(
    question => view.answers[question.id] === undefined
  );
  return first >= 0 ? first : Math.max(view.questions.length - 1, 0);
}

export default function LevelTest() {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <PageShell>
        <AssessmentLoading label="بنجهّز مساحة اختبارك…" />
      </PageShell>
    );
  return <AssessmentExperience key={user ? `user:${user.id}` : "guest"} />;
}

function AssessmentExperience() {
  const { user, loading: authLoading } = useAuth();
  const identity = authLoading
    ? null
    : user
      ? (`user:${user.id}` as IdentityKey)
      : "guest";
  const [activeIdentity, setActiveIdentity] = useState<IdentityKey | null>(
    null
  );
  const [view, setView] = useState<AssessmentView | null>(null);
  const [sessionRef, setSessionRef] = useState<SessionRef | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [breakDismissed, setBreakDismissed] = useState(false);
  const [resumeNotice, setResumeNotice] = useState<string | null>(null);

  const utils = trpc.useUtils();
  const catalog = trpc.assessment.catalog.useQuery(undefined, {
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });
  const latest = trpc.placement.myLatest.useQuery(undefined, {
    enabled: Boolean(user) && !authLoading,
    retry: false,
  });
  const resume = trpc.assessment.resume.useQuery(
    sessionRef ?? { sessionId: "", token: "" },
    {
      enabled: Boolean(
        sessionRef && activeIdentity && identity === activeIdentity && !view
      ),
      retry: false,
    }
  );

  const persist = useCallback(
    (next: AssessmentView, owner: IdentityKey | null = activeIdentity) => {
      if (!owner || typeof window === "undefined") return;
      try {
        window.localStorage.setItem(
          storageKey(owner),
          JSON.stringify({
            sessionId: next.sessionId,
            token: next.token,
            mode: next.mode,
          } satisfies StoredSession)
        );
      } catch {
        // Storage is an enhancement; the server session remains the source of truth.
      }
    },
    [activeIdentity]
  );

  const clearStored = useCallback(
    (owner: IdentityKey | null = activeIdentity) => {
      if (!owner || typeof window === "undefined") return;
      try {
        window.localStorage.removeItem(storageKey(owner));
      } catch {
        /* private mode or blocked storage */
      }
    },
    [activeIdentity]
  );

  useEffect(() => {
    if (!identity || identity === activeIdentity) return;
    setActiveIdentity(identity);
    setView(null);
    setSessionRef(readStoredSession(identity));
    setQuestionIndex(0);
    setPaused(false);
    setBreakDismissed(false);
    setResumeNotice(null);
  }, [identity, activeIdentity]);

  useEffect(() => {
    if (!identity || identity !== activeIdentity || !sessionRef || view) return;
    if (resume.data) {
      setView(resume.data);
      setQuestionIndex(unansweredIndex(resume.data));
      setResumeNotice(null);
    }
  }, [activeIdentity, identity, resume.data, sessionRef, view]);

  useEffect(() => {
    if (!sessionRef || !resume.isError || identity !== activeIdentity) return;
    const code = resume.error?.data?.code;
    if (
      !code ||
      !["UNAUTHORIZED", "FORBIDDEN", "NOT_FOUND", "BAD_REQUEST"].includes(code)
    )
      return;
    clearStored();
    setSessionRef(null);
    setResumeNotice(
      "الجلسة القديمة خلصت أو انتهت صلاحيتها، فمسحنا رابطها بأمان. تقدر تبدأ جلسة جديدة."
    );
  }, [
    activeIdentity,
    clearStored,
    identity,
    resume.isError,
    resume.error,
    sessionRef,
  ]);

  useEffect(() => {
    if (!view || !identity || identity !== activeIdentity) return;
    if (view.phase === "completed") clearStored();
    else persist(view);
  }, [activeIdentity, clearStored, identity, persist, view]);

  const setServerView = useCallback((next: AssessmentView) => {
    setView(next);
    setSessionRef({ sessionId: next.sessionId, token: next.token });
    setPaused(false);
    setBreakDismissed(false);
    setQuestionIndex(next.phase === "answering" ? unansweredIndex(next) : 0);
  }, []);

  const start = trpc.assessment.start.useMutation({ onSuccess: setServerView });
  const answer = trpc.assessment.answer.useMutation({
    onSuccess: next => {
      // Keep the selected question visible until the student presses Next.
      setView(next);
      setSessionRef({ sessionId: next.sessionId, token: next.token });
    },
  });
  const finishStage = trpc.assessment.finishStage.useMutation({
    onSuccess: setServerView,
  });
  const nextStage = trpc.assessment.nextStage.useMutation({
    onSuccess: setServerView,
  });
  const finish = trpc.assessment.finish.useMutation({
    onSuccess: async next => {
      setServerView(next);
      clearStored();
      await utils.placement.myLatest.invalidate();
    },
  });

  const safeView = activeIdentity && identity === activeIdentity ? view : null;
  const isMutationPending =
    start.isPending ||
    answer.isPending ||
    finishStage.isPending ||
    nextStage.isPending ||
    finish.isPending;
  const currentQuestion =
    safeView?.phase === "answering"
      ? safeView.questions[questionIndex]
      : undefined;
  const answeredCount =
    safeView?.phase === "answering" ? Object.keys(safeView.answers).length : 0;
  const showBreak = Boolean(
    currentQuestion &&
      answeredCount === 6 &&
      !breakDismissed &&
      questionIndex >= 5 &&
      safeView?.mode
  );

  const begin = (mode: "placement" | "practice", level?: AssessmentLevel) => {
    if (isMutationPending) return;
    clearStored();
    setSessionRef(null);
    setView(null);
    setResumeNotice(null);
    start.reset();
    start.mutate(level ? { mode, level } : { mode });
  };

  const handleChoose = (optionIndex: number) => {
    if (
      !safeView ||
      safeView.phase !== "answering" ||
      !currentQuestion ||
      answer.isPending ||
      safeView.answers[currentQuestion.id] === optionIndex
    )
      return;
    answer.reset();
    answer.mutate({
      sessionId: safeView.sessionId,
      token: safeView.token,
      questionId: currentQuestion.id,
      optionIndex,
    });
  };

  const handleNext = () => {
    if (
      !safeView ||
      safeView.phase !== "answering" ||
      !currentQuestion ||
      safeView.answers[currentQuestion.id] === undefined ||
      answer.isPending ||
      finishStage.isPending
    )
      return;
    if (questionIndex < safeView.questions.length - 1) {
      setQuestionIndex(value => value + 1);
      setBreakDismissed(false);
      return;
    }
    finishStage.reset();
    finishStage.mutate({
      sessionId: safeView.sessionId,
      token: safeView.token,
    });
  };

  const handlePause = () => setPaused(true);
  const handleStartOver = () => {
    clearStored();
    setSessionRef(null);
    setView(null);
    setPaused(false);
    setResumeNotice(null);
  };
  const retryCatalog = () => void catalog.refetch();
  const resumeStored = () => {
    if (sessionRef) void resume.refetch();
  };

  useEffect(() => {
    if (!safeView || safeView.phase !== "answering" || paused) return;
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        !target ||
        target.isContentEditable ||
        ["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(target.tagName)
      )
        return;
      if (["1", "2", "3", "4"].includes(event.key)) {
        const optionIndex = Number(event.key) - 1;
        if (
          currentQuestion?.options[optionIndex] !== undefined &&
          currentQuestion &&
          safeView.answers[currentQuestion.id] !== optionIndex &&
          !answer.isPending
        ) {
          event.preventDefault();
          handleChoose(optionIndex);
        }
      } else if (
        event.key === "Enter" &&
        currentQuestion &&
        safeView.answers[currentQuestion.id] !== undefined &&
        !answer.isPending &&
        !finishStage.isPending
      ) {
        event.preventDefault();
        handleNext();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    answer.isPending,
    currentQuestion,
    finishStage.isPending,
    handleChoose,
    handleNext,
    paused,
    safeView,
  ]);

  const stageReport =
    safeView?.phase === "stage-result" ? latestReport(safeView) : null;
  const catalogData = catalog.data as AssessmentCatalog | undefined;
  const error = catalog.error ?? start.error;

  return (
    <PageShell>
      <div className="assessment-page" dir="rtl">
        <section className="assessment-hero">
          <div className="container assessment-hero-inner">
            <div className="assessment-hero-copy">
              <div className="assessment-kicker">
                <Layers3 className="size-4" /> مسار قصير من 6 مراحل
              </div>
              <h1>
                اعرف <span>نقطة بدايتك</span> وكمّل من غير تخمين.
              </h1>
              <p className="assessment-hero-lede">
                قياس نصّي متدرج في القواعد والمفردات والاستخدام وفهم المقروء. كل
                مرحلة 12 سؤالًا، وتقدر توقف وترجع وقت ما يناسبك.
              </p>
              <div className="assessment-hero-meta">
                <span className="assessment-meta-chip">
                  <BookOpen className="size-3.5" /> بنك متنوع للتدريب
                </span>
                <span className="assessment-meta-chip">
                  <Clock3 className="size-3.5" /> بدون مؤقت
                </span>
                <span className="assessment-meta-chip">
                  <ShieldCheck className="size-3.5" /> الجلسة سرية وقابلة
                  للاستئناف
                </span>
              </div>
            </div>
          </div>
        </section>

        <main className="container assessment-main">
          {authLoading || !identity || !activeIdentity ? (
            <AssessmentLoading label="بنجهّز مساحة اختبارك…" />
          ) : catalog.isLoading ? (
            <AssessmentLoading label="بنحمّل خريطة المراحل…" />
          ) : catalog.isError || !catalogData ? (
            <AssessmentError
              error={error ?? catalog.error}
              onRetry={retryCatalog}
            />
          ) : paused && safeView?.phase === "answering" ? (
            <AssessmentPause
              onResume={() => setPaused(false)}
              onStartOver={handleStartOver}
            />
          ) : !safeView ? (
            <>
              {resumeNotice ? (
                <div
                  className="mb-4 rounded-xl border border-line bg-card p-3 text-sm text-ink-soft"
                  role="status"
                >
                  <CheckCircle2 className="me-2 inline size-4 text-iris" />
                  {resumeNotice}
                </div>
              ) : null}
              {resume.isError && !resumeNotice ? (
                <AssessmentError
                  error={resume.error}
                  onRetry={resumeStored}
                  label="مقدرناش نرجّع الجلسة الحالية."
                />
              ) : null}
              <AssessmentIntro
                catalog={catalogData}
                latest={latest.data}
                loggedIn={Boolean(user)}
                hasResume={Boolean(sessionRef && !resume.isError)}
                resumeLoading={resume.isFetching}
                onResume={resumeStored}
                onStartPlacement={() => begin("placement")}
                onStartPractice={level => begin("practice", level)}
                onForgetResume={handleStartOver}
              />
              {start.error ? (
                <p
                  className="mt-4 text-center text-sm text-destructive"
                  role="alert"
                >
                  {errorText(start.error, "مقدرناش نبدأ الجلسة. جرّب تاني.")}
                </p>
              ) : null}
            </>
          ) : safeView.phase === "answering" && currentQuestion ? (
            <>
              <StageMap
                currentLevel={safeView.level}
                reports={safeView.reports}
                passPercent={catalogData.passPercent}
              />
              {showBreak ? (
                <HalfwayBreak
                  onContinue={() => setBreakDismissed(true)}
                  onPause={handlePause}
                />
              ) : null}
              <div className={cn(showBreak && "mt-4")}>
                <QuestionCard
                  question={currentQuestion}
                  questionIndex={questionIndex}
                  total={safeView.questions.length}
                  answeredCount={answeredCount}
                  answeredIndex={safeView.answers[currentQuestion.id]}
                  feedback={safeView.feedbackByQuestionId?.[currentQuestion.id] ?? safeView.feedback}
                  mode={safeView.mode}
                  answerPending={answer.isPending}
                  actionPending={finishStage.isPending}
                  error={
                    answer.error
                      ? errorText(
                          answer.error,
                          "الإجابة ما اتحفظتش. جرّب تاني."
                        )
                      : finishStage.error
                        ? errorText(
                            finishStage.error,
                            "مقدرناش نكمل المرحلة. جرّب تاني."
                          )
                        : null
                  }
                  onChoose={handleChoose}
                  onPrevious={() =>
                    setQuestionIndex(value => Math.max(0, value - 1))
                  }
                  onNext={handleNext}
                  onPause={handlePause}
                />
              </div>
            </>
          ) : safeView.phase === "stage-result" && stageReport ? (
            <StageResult
              report={stageReport}
              questions={safeView.questions}
              mode={safeView.mode}
              passPercent={catalogData.passPercent}
              canAdvance={safeView.canAdvance}
              isFinalLevel={safeView.level === "C2"}
              pending={nextStage.isPending || finish.isPending}
              error={
                nextStage.error
                  ? errorText(
                      nextStage.error,
                      "مقدرناش نفتح المرحلة. جرّب نفس الزر تاني."
                    )
                  : finish.error
                    ? errorText(
                        finish.error,
                        "مقدرناش نحفظ التقرير. جرّب نفس الزر تاني."
                      )
                    : null
              }
              onNextStage={() => {
                nextStage.reset();
                nextStage.mutate({
                  sessionId: safeView.sessionId,
                  token: safeView.token,
                });
              }}
              onFinish={() => {
                finish.reset();
                finish.mutate({
                  sessionId: safeView.sessionId,
                  token: safeView.token,
                });
              }}
            />
          ) : safeView.phase === "completed" && safeView.summary ? (
            <AssessmentSummary
              summary={safeView.summary}
              mode={safeView.mode}
              loggedIn={Boolean(user)}
              onRestart={handleStartOver}
            />
          ) : (
            <AssessmentError
              error={"حالة الجلسة غير مكتملة"}
              onRetry={handleStartOver}
              label="الجلسة محتاجة بداية جديدة."
            />
          )}
        </main>
      </div>
    </PageShell>
  );
}
