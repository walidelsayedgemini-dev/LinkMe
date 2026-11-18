import {
  ArrowLeft,
  ArrowDown,
  Award,
  BookOpen,
  Check,
  Clock3,
  Gauge,
  GraduationCap,
  MessageCircle,
  QrCode,
  Sparkles,
  Star,
  Trophy,
  Video,
  Zap,
} from "lucide-react";
import { useEffect } from "react";
import { Link } from "wouter";
import { PageShell } from "@/components/layout/site-footer";
import { SectionHeading } from "@/components/bits";
import { CourseCard } from "@/components/course-card";
import { LearningPreview } from "@/components/learning-preview";
import { HeroLogo } from "@/components/hero-logo";
import { Reveal } from "@/components/reveal";
import { PlanCards } from "@/components/plan-cards";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useCompanion, CompanionAvatar, CompanionMotivationalBanner } from "@/components/companion";
import { trpc } from "@/lib/trpc";
import { categoryIcon, FAQ_GROUPS } from "@/lib/content";

function Label({
  number,
  children,
}: {
  number: string;
  children: React.ReactNode;
}) {
  return (
    <p className="editorial-label mb-4">
      <span className="section-number">{number}</span>
      {children}
    </p>
  );
}

export default function Home() {
  const { companion } = useCompanion();
  const featured = trpc.catalog.featured.useQuery();
  const categories = trpc.catalog.categories.useQuery();
  const instructors = trpc.catalog.instructors.useQuery({});
  const lead = instructors.data?.find(item => item.slug === "yassin");

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    const timer = setTimeout(
      () =>
        document
          .getElementById(hash)
          ?.scrollIntoView({ block: "start", behavior: "smooth" }),
      100
    );
    return () => clearTimeout(timer);
  }, []);

  return (
    <PageShell className="site-page">
      <section id="top" className="home-hero scroll-mt-24">
        <div className="container">
          <div className="hero-layout">
            <div>
              <p className="editorial-label">
                LINK ME · إنجليزي أونلاين، بروح مصرية
              </p>
              <h1 className="mt-5">
                اتكلّم إنجليزي.
                <br />
                <span className="hl-word">من غير ما تترجم.</span>
              </h1>
              <p className="hero-copy mt-5 text-ink-soft">
                مش محتاج تحفظ كلمات أكتر. محتاج تستخدم اللي تعرفه. شرح بسيط،
                مواقف من حياتك، ومدرّس يتابعك خطوة بخطوة — لحد ما الكلام ييجي
                لوحده.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Button
                  asChild
                  className="h-12 rounded-full bg-iris px-6 text-white hover:bg-iris-deep"
                >
                  <Link href="/courses">
                    شوف الكورسات <ArrowLeft className="size-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="h-12 rounded-full border-line bg-card px-5 text-ink"
                >
                  <Link href="/level-test">
                    <Gauge className="size-4 text-iris" /> اعرف مستواك
                  </Link>
                </Button>
              </div>
              <div className="hero-benefits">
                <span>
                  <Check /> شرح بالمصري
                </span>
                <span>
                  <Check /> محاضرات أونلاين
                </span>
                <span>
                  <Check /> متابعة لتقدّمك
                </span>
              </div>
              <a
                href="#courses"
                className="mt-8 inline-flex items-center gap-2 text-xs text-ink-soft"
              >
                <ArrowDown className="size-3.5" /> اكتشف خطوتك الجاية
              </a>
            </div>
            <HeroLogo />
          </div>
          <div className="home-trust">
            {[
              {
                icon: Video,
                title: "معلّم معاك، مش فيديو وبس",
                text: "جلسات لايف ومساحة تسأل وتجرب",
              },
              {
                icon: BookOpen,
                title: "من أول كلمة لأول محادثة",
                text: "مسار تأسيس واضح من 12 مستوى",
              },
              {
                icon: GraduationCap,
                title: "كل خطوة ليها متابعة",
                text: "حضور، مهام وتقييم في حسابك",
              },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title}>
                <Icon className="size-6 shrink-0 text-iris" strokeWidth={1.6} />
                <div>
                  <p>{title}</p>
                  <small>{text}</small>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container pt-6">
        <CompanionMotivationalBanner className="mb-6" />

        {/* Interactive Free Playground Showcase — Rich Branded Visual Cards (60 FPS, zero blur-3xl/backdrop-blur) */}
        <div className="relative mb-6 overflow-hidden rounded-[28px] border border-iris/20 bg-gradient-to-br from-[#0e2248] via-[#173673] to-[#1e40af] p-5 sm:p-8 text-white shadow-[0_24px_60px_-25px_rgba(37,99,255,0.45)]">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(520px circle at 90% 10%, rgba(56, 189, 248, 0.22), transparent 60%), radial-gradient(460px circle at 10% 90%, rgba(251, 191, 36, 0.16), transparent 60%)",
            }}
          />

          <div className="relative flex flex-wrap items-end justify-between gap-3">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-bold text-amber-300">
                <Sparkles className="size-3.5" /> جرّب مجاناً من غير تسجيل
              </span>
              <h2 className="mt-2.5 text-xl font-extrabold text-white sm:text-3xl">
                أدوات Link Me التفاعلية — اتعلّم والعب كل يوم 🔥
              </h2>
            </div>
            <Link
              href="/competitions"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-white hover:text-iris"
            >
              ادخل ساحة التحديات <ArrowLeft className="size-3.5" />
            </Link>
          </div>

          <div className="relative mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                href: "/roleplay",
                bgImage: "/img/ui/tool-roleplay.webp",
                overlay: "from-[#0b1736]/95 via-[#132a5c]/80 to-[#1e3a8a]/55",
                accentBorder: "hover:border-sky-300/80",
                badge: "1,000 موقف (A1–C2) 👑",
                title: "محاكي المواقف الحقيقية",
                desc: "1,000 موقف حياتي مقسّمين مستويات (إنترفيو، سفر، آيلتس، فريلانس) بصوتك.",
                icon: MessageCircle,
                iconBg: "bg-sky-950/75 text-sky-200 border-sky-300/35",
              },
              {
                href: "/flashcards",
                bgImage: "/img/ui/tool-flashcards.webp",
                overlay: "from-[#062b26]/95 via-[#0d4a40]/80 to-[#0f766e]/55",
                accentBorder: "hover:border-emerald-300/80",
                badge: "180 بطاقة · 8 حزم",
                title: "فلاش كاردز الكلمات",
                desc: "180 بطاقة بصور واقعية فريدة + النطق الأمريكي وملخصات PDF للطباعة.",
                icon: BookOpen,
                iconBg: "bg-emerald-950/75 text-emerald-200 border-emerald-300/35",
              },
              {
                href: "/speed-quiz",
                bgImage: "/img/ui/tool-speedquiz.webp",
                overlay: "from-[#351806]/95 via-[#6b2d0c]/80 to-[#b45309]/55",
                accentBorder: "hover:border-amber-300/80",
                badge: "100 سؤال · ماراثون PRO",
                title: "تحدي الـ 60 ثانية اليومي",
                desc: "أسئلة سريعة بتايمر وكومبو وكارت نتيجة جاهز للمشاركة على واتساب.",
                icon: Zap,
                iconBg: "bg-amber-950/75 text-amber-200 border-amber-300/40",
              },
              {
                href: "/competitions",
                bgImage: "/img/ui/tool-competitions.webp",
                overlay: "from-[#220e42]/95 via-[#3b166e]/80 to-[#6d28d9]/55",
                accentBorder: "hover:border-purple-300/80",
                badge: "100 أفتار + سكنات 👑",
                title: "دوري المسابقات والحماسة",
                desc: "نافس أبطال اليوم والأسبوع والشهر والسنة واختار من 100 أفتار فخم!",
                icon: Trophy,
                iconBg: "bg-purple-950/75 text-purple-200 border-purple-300/40",
              },
            ].map(tool => {
              const Icon = tool.icon;
              return (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className={`group relative flex min-h-[225px] flex-col justify-between overflow-hidden rounded-2xl border border-white/15 p-5 shadow-md transition-transform duration-200 hover:-translate-y-1 ${tool.accentBorder}`}
                >
                  <img
                    src={tool.bgImage}
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div
                    aria-hidden="true"
                    className={`absolute inset-0 bg-gradient-to-t ${tool.overlay}`}
                  />

                  <div className="relative flex items-center justify-between gap-2">
                    <span
                      className={`grid size-10 place-items-center rounded-xl border ${tool.iconBg}`}
                    >
                      <Icon className="size-5" />
                    </span>
                    <span className="rounded-full border border-white/20 bg-black/55 px-2.5 py-1 text-[10px] font-bold text-white">
                      {tool.badge}
                    </span>
                  </div>

                  <div className="relative mt-6">
                    <h3 className="text-base font-extrabold text-white">
                      {tool.title}
                    </h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-white/85">
                      {tool.desc}
                    </p>
                    <span className="mt-3.5 inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold text-white transition-colors group-hover:bg-white group-hover:text-iris">
                      جرّبها الآن <ArrowLeft className="size-3" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-iris/25 bg-gradient-to-l from-iris-soft/80 via-card to-sky-50/70 p-5 dark:from-iris-soft/40 dark:via-card dark:to-card">
          <p className="text-sm font-medium leading-relaxed text-ink">
            ليه Link Me؟ فهم وممارسة ومتابعة —{" "}
            <span className="font-bold text-iris">رحلة ليها معنى.</span>
          </p>
          <Link
            href="/about"
            className="inline-flex items-center gap-2 rounded-full bg-iris px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-iris-deep"
          >
            اعرف المنصة وقيمها <ArrowLeft className="size-3.5" />
          </Link>
        </div>
      </section>
      <section id="courses" className="home-section container">
        <Label number="01">الكورسات والمسارات</Label>
        <SectionHeading
          title={
            <>
              ابدأ من الكورس <span className="hl-word">اللي يخصك.</span>
            </>
          }
          description="محادثة، قواعد، سفر أو شغل. افتح الكورس واعرف المنهج، المستوى وتفاصيل الحجز قبل ما تختار."
          action={
            <Button asChild variant="outline" className="rounded-full bg-card">
              <Link href="/courses">
                كل الكورسات <ArrowLeft className="size-4" />
              </Link>
            </Button>
          }
        />
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featured.isLoading
            ? [1, 2, 3].map(i => (
                <div
                  key={i}
                  className="h-[390px] animate-pulse rounded-3xl bg-paper-deep"
                  aria-label="جارٍ تحميل الكورس"
                />
              ))
            : featured.data
                ?.slice(0, 6)
                .map(course => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    className="h-full"
                  />
                ))}
        </div>
        {featured.isError && (
          <div className="mt-6 rounded-2xl border border-line bg-card p-5 text-sm text-ink-soft">
            مش قدرنا نحمّل الكورسات.{" "}
            <button
              onClick={() => void featured.refetch()}
              className="font-semibold text-iris"
            >
              جرّب تاني
            </button>
          </div>
        )}

        <div className="mt-8 grid gap-5 lg:grid-cols-[1.2fr_1fr]">
          <article className="group relative overflow-hidden rounded-[28px] border border-iris/30 p-7 text-white shadow-md sm:p-8">
            <img
              src="/img/ui/path-independence.webp"
              alt=""
              aria-hidden="true"
              loading="lazy"
              decoding="async"
              className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-[#091833]/95 via-[#102b5c]/82 to-[#1d4ed8]/60"
            />
            <div className="relative flex h-full flex-col justify-between gap-4">
              <div>
                <span className="latin inline-block rounded-full border border-white/25 bg-black/40 px-3 py-1 text-[10px] font-bold tracking-wider text-sky-200">
                  THE INDEPENDENCE PATH / 12 LEVELS
                </span>
                <h3 className="mt-3 text-2xl font-extrabold text-white sm:text-3xl">
                  من الصفر لحد <span className="latin text-amber-300">B1.</span>
                </h3>
                <p className="mt-2.5 max-w-xl text-sm leading-relaxed text-white/85">
                  رحلة متكاملة: 3 مستويات Pre-Starter، و6 أساسية، و3 محادثة متقدمة.
                  تبدأ من مستواك، وتكمّل بخطوات واضحة.
                </p>
                <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-bold text-white">
                  <span className="latin rounded-full border border-white/20 bg-white/15 px-3 py-1">01–03 · Pre-Starter</span>
                  <span className="latin rounded-full border border-white/20 bg-white/15 px-3 py-1">04–09 · Core</span>
                  <span className="latin rounded-full border border-white/20 bg-white/15 px-3 py-1">10–12 · Conversation</span>
                </div>
              </div>
              <Link
                href="/path"
                className="inline-flex w-fit items-center gap-2 rounded-full bg-white px-5 py-2.5 text-xs font-extrabold text-[#0e2248] transition-colors hover:bg-amber-300"
              >
                اكتشف المسار وتفاصيل الحجز <ArrowLeft className="size-4" />
              </Link>
            </div>
          </article>

          <article className="group relative overflow-hidden rounded-[28px] border border-emerald-400/35 p-7 text-white shadow-md sm:p-8">
            <img
              src="/img/ui/path-kids.webp"
              alt=""
              aria-hidden="true"
              loading="lazy"
              decoding="async"
              className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-[#062b26]/95 via-[#0d4d42]/82 to-[#0f766e]/58"
            />
            <div className="relative flex h-full flex-col justify-between gap-4">
              <div>
                <span className="latin inline-block rounded-full border border-white/25 bg-black/40 px-3 py-1 text-[10px] font-bold tracking-wider text-emerald-200">
                  KIDS INTERACTIVE / KG → PREP 3
                </span>
                <h3 className="mt-3 text-2xl font-extrabold text-white sm:text-3xl">
                  الإنجليزي للصغيرين <span className="text-amber-300">لعبة.</span>
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-white/85">
                  من KG لحد تالتة إعدادي: شرح بالأنيميشن وحل الكتب الخارجية.
                  فيديوهات للترم أو سيشن خاصة حسب احتياج ابنك.
                </p>
              </div>
              <Link
                href="/kids"
                className="inline-flex w-fit items-center gap-2 rounded-full bg-amber-400 px-5 py-2.5 text-xs font-extrabold text-[#0a1b33] transition-colors hover:bg-amber-300"
              >
                شوف إنجليزي الأطفال <ArrowLeft className="size-4" />
              </Link>
            </div>
          </article>
        </div>

        {/* 6 Category Cards — Unique Branded Realistic Backgrounds (Zero Flat White!) */}
        <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.data
            ?.filter(c => !["kids", "path"].includes(c.slug))
            .map(category => {
              const Icon = categoryIcon(category.icon);
              const visualMap: Record<
                string,
                { img: string; overlay: string; iconBg: string }
              > = {
                grammar: {
                  img: "/img/ui/cat-grammar.webp",
                  overlay: "from-[#0a1b33]/94 via-[#142f61]/82 to-[#1e40af]/58",
                  iconBg: "bg-sky-950/75 text-sky-200 border-sky-300/35",
                },
                speaking: {
                  img: "/img/ui/cat-speaking.webp",
                  overlay: "from-[#062b26]/94 via-[#0d4d42]/82 to-[#0d9488]/58",
                  iconBg: "bg-emerald-950/75 text-emerald-200 border-emerald-300/35",
                },
                vocabulary: {
                  img: "/img/ui/cat-vocabulary.webp",
                  overlay: "from-[#1d1145]/94 via-[#371f7a]/82 to-[#6d28d9]/58",
                  iconBg: "bg-violet-950/75 text-violet-200 border-violet-300/35",
                },
                ielts: {
                  img: "/img/ui/cat-ielts.webp",
                  overlay: "from-[#330d12]/94 via-[#661924]/82 to-[#b91c1c]/58",
                  iconBg: "bg-rose-950/75 text-rose-200 border-rose-300/35",
                },
                business: {
                  img: "/img/ui/cat-business.webp",
                  overlay: "from-[#0d1c36]/94 via-[#1e355e]/82 to-[#b45309]/60",
                  iconBg: "bg-amber-950/75 text-amber-200 border-amber-300/35",
                },
                writing: {
                  img: "/img/ui/cat-writing.webp",
                  overlay: "from-[#12263a]/94 via-[#1e4363]/82 to-[#0284c7]/58",
                  iconBg: "bg-cyan-950/75 text-cyan-200 border-cyan-300/35",
                },
              };
              const v = visualMap[category.slug] ?? visualMap.grammar;
              return (
                <Link
                  key={category.id}
                  href={`/courses?category=${category.slug}`}
                  className="group relative flex min-h-[168px] flex-col justify-between overflow-hidden rounded-3xl border border-white/15 p-5 text-white shadow-md transition-transform duration-200 hover:-translate-y-1 hover:border-sky-300/70 [content-visibility:auto]"
                >
                  <img
                    src={v.img}
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div
                    aria-hidden="true"
                    className={`absolute inset-0 bg-gradient-to-t ${v.overlay}`}
                  />
                  <div className="relative flex items-start justify-between gap-3">
                    <span
                      className={`grid size-11 shrink-0 place-items-center rounded-2xl border ${v.iconBg}`}
                    >
                      <Icon className="size-5" strokeWidth={1.8} />
                    </span>
                    <span className="latin rounded-full border border-white/20 bg-black/45 px-2.5 py-0.5 text-[10px] font-bold text-white/90">
                      {category.nameEn}
                    </span>
                  </div>
                  <div className="relative mt-4">
                    <h3 className="text-lg font-extrabold text-white">
                      {category.nameAr}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-white/85">
                      {category.description}
                    </p>
                  </div>
                </Link>
              );
            })}
        </div>
      </section>

      <section id="method" className="home-section container">
        <div className="section-divider !mt-0 mb-10" />
        <Label number="02">طريقتنا في التعلّم</Label>
        <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:gap-20">
          <div>
            <SectionHeading
              title={
                <>
                  افهمها. جرّبها.
                  <br />
                  <span className="hl-word">اتكلّم بيها.</span>
                </>
              }
              description="مش هنسيبك قدام منهج طويل من غير اتجاه. كل مرحلة هدف واضح، وكل تدريب خطوة للكلام بثقة."
            />
            <Button
              asChild
              variant="outline"
              className="mt-7 rounded-full bg-card"
            >
              <Link href="/method">
                اعرف منهجيتنا <ArrowLeft className="size-4" />
              </Link>
            </Button>
          </div>
          <div>
            {[
              {
                title: "نبدأ من مكانك",
                text: "اختبار قصير يساعدك تختار نقطة بداية تناسب معرفتك الحالية.",
              },
              {
                title: "نحوّل القاعدة لموقف",
                text: "تعارف، مطعم، اجتماع أو سفر. تفهم المعنى وتجرّب الجملة بدل الحفظ وبس.",
              },
              {
                title: "نكمل ونتابع معاك",
                text: "شوف تقدّمك، حضورك ومهامك في بروفايلك، واستقبل تقييم المدرّس.",
              },
            ].map((step, i) => (
              <div className="method-step" key={step.title}>
                <span>0{i + 1}</span>
                <div>
                  <h3 className="text-ink">{step.title}</h3>
                  <p>{step.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="home-section container">
        <LearningPreview />
      </section>

      <section id="level-test" className="home-section container">
        <Label number="03">اختبار تحديد المستوى</Label>
        <div className="grid items-center gap-7 rounded-[28px] border border-line bg-iris-soft p-6 sm:p-10 lg:grid-cols-[1fr_auto]">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <CompanionAvatar size={50} />
              <span className="text-xs font-semibold text-ink-soft">
                {companion.name} · {companion.badge} {companion.favoriteEmoji}
              </span>
            </div>
            <h2 className="text-3xl leading-snug text-ink sm:text-4xl">
              مش عارف تبدأ منين؟
              <br />
              <span className="hl-word">نلاقيها مع بعض.</span>
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-soft">
              بنك 1000 سؤال، ومراحل قصيرة من A1 لحد C2. كل مرحلة 12 سؤال مع
              {" "}{companion.name}، وتقدر ترتاح وتكمّل وقت ما تحب. نتيجة تقديرية وترشيحات تناسب
              إجاباتك، مش شهادة مستوى معتمدة.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <Button
              asChild
              className="h-12 rounded-full bg-iris px-7 text-white hover:bg-iris-deep"
            >
              <Link href="/level-test">
                يلا نعرف مستواك <ArrowLeft className="size-4" />
              </Link>
            </Button>
            <span className="text-center text-xs text-ink-soft">
              متاح من غير إنشاء حساب
            </span>
          </div>
        </div>
      </section>

      <section id="instructors" className="home-section container">
        <Label number="04">المدرّس والمتابعة</Label>
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_1fr]">
          <div>
            <SectionHeading
              title={
                <>
                  ورا كل خطوة،
                  <br />
                  <span className="hl-word">معلّم معاك.</span>
                </>
              }
              description="أ. ياسين بيبسّط القاعدة ويقرّبها لمواقف من حياتك. الهدف مش تحفظ الإجابة؛ الهدف تعرف تستخدم الإنجليزي بنفسك."
            />
            <div className="mt-6 flex flex-wrap gap-2">
              {["تأسيس المبتدئين", "محادثة عملية", "متابعة وتقييم"].map(s => (
                <span
                  key={s}
                  className="rounded-full border border-line bg-card px-3 py-1.5 text-xs text-ink-soft"
                >
                  {s}
                </span>
              ))}
            </div>
            <Button
              asChild
              variant="outline"
              className="mt-7 rounded-full bg-card"
            >
              <Link href={lead ? "/instructors/yassin" : "/instructors"}>
                اعرف أ. ياسين <ArrowLeft className="size-4" />
              </Link>
            </Button>
          </div>
          <div className="overflow-hidden rounded-[28px] border border-iris/25 bg-gradient-to-br from-iris-soft/50 via-card to-sky-50/40 shadow-sm dark:from-iris-soft/30 dark:via-card dark:to-card">
            <div className="relative h-36 overflow-hidden">
              <img
                src="/img/ui/home-live-session.webp"
                alt=""
                aria-hidden="true"
                loading="lazy"
                decoding="async"
                className="size-full object-cover"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-[#0e2248]/95 via-[#173673]/65 to-transparent"
              />
              <div className="absolute inset-x-6 bottom-4 flex items-center gap-3 text-white">
                <span className="grid size-11 place-items-center rounded-xl border border-white/25 bg-white/15 text-sky-200">
                  <MessageCircle className="size-5" />
                </span>
                <div>
                  <h3 className="text-base font-extrabold text-white">
                    مساحة تتكلم، مش تتفرّج.
                  </h3>
                  <p className="text-xs text-sky-200">جلسات أونلاين مباشرة</p>
                </div>
              </div>
            </div>
            <div className="p-6 sm:p-7">
              <p className="text-sm leading-[1.9] text-ink-soft">
                تسأل، تجاوب، تغلط وتجرّب تاني. في حسابك هتلاقي الجلسات، التكليفات
                وملاحظات المدرّس؛ عشان تعرف إيه اللي اتحسن وإيه خطوتك الجاية.
              </p>
              <Link
                href="/instructors"
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-iris"
              >
                قسم المدربين <ArrowLeft className="size-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="home-section container">
        <Label number="05">الخطط والحجز</Label>
        <SectionHeading
          title={
            <>
              اختار بداية <span className="hl-word">على قدك.</span>
            </>
          }
          description="شوف الباقة ومزاياها، وسيب بياناتك لتأكيد التفاصيل والدفع على واتساب. طلب الحجز مش تأكيد دفع."
        />
        <div className="mt-8">
          <PlanCards />
        </div>
      </section>

      <section className="home-section container">
        <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          {/* Student Testimonials */}
          <div className="rounded-3xl border border-iris/25 bg-gradient-to-br from-iris-soft/55 via-card to-amber-50/45 p-6 sm:p-7 dark:from-iris-soft/30 dark:via-card dark:to-amber-950/15">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-bold text-amber-700 dark:text-amber-300">
                <Star className="size-3.5 fill-amber-500 text-amber-500" /> آراء
                طلبة وأولياء أمور Link Me
              </span>
              <span className="latin text-xs font-bold text-ink-soft">
                4.9 / 5.0 ⭐
              </span>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                {
                  name: "سلمى — مستوى B1",
                  quote:
                    "أول مرة أتكلم في إنترفيو إنجليزي من غير ما أقف وأترجم في دماغي! محاكي المواقف والفلاش كاردز فرقوا معايا جداً.",
                },
                {
                  name: "ولية أمر عمر — 5 ابتدائي",
                  quote:
                    "ابني بقى بيفتح الموقع لوحده عشان يحافظ على شعلة الحماسة والأفتار، وتقرير المتابعة اللي بيجيلي على واتساب مطمّني جداً.",
                },
              ].map(review => (
                <div
                  key={review.name}
                  className="rounded-2xl border border-line bg-paper-deep/50 p-4"
                >
                  <p className="text-xs leading-relaxed text-ink">
                    “{review.quote}”
                  </p>
                  <p className="mt-2.5 text-[11px] font-bold text-iris">
                    — {review.name}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Official QR Certificate Verification Card */}
          <div className="flex flex-col justify-between rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-card to-iris/5 p-6 sm:p-7">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                <QrCode className="size-3.5" /> شهادات معتمدة قابلة للتحقق
              </span>
              <h3 className="mt-3 text-xl font-bold text-ink">
                شهادة إتقان رسمية بـ QR Code 🎓
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-ink-soft">
                كل شهادة بتصدر من Link Me ليها رقم تسلسلي فريد وكود QR يقدر أي
                مدير توظيف أو شركة يمسحه ويتأكد من صحتها فوراً على موقعنا.
              </p>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button
                asChild
                size="sm"
                className="rounded-full bg-emerald-600 text-white hover:bg-emerald-700"
              >
                <Link href="/verify">
                  <Award className="me-1.5 size-4" /> تحقق من شهادة الآن
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline" className="rounded-full">
                <Link href="/level-test">ابدأ اختبار المستوى</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section id="faq" className="home-section container">
        <Label number="06">قبل ما تبدأ</Label>
        <div className="grid gap-8 lg:grid-cols-[.8fr_1.2fr]">
          <div>
            <SectionHeading
              title={
                <>
                  أسئلة تستاهل <span className="hl-word">إجابة.</span>
                </>
              }
              description="ولو سؤالك مش هنا، كلّمنا ونساعدك تختار."
            />
            <Button
              asChild
              variant="outline"
              className="mt-6 rounded-full bg-card"
            >
              <Link href="/faq">
                كل الأسئلة <ArrowLeft className="size-4" />
              </Link>
            </Button>
          </div>
          <Accordion
            type="single"
            collapsible
            className="rounded-3xl border border-line bg-card px-5 sm:px-7"
          >
            {FAQ_GROUPS[0].items.slice(0, 4).map((item, i) => (
              <AccordionItem
                key={item.q}
                value={`q-${i}`}
                className="border-line"
              >
                <AccordionTrigger className="text-start text-sm leading-relaxed text-ink hover:no-underline">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed text-ink-soft">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <section className="home-section container">
        <Reveal>
          <div className="rounded-[28px] border border-iris/20 bg-iris-soft p-7 sm:p-11">
            <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
              <div>
                <span className="mb-3 flex items-center gap-2 text-xs text-iris">
                  <Sparkles className="size-4" /> خطوتك الجاية أبسط مما تتخيّل
                </span>
                <h2 className="text-3xl leading-snug text-ink">
                  أول جملة واثقة.
                  <br />
                  <span className="hl-word">تبدأ النهارده.</span>
                </h2>
              </div>
              <Button
                asChild
                className="h-12 rounded-full bg-iris px-7 text-white hover:bg-iris-deep"
              >
                <Link href="/signup">
                  اعمل حسابك <ArrowLeft className="size-4" />
                </Link>
              </Button>
            </div>
          </div>
        </Reveal>
      </section>
    </PageShell>
  );
}
