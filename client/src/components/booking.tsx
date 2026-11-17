import { useEffect, useState } from "react";
import {
  CalendarCheck,
  CheckCircle2,
  CreditCard,
  Loader2,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { WhatsAppIcon } from "@/components/whatsapp";
import { PaymentReceiptDialog } from "@/components/payment-receipt-dialog";
import { trpc } from "@/lib/trpc";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { bookingMessage, whatsappLink } from "@/lib/whatsapp";
import { normalizeArabicNumerals } from "../../../shared/booking-catalog";

export type BookingPackage = {
  id: string;
  title: string;
  priceCents: number;
  currency?: string;
  hint?: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseTitle?: string;
  courseSlug?: string;
  planSlug?: string;
  cycle?: "monthly" | "yearly";
  packages: BookingPackage[];
  eyebrow?: string;
};

const PHONE = /^(\+?20|0)?1[0125]\d{8}$/;

/** Quick booking dialog: name + phone + package, then a ready WhatsApp message. */
export function BookingDialog({
  open,
  onOpenChange,
  courseTitle,
  courseSlug,
  planSlug,
  cycle,
  packages,
  eyebrow,
}: Props) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [packageId, setPackageId] = useState(packages[0]?.id ?? "");
  const [openReceiptModal, setOpenReceiptModal] = useState(false);
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<{
    name?: string;
    phone?: string;
    note?: string;
  }>({});

  useEffect(() => {
    if (open)
      setPackageId(current =>
        packages.some(item => item.id === current)
          ? current
          : (packages[0]?.id ?? "")
      );
  }, [open, packages]);

  const create = trpc.bookings.create.useMutation();

  const selected = packages.find(item => item.id === packageId) ?? packages[0];
  const priceLabel = selected
    ? formatPrice(selected.priceCents, selected.currency ?? "EGP", false)
    : "";

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selected) return;
    const nextErrors: { name?: string; phone?: string; note?: string } = {};
    const cleanName = name.trim();
    const cleanPhone = normalizeArabicNumerals(phone).replace(/[\s-]/g, "");
    const cleanNote = note.trim();
    if (cleanName.length < 2) nextErrors.name = "اكتب اسمك الكامل";
    if (cleanName.length > 120) nextErrors.name = "الاسم طويل جدًا";
    if (!PHONE.test(cleanPhone))
      nextErrors.phone = "رقم مصري صحيح مثل 01012345678";
    if (cleanNote.length > 500) nextErrors.note = "الملاحظة طويلة جدًا";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    // Open the tab synchronously so the browser does not block it, then point it
    // at WhatsApp once the lead is stored.
    const pending = window.open("", "_blank");
    const go = (message: string, closePending = false) => {
      const link = whatsappLink(message);
      if (pending && !pending.closed && !closePending) {
        pending.location.href = link;
        onOpenChange(false);
        return;
      }
      if (pending && !pending.closed) pending.close();
      if (!window.open(link, "_blank", "noopener,noreferrer")) {
        window.location.assign(link);
      }
      onOpenChange(false);
    };

    create.mutate(
      {
        name: cleanName,
        phone: cleanPhone,
        courseSlug,
        packageId: selected.id,
        planSlug,
        cycle,
        note: cleanNote || undefined,
      },
      {
        onSuccess: result => {
          const message = bookingMessage({
            name: cleanName,
            phone: cleanPhone,
            courseTitle: result.courseTitle,
            packageTitle: result.packageTitle,
            priceLabel: formatPrice(result.priceCents, result.currency, false),
            note: cleanNote || undefined,
          });
          toast.success("تم تجهيز الحجز — كمّل التأكيد على واتساب");
          go(message);
        },
        onError: error => {
          const fallbackMessage = [
            "السلام عليكم 👋",
            "تعذر تسجيل الحجز من الموقع، وعايز أكمل معاكم يدويًا.",
            `الاسم: ${cleanName}`,
            `رقمي: ${cleanPhone}`,
            "ممكن تساعدوني في تفاصيل الحجز؟",
          ].join("\n");
          toast.error(
            error.message ||
              "لم يتم تسجيل الحجز. يمكنك إكماله يدويًا على واتساب."
          );
          go(fallbackMessage, true);
        },
      }
    );
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto rounded-[1.6rem] border-line bg-card p-0 sm:max-w-[520px]">
        <div className="relative overflow-hidden bg-navy px-6 pb-6 pt-7 text-white">
          <div
            aria-hidden
            className="absolute -end-10 -top-14 size-40 rounded-full bg-iris/40 blur-2xl"
          />
          <DialogHeader className="relative text-start">
            <span className="mb-2 inline-flex w-fit items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] text-white/80">
              <CalendarCheck className="size-3" />{" "}
              {eyebrow ?? "حجز سريع — أقل من دقيقة"}
            </span>
            <DialogTitle className="text-xl text-white">
              احجز مقعدك في {courseTitle ?? "العرض المختار"}
            </DialogTitle>
            <DialogDescription className="text-sm text-white/70">
              اكتب اسمك ورقمك، وهنبعتلك رسالة واتساب جاهزة بتفاصيل الحجز والدفع.
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={submit} className="space-y-4 px-6 pb-6 pt-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-ink-soft">
                الاسم
              </span>
              <input
                id="booking-name"
                value={name}
                onChange={event => setName(event.target.value)}
                placeholder="اسمك الكامل"
                autoComplete="name"
                required
                maxLength={120}
                aria-invalid={Boolean(errors.name)}
                aria-describedby={
                  errors.name ? "booking-name-error" : undefined
                }
                className="h-11 w-full rounded-xl border border-line bg-paper px-3 text-sm text-ink outline-none transition focus:border-iris"
              />
              {errors.name && (
                <span
                  id="booking-name-error"
                  className="mt-1 block text-[11px] text-destructive"
                >
                  {errors.name}
                </span>
              )}
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-ink-soft">
                رقم الموبايل
              </span>
              <input
                id="booking-phone"
                value={phone}
                onChange={event => setPhone(event.target.value)}
                placeholder="01xxxxxxxxx"
                inputMode="tel"
                dir="ltr"
                autoComplete="tel"
                required
                maxLength={24}
                aria-invalid={Boolean(errors.phone)}
                aria-describedby={
                  errors.phone ? "booking-phone-error" : undefined
                }
                className="h-11 w-full rounded-xl border border-line bg-paper px-3 text-sm text-ink outline-none transition focus:border-iris"
              />
              {errors.phone && (
                <span
                  id="booking-phone-error"
                  className="mt-1 block text-[11px] text-destructive"
                >
                  {errors.phone}
                </span>
              )}
            </label>
          </div>

          <div>
            <span className="mb-1.5 block text-xs font-medium text-ink-soft">
              اختار الباقة
            </span>
            <div className="space-y-2">
              {packages.map(item => {
                const active = item.id === packageId;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setPackageId(item.id)}
                    aria-pressed={active}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 rounded-xl border px-3.5 py-3 text-start transition",
                      active
                        ? "border-iris bg-iris/10 shadow-[0_18px_40px_-34px_rgba(37,99,235,0.9)]"
                        : "border-line bg-paper hover:border-iris/40"
                    )}
                  >
                    <span className="flex items-center gap-2.5">
                      <span
                        className={cn(
                          "grid size-4 place-items-center rounded-full border",
                          active
                            ? "border-iris bg-iris text-white"
                            : "border-line"
                        )}
                      >
                        {active && <CheckCircle2 className="size-3" />}
                      </span>
                      <span>
                        <span className="block text-sm font-medium text-ink">
                          {item.title}
                        </span>
                        {item.hint && (
                          <span className="block text-[11px] text-ink-soft">
                            {item.hint}
                          </span>
                        )}
                      </span>
                    </span>
                    <span className="latin shrink-0 text-sm font-bold text-ink">
                      {formatPrice(
                        item.priceCents,
                        item.currency ?? "EGP",
                        false
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-ink-soft">
              ملاحظة (اختياري)
            </span>
            <input
              id="booking-note"
              value={note}
              onChange={event => setNote(event.target.value)}
              placeholder="مثل: عايز أبدأ الأسبوع الجاي بالليل"
              maxLength={500}
              aria-invalid={Boolean(errors.note)}
              aria-describedby={errors.note ? "booking-note-error" : undefined}
              className="h-11 w-full rounded-xl border border-line bg-paper px-3 text-sm text-ink outline-none transition focus:border-iris"
            />
            {errors.note && (
              <span
                id="booking-note-error"
                className="mt-1 block text-[11px] text-destructive"
              >
                {errors.note}
              </span>
            )}
          </label>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl bg-paper px-3.5 py-2.5 text-[11px] text-ink-soft">
            <span className="inline-flex items-center gap-1.5">
              <Smartphone className="size-3.5 text-iris" /> فودافون كاش
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Smartphone className="size-3.5 text-iris" /> إنستاباي
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="size-3.5 text-iris" /> بياناتك مش بتتشارك
            </span>
          </div>

          <Button
            type="submit"
            disabled={create.isPending}
            className="h-12 w-full rounded-full bg-[#25D366] text-sm font-semibold text-white hover:bg-[#1fb457]"
          >
            {create.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <WhatsAppIcon className="size-4" />
            )}
            تأكيد الحجز على واتساب
          </Button>

          <div className="relative my-1">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-line" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase">
              <span className="bg-card px-2 text-ink-soft">أو ادفع فوراً لتسريع التفعيل</span>
            </div>
          </div>

          <Button
            type="button"
            onClick={() => {
              onOpenChange(false);
              setOpenReceiptModal(true);
            }}
            className="h-12 w-full rounded-full bg-iris hover:bg-iris-deep text-white font-bold text-xs sm:text-sm gap-2 shadow-sm"
          >
            <CreditCard className="size-4" /> دفع بفودافون كاش / إنستاباي ورفع الإيصال
          </Button>

          <p className="text-center text-[11px] text-ink-soft">
            يمكنك تأكيد الحجز مباشرة عبر واتساب، أو تحويل المبلغ ورفع الإيصال للتفعيل الفوري.
          </p>
        </form>
      </DialogContent>
    </Dialog>

    <PaymentReceiptDialog
      open={openReceiptModal}
      onOpenChange={setOpenReceiptModal}
      targetType={planSlug ? "plan" : "course"}
      targetId={courseSlug || planSlug || "course"}
      targetTitle={selected ? `${courseTitle || "الكورس"} (${selected.title})` : (courseTitle || "حجز")}
      amountCents={selected?.priceCents ?? 0}
      currency={selected?.currency ?? "EGP"}
    />
    </>
  );
}

type BookingButtonProps = {
  label: string;
  courseTitle?: string;
  courseSlug?: string;
  planSlug?: string;
  cycle?: "monthly" | "yearly";
  packages: BookingPackage[];
  eyebrow?: string;
  className?: string;
  variant?: "default" | "outline" | "secondary" | "ghost";
};

/** A button that opens the booking dialog (keeps its own open state). */
export function BookingButton({
  label,
  className,
  variant = "default",
  ...rest
}: BookingButtonProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        variant={variant}
        onClick={() => setOpen(true)}
        className={className}
      >
        {label}
      </Button>
      <BookingDialog open={open} onOpenChange={setOpen} {...rest} />
    </>
  );
}
