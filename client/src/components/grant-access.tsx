import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";

/** Only rendered for an admin. Payment verification is manual, never simulated. */
export function GrantAccessDialog({
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
  const options = trpc.admin.accessOptions.useQuery(undefined, {
    enabled: open,
  });
  const [kind, setKind] = useState<"course" | "plan">("course");
  const [id, setId] = useState("");
  const [cycle, setCycle] = useState<"monthly" | "yearly">("monthly");
  const [confirmed, setConfirmed] = useState(false);
  const utils = trpc.useUtils();
  const grant = trpc.admin.grantAccess.useMutation({
    onSuccess: async result => {
      await utils.admin.invalidate();
      await utils.learning.invalidate();
      toast.success(
        result.alreadyActive
          ? "الوصول مفعّل بالفعل"
          : "تم تفعيل الوصول للطالب وتسجيل التأكيد"
      );
      onOpenChange(false);
      setConfirmed(false);
    },
    onError: e => toast.error(e.message),
  });
  const rows = kind === "course" ? options.data?.courses : options.data?.plans;
  const field =
    "h-12 w-full rounded-xl border border-line bg-paper px-3 text-sm text-ink";
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        dir="rtl"
        className="rounded-3xl border-line bg-card text-ink"
      >
        <DialogHeader className="text-start">
          <DialogTitle>
            تفعيل الوصول لـ <span className="hl-word">{studentName}</span>
          </DialogTitle>
          <DialogDescription className="text-ink-soft">
            راجع الدفع عبر فودافون كاش أو إنستاباي قبل التفعيل. الإجراء لا يسحب
            أي مبلغ تلقائياً.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={e => {
            e.preventDefault();
            if (!id || !confirmed) return;
            grant.mutate({
              userId,
              kind,
              itemId: Number(id),
              cycle,
              paymentVerified: true,
            });
          }}
        >
          <label className="block space-y-2 text-sm">
            <span>نوع الوصول</span>
            <select
              value={kind}
              onChange={e => {
                setKind(e.target.value as "course" | "plan");
                setId("");
                setConfirmed(false);
              }}
              className={field}
            >
              <option value="course">كورس محدد</option>
              <option value="plan">اشتراك</option>
            </select>
          </label>
          <label className="block space-y-2 text-sm">
            <span>{kind === "course" ? "الكورس" : "الخطة"}</span>
            <select
              required
              value={id}
              onChange={e => setId(e.target.value)}
              className={field}
            >
              <option value="">
                {options.isLoading ? "جارٍ التحميل…" : "اختار من القائمة"}
              </option>
              {rows?.map(row => (
                <option key={row.id} value={row.id}>
                  {row.title}
                </option>
              ))}
            </select>
          </label>
          {kind === "plan" && (
            <label className="block space-y-2 text-sm">
              <span>مدة الاشتراك</span>
              <select
                className={field}
                value={cycle}
                onChange={e => setCycle(e.target.value as "monthly" | "yearly")}
              >
                <option value="monthly">شهر</option>
                <option value="yearly">سنة</option>
              </select>
            </label>
          )}
          <label className="flex items-start gap-3 rounded-xl border border-line p-4 text-xs leading-relaxed text-ink-soft">
            <input
              required
              type="checkbox"
              checked={confirmed}
              onChange={e => setConfirmed(e.target.checked)}
              className="mt-1 size-4 shrink-0 accent-[var(--color-iris)]"
            />
            <span>
              راجعت الدفع والبيانات خارج الموقع، وموافق أفعّل الوصول للطالب ده.
              الحجز وحده مش إثبات دفع.
            </span>
          </label>
          {options.isError && (
            <p className="text-xs text-destructive">
              تعذر تحميل قائمة الكورسات والخطط. اقفل النافذة وجرّب تاني.
            </p>
          )}
          <Button
            disabled={!confirmed || !id || grant.isPending}
            type="submit"
            className="h-12 w-full rounded-full bg-iris text-white"
          >
            {grant.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <CheckCircle2 className="size-4" />
            )}{" "}
            تأكيد التفعيل
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
