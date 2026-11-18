import { useEffect, useState } from "react";
import { Link } from "wouter";
import {
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Crown,
  Flame,
  Lock,
  MessageCircle,
  Play,
  RotateCcw,
  Trophy,
  XCircle,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/layout/site-footer";
import { Eyebrow } from "@/components/bits";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { trpc } from "@/lib/trpc";
import { awardXP } from "@/lib/gamification";
import { soundEffects } from "@/lib/sound-effects";
import { cn } from "@/lib/utils";
import {
  SPEED_QUIZ_BANK,
  getDailySpeedQuiz,
  getRandomSpeedQuiz,
  type SpeedQuizQuestion,
} from "@shared/speed-quiz-bank";

export default function SpeedQuiz() {
  const { user } = useAuth();
  const addXpMutation = trpc.community.addXp.useMutation();
  const { data: gameProfile } = trpc.community.myGameProfile.useQuery(
    undefined,
    { enabled: Boolean(user) }
  );
  const isVip = Boolean(gameProfile?.isVip);

  const [mode, setMode] = useState<"daily" | "random" | "pro_marathon">("daily");
  const [phase, setPhase] = useState<"ready" | "playing" | "done">("ready");
  const [questions, setQuestions] = useState<SpeedQuizQuestion[]>(() =>
    getDailySpeedQuiz()
  );
  const [idx, setIdx] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(60);
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [combo, setCombo] = useState(0);
  const [copied, setCopied] = useState(false);

  const current = questions[idx];

  useEffect(() => {
    if (phase !== "playing") return;
    if (secondsLeft <= 0) {
      finishQuiz(answers);
      return;
    }
    const timer = setInterval(() => {
      setSecondsLeft(prev => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [phase, secondsLeft]);

  const startQuiz = (nextMode: "daily" | "random" | "pro_marathon") => {
    if (nextMode === "pro_marathon" && !isVip) {
      toast.info("ماراثون الـ 15 سؤال حصري لمشتركي PRO 👑");
      return;
    }
    soundEffects.playClick();
    const qs =
      nextMode === "daily"
        ? getDailySpeedQuiz()
        : nextMode === "pro_marathon"
          ? getRandomSpeedQuiz(15)
          : getRandomSpeedQuiz(5);
    const secs = nextMode === "pro_marathon" ? 120 : 60;
    setMode(nextMode);
    setQuestions(qs);
    setIdx(0);
    setAnswers([]);
    setCombo(0);
    setTotalSeconds(secs);
    setSecondsLeft(secs);
    setPhase("playing");
  };

  const finishQuiz = (finalAnswers: (number | null)[]) => {
    setPhase("done");
    const correctCount = questions.reduce(
      (sum, q, i) => sum + (finalAnswers[i] === q.correctIndex ? 1 : 0),
      0
    );
    const baseEarned =
      mode === "pro_marathon"
        ? Math.max(25, correctCount * 10)
        : Math.max(10, correctCount * 6);
    if (correctCount >= Math.ceil(questions.length * 0.6)) {
      soundEffects.playTrophy();
    } else {
      soundEffects.playClick();
    }
    awardXP(baseEarned);
    if (user) {
      addXpMutation.mutate({
        amount: baseEarned,
        questId: `speed_quiz_${mode}_${new Date().toISOString().slice(0, 10)}`,
      });
    }
    toast.success(
      `⚡ انتهى التحدي! كسبت +${isVip ? baseEarned * 2 : baseEarned} XP${isVip ? " (مضاعفة PRO 2x!)" : ""}!`
    );
  };

  const handleAnswer = (choiceIndex: number) => {
    if (phase !== "playing" || !current) return;
    const isCorrect = choiceIndex === current.correctIndex;
    if (isCorrect) {
      soundEffects.playCorrect();
      setCombo(prev => prev + 1);
    } else {
      soundEffects.playIncorrect();
      setCombo(0);
    }

    const nextAnswers = [...answers, choiceIndex];
    setAnswers(nextAnswers);

    if (idx + 1 < questions.length) {
      setIdx(prev => prev + 1);
    } else {
      finishQuiz(nextAnswers);
    }
  };

  const correctCount = questions.reduce(
    (sum, q, i) => sum + (answers[i] === q.correctIndex ? 1 : 0),
    0
  );
  const timeUsed = totalSeconds - secondsLeft;
  const baseEarnedXp =
    mode === "pro_marathon"
      ? Math.max(25, correctCount * 10)
      : Math.max(10, correctCount * 6);
  const earnedXp = isVip ? baseEarnedXp * 2 : baseEarnedXp;

  const shareText = `⚡ تحدي الـ 60 ثانية على منصة Link Me!\n🏆 جبت ${correctCount} من ${questions.length} في ${timeUsed} ثانية بس 🔥\nتقدر تكسر رقمي؟ جرّب دلوقتي:\nhttps://www.link-me.tech/speed-quiz`;

  const handleCopyShare = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      toast.success("تم نسخ النتيجة — شاركها مع صحابك! 🔥");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("تعذّر النسخ");
    }
  };

  return (
    <PageShell>
      <section className="relative overflow-hidden border-b border-iris/25 bg-gradient-to-br from-[#0e2248] via-[#173673] to-[#1e40af] text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(600px circle at 15% 20%, rgba(251, 191, 36, 0.2), transparent 60%), radial-gradient(500px circle at 85% 80%, rgba(56, 189, 248, 0.2), transparent 60%)",
          }}
        />
        <div className="container relative py-8 sm:py-10">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-bold text-amber-300">
            <Zap className="size-3.5 fill-amber-300 text-amber-300" /> تحدي يومي سريع · {SPEED_QUIZ_BANK.length} سؤال
          </span>
          <h1 className="mt-2.5 text-2xl font-extrabold text-white sm:text-4xl">
            تحدي الـ <span className="text-amber-300">60 ثانية</span> اليومي ⚡
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/80">
            5 أسئلة ذكية في دقيقة واحدة بس! اختبر سرعة بديهتك في الإنجليزي،
            اكسب حتى +300 XP في ماراثون PRO، وشارك نتيجتك مع صحابك على واتساب.
          </p>
        </div>
      </section>

      <section className="container py-8 sm:py-12">
        <div className="mx-auto max-w-2xl">
          {phase === "ready" && (
            <div className="overflow-hidden rounded-3xl border border-iris/25 bg-gradient-to-b from-iris-soft/45 via-card to-card text-center shadow-md">
              <div className="relative h-44 overflow-hidden">
                <img
                  src="/img/ielts.webp"
                  alt=""
                  aria-hidden="true"
                  loading="lazy"
                  decoding="async"
                  className="size-full object-cover"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-[#0e2248]/95 via-[#173673]/75 to-[#b45309]/40"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center p-5 text-white">
                  <div className="grid size-14 place-items-center rounded-2xl border border-amber-300/40 bg-amber-500/25 text-3xl shadow-sm">
                    ⚡
                  </div>
                  <h2 className="mt-3 text-2xl font-black text-white sm:text-3xl">
                    جاهز تتحدى الوقت؟
                  </h2>
                </div>
              </div>

              <div className="p-6 sm:p-8">
                <p className="mx-auto max-w-md text-sm leading-relaxed text-ink-soft">
                  بنك ضخم من <b className="latin text-iris">{SPEED_QUIZ_BANK.length} سؤال عملي</b>{" "}
                  بين القواعد والمحادثة والبزنس والآيلتس! اختار التحدي اللي يناسبك:
                </p>

                <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Button
                  type="button"
                  onClick={() => startQuiz("daily")}
                  className="h-12 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-7 text-sm font-bold text-white shadow-sm hover:from-amber-600 hover:to-orange-600"
                >
                  <Play className="me-2 size-4 fill-white" /> تحدي النهارده (5
                  أسئلة) 🔥
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => startQuiz("random")}
                  className="h-12 rounded-full px-6 text-sm font-bold"
                >
                  جولة سريعة عشوائية 🎲
                </Button>
                {isVip ? (
                  <Button
                    type="button"
                    onClick={() => startQuiz("pro_marathon")}
                    className="h-12 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 px-7 text-sm font-bold text-white shadow-sm hover:from-purple-700 hover:to-indigo-700"
                  >
                    <Crown className="me-2 size-4" /> ماراثون PRO (15 سؤال ·
                    +300 XP) 👑
                  </Button>
                ) : (
                  <Button
                    asChild
                    variant="outline"
                    className="h-12 rounded-full border-amber-400/60 bg-amber-500/10 px-6 text-sm font-bold text-amber-800 hover:bg-amber-500/20 dark:text-amber-300"
                  >
                    <Link href="/pricing">
                      <Lock className="me-1.5 size-4" /> ماراثون PRO (15 سؤال ·
                      +300 XP) 👑
                    </Link>
                  </Button>
                )}
                </div>
              </div>
            </div>
          )}

          {phase === "playing" && current && (
            <div className="space-y-5">
              {/* Timer + Combo */}
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-card px-4 py-3">
                <div className="flex items-center gap-2">
                  <Clock
                    className={cn(
                      "size-5",
                      secondsLeft <= 15
                        ? "animate-pulse text-destructive"
                        : "text-iris"
                    )}
                  />
                  <span
                    className={cn(
                      "latin text-xl font-black",
                      secondsLeft <= 15 ? "text-destructive" : "text-ink"
                    )}
                  >
                    {secondsLeft}s
                  </span>
                </div>

                <span className="rounded-full bg-iris-soft px-3 py-1 text-xs font-bold text-iris">
                  سؤال {idx + 1} / {questions.length} · {current.category}
                </span>

                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-bold text-amber-700 dark:text-amber-300">
                  <Flame className="size-3.5 fill-amber-500 text-amber-500" />
                  Combo x{combo}
                </span>
              </div>

              {/* Countdown progress bar */}
              <div className="h-2 overflow-hidden rounded-full bg-paper-deep">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-1000",
                    secondsLeft <= 15 ? "bg-destructive" : "bg-amber-500"
                  )}
                  style={{ width: `${Math.round((secondsLeft / totalSeconds) * 100)}%` }}
                />
              </div>

              {/* Question Card */}
              <div className="rounded-3xl border border-iris/30 bg-card p-6 sm:p-8 shadow-sm">
                <p
                  className="latin text-lg font-bold leading-relaxed text-ink sm:text-2xl"
                  dir="ltr"
                >
                  {current.promptEn}
                </p>

                <div className="mt-6 grid gap-3">
                  {current.choices.map((choice, cIdx) => (
                    <button
                      key={cIdx}
                      type="button"
                      onClick={() => handleAnswer(cIdx)}
                      className="latin flex items-center gap-3 rounded-2xl border border-line bg-paper p-4 text-start text-sm font-semibold text-ink transition hover:border-iris hover:bg-iris-soft/50 active:scale-[0.99]"
                      dir="ltr"
                    >
                      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-paper-deep text-xs font-black text-iris">
                        {String.fromCharCode(65 + cIdx)}
                      </span>
                      <span>{choice}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {phase === "done" && (
            <div className="space-y-6">
              {/* Shareable Victory Card */}
              <div className="rounded-3xl border-2 border-amber-400/50 bg-gradient-to-br from-amber-500/15 via-card to-iris/10 p-7 text-center shadow-md">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 px-3 py-1 text-xs font-bold text-amber-800 dark:text-amber-300">
                  <Zap className="size-3.5 fill-amber-500 text-amber-500" />
                  تحدي الـ 60 ثانية · Link Me
                </span>

                <h2 className="mt-4 text-3xl font-black text-ink sm:text-4xl">
                  {correctCount === 5
                    ? "أسطورة! علامة كاملة 🏆"
                    : correctCount >= 3
                      ? "عاش يا بطل! أداء قوي 🔥"
                      : "بداية حلوة — جرّب تاني 💪"}
                </h2>

                <div className="mt-5 grid grid-cols-3 gap-3">
                  <div className="rounded-2xl border border-line bg-card/90 p-3">
                    <p className="latin text-2xl font-black text-emerald-600">
                      {correctCount}/{questions.length}
                    </p>
                    <p className="text-[11px] text-ink-soft">إجابات صح</p>
                  </div>
                  <div className="rounded-2xl border border-line bg-card/90 p-3">
                    <p className="latin text-2xl font-black text-iris">
                      {timeUsed}s
                    </p>
                    <p className="text-[11px] text-ink-soft">الوقت المستغرق</p>
                  </div>
                  <div className="rounded-2xl border border-line bg-card/90 p-3">
                    <p className="latin text-2xl font-black text-amber-600">
                      +{earnedXp}
                    </p>
                    <p className="text-[11px] text-ink-soft">نقاط XP</p>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap justify-center gap-2.5">
                  <Button
                    asChild
                    className="rounded-full bg-[#16A34A] px-5 font-bold text-white hover:bg-[#15803D]"
                  >
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <MessageCircle className="me-1.5 size-4" /> شارك نتيجتك
                      على واتساب
                    </a>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCopyShare}
                    className="rounded-full"
                  >
                    {copied ? (
                      <>
                        <Check className="me-1.5 size-4 text-emerald-600" /> تم
                        النسخ
                      </>
                    ) : (
                      <>
                        <Copy className="me-1.5 size-4" /> نسخ النتيجة
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => startQuiz("random")}
                    className="rounded-full"
                  >
                    <RotateCcw className="me-1.5 size-4" /> جولة جديدة
                  </Button>
                  <Button asChild variant="outline" className="rounded-full">
                    <Link href="/competitions">
                      <Trophy className="me-1.5 size-4 text-amber-500" /> شوف
                      ترتيبك
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Explanations Review */}
              <div className="space-y-3 rounded-3xl border border-line bg-card p-6">
                <h3 className="text-base font-bold text-ink">
                  مراجعة الإجابات والشرح بالمصري:
                </h3>
                {questions.map((q, i) => {
                  const picked = answers[i];
                  const ok = picked === q.correctIndex;
                  return (
                    <div
                      key={q.id}
                      className={cn(
                        "rounded-2xl border p-4 text-xs",
                        ok
                          ? "border-emerald-500/30 bg-emerald-500/5"
                          : "border-destructive/30 bg-destructive/5"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="latin font-bold text-ink" dir="ltr">
                          {i + 1}. {q.promptEn}
                        </p>
                        {ok ? (
                          <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                        ) : (
                          <XCircle className="size-4 shrink-0 text-destructive" />
                        )}
                      </div>
                      <p className="mt-1.5 font-semibold text-emerald-700 dark:text-emerald-300">
                        الإجابة الصحيحة:{" "}
                        <span className="latin" dir="ltr">
                          {q.choices[q.correctIndex]}
                        </span>
                      </p>
                      <p className="mt-1 leading-relaxed text-ink-soft">
                        💡 {q.explanationAr}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>
    </PageShell>
  );
}
