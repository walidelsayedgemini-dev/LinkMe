import { useState } from "react";
import { Link } from "wouter";
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  CheckCircle2,
  Clock,
  Compass,
  GraduationCap,
  MessageCircle,
  Plane,
  RotateCcw,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { openWhatsApp } from "@/lib/whatsapp";
import { soundEffects } from "@/lib/sound-effects";
import { triggerConfetti } from "@/lib/confetti";

interface GoalOption {
  id: string;
  label: string;
  sub: string;
  icon: typeof Briefcase;
}

const GOALS: GoalOption[] = [
  {
    id: "career",
    label: "شغل وإنترفيو وفريلانس 💼",
    sub: "عايز أعدي مقابلات العمل وأتواصل مع عملاء أجانب باحترافية",
    icon: Briefcase,
  },
  {
    id: "conversation",
    label: "محادثة وسفر وكسر حاجز الخوف ✈️",
    sub: "عايز أتكلم بطلاقة بدون ما أترجم في دماغي وأتعطل في الرد",
    icon: Plane,
  },
  {
    id: "ielts",
    label: "امتحانات دولية (IELTS / TOEFL) 🎓",
    sub: "محتاج درجة 7+ للدراسة بالخارج أو الهجرة والترقيات",
    icon: GraduationCap,
  },
  {
    id: "foundation",
    label: "تأسيس من الصفر خطوة بخطوة 🧠",
    sub: "عايز أفهم القواعد وأنطق صح من غير عقد وبأسلوب مصري سلس",
    icon: Compass,
  },
];

const LEVELS = [
  {
    id: "a1",
    label: "مبتدئ من الصفر (A1)",
    desc: "أعرف كلمات قليلة بس مش بعرف أكون جملة صح",
  },
  {
    id: "a2",
    label: "بفهم بس بتهته لما اتكلم (A2)",
    desc: "بفهم اللي بيتقال بس لساني بيعقد وبترجم حرفي في دماغي",
  },
  {
    id: "b1",
    label: "متوسط وعايز ثقة وطلاقة (B1)",
    desc: "بعرف اتعامل بس بكرر نفس الكلمات وبخاف من الغلطات",
  },
  {
    id: "b2",
    label: "متقدم وعايز لكنة ونطق احترافي (B2+)",
    desc: "مستواي كويس ومحتاج إتقان للتعبيرات الدارجة وطلاقة أسرع",
  },
];

const TIMES = [
  { id: "15", label: "15 دقيقة / يوم", desc: "خفيف ومنتظم مع سباق الصباح ⚡" },
  { id: "30", label: "30 دقيقة / يوم", desc: "المعدل الذهبي لنتائج سريعة 🎯" },
  { id: "60", label: "ساعة كاملة / يوم", desc: "مسار مكثف للوصول للهدف في نصف الوقت 🚀" },
];

export function StudyPlanCalculatorDialog({
  trigger,
}: {
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [goal, setGoal] = useState<string>("career");
  const [level, setLevel] = useState<string>("a2");
  const [time, setTime] = useState<string>("30");

  const reset = () => {
    setStep(1);
  };

  const finish = () => {
    soundEffects.playTrophy();
    triggerConfetti();
    setStep(4);
  };

  // Generate customized advice
  const planDetails = () => {
    let title = "مسار الطلاقة والمحادثة السريعة";
    let targetHref = "/courses?category=speaking";
    let days = "60 يومًا";
    let coachAdvice =
      "سر النجاح مش حفظ الكلمات، السر إنك تتكلم يومياً في مواقف حقيقية وتستخدم أسلوب (Shadowing) اللي بنشرحه في الكورس.";

    if (goal === "career") {
      title = "مسار الإنجليزي المهني والإنترفيو (Career Track)";
      targetHref = "/roleplay";
      days = time === "60" ? "45 يومًا" : "60 يومًا";
      coachAdvice =
        "ركّز على الـ 100 موقف الخاصين بالـ Freelancing والـ Job Interviews في محاكي المواقف، وتمرّن على إجابة أسئلة الإنترفيو بصوتك.";
    } else if (goal === "ielts") {
      title = "مسار تحضير الآيلتس المكثف (IELTS 7+ Sprint)";
      targetHref = "/courses?category=ielts";
      days = time === "15" ? "90 يومًا" : "60 يومًا";
      coachAdvice =
        "الامتحان محتاج تكنيك وتنظيم أفكار في 60 ثانية. هنركز على Speaking Part 2 و Writing Task 2 مع مراجعات صوتية مستمرة.";
    } else if (goal === "foundation") {
      title = "مسار التأسيس والاستقلال الشامل (12 مستوى)";
      targetHref = "/path";
      days = time === "60" ? "60 يومًا" : "90 يومًا";
      coachAdvice =
        "ابدأ من القواعد الأساسية بالمصري من غير حفظ أزمنة جافة، وطبّق فوراً على فلاش كاردز الكلمات عشان تثبت.";
    }

    return { title, targetHref, days, coachAdvice };
  };

  const details = planDetails();

  const handleWhatsAppConsultation = () => {
    const goalLabel = GOALS.find(g => g.id === goal)?.label ?? goal;
    const levelLabel = LEVELS.find(l => l.id === level)?.label ?? level;
    const timeLabel = TIMES.find(t => t.id === time)?.label ?? time;

    const message = [
      "السلام عليكم كوتش ياسين 👋",
      "عملت حاسبة الخطة على Link Me وطلعت نتيجتي كالآتي:",
      `🎯 هدفي: ${goalLabel}`,
      `📊 مستواي الحالي: ${levelLabel}`,
      `⏱️ وقتي اليومي: ${timeLabel}`,
      `💡 الخطة المقترحة: ${details.title}`,
      "",
      "عايز أبدأ وأعرف تفاصيل الاشتراك وحجز مقعدي 🙏",
    ].join("\n");

    openWhatsApp(message);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button
            variant="outline"
            className="group rounded-full border-iris/30 bg-iris/5 px-4 text-xs font-bold text-iris hover:bg-iris hover:text-white"
          >
            <Sparkles className="size-3.5 me-1.5 text-amber-500 group-hover:text-amber-300" />
            حاسبة مسارك المناسب 🎯
          </Button>
        )}
      </DialogTrigger>
      <DialogContent
        dir="rtl"
        className="max-w-xl rounded-[28px] border-line bg-card p-6 sm:p-8 text-ink shadow-2xl dark:bg-[#0b1736] dark:border-white/15"
      >
        <DialogHeader className="text-start">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-iris/10 px-3 py-1 text-[11px] font-bold text-iris dark:bg-white/10 dark:text-sky-300">
              <Target className="size-3" /> خطتك المخصصة في دقيقة
            </span>
            {step < 4 && (
              <span className="latin text-xs font-bold text-ink-soft">
                خطوة {step} من 3
              </span>
            )}
          </div>
          <DialogTitle className="mt-2 text-xl sm:text-2xl font-black">
            {step === 1 && "إيه هدفك الأساسي من تعلّم الإنجليزي؟"}
            {step === 2 && "مستواك الحالي حاسس إنه فين دلوقتي؟"}
            {step === 3 && "تقدر تخصّص كام دقيقة يومياً للتمرين؟"}
            {step === 4 && "🎉 خطتك الموصى بها جاهزة!"}
          </DialogTitle>
        </DialogHeader>

        {/* Step 1: Goal */}
        {step === 1 && (
          <div className="mt-4 space-y-2.5">
            {GOALS.map(item => {
              const Icon = item.icon;
              const isSelected = goal === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    soundEffects.playClick();
                    setGoal(item.id);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3.5 rounded-2xl border p-3.5 text-start transition-all cursor-pointer",
                    isSelected
                      ? "border-iris bg-iris/10 shadow-sm dark:bg-white/10 dark:border-sky-400"
                      : "border-line bg-paper/50 hover:border-iris/50 hover:bg-paper",
                  )}
                >
                  <div
                    className={cn(
                      "grid size-10 shrink-0 place-items-center rounded-xl",
                      isSelected
                        ? "bg-iris text-white"
                        : "bg-paper text-ink-soft dark:bg-white/5",
                    )}
                  >
                    <Icon className="size-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-ink dark:text-white">
                      {item.label}
                    </p>
                    <p className="text-xs text-ink-soft">{item.sub}</p>
                  </div>
                </button>
              );
            })}

            <div className="mt-6 flex justify-end">
              <Button
                onClick={() => setStep(2)}
                className="rounded-full bg-iris px-6 text-white hover:bg-iris-deep"
              >
                التالي <ArrowLeft className="size-4 ms-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Level */}
        {step === 2 && (
          <div className="mt-4 space-y-2.5">
            {LEVELS.map(item => {
              const isSelected = level === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    soundEffects.playClick();
                    setLevel(item.id);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between rounded-2xl border p-3.5 text-start transition-all cursor-pointer",
                    isSelected
                      ? "border-iris bg-iris/10 shadow-sm dark:bg-white/10 dark:border-sky-400"
                      : "border-line bg-paper/50 hover:border-iris/50 hover:bg-paper",
                  )}
                >
                  <div>
                    <p className="text-sm font-bold text-ink dark:text-white">
                      {item.label}
                    </p>
                    <p className="text-xs text-ink-soft">{item.desc}</p>
                  </div>
                  <div
                    className={cn(
                      "grid size-5 place-items-center rounded-full border",
                      isSelected
                        ? "border-iris bg-iris text-white"
                        : "border-line bg-transparent",
                    )}
                  >
                    {isSelected && <CheckCircle2 className="size-4" />}
                  </div>
                </button>
              );
            })}

            <div className="mt-6 flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={() => setStep(1)}
                className="rounded-full text-ink-soft"
              >
                <ArrowRight className="size-4 me-1" /> السابق
              </Button>
              <Button
                onClick={() => setStep(3)}
                className="rounded-full bg-iris px-6 text-white hover:bg-iris-deep"
              >
                التالي <ArrowLeft className="size-4 ms-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Daily Time */}
        {step === 3 && (
          <div className="mt-4 space-y-2.5">
            {TIMES.map(item => {
              const isSelected = time === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    soundEffects.playClick();
                    setTime(item.id);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between rounded-2xl border p-3.5 text-start transition-all cursor-pointer",
                    isSelected
                      ? "border-iris bg-iris/10 shadow-sm dark:bg-white/10 dark:border-sky-400"
                      : "border-line bg-paper/50 hover:border-iris/50 hover:bg-paper",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Clock className="size-5 text-iris" />
                    <div>
                      <p className="text-sm font-bold text-ink dark:text-white">
                        {item.label}
                      </p>
                      <p className="text-xs text-ink-soft">{item.desc}</p>
                    </div>
                  </div>
                  <div
                    className={cn(
                      "grid size-5 place-items-center rounded-full border",
                      isSelected
                        ? "border-iris bg-iris text-white"
                        : "border-line bg-transparent",
                    )}
                  >
                    {isSelected && <CheckCircle2 className="size-4" />}
                  </div>
                </button>
              );
            })}

            <div className="mt-6 flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={() => setStep(2)}
                className="rounded-full text-ink-soft"
              >
                <ArrowRight className="size-4 me-1" /> السابق
              </Button>
              <Button
                onClick={finish}
                className="rounded-full bg-iris px-6 text-white hover:bg-iris-deep"
              >
                طلّع خطتي الآن 🚀
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Result Card */}
        {step === 4 && (
          <div className="mt-4 space-y-4">
            <div className="rounded-2xl border border-iris/30 bg-gradient-to-br from-iris/10 via-card to-sky-500/10 p-5 dark:bg-[#0e2248] dark:border-iris/40">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-iris px-3 py-1 text-xs font-bold text-white">
                  الخطة المثالية ليك 🎯
                </span>
                <span className="latin text-xs font-bold text-ink-soft">
                  المدة المتوقعة: <strong className="text-ink dark:text-white">{details.days}</strong>
                </span>
              </div>

              <h3 className="mt-3 text-lg font-black text-ink dark:text-white sm:text-xl">
                {details.title}
              </h3>

              <div className="mt-3 rounded-xl bg-card/80 p-3.5 border border-line dark:bg-[#071329]/80">
                <p className="text-xs font-semibold text-iris dark:text-sky-300">
                  💡 نصيحة كوتش ياسين ليك:
                </p>
                <p className="mt-1 text-xs leading-relaxed text-ink-soft dark:text-slate-200">
                  {details.coachAdvice}
                </p>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-semibold text-ink-soft">
                <span className="rounded-md bg-paper px-2.5 py-1 border border-line">
                  ✨ تدريب يومي {time} دقيقة
                </span>
                <span className="rounded-md bg-paper px-2.5 py-1 border border-line">
                  🎙️ متابعة صوتية مباشرة
                </span>
                <span className="rounded-md bg-paper px-2.5 py-1 border border-line">
                  📱 شعلة الحماسة (Streak)
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <Button
                asChild
                className="flex-1 rounded-full bg-iris h-11 text-white hover:bg-iris-deep"
                onClick={() => setOpen(false)}
              >
                <Link href={details.targetHref}>
                  ابدأ الخطة الآن <ArrowLeft className="size-4 ms-1" />
                </Link>
              </Button>

              <Button
                type="button"
                onClick={handleWhatsAppConsultation}
                className="flex-1 rounded-full bg-[#25D366] h-11 text-white hover:bg-[#20ba59]"
              >
                <MessageCircle className="size-4 me-1.5" />
                تأكيد مع كوتش ياسين (واتساب)
              </Button>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={reset}
                className="inline-flex items-center gap-1 text-xs text-ink-soft hover:text-ink"
              >
                <RotateCcw className="size-3" /> إعادة حساب الخطة
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
