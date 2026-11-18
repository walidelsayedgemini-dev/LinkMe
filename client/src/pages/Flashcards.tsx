import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import {
  CheckCircle2,
  Flame,
  RotateCcw,
  Sparkles,
  Trophy,
  Volume2,
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
  FLASHCARD_LEVEL_META,
  FLASHCARDS_DECK,
  type FlashcardLevel,
} from "@shared/flashcards-deck";

const STORAGE_KEY = "linkme:flashcards-mastered:v1";
const DAILY_KEY = "linkme:flashcards-daily:v1";
const LEVELS: FlashcardLevel[] = ["A1", "A2", "B1", "B2"];

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function loadMastered(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function loadDailyCount(): number {
  try {
    const raw = localStorage.getItem(DAILY_KEY);
    if (!raw) return 0;
    const parsed = JSON.parse(raw) as { date: string; count: number };
    return parsed.date === todayKey() ? parsed.count : 0;
  } catch {
    return 0;
  }
}

function speakText(text: string, rate = 0.95) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    toast.info("المتصفح لا يدعم النطق الصوتي هنا");
    return;
  }
  try {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "en-US";
    utter.rate = rate;
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(
      v => v.lang.startsWith("en-US") || v.lang.startsWith("en-GB")
    );
    if (preferred) utter.voice = preferred;
    window.speechSynthesis.speak(utter);
  } catch {
    // ignore speech synthesis errors
  }
}

export default function Flashcards() {
  const { user } = useAuth();
  const [level, setLevel] = useState<FlashcardLevel>("A1");
  const [mastered, setMastered] = useState<string[]>(() => loadMastered());
  const [dailyCount, setDailyCount] = useState<number>(() => loadDailyCount());
  const [queue, setQueue] = useState<string[]>([]);
  const [flipped, setFlipped] = useState(false);

  const addXpMutation = trpc.community.addXp.useMutation();

  const levelCards = useMemo(
    () => FLASHCARDS_DECK.filter(c => c.level === level),
    [level]
  );

  // Build study queue whenever level changes
  useEffect(() => {
    const unmastered = levelCards
      .filter(c => !mastered.includes(c.id))
      .map(c => c.id);
    setQueue(unmastered.length > 0 ? unmastered : levelCards.map(c => c.id));
    setFlipped(false);
  }, [level]);

  const currentCard = useMemo(
    () => FLASHCARDS_DECK.find(c => c.id === queue[0]) ?? null,
    [queue]
  );

  const levelMasteredCount = levelCards.filter(c =>
    mastered.includes(c.id)
  ).length;
  const totalMastered = mastered.length;
  const dailyGoal = 5;
  const dailyPercent = Math.min(100, Math.round((dailyCount / dailyGoal) * 100));

  const persistMastered = (next: string[]) => {
    setMastered(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore storage quota errors
    }
  };

  const bumpDailyCount = () => {
    const next = dailyCount + 1;
    setDailyCount(next);
    try {
      localStorage.setItem(
        DAILY_KEY,
        JSON.stringify({ date: todayKey(), count: next })
      );
    } catch {
      // ignore
    }
    return next;
  };

  const handleMarkKnown = () => {
    if (!currentCard) return;
    soundEffects.playCorrect();

    const alreadyMastered = mastered.includes(currentCard.id);
    if (!alreadyMastered) {
      persistMastered([...mastered, currentCard.id]);
    }

    const nextDaily = bumpDailyCount();
    awardXP(10);
    if (user) {
      addXpMutation.mutate({
        amount: 10,
        questId: `flashcard_${currentCard.id}`,
      });
    }

    if (nextDaily === dailyGoal) {
      soundEffects.playTrophy();
      toast.success("🔥 عاش يا بطل! خلّصت هدفك اليومي (5 كلمات) وكسبت +50 XP!");
    } else {
      toast.success("ممتاز! +10 XP أُضيفت لرصيدك ⚡");
    }

    setFlipped(false);
    setQueue(prev => prev.slice(1));
  };

  const handleReviewAgain = () => {
    if (!currentCard) return;
    soundEffects.playClick();
    setFlipped(false);
    setQueue(prev => {
      if (prev.length <= 1) return prev;
      const [first, ...rest] = prev;
      const insertAt = Math.min(2, rest.length);
      return [...rest.slice(0, insertAt), first, ...rest.slice(insertAt)];
    });
    toast.info("تمام! هنرجّعلك الكلمة دي بعد شوية عشان تثبت 💪");
  };

  const handleRestartLevel = () => {
    setQueue(levelCards.map(c => c.id));
    setFlipped(false);
  };

  return (
    <PageShell>
      {/* Hero */}
      <section className="border-b border-line bg-paper-deep/60">
        <div className="container py-8 sm:py-10">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <Eyebrow>مراجعة ذكية بالصوت</Eyebrow>
              <h1 className="mt-2 text-2xl font-bold text-ink sm:text-4xl">
                فلاش كاردز <span className="hl-word">الكلمات اليومية.</span>
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-soft">
                راجع 5 كلمات يومياً بالنطق الأمريكي الصحيح والمثال المصري — وكل
                كلمة تحفظها بتزوّد نقاطك في ساحة المسابقات وتحافظ على شعلة
                حماستك 🔥
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-2 rounded-2xl border border-amber-300/60 bg-amber-50/80 px-4 py-2.5 dark:border-amber-800/60 dark:bg-amber-950/30">
                <Flame className="size-5 fill-amber-500 text-amber-500" />
                <div>
                  <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                    هدف النهارده
                  </p>
                  <p className="latin text-sm font-black text-ink">
                    {Math.min(dailyCount, dailyGoal)} / {dailyGoal} كلمات (
                    {dailyPercent}%)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-2xl border border-line bg-card px-4 py-2.5">
                <CheckCircle2 className="size-5 text-emerald-500" />
                <div>
                  <p className="text-[11px] text-ink-soft">إجمالي المحفوظ</p>
                  <p className="latin text-sm font-black text-ink">
                    {totalMastered} / {FLASHCARDS_DECK.length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Level selector */}
          <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {LEVELS.map(lvl => {
              const meta = FLASHCARD_LEVEL_META[lvl];
              const count = FLASHCARDS_DECK.filter(c => c.level === lvl).length;
              const done = FLASHCARDS_DECK.filter(
                c => c.level === lvl && mastered.includes(c.id)
              ).length;
              const active = level === lvl;
              return (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setLevel(lvl)}
                  className={cn(
                    "rounded-2xl border p-3 text-start transition",
                    active
                      ? "border-iris bg-iris-soft/70 shadow-sm"
                      : "border-line bg-card hover:border-iris/40"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-ink">
                      {meta.label}
                    </span>
                    <span className="latin text-xs font-semibold text-iris">
                      {done}/{count}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-1 text-[11px] text-ink-soft">
                    {meta.subtitle}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Active Flashcard Arena */}
      <section className="container py-8 sm:py-12">
        <div className="mx-auto max-w-2xl">
          {/* Progress header */}
          <div className="mb-4 flex items-center justify-between text-xs text-ink-soft">
            <span>
              تقدّم مستوى <b className="latin text-ink">{level}</b>:{" "}
              <b className="latin text-iris">
                {levelMasteredCount} / {levelCards.length}
              </b>
            </span>
            <span>
              متبقي في الجلسة:{" "}
              <b className="latin text-ink">{queue.length}</b> بطاقة
            </span>
          </div>
          <div className="mb-6 h-2 overflow-hidden rounded-full bg-paper-deep">
            <div
              className="h-full rounded-full bg-gradient-to-l from-iris to-emerald-500 transition-all duration-300"
              style={{
                width: `${Math.round((levelMasteredCount / Math.max(1, levelCards.length)) * 100)}%`,
              }}
            />
          </div>

          {currentCard ? (
            <>
              {/* Interactive Flip Card */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => {
                  soundEffects.playClick();
                  setFlipped(prev => !prev);
                }}
                onKeyDown={e => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setFlipped(prev => !prev);
                  }
                }}
                className={cn(
                  "relative min-h-[340px] cursor-pointer select-none rounded-3xl border-2 p-6 sm:p-8 shadow-md transition-all",
                  flipped
                    ? "border-emerald-500/50 bg-gradient-to-br from-emerald-500/[0.06] via-card to-iris/[0.05]"
                    : "border-iris/30 bg-card hover:border-iris/60"
                )}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-bold",
                      FLASHCARD_LEVEL_META[currentCard.level].badgeClass
                    )}
                  >
                    {FLASHCARD_LEVEL_META[currentCard.level].label} ·{" "}
                    <span className="latin">{currentCard.partOfSpeech}</span>
                  </span>
                  <span className="rounded-full bg-paper-deep px-3 py-1 text-[11px] font-semibold text-ink-soft">
                    {flipped ? "الوجه الخلفي — المعنى والمثال" : "اضغط لقلب البطاقة 👆"}
                  </span>
                </div>

                {!flipped ? (
                  <div className="flex min-h-[230px] flex-col items-center justify-center text-center">
                    <h2
                      className="latin text-3xl font-black tracking-tight text-ink sm:text-5xl"
                      dir="ltr"
                    >
                      {currentCard.word}
                    </h2>
                    <p
                      className="latin mt-2 text-sm text-ink-soft sm:text-base"
                      dir="ltr"
                    >
                      {currentCard.phonetic}
                    </p>

                    <div
                      className="mt-6 flex flex-wrap items-center justify-center gap-2"
                      onClick={e => e.stopPropagation()}
                    >
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => speakText(currentCard.word, 0.95)}
                        className="rounded-full bg-iris text-white hover:bg-iris-deep"
                      >
                        <Volume2 className="me-1.5 size-4" /> اسمع النطق
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => speakText(currentCard.word, 0.65)}
                        className="rounded-full"
                      >
                        🐢 نطق بطيء
                      </Button>
                    </div>

                    <p className="mt-6 text-xs text-ink-soft">
                      حاول تفتكر معناها الأول، وبعدين اضغط على البطاقة عشان تتأكد!
                    </p>
                  </div>
                ) : (
                  <div className="mt-5 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
                      <div>
                        <p className="text-xs font-semibold text-ink-soft">
                          المعنى بالمصري:
                        </p>
                        <h3 className="mt-0.5 text-2xl font-black text-emerald-700 dark:text-emerald-300">
                          {currentCard.meaningAr}
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          speakText(currentCard.word, 0.95);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-full border border-line bg-paper px-3 py-1.5 text-xs font-bold text-ink hover:border-iris"
                      >
                        <Volume2 className="size-3.5 text-iris" />
                        <span className="latin" dir="ltr">
                          {currentCard.word}
                        </span>
                      </button>
                    </div>

                    <div className="rounded-2xl border border-line bg-paper-deep/60 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className="latin text-sm font-bold text-ink sm:text-base"
                          dir="ltr"
                        >
                          “{currentCard.exampleEn}”
                        </p>
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            speakText(currentCard.exampleEn, 0.92);
                          }}
                          aria-label="اسمع المثال بالصوت"
                          className="grid size-8 shrink-0 place-items-center rounded-full bg-iris-soft text-iris hover:bg-iris hover:text-white"
                        >
                          <Volume2 className="size-4" />
                        </button>
                      </div>
                      <p className="mt-2 text-xs leading-relaxed text-ink-soft sm:text-sm">
                        {currentCard.exampleAr}
                      </p>
                    </div>

                    <div className="flex items-start gap-2 rounded-2xl border border-amber-400/40 bg-amber-500/10 p-3.5 text-xs leading-relaxed text-amber-900 dark:text-amber-200">
                      <Sparkles className="mt-0.5 size-4 shrink-0 text-amber-500" />
                      <p>
                        <b>نصيحة Link Me:</b> {currentCard.tipAr}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Controls */}
              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReviewAgain}
                  className="h-12 rounded-2xl border-line text-sm font-bold"
                >
                  <RotateCcw className="me-2 size-4" />
                  لسه صعبة — راجعها تاني
                </Button>
                <Button
                  type="button"
                  onClick={handleMarkKnown}
                  className="h-12 rounded-2xl bg-emerald-600 text-sm font-bold text-white shadow-sm hover:bg-emerald-700"
                >
                  <Zap className="me-2 size-4 fill-amber-300 text-amber-300" />
                  حفظتها! (+10 XP) ✅
                </Button>
              </div>
            </>
          ) : (
            <div className="rounded-3xl border border-emerald-500/40 bg-emerald-500/10 p-8 text-center">
              <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-emerald-500/20 text-3xl">
                🎉
              </div>
              <h2 className="mt-4 text-2xl font-black text-ink">
                أبدعت! خلّصت كل بطاقات مستوى {level}!
              </h2>
              <p className="mt-2 text-sm text-ink-soft">
                كل النقاط اللي جمّعتها اتضافت لرصيدك في ساحة المسابقات. جاهز
                تجرب المستوى اللي بعده أو تشوف ترتيبك؟
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleRestartLevel}
                  className="rounded-full"
                >
                  <RotateCcw className="me-2 size-4" /> مراجعة المستوى من الأول
                </Button>
                <Button
                  asChild
                  className="rounded-full bg-iris text-white hover:bg-iris-deep"
                >
                  <Link href="/competitions">
                    <Trophy className="me-2 size-4" /> شوف ترتيبك في المسابقات
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>
    </PageShell>
  );
}
