import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import {
  CheckCircle2,
  Crown,
  Flame,
  Lock,
  Printer,
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
const LEVELS: FlashcardLevel[] = [
  "A1",
  "A2",
  "B1",
  "B2",
  "C1",
  "IELTS",
  "BUSINESS",
  "IDIOMS",
];

const DECK_VISUALS: Record<
  FlashcardLevel,
  { bg: string; overlay: string; activeRing: string; barColor: string }
> = {
  A1: {
    bg: "/img/ui/deck-a1.webp",
    overlay: "from-[#0a1b33]/92 via-[#122e5c]/78 to-[#1e40af]/55",
    activeRing: "ring-2 ring-sky-300 border-sky-300",
    barColor: "bg-sky-300",
  },
  A2: {
    bg: "/img/ui/deck-a2.webp",
    overlay: "from-[#08263b]/92 via-[#0f4466]/78 to-[#0284c7]/55",
    activeRing: "ring-2 ring-cyan-300 border-cyan-300",
    barColor: "bg-cyan-300",
  },
  B1: {
    bg: "/img/ui/deck-b1.webp",
    overlay: "from-[#062b26]/92 via-[#0c4d42]/78 to-[#0d9488]/55",
    activeRing: "ring-2 ring-emerald-300 border-emerald-300",
    barColor: "bg-emerald-300",
  },
  B2: {
    bg: "/img/ui/deck-b2.webp",
    overlay: "from-[#181342]/92 via-[#2b206e]/78 to-[#4f46e5]/55",
    activeRing: "ring-2 ring-indigo-300 border-indigo-300",
    barColor: "bg-indigo-300",
  },
  C1: {
    bg: "/img/ui/deck-c1.webp",
    overlay: "from-[#2b1404]/92 via-[#5c2b09]/80 to-[#b45309]/55",
    activeRing: "ring-2 ring-amber-300 border-amber-300",
    barColor: "bg-amber-300",
  },
  IELTS: {
    bg: "/img/ui/deck-ielts.webp",
    overlay: "from-[#330d12]/92 via-[#6b1925]/80 to-[#b91c1c]/55",
    activeRing: "ring-2 ring-rose-300 border-rose-300",
    barColor: "bg-amber-300",
  },
  BUSINESS: {
    bg: "/img/ui/deck-business.webp",
    overlay: "from-[#0d1d3a]/92 via-[#22355c]/80 to-[#b45309]/60",
    activeRing: "ring-2 ring-amber-300 border-amber-300",
    barColor: "bg-amber-300",
  },
  IDIOMS: {
    bg: "/img/ui/deck-idioms.webp",
    overlay: "from-[#220e42]/92 via-[#451a7a]/80 to-[#9333ea]/55",
    activeRing: "ring-2 ring-fuchsia-300 border-fuchsia-300",
    barColor: "bg-fuchsia-300",
  },
};

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
  const { data: gameProfile } = trpc.community.myGameProfile.useQuery(
    undefined,
    { enabled: Boolean(user) }
  );
  const isVip = Boolean(gameProfile?.isVip);
  const isLevelLocked = Boolean(FLASHCARD_LEVEL_META[level].isPro) && !isVip;

  const handlePrintPdfSheet = () => {
    if (!isVip) {
      toast.info("تحميل ملخص الكلمات للطباعة (PDF) ميزة حصرية لمشتركي PRO 👑");
      return;
    }
    const rows = levelCards
      .map(
        (c, i) => `
      <tr>
        <td>${i + 1}</td>
        <td style="direction:ltr;font-weight:700">${c.word}<br/><small style="color:#64748b">${c.phonetic}</small></td>
        <td>${c.meaningAr}</td>
        <td style="direction:ltr">${c.exampleEn}<br/><small style="color:#475569;direction:rtl;display:block">${c.exampleAr}</small></td>
      </tr>`
      )
      .join("");
    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) return;
    win.document.write(`<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>Link Me Flashcards — ${level}</title>
      <style>body{font-family:Tahoma,Arial,sans-serif;padding:24px;color:#0f172a}h1{color:#2563ff;margin-bottom:4px}table{width:100%;border-collapse:collapse;margin-top:16px}th,td{border:1px solid #cbd5e1;padding:10px;text-align:right;font-size:13px}th{background:#eff6ff}</style>
      </head><body><h1>ملخص كلمات Link Me PRO — مستوى ${level}</h1><p>مطبوع خصيصاً لعضو PRO 👑 · link-me.tech</p>
      <table><thead><tr><th>#</th><th>الكلمة والنطق</th><th>المعنى بالمصري</th><th>مثال عملي</th></tr></thead><tbody>${rows}</tbody></table>
      <script>window.onload=function(){window.print()}</script></body></html>`);
    win.document.close();
  };

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

  // Preload next flashcard's realistic photo so switching cards is instantaneous
  useEffect(() => {
    const nextId = queue[1];
    if (!nextId) return;
    const img = new Image();
    img.src = `/flashcards/${nextId}.webp`;
  }, [queue]);

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
      {/* Hero — Rich Link Me Royal Editorial Banner */}
      <section className="relative overflow-hidden border-b border-iris/25 bg-gradient-to-br from-[#0e2248] via-[#173673] to-[#1e40af] text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(640px circle at 85% 15%, rgba(56, 189, 248, 0.22), transparent 60%), radial-gradient(520px circle at 10% 90%, rgba(251, 191, 36, 0.16), transparent 60%)",
          }}
        />
        <div className="container relative py-8 sm:py-10">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-bold text-amber-300">
                <Sparkles className="size-3.5" /> مراجعة ذكية بالصوت · 180 بطاقة
              </span>
              <h1 className="mt-2.5 text-2xl font-extrabold text-white sm:text-4xl">
                فلاش كاردز <span className="text-sky-300">الكلمات اليومية.</span>
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/80">
                راجع 5 كلمات يومياً بالنطق الأمريكي الصحيح والمثال المصري — وكل
                كلمة تحفظها بتزوّد نقاطك في ساحة المسابقات وتحافظ على شعلة
                حماستك 🔥
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-2.5 rounded-2xl border border-amber-300/35 bg-black/25 px-4 py-2.5">
                <Flame className="size-5 fill-amber-400 text-amber-400" />
                <div>
                  <p className="text-[11px] font-semibold text-amber-200">
                    هدف النهارده
                  </p>
                  <p className="latin text-sm font-black text-white">
                    {Math.min(dailyCount, dailyGoal)} / {dailyGoal} كلمات (
                    {dailyPercent}%)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 rounded-2xl border border-white/20 bg-white/10 px-4 py-2.5">
                <CheckCircle2 className="size-5 text-emerald-300" />
                <div>
                  <p className="text-[11px] text-white/75">إجمالي المحفوظ</p>
                  <p className="latin text-sm font-black text-white">
                    {totalMastered} / {FLASHCARDS_DECK.length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Level selector — Branded Photographic Visual Cards (Zero Flat White!) */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {LEVELS.map(lvl => {
              const meta = FLASHCARD_LEVEL_META[lvl];
              const visual = DECK_VISUALS[lvl];
              const count = FLASHCARDS_DECK.filter(c => c.level === lvl).length;
              const done = FLASHCARDS_DECK.filter(
                c => c.level === lvl && mastered.includes(c.id)
              ).length;
              const pct = Math.round((done / Math.max(1, count)) * 100);
              const active = level === lvl;
              const locked = Boolean(meta.isPro) && !isVip;
              return (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setLevel(lvl)}
                  className={cn(
                    "group relative flex min-h-[104px] flex-col justify-between overflow-hidden rounded-2xl border p-3.5 text-start text-white shadow-sm transition-transform duration-200 hover:-translate-y-0.5",
                    active
                      ? `${visual.activeRing} shadow-lg`
                      : meta.isPro
                        ? "border-amber-300/45 hover:border-amber-300"
                        : "border-white/20 hover:border-white/50"
                  )}
                >
                  <img
                    src={visual.bg}
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div
                    aria-hidden="true"
                    className={cn(
                      "absolute inset-0 bg-gradient-to-t",
                      visual.overlay
                    )}
                  />

                  <div className="relative flex items-center justify-between gap-2">
                    <span className="text-sm font-extrabold text-white drop-shadow-xs">
                      {meta.label}
                    </span>
                    {locked ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/90 px-2 py-0.5 text-[10px] font-black text-white shadow-xs">
                        <Lock className="size-2.5" /> PRO
                      </span>
                    ) : (
                      <span className="latin rounded-full bg-black/40 px-2 py-0.5 text-[11px] font-bold text-sky-200">
                        {done}/{count}
                      </span>
                    )}
                  </div>

                  <div className="relative mt-2">
                    <p className="line-clamp-1 text-[11px] font-medium text-white/85">
                      {meta.subtitle}
                    </p>
                    <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/20">
                      <div
                        className={cn("h-full rounded-full", visual.barColor)}
                        style={{ width: `${Math.max(active ? 12 : 0, pct)}%` }}
                      />
                    </div>
                  </div>
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
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-xs text-ink-soft">
            <span>
              تقدّم مستوى <b className="latin text-ink">{level}</b>:{" "}
              <b className="latin text-iris">
                {levelMasteredCount} / {levelCards.length}
              </b>
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handlePrintPdfSheet}
                className="h-8 rounded-full border-amber-400/50 bg-amber-500/10 px-3 text-[11px] font-bold text-amber-800 hover:bg-amber-500/20 dark:text-amber-300"
              >
                <Printer className="me-1.5 size-3.5" />
                ملخص PDF للطباعة {isVip ? "✓" : "👑 PRO"}
              </Button>
              <span>
                متبقي: <b className="latin text-ink">{queue.length}</b>
              </span>
            </div>
          </div>
          <div className="mb-6 h-2 overflow-hidden rounded-full bg-paper-deep">
            <div
              className="h-full rounded-full bg-gradient-to-l from-iris to-emerald-500 transition-all duration-300"
              style={{
                width: `${Math.round((levelMasteredCount / Math.max(1, levelCards.length)) * 100)}%`,
              }}
            />
          </div>

          {isLevelLocked ? (
            <div className="rounded-3xl border-2 border-amber-400/50 bg-gradient-to-br from-amber-500/10 via-card to-iris/5 p-8 text-center shadow-sm">
              <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-amber-500/20 text-3xl">
                👑
              </div>
              <h2 className="mt-4 text-2xl font-black text-ink">
                حزمة «{FLASHCARD_LEVEL_META[level].label}» حصرية لمشتركي PRO!
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-soft">
                افتح 84 بطاقة متقدمة (C1 + IELTS Band 8+ + بزنس وفريلانس +
                تعبيرات Native) مع النطق الأمريكي ومضاعفة النقاط 2x XP وتحميل
                ملخصات PDF للطباعة فوراً!
              </p>
              <Button
                asChild
                className="mt-6 h-12 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-7 text-sm font-bold text-white hover:from-amber-600 hover:to-orange-600"
              >
                <Link href="/pricing">
                  <Crown className="me-2 size-4" /> اشترك في PRO وافتح كل
                  المزايا 👑
                </Link>
              </Button>
            </div>
          ) : currentCard ? (
            <>
              {/* Interactive Flip Card — Unique Realistic Word Photo + Link Me Brand Overlay */}
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
                  "group relative min-h-[370px] cursor-pointer select-none overflow-hidden rounded-3xl border-2 p-6 sm:p-8 text-white shadow-xl transition-colors",
                  flipped
                    ? "border-emerald-400/70"
                    : FLASHCARD_LEVEL_META[currentCard.level].isPro
                      ? "border-amber-400/75"
                      : "border-iris/50 hover:border-sky-400"
                )}
              >
                {/* Unique Realistic Background Photo Describing This Exact Word */}
                <img
                  key={currentCard.id}
                  src={`/flashcards/${currentCard.id}.webp`}
                  alt={currentCard.word}
                  decoding="async"
                  onError={e => {
                    e.currentTarget.src = DECK_VISUALS[currentCard.level].bg;
                  }}
                  className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                />
                {/* Link Me Brand Color-Graded Overlay (keeps photo clear AND text razor-sharp) */}
                <div
                  aria-hidden="true"
                  className={cn(
                    "absolute inset-0 bg-gradient-to-t transition-opacity duration-300",
                    flipped
                      ? "from-[#04241e]/94 via-[#09362e]/84 to-[#0a1b33]/72"
                      : DECK_VISUALS[currentCard.level].overlay
                  )}
                />
                <div
                  aria-hidden="true"
                  className={cn(
                    "absolute inset-x-0 top-0 h-1.5",
                    flipped
                      ? "bg-gradient-to-r from-emerald-400 to-teal-300"
                      : FLASHCARD_LEVEL_META[currentCard.level].isPro
                        ? "bg-gradient-to-r from-amber-400 via-yellow-300 to-orange-400"
                        : "bg-gradient-to-r from-sky-400 via-iris to-indigo-400"
                  )}
                />

                <div className="relative flex flex-wrap items-center justify-between gap-2">
                  <span className="rounded-full border border-white/25 bg-black/50 px-3 py-1 text-xs font-bold text-white">
                    {FLASHCARD_LEVEL_META[currentCard.level].label} ·{" "}
                    <span className="latin text-sky-200">
                      {currentCard.partOfSpeech}
                    </span>
                  </span>
                  <span className="rounded-full border border-white/20 bg-black/45 px-3 py-1 text-[11px] font-semibold text-white/90">
                    {flipped
                      ? "الوجه الخلفي — المعنى والمثال"
                      : "اضغط لقلب البطاقة 👆"}
                  </span>
                </div>

                {!flipped ? (
                  <div className="relative flex min-h-[260px] flex-col items-center justify-center text-center">
                    <h2
                      className="latin text-3xl font-black tracking-tight text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.55)] sm:text-5xl"
                      dir="ltr"
                    >
                      {currentCard.word}
                    </h2>
                    <p
                      className="latin mt-2.5 rounded-full bg-black/35 px-3.5 py-1 text-sm font-semibold text-sky-200 sm:text-base"
                      dir="ltr"
                    >
                      {currentCard.phonetic}
                    </p>

                    <div
                      className="mt-6 flex flex-wrap items-center justify-center gap-2.5"
                      onClick={e => e.stopPropagation()}
                    >
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => speakText(currentCard.word, 0.95)}
                        className="h-10 rounded-full bg-iris px-5 font-bold text-white shadow-md hover:bg-iris-deep"
                      >
                        <Volume2 className="me-1.5 size-4" /> اسمع النطق
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => speakText(currentCard.word, 0.65)}
                        className="h-10 rounded-full border-white/35 bg-black/45 px-4 font-bold text-white hover:bg-white hover:text-[#0a1b33]"
                      >
                        🐢 نطق بطيء
                      </Button>
                    </div>

                    <p className="mt-6 rounded-full bg-black/35 px-4 py-1.5 text-xs font-medium text-white/90">
                      حاول تفتكر معناها الأول، وبعدين اضغط على البطاقة عشان تتأكد!
                    </p>
                  </div>
                ) : (
                  <div className="relative mt-5 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/20 pb-3">
                      <div>
                        <p className="text-xs font-semibold text-emerald-200/90">
                          المعنى بالمصري:
                        </p>
                        <h3 className="mt-0.5 text-2xl font-black text-emerald-300 drop-shadow-xs sm:text-3xl">
                          {currentCard.meaningAr}
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          speakText(currentCard.word, 0.95);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-black/45 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-white hover:text-[#0a1b33]"
                      >
                        <Volume2 className="size-3.5 text-sky-300" />
                        <span className="latin" dir="ltr">
                          {currentCard.word}
                        </span>
                      </button>
                    </div>

                    <div className="rounded-2xl border border-white/20 bg-black/45 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className="latin text-sm font-bold text-white sm:text-base"
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
                          className="grid size-8 shrink-0 place-items-center rounded-full bg-iris text-white hover:bg-iris-deep"
                        >
                          <Volume2 className="size-4" />
                        </button>
                      </div>
                      <p className="mt-2 text-xs leading-relaxed text-white/85 sm:text-sm">
                        {currentCard.exampleAr}
                      </p>
                    </div>

                    <div className="flex items-start gap-2 rounded-2xl border border-amber-300/40 bg-amber-950/60 p-3.5 text-xs leading-relaxed text-amber-100">
                      <Sparkles className="mt-0.5 size-4 shrink-0 text-amber-300" />
                      <p>
                        <b className="text-amber-300">نصيحة Link Me:</b>{" "}
                        {currentCard.tipAr}
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
