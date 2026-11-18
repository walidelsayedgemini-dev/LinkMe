import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import {
  ArrowRight,
  CheckCircle2,
  Mic,
  MicOff,
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
import { useCompanion } from "@/components/companion";
import { trpc } from "@/lib/trpc";
import { awardXP } from "@/lib/gamification";
import { soundEffects } from "@/lib/sound-effects";
import { cn } from "@/lib/utils";
import {
  ROLEPLAY_SCENARIOS,
  type RoleplayOption,
  type RoleplayScenario,
} from "@shared/roleplay-scenarios";

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

  const [activeScenario, setActiveScenario] = useState<RoleplayScenario | null>(
    null
  );
  const [turnIndex, setTurnIndex] = useState(0);
  const [pickedOption, setPickedOption] = useState<RoleplayOption | null>(null);
  const [scores, setScores] = useState<number[]>([]);
  const [finished, setFinished] = useState(false);

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
      {/* Hero */}
      <section className="border-b border-line bg-paper-deep/60">
        <div className="container py-8 sm:py-10">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <Eyebrow>محادثة عملية بالصوت</Eyebrow>
              <h1 className="mt-2 text-2xl font-bold text-ink sm:text-4xl">
                محاكي <span className="hl-word">المواقف الحقيقية.</span> 🎭
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-soft">
                اتدرّب على مواقف الحياة والشغل الحقيقية (إنترفيو، كافيه، فندق،
                اجتماع Zoom) — اسمع الجملة بالصوت، اختار أذكى رد، وجرّب تنطقه
                بصوتك مع تقييم فوري من {companion.name}!
              </p>
            </div>
            {activeScenario && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setActiveScenario(null)}
                className="rounded-full self-start sm:self-auto"
              >
                <ArrowRight className="me-1.5 size-4" /> كل المواقف
              </Button>
            )}
          </div>
        </div>
      </section>

      <section className="container py-8 sm:py-10">
        {!activeScenario ? (
          <div className="grid gap-4 md:grid-cols-2">
            {ROLEPLAY_SCENARIOS.map(scenario => (
              <div
                key={scenario.id}
                className="flex flex-col justify-between rounded-3xl border border-line bg-card p-6 shadow-sm transition hover:border-iris/50"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className={cn(
                        "grid size-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br text-2xl text-white shadow-sm",
                        scenario.accent
                      )}
                    >
                      {scenario.emoji}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="latin rounded-full bg-iris-soft px-2.5 py-1 text-xs font-bold text-iris">
                        {scenario.level}
                      </span>
                      <span className="latin inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-bold text-amber-700 dark:text-amber-300">
                        <Zap className="size-3 fill-amber-500 text-amber-500" />
                        +{scenario.rewardXp} XP
                      </span>
                    </div>
                  </div>
                  <h2 className="mt-4 text-xl font-bold text-ink">
                    {scenario.titleAr}
                  </h2>
                  <p className="latin text-xs font-semibold text-iris" dir="ltr">
                    {scenario.titleEn} · {scenario.partnerName}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                    {scenario.settingAr}
                  </p>
                </div>

                <Button
                  type="button"
                  onClick={() => startScenario(scenario)}
                  className="mt-5 w-full rounded-full bg-iris font-bold text-white hover:bg-iris-deep"
                >
                  ابدأ المحادثة الآن ({scenario.turns.length} جولات) 🎙️
                </Button>
              </div>
            ))}
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
            {/* Progress */}
            <div className="flex items-center justify-between text-xs text-ink-soft">
              <span className="font-bold text-ink">
                {activeScenario.emoji} {activeScenario.titleAr}
              </span>
              <span className="latin font-bold text-iris">
                الجولة {turnIndex + 1} / {activeScenario.turns.length}
              </span>
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
