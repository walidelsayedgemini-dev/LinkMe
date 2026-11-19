import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import {
  Phone,
  PhoneOff,
  PhoneCall,
  Mic,
  MicOff,
  Volume2,
  Sparkles,
  Trophy,
  CheckCircle2,
  Clock,
  User,
  Crown,
  Zap,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { trpc } from "@/lib/trpc";
import { awardXP } from "@/lib/gamification";
import { soundEffects } from "@/lib/sound-effects";
import { triggerConfetti } from "@/lib/confetti";
import { cn } from "@/lib/utils";

interface CallScenario {
  id: string;
  callerName: string;
  callerRole: string;
  callerLocation: string;
  avatarEmoji: string;
  turns: {
    promptEn: string;
    promptAr: string;
    options: {
      textEn: string;
      isBest: boolean;
      feedbackAr: string;
    }[];
  }[];
}

export const CALL_SCENARIOS: CallScenario[] = [
  {
    id: "call-recruiter",
    callerName: "Noah Vance",
    callerRole: "Senior Tech Recruiter • New York",
    callerLocation: "مكالمة تليفونية واردة من نيويورك 🇺🇸",
    avatarEmoji: "💼",
    turns: [
      {
        promptEn: "Hi there! I came across your profile and was really impressed. Do you have a quick couple of minutes to chat about an exciting remote role?",
        promptAr: "أهلاً بيك! شوفت ملفك وعجبني جداً. عندك دقيقتين نتكلم عن فرصة عمل ريموت ممتازة؟",
        options: [
          {
            textEn: "Hi Noah! Absolutely, I'd love to hear more about the role. Go right ahead!",
            isBest: true,
            feedbackAr: "رد احترافي ودود ومباشر يعكس جاهزيتك وثقتك بنفسك 👏",
          },
          {
            textEn: "Yes, what is the salary first?",
            isBest: false,
            feedbackAr: "السؤال عن المرتب كأول جملة في المكالمة بيسيب انطباع متسرع.",
          },
          {
            textEn: "Who are you and why are you calling me?",
            isBest: false,
            feedbackAr: "الأسلوب جاف شوية، خليك دايماً أهدى وأكثر ترحيباً في مكالمات الـ HR.",
          },
        ],
      },
      {
        promptEn: "Awesome! How would you describe your experience working with cross-functional teams in English?",
        promptAr: "عظيم! إزاي توصف خبرتك في التعامل مع فِرق العمل المختلفة بالإنجليزي؟",
        options: [
          {
            textEn: "I collaborate daily in English across daily standups, sprint reviews, and technical documentation with zero friction.",
            isBest: true,
            feedbackAr: "إجابة تنفيذية قوية جداً استعملت فيها مصطلحات تقنية واقعية! 🚀",
          },
          {
            textEn: "My English is good, I watch movies without subtitles.",
            isBest: false,
            feedbackAr: "إجابة عامة، الأفضل دايماً تربط إنجليزيتك ببيئة الشغل الفعلية.",
          },
        ],
      },
    ],
  },
  {
    id: "call-client",
    callerName: "Sarah Jenkins",
    callerRole: "Product Lead • London",
    callerLocation: "مكالمة واردة من لندن 🇬🇧",
    avatarEmoji: "👩‍💼",
    turns: [
      {
        promptEn: "Hello! We're reviewing your project proposal right now. Could you walk me through your estimated timeline for Phase One?",
        promptAr: "أهلاً! بنراجع مقترح مشروعك دلوقتي، ممكن تديني فكرة سريعة عن الجدول الزمني للمرحلة الأولى؟",
        options: [
          {
            textEn: "Hi Sarah! Phase One will take approximately two weeks, focusing on the core UX audit and system architecture.",
            isBest: true,
            feedbackAr: "دقة في المواعيد ووضوح في أولويات التسليم — ده اللي العميل بيحبه تماماً!",
          },
          {
            textEn: "I can finish it whenever you want.",
            isBest: false,
            feedbackAr: "تحديد وقت واقعي بيعطي مصداقية أكبر بكتير من الوعود المفتوحة.",
          },
        ],
      },
    ],
  },
];

function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-US";
    u.rate = 0.94;
    window.speechSynthesis.speak(u);
  } catch {}
}

export function IncomingCallModal({
  open,
  onOpenChange,
  scenario = CALL_SCENARIOS[0],
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scenario?: CallScenario;
}) {
  const { user } = useAuth();
  const { data: gameProfile } = trpc.community.myGameProfile.useQuery(undefined, {
    enabled: Boolean(user),
  });
  const isVip = Boolean(gameProfile?.isVip);

  const [callState, setCallState] = useState<"ringing" | "connected" | "ended">("ringing");
  const [duration, setDuration] = useState(0);
  const [turnIndex, setTurnIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(100);

  const ringtoneInterval = useRef<any>(null);

  // Synthesize pleasant phone ring tone (US 440 + 480 Hz)
  const playRingBeep = () => {
    if (typeof window === "undefined") return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.frequency.value = 440;
      osc2.frequency.value = 480;

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 1.2);
      osc2.stop(ctx.currentTime + 1.2);
    } catch {}
  };

  useEffect(() => {
    if (open && callState === "ringing") {
      playRingBeep();
      ringtoneInterval.current = setInterval(playRingBeep, 2800);
    } else {
      clearInterval(ringtoneInterval.current);
    }
    return () => clearInterval(ringtoneInterval.current);
  }, [open, callState]);

  // Duration timer when connected
  useEffect(() => {
    let t: any = null;
    if (callState === "connected") {
      t = setInterval(() => setDuration(d => d + 1), 1000);
    }
    return () => clearInterval(t);
  }, [callState]);

  // Read current turn prompt when turn changes
  useEffect(() => {
    if (callState === "connected" && scenario.turns[turnIndex]) {
      setTimeout(() => {
        speak(scenario.turns[turnIndex].promptEn);
      }, 500);
    }
  }, [callState, turnIndex]);

  const handleAnswer = () => {
    clearInterval(ringtoneInterval.current);
    soundEffects.playClick();
    setCallState("connected");
    setDuration(0);
    setTurnIndex(0);
    setSelectedOption(null);
  };

  const handleDecline = () => {
    clearInterval(ringtoneInterval.current);
    soundEffects.playClick();
    setCallState("ended");
    setTimeout(() => onOpenChange(false), 300);
  };

  const handlePickOption = (index: number, isBest: boolean) => {
    if (selectedOption !== null) return;
    setSelectedOption(index);

    if (isBest) {
      soundEffects.playCorrect();
    } else {
      soundEffects.playIncorrect();
      setScore(s => Math.max(50, s - 25));
    }

    setTimeout(() => {
      // Free users get 1 turn teaser, PRO users get all turns
      const isTeaserFinished = !isVip && turnIndex >= 0;
      if (!isTeaserFinished && turnIndex + 1 < scenario.turns.length) {
        setTurnIndex(i => i + 1);
        setSelectedOption(null);
      } else {
        // Finished call
        setCallState("ended");
        soundEffects.playTrophy();
        triggerConfetti(3000);
        awardXP(isVip ? 50 : 25);
        if (!isVip) {
          toast.success("أنهيت الجولة التجريبية المجانية بنجاح! 🎁");
        } else {
          toast.success("أنهيت المكالمة بنجاح وحققت +50 XP! 🏆");
        }
      }
    }, 2000);
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const currentTurn = scenario.turns[turnIndex];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#060e20] via-[#0b1736] to-[#040814] p-0 text-white shadow-2xl">
        {callState === "ringing" ? (
          /* ================= INCOMING RINGING SCREEN ================= */
          <div className="relative flex flex-col items-center justify-between p-8 text-center min-h-[460px]">
            {/* Ambient Pulse */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-1/4 mx-auto size-48 rounded-full bg-emerald-500/15 blur-3xl animate-pulse"
            />

            <div className="space-y-1.5 flex flex-col items-center">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-300">
                <PhoneCall className="size-3.5 animate-bounce" /> {scenario.callerLocation}
              </span>
              {isVip ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-extrabold text-amber-300">
                  <Crown className="size-3 text-amber-400" /> ميزة PRO: مكالمات غير محدودة
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full border border-sky-400/30 bg-sky-500/15 px-2.5 py-0.5 text-[10px] font-extrabold text-sky-300">
                  🎁 تجربة مجانية: جولة واحدة تليفونية
                </span>
              )}
            </div>

            {/* Caller Identity */}
            <div className="my-6 space-y-3">
              <div className="relative mx-auto flex size-28 items-center justify-center rounded-full border-2 border-emerald-400/50 bg-gradient-to-br from-emerald-500/20 to-iris/20 text-5xl shadow-[0_0_40px_rgba(16,185,129,0.3)] animate-pulse">
                {scenario.avatarEmoji}
              </div>
              <h2 className="text-2xl font-black text-white">
                {scenario.callerName}
              </h2>
              <p className="text-xs text-white/70">
                {scenario.callerRole}
              </p>
            </div>

            {/* Answer & Decline Buttons */}
            <div className="flex w-full items-center justify-around gap-4 pt-4">
              {/* Decline Button */}
              <div className="flex flex-col items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleDecline}
                  aria-label="رفض المكالمة"
                  className="flex size-16 items-center justify-center rounded-full bg-destructive text-white shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <PhoneOff className="size-7" />
                </button>
                <span className="text-xs font-bold text-white/70">رفض</span>
              </div>

              {/* Answer Button */}
              <div className="flex flex-col items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleAnswer}
                  aria-label="رد على المكالمة"
                  className="relative flex size-16 items-center justify-center rounded-full bg-emerald-600 text-white shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-transform hover:scale-110 active:scale-95 animate-bounce cursor-pointer"
                >
                  <Phone className="size-7" />
                </button>
                <span className="text-xs font-black text-emerald-400">رد 📞</span>
              </div>
            </div>
          </div>
        ) : callState === "connected" ? (
          /* ================= CONNECTED ACTIVE CALL ================= */
          <div className="flex flex-col justify-between p-6 min-h-[500px]">
            {/* Header: Caller + Duration */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-full bg-emerald-500/20 text-2xl border border-emerald-400/40">
                  {scenario.avatarEmoji}
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">
                    {scenario.callerName}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                    <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                    متصل • {formatTimer(duration)}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => speak(currentTurn.promptEn)}
                aria-label="إعادة سماع الجملة"
                className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20 cursor-pointer"
                title="إعادة سماع الجملة"
              >
                <Volume2 className="size-4" />
              </button>
            </div>

            {/* Free Teaser Notice Pill */}
            {!isVip && (
              <div className="my-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-center text-[11px] font-bold text-amber-300">
                🎁 جولة تجريبية مجانية • اشترك في PRO لفتح المكالمة الكاملة والممتدة 👑
              </div>
            )}

            {/* Caller Spoken Bubble with Multi-band Sound Wave Visualizer */}
            <div className="my-3 rounded-2xl border border-iris/40 bg-iris-deep/30 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[11px] font-bold text-iris-soft">
                  {scenario.callerName} بيتكلم:
                </span>
                {/* 7-Band Animated Sound Spectrum Bars */}
                <div className="flex items-center gap-1">
                  <span className="h-3 w-1 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="h-5 w-1 rounded-full bg-emerald-400 animate-bounce" />
                  <span className="h-3.5 w-1 rounded-full bg-emerald-400 animate-pulse delay-75" />
                  <span className="h-6 w-1 rounded-full bg-emerald-300 animate-bounce delay-150" />
                  <span className="h-4 w-1 rounded-full bg-emerald-400 animate-pulse delay-100" />
                  <span className="h-2.5 w-1 rounded-full bg-emerald-400 animate-bounce delay-200" />
                  <span className="h-2 w-1 rounded-full bg-emerald-500 animate-pulse" />
                </div>
              </div>
              <p className="latin font-bold text-white text-sm leading-relaxed" dir="ltr">
                “{currentTurn.promptEn}”
              </p>
              <p className="mt-1 text-xs text-white/70">
                {currentTurn.promptAr}
              </p>
            </div>

            {/* Learner Interactive Replies */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-white/80">
                ردك بالإنجليزي في التليفون:
              </span>
              <div className="space-y-2">
                {currentTurn.options.map((opt, i) => {
                  const isPicked = selectedOption === i;
                  return (
                    <button
                      key={i}
                      type="button"
                      disabled={selectedOption !== null}
                      onClick={() => handlePickOption(i, opt.isBest)}
                      className={cn(
                        "latin w-full rounded-2xl border p-3.5 text-start font-semibold text-xs leading-relaxed transition-all active:scale-98 cursor-pointer",
                        selectedOption === null &&
                          "border-white/15 bg-white/5 hover:border-iris hover:bg-white/10 text-white",
                        isPicked &&
                          opt.isBest &&
                          "border-emerald-500 bg-emerald-500/20 text-emerald-200",
                        isPicked &&
                          !opt.isBest &&
                          "border-destructive bg-destructive/20 text-destructive-foreground",
                        selectedOption !== null &&
                          !isPicked &&
                          "border-white/5 bg-white/5 opacity-40 text-white/60"
                      )}
                      dir="ltr"
                    >
                      {opt.textEn}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* End Call Bar */}
            <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
              <span className="text-xs text-white/60">
                {isVip
                  ? `الجولة ${turnIndex + 1} من ${scenario.turns.length}`
                  : `جولة تجريبية (1 من 1) 🎁`}
              </span>
              <Button
                type="button"
                onClick={handleDecline}
                size="sm"
                className="rounded-full bg-destructive text-white hover:bg-destructive/90 text-xs font-bold cursor-pointer"
              >
                <PhoneOff className="me-1.5 size-3.5" /> إنهاء المكالمة
              </Button>
            </div>
          </div>
        ) : !isVip ? (
          /* ================= FREE TEASER CONVERSION SCREEN ================= */
          <div className="p-6 text-center space-y-4">
            <div className="relative mx-auto flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 text-amber-400 border border-amber-400/40 shadow-[0_0_30px_rgba(245,158,11,0.25)]">
              <Crown className="size-10 text-amber-400 animate-pulse" />
            </div>

            <div className="space-y-1.5">
              <span className="rounded-full bg-amber-500/15 border border-amber-400/30 px-3 py-1 text-xs font-extrabold text-amber-300">
                🎁 انتهت الجولة التجريبية المجانية بنجاح!
              </span>
              <h3 className="text-xl font-black text-white">
                عاش على ردك التليفوني الذكي! 👏
              </h3>
              <p className="text-xs leading-relaxed text-white/70 max-w-sm mx-auto">
                ميزة المكالمات الهاتفية الكاملة متعددة الجولات بجميع السيناريوهات واللكنات العالمية حصرية لمشتركي باقة <b className="text-amber-300">PRO 👑</b>.
              </p>
            </div>

            {/* PRO Perks List */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3.5 text-start space-y-2 text-xs">
              <div className="flex items-center gap-2 text-white/90">
                <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
                <span>مكالمات تليفونية صوتية غير محدودة وبدون أي قيود</span>
              </div>
              <div className="flex items-center gap-2 text-white/90">
                <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
                <span>محاكاة كاملة لمقابلات العمل (HR & Tech Interviews)</span>
              </div>
              <div className="flex items-center gap-2 text-white/90">
                <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
                <span>تقييم لحظي لنبرة الصوت وسرعة البديهة والطلاقة</span>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <Button
                asChild
                className="w-full rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 font-extrabold text-white shadow-lg hover:from-amber-600 hover:to-orange-600 py-5 text-sm cursor-pointer"
              >
                <Link href="/pricing" onClick={() => onOpenChange(false)}>
                  <Crown className="me-2 size-4" /> افتح كل المكالمات في باقة PRO 👑
                </Link>
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="w-full text-xs text-white/60 hover:text-white hover:bg-white/5 rounded-full"
              >
                تم والمتابعة في النسخة المجانية
              </Button>
            </div>
          </div>
        ) : (
          /* ================= PRO FULL CELEBRATION SUMMARY ================= */
          <div className="p-6 text-center space-y-4">
            <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-400/40">
              <Trophy className="size-10" />
            </div>

            <h3 className="text-xl font-black text-white">
              أحسنت! أنهيت المكالمة كاملة بنجاح 📞
            </h3>
            <p className="text-xs text-white/70">
              تجاوزت رهبة المكالمات الإنجليزية وتواصلت باحترافية مع {scenario.callerName}.
            </p>

            <div className="flex items-center justify-around rounded-2xl border border-white/10 bg-white/5 p-3 text-xs font-bold">
              <div>
                <span className="block text-white/60">التقييم الكلي</span>
                <span className="text-base font-black text-amber-300">{score}%</span>
              </div>
              <div className="h-8 w-px bg-white/15" />
              <div>
                <span className="block text-white/60">النقاط المكتسبة</span>
                <span className="text-base font-black text-emerald-400">+50 XP ⚡</span>
              </div>
            </div>

            <Button
              type="button"
              onClick={() => onOpenChange(false)}
              className="w-full rounded-full bg-iris font-bold text-white hover:bg-iris-deep py-5 cursor-pointer"
            >
              تم ومتابعة المواقف 🚀
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** Standalone Quick Call Launcher Button */
export function IncomingCallButton({
  scenario,
  className,
}: {
  scenario?: CallScenario;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const { data: gameProfile } = trpc.community.myGameProfile.useQuery(undefined, {
    enabled: Boolean(user),
  });
  const isVip = Boolean(gameProfile?.isVip);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          soundEffects.playClick();
          setOpen(true);
        }}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition hover:scale-105 active:scale-95 shadow-xs cursor-pointer",
          isVip
            ? "border-amber-500/40 bg-gradient-to-r from-amber-500/15 to-orange-500/15 text-amber-800 dark:text-amber-300"
            : "border-emerald-500/40 bg-emerald-500/15 text-emerald-800 dark:text-emerald-300",
          className
        )}
      >
        <PhoneCall className={cn("size-3.5 animate-pulse", isVip ? "text-amber-500" : "text-emerald-500")} />
        <span>{isVip ? "مكالمة تليفونية PRO 👑" : "مكالمة تليفونية (تجربة مجانية 🎁)"}</span>
      </button>

      <IncomingCallModal open={open} onOpenChange={setOpen} scenario={scenario} />
    </>
  );
}
