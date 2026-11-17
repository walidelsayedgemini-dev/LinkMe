import { useState } from "react";
import { Link } from "wouter";
import {
  Check,
  CheckCircle2,
  Clock,
  CreditCard,
  ExternalLink,
  Eye,
  FileText,
  Filter,
  Loader2,
  Maximize2,
  MessageCircle,
  Phone,
  RefreshCw,
  Search,
  ShieldAlert,
  Smartphone,
  User,
  X,
  XCircle,
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
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { formatDateTime, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  PAYMENT_METHODS_CONFIG,
  RECEIPT_STATUS_LABELS,
  type PaymentMethodType,
  type ReceiptStatus,
} from "../../../../shared/payment-config";
import { egyptianWhatsAppNumber } from "../../../../shared/booking-catalog";

const REJECTION_PRESETS = [
  "المبلغ المحوّل غير مطابق للمبلغ المطلوب للكورس.",
  "رقم العملية المذكور غير موجود بكشف حساب المحفظة/إنستاباي.",
  "صورة الإيصال غير واضحة أو ناقصة تفاصيل التحويل.",
  "تم التحويل لرقم خاطئ، يرجى التأكد من الرقم الرسمي للمنصة.",
  "يرجى إرسال لقطة شاشة لرسالة التأكيد بدلاً من صورة مسودة التحويل.",
];

export function ReceiptsManager() {
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "approved" | "rejected"
  >("pending");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Reject dialog state
  const [rejectTargetId, setRejectTargetId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const utils = trpc.useUtils();

  const stats = trpc.receipts.adminStats.useQuery(undefined, {
    refetchInterval: 15_000,
  });

  const receipts = trpc.receipts.adminList.useQuery(
    { status: statusFilter },
    { refetchInterval: 15_000 }
  );

  const approve = trpc.receipts.adminApprove.useMutation({
    onSuccess: data => {
      toast.success(`تم تأكيد الإيصال وتفعيل "${data.targetTitle}" للطالب بنجاح!`);
      void utils.receipts.invalidate();
      void utils.admin.invalidate();
      void stats.refetch();
    },
    onError: err => {
      toast.error(err.message || "حدث خطأ أثناء التأكيد");
    },
  });

  const reject = trpc.receipts.adminReject.useMutation({
    onSuccess: () => {
      toast.success("تم تسجيل رفض الإيصال وإشعار الطالب بالسبب في الشات.");
      setRejectTargetId(null);
      setRejectionReason("");
      void utils.receipts.invalidate();
      void stats.refetch();
    },
    onError: err => {
      toast.error(err.message || "حدث خطأ أثناء الرفض");
    },
  });

  const handleApprove = (id: number, title: string) => {
    if (
      window.confirm(
        `هل تأكدت من وصول المبلغ في حسابك وتريد تفعيل وصول الطالب لـ "${title}" فوراً؟`
      )
    ) {
      approve.mutate({ receiptId: id });
    }
  };

  const handleOpenReject = (id: number) => {
    setRejectTargetId(id);
    setRejectionReason("");
  };

  const submitReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectTargetId || !rejectionReason.trim()) return;
    reject.mutate({
      receiptId: rejectTargetId,
      reason: rejectionReason.trim(),
    });
  };

  return (
    <div className="space-y-6">
      {/* Top summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-2xl border border-line bg-card p-4 sm:p-5">
          <div className="flex items-center justify-between text-xs text-ink-soft">
            <span>بانتظار المراجعة</span>
            <Clock className="size-4 text-amber-500" />
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
            {stats.data?.pendingCount ?? 0}
          </p>
          <p className="text-[11px] text-ink-soft mt-1">إيصالات تحتاج تأكيد</p>
        </div>

        <div className="rounded-2xl border border-line bg-card p-4 sm:p-5">
          <div className="flex items-center justify-between text-xs text-ink-soft">
            <span>تم التأكيد والتفعيل</span>
            <CheckCircle2 className="size-4 text-emerald-500" />
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
            {stats.data?.approvedCount ?? 0}
          </p>
          <p className="text-[11px] text-ink-soft mt-1">اشتراك مفعّل</p>
        </div>

        <div className="rounded-2xl border border-line bg-card p-4 sm:p-5">
          <div className="flex items-center justify-between text-xs text-ink-soft">
            <span>إجمالي التحصيلات</span>
            <CreditCard className="size-4 text-iris" />
          </div>
          <p className="mt-2 text-xl sm:text-2xl font-black text-iris">
            {formatPrice(stats.data?.totalApprovedCents ?? 0, "EGP", false)}
          </p>
          <p className="text-[11px] text-ink-soft mt-1">عبر كاش وإنستاباي</p>
        </div>

        <div className="rounded-2xl border border-line bg-card p-4 sm:p-5">
          <div className="flex items-center justify-between text-xs text-ink-soft">
            <span>إيصالات مرفوضة</span>
            <XCircle className="size-4 text-rose-500" />
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400">
            {stats.data?.rejectedCount ?? 0}
          </p>
          <p className="text-[11px] text-ink-soft mt-1">مبالغ أو إيصالات خاطئة</p>
        </div>
      </div>

      {/* Filter and controls bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-paper border border-line rounded-2xl">
          <button
            type="button"
            onClick={() => setStatusFilter("pending")}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all",
              statusFilter === "pending"
                ? "bg-amber-500 text-white shadow-sm"
                : "text-ink-soft hover:text-ink"
            )}
          >
            بانتظار المراجعة ({stats.data?.pendingCount ?? 0})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all",
              statusFilter === "all"
                ? "bg-iris text-white shadow-sm"
                : "text-ink-soft hover:text-ink"
            )}
          >
            الكل ({stats.data?.totalCount ?? 0})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("approved")}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all",
              statusFilter === "approved"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-ink-soft hover:text-ink"
            )}
          >
            المقبولة ({stats.data?.approvedCount ?? 0})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("rejected")}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all",
              statusFilter === "rejected"
                ? "bg-rose-600 text-white shadow-sm"
                : "text-ink-soft hover:text-ink"
            )}
          >
            المرفوضة ({stats.data?.rejectedCount ?? 0})
          </button>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            void receipts.refetch();
            void stats.refetch();
          }}
          className="rounded-full text-xs gap-1.5"
        >
          <RefreshCw
            className={cn("size-3.5", receipts.isFetching && "animate-spin")}
          />{" "}
          تحديث
        </Button>
      </div>

      {/* Receipts list */}
      <div className="space-y-4">
        {receipts.isLoading && (
          <div className="rounded-2xl border border-line bg-card p-12 text-center text-sm text-ink-soft">
            <Loader2 className="size-6 animate-spin mx-auto mb-2 text-iris" />
            جارٍ تحميل الإيصالات…
          </div>
        )}

        {!receipts.isLoading && (!receipts.data || receipts.data.length === 0) && (
          <div className="rounded-2xl border border-line bg-card p-12 text-center text-sm text-ink-soft space-y-2">
            <CheckCircle2 className="size-8 mx-auto text-emerald-500 opacity-60" />
            <p className="font-bold text-ink">مفيش إيصالات في هذا القسم حالياً</p>
            <p className="text-xs">
              {statusFilter === "pending"
                ? "عظيم! كل الإيصالات تمت مراجعتها ومفيش طلبات معلقة."
                : "لا توجد سجلات مطابقة للفلتر المختار."}
            </p>
          </div>
        )}

        {receipts.data?.map(item => {
          const methodConfig =
            PAYMENT_METHODS_CONFIG[item.method as PaymentMethodType] ??
            PAYMENT_METHODS_CONFIG.vodafone_cash;
          const statusConfig =
            RECEIPT_STATUS_LABELS[item.status as ReceiptStatus] ??
            RECEIPT_STATUS_LABELS.pending;

          const whatsAppNum = item.studentPhone
            ? egyptianWhatsAppNumber(item.studentPhone)
            : null;

          return (
            <article
              key={item.id}
              className={cn(
                "rounded-3xl border border-line bg-card p-5 sm:p-6 transition-all shadow-sm",
                item.status === "pending" && "border-amber-500/40 bg-card ring-1 ring-amber-500/20"
              )}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Left section: Student & Offer */}
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "text-[11px] font-bold px-2.5 py-0.5 rounded-full border",
                        statusConfig.badgeClass
                      )}
                    >
                      {statusConfig.labelAr}
                    </span>
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-paper border border-line text-ink flex items-center gap-1">
                      {item.method === "vodafone_cash" ? (
                        <>
                          <Smartphone className="size-3 text-red-500" /> فودافون كاش
                        </>
                      ) : (
                        <>
                          <CreditCard className="size-3 text-purple-500" /> إنستاباي
                        </>
                      )}
                    </span>
                    <span className="text-xs text-ink-soft">
                      {formatDateTime(item.createdAt)}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-baseline gap-2 pt-1">
                    <h3 className="text-base sm:text-lg font-bold text-ink">
                      {item.targetTitle}
                    </h3>
                    <span className="text-base font-black text-iris">
                      {formatPrice(item.amountCents, item.currency, false)}
                    </span>
                  </div>

                  {/* Student details */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-soft pt-1">
                    <span className="text-ink font-semibold flex items-center gap-1">
                      <User className="size-3.5 text-iris" />
                      {item.studentName ?? "طالب بدون اسم"}
                    </span>
                    <span>{item.studentEmail}</span>
                    {item.studentPhone && (
                      <span dir="ltr" className="font-mono">
                        {item.studentPhone}
                      </span>
                    )}
                    {item.userId && (
                      <Link
                        href={`/students/${item.userId}`}
                        className="text-iris hover:underline font-bold inline-flex items-center gap-0.5"
                      >
                        ملف الطالب <ExternalLink className="size-3" />
                      </Link>
                    )}
                  </div>

                  {/* Sender details */}
                  <div className="bg-paper p-3 rounded-2xl border border-line text-xs space-y-1 mt-2">
                    <p>
                      <strong className="text-ink">
                        {item.method === "vodafone_cash"
                          ? "رقم محفظة المحول:"
                          : "حساب إنستاباي المحول منه:"}
                      </strong>{" "}
                      <span dir="ltr" className="font-mono text-ink font-bold">
                        {item.senderPhoneOrHandle}
                      </span>
                    </p>
                    {item.transactionReference && (
                      <p>
                        <strong className="text-ink">رقم العملية / المرجع:</strong>{" "}
                        <span dir="ltr" className="font-mono text-ink">
                          {item.transactionReference}
                        </span>
                      </p>
                    )}
                    {item.note && (
                      <p className="text-ink-soft">
                        <strong className="text-ink">ملاحظة الطالب:</strong>{" "}
                        {item.note}
                      </p>
                    )}
                    {item.rejectionReason && (
                      <p className="text-rose-600 dark:text-rose-400 font-semibold pt-1">
                        <strong>سبب الرفض:</strong> {item.rejectionReason}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right section: Receipt Thumbnail & Actions */}
                <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end gap-3 shrink-0 pt-2 lg:pt-0">
                  {/* Image preview thumbnail */}
                  <div
                    onClick={() => setSelectedImage(item.receiptImageUrl)}
                    className="group relative cursor-pointer overflow-hidden rounded-2xl border border-line bg-paper size-24 shrink-0 transition-all hover:ring-2 hover:ring-iris"
                    title="اضغط لتكبير الإيصال"
                  >
                    <img
                      src={item.receiptImageUrl}
                      alt="إيصال التحويل"
                      className="size-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                      <Maximize2 className="size-5" />
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-col gap-2 w-full sm:w-auto">
                    {item.status === "pending" && (
                      <>
                        <Button
                          type="button"
                          disabled={approve.isPending || reject.isPending}
                          onClick={() => handleApprove(item.id, item.targetTitle)}
                          className="h-10 px-5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 shadow-sm"
                        >
                          <Check className="size-4" /> تأكيد وتفعيل فوري
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          disabled={approve.isPending || reject.isPending}
                          onClick={() => handleOpenReject(item.id)}
                          className="h-10 px-5 rounded-full text-xs text-rose-600 border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/30 gap-1.5"
                        >
                          <X className="size-4" /> رفض الإيصال
                        </Button>
                      </>
                    )}

                    {whatsAppNum && (
                      <a
                        href={`https://wa.me/${whatsAppNum}?text=${encodeURIComponent(
                          `أهلاً ${item.studentName ?? ""}، معاك Link Me بخصوص إيصال تحويل ${item.targetTitle}.`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 text-xs text-iris hover:underline py-1"
                      >
                        <MessageCircle className="size-3.5" /> محادثة واتساب
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* Lightbox Modal for Receipt Image */}
      <Dialog
        open={Boolean(selectedImage)}
        onOpenChange={val => {
          if (!val) setSelectedImage(null);
        }}
      >
        <DialogContent className="max-w-3xl p-3 bg-black/95 border-none text-white overflow-hidden rounded-3xl">
          <div className="relative flex flex-col items-center justify-center min-h-[50vh]">
            <button
              type="button"
              onClick={() => setSelectedImage(null)}
              className="absolute top-2 end-2 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
              aria-label="إغلاق"
            >
              <X className="size-5" />
            </button>
            {selectedImage && (
              <img
                src={selectedImage}
                alt="صورة الإيصال بحجم كامل"
                className="max-h-[82vh] w-auto max-w-full rounded-2xl object-contain"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Rejection Reason Dialog */}
      <Dialog
        open={Boolean(rejectTargetId)}
        onOpenChange={val => {
          if (!val) setRejectTargetId(null);
        }}
      >
        <DialogContent
          dir="rtl"
          className="rounded-3xl border-line bg-card text-ink max-w-md p-6"
        >
          <DialogHeader className="text-start">
            <div className="size-10 rounded-full bg-rose-500/10 text-rose-500 grid place-items-center mb-1">
              <ShieldAlert className="size-5" />
            </div>
            <DialogTitle className="text-lg font-bold text-ink">
              رفض إيصال التحويل
            </DialogTitle>
            <DialogDescription className="text-xs text-ink-soft">
              سيتم إرسال هذا السبب للطالب في شات المنصة مباشرة لمساعدته على تصحيح
              التحويل وإعادة المحاولة.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={submitReject} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-ink-soft mb-1.5">
                اختر سبب شائع بضغطة زر:
              </label>
              <div className="flex flex-col gap-1.5">
                {REJECTION_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setRejectionReason(preset)}
                    className="text-start p-2 rounded-xl text-xs bg-paper hover:bg-paper-deep border border-line text-ink transition-colors leading-relaxed"
                  >
                    • {preset}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                نص سبب الرفض:
              </label>
              <Textarea
                required
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                placeholder="اكتب سبب الرفض بوضوح..."
                className="min-h-[80px] rounded-xl text-xs leading-relaxed"
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setRejectTargetId(null)}
                className="rounded-full text-xs"
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                disabled={reject.isPending || !rejectionReason.trim()}
                className="rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
              >
                {reject.isPending ? (
                  <Loader2 className="size-4 animate-spin me-1.5" />
                ) : (
                  <X className="size-4 me-1.5" />
                )}
                تأكيد الرفض وإشعار الطالب
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
