import { useState } from "react";
import { Check, Copy, KeyRound, RefreshCw, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { formatDateTime } from "@/lib/format";

/**
 * Owner access is a single secret code: no email link and no password.
 * A new code revokes the previous one immediately.
 */
export function OwnerSecurityPanel() {
  const utils = trpc.useUtils();
  const status = trpc.admin.ownerSecurity.useQuery();
  const [freshCode, setFreshCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const rotate = trpc.admin.rotateOwnerCode.useMutation({
    onSuccess: async data => {
      setFreshCode(data.code);
      setCopied(false);
      await utils.admin.ownerSecurity.invalidate();
      toast.success("اتولّد رمز جديد. الرمز القديم اتلغى.");
    },
    onError: error => toast.error(error.message),
  });

  const copy = async () => {
    if (!freshCode) return;
    try {
      await navigator.clipboard.writeText(freshCode);
      setCopied(true);
      toast.success("الرمز اتنسخ");
    } catch {
      toast.error("انسخ الرمز يدويًا");
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-line bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
              <ShieldCheck className="size-5 text-iris" /> أمان المالك
            </h2>
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-ink-soft">
              بتدخل لوحة التحكم برمز سري واحد بس — من غير إيميل ولا رابط ولا كلمة
              مرور. أي رمز جديد بيلغي اللي قبله فورًا.
            </p>
          </div>
          <Button
            onClick={() => rotate.mutate()}
            disabled={rotate.isPending}
            className="rounded-full bg-iris text-white hover:bg-iris-deep"
          >
            <RefreshCw
              className={`me-2 size-4 ${rotate.isPending ? "animate-spin" : ""}`}
            />
            {status.data?.active ? "ولّد رمزًا جديدًا" : "ولّد رمز المالك"}
          </Button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-line bg-paper p-4">
            <p className="text-xs text-ink-soft">حالة الرمز</p>
            <p className="mt-1 text-sm font-semibold text-ink">
              {status.data?.active ? "مفعّل" : "مفيش رمز فعّال"}
            </p>
          </div>
          <div className="rounded-xl border border-line bg-paper p-4">
            <p className="text-xs text-ink-soft">آخر استخدام</p>
            <p className="mt-1 text-sm font-semibold text-ink">
              {status.data?.lastUsedAt
                ? formatDateTime(status.data.lastUsedAt)
                : "لسه ما اتستخدمش"}
            </p>
          </div>
        </div>

        {freshCode && (
          <div className="mt-4 rounded-2xl border border-iris/40 bg-iris-soft/50 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-ink">
              <KeyRound className="size-4 text-iris" /> رمزك الجديد — يظهر مرة
              واحدة بس
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <code
                dir="ltr"
                className="latin select-all break-all rounded-xl border border-line bg-card px-3 py-2 text-base font-bold tracking-wider text-ink"
              >
                {freshCode}
              </code>
              <Button
                variant="outline"
                onClick={copy}
                className="rounded-full"
                size="sm"
              >
                {copied ? (
                  <Check className="me-1.5 size-4 text-emerald-600" />
                ) : (
                  <Copy className="me-1.5 size-4" />
                )}
                {copied ? "اتنسخ" : "انسخ"}
              </Button>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-ink-soft">
              احفظه في مكان آمن (مدير كلمات المرور مثلًا). من صفحة{" "}
              <span className="latin">/owner</span> اكتبه وادخل على طول.
            </p>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-line bg-paper p-5 text-sm leading-relaxed text-ink-soft">
        لو حسّيت إن الرمز اتكشف، اضغط <b className="text-ink">ولّد رمزًا جديدًا</b>{" "}
        فورًا — أي شخص معاه الرمز القديم هيتقفل عنه الدخول في نفس اللحظة.
      </div>
    </div>
  );
}
