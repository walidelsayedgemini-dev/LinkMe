import { Link, useLocation } from "wouter";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Clock,
  Flame,
  Gauge,
  Heart,
  PlayCircle,
  ShieldCheck,
  Sparkles,
  Target,
  Video,
} from "lucide-react";
import { PageShell } from "@/components/layout/site-footer";
import { CourseCard } from "@/components/course-card";
import { ProgressBar, SectionHeading, Stars } from "@/components/bits";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { trpc } from "@/lib/trpc";
import { formatDate, formatDateTime, formatMinutesShort } from "@/lib/format";
import { cn } from "@/lib/utils";
import { PremiumAccountSummary } from "@/components/premium-account-summary";
import { YassinSays, useCompanion } from "@/components/companion";

export default function Dashboard() {
  const { user, loading } = useAuth();
  const { companion } = useCompanion();
  const [, navigate] = useLocation();
  const { data, isLoading, error: dashboardError, refetch: reloadDashboard } = trpc.learning.dashboard.useQuery(undefined, {
    enabled: Boolean(user),
  });
  const { data: wishlist } = trpc.learning.wishlist.useQuery(undefined, {
    enabled: Boolean(user),
  });
  const { data: subscription } = trpc.billing.mySubscription.useQuery(
    undefined,
    { enabled: Boolean(user) }
  );
  const { data: placement } = trpc.placement.myLatest.useQuery(undefined, {
    enabled: Boolean(user),
  });
  const { data: classroom } = trpc.admin.myClassroom.useQuery(undefined, {
    enabled: Boolean(user),
  });
  const { data: upcoming } = trpc.admin.upcoming.useQuery(undefined, {
    enabled: Boolean(user),
  });

  if (loading) {
    return (
      <PageShell>
        <div className="container py-20">
          <div className="h-40 animate-pulse rounded-3xl bg-ink/[0.06]" />
        </div>
      </PageShell>
    );
  }

  if (!user) {
    return (
      <PageShell>
        <div className="container py-24 text-center">
          <h1 className="text-3xl text-ink">سجّل الدخول لمتابعة تقدمك</h1>
          <p className="mt-3 text-ink-soft">
            كل كورساتك وتقدمك محفوظان في حسابك.
          </p>
          <Button asChild className="mt-6 rounded-full bg-iris text-white">
            <Link href="/login">تسجيل الدخول</Link>
          </Button>
        </div>
      </PageShell>
    );
  }

  const inProgress = (data?.items ?? []).filter(item => item.progress < 100);
  const completed = (data?.items ?? []).filter(item => item.progress === 100);
  const continueItem = inProgress[0];
  const activeSub =
    subscription &&
    subscription.status === "active" &&
    new Date(subscription.currentPeriodEnd) > new Date();

  return (
    <PageShell>
      <section className="border-b border-line bg-paper-deep/60">
        <div className="container py-10 md:py-12">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="text-sm text-ink-soft">لوحة التعلّم</p>
              <h1 className="mt-1 text-3xl leading-tight text-ink sm:text-4xl">
                أهلًا {user.name?.split(" ")[0]}
              </h1>
              {placement && (
                <Link
                  href="/level-test"
                  className="mt-3 inline-flex items-center gap-2 rounded-full border border-iris/30 bg-iris-soft px-3 py-1 text-xs font-medium text-iris hover:bg-iris hover:text-white"
                >
                  <Gauge className="size-3.5" /> تقديرك من الاختبار النصّي:{" "}
                  {placement.belowA1 ? "أقل من A1" : placement.level}
                </Link>
              )}
              <p className="mt-2 text-sm text-ink-soft">
                {inProgress.length > 0
                  ? `عندك ${inProgress.length} كورس قيد التعلّم — 25 دقيقة كافية للنهارده.`
                  : "ابدأ أول كورس ليك النهارده، وقصير الدروس هيسهّل عليك الالتزام."}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                asChild
                className="rounded-full bg-iris text-white hover:bg-iris-deep"
              >
                <Link href="/courses">
                  <BookOpen className="me-2 size-4" /> تصفّح الكورسات
                </Link>
              </Button>
              {continueItem && (
                <Button
                  asChild
                  variant="outline"
                  className="rounded-full border-ink/20"
                >
                  <Link href={`/learn/${continueItem.slug}`}>
                    <PlayCircle className="me-2 size-4" /> أكمل التعلّم
                  </Link>
                </Button>
              )}
            </div>

            {user?.role === "admin" && (
              <Link
                href="/admin"
                className="mt-6 flex max-w-2xl items-center gap-3 rounded-2xl border border-iris/30 bg-iris-soft px-4 py-3 text-sm font-semibold text-iris transition hover:bg-iris hover:text-white"
              >
                <ShieldCheck className="size-5" /> أنت مدير المنصة — افتح لوحة
                التحكم لمتابعة الطلاب والجلسات والتقييمات
                <ArrowLeft className="ms-auto size-4" />
              </Link>
            )}
            <YassinSays
              className="mt-6 max-w-2xl"
              message={
                <>
                  أهلاً {user?.name?.split(" ")[0] ?? (companion.id === "khadija" ? "يا سكر" : "يا بطل")}! أنا{" "}
                  <b>{companion.name}</b> {companion.favoriteEmoji}، هكون معاك في كل خطوة.
                  {placement
                    ? ` تقديرك ${placement.belowA1 ? "أقل من A1" : placement.level} من آخر اختبار — جاهز نكمّل؟`
                    : " لسه معملتش اختبار المستوى؟ خلّينا نبدأ بيه سوا!"}
                </>
              }
            />
          </div>
        </div>
      </section>

      <div className="container pt-7"><PremiumAccountSummary /></div>
      {dashboardError && <div role="alert" className="container mt-5 text-ink"><p>تقدمك ما اتحمّلش دلوقتي. بياناتك مش صفر؛ جرّب تحميلها تاني.</p><Button variant="outline" onClick={() => void reloadDashboard()} className="mt-3">إعادة تحميل التقدم</Button></div>}
      {classroom && (
        <section className="container pt-8">
          <div className="rounded-2xl border border-line bg-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 text-lg text-ink">
                <Video className="size-4 text-iris" /> فصلك الأونلاين
              </h2>
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/homework"
                  className="inline-flex items-center gap-1.5 rounded-full bg-iris-soft px-3 py-1.5 text-xs font-semibold text-iris hover:bg-iris hover:text-white"
                >
                  <ClipboardList className="size-3.5" /> واجباتي
                </Link>
                <Link
                  href={`/students/${user?.id ?? 0}`}
                  className="text-xs font-semibold text-iris hover:underline"
                >
                  كل تفاصيل الفصل ←
                </Link>
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-paper-deep/60 p-3.5">
                <p className="text-xs text-ink-soft">نسبة الحضور</p>
                <p className="latin mt-1 text-xl font-bold text-ink">
                  {classroom.stats.attendanceRate === null
                    ? "—"
                    : `${classroom.stats.attendanceRate}%`}
                </p>
                <p className="text-[11px] text-ink-soft">
                  {classroom.stats.attended} من {classroom.stats.totalSessions}{" "}
                  جلسة
                </p>
              </div>
              <div className="rounded-xl bg-paper-deep/60 p-3.5">
                <p className="text-xs text-ink-soft">مهام مفتوحة</p>
                <p className="latin mt-1 text-xl font-bold text-ink">
                  {classroom.stats.openTasks}
                </p>
                <p className="text-[11px] text-ink-soft">
                  {classroom.tasks.length} مهمة إجمالًا
                </p>
              </div>
              <div className="rounded-xl bg-paper-deep/60 p-3.5">
                <p className="text-xs text-ink-soft">تقييم المدرّس</p>
                <p className="latin mt-1 text-xl font-bold text-ink">
                  {classroom.stats.latestRating
                    ? `${classroom.stats.latestRating.stars}/5`
                    : "—"}
                </p>
                <p className="text-[11px] text-ink-soft">
                  آخر تقييم من فريق التدريس
                </p>
              </div>
            </div>
            {(upcoming ?? []).length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-iris/30 bg-iris-soft/40 px-3.5 py-2.5 text-xs text-ink">
                <span className="inline-flex items-center gap-1.5 font-semibold text-iris">
                  <span className="size-1.5 animate-pulse rounded-full bg-iris" />{" "}
                  الجلسة القادمة
                </span>
                <span className="font-medium">{upcoming?.[0]?.title}</span>
                <span className="text-ink-soft">
                  · {upcoming?.[0] ? formatDateTime(upcoming[0].startsAt) : ""}
                </span>
              </div>
            )}
          </div>
        </section>
      )}
      <section className="container py-10">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            {
              icon: BookOpen,
              label: "كورسات ملتحق بها",
              value: data?.stats.courses ?? 0,
            },
            {
              icon: CheckCircle2,
              label: "دروس مكتملة",
              value: data?.stats.completedLessons ?? 0,
            },
            {
              icon: Clock,
              label: "وقت التعلّم",
              value: formatMinutesShort(data?.stats.minutes ?? 0),
            },
            {
              icon: Flame,
              label: "كورسات مكتملة",
              value: data?.stats.completedCourses ?? 0,
            },
          ].map(item => (
            <div
              key={item.label}
              className="rounded-2xl border border-line bg-card p-5"
            >
              <item.icon className="size-5 text-ink-soft" />
              <p
                className={cn(
                  "mt-3 font-bold text-ink",
                  typeof item.value === "string" ? "text-lg" : "latin text-2xl"
                )}
              >
                {item.value}
              </p>
              <p className="mt-1 text-xs text-ink-soft">{item.label}</p>
            </div>
          ))}
        </div>

        {/* Subscription */}
        <div
          className={cn(
            "mt-6 flex flex-col justify-between gap-4 rounded-3xl border p-6 sm:flex-row sm:items-center",
            activeSub ? "border-ink bg-iris text-white" : "border-line bg-card"
          )}
        >
          <div className="flex items-start gap-3">
            <Sparkles
              className={cn(
                "mt-0.5 size-5",
                activeSub ? "text-acid" : "text-iris"
              )}
            />
            <div>
              <p
                className={cn(
                  "font-semibold",
                  activeSub ? "text-white" : "text-ink"
                )}
              >
                {activeSub
                  ? "اشتراكك نشط — كل الكورسات مفتوحة"
                  : "افتح كل الكورسات باشتراك واحد"}
              </p>
              <p
                className={cn(
                  "mt-1 text-sm",
                  activeSub ? "text-white/70" : "text-ink-soft"
                )}
              >
                {activeSub
                  ? `يتجدد حتى ${formatDate(subscription.currentPeriodEnd)} · يمكنك الإلغاء في أي وقت`
                  : "اشتراك برو يمنحك وصولًا غير محدود لكل الكورسات الحالية والمستقبلية."}
              </p>
            </div>
          </div>
          <Button
            onClick={() => navigate("/pricing")}
            className={cn(
              "rounded-full",
              activeSub
                ? "bg-acid text-ink hover:bg-acid-deep"
                : "bg-iris text-white hover:bg-iris-deep"
            )}
          >
            {activeSub ? "إدارة الاشتراك" : "عرض الخطط"}
          </Button>
        </div>

        {/* Continue learning */}
        <div className="mt-12">
          <SectionHeading eyebrow="قيد التعلّم" title="كمّل من حيث توقفت" />
          {isLoading ? (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {[0, 1].map(index => (
                <div
                  key={index}
                  className="h-36 animate-pulse rounded-3xl bg-ink/[0.06]"
                />
              ))}
            </div>
          ) : inProgress.length === 0 ? (
            <div className="mt-6 rounded-3xl border border-dashed border-ink/20 bg-card/60 p-10 text-center">
              <p className="font-semibold text-ink">
                لا يوجد كورس قيد التعلّم حاليًا
              </p>
              <p className="mt-1 text-sm text-ink-soft">
                اختر كورسًا من الاقتراحات أدناه وابدأ بأول درس مجانًا.
              </p>
            </div>
          ) : (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {inProgress.map(item => (
                <Link
                  key={item.enrollmentId}
                  href={`/learn/${item.slug}`}
                  className="card-soft group flex gap-4 p-4"
                >
                  <div
                    className="grid size-24 shrink-0 place-items-center rounded-2xl bg-paper-deep"
                    style={
                      item.coverImage
                        ? {
                            backgroundImage: `url(${item.coverImage})`,
                            backgroundSize: "cover",
                          }
                        : undefined
                    }
                  >
                    {!item.coverImage && (
                      <span className="latin text-xl font-bold text-ink/40">
                        {item.level.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="text-[11px] text-ink-soft">
                      {item.categoryNameAr} · {item.instructorName}
                    </span>
                    <h3 className="mt-1 truncate text-base font-semibold text-ink group-hover:text-iris">
                      {item.titleAr}
                    </h3>
                    <div className="mt-auto space-y-1.5">
                      <div className="flex justify-between text-[11px] text-ink-soft">
                        <span>
                          {item.completedLessons} من {item.totalLessons} دروس
                        </span>
                        <span className="latin">{item.progress}%</span>
                      </div>
                      <ProgressBar value={item.progress} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Completed */}
        {completed.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl text-ink">كورسات أكملتها</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {completed.map(item => (
                <Link
                  key={item.enrollmentId}
                  href={`/courses/${item.slug}`}
                  className="rounded-2xl border border-line bg-card p-5"
                >
                  <span className="inline-flex items-center gap-1 rounded-full bg-acid px-2.5 py-1 text-[11px] font-semibold text-ink">
                    <CheckCircle2 className="size-3" /> مكتمل
                  </span>
                  <h3 className="mt-3 text-base font-semibold text-ink">
                    {item.titleAr}
                  </h3>
                  <p className="mt-1 text-xs text-ink-soft">
                    اكتمل في {formatDate(item.completedAt)}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        <div className="mt-12">
          <SectionHeading
            eyebrow="مقترح لك"
            title="الخطوة الجاية"
            description="كورسات لم تلتحق بها بعد ومرتبطة بمسارك."
          />
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {(data?.recommendations ?? []).map(course => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </div>

        {/* Wishlist */}
        {(wishlist ?? []).length > 0 && (
          <div className="mt-12">
            <h2 className="flex items-center gap-2 text-2xl text-ink">
              <Heart className="size-5 text-coral" /> قائمتك المحفوظة
            </h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {(wishlist ?? []).map(course => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          </div>
        )}

        {/* Recent reviews */}
        {(data?.recentReviews ?? []).length > 0 && (
          <div className="mt-12">
            <h2 className="flex items-center gap-2 text-2xl text-ink">
              <Target className="size-5" /> تقييماتك الأخيرة
            </h2>
            <div className="mt-5 space-y-3">
              {(data?.recentReviews ?? []).map(review => (
                <div
                  key={review.id}
                  className="flex flex-col gap-2 rounded-2xl border border-line bg-card p-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3">
                    <Stars value={review.rating} />
                    <p className="text-sm text-ink-soft">
                      {review.comment ?? "بدون تعليق"}
                    </p>
                  </div>
                  <span className="text-xs text-ink-soft">
                    {formatDate(review.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-14 flex justify-center">
          <Button
            asChild
            variant="outline"
            className="rounded-full border-ink/20"
          >
            <Link href="/profile">
              ملفي الشخصي <ArrowLeft className="ms-2 size-4" />
            </Link>
          </Button>
        </div>
      </section>
    </PageShell>
  );
}
