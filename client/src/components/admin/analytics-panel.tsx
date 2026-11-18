import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  Gift,
  GraduationCap,
  MessageCircle,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";

function buildFollowUpWhatsApp(student: {
  name: string;
  phone: string;
  daysSinceActive: number;
}) {
  const firstName = student.name.trim().split(/\s+/)[0] || "يا بطل";
  const msg = `أهلاً ${firstName} 👋\nوحشتنا في أكاديمية Link Me! بقالك ${student.daysSinceActive} أيام مدخلتش على دروسك 🔥\nمستنيينك النهارده — 10 دقايق بس كفاية ترجّع بيهم شعلة حماستك وتكمل في ساحة المسابقات:\nhttps://www.link-me.tech/dashboard`;
  const cleanDigits = student.phone.replace(/[^\d]/g, "");
  const intl = cleanDigits
    ? cleanDigits.startsWith("0")
      ? `2${cleanDigits}`
      : cleanDigits
    : "";
  return `https://wa.me/${intl}?text=${encodeURIComponent(msg)}`;
}

export function AdminAnalyticsPanel() {
  const { data, isLoading, isError, refetch } =
    trpc.community.adminAnalytics.useQuery();

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-line bg-card p-8 text-center text-sm text-ink-soft">
        جارٍ حساب الإحصائيات والرسوم البيانية…
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-2xl border border-line bg-card p-6 text-center">
        <p className="text-sm text-ink">تعذّر تحميل الإحصائيات حالياً.</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-3 rounded-full"
          onClick={() => void refetch()}
        >
          إعادة المحاولة
        </Button>
      </div>
    );
  }

  const maxMonthlyRevenue = Math.max(
    1,
    ...data.monthlyRevenue.map(m => m.revenueEgp)
  );
  const maxCourseEnr = Math.max(
    1,
    ...data.topCourses.map(c => c.enrollmentsCount)
  );
  const maxLevelCount = Math.max(
    1,
    ...data.levelDistribution.map(l => l.count)
  );

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        {[
          {
            icon: Wallet,
            label: "إجمالي الإيرادات",
            value: `${data.summary.approvedRevenueEgp.toLocaleString("en-US")} ج.م`,
            accent: "bg-emerald-500/12 text-emerald-600",
          },
          {
            icon: Users,
            label: "إجمالي الطلاب",
            value: data.summary.totalStudents,
            accent: "bg-iris-soft text-iris",
          },
          {
            icon: TrendingUp,
            label: "اشتراكات نشطة",
            value: data.summary.activeSubscribers,
            accent: "bg-sky-500/12 text-sky-600",
          },
          {
            icon: BookOpen,
            label: "تسجيلات الكورسات",
            value: data.summary.totalEnrollments,
            accent: "bg-purple-500/12 text-purple-600",
          },
          {
            icon: AlertTriangle,
            label: "إيصالات قيد المراجعة",
            value: data.summary.pendingReceiptsCount,
            accent: "bg-amber-500/15 text-amber-600",
          },
          {
            icon: Gift,
            label: "دعوات الأصدقاء",
            value: data.summary.totalReferrals,
            accent: "bg-pink-500/12 text-pink-600",
          },
        ].map(kpi => (
          <div
            key={kpi.label}
            className="rounded-2xl border border-line bg-card p-4"
          >
            <span
              className={`grid size-9 place-items-center rounded-xl ${kpi.accent}`}
            >
              <kpi.icon className="size-4" />
            </span>
            <p className="latin mt-3 text-xl font-black text-ink">
              {kpi.value}
            </p>
            <p className="mt-0.5 text-[11px] text-ink-soft">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Monthly Revenue Bar Chart */}
        <div className="rounded-2xl border border-line bg-card p-5">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="flex items-center gap-2 text-sm font-bold text-ink">
                <BarChart3 className="size-4 text-emerald-600" /> الإيرادات
                الشهرية (آخر 6 شهور)
              </h3>
              <p className="mt-0.5 text-[11px] text-ink-soft">
                من الإيصالات المقبولة والطلبات المدفوعة
              </p>
            </div>
          </div>

          <div className="mt-6 grid h-48 grid-cols-6 items-end gap-2 sm:gap-3">
            {data.monthlyRevenue.map(bucket => {
              const pct = Math.max(
                6,
                Math.round((bucket.revenueEgp / maxMonthlyRevenue) * 100)
              );
              return (
                <div
                  key={bucket.monthKey}
                  className="flex h-full flex-col items-center justify-end gap-1.5"
                >
                  <span className="latin text-[10px] font-bold text-ink-soft">
                    {bucket.revenueEgp > 0 ? `${bucket.revenueEgp}` : "0"}
                  </span>
                  <div className="relative flex w-full flex-1 items-end">
                    <div
                      className="w-full rounded-t-xl bg-gradient-to-t from-emerald-600 to-emerald-400 transition-all"
                      style={{ height: `${bucket.revenueEgp > 0 ? pct : 4}%` }}
                      title={`${bucket.label}: ${bucket.revenueEgp} ج.م (${bucket.ordersCount} عملية)`}
                    />
                  </div>
                  <span className="text-[11px] font-medium text-ink-soft">
                    {bucket.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Courses + Level Distribution */}
        <div className="space-y-5">
          <div className="rounded-2xl border border-line bg-card p-5">
            <h3 className="flex items-center gap-2 text-sm font-bold text-ink">
              <BookOpen className="size-4 text-iris" /> أكتر الكورسات طلباً
            </h3>
            <div className="mt-4 space-y-3">
              {data.topCourses.length === 0 ? (
                <p className="text-xs text-ink-soft">
                  مفيش تسجيلات في كورسات لسه.
                </p>
              ) : (
                data.topCourses.map(course => (
                  <div key={course.id} className="space-y-1">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="truncate font-semibold text-ink">
                        {course.titleAr}
                      </span>
                      <span className="latin shrink-0 font-bold text-iris">
                        {course.enrollmentsCount} طالب
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-paper-deep">
                      <div
                        className="h-full rounded-full bg-iris transition-all"
                        style={{
                          width: `${Math.max(5, Math.round((course.enrollmentsCount / maxCourseEnr) * 100))}%`,
                        }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-card p-5">
            <h3 className="flex items-center gap-2 text-sm font-bold text-ink">
              <GraduationCap className="size-4 text-amber-500" /> توزيع مستويات
              الطلبة
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {data.levelDistribution.map(item => (
                <div
                  key={item.level}
                  className="flex items-center gap-2 rounded-xl border border-line bg-paper-deep/60 px-3 py-1.5 text-xs"
                >
                  <span className="font-bold text-ink">{item.level}</span>
                  <span className="latin rounded-full bg-iris-soft px-2 py-0.5 text-[11px] font-bold text-iris">
                    {item.count}
                  </span>
                  <div className="hidden h-1.5 w-10 overflow-hidden rounded-full bg-line sm:block">
                    <div
                      className="h-full rounded-full bg-amber-500"
                      style={{
                        width: `${Math.round((item.count / maxLevelCount) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Inactive Students Churn Prevention Alerts */}
      <div className="rounded-2xl border border-amber-400/40 bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="flex items-center gap-2 text-base font-bold text-ink">
              <AlertTriangle className="size-5 text-amber-500" />
              تنبيه المتابعة — طلبة لم يفتحوا المنصة منذ 3+ أيام (
              {data.inactiveStudents.length})
            </h3>
            <p className="mt-0.5 text-xs text-ink-soft">
              ابعتلهم رسالة تشجيع سريعة على واتساب عشان يرجعوا يكملوا الكورس قبل
              ما يكسّلوا!
            </p>
          </div>
        </div>

        {data.inactiveStudents.length === 0 ? (
          <p className="mt-4 rounded-xl bg-emerald-500/10 p-4 text-center text-xs font-semibold text-emerald-700 dark:text-emerald-300">
            🎉 ممتاز! كل الطلبة نشيطين وفتحوا المنصة خلال آخر 3 أيام.
          </p>
        ) : (
          <div className="mt-4 grid gap-2.5 md:grid-cols-2">
            {data.inactiveStudents.map(student => (
              <div
                key={student.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-line bg-paper-deep/40 p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-ink">
                    {student.name}
                  </p>
                  <p className="mt-0.5 text-[11px] text-ink-soft">
                    غائب منذ{" "}
                    <b className="text-amber-600 dark:text-amber-400">
                      {student.daysSinceActive >= 90
                        ? "أكثر من شهر"
                        : `${student.daysSinceActive} أيام`}
                    </b>
                    {student.englishLevel ? ` · ${student.englishLevel}` : ""}
                  </p>
                </div>
                <Button
                  asChild
                  size="sm"
                  className="shrink-0 rounded-full bg-[#16A34A] text-xs font-bold text-white hover:bg-[#15803D]"
                >
                  <a
                    href={buildFollowUpWhatsApp(student)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <MessageCircle className="me-1.5 size-3.5" /> متابعة واتساب
                  </a>
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
