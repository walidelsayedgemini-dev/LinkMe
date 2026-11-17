import { Link } from "wouter";
import { CheckCircle2, Clock, CreditCard, Receipt, Smartphone, XCircle } from "lucide-react";
import { PageShell } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { trpc } from "@/lib/trpc";
import { formatDate, formatDateTime, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { paidTotalsByCurrency } from "../../../shared/billing";
import { RECEIPT_STATUS_LABELS, type ReceiptStatus } from "../../../shared/payment-config";

const STATUS: Record<string, { label: string; className: string }> = {
  paid: { label: "مدفوع", className: "bg-acid text-ink" },
  pending: { label: "قيد المعالجة", className: "bg-paper-deep text-ink" },
  failed: { label: "فشل", className: "bg-coral-soft text-coral" },
  refunded: { label: "مسترجع", className: "bg-iris-soft text-iris" },
};

export default function Orders() {
  const { user, loading } = useAuth();
  const query = trpc.billing.orders.useQuery(undefined, {
    enabled: Boolean(user),
  });
  const receiptsQuery = trpc.receipts.myReceipts.useQuery(undefined, {
    enabled: Boolean(user),
  });
  if (loading)
    return (
      <PageShell>
        <div className="container py-24 text-center text-ink-soft">
          بنراجع حسابك…
        </div>
      </PageShell>
    );
  if (!user)
    return (
      <PageShell>
        <div className="container py-24 text-center">
          <h1 className="text-3xl text-ink">سجّل الدخول لعرض مشترياتك</h1>
          <Button asChild className="mt-6 rounded-full bg-iris text-white">
            <Link href="/login?next=%2Forders">تسجيل الدخول</Link>
          </Button>
        </div>
      </PageShell>
    );
  const orders = query.data ?? [];
  const totals = paidTotalsByCurrency(orders);
  return (
    <PageShell>
      <section className="border-b border-line bg-paper-deep/60">
        <div className="container py-10">
          <p className="latin text-xs uppercase tracking-[0.2em] text-ink-soft">
            Billing history
          </p>
          <h1 className="mt-2 text-3xl text-ink sm:text-4xl">
            سجل <span className="hl-word">مشترياتك.</span>
          </h1>
          <p className="mt-2 text-sm text-ink-soft">
            كورساتك وخططك وإيصالات التفعيل، في مكان واحد.
          </p>
        </div>
      </section>
      <section className="container py-10">
        {query.isError ? (
          <div
            className="rounded-3xl border border-line bg-card p-8 text-center"
            role="alert"
          >
            <p className="text-ink">مش قادرين نحمّل سجل المشتريات دلوقتي.</p>
            <Button
              variant="outline"
              className="mt-4 rounded-full"
              onClick={() => void query.refetch()}
            >
              جرّب تاني
            </Button>
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-line bg-card p-5">
                <p className="text-xs text-ink-soft">عدد العمليات</p>
                <p className="latin mt-2 text-2xl font-bold text-ink">
                  {query.isLoading ? "—" : orders.length}
                </p>
              </div>
              <div className="rounded-2xl border border-line bg-card p-5">
                <p className="text-xs text-ink-soft">
                  إجمالي المدفوع — كل عملة لوحدها
                </p>
                <div className="latin mt-2 space-y-1 text-xl font-bold text-ink">
                  {query.isLoading
                    ? "—"
                    : totals.length
                      ? totals.map(total => (
                          <p key={total.currency}>
                            {formatPrice(
                              total.amountCents,
                              total.currency,
                              false
                            )}
                          </p>
                        ))
                      : formatPrice(0, "EGP", false)}
                </div>
              </div>
              <div className="rounded-2xl border border-line bg-card p-5">
                <p className="text-xs text-ink-soft">آخر عملية</p>
                <p className="mt-2 text-sm font-semibold text-ink">
                  {query.isLoading
                    ? "—"
                    : orders[0]
                      ? formatDate(orders[0].createdAt)
                      : "—"}
                </p>
              </div>
            </div>
            <div className="mt-8 overflow-hidden rounded-3xl border border-line bg-card">
              {query.isLoading ? (
                <div className="space-y-3 p-5">
                  {[0, 1, 2].map(index => (
                    <div
                      key={index}
                      className="h-12 animate-pulse rounded-xl bg-ink/[0.06]"
                    />
                  ))}
                </div>
              ) : !orders.length ? (
                <div className="p-10 text-center">
                  <Receipt className="mx-auto size-8 text-ink-soft" />
                  <p className="mt-4 font-semibold text-ink">
                    لسه مفيش مشتريات
                  </p>
                  <p className="mt-1 text-sm text-ink-soft">
                    بعد تأكيد الدفع والتفعيل من المالك، الإيصال هيظهر هنا.
                  </p>
                  <Button
                    asChild
                    className="mt-6 rounded-full bg-iris text-white"
                  >
                    <Link href="/courses">تصفّح الكورسات</Link>
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[680px] text-sm">
                    <thead className="bg-paper text-xs text-ink-soft">
                      <tr>
                        {[
                          "الطلب",
                          "النوع",
                          "المبلغ",
                          "الحالة",
                          "التاريخ",
                          "المرجع",
                        ].map(label => (
                          <th
                            key={label}
                            className="px-5 py-3 text-start font-medium"
                          >
                            {label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {orders.map(order => (
                        <tr key={order.id} className="hover:bg-paper/50">
                          <td className="px-5 py-4">
                            {order.courseSlug ? (
                              <Link
                                href={`/courses/${order.courseSlug}`}
                                className="font-medium text-ink hover:text-iris"
                              >
                                {order.courseTitle}
                              </Link>
                            ) : (
                              <span className="font-medium text-ink">
                                اشتراك {order.planName ?? ""}
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-4 text-ink-soft">
                            {order.kind === "course" ? "كورس" : "اشتراك"}
                          </td>
                          <td className="latin px-5 py-4 font-semibold text-ink">
                            {formatPrice(
                              order.amountCents,
                              order.currency,
                              false
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={cn(
                                "rounded-full px-2.5 py-1 text-[11px] font-medium",
                                STATUS[order.status]?.className
                              )}
                            >
                              {STATUS[order.status]?.label ?? order.status}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-ink-soft">
                            {formatDate(order.createdAt)}
                          </td>
                          <td className="latin px-5 py-4 text-[11px] text-ink-soft">
                            {order.reference ?? "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Student's submitted payment receipts */}
            {receiptsQuery.data && receiptsQuery.data.length > 0 && (
              <div className="mt-10 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-ink">
                      إيصالات التحويل المرسلة (كاش / إنستاباي)
                    </h2>
                    <p className="text-xs text-ink-soft mt-0.5">
                      متابعة حالة الإيصالات التي قمت برفعها للتأكيد والتفعيل
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {receiptsQuery.data.map(receipt => {
                    const statusConfig =
                      RECEIPT_STATUS_LABELS[receipt.status as ReceiptStatus] ??
                      RECEIPT_STATUS_LABELS.pending;

                    return (
                      <div
                        key={receipt.id}
                        className={cn(
                          "rounded-2xl border border-line bg-card p-4 space-y-3 transition-all",
                          receipt.status === "pending" && "border-amber-500/30 bg-amber-500/5",
                          receipt.status === "approved" && "border-emerald-500/30",
                          receipt.status === "rejected" && "border-rose-500/30 bg-rose-500/5"
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={cn(
                              "text-[11px] font-bold px-2.5 py-0.5 rounded-full border",
                              statusConfig.badgeClass
                            )}
                          >
                            {statusConfig.labelAr}
                          </span>
                          <span className="text-xs text-ink-soft font-mono">
                            {formatDateTime(receipt.createdAt)}
                          </span>
                        </div>

                        <div>
                          <h4 className="text-sm font-bold text-ink">
                            {receipt.targetTitle}
                          </h4>
                          <p className="text-base font-black text-iris mt-0.5">
                            {formatPrice(receipt.amountCents, receipt.currency, false)}
                          </p>
                        </div>

                        <div className="text-xs text-ink-soft space-y-1 bg-paper/60 p-2.5 rounded-xl border border-line/60">
                          <p>
                            <strong className="text-ink">طريقة الدفع:</strong>{" "}
                            {receipt.method === "vodafone_cash" ? "فودافون كاش" : "إنستاباي (InstaPay)"}
                          </p>
                          <p>
                            <strong className="text-ink">المحول منه:</strong>{" "}
                            <span dir="ltr" className="font-mono">{receipt.senderPhoneOrHandle}</span>
                          </p>
                          {receipt.transactionReference && (
                            <p>
                              <strong className="text-ink">رقم العملية:</strong>{" "}
                              <span dir="ltr" className="font-mono">{receipt.transactionReference}</span>
                            </p>
                          )}
                          {receipt.rejectionReason && (
                            <p className="text-rose-600 dark:text-rose-400 font-semibold pt-1">
                              <strong>سبب الرفض:</strong> {receipt.rejectionReason}
                            </p>
                          )}
                        </div>

                        <p className="text-[11px] text-ink-soft">
                          {statusConfig.hintAr}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
        <p className="mt-4 text-xs leading-relaxed text-ink-soft">
          الدفع والتأكد من التحويل بيتموا خارج الموقع. المالك بيسجّل التفعيل بعد
          مراجعة الدفع؛ الإيصال الداخلي مش تأكيد بنكي تلقائي. العمليات القديمة
          بتفضل بعملتها الأصلية من غير تحويل أو تغيير في قيمتها.
        </p>
      </section>
    </PageShell>
  );
}
