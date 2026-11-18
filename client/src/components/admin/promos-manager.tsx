import { useState } from "react";
import { Copy, Plus, Power, Tag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { inputClass } from "@/pages/auth-layout";

export function PromosManager() {
  const utils = trpc.useUtils();
  const { data: promos = [], isLoading } =
    trpc.community.adminListPromos.useQuery();

  const [code, setCode] = useState("");
  const [discountPercent, setDiscountPercent] = useState(20);
  const [label, setLabel] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  const create = trpc.community.adminCreatePromo.useMutation({
    onSuccess: async () => {
      toast.success("تم إنشاء كود الخصم وتفعيله فوراً 🎟️");
      setCode("");
      setLabel("");
      setMaxUses("");
      setExpiresAt("");
      setDiscountPercent(20);
      await utils.community.adminListPromos.invalidate();
    },
    onError: err => toast.error(err.message),
  });

  const toggle = trpc.community.adminTogglePromo.useMutation({
    onSuccess: async () => {
      await utils.community.adminListPromos.invalidate();
      toast.success("تم تحديث حالة الكود");
    },
    onError: err => toast.error(err.message),
  });

  const remove = trpc.community.adminDeletePromo.useMutation({
    onSuccess: async () => {
      await utils.community.adminListPromos.invalidate();
      toast.success("تم حذف الكود");
    },
    onError: err => toast.error(err.message),
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
      {/* Create Promo Form */}
      <div className="rounded-2xl border border-line bg-card p-5">
        <h2 className="flex items-center gap-2 text-base font-bold text-ink">
          <Tag className="size-5 text-amber-500" /> إنشاء كود خصم جديد
        </h2>
        <p className="mt-1 text-xs text-ink-soft">
          يشتغل فوراً في صفحة الدفع (فودافون كاش وإنستاباي) مع متابعة عدد
          المستخدمين.
        </p>

        <div className="mt-4 space-y-3.5">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label className="mb-1 block text-xs">كود الخصم (إنجليزي)</Label>
              <input
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                placeholder="مثال: RAMADAN30"
                dir="ltr"
                className={cn(inputClass, "latin font-mono font-bold uppercase")}
              />
            </div>
            <div>
              <Label className="mb-1 block text-xs">نسبة الخصم (%)</Label>
              <input
                type="number"
                min={5}
                max={95}
                value={discountPercent}
                onChange={e => setDiscountPercent(Number(e.target.value))}
                dir="ltr"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <Label className="mb-1 block text-xs">وصف العرض للطالب</Label>
            <input
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="مثال: خصم 30% بمناسبة بداية الموسم"
              className={inputClass}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label className="mb-1 block text-xs">
                الحد الأقصى للاستخدام (اختياري)
              </Label>
              <input
                type="number"
                min={1}
                value={maxUses}
                onChange={e => setMaxUses(e.target.value)}
                placeholder="مفتوح"
                dir="ltr"
                className={inputClass}
              />
            </div>
            <div>
              <Label className="mb-1 block text-xs">
                تاريخ الانتهاء (اختياري)
              </Label>
              <input
                type="date"
                value={expiresAt}
                onChange={e => setExpiresAt(e.target.value)}
                dir="ltr"
                className={inputClass}
              />
            </div>
          </div>

          <Button
            type="button"
            disabled={
              create.isPending || code.trim().length < 3 || label.trim().length < 2
            }
            onClick={() =>
              create.mutate({
                code: code.trim(),
                discountPercent,
                label: label.trim(),
                maxUses: maxUses ? Number(maxUses) : null,
                expiresAt: expiresAt ? new Date(`${expiresAt}T23:59:59Z`).toISOString() : null,
              })
            }
            className="w-full rounded-full bg-iris font-bold text-white hover:bg-iris-deep"
          >
            <Plus className="me-1.5 size-4" />
            {create.isPending ? "جارٍ الإنشاء…" : "تفعيل كود الخصم"}
          </Button>
        </div>
      </div>

      {/* Promo Codes List */}
      <div className="space-y-3 rounded-2xl border border-line bg-card p-5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-ink">
            أكوادك المخصصة ({promos.length})
          </h3>
          <span className="text-[11px] text-ink-soft">
            الأكواد الأساسية (LINKME10 / YASSIN20) شغالة أيضاً
          </span>
        </div>

        {isLoading ? (
          <p className="py-6 text-center text-xs text-ink-soft">جارٍ التحميل…</p>
        ) : promos.length === 0 ? (
          <p className="rounded-xl bg-paper-deep/50 py-8 text-center text-xs text-ink-soft">
            مفيش أكواد خصم مخصصة لسه — اعمل أول كود من النموذج على اليمين!
          </p>
        ) : (
          <div className="space-y-2.5">
            {promos.map(p => (
              <div
                key={p.id}
                className={cn(
                  "flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3.5",
                  p.isActive
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : "border-line bg-paper-deep/40 opacity-65"
                )}
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="latin rounded-lg bg-card px-2.5 py-0.5 font-mono text-sm font-black text-iris border border-line"
                      dir="ltr"
                    >
                      {p.code}
                    </span>
                    <span className="latin rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-bold text-amber-700 dark:text-amber-300">
                      -{p.discountPercent}%
                    </span>
                    <span className="text-[11px] font-semibold text-ink-soft">
                      استُخدم {p.usedCount}
                      {p.maxUses ? ` / ${p.maxUses}` : ""} مرة
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-ink">{p.label}</p>
                  {p.expiresAt && (
                    <p className="mt-0.5 text-[10px] text-ink-soft">
                      ينتهي في: {formatDate(p.expiresAt)}
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      void navigator.clipboard.writeText(p.code);
                      toast.success(`تم نسخ الكود ${p.code}`);
                    }}
                    title="نسخ الكود"
                    className="grid size-8 place-items-center rounded-full border border-line bg-card text-ink-soft hover:border-iris hover:text-iris"
                  >
                    <Copy className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      toggle.mutate({ id: p.id, isActive: !p.isActive })
                    }
                    title={p.isActive ? "إيقاف مؤقت" : "إعادة تفعيل"}
                    className={cn(
                      "grid size-8 place-items-center rounded-full border bg-card",
                      p.isActive
                        ? "border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10"
                        : "border-line text-ink-soft hover:border-iris hover:text-iris"
                    )}
                  >
                    <Power className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove.mutate({ id: p.id })}
                    title="حذف الكود"
                    className="grid size-8 place-items-center rounded-full border border-line bg-card text-ink-soft hover:border-destructive hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
