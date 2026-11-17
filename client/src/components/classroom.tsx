import { useState } from "react";
import { CheckCircle2, Clock, Star, XCircle } from "lucide-react";
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
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { inputClass } from "@/pages/auth-layout";

const homework = trpc.homework;

export const ATTENDANCE_LABELS: Record<string, string> = {
  present: "حاضر",
  late: "متأخر",
  absent: "غايب",
  excused: "معذور",
  pending: "معلّق",
};

export const TASK_LABELS: Record<string, string> = {
  assigned: "مُكلّف",
  in_progress: "جاري",
  submitted: "تم التسليم",
  reviewed: "تم التصحيح",
};

const ATTENDANCE_STYLES: Record<string, string> = {
  present: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400",
  late: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  absent: "bg-destructive/10 text-destructive",
  excused: "bg-ink/8 text-ink-soft",
  pending: "bg-ink/8 text-ink-soft",
};

const TASK_STYLES: Record<string, string> = {
  assigned: "bg-iris-soft text-iris",
  in_progress: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  submitted: "bg-indigo-500/12 text-indigo-600 dark:text-indigo-300",
  reviewed: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400",
};

export function LevelBadge({ level }: { level?: string | null }) {
  if (!level) return <span className="text-xs text-ink-soft">—</span>;
  return (
    <span className="latin inline-flex items-center rounded-full bg-ink/5 px-2 py-0.5 text-[11px] font-bold text-ink">
      {level}
    </span>
  );
}

export function AttendanceChip({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
        ATTENDANCE_STYLES[status]
      )}
    >
      {status === "present" ? (
        <CheckCircle2 className="size-3" />
      ) : status === "late" || status === "pending" ? (
        <Clock className="size-3" />
      ) : (
        <XCircle className="size-3" />
      )}
      {ATTENDANCE_LABELS[status] ?? status}
    </span>
  );
}

export function TaskStatusChip({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold",
        TASK_STYLES[status]
      )}
    >
      {TASK_LABELS[status] ?? status}
    </span>
  );
}

export function SessionStatusChip({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    scheduled: { label: "مجدولة", className: "bg-iris-soft text-iris" },
    live: {
      label: "شغّالة الآن",
      className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
    },
    done: { label: "خلصت", className: "bg-ink/8 text-ink-soft" },
    canceled: {
      label: "ملغاة",
      className: "bg-destructive/10 text-destructive",
    },
  };
  const item = map[status] ?? map.scheduled;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
        item.className
      )}
    >
      {status === "live" && (
        <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
      )}
      {item.label}
    </span>
  );
}

export function RatingStars({
  value,
  className,
}: {
  value: number | null | undefined;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)}>
      {[1, 2, 3, 4, 5].map(star => (
        <Star
          key={star}
          className={cn(
            "size-3.5",
            value && value >= star - 0.25
              ? "fill-amber-400 text-amber-400"
              : "fill-transparent text-ink/20"
          )}
        />
      ))}
      {value ? (
        <span className="latin ms-1 text-xs font-semibold text-ink">
          {value}
        </span>
      ) : (
        <span className="ms-1 text-xs text-ink-soft">—</span>
      )}
    </span>
  );
}

export function SkillBars({
  rating,
}: {
  rating?: {
    speaking: number | null;
    listening: number | null;
    grammar: number | null;
    vocabulary: number | null;
  } | null;
}) {
  const rows = [
    { label: "التحدث", value: rating?.speaking ?? 0 },
    { label: "الاستماع", value: rating?.listening ?? 0 },
    { label: "القواعد", value: rating?.grammar ?? 0 },
    { label: "المفردات", value: rating?.vocabulary ?? 0 },
  ];
  return (
    <div className="space-y-2.5">
      {rows.map(row => (
        <div key={row.label} className="flex items-center gap-3">
          <span className="w-16 shrink-0 text-xs text-ink-soft">
            {row.label}
          </span>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink/8">
            <div
              className="h-full rounded-full bg-iris transition-all duration-700"
              style={{ width: `${(row.value / 5) * 100}%` }}
            />
          </div>
          <span className="latin w-6 text-end text-xs font-semibold text-ink">
            {row.value}/5
          </span>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */

export function RateStudentDialog({
  userId,
  studentName,
  open,
  onOpenChange,
}: {
  userId: number;
  studentName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const utils = trpc.useUtils();
  const [stars, setStars] = useState(4);
  const [skills, setSkills] = useState({
    speaking: 3,
    listening: 3,
    grammar: 3,
    vocabulary: 3,
  });
  const [note, setNote] = useState("");

  const rate = trpc.admin.rateStudent.useMutation({
    onSuccess: async () => {
      toast.success("تم حفظ التقييم");
      await utils.admin.invalidate();
      onOpenChange(false);
      setNote("");
    },
    onError: error => toast.error(error.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>تقييم {studentName}</DialogTitle>
          <DialogDescription>
            التقييم يظهر للطالب في ملفه، ويساعدك تتابع تطوره.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="mb-2 block">التقييم العام</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setStars(star)}
                  aria-label={`${star} من 5`}
                >
                  <Star
                    className={cn(
                      "size-7 transition-transform hover:scale-110",
                      stars >= star
                        ? "fill-amber-400 text-amber-400"
                        : "text-ink/25"
                    )}
                  />
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {(
              [
                ["speaking", "التحدث"],
                ["listening", "الاستماع"],
                ["grammar", "القواعد"],
                ["vocabulary", "المفردات"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="block">
                <span className="mb-1 block text-xs text-ink-soft">
                  {label}
                </span>
                <select
                  value={skills[key]}
                  onChange={event =>
                    setSkills(prev => ({
                      ...prev,
                      [key]: Number(event.target.value),
                    }))
                  }
                  className={cn(inputClass, "h-10")}
                >
                  {[0, 1, 2, 3, 4, 5].map(value => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
          <div>
            <Label htmlFor="rate-note" className="mb-1 block">
              ملاحظة للطالب
            </Label>
            <Textarea
              id="rate-note"
              value={note}
              onChange={event => setNote(event.target.value)}
              rows={3}
              placeholder="مثال: تحسن واضح في الطلاقة، ركّز على نطق الـ th."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button
            disabled={rate.isPending}
            className="bg-iris text-white hover:bg-iris-deep"
            onClick={() =>
              rate.mutate({
                userId,
                stars,
                note: note.trim() || null,
                ...skills,
              })
            }
          >
            {rate.isPending ? "جارٍ الحفظ…" : "حفظ التقييم"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AssignTaskDialog({
  userId,
  studentName,
  open,
  onOpenChange,
}: {
  userId: number;
  studentName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const utils = trpc.useUtils();
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [due, setDue] = useState("");

  const assign = homework.create.useMutation({
    onSuccess: async () => {
      toast.success("تم إرسال الواجب للطالب");
      await Promise.all([
        utils.homework.list.invalidate(),
        utils.homework.mine.invalidate(),
        utils.admin.student.invalidate({ userId }),
        utils.admin.overview.invalidate(),
        utils.admin.myClassroom.invalidate(),
      ]);
      onOpenChange(false);
      setTitle("");
      setInstructions("");
      setDue("");
    },
    onError: (error: { message?: string }) =>
      toast.error(error.message ?? "حصلت مشكلة أثناء إرسال الواجب"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>واجب جديد لـ {studentName}</DialogTitle>
          <DialogDescription>
            الواجب يظهر للطالب في ملفه ولوحة التعلّم.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="task-title" className="mb-1 block">
              عنوان الواجب
            </Label>
            <input
              id="task-title"
              value={title}
              onChange={event => setTitle(event.target.value)}
              className={inputClass}
              placeholder="مثال: تسجيل صوتي دقيقتين عن شغلك"
            />
          </div>
          <div>
            <Label htmlFor="task-instructions" className="mb-1 block">
              التعليمات (مطلوبة)
            </Label>
            <Textarea
              id="task-instructions"
              rows={3}
              value={instructions}
              onChange={event => setInstructions(event.target.value)}
              placeholder="إيه المطلوب بالظبط؟"
            />
          </div>
          <div>
            <Label htmlFor="task-due" className="mb-1 block">
              موعد التسليم
            </Label>
            <input
              id="task-due"
              type="datetime-local"
              value={due}
              onChange={event => setDue(event.target.value)}
              className={inputClass}
              dir="ltr"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button
            disabled={
              assign.isPending ||
              title.trim().length < 2 ||
              instructions.trim().length < 2
            }
            className="bg-iris text-white hover:bg-iris-deep"
            onClick={() =>
              assign.mutate({
                studentIds: [userId],
                title: title.trim(),
                instructions: instructions.trim(),
                dueAt: due ? new Date(due).toISOString() : null,
              })
            }
          >
            {assign.isPending ? "جارٍ الإرسال…" : "إرسال الواجب"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
