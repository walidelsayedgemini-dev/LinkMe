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
      <DialogContent className="premium-dialog max-w-xl dark:bg-[#0b1120]/95 dark:backdrop-blur-xl dark:border-white/10 dark:shadow-[0_0_50px_rgba(2,132,199,0.2)]">
        <DialogHeader>
          <DialogTitle>تفعيل خطة الإتقان لـ {studentName}</DialogTitle>
          <DialogDescription>
            التفعيل يدوي فقط بعد ما المالك يراجع الدفع. الحساب يفضل طالبًا،
            والمدرب يتعيّن على العضوية دي فقط.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5">
          <div>
            <Label className="mb-2 block text-xs font-bold text-ink">
              المستويات المشمولة (اضغط لاختيار مستوى أو أكثر)
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {ASSESSMENT_LEVELS.map(level => {
                const selected = levels.includes(level);
                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => toggleLevel(level)}
                    className={cn(
                      "flex items-center justify-between rounded-xl border p-3 text-start transition-all cursor-pointer",
                      selected
                        ? "border-sky-400 bg-sky-500/15 text-white shadow-[0_0_15px_-3px_rgba(56,189,248,0.25)] ring-1 ring-sky-400/40 dark:bg-sky-500/20"
                        : "border-line bg-card/60 text-ink-soft hover:border-sky-400/30 hover:bg-card dark:border-white/10 dark:bg-white/5"
                    )}
                  >
                    <div>
                      <span className={cn("block text-sm font-black font-mono", selected ? "text-sky-400" : "text-ink")}>
                        {level}
                      </span>
                      <span className="block text-xs font-semibold text-ink-soft">
                        {LEVEL_NAMES[level]}
                      </span>
                    </div>
                    <div
                      className={cn(
                        "flex size-5 shrink-0 items-center justify-center rounded-md border transition-all",
                        selected
                          ? "border-sky-400 bg-sky-400 text-slate-950 font-bold"
                          : "border-line dark:border-white/20 bg-transparent"
                      )}
                    >
                      {selected && <CheckCircle2 className="size-4 text-slate-950 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <Label className="mb-2.5 block text-xs font-bold text-ink">
              مدة العضوية (اختر بين العضوية الشهرية أو السنوية)
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
                        ? "border-sky-400 bg-sky-500/15 text-white shadow-[0_0_20px_-3px_rgba(56,189,248,0.25)] ring-2 ring-sky-400/40 dark:bg-sky-500/20"
                        : "border-line bg-card/60 text-ink-soft hover:border-sky-400/30 hover:bg-card dark:border-white/10 dark:bg-white/5"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {/* Active Radio Indicator */}
                      <div
                        className={cn(
                          "flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                          isSelected
                            ? "border-sky-400 bg-sky-400 text-slate-950"
                            : "border-line dark:border-white/20 bg-transparent"
                        )}
                      >
                        {isSelected && <span className="size-2 rounded-full bg-slate-950" />}
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5">
                          {isYearly ? (
                            <Crown className={cn("size-4 shrink-0", isSelected ? "text-amber-400" : "text-amber-400/70")} />
                          ) : (
                            <Calendar className={cn("size-4 shrink-0", isSelected ? "text-sky-400" : "text-ink-soft")} />
                          )}
                          <span className="font-extrabold text-sm text-ink">
                            {isYearly ? "عضوية سنوية (365 يوم)" : "عضوية شهرية (30 يوم)"}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[11px] text-ink-soft">
                          {isYearly
                            ? "اشتراك سنة كاملة — أفضل قيمة وأعلى التزام"
                            : "تجديد شهري قياسي لمتابعة التقدم"}
                        </p>
                      </div>
                    </div>

                    {isYearly ? (
                      <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-extrabold text-amber-500 dark:text-amber-300 border border-amber-500/30">
                        وفر 20% 👑
                      </span>
                    ) : (
                      isSelected && (
                        <CheckCircle2 className="size-5 shrink-0 text-sky-400" />
                      )
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
                className={cn(inputClass, "dark:bg-[#0b1120] dark:text-white dark:border-white/10 dark:[color-scheme:dark]")}
                style={{ colorScheme: "dark" }}
                value={coachUserId}
                disabled={staff.isLoading || staff.isError}
                onChange={event => setCoachUserId(event.target.value)}
              >
                <option value="" className="bg-white text-slate-900 dark:bg-[#0b1120] dark:text-white">من غير تعيين دلوقتي</option>
                {coachCandidates.map(coach => (
                  <option key={coach.id} value={coach.id} className="bg-white text-slate-900 dark:bg-[#0b1120] dark:text-white font-medium py-1">
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
          <button
            type="button"
            onClick={() => setPaymentConfirmed(!paymentConfirmed)}
            className={cn(
              "flex w-full items-start gap-3 rounded-2xl border p-3.5 text-start transition-all cursor-pointer",
              paymentConfirmed
                ? "border-emerald-500/50 bg-emerald-500/10 text-white shadow-md shadow-emerald-500/10 ring-1 ring-emerald-500/30"
                : "border-line bg-card/60 text-ink-soft hover:border-emerald-500/30 dark:border-white/10 dark:bg-white/5"
            )}
          >
            <div
              className={cn(
                "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border transition-all",
                paymentConfirmed
                  ? "border-emerald-400 bg-emerald-400 text-slate-950 font-bold"
                  : "border-line dark:border-white/20 bg-transparent"
              )}
            >
              {paymentConfirmed && <CheckCircle2 className="size-4 text-slate-950 stroke-[3]" />}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-1.5 font-bold text-sm text-ink">
                <ShieldCheck className={cn("size-4 shrink-0", paymentConfirmed ? "text-emerald-400" : "text-ink-soft")} />
                <span>أنا المالك وأكدت استلام الدفع يدويًّا</span>
              </div>
              <p className="mt-0.5 text-xs text-ink-soft">
                لن يتم إنشاء تفعيل أو تحصيل تلقائي من هنا — هذا الإجراء يمنح الطالب الصلاحية بعد مراجعة التحويل.
              </p>
            </div>
          </button>
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
