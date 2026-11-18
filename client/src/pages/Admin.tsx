import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useSearch } from "wouter";
import {
  ArrowUpRight,
  CalendarPlus,
  Check,
  ClipboardList,
  Copy,
  ExternalLink,
  FileText,
  KeyRound,
  MessageCircle,
  RefreshCw,
  Search,
  Star,
  UserCheck,
  Users,
  Video,
} from "lucide-react";
import { toast } from "sonner";
import { BookingRequests } from "@/components/booking-requests";
import { ReceiptsManager } from "@/components/admin/receipts-manager";
import { ClassroomsManager } from "@/components/admin/classrooms-manager";
import { AdminAnalyticsPanel } from "@/components/admin/analytics-panel";
import { AdminHomeworkPanel } from "@/components/homework";
import { OwnerInbox } from "@/components/chat";
import { PremiumAdminPanel } from "@/components/premium/PremiumAdminPanel";
import { CourseEditor } from "@/components/course-editor";
import { OwnerSecurityPanel } from "@/components/owner-security";
import { PageShell } from "@/components/layout/site-footer";
import { Eyebrow, UserAvatar } from "@/components/bits";
import {
  AssignTaskDialog,
  ATTENDANCE_LABELS,
  AttendanceChip,
  LevelBadge,
  RateStudentDialog,
  RatingStars,
  SessionStatusChip,
  TASK_LABELS,
} from "@/components/classroom";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { trpc } from "@/lib/trpc";
import { formatDate, formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { inputClass } from "./auth-layout";

const LEVELS = ["", "A1", "A2", "B1", "B2", "C1", "C2"];

export default function AdminConsole() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const isStaff = user?.role === "admin";
  const search = useSearch();
  const tabFromUrl = new URLSearchParams(search).get("tab");
  const validTabs = [
    "students",
    "analytics",
    "classrooms",
    "sessions",
    "tasks",
    "messages",
    "receipts",
    "bookings",
    "owner",
    "premium",
    "curriculum",
  ];
  const [activeTab, setActiveTab] = useState(
    validTabs.includes(tabFromUrl ?? "") ? tabFromUrl! : "students"
  );
  useEffect(() => {
    if (tabFromUrl && validTabs.includes(tabFromUrl)) setActiveTab(tabFromUrl);
  }, [tabFromUrl]);

  const overview = trpc.admin.overview.useQuery(undefined, {
    enabled: Boolean(isStaff),
  });
  const sessions = trpc.admin.sessions.useQuery(undefined, {
    enabled: Boolean(isStaff),
  });
  const threads = trpc.chat.threads.useQuery(undefined, {
    enabled: Boolean(isStaff),
    refetchInterval: 15_000,
  });
  const receiptStats = trpc.receipts.adminStats.useQuery(undefined, {
    enabled: Boolean(isStaff),
    refetchInterval: 15_000,
  });
  const pendingReceipts = receiptStats.data?.pendingCount ?? 0;
  const unreadMessages = (threads.data ?? []).reduce(
    (sum, row) => sum + row.unread,
    0
  );
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState("");
  const [rateTarget, setRateTarget] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [taskTarget, setTaskTarget] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [passwordTarget, setPasswordTarget] = useState<{
    id: number;
    name: string;
    email: string;
  } | null>(null);
  const [reportTarget, setReportTarget] = useState<{
    id: number;
    name: string;
  } | null>(null);

  const students = useMemo(() => {
    const rows = overview.data?.students ?? [];
    return rows.filter(row => {
      const matchesQuery =
        !query ||
        (row.name ?? "").includes(query) ||
        (row.email ?? "").includes(query);
      const matchesLevel = !level || row.englishLevel === level;
      return matchesQuery && matchesLevel;
    });
  }, [overview.data, query, level]);

  if (!loading && user && !isStaff) {
    return (
      <PageShell>
        <div className="container py-24 text-center">
          <h1 className="text-2xl text-ink">الصفحة دي لحساب الإدارة فقط</h1>
          <p className="mt-2 text-sm text-ink-soft">
            ملفات الطلاب والحجوزات متاحة للمالك فقط.
          </p>
          <Button asChild className="mt-6 rounded-full bg-iris text-white">
            <Link href="/dashboard">رجوع للوحة التعلّم</Link>
          </Button>
        </div>
      </PageShell>
    );
  }

  if (loading)
    return (
      <PageShell>
        <div className="container py-20 text-sm text-ink-soft">
          جارٍ تحميل حسابك…
        </div>
      </PageShell>
    );
  if (!user)
    return (
      <PageShell>
        <div className="container py-20">
          <h1 className="text-2xl text-ink">
            ادخل بحساب <span className="hl-word">الإدارة.</span>
          </h1>
          <Button asChild className="mt-5 rounded-full bg-iris text-white">
            <Link href="/owner">دخول المالك بالرمز السري</Link>
          </Button>
        </div>
      </PageShell>
    );
  const totals = overview.data?.totals;

  return (
    <PageShell>
      <section className="border-b border-line bg-paper-deep/60">
        <div className="container py-10">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <Eyebrow>لوحة التحكم</Eyebrow>
              <h1 className="mt-3 text-3xl text-ink sm:text-4xl">
                إدارة الطلاب والحضور <span className="hl-word">والتقييم.</span>
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-soft">
                من هنا تشوف كل الطلاب: مستواهم، نسبة حضورهم للجلسات الأونلاين،
                مهامهم، وتقييمك ليهم. وكمان تقدر تدخل جلسة وتسجّل حضور كل طالب،
                أو تبعت له مهمة جديدة.
              </p>
            </div>
            <Button
              asChild
              variant="outline"
              className="rounded-full border-line"
            >
              <Link href="/dashboard">
                لوحة الطالب <ArrowUpRight className="ms-2 size-4" />
              </Link>
            </Button>
          </div>

          <div className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              {
                icon: Users,
                label: "طلاب مسجلين",
                value: overview.isPending ? "…" : overview.isError ? "—" : totals?.students ?? 0,
              },
              {
                icon: Video,
                label: "جلسات أونلاين",
                value: overview.isPending ? "…" : overview.isError ? "—" : totals?.sessions ?? 0,
              },
              {
                icon: ClipboardList,
                label: "مهام مُرسلة",
                value: overview.isPending ? "…" : overview.isError ? "—" : totals?.tasks ?? 0,
              },
              {
                icon: Star,
                label: "متوسط التقييم",
                value: totals?.avgRating ?? "—",
              },
            ].map(item => (
              <div
                key={item.label}
                className="rounded-2xl border border-line bg-card p-4"
              >
                <span className="grid size-9 place-items-center rounded-xl bg-iris-soft text-iris">
                  <item.icon className="size-4" />
                </span>
                <p className="latin mt-3 text-2xl font-bold text-ink">
                  {item.value}
                </p>
                <p className="text-xs text-ink-soft">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 rounded-2xl border border-line bg-card p-1.5 sm:w-auto">
            <TabsTrigger
              value="students"
              className="rounded-xl px-4 py-2 data-[state=active]:bg-iris data-[state=active]:text-white"
            >
              الطلاب ({overview.data?.students.length ?? 0})
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className="rounded-xl px-4 py-2 data-[state=active]:bg-iris data-[state=active]:text-white"
            >
              الإحصائيات والتنبيهات 📊
            </TabsTrigger>
            <TabsTrigger
              value="classrooms"
              className="rounded-xl px-4 py-2 data-[state=active]:bg-iris data-[state=active]:text-white"
            >
              الفصول الدراسية 🏫
            </TabsTrigger>
            <TabsTrigger
              value="sessions"
              className="rounded-xl px-4 py-2 data-[state=active]:bg-iris data-[state=active]:text-white"
            >
              الجلسات الأونلاين ({sessions.data?.length ?? 0})
            </TabsTrigger>
            <TabsTrigger value="curriculum" className="rounded-xl px-4 py-2 data-[state=active]:bg-iris data-[state=active]:text-white">محتوى الكورسات</TabsTrigger>
            <TabsTrigger
              value="tasks"
              className="rounded-xl px-4 py-2 data-[state=active]:bg-iris data-[state=active]:text-white"
            >
              الواجبات
            </TabsTrigger>
            <TabsTrigger
              value="messages"
              className="relative rounded-xl px-4 py-2 data-[state=active]:bg-iris data-[state=active]:text-white"
            >
              المحادثات
              {Boolean(unreadMessages) && (
                <span className="ms-1.5 rounded-full bg-iris px-1.5 text-[10px] font-bold text-white data-[state=active]:bg-white data-[state=active]:text-iris">
                  {unreadMessages}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="owner"
              className="rounded-xl px-4 py-2 data-[state=active]:bg-iris data-[state=active]:text-white"
            >
              أمان المالك
            </TabsTrigger>
            <TabsTrigger
              value="receipts"
              className="relative rounded-xl px-4 py-2 data-[state=active]:bg-iris data-[state=active]:text-white"
            >
              إيصالات التحويل
              {Boolean(pendingReceipts) && (
                <span className="ms-1.5 rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-black text-white animate-pulse">
                  {pendingReceipts}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="bookings"
              className="rounded-xl px-4 py-2 data-[state=active]:bg-iris data-[state=active]:text-white"
            >
              طلبات الحجز
            </TabsTrigger>
            <TabsTrigger value="premium" className="rounded-xl px-4 py-2 data-[state=active]:bg-iris data-[state=active]:text-white">الخطط المدفوعة والمتابعة اليومية</TabsTrigger>
          </TabsList>
          <TabsContent value="premium"><PremiumAdminPanel /></TabsContent>
          <TabsContent value="analytics">
            <AdminAnalyticsPanel />
          </TabsContent>
          <TabsContent value="classrooms">
            <ClassroomsManager />
          </TabsContent>
          <TabsContent value="receipts">
            <ReceiptsManager />
          </TabsContent>
          <TabsContent value="bookings">
            <BookingRequests />
          </TabsContent>

          {/* ---------------- students ---------------- */}
          <TabsContent value="students" className="space-y-4">
            {overview.isPending && <p role="status" className="rounded-2xl border border-line bg-card p-6 text-ink-soft">بنحمّل بيانات الطلاب…</p>}
            {overview.isError && <div role="alert" className="rounded-2xl border border-line bg-card p-6 text-ink"><p>بيانات الطلاب ما اتحمّلتش، مش معنى كده إن مفيش طلاب.</p><Button type="button" variant="outline" className="mt-3" onClick={() => void overview.refetch()}>جرّب تحميلها تاني</Button></div>}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
                <input
                  value={query}
                  onChange={event => setQuery(event.target.value)}
                  placeholder="ابحث باسم الطالب أو الإيميل"
                  className={cn(inputClass, "ps-9")}
                />
              </div>
              <select
                value={level}
                onChange={event => setLevel(event.target.value)}
                className={cn(inputClass, "sm:w-44")}
              >
                {LEVELS.map(value => (
                  <option key={value} value={value}>
                    {value || "كل المستويات"}
                  </option>
                ))}
              </select>
            </div>

            <div className="overflow-hidden rounded-2xl border border-line bg-card">
              <div className="hidden grid-cols-[1.5fr_0.4fr_0.5fr_0.5fr_0.7fr_2fr] gap-3 border-b border-line px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-ink-soft lg:grid">
                <span>الطالب</span>
                <span>المستوى</span>
                <span>كورسات</span>
                <span>دروس</span>
                <span>الحضور</span>
                <span>التقييم</span>
              </div>
              {!overview.isPending && !overview.isError && students.length === 0 && (
                <p className="p-8 text-center text-sm text-ink-soft">
                  مفيش طلاب مطابقين للبحث.
                </p>
              )}
              {students.map(student => (
                <div
                  key={student.id}
                  className="grid gap-3 border-b border-line px-5 py-4 last:border-0 transition-colors hover:bg-paper-deep/50 lg:grid-cols-[1.5fr_0.4fr_0.5fr_0.5fr_0.7fr_2fr] lg:items-center"
                >
                  <div className="flex items-center gap-3">
                    <UserAvatar
                      name={student.name}
                      src={student.avatarUrl}
                      size={38}
                    />
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-ink">
                        {student.name}
                      </p>
                      <p
                        className="latin truncate text-xs text-ink-soft"
                        dir="ltr"
                      >
                        {student.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-ink-soft lg:block">
                    <span className="lg:hidden">المستوى:</span>{" "}
                    <LevelBadge level={student.englishLevel} />
                  </div>
                  <p className="text-sm text-ink-soft">
                    <span className="lg:hidden">كورسات: </span>
                    {student.enrollmentsCount}
                  </p>
                  <p className="text-sm text-ink-soft">
                    <span className="lg:hidden">دروس مكتملة: </span>
                    {student.completedLessons}
                  </p>
                  <div className="text-sm">
                    <span className="lg:hidden text-ink-soft">الحضور: </span>
                    {student.attendanceRate === null ? (
                      <span className="text-xs text-ink-soft">—</span>
                    ) : (
                      <span
                        className={cn(
                          "font-semibold",
                          student.attendanceRate >= 75
                            ? "text-emerald-600"
                            : student.attendanceRate >= 50
                              ? "text-amber-600"
                              : "text-destructive"
                        )}
                      >
                        {student.attendanceRate}%
                      </span>
                    )}
                    <span className="ms-1 text-[11px] text-ink-soft">
                      ({student.attendedSessions}/{student.totalSessions})
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <RatingStars value={student.ratingAvg} />
                    <button
                      onClick={() =>
                        setRateTarget({
                          id: student.id,
                          name: student.name ?? "",
                        })
                      }
                      className="rounded-full border border-line px-2.5 py-1 text-[11px] font-medium text-ink-soft transition-colors hover:border-iris hover:text-iris"
                    >
                      قيّم
                    </button>
                    <button
                      onClick={() =>
                        setTaskTarget({
                          id: student.id,
                          name: student.name ?? "",
                        })
                      }
                      className="rounded-full border border-line px-2.5 py-1 text-[11px] font-medium text-ink-soft transition-colors hover:border-iris hover:text-iris"
                    >
                      مهمة
                    </button>
                    <button
                      onClick={() =>
                        setPasswordTarget({
                          id: student.id,
                          name: student.name ?? "طالب",
                          email: student.email ?? "",
                        })
                      }
                      title="استعادة أو تعيين كلمة مرور الطالب لإرسالها له"
                      className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-700 transition-colors hover:bg-amber-500 hover:text-white dark:text-amber-300"
                    >
                      <KeyRound className="size-3" /> كلمة السر
                    </button>
                    <button
                      onClick={() =>
                        setReportTarget({
                          id: student.id,
                          name: student.name ?? "طالب",
                        })
                      }
                      title="توليد وإرسال تقرير متابعة جاهز لولي الأمر على واتساب"
                      className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 transition-colors hover:bg-emerald-600 hover:text-white dark:text-emerald-300"
                    >
                      <FileText className="size-3" /> تقرير ولي الأمر
                    </button>
                    <Link
                      href={`/students/${student.id}`}
                      className="inline-flex items-center gap-1 rounded-full bg-iris-soft px-2.5 py-1 text-[11px] font-semibold text-iris transition-colors hover:bg-iris hover:text-white"
                    >
                      الملف <ExternalLink className="size-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* ---------------- sessions ---------------- */}
          <TabsContent value="sessions" className="space-y-4">
            {sessions.isPending && <p role="status" className="text-ink-soft">بنحمّل الجلسات…</p>}
            {sessions.isError && <div role="alert" className="rounded-2xl border border-line bg-card p-5"><p className="text-ink">الجلسات ما اتحمّلتش.</p><Button type="button" variant="outline" className="mt-3" onClick={() => void sessions.refetch()}>جرّب تاني</Button></div>}
            <div className="flex justify-end">
              <NewSessionDialog />
            </div>
            <div className="space-y-3">
              {(sessions.data ?? []).map(session => (
                <SessionCard key={session.id} session={session} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="curriculum"><CourseEditor /></TabsContent>
          <TabsContent value="messages">
            <OwnerInbox />
          </TabsContent>
          <TabsContent value="owner">
            <OwnerSecurityPanel />
          </TabsContent>

          {/* ---------------- tasks ---------------- */}
          <TabsContent value="tasks">
            <AdminHomeworkPanel />
          </TabsContent>
        </Tabs>
      </section>

      {rateTarget && (
        <RateStudentDialog
          userId={rateTarget.id}
          studentName={rateTarget.name}
          open
          onOpenChange={open => !open && setRateTarget(null)}
        />
      )}
      {taskTarget && (
        <AssignTaskDialog
          userId={taskTarget.id}
          studentName={taskTarget.name}
          open
          onOpenChange={open => !open && setTaskTarget(null)}
        />
      )}
      {passwordTarget && (
        <StudentPasswordDialog
          student={passwordTarget}
          open
          onOpenChange={open => !open && setPasswordTarget(null)}
        />
      )}
      {reportTarget && (
        <ParentReportDialog
          student={reportTarget}
          open
          onOpenChange={open => !open && setReportTarget(null)}
        />
      )}
    </PageShell>
  );
}

/* ------------------------------------------------------------------ */

type SessionRow = {
  id: number;
  title: string;
  startsAt: Date | string;
  durationMinutes: number;
  meetingUrl: string | null;
  status: string;
  courseTitle: string | null;
  present: number;
  late: number;
  absent: number;
  roster: { id: number; name: string | null; englishLevel: string | null }[];
  marks: { userId: number; status: string }[];
};

function SessionCard({ session }: { session: SessionRow }) {
  const utils = trpc.useUtils();
  const [open, setOpen] = useState(false);
  const mark = trpc.admin.markAttendance.useMutation({
    onSuccess: async () => {
      await utils.admin.sessions.invalidate();
      toast.success("تم تحديث الحضور");
    },
    onError: error => toast.error(error.message),
  });

  return (
    <div className="rounded-2xl border border-line bg-card">
      <button
        onClick={() => setOpen(value => !value)}
        className="flex w-full flex-col gap-3 p-4 text-start sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <SessionStatusChip status={session.status} />
            <p className="font-semibold text-ink">{session.title}</p>
          </div>
          <p className="mt-1 text-xs text-ink-soft">
            {session.courseTitle ?? "كورس"} · {formatDateTime(session.startsAt)}{" "}
            · {session.durationMinutes} دقيقة
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="rounded-full bg-emerald-500/12 px-2 py-0.5 font-semibold text-emerald-700 dark:text-emerald-400">
            حاضر {session.present}
          </span>
          <span className="rounded-full bg-amber-500/15 px-2 py-0.5 font-semibold text-amber-700 dark:text-amber-400">
            متأخر {session.late}
          </span>
          <span className="rounded-full bg-destructive/10 px-2 py-0.5 font-semibold text-destructive">
            غايب {session.absent}
          </span>
          <span className="text-iris">{open ? "إخفاء" : "تسجيل الحضور"}</span>
        </div>
      </button>
      {open && (
        <div className="border-t border-line p-4">
          {session.meetingUrl && (
            <a
              href={session.meetingUrl}
              target="_blank"
              rel="noreferrer"
              className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold text-iris hover:underline"
            >
              <Video className="size-3.5" /> رابط الجلسة
            </a>
          )}
          <div className="space-y-2">
            {session.roster.map(student => {
              const current = session.marks.find(
                mark => mark.userId === student.id
              )?.status;
              return (
                <div
                  key={student.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line/70 bg-paper-deep/40 px-3 py-2"
                >
                  <span className="flex items-center gap-2 text-sm text-ink">
                    <UserAvatar name={student.name} size={26} /> {student.name}
                    <LevelBadge level={student.englishLevel} />
                  </span>
                  <span className="flex flex-wrap items-center gap-1">
                    {(["present", "late", "absent", "excused"] as const).map(
                      status => (
                        <button
                          key={status}
                          onClick={() =>
                            mark.mutate({
                              sessionId: session.id,
                              userId: student.id,
                              status,
                            })
                          }
                          className={cn(
                            "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                            current === status
                              ? "border-iris bg-iris text-white"
                              : "border-line text-ink-soft hover:border-iris hover:text-iris"
                          )}
                        >
                          {ATTENDANCE_LABELS[status]}
                        </button>
                      )
                    )}
                    {current && <AttendanceChip status={current} />}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function NewSessionDialog() {
  const utils = trpc.useUtils();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    courseId: "",
    title: "",
    agenda: "",
    startsAt: "",
    duration: 60,
    meetingUrl: "",
  });
  const courses = trpc.catalog.courses.useQuery({}, { enabled: open });
  const create = trpc.admin.createSession.useMutation({
    onSuccess: async () => {
      toast.success("تم جدولة الجلسة");
      await utils.admin.invalidate();
      setOpen(false);
      setForm({
        courseId: "",
        title: "",
        agenda: "",
        startsAt: "",
        duration: 60,
        meetingUrl: "",
      });
    },
    onError: error => toast.error(error.message),
  });

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="rounded-full bg-iris text-white hover:bg-iris-deep"
      >
        <CalendarPlus className="me-2 size-4" /> جلسة جديدة
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>جدولة جلسة أونلاين</DialogTitle>
            <DialogDescription>
              الجلسة تظهر في صفحة الكورس وفي لوحة الطالب.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="mb-1 block">الكورس</Label>
              <select
                value={form.courseId}
                onChange={event =>
                  setForm(prev => ({ ...prev, courseId: event.target.value }))
                }
                className={inputClass}
              >
                <option value="">اختاري الكورس</option>
                {(courses.data?.items ?? []).map(course => (
                  <option key={course.id} value={course.id}>
                    {course.titleAr}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label className="mb-1 block">عنوان الجلسة</Label>
              <input
                value={form.title}
                onChange={event =>
                  setForm(prev => ({ ...prev, title: event.target.value }))
                }
                className={inputClass}
                placeholder="مثال: تدريب محادثة مباشر"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1 block">الموعد</Label>
                <input
                  type="datetime-local"
                  value={form.startsAt}
                  onChange={event =>
                    setForm(prev => ({ ...prev, startsAt: event.target.value }))
                  }
                  className={inputClass}
                  dir="ltr"
                />
              </div>
              <div>
                <Label className="mb-1 block">المدة (دقيقة)</Label>
                <input
                  type="number"
                  min={15}
                  max={240}
                  value={form.duration}
                  onChange={event =>
                    setForm(prev => ({
                      ...prev,
                      duration: Number(event.target.value),
                    }))
                  }
                  className={inputClass}
                  dir="ltr"
                />
              </div>
            </div>
            <div>
              <Label className="mb-1 block">رابط الجلسة</Label>
              <input
                value={form.meetingUrl}
                onChange={event =>
                  setForm(prev => ({ ...prev, meetingUrl: event.target.value }))
                }
                className={inputClass}
                dir="ltr"
                placeholder="https://zoom.us/j/…"
              />
            </div>
            <div>
              <Label className="mb-1 block">أجندة الجلسة</Label>
              <Textarea
                rows={2}
                value={form.agenda}
                onChange={event =>
                  setForm(prev => ({ ...prev, agenda: event.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              إلغاء
            </Button>
            <Button
              disabled={
                create.isPending ||
                !form.courseId ||
                form.title.trim().length < 2 ||
                !form.startsAt
              }
              className="bg-iris text-white hover:bg-iris-deep"
              onClick={() =>
                create.mutate({
                  courseId: Number(form.courseId),
                  title: form.title.trim(),
                  agenda: form.agenda.trim() || null,
                  startsAt: new Date(form.startsAt).toISOString(),
                  durationMinutes: form.duration,
                  meetingUrl: form.meetingUrl.trim() || null,
                })
              }
            >
              {create.isPending ? "جارٍ الحفظ…" : "جدولة"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export { TASK_LABELS };

function StudentPasswordDialog({
  student,
  open,
  onOpenChange,
}: {
  student: { id: number; name: string; email: string };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [customPassword, setCustomPassword] = useState("");
  const [copied, setCopied] = useState(false);
  const [issued, setIssued] = useState<{
    name: string;
    email: string;
    phone: string;
    newPassword: string;
  } | null>(null);

  const resetMutation = trpc.community.adminResetStudentPassword.useMutation({
    onSuccess: data => {
      setIssued({
        name: data.name,
        email: data.email,
        phone: data.phone,
        newPassword: data.newPassword,
      });
      toast.success("تم تعيين كلمة المرور الجديدة بنجاح 🔑");
    },
    onError: err => toast.error(err.message),
  });

  const buildShareText = (info: {
    name: string;
    email: string;
    newPassword: string;
  }) =>
    `أهلاً ${info.name} 👋\nبيانات الدخول الجديدة لحسابك على منصة Link Me:\n📧 الإيميل: ${info.email}\n🔑 كلمة المرور: ${info.newPassword}\n🌐 رابط الدخول: https://link-me.tech/login`;

  const handleCopy = async () => {
    if (!issued) return;
    try {
      await navigator.clipboard.writeText(buildShareText(issued));
      setCopied(true);
      toast.success("تم نسخ بيانات الدخول للحافظة 📋");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("تعذّر النسخ التلقائي");
    }
  };

  const whatsappHref = issued
    ? (() => {
        const cleanDigits = issued.phone.replace(/[^\d]/g, "");
        const intlPhone = cleanDigits
          ? cleanDigits.startsWith("0")
            ? `2${cleanDigits}`
            : cleanDigits
          : "";
        return `https://wa.me/${intlPhone}?text=${encodeURIComponent(
          buildShareText(issued)
        )}`;
      })()
    : "#";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-w-md bg-card text-ink">
        <DialogHeader className="text-start">
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="size-5 text-amber-500" />
            بيانات الدخول وكلمة السر — {student.name}
          </DialogTitle>
          <DialogDescription>
            لو الطالب نسي كلمة المرور بتاعته، تقدر تولّد له كلمة سر جديدة فورية
            أو تحدد كلمة سر بنفسك وتبعتها له في ثانية على واتساب.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-xl border border-line bg-paper-deep/60 p-3 text-xs">
            <p className="text-ink-soft">إيميل حساب الطالب:</p>
            <p className="latin mt-0.5 font-bold text-ink" dir="ltr">
              {student.email || "لا يوجد إيميل مسجل"}
            </p>
          </div>

          {!issued ? (
            <>
              <div>
                <Label className="mb-1.5 block text-xs">
                  كلمة مرور مخصصة (اختياري — اتركه فارغاً للتوليد التلقائي)
                </Label>
                <input
                  value={customPassword}
                  onChange={e => setCustomPassword(e.target.value)}
                  placeholder="مثال: ahmed2026 (6 أحرف على الأقل)"
                  className={inputClass}
                  dir="ltr"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  disabled={
                    resetMutation.isPending ||
                    (customPassword.trim().length > 0 &&
                      customPassword.trim().length < 6)
                  }
                  onClick={() =>
                    resetMutation.mutate({
                      studentId: student.id,
                      customPassword: customPassword.trim() || undefined,
                    })
                  }
                  className="w-full rounded-full bg-iris text-white hover:bg-iris-deep"
                >
                  <RefreshCw
                    className={cn(
                      "me-2 size-4",
                      resetMutation.isPending && "animate-spin"
                    )}
                  />
                  {customPassword.trim()
                    ? "حفظ كلمة المرور المخصصة"
                    : "توليد كلمة مرور جديدة فورية 🔑"}
                </Button>
                <p className="text-center text-[11px] text-ink-soft">
                  لأمان حسابات الطلبة، كلمات السر مشفرة بالكامل — التوليد الجديد
                  بيشتغل فوراً ويلغي الجلسات القديمة.
                </p>
              </div>
            </>
          ) : (
            <div className="space-y-3 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4">
              <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                ✅ تم تفعيل كلمة المرور الجديدة بنجاح!
              </p>
              <div className="space-y-2 rounded-xl border border-line bg-card p-3 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-ink-soft">الإيميل:</span>
                  <span className="latin font-semibold text-ink" dir="ltr">
                    {issued.email}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-ink-soft">كلمة السر الجديدة:</span>
                  <span
                    className="latin rounded-md bg-amber-500/15 px-2 py-0.5 font-mono text-sm font-black text-amber-700 dark:text-amber-300"
                    dir="ltr"
                  >
                    {issued.newPassword}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCopy}
                  className="rounded-full"
                >
                  {copied ? (
                    <>
                      <Check className="me-1.5 size-3.5 text-emerald-600" /> تم النسخ
                    </>
                  ) : (
                    <>
                      <Copy className="me-1.5 size-3.5" /> نسخ البيانات
                    </>
                  )}
                </Button>
                <Button
                  asChild
                  className="rounded-full bg-[#16A34A] text-white hover:bg-[#15803D]"
                >
                  <a href={whatsappHref} target="_blank" rel="noreferrer">
                    <MessageCircle className="me-1.5 size-3.5" /> إرسال واتساب
                  </a>
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            إغلاق
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ParentReportDialog({
  student,
  open,
  onOpenChange,
}: {
  student: { id: number; name: string };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [copied, setCopied] = useState(false);
  const { data, isLoading } = trpc.community.adminParentReport.useQuery(
    { studentId: student.id },
    { enabled: open }
  );

  const reportText = data
    ? [
        `📋 *تقرير متابعة طالب — أكاديمية Link Me*`,
        `━━━━━━━━━━━━━━━━`,
        `👤 الاسم: ${data.name}`,
        `🎯 المستوى الحالي: ${data.englishLevel}`,
        `📚 الكورسات الملتحق بها: ${data.enrollmentsCount} كورس`,
        `✅ الدروس المكتملة: ${data.completedLessons} درس`,
        `🎥 نسبة الحضور: ${data.attendanceRate === null ? "لم تبدأ الجلسات بعد" : `${data.attendanceRate}% (${data.attendedSessions} من ${data.totalSessions} جلسة)`}`,
        `📝 الواجبات المسلّمة: ${data.reviewedTasks} (واجبات مفتوحة: ${data.openTasks})`,
        `🔥 شعلة الحماسة اليومية: ${data.streakDays} أيام متتالية (${data.weeklyXp} XP هذا الأسبوع)`,
        data.latestRatingStars
          ? `⭐ آخر تقييم من المدرّس: ${data.latestRatingStars}/5${data.latestRatingNote ? ` — "${data.latestRatingNote}"` : ""}`
          : null,
        `━━━━━━━━━━━━━━━━`,
        `شكراً لمتابعتكم المستمرة! معاً نحو إتقان اللغة الإنجليزية 🌟`,
        `https://www.link-me.tech`,
      ]
        .filter(Boolean)
        .join("\n")
    : "";

  const whatsappHref = data
    ? (() => {
        const cleanDigits = data.phone.replace(/[^\d]/g, "");
        const intl = cleanDigits
          ? cleanDigits.startsWith("0")
            ? `2${cleanDigits}`
            : cleanDigits
          : "";
        return `https://wa.me/${intl}?text=${encodeURIComponent(reportText)}`;
      })()
    : "#";

  const handleCopy = async () => {
    if (!reportText) return;
    try {
      await navigator.clipboard.writeText(reportText);
      setCopied(true);
      toast.success("تم نسخ تقرير ولي الأمر للحافظة 📋");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("تعذّر النسخ");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-w-lg bg-card text-ink">
        <DialogHeader className="text-start">
          <DialogTitle className="flex items-center gap-2">
            <FileText className="size-5 text-emerald-600" />
            تقرير متابعة ولي الأمر — {student.name}
          </DialogTitle>
          <DialogDescription>
            تقرير جاهز ومنسّق بمستوى الطالب وحضوره وواجباته وحماسته — انسخه أو
            ابعته لولي الأمر على واتساب في ثانية.
          </DialogDescription>
        </DialogHeader>

        {isLoading || !data ? (
          <div className="py-10 text-center text-sm text-ink-soft">
            جارٍ تجهيز تقرير المتابعة…
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl border border-line bg-paper-deep/60 p-3">
                <p className="latin text-lg font-black text-iris">
                  {data.englishLevel}
                </p>
                <p className="text-[11px] text-ink-soft">المستوى</p>
              </div>
              <div className="rounded-xl border border-line bg-paper-deep/60 p-3">
                <p className="latin text-lg font-black text-emerald-600">
                  {data.attendanceRate === null
                    ? "—"
                    : `${data.attendanceRate}%`}
                </p>
                <p className="text-[11px] text-ink-soft">الحضور</p>
              </div>
              <div className="rounded-xl border border-line bg-paper-deep/60 p-3">
                <p className="latin text-lg font-black text-amber-600">
                  🔥 {data.streakDays}
                </p>
                <p className="text-[11px] text-ink-soft">أيام حماسة</p>
              </div>
            </div>

            <pre className="max-h-60 overflow-y-auto whitespace-pre-wrap rounded-2xl border border-line bg-paper-deep/50 p-4 font-sans text-xs leading-relaxed text-ink">
              {reportText}
            </pre>

            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCopy}
                className="rounded-full"
              >
                {copied ? (
                  <>
                    <Check className="me-1.5 size-4 text-emerald-600" /> تم
                    النسخ
                  </>
                ) : (
                  <>
                    <Copy className="me-1.5 size-4" /> نسخ التقرير
                  </>
                )}
              </Button>
              <Button
                asChild
                className="rounded-full bg-[#16A34A] text-white hover:bg-[#15803D]"
              >
                <a href={whatsappHref} target="_blank" rel="noreferrer">
                  <MessageCircle className="me-1.5 size-4" /> إرسال لولي الأمر
                  واتساب
                </a>
              </Button>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            إغلاق
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
