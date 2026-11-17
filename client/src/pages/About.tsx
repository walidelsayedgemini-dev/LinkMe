import { useMemo } from "react";
import { Link } from "wouter";
import {
  ArrowLeft,
  BookOpen,
  Check,
  Compass,
  Headphones,
  HeartHandshake,
  Layers3,
  MessageCircle,
  Sparkles,
  Target,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { PageShell } from "@/components/layout/site-footer";
import { LogoMark, LogoWord } from "@/components/brand";
import { trpc } from "@/lib/trpc";
import { YassinAvatar } from "@/components/yassin";
import "./about.css";

const VALUES = [
  {
    number: "01",
    icon: Headphones,
    title: "نفهم الأول",
    body: "الشرح يبدأ بالمصري وبأمثلة من حياتك، عشان تفهم المعنى قبل ما تحفظ شكل القاعدة.",
  },
  {
    number: "02",
    icon: MessageCircle,
    title: "نمارس بجد",
    body: "كل فكرة بتتحول لتمرين أو موقف كلام وكتابة. الهدف إنك تستخدم الإنجليزي، مش بس تعرفه.",
  },
  {
    number: "03",
    icon: HeartHandshake,
    title: "نكمل بمتابعة",
    body: "تقدّمك له مكان واضح: دروس قصيرة، مراجعة، وخطوة بعدها تساعدك تكمل من غير تشتّت.",
  },
];

const STATS = [
  { value: "12", label: "مستوى في مسار الاستقلال" },
  { value: "3", label: "مراحل واضحة للمسار" },
  { value: "2", label: "اختيار للأطفال" },
  { value: "KG → 3 إعدادي", label: "تغطية إنجليزي الأطفال" },
];

const FALLBACK_TRACKS = [
  {
    key: "path",
    title: "مسار الاستقلال اللغوي",
    summary: "12 مستوى من الحروف والأصوات لحد المحادثة، الشغل، والمقابلات.",
    href: "/path",
    badge: "12 مستوى",
    icon: Compass,
  },
  {
    key: "kids",
    title: "إنجليزي الأطفال",
    summary: "فيديوهات ترم وسيشن خاصة من KG لحد تالتة إعدادي.",
    href: "/kids",
    badge: "للأطفال",
    icon: Sparkles,
  },
];

export default function About() {
  const { data: categories, isLoading: categoriesLoading } =
    trpc.catalog.categories.useQuery();
  const { data: yassin, isLoading: yassinLoading } =
    trpc.catalog.instructorBySlug.useQuery({ slug: "yassin" });

  const tracks = useMemo(() => {
    const specialistTracks = (categories ?? [])
      .filter(
        category =>
          !["path", "kids", "independence-path", "english-for-kids"].includes(
            category.slug
          )
      )
      .map(category => ({
        key: category.slug,
        title: category.nameAr,
        summary:
          category.description ||
          `كورسات ${category.nameAr} بتمارين عملية تناسب مستواك.`,
        href: `/courses?category=${encodeURIComponent(category.slug)}`,
        badge: `${category.courseCount} كورس`,
        icon: BookOpen,
      }));

    return [...FALLBACK_TRACKS, ...specialistTracks];
  }, [categories]);

  return (
    <PageShell className="about-page">
      <section className="about-hero">
        <div className="about-hero__grid" aria-hidden="true" />
        <div className="container about-hero__inner">
          <div className="about-hero__copy">
            <p className="about-kicker">عن Link Me · الحكاية ورا الاسم</p>
            <h1>
              الإنجليزي يبقى <span className="hl-word">صلة</span> مش مادة.
            </h1>
            <p className="about-lead">
              Link Me معناها إننا نوصل اللي بتفهمه باللي تقدر تقوله. شرح واضح،
              ممارسة حقيقية، ومتابعة تخلي كل خطوة قريبة من حياتك.
            </p>
            <div className="about-hero__actions">
              <Link
                href="/courses"
                className="about-button about-button--primary"
              >
                شوف مسارات التعلّم <ArrowLeft aria-hidden="true" />
              </Link>
              <Link href="/method" className="about-button about-button--quiet">
                اعرف طريقتنا
              </Link>
            </div>
          </div>

          <div className="about-mark-card">
            <div className="about-mark-card__mark">
              <LogoMark className="about-logo" animated={false} />
            </div>
            <div>
              <p className="about-mark-card__label">ليه الكتاب؟</p>
              <h2>
                مكان تفتح منه <span>صفحة جديدة</span>
              </h2>
              <p>
                الكتاب في العلامة بيمثل الفهم والممارسة، والعلامة الصغيرة جواه
                بتفكّرك إنك تقدر ترجع تكمل من آخر نقطة.
              </p>
            </div>
            <div className="about-mark-card__wordmark">
              <LogoWord className="text-2xl" />
              <span>افهم · اتكلم · كمّل</span>
            </div>
          </div>
        </div>
      </section>

      <section className="container about-section about-section--values">
        <div className="about-section__heading">
          <p className="about-kicker">الطريقة اللي بنشتغل بيها</p>
          <h2>
            ثلاث حاجات بتخلّي التعلّم <span>يمشي</span>
          </h2>
          <p>
            مش بنبيع وعود كبيرة؛ بنبني تجربة تقدر تفهمها وتستخدمها وتكمل فيها.
          </p>
        </div>
        <div className="about-values">
          {VALUES.map(value => (
            <article className="about-value-card" key={value.number}>
              <div className="about-value-card__top">
                <span className="about-value-card__number latin">
                  {value.number}
                </span>
                <span className="about-icon">
                  <value.icon aria-hidden="true" />
                </span>
              </div>
              <h3>{value.title}</h3>
              <p>{value.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="about-purpose">
        <div className="container about-purpose__inner">
          <div className="about-purpose__intro">
            <p className="about-kicker">الرسالة والرؤية</p>
            <h2>
              نتعلم عشان نستخدم، مش عشان <span>نخلّص</span>.
            </h2>
            <p>
              المنصة معمولة للطالب اللي عايز لغة تدخل معاه في يومه: يفهم درس،
              يرد في مكالمة، يكتب إيميل، أو يساعد ابنه.
            </p>
          </div>
          <div className="about-purpose__cards">
            <article className="about-purpose-card">
              <span className="about-purpose-card__icon">
                <Target aria-hidden="true" />
              </span>
              <div>
                <p className="about-card-label">رسالتنا</p>
                <h3>نوصل الشرح بالتطبيق</h3>
                <p>
                  نقدّم كورسات إنجليزي بالعربي المصري، بتدرّج وتمارين واقعية،
                  عشان كل درس يبقى له استخدام واضح.
                </p>
              </div>
            </article>
            <article className="about-purpose-card">
              <span className="about-purpose-card__icon">
                <Layers3 aria-hidden="true" />
              </span>
              <div>
                <p className="about-card-label">رؤيتنا</p>
                <h3>تعلّم مفهوم ومستمر</h3>
                <p>
                  نبني مكان يخلي الطالب يعرف يبدأ منين، ويشوف الخطوة الجاية،
                  ويلاقي مساحة يرجع لها وقت ما يحتاج.
                </p>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="container about-section about-section--stats">
        <div className="about-section__heading about-section__heading--split">
          <div>
            <p className="about-kicker">الموجود على المنصة دلوقتي</p>
            <h2>
              رحلتك في <span>أرقام</span>
            </h2>
          </div>
          <p>
            من أول خطوة في مسار الاستقلال لحد اختيار التعلّم المناسب لأطفالك.
          </p>
        </div>
        <div className="about-stats" aria-label="إحصائيات Link Me البنيوية">
          {STATS.map(stat => (
            <div className="about-stat" key={stat.label}>
              <strong
                className={
                  stat.value.includes("→")
                    ? "about-stat__value about-stat__value--compact"
                    : "about-stat__value latin"
                }
              >
                {stat.value}
              </strong>
              <span>{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="about-tracks">
        <div className="container about-section">
          <div className="about-section__heading about-section__heading--split">
            <div>
              <p className="about-kicker">دليل المسارات</p>
              <h2>
                اختار نقطة البداية <span>بتاعتك</span>
              </h2>
            </div>
            <p>
              افتح أي مسار عشان تشوف تفاصيله، أو ادخل على تصنيف متخصص من
              الكتالوج مباشرة.
            </p>
          </div>

          <Accordion type="single" collapsible className="about-accordion">
            {tracks.map((track, index) => {
              const Icon = track.icon;
              return (
                <AccordionItem
                  value={track.key}
                  key={track.key}
                  className="about-track"
                >
                  <AccordionTrigger className="about-track__trigger">
                    <span className="about-track__index latin">
                      0{index + 1}
                    </span>
                    <span className="about-track__icon">
                      <Icon aria-hidden="true" />
                    </span>
                    <span className="about-track__title-wrap">
                      <span className="about-track__title">{track.title}</span>
                      <span className="about-track__badge">{track.badge}</span>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="about-track__content">
                    <div>
                      <p>{track.summary}</p>
                      <Link href={track.href} className="about-inline-link">
                        افتح المسار <ArrowLeft aria-hidden="true" />
                      </Link>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
          {categoriesLoading && (
            <p className="about-loading">بنجهّز تصنيفات الكتالوج…</p>
          )}
        </div>
      </section>

      <section className="container about-section about-team">
        <div className="about-section__heading">
          <p className="about-kicker">الناس اللي هتلاقيهم معاك</p>
          <h2>
            مشوارك له <span>وشّ إنساني</span>
          </h2>
          <p>
            تعرّف على المرشد الظاهر في المنصة، وخلي تواصلك مع الفريق مفتوح لو
            عندك سؤال.
          </p>
        </div>
        <div className="about-team__grid">
          <article className="about-profile-card">
            <div className="about-profile-card__avatar">
              <YassinAvatar size={92} />
            </div>
            <div className="about-profile-card__body">
              <p className="about-card-label">مرشد الرحلة</p>
              <h3>{yassin?.name ?? "ياسين"}</h3>
              <p className="about-profile-card__role">
                {yassin?.title ?? "مساعدك في الرحلة"}
              </p>
              <p className="about-profile-card__bio">
                {yassin?.bio ??
                  "شخصية افتراضية بترافقك في الاختبارات والكورسات وتفكّرك إن الخطوة الصغيرة برضه تقدّم."}
              </p>
              <Link href="/instructors/yassin" className="about-inline-link">
                شوف ملف ياسين <ArrowLeft aria-hidden="true" />
              </Link>
            </div>
            {yassinLoading && (
              <span className="about-profile-card__status">
                جارٍ تحميل الملف…
              </span>
            )}
          </article>
          <article className="about-contact-card">
            <span className="about-contact-card__icon">
              <MessageCircle aria-hidden="true" />
            </span>
            <p className="about-card-label">محتاج مساعدة؟</p>
            <h3>فريق Link Me قريب منك</h3>
            <p>
              لو محتار تبدأ منين أو عندك سؤال عن كورس، ابعتلنا من صفحة التواصل
              ونرجع لك بالمعلومة المناسبة.
            </p>
            <Link
              href="/contact"
              className="about-button about-button--primary"
            >
              تواصل مع الفريق <ArrowLeft aria-hidden="true" />
            </Link>
          </article>
        </div>
      </section>

      <section className="container about-section about-section--cta">
        <div className="about-cta">
          <div>
            <p className="about-kicker">خطوتك الجاية</p>
            <h2>
              ابدأ من المكان اللي <span>يناسبك.</span>
            </h2>
            <p>
              اختبر مستواك، تصفّح الكورسات، أو شوف المسار الكامل قبل ما تقرر.
            </p>
          </div>
          <div className="about-cta__actions">
            <Link
              href="/level-test"
              className="about-button about-button--primary"
            >
              اختبار المستوى <ArrowLeft aria-hidden="true" />
            </Link>
            <Link href="/path" className="about-button about-button--light">
              مسار الاستقلال <Check aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
