import { Link } from "wouter";
import { ArrowLeft, BadgePercent, BookOpen, CheckCircle2, Clock3, Gauge, Sparkles, Video } from "lucide-react";
import { PageShell } from "@/components/layout/site-footer";
import { AnimatedAurora, StudyDoodles } from "@/components/decor";
import { Reveal } from "@/components/reveal";
import { SectionHeading } from "@/components/bits";
import { BookingButton } from "@/components/booking";
import { cn } from "@/lib/utils";

const LEVEL_PRICE = 100_000; // 1,000 EGP in piastres
const BUNDLE_PRICE = 250_000; // 2,500 EGP for three levels

const GROUPS = [
  {
    id: "pre",
    name: "Pre-Starter",
    range: "المستويات 1 – 3",
    tagline: "للمبتدئ تمامًا: من الحروف والأصوات لأول جملة",
    tone: "from-[#1d4ed8] to-[#3b82f6]",
    levels: [
      { n: 1, title: "الحروف والأصوات", desc: "أبجدية إنجليزي، أصوات الحروف، وقواعد القراءة الأولى." },
      { n: 2, title: "أول 500 كلمة", desc: "أيام، أرقام، ألوان، عيلة، وأكل مع تدريب نطق." },
      { n: 3, title: "جمل التعارف", desc: "تعريف عن نفسك، أسئلة بسيطة، وردود جاهزة في المحادثة." },
    ],
  },
  {
    id: "core",
    name: "Core",
    range: "المستويات 4 – 9",
    tagline: "من A1 لحد B1 بأزمنة وقواعد ومحادثة أسبوعية",
    tone: "from-[#0f766e] to-[#14b8a6]",
    levels: [
      { n: 4, title: "المضارع البسيط والمستمر", desc: "الروتين اليومي والمواقف اللي بتحصل دلوقتي." },
      { n: 5, title: "الماضي والقصص", desc: "احكي عن يومك وأحداث فاتت بثقة." },
      { n: 6, title: "المستقبل والخطط", desc: "will و going to والترتيبات القريبة." },
      { n: 7, title: "الأزمنة التامة", desc: "Present / Past Perfect في كلام حقيقي مش حفظ." },
      { n: 8, title: "الشرطية والمقارنة", desc: "لو… كان، وأفضل/أكبر، ومقارنة بين أشياء." },
      { n: 9, title: "محادثة B1", desc: "آراء، أسباب، ومواقف شغل وسفر كاملة." },
    ],
  },
  {
    id: "pro",
    name: "Conversation Pro",
    range: "المستويات 10 – 12",
    tagline: "طلاقة، مقابلات عمل، وإقناع",
    tone: "from-[#7c3aed] to-[#a855f7]",
    levels: [
      { n: 10, title: "الطلاقة اليومية", desc: "كلام أسرع، تعبيرات طبيعية، ومن غير ترجمة في دماغك." },
      { n: 11, title: "إنجليزي الشغل", desc: "اجتماعات، إيميلات، وعروض تقديمية." },
      { n: 12, title: "الإقناع والمقابلات", desc: "مقابلات عمل، تفاوض، ورد على أسئلة صعبة." },
    ],
  },
];

const PACKAGES = [
  { id: "one", title: "مستوى واحد", priceCents: LEVEL_PRICE, hint: "أونلاين مباشر + متابعة من المدرّس" },
  { id: "three", title: "3 مستويات مع بعض — خصم 500 ج.م", priceCents: BUNDLE_PRICE, hint: "الأشهر: تكمل 3 مستويات بـ 2500 بدل 3000" },
];

export default function Path() {
  return (
    <PageShell>
      <section className="relative overflow-hidden border-b border-line bg-paper-deep/60">
        <AnimatedAurora className="opacity-50" />
        <StudyDoodles variant="soft" />
        <div className="container grid gap-10 py-12 md:py-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-3 py-1.5 text-xs text-ink-soft">
              <span className="size-1.5 rounded-full bg-iris" /> مسار الاستقلال اللغوي · 12 مستوى
            </span>
            <h1 className="mt-4 text-4xl leading-tight text-ink sm:text-5xl">
              من الصفر لحد B1 في <span className="hl-word">12 مستوى</span>
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-soft">
              3 مستويات Pre-Starter للمبتدئ تمامًا، 6 مستويات أساسية، و3 مستويات محادثة متقدمة. محاضرات أونلاين مباشرة،
              متابعة من المدرّس، وواجبات بتتصحح درس ورا درس.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <BookingButton
                label="احجز مستواك الأول"
                courseTitle="مسار الاستقلال اللغوي"
                courseSlug="independence-path"
                packages={PACKAGES}
                eyebrow="احجز في المسار"
                className="h-12 rounded-full bg-iris px-6 text-white hover:bg-iris-deep"
              />
              <Link
                href="/level-test"
                className="inline-flex h-12 items-center gap-2 rounded-full border border-line bg-card px-6 text-sm font-medium text-ink transition hover:border-iris/50"
              >
                <Gauge className="size-4" /> اعرف مستواك الأول
              </Link>
            </div>
          </div>

          <div className="rounded-[1.8rem] border border-line bg-card p-6 shadow-[0_40px_90px_-70px_rgba(10,27,51,0.6)]">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-ink">سعر المستوى</p>
              <span className="rounded-full bg-iris-soft px-2.5 py-1 text-[11px] font-semibold text-iris">جنيه مصري</span>
            </div>
            <p className="mt-2 flex items-baseline gap-2">
              <span className="latin text-4xl font-bold text-ink">1,000</span>
              <span className="text-sm text-ink-soft">ج.م / المستوى</span>
            </p>
            <div className="mt-5 rounded-2xl border border-dashed border-iris/40 bg-iris/5 p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-iris">
                <BadgePercent className="size-4" /> عرض الـ 3 مستويات
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                احجز 3 مستويات مع بعض بـ <b className="text-ink">2,500 ج.م</b> بدل 3,000 — توفير{" "}
                <b className="text-iris">500 ج.م</b>.
              </p>
            </div>
            <ul className="mt-5 space-y-2.5 text-sm text-ink-soft">
              {[
                { icon: Video, text: "محاضرات أونلاين مباشرة + تسجيلات" },
                { icon: Clock3, text: "درسين أسبوعيًا، كل درس 60 دقيقة" },
                { icon: BookOpen, text: "ملخصات وواجبات واختبار بعد كل مستوى" },
                { icon: CheckCircle2, text: "شهادة إتمام لكل مستوى" },
              ].map(item => (
                <li key={item.text} className="flex items-start gap-2">
                  <item.icon className="mt-0.5 size-4 shrink-0 text-iris" /> {item.text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="container py-14">
        <SectionHeading
          eyebrow="التقسيمة"
          title="12 مستوى مقسمين لثلاث مراحل واضحة"
          description="كل مرحلة ليها هدف محدد، وبتقدر تدخل من أي نقطة بعد اختبار المستوى."
        />

        <div className="mt-10 space-y-10">
          {GROUPS.map((group, groupIndex) => (
            <Reveal key={group.id} delay={groupIndex * 0.05}>
              <div className="overflow-hidden rounded-[1.6rem] border border-line bg-card">
                <div className={cn("flex flex-wrap items-center justify-between gap-3 bg-gradient-to-l px-5 py-4 text-white sm:px-6", group.tone)}>
                  <div>
                    <p className="latin text-xs uppercase tracking-[0.18em] text-white/75">{group.range}</p>
                    <h3 className="mt-0.5 text-xl font-bold">{group.name}</h3>
                  </div>
                  <p className="text-sm text-white/85">{group.tagline}</p>
                </div>
                <div className="grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-3">
                  {group.levels.map(level => (
                    <div key={level.n} className="flex gap-3 bg-card p-5">
                      <span className="latin grid size-9 shrink-0 place-items-center rounded-xl bg-paper text-sm font-bold text-iris">
                        {level.n}
                      </span>
                      <div>
                        <p className="font-semibold text-ink">{level.title}</p>
                        <p className="mt-1 text-xs leading-relaxed text-ink-soft">{level.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="container pb-16">
        <div className="relative overflow-hidden rounded-[2rem] bg-navy px-6 py-10 text-white sm:px-10">
          <div aria-hidden className="absolute -end-16 -top-16 size-56 rounded-full bg-iris/40 blur-3xl" />
          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="flex items-center gap-2 text-xs text-white/70">
                <Sparkles className="size-3.5" /> خصم الحجز المجمّع
              </p>
              <h3 className="mt-2 text-2xl leading-snug sm:text-3xl">
                احجز <span className="text-[#9fc0ff]">3 مستويات</span> ووفّر 500 جنيه
              </h3>
              <p className="mt-2 max-w-xl text-sm text-white/70">
                ابدأ بالمستوى اللي يناسبك وكمّل بعده على طول — بنثبّت لك مكانك في الـ3 مستويات.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <BookingButton
                label="احجز 3 مستويات (2,500 ج.م)"
                courseTitle="مسار الاستقلال اللغوي"
                courseSlug="independence-path"
                packages={PACKAGES}
                eyebrow="عرض الـ3 مستويات"
                className="h-12 rounded-full bg-white px-6 text-navy hover:bg-white/90"
              />
              <Link
                href="/courses"
                className="inline-flex h-12 items-center gap-2 rounded-full border border-white/25 px-6 text-sm text-white transition hover:bg-white/10"
              >
                كل الكورسات <ArrowLeft className="size-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
