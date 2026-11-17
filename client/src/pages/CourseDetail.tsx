import { useEffect, useState } from "react";
import { Link, useLocation, useRoute } from "wouter";
import {
  BadgeCheck,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  Clock,
  Globe,
  Heart,
  Layers,
  Lock,
  PlayCircle,
  Share2,
  Star,
  Users,
  Video,
} from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/layout/site-footer";
import { SessionStatusChip } from "@/components/classroom";
import { CourseCard, CourseCover } from "@/components/course-card";
import {
  ProgressBar,
  SectionHeading,
  Stars,
  UserAvatar,
} from "@/components/bits";
import { Reveal } from "@/components/reveal";
import { Button } from "@/components/ui/button";
import { BookingButton, BookingDialog } from "@/components/booking";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import {
  formatCount,
  formatDate,
  formatDateTime,
  formatMinutes,
  formatPrice,
  levelLabel,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import NotFound from "./NotFound";

export default function CourseDetail() {
  const [, params] = useRoute("/courses/:slug");
  const slug = params?.slug ?? "";
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const utils = trpc.useUtils();

  const { data: course, isLoading } = trpc.catalog.bySlug.useQuery(
    { slug },
    { enabled: Boolean(slug) }
  );
  const { data: access } = trpc.learning.access.useQuery(
    { slug },
    { enabled: Boolean(user) && Boolean(slug), retry: false }
  );
  const { data: myReview } = trpc.learning.myReview.useQuery(
    { courseId: course?.id ?? 0 },
    { enabled: Boolean(user) && Boolean(course) }
  );
  const { data: wishlist } = trpc.learning.wishlist.useQuery(undefined, {
    enabled: Boolean(user),
  });
  const { data: dashboard } = trpc.learning.dashboard.useQuery(undefined, {
    enabled: Boolean(user),
  });
  const { data: onlineSessions } = trpc.admin.courseSessions.useQuery(
    { courseId: course?.id ?? 0 },
    { enabled: Boolean(course?.id) }
  );

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [bookingOpen, setBookingOpen] = useState(false);

  useEffect(() => {
    if (myReview) {
      setRating(myReview.rating);
      setComment(myReview.comment ?? "");
    }
  }, [myReview]);

  const toggleWishlist = trpc.learning.toggleWishlist.useMutation({
    onSuccess: async result => {
      await utils.learning.wishlist.invalidate();
      toast.success(result.saved ? "أُضيف إلى قائمتك" : "تم الحذف من قائمتك");
    },
    onError: error => toast.error(error.message),
  });

  const submitReview = trpc.learning.submitReview.useMutation({
    onSuccess: async () => {
      await utils.catalog.bySlug.invalidate({ slug });
      await utils.learning.myReview.invalidate();
      toast.success("شكرًا لتقييمك!");
    },
    onError: error => toast.error(error.message),
  });

  if (isLoading) {
    return (
      <PageShell>
        <div className="container py-20">
          <div className="h-10 w-2/3 animate-pulse rounded-full bg-ink/[0.06]" />
          <div className="mt-6 h-72 animate-pulse rounded-3xl bg-ink/[0.06]" />
        </div>
      </PageShell>
    );
  }

  if (!course) return <NotFound />;

  const enrolled = Boolean(access?.enrollment) || Boolean(access?.subscribed);
  const progressItem = dashboard?.items.find(
    item => item.courseId === course.id
  );
  const saved = (wishlist ?? []).some(item => item.slug === course.slug);
  const totalLessons = course.lessonCount;
  const isKidsCourse =
    course.slug.includes("kids") || course.slug === "english-for-kids-adventure";
  const totalMinutes = course.modules
    .flatMap(module => module.lessons)
    .reduce((sum, lesson) => sum + lesson.durationMinutes, 0);
  const totalRatings = course.ratingDistribution.reduce(
    (sum, item) => sum + item.count,
    0
  );

  const handleEnroll = () => {
    if (enrolled) {
      navigate(`/learn/${course.slug}`);
      return;
    }
    setBookingOpen(true);
  };

  return (
    <PageShell>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-line bg-paper-deep/60">
        <div className="absolute inset-0 -z-10 dot-grid opacity-30" />
        <div className="container grid gap-10 py-10 lg:grid-cols-[1fr_380px] lg:py-14">
          <div>
            <nav className="flex items-center gap-2 text-xs text-ink-soft">
              <Link href="/" className="hover:text-ink">
                الرئيسية
              </Link>
              <ChevronLeft className="size-3" />
              <Link href="/courses" className="hover:text-ink">
                الكورسات
              </Link>
              <ChevronLeft className="size-3" />
              <Link
                href={`/courses?category=${course.categorySlug}`}
                className="hover:text-ink"
              >
                {course.categoryNameAr}
              </Link>
            </nav>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-iris px-3 py-1 text-[11px] font-medium text-white">
                {course.categoryNameAr}
              </span>
              <span className="rounded-full border border-ink/20 bg-card px-3 py-1 text-[11px] text-ink">
                {levelLabel(course.level)}
              </span>
              {course.featured && (
                <span className="rounded-full bg-acid px-3 py-1 text-[11px] font-semibold text-ink">
                  الأكثر طلبًا
                </span>
              )}
            </div>

            <p className="latin mt-5 text-sm text-ink-soft">{course.title}</p>
            <h1 className="mt-2 text-3xl leading-tight text-ink sm:text-[2.7rem]">
              <span className="hl-word">{course.titleAr}</span>
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink-soft">
              {course.subtitle}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-ink-soft">
              <span className="flex items-center gap-1.5">
                <Stars value={course.rating} size={15} />
                <b className="latin text-ink">
                  {course.rating ? course.rating.toFixed(1) : "جديد"}
                </b>
                <span>({totalRatings} تقييم)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="size-4" /> {formatCount(course.studentsCount)}{" "}
                متعلّم
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="size-4" /> {course.durationHours} ساعة
              </span>
              <span className="flex items-center gap-1.5">
                <Layers className="size-4" /> {totalLessons} درس
              </span>
              <span className="flex items-center gap-1.5">
                <Globe className="size-4" /> شرح عربي
              </span>
            </div>

            <div className="mt-7 flex items-center gap-3">
              <UserAvatar
                name={course.instructor?.name}
                src={course.instructor?.avatarUrl}
                size={44}
              />
              <div className="text-sm">
                <p className="text-ink-soft">المدرّس</p>
                <Link
                  href={`/instructors/${course.instructor?.slug}`}
                  className="font-semibold text-ink hover:text-iris"
                >
                  {course.instructor?.name}
                </Link>
              </div>
            </div>
          </div>

          {/* Purchase card */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="overflow-hidden rounded-3xl border border-ink bg-card shadow-[5px_5px_0_0_var(--color-ink)]">
              <div className="relative">
                <CourseCover
                  title={course.title}
                  coverImage={course.coverImage}
                  accent={course.accent}
                  className="h-44 w-full"
                />
                <button
                  className="absolute inset-0 grid place-items-center bg-ink/25 transition-colors hover:bg-ink/35"
                  onClick={handleEnroll}
                  aria-label="معاينة الكورس"
                >
                  <span className="grid size-14 place-items-center rounded-full bg-card/90">
                    <PlayCircle className="size-7 text-ink" />
                  </span>
                </button>
              </div>
              <div className="space-y-4 p-6">
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-bold text-ink">
                    {formatPrice(course.priceCents, course.currency)}
                  </span>
                  {course.compareAtCents &&
                  course.compareAtCents > course.priceCents ? (
                    <span className="latin pb-1 text-sm text-ink-soft line-through">
                      {formatPrice(course.compareAtCents, course.currency)}
                    </span>
                  ) : null}
                </div>

                {enrolled ? (
                  <div className="space-y-3">
                    {progressItem && (
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs text-ink-soft">
                          <span>تقدمك</span>
                          <span className="latin">
                            {progressItem.progress}%
                          </span>
                        </div>
                        <ProgressBar value={progressItem.progress} />
                      </div>
                    )}
                    <Button
                      className="h-12 w-full rounded-full bg-iris text-white hover:bg-iris-deep"
                      onClick={handleEnroll}
                    >
                      {progressItem && progressItem.progress > 0
                        ? "أكمل من حيث توقفت"
                        : "ابدأ التعلّم"}
                    </Button>
                  </div>
                ) : (
                  <Button
                    className="h-12 w-full rounded-full bg-iris text-white hover:bg-iris-deep"
                    onClick={handleEnroll}
                    disabled={false}
                  >
                    احجز مقعدك الآن
                  </Button>
                )}

                <BookingDialog
                  open={bookingOpen}
                  onOpenChange={setBookingOpen}
                  courseTitle={course.titleAr}
                  courseSlug={course.slug}
                  eyebrow="حجز الكورس"
                  packages={[
                    {
                      id: "course",
                      title: `${course.titleAr} — حجز مباشر`,
                      priceCents: course.priceCents,
                      currency: course.currency,
                      hint: "دفع فودافون كاش أو إنستاباي بعد التأكيد",
                    },
                  ]}
                />

                <BookingButton
                  label="احجز مقعدك على واتساب"
                  courseTitle={course.titleAr}
                  courseSlug={course.slug}
                  eyebrow="حجز مباشر"
                  variant="outline"
                  className="h-11 w-full rounded-full border-ink/25 text-sm"
                  packages={[
                    {
                      id: "course",
                      title: `${course.titleAr} — حجز مباشر`,
                      priceCents: course.priceCents,
                      currency: course.currency,
                      hint: "دفع فودافون كاش أو إنستاباي بعد التأكيد",
                    },
                  ]}
                />
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    className="h-10 flex-1 rounded-full border-ink/20 text-xs"
                    onClick={() => {
                      if (!user) {
                        navigate("/login");
                        return;
                      }
                      toggleWishlist.mutate({ courseId: course.id });
                    }}
                  >
                    <Heart
                      className={cn(
                        "me-1.5 size-4",
                        saved && "fill-coral text-coral"
                      )}
                    />{" "}
                    {saved ? "محفوظ" : "احفظ لاحقًا"}
                  </Button>
                  <Button
                    variant="outline"
                    className="h-10 rounded-full border-ink/20 text-xs"
                    onClick={async () => {
                      await navigator.clipboard.writeText(window.location.href);
                      toast.success("تم نسخ الرابط");
                    }}
                  >
                    <Share2 className="size-4" />
                  </Button>
                </div>

                <ul className="space-y-2.5 border-t border-line pt-4 text-sm text-ink-soft">
                  {[
                    `${totalLessons} درسًا · ${formatMinutes(totalMinutes)}`,
                    "وصول دائم بعد الشراء",
                    "شهادة إتمام",
                    "تأكيد الحجز والدفع مع الإدارة",
                  ].map(item => (
                    <li key={item} className="flex items-center gap-2">
                      <CheckCircle2 className="size-4 text-acid-deep" /> {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container grid gap-12 py-14 lg:grid-cols-[1fr_380px]">
        <div className="space-y-14">
          {/* Course facts */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              {
                icon: Clock,
                label: "مدة الدراسة",
                value: `${course.durationHours} ساعة`,
              },
              {
                icon: Layers,
                label: "عدد الدروس",
                value: `${totalLessons} درس`,
              },
              { icon: Video, label: "طريقة الدراسة", value: "أونلاين + تسجيل" },
              {
                icon: Users,
                label: "الفئة المستهدفة",
                value: levelLabel(course.level),
              },
            ].map(item => (
              <div
                key={item.label}
                className="rounded-2xl border border-line bg-card p-4"
              >
                <item.icon className="size-4 text-iris" />
                <p className="mt-2 text-[11px] text-ink-soft">{item.label}</p>
                <p className="mt-0.5 text-sm font-semibold text-ink">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
          {/* Outcomes */}
          <div>
            <h2 className="text-2xl text-ink">
              إيه اللي هتقدر تعمله بعد الكورس؟
            </h2>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {course.outcomes.map(outcome => (
                <li
                  key={outcome}
                  className="flex items-start gap-2.5 rounded-2xl border border-line bg-card p-4 text-sm leading-relaxed text-ink"
                >
                  <BadgeCheck className="mt-0.5 size-4 shrink-0 text-iris" />{" "}
                  {outcome}
                </li>
              ))}
            </ul>
          </div>

          {/* Description */}
          <div>
            <h2 className="text-2xl text-ink">عن الكورس</h2>
            <p className="mt-4 whitespace-pre-line text-[15px] leading-[1.95] text-ink-soft">
              {course.description}
            </p>
            {course.tags.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {course.tags.map(tag => (
                  <span
                    key={tag}
                    className="rounded-full bg-paper-deep px-3 py-1 text-xs text-ink-soft"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Kids gallery: each school stage has its own photo */}
          {isKidsCourse && (
            <div>
              <h2 className="text-2xl text-ink">من KG لحد 3 إعدادي</h2>
              <p className="mt-1 text-sm text-ink-soft">
                كل سنة دراسية لوحدها في المنهج — دي لمحة من كل مرحلة.
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { src: "/img/kids-kg.webp", label: "رياض الأطفال" },
                  { src: "/img/kids-primary.webp", label: "الابتدائية" },
                  { src: "/img/kids-prep.webp", label: "الإعدادية" },
                  { src: "/img/kids-session.webp", label: "سيشن خاصة" },
                ].map(item => (
                  <figure
                    key={item.src}
                    className="overflow-hidden rounded-2xl border border-line bg-card"
                  >
                    <img
                      src={item.src}
                      alt={item.label}
                      className="aspect-[4/3] w-full object-cover"
                      loading="lazy"
                    />
                    <figcaption className="px-3 py-2 text-xs text-ink-soft">
                      {item.label}
                    </figcaption>
                  </figure>
                ))}
              </div>
            </div>
          )}
          {/* Curriculum */}
          <div>
            <div className="flex items-end justify-between">
              <h2 className="text-2xl text-ink">المحتوى والمنهج</h2>
              <span className="text-xs text-ink-soft">
                {course.modules.length} وحدات · {totalLessons} درس ·{" "}
                {formatMinutes(totalMinutes)}
              </span>
            </div>
            <Accordion
              type="multiple"
              defaultValue={course.modules.map(module => String(module.id))}
              className="mt-5 space-y-3"
            >
              {course.modules.map((module, index) => {
                const minutes = module.lessons.reduce(
                  (sum, lesson) => sum + lesson.durationMinutes,
                  0
                );
                return (
                  <AccordionItem
                    key={module.id}
                    value={String(module.id)}
                    className="overflow-hidden rounded-2xl border border-line bg-card px-5"
                  >
                    <AccordionTrigger className="gap-3 text-start hover:no-underline">
                      <div className="flex flex-1 items-center gap-3">
                        <span className="latin grid size-8 shrink-0 place-items-center rounded-full bg-paper-deep text-xs font-bold text-ink">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <div className="flex flex-col">
                          <span className="latin text-[15px] font-semibold text-ink">
                            {module.title}
                          </span>
                          <span className="text-xs text-ink-soft">
                            {module.summary} · {module.lessons.length} دروس ·{" "}
                            {minutes} دقيقة
                          </span>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-3">
                      <ul className="divide-y divide-line/70">
                        {module.lessons.map(lesson => {
                          const locked = !lesson.isPreview && !enrolled;
                          return (
                            <li
                              key={lesson.id}
                              className="flex items-center justify-between gap-3 py-3 text-sm"
                            >
                              <div className="flex items-start gap-2.5">
                                {locked ? (
                                  <Lock className="mt-0.5 size-4 text-ink-soft/60" />
                                ) : (
                                  <PlayCircle className="mt-0.5 size-4 text-iris" />
                                )}
                                <div>
                                  <p className="latin font-medium text-ink">
                                    {lesson.title}
                                  </p>
                                  <p className="text-xs text-ink-soft">
                                    {lesson.description}
                                  </p>
                                </div>
                              </div>
                              <div className="flex shrink-0 items-center gap-2 text-xs text-ink-soft">
                                {lesson.isPreview && (
                                  <span className="rounded-full bg-acid px-2 py-0.5 text-[10px] font-semibold text-ink">
                                    معاينة
                                  </span>
                                )}
                                <span>{lesson.durationMinutes} د</span>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </div>

          {/* Requirements & audience */}
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-line bg-card p-6">
              <h3 className="flex items-center gap-2 text-lg font-bold text-ink">
                <BookOpen className="size-5" /> المتطلبات
              </h3>
              <ul className="mt-4 space-y-2 text-sm text-ink-soft">
                {course.requirements.map(item => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-2 size-1 shrink-0 rounded-full bg-navy" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-line bg-card p-6">
              <h3 className="flex items-center gap-2 text-lg font-bold text-ink">
                <Users className="size-5" /> لمن هذا الكورس؟
              </h3>
              <ul className="mt-4 space-y-2 text-sm text-ink-soft">
                {course.audience.map(item => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-2 size-1 shrink-0 rounded-full bg-navy" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Reviews */}
          <div id="reviews">
            {(onlineSessions ?? []).length > 0 && (
              <div className="mt-12">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-2xl text-ink">محاضرات أونلاين مباشرة</h2>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/12 px-3 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                    <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />{" "}
                    أونلاين · Live
                  </span>
                </div>
                <p className="mt-1 text-sm text-ink-soft">
                  جلسات مباشرة على Zoom مع المدرّس: تدريب عملي وأسئلة في نفس
                  الوقت.
                </p>
                <div className="mt-4 space-y-2.5">
                  {(onlineSessions ?? []).map(session => (
                    <div
                      key={session.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-line bg-card p-4"
                    >
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-iris-soft text-iris">
                          <Video className="size-4" />
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-ink">
                            {session.title}
                          </p>
                          <p className="text-xs text-ink-soft">
                            {formatDateTime(session.startsAt)} ·{" "}
                            {session.durationMinutes} دقيقة
                          </p>
                        </div>
                      </div>
                      <SessionStatusChip status={session.status} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <h2 className="text-2xl text-ink">تقييمات الطلاب</h2>
            <div className="mt-5 grid gap-6 rounded-3xl border border-line bg-card p-6 md:grid-cols-[200px_1fr]">
              <div className="flex flex-col items-center justify-center gap-1 border-line md:border-e">
                <span className="latin text-5xl font-bold text-ink">
                  {course.rating ? course.rating.toFixed(1) : "—"}
                </span>
                <Stars value={course.rating} size={18} />
                <span className="text-xs text-ink-soft">
                  {totalRatings} تقييم
                </span>
              </div>
              <div className="space-y-2">
                {course.ratingDistribution.map(item => (
                  <div
                    key={item.stars}
                    className="flex items-center gap-3 text-xs text-ink-soft"
                  >
                    <span className="flex w-8 items-center gap-1">
                      {item.stars} <Star className="size-3" />
                    </span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink/10">
                      <div
                        className="h-full rounded-full bg-acid-deep"
                        style={{
                          width: `${totalRatings ? (item.count / totalRatings) * 100 : 0}%`,
                        }}
                      />
                    </div>
                    <span className="latin w-6 text-end">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Review form */}
            <div className="mt-6 rounded-3xl border border-line bg-paper-deep/50 p-6">
              {!user ? (
                <p className="text-sm text-ink-soft">
                  <Link
                    href="/login"
                    className="font-semibold text-ink underline"
                  >
                    سجّل الدخول
                  </Link>{" "}
                  لتقييم الكورس بعد الالتحاق به.
                </p>
              ) : !enrolled ? (
                <p className="text-sm text-ink-soft">
                  التقييم متاح بعد الالتحاق بالكورس ومشاهدة بعض الدروس.
                </p>
              ) : (
                <form
                  className="space-y-4"
                  onSubmit={event => {
                    event.preventDefault();
                    submitReview.mutate({
                      courseId: course.id,
                      rating,
                      comment: comment.trim() || undefined,
                    });
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-ink">
                      تقييمك:
                    </span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map(value => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setRating(value)}
                          aria-label={`${value} نجوم`}
                        >
                          <Star
                            className={cn(
                              "size-6 transition-colors",
                              value <= rating
                                ? "fill-acid-deep text-acid-deep"
                                : "text-ink/25"
                            )}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  <Textarea
                    value={comment}
                    onChange={event => setComment(event.target.value)}
                    placeholder="اكتب تجربتك: إيه اللي فادك أكتر؟"
                    className="min-h-[90px] rounded-2xl border-line bg-card"
                  />
                  <Button
                    type="submit"
                    disabled={submitReview.isPending}
                    className="rounded-full bg-iris text-white"
                  >
                    {myReview ? "تحديث التقييم" : "نشر التقييم"}
                  </Button>
                </form>
              )}
            </div>

            <div className="mt-6 space-y-4">
              {course.reviews.length === 0 && (
                <p className="text-sm text-ink-soft">
                  لا توجد مراجعات بعد — كن أول من يشارك تجربته.
                </p>
              )}
              {course.reviews.map(review => (
                <div
                  key={review.id}
                  className="rounded-2xl border border-line bg-card p-5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <UserAvatar
                        name={review.userName}
                        src={review.avatarUrl}
                        size={38}
                      />
                      <div>
                        <p className="text-sm font-semibold text-ink">
                          {review.userName}
                        </p>
                        <p className="text-[11px] text-ink-soft">
                          {formatDate(review.createdAt)}
                        </p>
                      </div>
                    </div>
                    <Stars value={review.rating} />
                  </div>
                  {review.comment && (
                    <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                      {review.comment}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Side: instructor + related */}
        <aside className="space-y-8 lg:mt-[3.6rem]">
          {course.instructor && (
            <div className="rounded-3xl border border-line bg-card p-6">
              <h3 className="text-sm font-semibold text-ink-soft">
                عن المدرّس
              </h3>
              <div className="mt-4 flex items-center gap-3">
                <UserAvatar
                  name={course.instructor.name}
                  src={course.instructor.avatarUrl}
                  size={54}
                />
                <div>
                  <Link
                    href={`/instructors/${course.instructor.slug}`}
                    className="font-bold text-ink hover:text-iris"
                  >
                    {course.instructor.name}
                  </Link>
                  <p className="text-xs text-ink-soft">
                    {course.instructor.title}
                  </p>
                </div>
              </div>
              <p className="mt-4 line-clamp-5 text-sm leading-relaxed text-ink-soft">
                {course.instructor.bio}
              </p>
              <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-xs text-ink-soft">
                <span className="flex items-center gap-1">
                  <Star className="size-3 fill-acid-deep text-acid-deep" />{" "}
                  {(course.instructor.rating / 10).toFixed(1)}
                </span>
                <span>{course.instructor.experienceYears} سنة خبرة</span>
                <span>
                  {formatCount(course.instructor.studentsCount)} متعلّم
                </span>
              </div>
              <Button
                asChild
                variant="outline"
                className="mt-4 w-full rounded-full border-ink/20 text-xs"
              >
                <Link href={`/instructors/${course.instructor.slug}`}>
                  كل كورسات المدرّس
                </Link>
              </Button>
            </div>
          )}

          {course.related.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-ink-soft">
                كورسات مشابهة
              </h3>
              <div className="mt-4 space-y-4">
                {course.related.map(item => (
                  <CourseCard key={item.id} course={item} />
                ))}
              </div>
            </div>
          )}
        </aside>
      </section>
    </PageShell>
  );
}
