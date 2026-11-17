import { Link } from "wouter";
import { MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { formatDate, formatPrice } from "@/lib/format";
import { egyptianWhatsAppNumber } from "../../../shared/booking-catalog";

const STATES = {
  new: "طلب جديد",
  contacted: "تم التواصل",
  confirmed: "تم تأكيد الحجز",
  canceled: "ملغى",
};
export function BookingRequests() {
  const leads = trpc.bookings.list.useQuery();
  const update = trpc.bookings.updateStatus.useMutation({
    onSuccess: () => leads.refetch(),
    onError: e => toast.error(e.message),
  });
  if (leads.isLoading)
    return <p className="p-6 text-sm text-ink-soft">جارٍ تحميل طلبات الحجز…</p>;
  if (leads.isError)
    return (
      <p className="p-6 text-sm text-destructive">
        تعذر تحميل الطلبات.{" "}
        <button onClick={() => void leads.refetch()}>جرّب تاني</button>
      </p>
    );
  return (
    <div>
      <p className="mb-4 text-xs leading-relaxed text-ink-soft">
        آخر 100 طلب. التواصل وتأكيد الدفع بيتموا خارج الموقع. غيّر حالة الطلب
        للمتابعة؛ التفعيل الفعلي من ملف الطالب عبر «تفعيل الوصول».
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        {!leads.data?.length && (
          <p className="rounded-2xl border border-line bg-card p-6 text-sm text-ink-soft">
            لسه مفيش طلبات حجز.
          </p>
        )}
        {leads.data?.map(lead => (
          <article
            key={lead.id}
            className="rounded-2xl border border-line bg-card p-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-base text-ink">{lead.name}</h3>
              <span className="text-[11px] text-ink-soft">
                {formatDate(lead.createdAt)}
              </span>
            </div>
            <p className="mt-3 text-sm font-semibold text-ink">
              {lead.courseTitle}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-ink-soft">
              {lead.packageTitle}
            </p>
            <p className="mt-3 text-sm font-semibold text-iris">
              {formatPrice(lead.priceCents, lead.currency)}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  const number = egyptianWhatsAppNumber(lead.phone);
                  if (!number) {
                    toast.error("رقم الطالب محتاج مراجعة قبل التواصل.");
                    return;
                  }
                  window.open(
                    `https://wa.me/${number}?text=${encodeURIComponent(`أهلًا ${lead.name}، معاك Link Me بخصوص حجز ${lead.courseTitle}.`)}`,
                    "_blank",
                    "noopener,noreferrer"
                  );
                }}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-iris"
              >
                <MessageCircle className="size-4" /> تواصل مع الطالب
              </button>
              <span dir="ltr" className="latin text-xs text-ink-soft">
                {lead.phone}
              </span>
              {lead.userId && (
                <Link
                  href={`/students/${lead.userId}`}
                  className="text-xs font-semibold text-iris"
                >
                  ملف الطالب
                </Link>
              )}
            </div>
            {lead.note && (
              <p className="mt-3 text-xs leading-relaxed text-ink-soft">
                {lead.note}
              </p>
            )}
            <label className="mt-4 flex items-center gap-3 text-xs text-ink-soft">
              <span>الحالة</span>
              <select
                aria-label={`حالة طلب ${lead.name}`}
                disabled={update.isPending}
                value={lead.status in STATES ? lead.status : "new"}
                onChange={e =>
                  update.mutate({
                    id: lead.id,
                    status: e.target.value as keyof typeof STATES,
                  })
                }
                className="h-10 flex-1 rounded-xl border border-line bg-paper px-3 text-ink"
              >
                {Object.entries(STATES).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </article>
        ))}
      </div>
    </div>
  );
}
