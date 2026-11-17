import { useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  ExternalLink,
  FileText,
  Link2,
  Loader2,
  Mic,
  Plus,
  RotateCcw,
  Search,
  Send,
  UserRound,
  Volume2,
} from "lucide-react";
import { toast } from "sonner";
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
import { VoiceRecorder } from "@/components/voice-recorder";
import { useAuth } from "@/contexts/AuthContext";
import { trpc } from "@/lib/trpc";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { inputClass } from "@/pages/auth-layout";

const homework = trpc.homework;

type HomeworkStatus = "assigned" | "in_progress" | "submitted" | "reviewed";

export type HomeworkTask = {
  id: number;
  userId: number;
  title: string;
  instructions: string | null;
  dueAt: Date | string | null;
  status: HomeworkStatus;
  feedback: string | null;
  score: number | null;
  createdAt: Date | string;
  submissionText: string | null;
  submissionUrl: string | null;
  submissionAudioUrl?: string | null;
  submittedAt: Date | string | null;
  reviewedAt: Date | string | null;
  reviewedBy: number | null;
  submissionCount: number;
  studentName?: string | null;
  studentEmail?: string | null;
};

type StudentOption = {
  id: number;
  name: string | null;
  email: string | null;
};

const STATUS_LABELS: Record<HomeworkStatus, string> = {
  assigned: "مطلوب",
  in_progress: "مطلوب تعديل",
  submitted: "بانتظار التصحيح",
  reviewed: "تم التصحيح",
};

const STATUS_STYLES: Record<HomeworkStatus, string> = {
  assigned: "bg-iris-soft text-iris",
  in_progress: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  submitted: "bg-indigo-500/12 text-indigo-600 dark:text-indigo-300",
  reviewed: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
};

function asDate(value: Date | string | null | undefined) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isLate(task: HomeworkTask) {
  const due = asDate(task.dueAt);
  if (!due) return false;
  const submitted =
    task.status === "submitted" || task.status === "reviewed"
      ? asDate(task.submittedAt)
      : null;
  return submitted
    ? submitted.getTime() > due.getTime()
    : Date.now() > due.getTime();
}

function toDateTimeLocal(value: Date | string | null) {
  const date = asDate(value);
  if (!date) return "";
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function safeHttpsUrl(value: string | null | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

function errorText(error: unknown) {
  return error && typeof error === "object" && "message" in error
    ? String((error as { message: unknown }).message)
    : "حصلت مشكلة. جرّب تاني.";
}

function useInvalidateHomework() {
  const utils = trpc.useUtils();
  return async () => {
    await Promise.all([
      utils.homework.mine.invalidate(),
      utils.homework.list.invalidate(),
      utils.admin.overview.invalidate(),
      utils.admin.student.invalidate(),
      utils.admin.myClassroom.invalidate(),
    ]);
  };
}

function StatusBadge({ task }: { task: HomeworkTask }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold",
        STATUS_STYLES[task.status]
      )}
    >
      {task.status === "reviewed" ? (
        <CheckCircle2 className="size-3" />
      ) : task.status === "submitted" ? (
        <ClipboardCheck className="size-3" />
      ) : task.status === "in_progress" ? (
        <RotateCcw className="size-3" />
      ) : (
        <Clock3 className="size-3" />
      )}
      {task.status === "in_progress" && task.submissionCount === 0
        ? "جاري الحل"
        : STATUS_LABELS[task.status]}
    </span>
  );
}

function SubmissionContent({ task }: { task: HomeworkTask }) {
  const link = safeHttpsUrl(task.submissionUrl);
  if (!task.submissionText && !link && !task.submissionAudioUrl) return null;
  return (
    <div className="mt-4 rounded-xl border border-line/70 bg-paper-deep/45 p-3">
      <p className="mb-2 text-[11px] font-semibold text-ink-soft">الإجابة</p>
      {task.submissionText && (
        <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere] text-sm leading-relaxed text-ink">
          {task.submissionText}
        </p>
      )}
      {task.submissionAudioUrl && (
        <div className="mt-3 rounded-xl border border-line bg-paper p-3 space-y-1.5">
          <p className="text-[11px] font-semibold text-ink-soft flex items-center gap-1.5">
            <Volume2 className="size-3.5 text-iris" /> التسجيل الصوتي المرفق (Speaking):
          </p>
          <audio controls src={task.submissionAudioUrl} className="w-full h-10 rounded-lg" />
        </div>
      )}
      {link && (
        <a
          href={link}
          target="_blank"
          rel="noreferrer"
          dir="ltr"
          className="mt-2 inline-flex max-w-full items-center gap-1.5 break-all text-left text-xs font-semibold text-iris hover:underline"
        >
          <Link2 className="size-3.5 shrink-0" /> {link}
          <ExternalLink className="size-3 shrink-0" />
        </a>
      )}
    </div>
  );
}

export function HomeworkCard({
  task,
  mode,
  onChanged,
}: {
  task: HomeworkTask;
  mode: "student" | "admin";
  onChanged?: () => void;
}) {
  const [submitOpen, setSubmitOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const late = isLate(task);
  const canSubmit =
    mode === "student" &&
    (task.status === "assigned" || task.status === "in_progress");
  const canReview =
    mode === "admin" &&
    task.status === "submitted" &&
    Boolean(task.submissionText || safeHttpsUrl(task.submissionUrl));

  return (
    <article className="rounded-2xl border border-line bg-card p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="break-words [overflow-wrap:anywhere] text-base font-semibold text-ink">
              {task.title}
            </h3>
            <StatusBadge task={task} />
            {late && (
              <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-1 text-[11px] font-semibold text-destructive">
                <AlertCircle className="size-3" /> متأخر
              </span>
            )}
          </div>
          {mode === "admin" && (task.studentName || task.studentEmail) && (
            <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-ink-soft">
              <UserRound className="size-3.5" />
              {task.studentName ?? "طالب"}
              {task.studentEmail && (
                <span dir="ltr" className="latin break-all">
                  ({task.studentEmail})
                </span>
              )}
            </p>
          )}
          <p className="mt-2 whitespace-pre-wrap break-words [overflow-wrap:anywhere] text-sm leading-relaxed text-ink-soft">
            {task.instructions}
          </p>
        </div>
        <div className="shrink-0 text-start text-xs text-ink-soft sm:text-end">
          <p className="inline-flex items-center gap-1.5">
            <Clock3 className="size-3.5" />
            {task.dueAt ? formatDateTime(task.dueAt) : "من غير موعد نهائي"}
          </p>
          {task.score !== null && (
            <p className="mt-1 font-semibold text-iris">
              الدرجة: {task.score}/100
            </p>
          )}
        </div>
      </div>

      <SubmissionContent task={task} />
      {task.feedback && (
        <div className="mt-3 rounded-xl border border-iris/20 bg-iris-soft/45 p-3 text-sm leading-relaxed text-ink">
          <span className="font-semibold text-iris">ملاحظة المدرّس: </span>
          {task.feedback}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line/70 pt-3">
        {canSubmit && (
          <Button
            onClick={() => setSubmitOpen(true)}
            className="rounded-full bg-iris text-white hover:bg-iris-deep"
          >
            <Send className="me-2 size-4" />{" "}
            {task.status === "in_progress" ? "إرسال تعديل" : "حلّ الواجب"}
          </Button>
        )}
        {canReview && (
          <Button
            onClick={() => setReviewOpen(true)}
            className="rounded-full bg-iris text-white hover:bg-iris-deep"
          >
            <ClipboardCheck className="me-2 size-4" /> تصحيح الواجب
          </Button>
        )}
        {mode === "admin" && task.status === "submitted" && !canReview && (
          <span className="text-xs text-ink-soft">
            لا يمكن التصحيح قبل وجود إجابة.
          </span>
        )}
        {task.submittedAt && (
          <span className="text-xs text-ink-soft">
            آخر تسليم: {formatDateTime(task.submittedAt)}
          </span>
        )}
        {task.submissionCount > 0 && (
          <span className="text-xs text-ink-soft">
            عدد المحاولات: {task.submissionCount}
          </span>
        )}
      </div>

      {canSubmit && (
        <SubmitHomeworkDialog
          task={task}
          open={submitOpen}
          onOpenChange={setSubmitOpen}
          onChanged={onChanged}
        />
      )}
      {canReview && (
        <ReviewHomeworkDialog
          task={task}
          open={reviewOpen}
          onOpenChange={setReviewOpen}
          onChanged={onChanged}
        />
      )}
    </article>
  );
}

function SubmitHomeworkDialog({
  task,
  open,
  onOpenChange,
  onChanged,
}: {
  task: HomeworkTask;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChanged?: () => void;
}) {
  const refresh = useInvalidateHomework();
  const [text, setText] = useState(task.submissionText ?? "");
  const [url, setUrl] = useState(task.submissionUrl ?? "");
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const submit = homework.submit.useMutation({
    onSuccess: async () => {
      await refresh();
      onChanged?.();
      toast.success("اتسلّم الواجب بنجاح");
      onOpenChange(false);
    },
  });
  const validUrl = url.trim() ? Boolean(safeHttpsUrl(url.trim())) : true;
  const hasAnswer = Boolean(text.trim() || url.trim() || audioBase64);
  const canSend =
    hasAnswer &&
    validUrl &&
    text.trim().length <= 20_000 &&
    url.trim().length <= 1_000;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] max-w-lg overflow-y-auto bg-card">
        <DialogHeader>
          <DialogTitle>حلّ: {task.title}</DialogTitle>
          <DialogDescription>
            اكتب إجابتك أو ابعت لينك آمن يبدأ بـ HTTPS. ينفع تبعت الاتنين.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label
              htmlFor={`homework-answer-${task.id}`}
              className="mb-1 block"
            >
              الإجابة المكتوبة
            </Label>
            <Textarea
              id={`homework-answer-${task.id}`}
              rows={6}
              maxLength={20_000}
              value={text}
              onChange={event => setText(event.target.value)}
              placeholder="اكتب إجابتك هنا…"
            />
            <p className="mt-1 text-[11px] text-ink-soft">
              {text.length.toLocaleString("ar-EG")} / ٢٠٬٠٠٠
            </p>
          </div>
          <div>
            <Label htmlFor={`homework-link-${task.id}`} className="mb-1 block">
              لينك الإجابة (اختياري)
            </Label>
            <input
              id={`homework-link-${task.id}`}
              dir="ltr"
              value={url}
              maxLength={1_000}
              onChange={event => setUrl(event.target.value)}
              className={cn(
                inputClass,
                "text-left",
                !validUrl && "border-destructive"
              )}
              placeholder="https://…"
            />
            {!validUrl && (
              <p className="mt-1 text-xs text-destructive">
                استخدم لينك HTTPS صحيح.
              </p>
            )}
          </div>

          <VoiceRecorder onAudioChange={setAudioBase64} />

          {submit.error && (
            <p className="rounded-lg bg-destructive/10 p-2.5 text-sm text-destructive">
              {errorText(submit.error)}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button
            disabled={submit.isPending || !canSend}
            className="bg-iris text-white hover:bg-iris-deep"
            onClick={() =>
              submit.mutate({
                taskId: task.id,
                submissionText: text.trim() || undefined,
                submissionUrl: url.trim() || undefined,
                submissionAudio: audioBase64 || undefined,
              })
            }
          >
            {submit.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" /> جارٍ الإرسال…
              </>
            ) : (
              "إرسال الإجابة"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ReviewHomeworkDialog({
  task,
  open,
  onOpenChange,
  onChanged,
}: {
  task: HomeworkTask;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChanged?: () => void;
}) {
  const refresh = useInvalidateHomework();
  const [score, setScore] = useState(
    task.score === null ? "" : String(task.score)
  );
  const [feedback, setFeedback] = useState(task.feedback ?? "");
  const review = homework.review.useMutation({
    onSuccess: async () => {
      await refresh();
      onChanged?.();
      toast.success("تم حفظ التصحيح");
      onOpenChange(false);
    },
  });
  const numericScore = score === "" ? null : Number(score);
  const scoreValid =
    numericScore === null ||
    (Number.isInteger(numericScore) &&
      numericScore >= 0 &&
      numericScore <= 100);
  const feedbackValid = feedback.trim().length <= 2_000;
  const canReview =
    scoreValid &&
    feedbackValid &&
    (numericScore !== null || feedback.trim().length >= 2);
  const canReturn = feedback.trim().length >= 2 && feedbackValid;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] max-w-lg overflow-y-auto bg-card">
        <DialogHeader>
          <DialogTitle>تصحيح: {task.title}</DialogTitle>
          <DialogDescription>
            راجع إجابة الطالب واختار تصحيح أو طلب تعديل.
          </DialogDescription>
        </DialogHeader>
        <SubmissionContent task={task} />
        <div className="space-y-4">
          <div>
            <Label htmlFor={`homework-score-${task.id}`} className="mb-1 block">
              الدرجة (من ١٠٠، اختيارية مع ملاحظة)
            </Label>
            <input
              id={`homework-score-${task.id}`}
              type="number"
              min={0}
              max={100}
              step={1}
              dir="ltr"
              value={score}
              onChange={event => setScore(event.target.value)}
              className={cn(
                inputClass,
                "text-left",
                !scoreValid && "border-destructive"
              )}
            />
          </div>
          <div>
            <Label
              htmlFor={`homework-feedback-${task.id}`}
              className="mb-1 block"
            >
              ملاحظتك
            </Label>
            <Textarea
              id={`homework-feedback-${task.id}`}
              rows={4}
              maxLength={2_000}
              value={feedback}
              onChange={event => setFeedback(event.target.value)}
              placeholder="قول للطالب إيه اللي ممتاز وإيه اللي محتاج يتظبط…"
            />
            <p className="mt-1 text-[11px] text-ink-soft">
              الحد الأدنى لطلب التعديل: حرفين.
            </p>
          </div>
          {review.error && (
            <p className="rounded-lg bg-destructive/10 p-2.5 text-sm text-destructive">
              {errorText(review.error)}
            </p>
          )}
        </div>
        <DialogFooter className="sm:justify-between">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <Button
              variant="outline"
              disabled={review.isPending || !canReturn}
              onClick={() =>
                review.mutate({
                  taskId: task.id,
                  action: "return",
                  feedback: feedback.trim(),
                })
              }
              className="border-amber-500/40 text-amber-700 hover:bg-amber-500/10 dark:text-amber-300"
            >
              <RotateCcw className="me-2 size-4" /> طلب تعديل
            </Button>
            <Button
              disabled={review.isPending || !canReview}
              onClick={() =>
                review.mutate({
                  taskId: task.id,
                  action: "review",
                  score: numericScore,
                  feedback: feedback.trim(),
                })
              }
              className="bg-iris text-white hover:bg-iris-deep"
            >
              {review.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> جارٍ الحفظ…
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-4" /> اعتماد التصحيح
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function CreateHomeworkDialog({
  open,
  onOpenChange,
  students,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  students: StudentOption[];
  onCreated?: () => void;
}) {
  const refresh = useInvalidateHomework();
  const [selected, setSelected] = useState<number[]>([]);
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [due, setDue] = useState("");
  const create = homework.create.useMutation({
    onSuccess: async () => {
      await refresh();
      onCreated?.();
      toast.success(`اترسل الواجب لـ ${selected.length} طالب`);
      onOpenChange(false);
      setSelected([]);
      setTitle("");
      setInstructions("");
      setDue("");
    },
  });
  const selectableStudents = students.slice(0, 200);
  const allSelected =
    selectableStudents.length > 0 &&
    selectableStudents.every(student => selected.includes(student.id));
  const canCreate =
    selected.length >= 1 &&
    selected.length <= 200 &&
    title.trim().length >= 2 &&
    title.trim().length <= 200 &&
    instructions.trim().length >= 2 &&
    instructions.trim().length <= 5_000;

  function toggleStudent(id: number) {
    setSelected(current =>
      current.includes(id)
        ? current.filter(item => item !== id)
        : current.length < 200
          ? [...current, id]
          : current
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] max-w-xl overflow-y-auto bg-card">
        <DialogHeader>
          <DialogTitle>واجب جديد</DialogTitle>
          <DialogDescription>
            اختار طالب أو أكتر، والواجب هيظهر في حساباتهم. المتابعة بتتحدث
            تلقائيًا أثناء فتح الصفحة.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <Label>الطلاب ({selected.length})</Label>
              <button
                type="button"
                onClick={() =>
                  setSelected(
                    allSelected
                      ? []
                      : selectableStudents.map(student => student.id)
                  )
                }
                className="text-xs font-semibold text-iris hover:underline"
              >
                {allSelected
                  ? "إلغاء الكل"
                  : students.length > 200
                    ? "اختيار أول ٢٠٠"
                    : "اختيار الكل"}
              </button>
            </div>
            {students.length > 200 && (
              <p className="mb-2 text-[11px] text-ink-soft">
                الاختيار الجماعي يقتصر على أول ٢٠٠ طالب، ويمكنك اختيار طلاب
                آخرين يدويًا حتى الحد نفسه.
              </p>
            )}
            <div className="max-h-44 space-y-1 overflow-y-auto rounded-xl border border-line p-2">
              {students.length === 0 ? (
                <p className="p-3 text-sm text-ink-soft">
                  مفيش طلاب متاحين للاختيار.
                </p>
              ) : (
                students.map(student => (
                  <label
                    key={student.id}
                    className="flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 hover:bg-paper-deep/60"
                  >
                    <input
                      type="checkbox"
                      checked={selected.includes(student.id)}
                      onChange={() => toggleStudent(student.id)}
                      className="size-4 accent-[var(--iris)]"
                    />
                    <span className="min-w-0 text-sm text-ink">
                      <span className="block truncate font-medium">
                        {student.name ?? "طالب من غير اسم"}
                      </span>
                      {student.email && (
                        <span
                          dir="ltr"
                          className="latin block truncate text-xs text-ink-soft"
                        >
                          {student.email}
                        </span>
                      )}
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>
          <div>
            <Label htmlFor="new-homework-title" className="mb-1 block">
              عنوان الواجب
            </Label>
            <input
              id="new-homework-title"
              value={title}
              onChange={event => setTitle(event.target.value)}
              maxLength={200}
              className={inputClass}
              placeholder="مثال: يومياتك بالإنجليزي"
            />
          </div>
          <div>
            <Label htmlFor="new-homework-instructions" className="mb-1 block">
              التعليمات
            </Label>
            <Textarea
              id="new-homework-instructions"
              rows={5}
              value={instructions}
              onChange={event => setInstructions(event.target.value)}
              maxLength={5_000}
              placeholder="اكتب المطلوب بالتفصيل وبطريقة بسيطة…"
            />
          </div>
          <div>
            <Label htmlFor="new-homework-due" className="mb-1 block">
              موعد التسليم (اختياري)
            </Label>
            <input
              id="new-homework-due"
              type="datetime-local"
              value={due}
              onChange={event => setDue(event.target.value)}
              className={inputClass}
              dir="ltr"
            />
          </div>
          {create.error && (
            <p className="rounded-lg bg-destructive/10 p-2.5 text-sm text-destructive">
              {errorText(create.error)}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button
            disabled={create.isPending || !canCreate}
            className="bg-iris text-white hover:bg-iris-deep"
            onClick={() =>
              create.mutate({
                studentIds: selected,
                title: title.trim(),
                instructions: instructions.trim(),
                dueAt: due ? new Date(due).toISOString() : null,
              })
            }
          >
            {create.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" /> جارٍ الإرسال…
              </>
            ) : (
              <>
                <Send className="size-4" /> إرسال الواجب
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AdminHomeworkPanel() {
  const { user } = useAuth();
  const [createOpen, setCreateOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | HomeworkStatus>(
    "all"
  );
  const list = homework.list.useQuery(undefined, {
    enabled: user?.role === "admin",
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });
  const overview = trpc.admin.overview.useQuery(undefined, {
    enabled: user?.role === "admin",
  });
  const rows = (list.data ?? []) as HomeworkTask[];
  const students = ((overview.data?.students ?? []) as StudentOption[]).filter(
    student => student.id
  );
  const filtered = useMemo(
    () =>
      rows.filter(task => {
        const haystack =
          `${task.title} ${task.studentName ?? ""} ${task.studentEmail ?? ""}`.toLocaleLowerCase();
        return (
          (statusFilter === "all" || task.status === statusFilter) &&
          (!query.trim() || haystack.includes(query.trim().toLocaleLowerCase()))
        );
      }),
    [rows, statusFilter, query]
  );
  const followUp = useMemo(() => {
    const map = new Map<
      number,
      {
        id: number;
        name: string;
        email: string;
        total: number;
        pending: number;
        submitted: number;
        reviewed: number;
        late: number;
      }
    >();
    for (const task of rows) {
      const row = map.get(task.userId) ?? {
        id: task.userId,
        name: task.studentName ?? `طالب #${task.userId}`,
        email: task.studentEmail ?? "",
        total: 0,
        pending: 0,
        submitted: 0,
        reviewed: 0,
        late: 0,
      };
      row.total += 1;
      if (task.status === "assigned" || task.status === "in_progress")
        row.pending += 1;
      if (task.status === "submitted") row.submitted += 1;
      if (task.status === "reviewed") row.reviewed += 1;
      if (isLate(task)) row.late += 1;
      map.set(task.userId, row);
    }
    return [...map.values()].sort(
      (a, b) => b.pending + b.late - (a.pending + a.late)
    );
  }, [rows]);
  const counts = useMemo(
    () => ({
      notSubmitted: rows.filter(
        task => task.status === "assigned" || task.status === "in_progress"
      ).length,
      submitted: rows.filter(task => task.status === "submitted").length,
      reviewed: rows.filter(task => task.status === "reviewed").length,
      late: rows.filter(isLate).length,
    }),
    [rows]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl text-ink">الواجبات والمتابعة</h2>
          <p className="mt-1 text-sm text-ink-soft">
            ابعت واجب جديد، وشوف مين سلّم ومين محتاج ملاحظتك.
          </p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="rounded-full bg-iris text-white hover:bg-iris-deep"
        >
          <Plus className="me-2 size-4" /> واجب جديد
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          [
            "لسه ما سلّمش",
            counts.notSubmitted,
            "text-amber-600 dark:text-amber-300",
          ],
          [
            "بانتظار التصحيح",
            counts.submitted,
            "text-indigo-600 dark:text-indigo-300",
          ],
          ["اتصحّح", counts.reviewed, "text-emerald-600 dark:text-emerald-300"],
          ["متأخر", counts.late, "text-destructive"],
        ].map(([label, value, color]) => (
          <div
            key={String(label)}
            className="rounded-2xl border border-line bg-card p-3.5"
          >
            <p className={cn("latin text-2xl font-bold", color)}>{value}</p>
            <p className="mt-1 text-xs text-ink-soft">{label}</p>
          </div>
        ))}
      </div>
      {followUp.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-line bg-card">
          <div className="flex items-center gap-2 border-b border-line px-4 py-3">
            <UserRound className="size-4 text-iris" />
            <p className="text-sm font-semibold text-ink">متابعة كل طالب</p>
            <span className="text-[11px] text-ink-soft">
              مرتبين حسب اللي عليهم واجبات لسه
            </span>
          </div>
          <div className="hidden grid-cols-[1.4fr_repeat(4,0.6fr)] gap-2 px-4 py-2 text-[11px] text-ink-soft sm:grid">
            <span>الطالب</span>
            <span className="text-center">مطلوب</span>
            <span className="text-center">بانتظار التصحيح</span>
            <span className="text-center">مصحّح</span>
            <span className="text-center">متأخر</span>
          </div>
          <ul className="divide-y divide-line">
            {followUp.map(row => (
              <li
                key={row.id}
                className="grid grid-cols-2 items-center gap-2 px-4 py-3 sm:grid-cols-[1.4fr_repeat(4,0.6fr)]"
              >
                <a
                  href={`/students/${row.id}`}
                  className="min-w-0 hover:text-iris"
                >
                  <span className="block truncate text-sm font-medium text-ink">
                    {row.name}
                  </span>
                  <span className="block truncate text-[11px] text-ink-soft">
                    {row.email}
                  </span>
                </a>
                {[row.pending, row.submitted, row.reviewed, row.late].map(
                  (value, index) => (
                    <span
                      key={index}
                      className={cn(
                        "latin text-center text-sm font-semibold",
                        index === 0 &&
                          value > 0 &&
                          "text-amber-600 dark:text-amber-300",
                        index === 1 &&
                          value > 0 &&
                          "text-indigo-600 dark:text-indigo-300",
                        index === 2 &&
                          value > 0 &&
                          "text-emerald-600 dark:text-emerald-300",
                        index === 3 && value > 0 && "text-destructive",
                        value === 0 && "text-ink-soft/60"
                      )}
                    >
                      {value}
                    </span>
                  )
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
          <input
            value={query}
            onChange={event => setQuery(event.target.value)}
            className={cn(inputClass, "ps-9")}
            placeholder="ابحث باسم الطالب أو عنوان الواجب"
          />
        </div>
        <select
          value={statusFilter}
          onChange={event =>
            setStatusFilter(event.target.value as "all" | HomeworkStatus)
          }
          className={cn(inputClass, "sm:w-48")}
        >
          <option value="all">كل الحالات</option>
          <option value="assigned">مطلوب</option>
          <option value="in_progress">مطلوب تعديل</option>
          <option value="submitted">بانتظار التصحيح</option>
          <option value="reviewed">تم التصحيح</option>
        </select>
      </div>
      {list.isLoading && (
        <div className="rounded-2xl border border-line bg-card p-8 text-center text-sm text-ink-soft">
          جارٍ تحميل الواجبات…
        </div>
      )}
      {list.error && (
        <div className="rounded-2xl border border-destructive/30 bg-card p-8 text-center">
          <p className="text-sm text-destructive">{errorText(list.error)}</p>
          <Button
            variant="outline"
            onClick={() => list.refetch()}
            className="mt-3 rounded-full"
          >
            حاول تاني
          </Button>
        </div>
      )}
      {!list.isLoading && !list.error && rows.length === 0 && (
        <div className="rounded-2xl border border-dashed border-line bg-card p-10 text-center">
          <FileText className="mx-auto size-8 text-ink-soft" />
          <p className="mt-3 font-semibold text-ink">لسه مفيش واجبات</p>
          <p className="mt-1 text-sm text-ink-soft">
            ابدأ بواجب جديد من الزرار اللي فوق.
          </p>
        </div>
      )}
      {!list.isLoading &&
        !list.error &&
        rows.length > 0 &&
        filtered.length === 0 && (
          <div className="rounded-2xl border border-line bg-card p-8 text-center text-sm text-ink-soft">
            مفيش واجبات مطابقة للفلاتر دي.
          </div>
        )}
      <div className="space-y-3">
        {filtered.map(task => (
          <HomeworkCard
            key={task.id}
            task={task}
            mode="admin"
            onChanged={() => void list.refetch()}
          />
        ))}
      </div>
      <CreateHomeworkDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        students={students}
        onCreated={() => void list.refetch()}
      />
    </div>
  );
}

export function StudentHomeworkList({
  tasks,
  onChanged,
}: {
  tasks: HomeworkTask[];
  onChanged?: () => void;
}) {
  if (tasks.length === 0)
    return (
      <div className="rounded-2xl border border-dashed border-line bg-card p-10 text-center">
        <FileText className="mx-auto size-8 text-ink-soft" />
        <p className="mt-3 font-semibold text-ink">مفيش واجبات لسه</p>
        <p className="mt-1 text-sm text-ink-soft">
          لما المدرّس يبعتلك واجب، هيظهر هنا.
        </p>
      </div>
    );
  return (
    <div className="space-y-3">
      {tasks.map(task => (
        <HomeworkCard
          key={task.id}
          task={task}
          mode="student"
          onChanged={onChanged}
        />
      ))}
    </div>
  );
}

export function homeworkIsLate(task: HomeworkTask) {
  return isLate(task);
}

export function homeworkDateTimeLocal(value: Date | string | null) {
  return toDateTimeLocal(value);
}
