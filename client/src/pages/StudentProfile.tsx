import { useState } from "react";
import { Link, useParams } from "wouter";
import {
  ArrowLeft,
  CalendarClock,
  ClipboardList,
  Mail,
  MapPin,
  Star,
  Target,
  Video,
} from "lucide-react";
import { PageShell } from "@/components/layout/site-footer";
import { Stars, UserAvatar } from "@/components/bits";
import { HomeworkCard, type HomeworkTask } from "@/components/homework";
import {
  AssignTaskDialog,
  AttendanceChip,
  LevelBadge,
  RateStudentDialog,
  RatingStars,
  SkillBars,
} from "@/components/classroom";
import { PremiumActivationDialog } from "@/components/premium/PremiumActivationDialog";
import { PremiumAdminPanel } from "@/components/premium/PremiumAdminPanel";
import { PremiumAccountSummary } from "@/components/premium-account-summary";
import { GrantAccessDialog } from "@/components/grant-access";
import { StaffRoleControl } from "@/components/staff-role-control";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { trpc } from "@/lib/trpc";
import { formatDate, formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

const homework = trpc.homework;

export default function StudentProfile() {
  const params = useParams<{ id: string }>();
  const userId = Number(params.id);
  const { user, loading: authLoading, refresh: refreshAuth } = useAuth();
  const isStaff = user?.role === "admin";
  const isSelf = user?.id === userId;

  const detail = trpc.admin.student.useQuery(
    { userId },
    {
      enabled: Boolean(isStaff) && Number.isFinite(userId),
      refetchInterval: 30_000,
      refetchOnWindowFocus: true,
    }
  );
  const mine = trpc.admin.myClassroom.useQuery(undefined, {
    enabled: isSelf && !isStaff,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });
  const homeworkMine = homework.mine.useQuery(undefined, {
    enabled: isSelf && !isStaff,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });
  const homeworkAll = homework.list.useQuery(undefined, {
    enabled: isStaff,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });
  const dashboard = trpc.learning.dashboard.useQuery(undefined, {
    enabled: isSelf && !isStaff,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });
  const [accessOpen, setAccessOpen] = useState(false);
  const [rateOpen, setRateOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);
  const [premiumOpen, setPremiumOpen] = useState(false);

  if (authLoading) {
    return (
      <PageShell>
        <div className="container py-24 text-center text-sm text-ink-soft">
          جارٍ التحقق من تسجيل الدخول…
        </div>
      </PageShell>
    );
  }

  if (!user) {
    return (
      <PageShell>
        <div className="container py-24 text-center">
          <h1 className="text-2xl text-ink">تعذر تحميل الملف</h1>
          <p className="mt-2 text-sm text-ink-soft">
            انتهت جلسة الدخول أو حدثت مشكلة في التحقق. سجّل الدخول وحاول مرة
            أخرى.
          </p>
          <Button
            variant="outline"
            onClick={() => void refreshAuth()}
            className="mt-6 me-2 rounded-full"
          >
            إعادة المحاولة
          </Button>
          <Button asChild className="mt-6 rounded-full bg-iris text-white">
            <Link href="/login">تسجيل الدخول</Link>
          </Button>
        </div>
      </PageShell>
    );
  }

  if (!isStaff && !isSelf) {
    return (
      <PageShell>
        <div className="container py-24 text-center">
          <h1 className="text-2xl text-ink">الملف غير متاح</h1>
          <p className="mt-2 text-sm text-ink-soft">
            ملفات الطلاب متاحة للإدارة أو للطالب نفسه.
          </p>
          <Button asChild className="mt-6 rounded-full bg-iris text-white">
            <Link href="/dashboard">العودة للوحة التعلّم</Link>
          </Button>
        </div>
      </PageShell>
    );
  }

  const primaryQuery = isStaff ? detail : mine;
  const queryError =
    primaryQuery.error ??
    homeworkAll.error ??
    homeworkMine.error ??
    dashboard.error;
  const queryLoading =
    primaryQuery.isLoading ||
    (isStaff
      ? homeworkAll.isLoading
      : homeworkMine.isLoading || dashboard.isLoading);
  const notFound = isStaff && detail.error?.data?.code === "NOT_FOUND";
  if (notFound) {
    return (
      <PageShell>
        <div className="container py-24 text-center">
          <h1 className="text-2xl text-ink">الطالب غير موجود</h1>
          <p className="mt-2 text-sm text-ink-soft">
            تأكد من رابط الملف وحاول مرة أخرى.
          </p>
          <Button asChild className="mt-6 rounded-full bg-iris text-white">
            <Link href="/admin">العودة للوحة التحكم</Link>
          </Button>
        </div>
      </PageShell>
    );
  }
  if (queryLoading) {
    return (
      <PageShell>
        <div className="container space-y-4 py-24">
          <div className="h-28 animate-pulse rounded-3xl bg-ink/[0.06]" />
          <div className="h-48 animate-pulse rounded-3xl bg-ink/[0.06]" />
        </div>
      </PageShell>
    );
  }
  if (queryError) {
    return (
      <PageShell>
        <div className="container py-24 text-center">
          <h1 className="text-2xl text-ink">تعذر تحميل بيانات الطالب</h1>
          <p className="mt-2 text-sm text-destructive">{queryError.message}</p>
          <Button
            onClick={() => {
              void primaryQuery.refetch();
              if (isStaff) void homeworkAll.refetch();
              else {
                void homeworkMine.refetch();
                void dashboard.refetch();
              }
            }}
            className="mt-6 rounded-full bg-iris text-white"
          >
            إعادة المحاولة
          </Button>
        </div>
      </PageShell>
    );
  }

  const student = isStaff ? detail.data?.student : user;
  const ratings = isStaff
    ? (detail.data?.ratings ?? [])
    : (mine.data?.ratings ?? []);
  const homeworkTasks = (
    isStaff
      ? ((homeworkAll.data ?? []) as HomeworkTask[]).filter(
          task => task.userId === userId
        )
      : ((homeworkMine.data ?? []) as HomeworkTask[])
  ) as HomeworkTask[];
  const attendance = isStaff
    ? (detail.data?.attendance ?? [])
    : (mine.data?.attendance ?? []);
  const courses = isStaff
    ? (detail.data?.courses ?? [])
    : (dashboard.data?.items ?? []).map(item => ({
        courseId: item.courseId ?? item.enrollmentId,
        titleAr: item.titleAr,
        title: item.title,
        slug: item.slug,
        completed: item.completedLessons,
        total: item.totalLessons,
        progress: item.progress,
      }));
  const latest = ratings[0];
  const studentProfileDetails = isStaff
    ? detail.data?.studentProfileDetails
    : null;

  const attendanceStats = isStaff
    ? detail.data?.attendanceStats
    : mine.data?.stats;
  const attended = attendanceStats?.attended ?? 0;
  const totalSessions = attendanceStats?.totalSessions ?? 0;
  const unmarkedCount = attendanceStats?.unmarkedCount ?? 0;
  const attendanceRate = attendanceStats?.attendanceRate ?? null;
  const avgRating = ratings.length
    ? Math.round(
        (ratings.reduce((sum, row) => sum + row.stars, 0) / ratings.length) * 10
      ) / 10
    : null;
  const openTasks = homeworkTasks.filter(
    task => task.status === "assigned" || task.status === "in_progress"
  ).length;

  return (
    <PageShell>
      <section className="border-b border-line bg-paper-deep/60">
        <div className="container py-8">
          {isStaff && (
            <Link
              href="/admin"
              className="mb-4 inline-flex items-center gap-1 text-xs font-semibold text-ink-soft hover:text-iris"
            >
              <ArrowLeft className="size-3.5 rotate-180" /> رجوع للوحة التحكم
            </Link>
          )}
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <UserAvatar
                name={student?.name}
                src={student?.avatarUrl}
                size={84}
                className="ring-4 ring-card"
              />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl text-ink sm:text-3xl">
                    {student?.name}
                  </h1>
                  <LevelBadge level={student?.englishLevel} />
                </div>
                <p className="mt-1 flex flex-wrap items-center gap-3 text-xs text-ink-soft">
                  <span className="inline-flex items-center gap-1">
                    <Mail className="size-3.5" />{" "}
                    <span className="latin" dir="ltr">
                      {student?.email}
                    </span>
                  </span>
                  {student?.country && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="size-3.5" /> {student.country}
                    </span>
                  )}
                  {student?.createdAt && (
                    <span className="inline-flex items-center gap-1">
                      <CalendarClock className="size-3.5" /> انضم{" "}
                      {formatDate(student.createdAt)}
                    </span>
                  )}
                </p>
                {student?.learningGoal && (
                  <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1 text-xs text-ink-soft">
                    <Target className="size-3.5 text-iris" /> الهدف:{" "}
                    {student.learningGoal}
                  </p>
                )}
              </div>
            </div>
            {isStaff && (
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() => setAccessOpen(true)}
                  className="rounded-full border-iris/40 text-iris"
                >
                  تفعيل كورس منفصل
                </Button>
                <Button
                  onClick={() => setPremiumOpen(true)}
                  className="rounded-full bg-iris text-white"
                >
                  حوّل لخطة الإتقان المدفوعة
                </Button>
                <Button
                  onClick={() => setRateOpen(true)}
                  className="rounded-full bg-iris text-white hover:bg-iris-deep"
                >
                  <Star className="me-2 size-4" /> قيّم الطالب
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setTaskOpen(true)}
                  className="rounded-full border-line"
                >
                  <ClipboardList className="me-2 size-4" /> مهمة جديدة
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="container grid gap-5 py-8 lg:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          {/* stats */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              {
                label: "نسبة الحضور",
                value: attendanceRate === null ? "—" : `${attendanceRate}%`,
                hint: `${attended}/${totalSessions} جلسة${unmarkedCount ? ` · ${unmarkedCount} معلّقة` : ""}`,
              },
              {
                label: "تقييمك العام",
                value: avgRating ?? "—",
                hint: `${ratings.length} تقييم`,
              },
              {
                label: "مهام مفتوحة",
                value: openTasks,
                hint: `${homeworkTasks.length} إجمالي`,
              },
              {
                label: "كورسات",
                value: courses.length,
                hint: "ملتحق بها",
              },
            ].map(item => (
              <div
                key={item.label}
                className="rounded-2xl border border-line bg-card p-4"
              >
                <p className="latin text-2xl font-bold text-ink">
                  {item.value}
                </p>
                <p className="mt-0.5 text-xs text-ink-soft">{item.label}</p>
                <p className="mt-1 text-[11px] text-ink-soft/80">{item.hint}</p>
              </div>
            ))}
          </div>

          {/* sessions */}
          <div className="rounded-2xl border border-line bg-card">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="flex items-center gap-2 text-lg text-ink">
                <Video className="size-4 text-iris" /> الجلسات الأونلاين
              </h2>
              <span className="text-xs text-ink-soft">
                {attendance.length} جلسة
              </span>
            </div>
            <div className="divide-y divide-line">
              {attendance.length === 0 && (
                <p className="p-6 text-sm text-ink-soft">
                  لسه مفيش جلسات مسجّلة.
                </p>
              )}
              {attendance.map(row => (
                <div
                  key={row.sessionId ?? row.id}
                  className="flex flex-wrap items-center justify-between gap-2 px-5 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-ink">
                      {row.title ?? "جلسة"}
                    </p>
                    <p className="text-xs text-ink-soft">
                      {row.startsAt ? formatDateTime(row.startsAt) : ""}
                    </p>
                  </div>
                  <AttendanceChip status={row.status} />
                </div>
              ))}
            </div>
          </div>

          {/* tasks */}
          <div className="rounded-2xl border border-line bg-card">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="flex items-center gap-2 text-lg text-ink">
                <ClipboardList className="size-4 text-iris" /> المهام
              </h2>
              <span className="text-xs text-ink-soft">
                {homeworkTasks.length} واجب
              </span>
            </div>
            <div className="divide-y divide-line">
              {homeworkTasks.length === 0 && (
                <p className="p-6 text-sm text-ink-soft">لسه مفيش مهام.</p>
              )}
              {homeworkTasks.map(task => (
                <div key={task.id} className="px-5 py-3">
                  <HomeworkCard
                    task={task}
                    mode={isStaff ? "admin" : "student"}
                    onChanged={() => {
                      void (isStaff
                        ? homeworkAll.refetch()
                        : homeworkMine.refetch());
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          {courses.length > 0 && (
            <div className="rounded-2xl border border-line bg-card p-5">
              <h2 className="mb-3 text-lg text-ink">الكورسات والتقدّم</h2>
              <div className="space-y-3">
                {courses.map(course => (
                  <div key={course.courseId}>
                    <div className="flex items-center justify-between text-sm">
                      <Link
                        href={`/courses/${course.slug}`}
                        className="text-ink hover:text-iris"
                      >
                        {course.titleAr}
                      </Link>
                      <span className="latin text-xs text-ink-soft">
                        {course.progress}%
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ink/8">
                      <div
                        className="h-full rounded-full bg-iris"
                        style={{ width: `${course.progress}%` }}
                      />
                    </div>
                    <p className="mt-1 text-[11px] text-ink-soft">
                      {course.completed} من {course.total} درس
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* side */}
        <div className="space-y-5">
          <div className="rounded-2xl border border-line bg-card p-5">
            <h2 className="text-lg text-ink">المهارات (آخر تقييم)</h2>
            <p className="mb-4 mt-1 text-xs text-ink-soft">
              {latest
                ? `تقييم ${formatDate(latest.createdAt)}`
                : "لسه مفيش تقييم"}
            </p>
            <SkillBars rating={latest ?? null} />
            {latest?.note && (
              <p className="mt-4 rounded-xl bg-paper-deep p-3 text-xs leading-relaxed text-ink-soft">
                {latest.note}
              </p>
            )}
          </div>

          {isStaff && (
            <div className="rounded-2xl border border-line bg-card p-5">
              <h2 className="text-lg text-ink">البيانات التعليمية</h2>
              <p className="mb-4 mt-1 text-xs text-ink-soft">
                ظاهرة للإدارة فقط، ومأخوذة من بيانات الطالب الخاصة.
              </p>
              <dl className="space-y-2 text-sm">
                <DetailRow label="الاسم" value={student?.name} />
                <DetailRow label="رقم الهاتف" value={student?.phone} />
                <DetailRow
                  label="المدينة"
                  value={studentProfileDetails?.city}
                />
                <DetailRow
                  label="سنة الميلاد"
                  value={studentProfileDetails?.birthYear}
                />
                <DetailRow
                  label="الصف أو المرحلة"
                  value={studentProfileDetails?.schoolGrade}
                />
                <DetailRow
                  label="الهدف"
                  value={studentProfileDetails?.learningGoal}
                />
                <DetailRow
                  label="الوقت المفضّل"
                  value={studentProfileDetails?.preferredStudyTime}
                />
                <DetailRow
                  label="دقائق يومية"
                  value={studentProfileDetails?.dailyStudyMinutes}
                />
                <DetailRow label="نبذة" value={studentProfileDetails?.bio} />
              </dl>
            </div>
          )}

          <div className="rounded-2xl border border-line bg-card p-5">
            <h2 className="mb-3 text-lg text-ink">سجل التقييمات</h2>
            {ratings.length === 0 && (
              <p className="text-sm text-ink-soft">لسه مفيش تقييمات.</p>
            )}
            <div className="space-y-3">
              {ratings.map(rating => (
                <div
                  key={rating.id}
                  className="rounded-xl border border-line/70 p-3"
                >
                  <div className="flex items-center justify-between">
                    <RatingStars value={rating.stars} />
                    <span className="text-[11px] text-ink-soft">
                      {formatDate(rating.createdAt)}
                    </span>
                  </div>
                  {rating.note && (
                    <p className="mt-1.5 text-xs leading-relaxed text-ink-soft">
                      {rating.note}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {isSelf && !isStaff && latest && (
            <div className="rounded-2xl border border-iris/25 bg-iris-soft/50 p-5">
              <Stars value={latest.stars} />
              <p className="mt-2 text-sm leading-relaxed text-ink">
                ملاحظات المدرّس: {latest.note ?? "بدون ملاحظة"}
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="container py-8">
        {isStaff &&
          student &&
          student.id !== user.id &&
          (student.role === "user" || student.role === "instructor") && (
            <div className="mb-6">
              <StaffRoleControl userId={userId} role={student.role} />
            </div>
          )}
        {isStaff ? (
          <PremiumAdminPanel userId={userId} />
        ) : (
          <PremiumAccountSummary />
        )}
      </section>
      {isStaff && student && (
        <>
          <PremiumActivationDialog
            userId={userId}
            studentName={student.name ?? ""}
            open={premiumOpen}
            onOpenChange={setPremiumOpen}
          />
          <GrantAccessDialog
            userId={userId}
            studentName={student.name ?? ""}
            open={accessOpen}
            onOpenChange={setAccessOpen}
          />
          <RateStudentDialog
            userId={userId}
            studentName={student.name ?? ""}
            open={rateOpen}
            onOpenChange={setRateOpen}
          />
          <AssignTaskDialog
            userId={userId}
            studentName={student.name ?? ""}
            open={taskOpen}
            onOpenChange={setTaskOpen}
          />
        </>
      )}
    </PageShell>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <div className="flex flex-wrap justify-between gap-2 border-b border-line/70 pb-2 last:border-0 last:pb-0">
      <dt className="text-ink-soft">{label}</dt>
      <dd className="max-w-[65%] text-end text-ink">{value || "—"}</dd>
    </div>
  );
}

export { cn };
