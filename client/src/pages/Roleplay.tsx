import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import {
  ArrowRight,
  CheckCircle2,
  Crown,
  Lock,
  Mic,
  MicOff,
  RotateCcw,
  Search,
  Sparkles,
  Star,
  Trophy,
  Volume2,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useCompanion } from "@/components/companion";
import { trpc } from "@/lib/trpc";
import { awardXP } from "@/lib/gamification";
import { soundEffects } from "@/lib/sound-effects";
import { triggerConfetti } from "@/lib/confetti";
import { IncomingCallButton } from "@/components/incoming-call-modal";
import { cn } from "@/lib/utils";
import {
  ROLEPLAY_CATEGORIES,
  ROLEPLAY_LEVELS,
  ROLEPLAY_SCENARIOS,
  type RoleplayCategory,
  type RoleplayLevel,
  type RoleplayOption,
  type RoleplayScenario,
} from "@shared/roleplay-scenarios";

export const UNIQUE_SCENARIO_PHOTOS = [
  "/img/scenarios/scenario-1.webp",
  "/img/scenarios/scenario-2.webp",
  "/img/scenarios/scenario-3.webp",
  "/img/scenarios/scenario-4.webp",
  "/img/scenarios/scenario-5.webp",
  "/img/scenarios/scenario-6.webp",
  "/img/scenarios/scenario-7.webp",
  "/img/scenarios/scenario-8.webp",
  "/img/scenarios/scenario-9.webp",
  "/img/scenarios/scenario-10.webp",
  "/img/scenarios/scenario-11.webp",
  "/img/scenarios/scenario-12.webp",
  "/img/scenarios/scenario-13.webp",
  "/img/scenarios/scenario-14.webp",
  "/img/scenarios/scenario-15.webp",
  "/img/scenarios/scenario-16.webp",
  "/img/business.webp",
  "/img/cafe.webp",
  "/img/hero.webp",
  "/img/ielts.webp",
  "/img/mall.webp",
  "/img/ui/tool-roleplay.webp",
  "/img/online.webp",
  "/img/pronunciation.webp",
  "/img/travel.webp",
  "/img/writing.webp",
] as const;

export const CATEGORY_SCENARIO_PHOTOS: Record<string, string[]> = {
  work: [
    "/img/scenarios/scenario-1.webp",
    "/img/business.webp",
    "/img/scenarios/scenario-5.webp",
    "/img/scenarios/scenario-9.webp",
    "/img/scenarios/scenario-13.webp",
    "/img/ui/tool-roleplay.webp",
  ],
  travel: [
    "/img/travel.webp",
    "/img/scenarios/scenario-2.webp",
    "/img/scenarios/scenario-6.webp",
    "/img/scenarios/scenario-10.webp",
    "/img/scenarios/scenario-14.webp",
  ],
  cafe_food: [
    "/img/cafe.webp",
    "/img/scenarios/scenario-3.webp",
    "/img/scenarios/scenario-7.webp",
    "/img/scenarios/scenario-11.webp",
    "/img/scenarios/scenario-15.webp",
  ],
  tech_freelance: [
    "/img/online.webp",
    "/img/scenarios/scenario-4.webp",
    "/img/scenarios/scenario-8.webp",
    "/img/scenarios/scenario-12.webp",
    "/img/scenarios/scenario-16.webp",
  ],
  study_ielts: [
    "/img/ielts.webp",
    "/img/writing.webp",
    "/img/pronunciation.webp",
    "/img/scenarios/scenario-1.webp",
    "/img/scenarios/scenario-9.webp",
  ],
  shopping: [
    "/img/mall.webp",
    "/img/scenarios/scenario-3.webp",
    "/img/scenarios/scenario-7.webp",
    "/img/scenarios/scenario-11.webp",
  ],
  health: [
    "/img/scenarios/scenario-2.webp",
    "/img/scenarios/scenario-6.webp",
    "/img/scenarios/scenario-10.webp",
    "/img/scenarios/scenario-14.webp",
  ],
  finance_legal: [
    "/img/business.webp",
    "/img/scenarios/scenario-4.webp",
    "/img/scenarios/scenario-8.webp",
    "/img/scenarios/scenario-12.webp",
  ],
  social: [
    "/img/cafe.webp",
    "/img/scenarios/scenario-5.webp",
    "/img/scenarios/scenario-9.webp",
    "/img/scenarios/scenario-13.webp",
    "/img/scenarios/scenario-15.webp",
  ],
  daily: [
    "/img/scenarios/scenario-1.webp",
    "/img/scenarios/scenario-2.webp",
    "/img/scenarios/scenario-3.webp",
    "/img/scenarios/scenario-4.webp",
    "/img/scenarios/scenario-5.webp",
    "/img/scenarios/scenario-6.webp",
    "/img/scenarios/scenario-7.webp",
    "/img/scenarios/scenario-8.webp",
    "/img/scenarios/scenario-9.webp",
    "/img/scenarios/scenario-10.webp",
    "/img/scenarios/scenario-11.webp",
    "/img/scenarios/scenario-12.webp",
    "/img/scenarios/scenario-13.webp",
    "/img/scenarios/scenario-14.webp",
    "/img/scenarios/scenario-15.webp",
    "/img/scenarios/scenario-16.webp",
  ],
};

export function getScenarioCoverImage(
  scenario: { id: string; category?: string; imageUrl?: string },
  index?: number
): string {
  // Deterministic cycling across the 26 unique photos in any filtered view
  // Guarantees zero adjacent or row duplicates across the entire grid
  if (typeof index === "number" && index >= 0) {
    return UNIQUE_SCENARIO_PHOTOS[index % UNIQUE_SCENARIO_PHOTOS.length];
  }
  // For modal/sheet views: scenario id hash ensures a consistent unique photo
  let hash = 0;
  for (let i = 0; i < scenario.id.length; i++) {
    hash = ((hash << 5) - hash + scenario.id.charCodeAt(i)) | 0;
  }
  return UNIQUE_SCENARIO_PHOTOS[Math.abs(hash) % UNIQUE_SCENARIO_PHOTOS.length];
}

function speakEnglish(text: string, rate = 0.94) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "en-US";
    utter.rate = rate;
    window.speechSynthesis.speak(utter);
  } catch {
    // ignore speech synthesis errors
  }
}

export default function Roleplay() {
  const { user } = useAuth();
  const { companion } = useCompanion();
  const addXpMutation = trpc.community.addXp.useMutation();
  const { data: gameProfile } = trpc.community.myGameProfile.useQuery(
    undefined,
    { enabled: Boolean(user) }
  );
  const isVip = Boolean(gameProfile?.isVip);

  const [allScenarios, setAllScenarios] =
    useState<RoleplayScenario[]>(ROLEPLAY_SCENARIOS);
  const [loadingVault, setLoadingVault] = useState(true);
  const [activeScenario, setActiveScenario] = useState<RoleplayScenario | null>(
    null
  );
  const [selectedLevel, setSelectedLevel] = useState<"all" | RoleplayLevel>(
    "all"
  );
  const [selectedCategory, setSelectedCategory] = useState<
    "all" | RoleplayCategory
  >("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(18);
  const [turnIndex, setTurnIndex] = useState(0);
  const [pickedOption, setPickedOption] = useState<RoleplayOption | null>(null);
  const [scores, setScores] = useState<number[]>([]);
  const [finished, setFinished] = useState(false);
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [savedIds, setSavedIds] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem("linkme_saved_scenarios");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const toggleSaveScenario = (id: string) => {
    setSavedIds(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      try {
        localStorage.setItem("linkme_saved_scenarios", JSON.stringify(next));
      } catch {}
      if (!prev.includes(id)) {
        soundEffects.playCorrect();
        toast.success("تم حفظ الموقف في قائمتك المفضلة ⭐");
      } else {
        toast.info("تمت إزالة الموقف من المفضلة");
      }
      return next;
    });
  };

  // Lazy-load the complete 1,000-scenario vault ONLY when visiting /roleplay (keeps rest of site ultra-light!)
  useEffect(() => {
    let active = true;
    fetch("/data/roleplay-1000.json")
      .then(res => (res.ok ? res.json() : null))
      .then((data: RoleplayScenario[] | null) => {
        if (active && Array.isArray(data) && data.length > 0) {
          setAllScenarios(data);
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setLoadingVault(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const filteredScenarios = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allScenarios.filter(s => {
      if (showSavedOnly && !savedIds.includes(s.id)) return false;
      if (selectedLevel !== "all" && s.level !== selectedLevel) return false;
      if (selectedCategory !== "all" && s.category !== selectedCategory)
        return false;
      if (!q) return true;
      return (
        s.titleAr.toLowerCase().includes(q) ||
        s.titleEn.toLowerCase().includes(q) ||
        s.settingAr.toLowerCase().includes(q) ||
        s.partnerName.toLowerCase().includes(q)
      );
    });
  }, [allScenarios, selectedLevel, selectedCategory, searchQuery, showSavedOnly, savedIds]);

  const levelCounts = useMemo(() => {
    const counts: Record<string, number> = { all: allScenarios.length };
    for (const s of allScenarios) {
      counts[s.level] = (counts[s.level] || 0) + 1;
    }
    return counts;
  }, [allScenarios]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of allScenarios) {
      if (selectedLevel !== "all" && s.level !== selectedLevel) continue;
      counts.all = (counts.all || 0) + 1;
      if (s.category) counts[s.category] = (counts[s.category] || 0) + 1;
    }
    return counts;
  }, [allScenarios, selectedLevel]);

  const proTotal = useMemo(
    () => allScenarios.filter(s => s.isPro).length,
    [allScenarios]
  );

  // Voice speaking practice for the chosen best response
  const [listening, setListening] = useState(false);
  const [spokenTranscript, setSpokenTranscript] = useState("");
  const recognitionRef = useRef<any>(null);

  const currentTurn = activeScenario?.turns[turnIndex] ?? null;

  useEffect(() => {
    if (activeScenario && currentTurn && !finished) {
      speakEnglish(currentTurn.promptEn);
    }
    return () => {
      try {
        recognitionRef.current?.stop?.();
      } catch {
        // ignore
      }
    };
  }, [activeScenario?.id, turnIndex, finished]);

  const startScenario = (scenario: RoleplayScenario) => {
    soundEffects.playClick();
    setActiveScenario(scenario);
    setTurnIndex(0);
    setPickedOption(null);
    setScores([]);
    setFinished(false);
    setSpokenTranscript("");
  };

  const handleSelectOption = (option: RoleplayOption) => {
    if (pickedOption) return;
    setPickedOption(option);
    setScores(prev => [...prev, option.score]);
    setSpokenTranscript("");

    if (option.quality === "best") {
      soundEffects.playCorrect();
      speakEnglish(option.textEn);
    } else if (option.quality === "good") {
      soundEffects.playClick();
    } else {
      soundEffects.playIncorrect();
    }
  };

  const handleNextTurn = () => {
    if (!activeScenario) return;
    if (turnIndex + 1 < activeScenario.turns.length) {
      setTurnIndex(prev => prev + 1);
      setPickedOption(null);
      setSpokenTranscript("");
    } else {
      setFinished(true);
      soundEffects.playTrophy();
      triggerConfetti(3000);
      awardXP(activeScenario.rewardXp, "audio_hero");
      if (user) {
        addXpMutation.mutate({
          amount: activeScenario.rewardXp,
          questId: `roleplay_${activeScenario.id}`,
        });
      }
      toast.success(
        `🎉 أبدعت! كسبت +${activeScenario.rewardXp} XP في محاكي المواقف!`
      );
    }
  };

  const toggleVoicePractice = () => {
    if (listening) {
      try {
        recognitionRef.current?.stop?.();
      } catch {
        // ignore
      }
      setListening(false);
      return;
    }

    const SpeechRecognitionCtor =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      toast.info("التعرف الصوتي متاح على متصفح Chrome و Edge");
      return;
    }

    const rec = new SpeechRecognitionCtor();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);
    rec.onerror = () => {
      setListening(false);
      toast.error("تأكد من السماح للمتصفح باستخدام الميكروفون");
    };
    rec.onresult = (event: any) => {
      const text = event.results?.[0]?.[0]?.transcript ?? "";
      setSpokenTranscript(text);
      if (text) {
        soundEffects.playCorrect();
        toast.success("عاش على المحاولة الصوتية! 🎙️");
      }
    };
    recognitionRef.current = rec;
    rec.start();
  };

  const averageScore =
    scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0;

  return (
    <PageShell>
      {/* Hero — Deep Link Me Royal Editorial Banner */}
      <section className="relative overflow-hidden border-b border-iris/25 bg-gradient-to-br from-[#0e2248] via-[#173673] to-[#1e40af] text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(620px circle at 85% 20%, rgba(56, 189, 248, 0.22), transparent 60%), radial-gradient(500px circle at 12% 85%, rgba(251, 191, 36, 0.16), transparent 60%)",
          }}
        />
        <div className="container relative py-8 sm:py-10">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-bold text-amber-300">
                🎭 مكتبة {allScenarios.length.toLocaleString()} موقف حياتي بالصوت (A1–C2)
              </span>
              <h1 className="mt-2.5 text-2xl font-extrabold text-white sm:text-4xl">
                محاكي <span className="text-sky-300">الـ 1,000 موقف حقيقي.</span> 🎭
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/80">
                مقسمين بدقة على 6 مستويات (من مبتدئ A1 لحد Native C2) و10 مجالات
                حياتية حقيقية — اسمع الجملة، اختار أذكى رد، وجرّب تنطقه بصوتك مع{" "}
                {companion.name}!
              </p>
            </div>
            {activeScenario && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setActiveScenario(null)}
                className="rounded-full border-white/30 bg-white/10 text-white hover:bg-white hover:text-iris self-start sm:self-auto"
              >
                <ArrowRight className="me-1.5 size-4" /> كل المواقف
              </Button>
            )}
          </div>

          {/* 6 CEFR Level Selector Cards inside Hero */}
          {!activeScenario && (
            <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-7">
              {ROLEPLAY_LEVELS.map(lvl => {
                const active = selectedLevel === lvl.id;
                const count = levelCounts[lvl.id] ?? 0;
                return (
                  <button
                    key={lvl.id}
                    type="button"
                    onClick={() => {
                      soundEffects.playClick();
                      setSelectedLevel(lvl.id);
                      setVisibleCount(18);
                    }}
                    className={cn(
                      "rounded-2xl border p-3 text-start transition-colors",
                      active
                        ? "border-amber-300 bg-white text-[#0e2248] shadow-md"
                        : "border-white/20 bg-black/25 text-white hover:border-white/50 hover:bg-white/10"
                    )}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-extrabold">{lvl.label}</span>
                      <span
                        className={cn(
                          "latin rounded-full px-1.5 py-0.5 text-[10px] font-black",
                          active
                            ? "bg-iris text-white"
                            : "bg-white/15 text-amber-300"
                        )}
                      >
                        {count}
                      </span>
                    </div>
                    <p
                      className={cn(
                        "mt-1 line-clamp-1 text-[10px]",
                        active ? "text-ink-soft" : "text-white/75"
                      )}
                    >
                      {lvl.subtitle}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="container py-8 sm:py-10">
        {!activeScenario ? (
          <div className="space-y-6">
            {/* Search + Category Filter Pills + PRO Counter */}
            <div className="space-y-4 rounded-3xl border border-iris/20 bg-gradient-to-l from-iris-soft/50 via-card to-card p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative flex-1 max-w-md">
                  <Search className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={e => {
                      setSearchQuery(e.target.value);
                      setVisibleCount(18);
                    }}
                    placeholder="ابحث في 1,000 موقف (مطار، فندق، إنترفيو، دكتور، فريلانس...)"
                    className="h-10 w-full rounded-full border border-line bg-paper ps-10 pe-4 text-xs text-ink placeholder:text-ink-soft/75 focus:border-iris focus:outline-none sm:text-sm"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-amber-500/15 px-3 py-1.5 text-xs font-bold text-amber-800 dark:text-amber-300">
                    👑 {proTotal.toLocaleString()} موقف حصري لـ PRO من أصل{" "}
                    {allScenarios.length.toLocaleString()}
                  </span>
                  {!isVip && (
                    <Button
                      asChild
                      size="sm"
                      className="h-8 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-3.5 text-xs font-bold text-white hover:from-amber-600 hover:to-orange-600"
                    >
                      <Link href="/pricing">افتح الـ 1,000 موقف 👑</Link>
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playClick();
                    setShowSavedOnly(prev => !prev);
                    setVisibleCount(18);
                  }}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-bold transition-colors inline-flex items-center gap-1.5",
                    showSavedOnly
                      ? "border-amber-400 bg-amber-400 text-amber-950 shadow-xs"
                      : "border-line bg-paper text-ink-soft hover:border-amber-400/50 hover:text-ink"
                  )}
                >
                  <Star className={cn("size-3.5", showSavedOnly && "fill-amber-950")} />
                  <span>المفضلة ⭐ ({savedIds.length})</span>
                </button>
                {ROLEPLAY_CATEGORIES.map(cat => {
                  const count = categoryCounts[cat.id] ?? 0;
                  if (cat.id !== "all" && count === 0) return null;
                  const active = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        soundEffects.playClick();
                        setSelectedCategory(cat.id);
                        setVisibleCount(18);
                      }}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-xs font-bold transition-colors",
                        active
                          ? "border-iris bg-iris text-white shadow-xs"
                          : "border-line bg-paper text-ink-soft hover:border-iris/50 hover:text-ink"
                      )}
                    >
                      {cat.emoji} {cat.label} ({count})
                    </button>
                  );
                })}
              </div>
            </div>

            {loadingVault && allScenarios.length <= 22 && (
              <p className="text-center text-xs font-semibold text-iris">
                جارٍ تجهيز مكتبة الـ 1,000 موقف حياتي... ✨
              </p>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-ink-soft">
              <span>
                معروض <b className="latin text-ink">{Math.min(visibleCount, filteredScenarios.length)}</b>{" "}
                من أصل <b className="latin text-iris">{filteredScenarios.length.toLocaleString()}</b> موقف
              </span>
              <div className="flex items-center gap-2">
                <IncomingCallButton />
                {isVip && (
                  <span className="rounded-full bg-emerald-500/15 px-3 py-1 font-bold text-emerald-700 dark:text-emerald-300">
                    👑 حساب PRO مفعّل
                  </span>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredScenarios.slice(0, visibleCount).map((scenario, index) => {
              const locked = Boolean(scenario.isPro) && !isVip;
              const coverImg = getScenarioCoverImage(scenario, index);
              return (
                <div
                  key={scenario.id}
                  className={cn(
                    "group relative flex flex-col justify-between overflow-hidden rounded-3xl border bg-card shadow-sm transition-transform duration-200 hover:-translate-y-0.5 [content-visibility:auto]",
                    scenario.isPro
                      ? "border-amber-400/60"
                      : "border-line hover:border-iris/50"
                  )}
                >
                  <div>
                    {/* Clean Bright Lifestyle Photo Header (matching CourseCard editorial look!) */}
                    <div className="relative h-44 overflow-hidden bg-paper-deep">
                      <img
                        src={coverImg}
                        alt={scenario.titleEn}
                        loading="lazy"
                        decoding="async"
                        onError={e => {
                          e.currentTarget.src =
                            UNIQUE_SCENARIO_PHOTOS[
                              (index + 1) % UNIQUE_SCENARIO_PHOTOS.length
                            ];
                        }}
                        className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div
                        aria-hidden="true"
                        className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#091833]/85 via-[#091833]/35 to-transparent"
                      />
                      <div className="absolute inset-x-3 top-3 flex flex-wrap items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="latin rounded-full bg-iris-deep px-2.5 py-1 text-[10px] font-bold text-white shadow-xs">
                            {scenario.level}
                          </span>
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              toggleSaveScenario(scenario.id);
                            }}
                            aria-label={savedIds.includes(scenario.id) ? "إزالة من المفضلة" : "حفظ في المفضلة"}
                            className={cn(
                              "grid size-6 place-items-center rounded-full transition shadow-xs",
                              savedIds.includes(scenario.id)
                                ? "bg-amber-400 text-amber-950"
                                : "bg-black/40 text-white/80 hover:bg-black/60 hover:text-amber-300"
                            )}
                            title={savedIds.includes(scenario.id) ? "محفوظ في المفضلة ⭐" : "حفظ في المفضلة"}
                          >
                            <Star className={cn("size-3", savedIds.includes(scenario.id) && "fill-amber-950")} />
                          </button>
                        </div>
                        <div className="flex flex-wrap items-center gap-1">
                          {scenario.isPro ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-2.5 py-0.5 text-[10px] font-black text-white shadow-sm">
                              <Crown className="size-3" /> PRO
                            </span>
                          ) : (
                            <span className="rounded-full bg-emerald-600 px-2.5 py-0.5 text-[10px] font-black text-white shadow-sm">
                              مجاني ✨
                            </span>
                          )}
                          <span className="latin inline-flex items-center gap-0.5 rounded-full bg-paper/95 px-2 py-0.5 text-[10px] font-bold text-amber-700 shadow-xs dark:text-amber-300">
                            <Zap className="size-2.5 fill-amber-500 text-amber-500" />
                            +{isVip ? scenario.rewardXp * 2 : scenario.rewardXp}
                          </span>
                        </div>
                      </div>
                      <div className="absolute inset-x-4 bottom-2">
                        <p
                          className="latin truncate text-[11px] font-semibold text-white/95 drop-shadow-xs"
                          dir="ltr"
                        >
                          {scenario.emoji} {scenario.titleEn} · {scenario.partnerName}
                        </p>
                      </div>
                    </div>

                    <div className="p-5 pb-0">
                      <h2 className="line-clamp-1 text-base font-extrabold text-ink transition-colors group-hover:text-iris">
                        {scenario.titleAr}
                      </h2>
                      <p className="mt-1.5 text-xs leading-relaxed text-ink-soft sm:text-sm">
                        {scenario.settingAr}
                      </p>
                    </div>
                  </div>

                  <div className="p-5 pt-4">
                  {locked ? (
                    <Button
                      asChild
                      className="w-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 font-bold text-white hover:from-amber-600 hover:to-orange-600"
                    >
                      <Link href="/pricing">
                        <Lock className="me-1.5 size-4" /> اشترك في PRO لفتح
                        الموقف (+{scenario.rewardXp * 2} XP) 👑
                      </Link>
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={() => startScenario(scenario)}
                      className="w-full rounded-full bg-iris font-bold text-white hover:bg-iris-deep"
                    >
                      ابدأ المحادثة الآن ({scenario.turns.length} جولات) 🎙️
                    </Button>
                  )}
                  </div>
                </div>
              );
            })}
            </div>

            {visibleCount < filteredScenarios.length && (
              <div className="flex justify-center pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setVisibleCount(prev => prev + 24)}
                  className="h-12 rounded-full border-iris/40 bg-iris-soft/60 px-8 text-sm font-bold text-iris hover:bg-iris hover:text-white"
                >
                  عرض المزيد من المواقف (+{Math.min(24, filteredScenarios.length - visibleCount)} من أصل{" "}
                  {(filteredScenarios.length - visibleCount).toLocaleString()} متبقي) 🎭
                </Button>
              </div>
            )}
          </div>
        ) : finished ? (
          <div className="mx-auto max-w-xl rounded-3xl border border-emerald-500/40 bg-card p-8 text-center shadow-sm">
            <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-emerald-500/15 text-3xl">
              {averageScore >= 85 ? "🏆" : averageScore >= 65 ? "🌟" : "💪"}
            </div>
            <h2 className="mt-4 text-2xl font-black text-ink">
              خلصت موقف «{activeScenario.titleAr}»!
            </h2>
            <p className="mt-2 text-sm text-ink-soft">
              نتيجة طلاقتك واحترافيتك في الردود:
            </p>
            <p className="latin mt-2 text-5xl font-black text-iris">
              {averageScore}%
            </p>
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-bold text-amber-700 dark:text-amber-300">
              <Zap className="size-3.5 fill-amber-500 text-amber-500" />
              تمت إضافة +{activeScenario.rewardXp} XP لرصيدك!
            </p>

            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => startScenario(activeScenario)}
                className="rounded-full"
              >
                <RotateCcw className="me-1.5 size-4" /> أعد نفس الموقف
              </Button>
              <Button
                type="button"
                onClick={() => setActiveScenario(null)}
                className="rounded-full bg-iris text-white hover:bg-iris-deep"
              >
                جرّب موقف تاني 🎭
              </Button>
              <Button asChild variant="outline" className="rounded-full">
                <Link href="/competitions">
                  <Trophy className="me-1.5 size-4 text-amber-500" /> المسابقات
                </Link>
              </Button>
            </div>
          </div>
        ) : currentTurn ? (
          <div className="mx-auto max-w-2xl space-y-5">
            {/* Active Scenario Scenic Header Banner */}
            <div className="relative h-36 overflow-hidden rounded-3xl border border-iris/30 shadow-md">
              <img
                src={getScenarioCoverImage(activeScenario)}
                alt={activeScenario.titleEn}
                decoding="async"
                onError={e => {
                  e.currentTarget.src = UNIQUE_SCENARIO_PHOTOS[1];
                }}
                className="size-full object-cover"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-[#0a1b33]/95 via-[#102952]/70 to-transparent"
              />
              <div className="absolute inset-x-5 bottom-4 flex flex-wrap items-end justify-between gap-2 text-white">
                <div>
                  <span className="latin inline-block rounded-full border border-white/25 bg-black/50 px-2.5 py-0.5 text-[10px] font-bold text-amber-300">
                    {activeScenario.level} · {activeScenario.partnerName}
                  </span>
                  <h2 className="mt-1 text-lg font-extrabold text-white">
                    {activeScenario.emoji} {activeScenario.titleAr}
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleSaveScenario(activeScenario.id)}
                    className={cn(
                      "grid size-8 place-items-center rounded-full transition shadow-xs",
                      savedIds.includes(activeScenario.id)
                        ? "bg-amber-400 text-amber-950"
                        : "bg-white/20 text-white hover:bg-white/30"
                    )}
                    title={savedIds.includes(activeScenario.id) ? "محفوظ في المفضلة ⭐" : "حفظ في المفضلة"}
                  >
                    <Star className={cn("size-4", savedIds.includes(activeScenario.id) && "fill-amber-950")} />
                  </button>
                  <span className="latin rounded-full bg-iris px-3 py-1 text-xs font-black text-white shadow-xs">
                    الجولة {turnIndex + 1} / {activeScenario.turns.length}
                  </span>
                </div>
              </div>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-paper-deep">
              <div
                className="h-full rounded-full bg-iris transition-all"
                style={{
                  width: `${Math.round(((turnIndex + (pickedOption ? 1 : 0)) / activeScenario.turns.length) * 100)}%`,
                }}
              />
            </div>

            {/* Partner Speech Bubble */}
            <div className="rounded-3xl border border-iris/30 bg-card p-6 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="rounded-full bg-iris-soft px-3 py-1 text-xs font-bold text-iris">
                  {activeScenario.partnerName}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => speakEnglish(currentTurn.promptEn, 0.94)}
                    className="inline-flex items-center gap-1 rounded-full bg-iris px-3 py-1.5 text-xs font-bold text-white hover:bg-iris-deep"
                  >
                    <Volume2 className="size-3.5" /> اسمع
                  </button>
                  <button
                    type="button"
                    onClick={() => speakEnglish(currentTurn.promptEn, 0.68)}
                    className="rounded-full border border-line px-2.5 py-1.5 text-xs font-semibold text-ink-soft hover:border-iris"
                  >
                    🐢 بطيء
                  </button>
                </div>
              </div>

              <p
                className="latin mt-4 text-lg font-bold leading-relaxed text-ink sm:text-xl"
                dir="ltr"
              >
                “{currentTurn.promptEn}”
              </p>
              <p className="mt-2 text-xs leading-relaxed text-ink-soft">
                الترجمة: {currentTurn.promptAr}
              </p>
            </div>

            {/* Options */}
            <div className="space-y-2.5">
              <p className="text-xs font-bold text-ink-soft">
                اختار أفضل رد طبيعي ومهذب:
              </p>
              {currentTurn.options.map(opt => {
                const isPicked = pickedOption?.id === opt.id;
                const showResult = Boolean(pickedOption);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={showResult}
                    onClick={() => handleSelectOption(opt)}
                    className={cn(
                      "w-full rounded-2xl border p-4 text-start transition",
                      !showResult &&
                        "border-line bg-card hover:border-iris hover:bg-iris-soft/30",
                      showResult &&
                        opt.quality === "best" &&
                        "border-emerald-500 bg-emerald-500/10",
                      showResult &&
                        isPicked &&
                        opt.quality === "good" &&
                        "border-amber-500 bg-amber-500/10",
                      showResult &&
                        isPicked &&
                        opt.quality === "weak" &&
                        "border-destructive bg-destructive/10",
                      showResult &&
                        !isPicked &&
                        opt.quality !== "best" &&
                        "border-line bg-card opacity-55"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className="latin text-sm font-semibold leading-relaxed text-ink"
                        dir="ltr"
                      >
                        {opt.textEn}
                      </p>
                      {showResult && opt.quality === "best" && (
                        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Feedback & Voice Speak Practice */}
            {pickedOption && (
              <div className="space-y-4 rounded-3xl border border-line bg-card p-5 shadow-sm">
                <div className="flex items-start gap-2.5">
                  <Sparkles className="mt-0.5 size-5 shrink-0 text-amber-500" />
                  <div className="space-y-1 text-sm">
                    <p className="font-bold text-ink">
                      تقييم {companion.name} ({pickedOption.score}/100):
                    </p>
                    <p className="leading-relaxed text-ink-soft">
                      {pickedOption.feedbackAr}
                    </p>
                    {pickedOption.nativeTipEn && (
                      <p
                        className="latin text-xs font-semibold text-iris"
                        dir="ltr"
                      >
                        💡 {pickedOption.nativeTipEn}
                      </p>
                    )}
                  </div>
                </div>

                {/* Optional Speak Out Loud Practice */}
                <div className="rounded-2xl border border-dashed border-iris/35 bg-iris-soft/30 p-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold text-ink">
                      🎙️ جرّب تنطق الرد المثالي بصوتك (اختياري):
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      onClick={toggleVoicePractice}
                      className={cn(
                        "rounded-full text-xs font-bold",
                        listening
                          ? "bg-destructive text-white animate-pulse"
                          : "bg-emerald-600 text-white hover:bg-emerald-700"
                      )}
                    >
                      {listening ? (
                        <>
                          <MicOff className="me-1.5 size-3.5" /> إيقاف التسجيل
                        </>
                      ) : (
                        <>
                          <Mic className="me-1.5 size-3.5" /> انطق الجملة الآن
                        </>
                      )}
                    </Button>
                  </div>
                  {spokenTranscript && (
                    <p
                      className="latin mt-2 rounded-xl bg-card px-3 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300"
                      dir="ltr"
                    >
                      ✅ سمعناك بتقول: “{spokenTranscript}”
                    </p>
                  )}
                </div>

                <Button
                  type="button"
                  onClick={handleNextTurn}
                  className="w-full rounded-full bg-iris font-bold text-white hover:bg-iris-deep"
                >
                  {turnIndex + 1 < activeScenario.turns.length
                    ? "الجولة التالية ←"
                    : "إنهاء الموقف واستلام النقاط 🏆"}
                </Button>
              </div>
            )}
          </div>
        ) : null}
      </section>
    </PageShell>
  );
}
