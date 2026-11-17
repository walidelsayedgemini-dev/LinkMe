import { useState } from "react";
import { Send, ShieldCheck, Target } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { PageShell } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { trpc } from "@/lib/trpc";
import { formatDate } from "@/lib/format";
import { inputClass } from "./auth-layout";
import "@/premium.css";

export default function Coaching() {
  const { user, loading } = useAuth();
  const students = trpc.premium.coachStudents.useQuery(undefined, {
    enabled: Boolean(user),
  });
  const utils = trpc.useUtils();
  const feedback = trpc.premium.feedback.useMutation({
    onSuccess: async (_result, variables) => {
      setNotes(previous => {
        const current = previous[variables.userId] ?? "";
        if (current.trim() !== variables.note) return previous;
        const next = { ...previous };
        delete next[variables.userId];
        return next;
      });
      try {
        await utils.premium.coachStudents.invalidate();
        toast.success("اتحفظت الملاحظة للطالب");
      } catch {
        toast.error(
          "اتحفظت الملاحظة، لكن تحديث القائمة اتأخر. جرّب إعادة فتح الصفحة."
        );
      }
    },
    onError: error => toast.error(error.message),
  });
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [openStudent, setOpenStudent] = useState<number | null>(null);
  if (loading)
    return (
      <PageShell>
        <section className="container premium-state-page">
          <div className="premium-loading-block" />
        </section>
      </PageShell>
    );
  if (!user)
    return (
      <PageShell>
        <section className="container premium-state-page">
          <h1>سجّل الدخول لمساحة المرشد</h1>
          <p>الوصول هنا للحسابات المعيّنة على عضويات خطة الإتقان فقط.</p>
          <Button asChild className="mt-6 rounded-full bg-iris text-white">
            <Link href="/login?next=/coaching">تسجيل الدخول</Link>
          </Button>
        </section>
      </PageShell>
    );
  if (user.role !== "instructor" && user.role !== "admin")
    return (
      <PageShell>
        <section className="container premium-state-page">
          <h1>المساحة دي للحسابات المعيّنة فقط.</h1>
          <p>مش هنفتح قائمة طلاب عامة من هنا.</p>
          <Button asChild variant="outline" className="mt-6 rounded-full">
            <Link href="/dashboard">رجوع للوحة التعلّم</Link>
          </Button>
        </section>
      </PageShell>
    );
  return (
    <PageShell>
      <section className="premium-student-hero">
        <div className="container">
          <div className="premium-student-top">
            <div>
              <span className="premium-eyebrow">
                <ShieldCheck className="size-4" /> مساحة المرشد
              </span>
              <h1>طلابك المعيّنين فقط.</h1>
              <p>
                شوف أداء كل طالب واكتب ملاحظة يومية. التفعيل والدفع وإدارة
                العضويات للمالك فقط.
              </p>
            </div>
            <span className="premium-identity-badge">
              <Target className="size-4" /> وصول مقيّد بالتعيين
            </span>
          </div>
        </div>
      </section>
      <section className="container premium-student-section">
        <div className="premium-section-heading">
          <div>
            <p className="premium-kicker">قائمة المتابعة</p>
            <h2>طلاب خطة الإتقان</h2>
          </div>
          <span className="premium-chip">
            {students.data?.length ?? 0} طلاب
          </span>
        </div>
        {students.error && (
          <div className="premium-empty">
            مش قادرين نحمّل قائمة التعيينات دلوقتي.
          </div>
        )}
        {!students.isLoading &&
          !students.error &&
          (students.data ?? []).length === 0 && (
            <div className="premium-empty">
              مفيش طلاب متعيّنين لك حاليًا. القائمة دي مش بتعرض طلاب المنصة
              كلهم.
            </div>
          )}
        <div className="premium-coach-grid">
          {(students.data ?? []).map(student => {
            const snapshot = student.snapshot;
            const currentNote = notes[student.userId] ?? "";
            const isOpen = openStudent === student.userId;
            return (
              <article key={student.userId} className="premium-coach-card">
                <button
                  type="button"
                  className="premium-coach-card-header"
                  onClick={() => setOpenStudent(isOpen ? null : student.userId)}
                  aria-expanded={isOpen}
                >
                  <span className="premium-avatar">
                    {(student.name ?? "؟").slice(0, 1)}
                  </span>
                  <span className="min-w-0 flex-1 text-start">
                    <strong>{student.name ?? `طالب #${student.userId}`}</strong>
                    <small>حساب معيّن على عضوية Premium</small>
                  </span>
                  <span className="latin">
                    {snapshot.currentLevel ?? "—"} · {snapshot.dayNumber}/
                    {snapshot.totalDays}
                  </span>
                </button>
                <div className="premium-coach-stats">
                  <span>
                    اليوم:{" "}
                    <b>
                      {snapshot.today?.completed
                        ? `${snapshot.today.score ?? "—"}/${snapshot.today.total}`
                        : "لم يُسلّم"}
                    </b>
                  </span>
                  <span>
                    نقط العمل: <b>{snapshot.weaknesses.length}</b>
                  </span>
                </div>
                {isOpen && (
                  <div className="premium-coach-detail">
                    <div className="premium-note-list">
                      {snapshot.coachNotes.slice(0, 3).map(note => (
                        <article key={String(note.id)}>
                          <p>{note.note}</p>
                          <small>{formatDate(note.createdAt)}</small>
                        </article>
                      ))}
                    </div>
                    <label className="block space-y-1.5 text-sm">
                      <span className="font-medium text-ink">ملاحظة يومية</span>
                      <textarea
                        className={`${inputClass} min-h-[100px] py-3`}
                        value={currentNote}
                        onChange={event =>
                          setNotes(previous => ({
                            ...previous,
                            [student.userId]: event.target.value,
                          }))
                        }
                        placeholder="مثال: ركّز النهارده على الفرق بين since و for…"
                      />
                    </label>
                    <Button
                      type="button"
                      className="rounded-full bg-iris text-white"
                      disabled={!currentNote.trim() || feedback.isPending}
                      onClick={() =>
                        feedback.mutate({
                          userId: student.userId,
                          note: currentNote.trim(),
                          dayIndex: snapshot.dayNumber,
                        })
                      }
                    >
                      <Send className="me-2 size-4" />
                      {feedback.isPending ? "جارٍ الحفظ…" : "حفظ الملاحظة"}
                    </Button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>
    </PageShell>
  );
}
