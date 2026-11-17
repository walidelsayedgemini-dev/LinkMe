import { useMemo, useState } from "react";
import { ClipboardList, Filter, LogIn } from "lucide-react";
import { Link } from "wouter";
import { PageShell } from "@/components/layout/site-footer";
import { Eyebrow } from "@/components/bits";
import {
  StudentHomeworkList,
  type HomeworkTask,
  homeworkIsLate,
} from "@/components/homework";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { trpc } from "@/lib/trpc";

const homework = trpc.homework;
type FilterValue = "all" | "open" | "submitted" | "reviewed" | "late";

export default function HomeworkPage() {
  const { user, loading } = useAuth();
  const [filter, setFilter] = useState<FilterValue>("all");
  const mine = homework.mine.useQuery(undefined, {
    enabled: Boolean(user),
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });
  const tasks = (mine.data ?? []) as HomeworkTask[];
  const filtered = useMemo(
    () =>
      tasks.filter(task => {
        if (filter === "open")
          return task.status === "assigned" || task.status === "in_progress";
        if (filter === "submitted") return task.status === "submitted";
        if (filter === "reviewed") return task.status === "reviewed";
        if (filter === "late") return homeworkIsLate(task);
        return true;
      }),
    [tasks, filter]
  );

  if (loading)
    return (
      <PageShell>
        <div className="container py-20">
          <div className="h-40 animate-pulse rounded-3xl bg-ink/[0.06]" />
        </div>
      </PageShell>
    );
  if (!user)
    return (
      <PageShell>
        <div className="container py-24 text-center">
          <ClipboardList className="mx-auto size-10 text-iris" />
          <h1 className="mt-4 text-3xl text-ink">واجباتك مستنياك</h1>
          <p className="mt-2 text-sm text-ink-soft">
            سجّل الدخول عشان تشوف المطلوب منك وتسلّم إجاباتك.
          </p>
          <Button asChild className="mt-6 rounded-full bg-iris text-white">
            <Link href="/login?next=/homework">
              <LogIn className="me-2 size-4" /> تسجيل الدخول
            </Link>
          </Button>
        </div>
      </PageShell>
    );

  const openCount = tasks.filter(
    task => task.status === "assigned" || task.status === "in_progress"
  ).length;
  const submittedCount = tasks.filter(
    task => task.status === "submitted"
  ).length;
  const reviewedCount = tasks.filter(task => task.status === "reviewed").length;
  const lateCount = tasks.filter(homeworkIsLate).length;

  return (
    <PageShell>
      <section className="border-b border-line bg-paper-deep/60">
        <div className="container py-10 md:py-12">
          <Eyebrow>متابعتك</Eyebrow>
          <div className="mt-3 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <h1 className="text-3xl leading-tight text-ink sm:text-4xl">
                واجباتي <span className="hl-word">خطوتك الجاية.</span>
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-soft">
                كل المطلوب منك في مكان واحد. حلّ براحتك، ولو محتاج تعديل هتلاقي
                ملاحظة المدرّس هنا.
              </p>
            </div>
            <Button
              asChild
              variant="outline"
              className="rounded-full border-line"
            >
              <Link href="/dashboard">رجوع للوحة التعلّم</Link>
            </Button>
          </div>
          <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["مفتوح", openCount],
              ["بانتظار التصحيح", submittedCount],
              ["اتصحّح", reviewedCount],
              ["متأخر", lateCount],
            ].map(([label, value]) => (
              <div
                key={String(label)}
                className="rounded-2xl border border-line bg-card p-4"
              >
                <p className="latin text-2xl font-bold text-ink">{value}</p>
                <p className="mt-1 text-xs text-ink-soft">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="container py-8">
        <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl text-ink">قائمة الواجبات</h2>
            <p className="mt-1 text-xs text-ink-soft">
              {tasks.length} واجب إجمالًا
            </p>
          </div>
          <label className="flex items-center gap-2 text-sm text-ink-soft">
            <Filter className="size-4" />
            <span className="sr-only">فلترة الواجبات</span>
            <select
              value={filter}
              onChange={event => setFilter(event.target.value as FilterValue)}
              className="rounded-xl border border-line bg-card px-3 py-2 text-sm text-ink outline-none focus:border-iris"
            >
              <option value="all">كل الواجبات</option>
              <option value="open">المفتوحة</option>
              <option value="submitted">بانتظار التصحيح</option>
              <option value="reviewed">اللي اتصحّحت</option>
              <option value="late">المتأخرة</option>
            </select>
          </label>
        </div>
        {mine.isLoading ? (
          <div className="rounded-2xl border border-line bg-card p-8 text-center text-sm text-ink-soft">
            جارٍ تحميل واجباتك…
          </div>
        ) : mine.error ? (
          <div className="rounded-2xl border border-destructive/30 bg-card p-8 text-center text-sm text-destructive">
            حصلت مشكلة في تحميل الواجبات.
            <Button
              variant="outline"
              className="ms-3"
              onClick={() => void mine.refetch()}
            >
              جرّب تاني
            </Button>
          </div>
        ) : (
          <StudentHomeworkList
            tasks={filtered}
            onChanged={() => void mine.refetch()}
          />
        )}
      </section>
    </PageShell>
  );
}
