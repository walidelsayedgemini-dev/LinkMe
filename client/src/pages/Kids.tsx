import { Link } from "wouter";
import {
  ArrowLeft,
  BookMarked,
  CalendarDays,
  CheckCircle2,
  Clock3,
  PlayCircle,
  Sparkles,
  UserRound,
  Users,
} from "lucide-react";
import { PageShell } from "@/components/layout/site-footer";
import { AnimatedAurora, StudyDoodles } from "@/components/decor";
import { Reveal } from "@/components/reveal";
import { SectionHeading } from "@/components/bits";
import { BookingButton, type BookingPackage } from "@/components/booking";
import { trpc } from "@/lib/trpc";
import {
  KIDS_EXTRA_LESSONS,
  KIDS_GRADES,
} from "../../../shared/booking-catalog";

const KIDS_PACKAGES: BookingPackage[] = [
  {
    id: "term",
    title: "فيديوهات الترم (مسجّلة)",
    priceCents: 100_000,
    hint: "1000 جنيه للترم — فيديوهات أنيميشن + حل الكتب الخارجية",
  },
  {
    id: "session",
    title: "سيشن خاصة أونلاين",
    priceCents: 20_000,
    hint: "200 جنيه للسيشن الواحدة — مدرّس خاص ومتابعة فردية",
  },
];

const PRIVATE_PACKAGES: BookingPackage[] = [
  {
    id: "course",
    title: "سيشن خاصة 60 دقيقة",
    priceCents: 20_000,
    hint: "200 جنيه للسيشن — مدرّس خاص ومتابعة فردية",
  },
];

const STAGES = [
  {
    key: "kg" as const,
    title: "رياض الأطفال (KG)",
    eyebrow: "المرحلة الأولى",
    image: "/img/kids-kg.webp",
    text: "حروف وأصوات وأغاني وأنشطة — الطفل بيتعلم وهو بيلعب، من غير ضغط ولا حفظ.",
    accent: "bg-[#f59e0b]",
  },
  {
    key: "primary" as const,
    title: "المرحلة الابتدائية",
    eyebrow: "6 سنوات دراسية",
    image: "/img/kids-primary.webp",
    text: "منهج المدرسة كامل لكل صف: فيديوهات أنيميشن، حل تمارين الكتاب، وحل الكتاب الخارجي.",
    accent: "bg-iris",
  },
  {
    key: "prep" as const,
    title: "المرحلة الإعدادية",
    eyebrow: "3 سنوات دراسية",
    image: "/img/kids-prep.webp",
    text: "قواعد أقوى ومحادثة ومهارات كتابة، مع مراجعات ونماذج امتحانات لكل وحدة.",
    accent: "bg-navy",
  },
];

const EXTRA_IMAGES: Record<string, string> = {
  phonics: "/img/kids-phonics.webp",
  stories: "/img/kids-stories.webp",
  conversation: "/img/kids-conversation.webp",
  "exam-prep": "/img/kids-exam.webp",
};

const EXTRA_TEXT: Record<string, string> = {
  phonics: "أصوات الحروف وطريقة نطق الكلمات الجديدة صح من الأول.",
  stories: "قصص قصيرة بصوت واضح وصور — بتوسّع الكلمات وبتحبّب الطفل في القراءة.",
  conversation: "ألعاب كلمات وحوارات بسيطة في مواقف يومية، بنطق وتشجيع مستمر.",
  "exam-prep": "مراجعة الوحدة ونموذج امتحان مع الشرح، وخطة مراجعة لولي الأمر.",
};

export default function Kids() {
  const { data: course } = trpc.catalog.bySlug.useQuery({
    slug: "english-for-kids-adventure",
  });
  const modules = course?.modules ?? [];

  return (
    <PageShell>
      {/* ---------------- hero ---------------- */}
      <section className="relative overflow-hidden border-b border-line bg-paper-deep/60">
        <AnimatedAurora className="opacity-50" />
        <StudyDoodles variant="soft" />
        <div className="container grid gap-10 py-12 md:py-16 lg:grid-cols-[1fr_0.95fr] lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-3 py-1.5 text-xs text-ink-soft">
              <span className="size-1.5 rounded-full bg-[#f59e0b]" /> إنجليزي
              الأطفال · من KG1 لحد 3 إعدادي
            </span>
            <h1 className="mt-4 text-4xl leading-tight text-ink sm:text-5xl">
              إنجليزي ابنك يبقى <span className="hl-word">لعبة</span> مش واجب
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-soft">
              كل سنة دراسية لوحدها: فيديوهات أنيميشن لكل درس، حل كامل للكتاب
              المدرسي والكتب الخارجية، ومراجعات ونماذج امتحانات — ومعاها دروس
              إضافية وسيشن خاصة لما تحتاج.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <BookingButton
                label="احجز فيديوهات الترم"
                courseTitle="إنجليزي الأطفال"
                courseSlug="english-for-kids"
                packages={KIDS_PACKAGES}
                eyebrow="حجز إنجليزي الأطفال"
                className="h-12 rounded-full bg-iris px-6 text-white hover:bg-iris-deep"
              />
              <Link
                href="#private"
                className="inline-flex h-12 items-center gap-2 rounded-full border border-line bg-card px-6 text-sm font-medium text-ink transition hover:border-iris/50"
              >
                السيشن الخاصة <ArrowLeft className="size-4" />
              </Link>
            </div>
            <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs text-ink-soft">
              {["1000 ج.م للترم", "200 ج.م للسيشن", "فودافون كاش أو إنستاباي"].map(
                text => (
                  <li key={text} className="flex items-center gap-1.5">
                    <CheckCircle2 className="size-3.5 text-iris" /> {text}
                  </li>
                )
              )}
            </ul>
          </div>

          <div className="relative">
            <div className="overflow-hidden rounded-[2rem] border border-line bg-card shadow-[0_30px_70px_-40px_rgba(15,23,42,0.45)]">
              <img
                src="/img/kids-hero.webp"
                alt="أطفال مبسوطين بيتعلموا إنجليزي في فصل مبهج"
                className="aspect-[4/3] w-full object-cover"
                loading="eager"
              />
            </div>
            <div className="absolute -bottom-5 start-4 flex items-center gap-3 rounded-2xl border border-line bg-card px-4 py-3 shadow-lg sm:start-6">
              <span className="grid size-10 place-items-center rounded-full bg-iris/10 text-iris">
                <PlayCircle className="size-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-ink">64 درس أنيميشن</p>
                <p className="text-[11px] text-ink-soft">موزّعين على 11 سنة دراسية</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- every school year on its own ---------------- */}
      <section className="container py-14">
        <SectionHeading
          eyebrow="المنهج الدراسي"
          title="كل سنة دراسية لوحدها — من KG1 لـ 3 إعدادي"
          description="اختار صف ابنك وهتلاقي مساره لوحده: فيديوهات لكل درس، حل الكتاب المدرسي، حل الكتاب الخارجي، ومراجعة ونماذج امتحانات."
        />

        <div className="mt-10 space-y-12">
          {STAGES.map(stage => {
            const grades = KIDS_GRADES.filter(grade => grade.stage === stage.key);
            return (
              <div key={stage.key} id={`stage-${stage.key}`}>
                <Reveal>
                  <div className="grid gap-5 overflow-hidden rounded-[1.8rem] border border-line bg-card md:grid-cols-[0.85fr_1.15fr] md:items-stretch">
                    <div className="relative min-h-[190px]">
                      <img
                        src={stage.image}
                        alt={`أطفال ${stage.title}`}
                        className="absolute inset-0 size-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <div className="p-6 sm:p-8">
                      <span className="inline-flex items-center gap-2 text-xs text-ink-soft">
                        <span
                          className={`size-1.5 rounded-full ${stage.accent}`}
                        />{" "}
                        {stage.eyebrow}
                      </span>
                      <h3 className="mt-2 text-2xl text-ink sm:text-3xl">
                        {stage.title}
                      </h3>
                      <p className="mt-2 max-w-lg text-sm leading-relaxed text-ink-soft">
                        {stage.text}
                      </p>
                    </div>
                  </div>
                </Reveal>

                <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {grades.map((grade, index) => {
                    const module = modules.find(item =>
                      item.title.includes(grade.title)
                    );
                    const lessons = module?.lessons ?? [];
                    return (
                      <Reveal key={grade.key} delay={index * 0.02}>
                        <article
                          id={`grade-${grade.key}`}
                          className="flex h-full flex-col rounded-2xl border border-line bg-card p-5 transition duration-300 hover:-translate-y-1 hover:border-iris/40 hover:shadow-[0_24px_50px_-38px_rgba(37,99,235,0.85)]"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-xs text-ink-soft">سنة دراسية</p>
                              <h4 className="mt-1 text-lg font-semibold text-ink">
                                {grade.title}
                              </h4>
                            </div>
                            <span className="latin grid size-9 shrink-0 place-items-center rounded-full bg-iris/10 text-xs font-bold text-iris">
                              {String(index + 1).padStart(2, "0")}
                            </span>
                          </div>

                          <ul className="mt-4 space-y-2 text-sm text-ink-soft">
                            {lessons.length > 0 ? (
                              lessons.slice(0, 5).map(lesson => (
                                <li key={lesson.id} className="flex gap-2">
                                  <PlayCircle className="mt-0.5 size-3.5 shrink-0 text-iris" />
                                  <span className="line-clamp-1">
                                    {lesson.title
                                      .replace(`${module?.title} — `, "")
                                      .replace(/^منهج [^—]+ — /, "")}
                                  </span>
                                </li>
                              ))
                            ) : (
                              <li className="text-xs">
                                بنجهّز محتوى الصف ده — كلّمنا على واتساب.
                              </li>
                            )}
                          </ul>

                          <div className="mt-auto flex items-center justify-between gap-2 pt-5">
                            <span className="flex items-center gap-1.5 text-[11px] text-ink-soft">
                              <Clock3 className="size-3.5" />{" "}
                              {lessons.length || "—"} درس · 1000 ج.م للترم
                            </span>
                            <BookingButton
                              label="احجز"
                              variant="outline"
                              courseTitle={`إنجليزي الأطفال — ${grade.title}`}
                              courseSlug={`english-for-kids-${grade.key}`}
                              packages={KIDS_PACKAGES}
                              eyebrow={`حجز ${grade.title}`}
                              className="h-9 rounded-full px-4 text-xs"
                            />
                          </div>
                        </article>
                      </Reveal>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ---------------- extra lessons ---------------- */}
      <section
        id="extra"
        className="border-y border-line bg-paper-deep/50 py-14"
      >
        <div className="container">
          <SectionHeading
            eyebrow="دروس تانية غير المنهج"
            title="مش بس منهج المدرسة — دروس بتبني مهارات"
            description="دروس إضافية بصورها وطريقتها الخاصة، تنفع مع أي سنة دراسية وتتحدد حسب مستوى الطفل."
          />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {KIDS_EXTRA_LESSONS.map((lesson, index) => (
              <Reveal key={lesson.key} delay={index * 0.03}>
                <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-card transition duration-300 hover:-translate-y-1 hover:border-iris/40">
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img
                      src={EXTRA_IMAGES[lesson.key]}
                      alt={lesson.title}
                      className="size-full object-cover transition duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <h4 className="font-semibold text-ink">{lesson.title}</h4>
                    <p className="mt-1.5 flex-1 text-xs leading-relaxed text-ink-soft">
                      {EXTRA_TEXT[lesson.key]}
                    </p>
                    <BookingButton
                      label="احجز الدرس"
                      variant="outline"
                      courseTitle={`دروس إضافية — ${lesson.title}`}
                      courseSlug={`kids-extra-${lesson.key}`}
                      packages={KIDS_PACKAGES}
                      eyebrow={lesson.title}
                      className="mt-4 h-9 w-full rounded-full text-xs"
                    />
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- private session ---------------- */}
      <section id="private" className="container py-14">
        <div className="grid gap-8 lg:grid-cols-[1fr_0.95fr] lg:items-center">
          <Reveal>
            <div className="relative overflow-hidden rounded-[2rem] border border-line bg-card">
              <img
                src="/img/kids-session.webp"
                alt="طفل مبسوط في سيشن إنجليزي خاصة أونلاين"
                className="aspect-[4/3] w-full object-cover"
                loading="lazy"
              />
              <span className="absolute start-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-navy/85 px-3 py-1 text-[11px] text-white">
                <UserRound className="size-3" /> سيشن فردية أونلاين
              </span>
            </div>
          </Reveal>
          <div>
            <span className="inline-flex items-center gap-2 text-xs text-ink-soft">
              <span className="size-1.5 rounded-full bg-iris" /> السيشن الخاصة
            </span>
            <h2 className="mt-2 text-3xl leading-tight text-ink sm:text-4xl">
              لو ابنك محتاج <span className="hl-word">متابعة فردية</span>
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-soft">
              60 دقيقة مع مدرّس متخصص، على الدرس اللي الطفل واقف عنده أو الكتاب
              الخارجي أو واجب المدرسة. بنبدأ من نقطة الطفل، وبعد كل سيشن بيوصلك
              ملخص لولي الأمر.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                { icon: BookMarked, text: "حل الواجبات والكتب الخارجية" },
                { icon: Sparkles, text: "تدريب نطق ومحادثة" },
                { icon: CalendarDays, text: "مراجعة قبل الامتحانات" },
                { icon: Users, text: "متابعة وملخص لكل سيشن" },
              ].map(item => (
                <div
                  key={item.text}
                  className="flex items-center gap-2.5 rounded-xl border border-line bg-card p-3 text-sm text-ink"
                >
                  <item.icon className="size-4 shrink-0 text-iris" />
                  {item.text}
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <p className="flex items-baseline gap-1">
                <span className="latin text-4xl font-bold text-ink">200</span>
                <span className="text-sm text-ink-soft">ج.م / السيشن</span>
              </p>
              <BookingButton
                label="احجز سيشن خاصة"
                courseTitle="سيشن خاصة للأطفال"
                courseSlug="kids-private-session"
                packages={PRIVATE_PACKAGES}
                eyebrow="حجز سيشن خاصة للأطفال"
                className="h-12 rounded-full bg-iris px-6 text-white hover:bg-iris-deep"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- how it works ---------------- */}
      <section className="container pb-16">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              icon: PlayCircle,
              title: "فيديوهات أنيميشن",
              text: "شرح بالرسوم المتحركة عشان الكلمات تثبت من غير حفظ.",
            },
            {
              icon: BookMarked,
              title: "حل الكتب الخارجية",
              text: "بنمشي مع كتاب المدرسة والكتاب الخارجي صفحة بصفحة.",
            },
            {
              icon: CalendarDays,
              title: "متابعة أسبوعية",
              text: "تقرير لولي الأمر بتقدّم الطفل والواجبات اللي خلّصها.",
            },
          ].map(item => (
            <div key={item.title} className="rounded-2xl border border-line bg-card p-5">
              <item.icon className="size-5 text-iris" />
              <p className="mt-3 font-semibold text-ink">{item.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-ink-soft">
                {item.text}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-4 rounded-[1.6rem] border border-line bg-card p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-lg font-semibold text-ink">جاهز تبدأ مع ابنك؟</p>
            <p className="mt-1 text-sm text-ink-soft">
              اختار الصف والباقة، وابعتلنا على واتساب — وبعدها بنفعّل الحساب.
            </p>
          </div>
          <BookingButton
            label="احجز لابنك الآن"
            courseTitle="إنجليزي الأطفال"
            courseSlug="english-for-kids"
            packages={KIDS_PACKAGES}
            eyebrow="حجز إنجليزي الأطفال"
            className="h-12 shrink-0 rounded-full bg-iris px-6 text-white hover:bg-iris-deep"
          />
        </div>
      </section>
    </PageShell>
  );
}
