import { Link } from "wouter";
import {
  ArrowLeft,
  Brain,
  CalendarCheck,
  CheckCircle2,
  Ear,
  Gauge,
  Layers,
  MessageCircle,
  Mic,
  ShieldCheck,
  Sparkles,
  Target,
  Timer,
} from "lucide-react";
import { PageShell } from "@/components/layout/site-footer";
import { AnimatedAurora, StudyDoodles } from "@/components/decor";
import { Eyebrow, Stars, UserAvatar } from "@/components/bits";
import { Reveal } from "@/components/reveal";
import { Button } from "@/components/ui/button";

const PILLARS = [
  {
    icon: MessageCircle,
    title: "الكلام قبل القواعد",
    body: "أغلب وقت الدرس حوار حقيقي حول مواقف من الحياة: مكالمة، اجتماع، مقابلة، أو سفر. القاعدة بتجي بعد ما تستخدمها، فبتفضل في دماغك.",
    tag: "70% من الدرس كلام فعلي",
  },
  {
    icon: Target,
    title: "مبني على نتائج حقيقية",
    body: "كل كورس عنده مخرج واضح: تكتب إيميل شغل صح، تدخل مقابلة بثقة، أو تجيب Band 7 في الآيلتس. مفيش دروس «للتعلّم العام».",
    tag: "مخرج واضح لكل كورس",
  },
  {
    icon: ShieldCheck,
    title: "بيئة بدون خوف",
    body: "الطلاقة نصها لغة ونصها ثقة. بتتدرّب في مساحة آمنة: تسجّل صوتك براحتك، تكرّر التمرين، وتاخد ملاحظات محددة بدل التقييم العام.",
    tag: "تسجيل صوتي خاص بك",
  },
];

const DAILY = [
  {
    icon: Timer,
    title: "١٠ دقايق تمرين موجّه",
    body: "تمرين قصير على نقطة واحدة بس: قاعدة، صوت، أو تعبير — بأسئلة تفاعلية وتصحيح فوري.",
  },
  {
    icon: Mic,
    title: "٦٠ ثانية تسجيل صوتي",
    body: "تقرأ أو تتكلم في المهمة، وتسمع نفسك. الملاحظات بتعتمد على الوضوح والإيقاع مش على اللكنة.",
  },
  {
    icon: CalendarCheck,
    title: "مهمة واقعية للنهارده",
    body: "استخدم ٣ عبارات جديدة في مكالمة أو إيميل حقيقي، وسجّل إيه اللي اشتغل معاك.",
  },
  {
    icon: Layers,
    title: "مراجعة أسبوعية ذكية",
    body: "المنصة بترجّع لك الكلمات اللي نسيتها في مواقف جديدة، عشان تثبت فعلًا بدل الحفظ السطحي.",
  },
];

const OBSTACLES = [
  {
    title: "«أعرف القاعدة بس بتجمّد لما أتكلم»",
    body: "المشكلة مش في المعرفة، المشكلة في الاستدعاء تحت ضغط. عشان كده بنتدرّب على مواقف ضغط حقيقية بجرعات صغيرة ومتكررة.",
  },
  {
    title: "«بترجم في دماغي الأول»",
    body: "الترجمة بتاخد ثانية زيادة كل جملة. التمارين بتدرّبك على «كتل جاهزة» (chunks) تستخدمها على طول من غير ترجمة.",
  },
  {
    title: "«بذاكر أسبوع وبعدين أسيب»",
    body: "الانتظام أهم من عدد الساعات. الدروس قصيرة والتنبيه اليومي بيخليك تكمل حتى في الأيام الزحمة.",
  },
];

const LEVELS = [
  {
    level: "A1",
    title: "مبتدئ",
    body: "الضمائر، الأزمنة البسيطة، والمواقف اليومية.",
    hours: "٣٠ ساعة تعلّم",
  },
  {
    level: "A2",
    title: "ما قبل المتوسط",
    body: "الماضي والحاضر، السفر، والتسوّق.",
    hours: "٤٠ ساعة تعلّم",
  },
  {
    level: "B1",
    title: "متوسط",
    body: "محادثة يومية واثقة، إيميلات، ومواقف شغل.",
    hours: "٥٠ ساعة تعلّم",
  },
  {
    level: "B2",
    title: "متوسط متقدم",
    body: "تفاوض، عروض، آيلتس 6.5+، ودقة في الكتابة.",
    hours: "٦٠ ساعة تعلّم",
  },
  {
    level: "C1",
    title: "متقدم",
    body: "كتابة أكاديمية، فروق دقيقة، وآيلتس 7.5+.",
    hours: "٧٠ ساعة تعلّم",
  },
];

const STORIES = [
  {
    name: "كريم جمال",
    role: "مهندس برمجيات · من B1 إلى B2 في 4 شهور",
    quote:
      "الشرح بالعربي ثم التطبيق بالإنجليزي خلاني أفهم القاعدة من أول مرة. أفضل من أي كورس جربته.",
  },
  {
    name: "مريم عبد الرحمن",
    role: "محللة مالية · آيلتس 7.0",
    quote:
      "أخذت 7.0 في الآيلتس بعد 6.0. معايير التقييم لوحدها تستاهل سعر الكورس.",
  },
  {
    name: "أحمد نصر",
    role: "مدير مبيعات · إنجليزي الأعمال",
    quote:
      "استخدمت عبارات البريد الإلكتروني في شغلي من أول أسبوع. المدرّبة عملية جدًا.",
  },
];

export default function Method() {
  return (
    <PageShell>
      {/* hero */}
      <section className="relative overflow-hidden border-b border-line bg-paper-deep">
        {" "}
        <AnimatedAurora className="opacity-70" />
        <StudyDoodles variant="hero" className="opacity-80" />
        <div className="absolute inset-0 opacity-40 dot-grid" />
        <div className="container relative py-14 sm:py-20">
          <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
            <Reveal>
              <Eyebrow>منهجيتنا · Our method</Eyebrow>
              <h1 className="mt-5 text-[2.3rem] leading-[1.15] text-ink sm:text-[3.4rem]">
                بطّل تحفظ إنجليزي. <br />
                <span className="hl-word">ابدأ تتكلم بيه</span> من أول درس.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-soft sm:text-lg">
                المنهجية بتاعتنا مبنية على نفس المبدأ اللي بيحرّك المدرّبين
                المعتمدين دوليًا: الطلاقة مهارة ذهنية قبل ما تكون حفظ قواعد. كل
                درس بيتمرن على موقف حقيقي، وكل أسبوع بتشوف فرق في اللي تقدر
                تعمله.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Button
                  asChild
                  className="h-12 rounded-full bg-iris px-7 text-white hover:bg-iris-deep"
                >
                  <Link href="/level-test">
                    <Gauge className="me-2 size-4" /> اعرف مستواك خطوة بخطوة
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="h-12 rounded-full border-ink/20 bg-transparent px-7 hover:border-ink"
                >
                  <Link href="/courses">
                    تصفّح الكورسات <ArrowLeft className="ms-2 size-4" />
                  </Link>
                </Button>
              </div>
            </Reveal>

            <Reveal
              delay={0.1}
              className="rounded-[1.75rem] border border-line bg-card p-6 sm:p-7"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-soft latin">
                The numbers
              </p>
              <div className="mt-4 grid grid-cols-2 gap-5">
                {[
                  { value: "12", label: "كورس على 5 مستويات" },
                  { value: "68", label: "درس عملي" },
                  { value: "+61K", label: "متعلّم عربي" },
                  { value: "4.9/5", label: "متوسط تقييم الطلبة" },
                ].map(item => (
                  <div key={item.label}>
                    <p className="latin text-3xl font-bold text-ink">
                      {item.value}
                    </p>
                    <p className="mt-1 text-xs leading-snug text-ink-soft">
                      {item.label}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex items-center gap-2 rounded-2xl bg-paper-deep p-3.5 text-xs text-ink-soft">
                <Sparkles className="size-4 shrink-0 text-iris" />
                <span className="min-w-0">
                  كل الكورسات مبنية على الإطار الأوروبي المرجعي CEFR (A1–C1).
                </span>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* pillars */}
      <section className="container py-16 sm:py-20">
        <div className="max-w-2xl">
          <Eyebrow>ثلاث ركائز</Eyebrow>
          <h2 className="mt-4 text-3xl leading-tight text-ink sm:text-4xl">
            كل دقيقة في الدرس لازم تكون بتتلكم
          </h2>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {PILLARS.map((pillar, index) => (
            <Reveal
              key={pillar.title}
              delay={index * 0.06}
              className="hover-lift flex flex-col rounded-3xl border border-line bg-card p-6 sm:p-7"
            >
              <span className="grid size-12 place-items-center rounded-2xl bg-iris-soft text-iris">
                <pillar.icon className="size-5" />
              </span>
              <h3 className="mt-5 text-xl text-ink">{pillar.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-soft">
                {pillar.body}
              </p>
              <span className="mt-5 inline-flex w-fit items-center gap-1.5 rounded-full bg-paper-deep px-3 py-1 text-[11px] font-medium text-ink-soft">
                <CheckCircle2 className="size-3.5 text-iris" /> {pillar.tag}
              </span>
            </Reveal>
          ))}
        </div>
      </section>

      {/* daily system */}
      <section className="container">
        <div className="rounded-[2rem] bg-navy p-7 text-white sm:p-12">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-white/50 latin">
                Daily task system
              </p>
              <h2 className="mt-4 text-3xl leading-tight sm:text-4xl">
                الطلاقة مش بتجي مرتين في الأسبوع. بتجي كل يوم.
              </h2>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-white/65">
                كل يوم ليك مهمة واحدة صغيرة، والمنصة بتحفظ مكانك وتفكّرك. مجموع
                المهام اليومية هو اللي بيصنع الفرق — مش درس واحد طويل.
              </p>
              <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs text-white/70">
                <Timer className="size-3.5 text-acid" /> متوسط 15 دقيقة في اليوم
              </div>
            </div>
            <ol className="space-y-3">
              {DAILY.map((step, index) => (
                <li
                  key={step.title}
                  className="flex gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4"
                >
                  <span className="latin grid size-8 shrink-0 place-items-center rounded-full bg-white/10 text-xs font-bold">
                    0{index + 1}
                  </span>
                  <div>
                    <p className="flex items-center gap-2 font-semibold">
                      <step.icon className="size-4 text-acid" /> {step.title}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-white/60">
                      {step.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* psychology */}
      <section className="container py-16 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <Eyebrow>النفسية قبل القواعد</Eyebrow>
            <h2 className="mt-4 text-3xl leading-tight text-ink sm:text-4xl">
              إحنا عارفين ليه بتتجمّد
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-ink-soft">
              «رهاب الأداء» حقيقي: دماغك بتفضّل الأمان على الغلط. المنهجية
              بتصمّم التمارين عشان تقلل التوتر وتزيد التعرّض الآمن للموقف —
              تدريجيًا وبجرعات صغيرة.
            </p>
            <div className="mt-6 flex items-center gap-3 rounded-2xl border border-line bg-card p-4">
              <Brain className="size-5 shrink-0 text-iris" />
              <p className="text-xs leading-relaxed text-ink-soft">
                كل تمرين فيه سؤال «إيه اللي كان صعب؟» عشان تتعلّم من الموقف
                نفسه، مش من الدرجة بس.
              </p>
            </div>
          </div>
          <div className="space-y-3">
            {OBSTACLES.map((item, index) => (
              <Reveal
                key={item.title}
                delay={index * 0.05}
                className="hover-lift rounded-2xl border border-line bg-card p-5 sm:p-6"
              >
                <p className="font-semibold text-ink">{item.title}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                  {item.body}
                </p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* levels */}
      <section className="border-y border-line bg-paper-deep/70">
        <div className="container py-16 sm:py-20">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <Eyebrow>مسار المستويات</Eyebrow>
              <h2 className="mt-4 text-3xl leading-tight text-ink sm:text-4xl">
                من A1 لحد C1 — خطوة واحدة في المرة
              </h2>
            </div>
            <p className="max-w-sm text-sm text-ink-soft">
              كل مستوى له مخرجات محددة. مش هتنتقل لمستوى أعلى قبل ما تحقق مخرجات
              اللي قبله.
            </p>
          </div>
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {LEVELS.map((level, index) => (
              <Reveal
                key={level.level}
                delay={index * 0.04}
                className="hover-lift rounded-2xl border border-line bg-card p-5"
              >
                <div className="flex items-center justify-between">
                  <span className="latin text-2xl font-bold text-iris">
                    {level.level}
                  </span>
                  <Ear className="size-4 text-ink-soft/50" />
                </div>
                <p className="mt-2 font-semibold text-ink">{level.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-ink-soft">
                  {level.body}
                </p>
                <p className="mt-3 text-[11px] text-ink-soft">{level.hours}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* stories */}
      <section className="container py-16 sm:py-20">
        <div className="flex items-end justify-between gap-4">
          <div>
            <Eyebrow>نتايج حقيقية</Eyebrow>
            <h2 className="mt-4 text-3xl leading-tight text-ink sm:text-4xl">
              طلبة حصلوا على النتيجة
            </h2>
          </div>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {STORIES.map((story, index) => (
            <Reveal
              key={story.name}
              delay={index * 0.05}
              className="hover-lift flex flex-col rounded-3xl border border-line bg-card p-6"
            >
              <Stars value={5} />
              <blockquote className="mt-3 flex-1 text-[15px] leading-relaxed text-ink">
                “{story.quote}”
              </blockquote>
              <div className="mt-5 flex items-center gap-3 border-t border-line pt-4">
                <UserAvatar name={story.name} size={38} />
                <div className="text-xs">
                  <p className="font-semibold text-ink">{story.name}</p>
                  <p className="mt-0.5 text-ink-soft">{story.role}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container pb-20">
        <div className="relative overflow-hidden rounded-[2rem] border border-iris/25 bg-iris-soft/60 p-8 text-center sm:p-12">
          <StudyDoodles variant="soft" className="rounded-[2rem] opacity-80" />
          <h2 className="mx-auto max-w-2xl text-3xl leading-tight text-ink sm:text-4xl">
            خد خطوة واحدة النهارده: <span className="hl-word">اعرف مستواك</span>{" "}
            وابدأ بالكورس المناسب.
          </h2>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Button
              asChild
              className="h-12 rounded-full bg-iris px-7 text-white hover:bg-iris-deep"
            >
              <Link href="/level-test">ابدأ اختبار المستوى</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-12 rounded-full border-ink/20 bg-transparent px-7"
            >
              <Link href="/pricing">شوف الخطط والأسعار</Link>
            </Button>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
