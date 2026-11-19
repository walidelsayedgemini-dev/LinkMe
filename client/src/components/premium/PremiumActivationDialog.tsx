import { useEffect, useMemo, useState } from "react";
import { BadgeCheck, Calculator, Calendar, CheckCircle2, Crown, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import {
  ASSESSMENT_LEVELS,
  LEVEL_NAMES,
  type AssessmentLevel,
} from "@shared/assessment";
import {
  PREMIUM_DURATIONS,
  PREMIUM_PRICE_CENTS,
  type PremiumDuration,
} from "@shared/premium";
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
import { trpc } from "@/lib/trpc";
import { formatPrice } from "@/lib/format";
import { inputClass } from "@/pages/auth-layout";
import { cn } from "@/lib/utils";

export type PremiumActivationDialogProps = {
  userId: number;
  studentName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChanged?: () => void;
};

export function PremiumActivationDialog({
  userId,
  studentName,
  open,
  onOpenChange,
  onChanged,
}: PremiumActivationDialogProps) {
  const utils = trpc.useUtils();
  const [levels, setLevels] = useState<AssessmentLevel[]>(["A1"]);
  const [durationDays, setDurationDays] = useState<PremiumDuration>(30);
  const [paymentReference, setPaymentReference] = useState("");
  const [coachUserId, setCoachUserId] = useState("");
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const staff = trpc.premium.staff.useQuery(undefined, { enabled: open });
  const activate = trpc.premium.activate.useMutation({
    onSuccess: async () => {
      toast.success("تم تفعيل خطة الإتقان بعد تسجيل تأكيد الدفع");
      onOpenChange(false);
      try {
        await Promise.all([
          utils.premium.members.invalidate(),
          utils.premium.student.invalidate({ userId }),
          utils.premium.coachStudents.invalidate(),
        ]);
      } catch {
        toast.error(
          "تم التفعيل، لكن تحديث البيانات اتأخر. جرّب إعادة فتح الصفحة."
        );
      }
      onChanged?.();
    },
    onError: error => toast.error(error.message),
  });
  useEffect(() => {
    if (!open) return;
    setLevels(["A1"]);
    setDurationDays(30);
    setPaymentReference("");
    setCoachUserId("");
    setPaymentConfirmed(false);
  }, [open]);
  const totalCents = useMemo(
    () => PREMIUM_PRICE_CENTS * levels.length,
    [levels.length]
  );
  const coachCandidates = staff.data ?? [];
  const toggleLevel = (level: AssessmentLevel) =>
    setLevels(previous =>
      previous.includes(level)
        ? previous.filter(item => item !== level)
        : [...previous, level].sort(
            (a, b) =>
              ASSESSMENT_LEVELS.indexOf(a) - ASSESSMENT_LEVELS.indexOf(b)
          )
    );
  const submit = () => {
    if (!levels.length) return toast.error("اختار مستوى واحد على الأقل");
    if (!paymentConfirmed)
      return toast.error("لازم تأكّد إن الدفع اتراجع يدويًا قبل التفعيل");
    activate.mutate({
      userId,
      levels,
      durationDays,
      paymentConfirmed: true,
      paymentReference: paymentReference.trim(),
      coachUserId: coachUserId ? Number(coachUserId) : null,
    });
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="premium-dialog max-w-xl">
        <DialogHeader>
          <DialogTitle>تفعيل خطة الإتقان لـ {studentName}</DialogTitle>
          <DialogDescription>
            التفعيل يدوي فقط بعد ما المالك يراجع الدفع. الحساب يفضل طالبًا،
            والمدرب يتعيّن على العضوية دي فقط.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5">
          <div>
            <Label className="mb-2 block">المستويات المشمولة</Label>
            <div className="premium-level-picker">
              {ASSESSMENT_LEVELS.map(level => {
                const selected = levels.includes(level);
                return (
                  <label
                    key={level}
                    className={`premium-level-choice ${selected ? "premium-level-choice-selected" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggleLevel(level)}
                    />
                    <span className="latin">{level}</span>
                    <small>{LEVEL_NAMES[level]}</small>
                  </label>
                );
              })}
            </div>
          </div>
          <div>
            <Label className="mb-2.5 block text-sm font-bold text-ink">
              مدة العضوية (اختر شهري أو سنوي)
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PREMIUM_DURATIONS.map(duration => {
                const isSelected = durationDays === duration;
                const isYearly = duration === 365;
                return (
                  <button
                    key={duration}
                    type="button"
                    onClick={() => setDurationDays(duration)}
                    className={cn(
                      "relative flex items-center justify-between rounded-2xl border-2 p-3.5 text-start transition-all cursor-pointer",
                      isSelected
                        ? "border-iris bg-iris/15 text-white shadow-md shadow-iris/10 ring-2 ring-iris/40 dark:bg-iris/20"
                        : "border-line bg-card/60 text-ink-soft hover:border-iris/40 hover:bg-card"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {/* Active Radio Pill */}
                      <div
                        className={cn(
                          "flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                          isSelected
                            ? "border-iris bg-iris text-white"
                            : "border-line bg-transparent"
                        )}
                      >
                        {isSelected && <span className="size-2 rounded-full bg-white" />}
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5">
                          {isYearly ? (
                            <Crown className={cn("size-4 shrink-0", isSelected ? "text-amber-400" : "text-ink-soft")} />
                          ) : (
                            <Calendar className={cn("size-4 shrink-0", isSelected ? "text-iris" : "text-ink-soft")} />
                          )}
                          <span className="font-extrabold text-sm text-ink">
                            {isYearly ? "365 يوم (سنة كاملة)" : "30 يوم (شهري)"}
                          </span>
                          {isYearly && (
                            <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-extrabold text-amber-600 dark:text-amber-300 border border-amber-500/30">
                              خطة السنة 👑
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-[11px] text-ink-soft">
                          {isYearly
                            ? "سنة كاملة من التدريب والوصول غير المحدود"
                            : "عضوية قياسية تتجدد شهرياً (30 يوم)"}
                        </p>
                      </div>
                    </div>

                    {isSelected && (
                      <CheckCircle2 className="size-5 shrink-0 text-iris" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="premium-price-summary">
            <Calculator className="size-5" />
            <div>
              <span>السعر المحسوب</span>
              <strong className="latin">
                {formatPrice(totalCents, "EGP")}
              </strong>
              <small>
                {levels.length} مستوى ×{" "}
                {formatPrice(PREMIUM_PRICE_CENTS, "EGP")}
              </small>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5 text-sm">
              <span className="font-medium text-ink">مرجع الدفع</span>
              <input
                required
                className={inputClass}
                dir="ltr"
                value={paymentReference}
                onChange={event => setPaymentReference(event.target.value)}
                placeholder="إيصال / تحويل…"
              />
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="font-medium text-ink">مرشد مسجّل (اختياري)</span>
              <select
                className={cn(inputClass, "dark:bg-[#0b1736] dark:text-white")}
                value={coachUserId}
                disabled={staff.isLoading || staff.isError}
                onChange={event => setCoachUserId(event.target.value)}
              >
                <option value="" className="bg-white text-slate-900 dark:bg-[#0b1736] dark:text-white">من غير تعيين دلوقتي</option>
                {coachCandidates.map(coach => (
                  <option key={coach.id} value={coach.id} className="bg-white text-slate-900 dark:bg-[#0b1736] dark:text-white">
                    {coach.name ?? `حساب ${coach.id}`}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {staff.isLoading && (
            <p className="text-xs text-ink-soft">جارٍ تحميل قائمة المرشدين…</p>
          )}
          {staff.isError && (
            <div className="flex items-center justify-between gap-3 text-xs text-ink-soft">
              <span>مش قادرين نحمّل قائمة المرشدين دلوقتي.</span>
              <Button
                type="button"
                variant="outline"
                onClick={() => void staff.refetch()}
              >
                إعادة المحاولة
              </Button>
            </div>
          )}
          {!staff.isLoading &&
            !staff.isError &&
            coachCandidates.length === 0 && (
              <p className="text-xs text-ink-soft">
                مفيش حساب مرشد مسجّل ظاهر في قائمة الإدارة حاليًا؛ التعيين يفضل
                اختياريًا.
              </p>
            )}
          <label className="premium-confirm-row">
            <input
              type="checkbox"
              checked={paymentConfirmed}
              onChange={event => setPaymentConfirmed(event.target.checked)}
            />
            <span>
              <ShieldCheck className="size-4" />
              <strong>أنا المالك وأكدت الدفع يدويًا</strong>
              <small>لن يتم إنشاء تفعيل أو تحصيل تلقائي من هنا.</small>
            </span>
          </label>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            إلغاء
          </Button>
          <Button
            type="button"
            className="bg-iris text-white hover:bg-iris-deep"
            disabled={
              activate.isPending ||
              !paymentConfirmed ||
              !paymentReference.trim() ||
              !levels.length
            }
            onClick={submit}
          >
            <BadgeCheck className="me-2 size-4" />
            {activate.isPending ? "جارٍ التفعيل…" : "تفعيل بعد التأكيد"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
