import { useState, useRef } from "react";
import {
  Check,
  CheckCircle2,
  Copy,
  CreditCard,
  FileCheck,
  Image as ImageIcon,
  Loader2,
  MessageCircle,
  Phone,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Tag,
  UploadCloud,
  X,
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
import { useAuth } from "@/contexts/AuthContext";
import { useCompanion, CompanionAvatar } from "@/components/companion";
import { soundEffects } from "@/lib/sound-effects";
import { trpc } from "@/lib/trpc";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  PAYMENT_METHODS_CONFIG,
  type PaymentMethodType,
  type TargetItemType,
} from "../../../shared/payment-config";
import { applyPromoCode, type PromoCode } from "../../../shared/promo-codes";
import { inputClass } from "@/pages/auth-layout";
import { Link } from "wouter";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetType: TargetItemType;
  targetId: string;
  targetTitle: string;
  amountCents: number;
  currency?: string;
};

export function PaymentReceiptDialog({
  open,
  onOpenChange,
  targetType,
  targetId,
  targetTitle,
  amountCents,
  currency = "EGP",
}: Props) {
  const { user } = useAuth();
  const { companion } = useCompanion();
  const [selectedMethod, setSelectedMethod] =
    useState<PaymentMethodType>("vodafone_cash");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Promo code engine state
  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);
  const [discountCents, setDiscountCents] = useState(0);
  const finalAmountCents = Math.max(0, amountCents - discountCents);

  const [senderPhoneOrHandle, setSenderPhoneOrHandle] = useState(
    user?.phone ?? ""
  );
  const [transactionRef, setTransactionRef] = useState("");
  const [note, setNote] = useState("");
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedReceiptId, setSubmittedReceiptId] = useState<number | null>(
    null
  );

  const fileInputRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();
  const validatePromo = trpc.community.validatePromoCode.useMutation();

  const handleApplyPromo = async () => {
    const code = promoCodeInput.trim();
    if (!code) return;
    try {
      const res = await validatePromo.mutateAsync({ code, amountCents });
      if (res.valid && res.promo) {
        soundEffects.playCorrect();
        setAppliedPromo(res.promo);
        setDiscountCents(res.discountCents);
        toast.success(
          `تم تطبيق كود الخصم! وفّرت ${formatPrice(res.discountCents, currency, false)} 🎉`
        );
      } else {
        soundEffects.playIncorrect();
        toast.error(res.messageAr);
      }
    } catch {
      const res = applyPromoCode(code, amountCents);
      if (res.valid && res.promo) {
        soundEffects.playCorrect();
        setAppliedPromo(res.promo);
        setDiscountCents(res.discountCents);
        toast.success(
          `تم تطبيق كود الخصم! وفّرت ${formatPrice(res.discountCents, currency, false)} 🎉`
        );
      } else {
        soundEffects.playIncorrect();
        toast.error(res.messageAr);
      }
    }
  };

  const handleRemovePromo = () => {
    soundEffects.playClick();
    setAppliedPromo(null);
    setDiscountCents(0);
    setPromoCodeInput("");
  };

  const submitReceipt = trpc.receipts.submit.useMutation({
    onSuccess: data => {
      setIsSuccess(true);
      setSubmittedReceiptId(data.id ?? null);
      void utils.receipts.invalidate();
      toast.success("تم إرسال الإيصال بنجاح وجارٍ مراجعته!");
    },
    onError: err => {
      toast.error(err.message || "حدث خطأ أثناء إرسال الإيصال. حاول مرة أخرى.");
    },
  });

  const methodConfig = PAYMENT_METHODS_CONFIG[selectedMethod];

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success("تم النسخ بنجاح!");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("يرجى اختيار ملف صورة صالح (JPEG أو PNG أو WEBP)");
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      toast.error("حجم الصورة كبير جداً، الحد الأقصى 8 ميجابايت");
      return;
    }

    // Client-side image compression using canvas
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxDim = 1600;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        const compressed = canvas.toDataURL("image/jpeg", 0.85);
        setImageBase64(compressed);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("يرجى تسجيل الدخول أولاً لتسجيل إيصال الدفع بحسابك");
      return;
    }

    if (!imageBase64) {
      toast.error("يرجى إرفاق صورة إيصال التحويل");
      return;
    }

    if (!senderPhoneOrHandle.trim()) {
      toast.error(
        selectedMethod === "vodafone_cash"
          ? "اكتب رقم المحفظة التي قمت بالتحويل منها"
          : "اكتب اسم حساب أو عنوان إنستاباي المحول منه"
      );
      return;
    }

    const submissionNote = appliedPromo
      ? `[كود الخصم المطبق: ${appliedPromo.code} - وفر ${formatPrice(discountCents, currency, false)}] ${note.trim()}`.trim()
      : note.trim() || undefined;

    submitReceipt.mutate({
      method: selectedMethod,
      targetType,
      targetId,
      targetTitle,
      amountCents: finalAmountCents,
      senderPhoneOrHandle: senderPhoneOrHandle.trim(),
      transactionReference: transactionRef.trim() || undefined,
      receiptImage: imageBase64,
      note: submissionNote,
    });
  };

  const resetForm = () => {
    setIsSuccess(false);
    setImageBase64(null);
    setTransactionRef("");
    setNote("");
    setAppliedPromo(null);
    setDiscountCents(0);
    setPromoCodeInput("");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={val => {
        if (!val) resetForm();
        onOpenChange(val);
      }}
    >
      <DialogContent
        dir="rtl"
        className="max-h-[92vh] overflow-y-auto sm:max-w-xl rounded-3xl border-line bg-card text-ink p-6"
      >
        <DialogHeader className="text-start">
          <div className="flex items-center gap-2 text-iris text-xs font-bold uppercase tracking-wider mb-1">
            <CreditCard className="size-4" /> الدفع والتحويل المحلي
          </div>
          <DialogTitle className="text-xl font-bold">
            تأكيد الدفع عبر <span className="hl-word">فودافون كاش أو إنستاباي</span>
          </DialogTitle>
          <DialogDescription className="text-ink-soft text-xs leading-relaxed">
            اختر وسيلة الدفع المناسبة، حوّل المبلغ المحدد، ثم ارفع صورة الإيصال
            للتفعيل الفوري في دقائق.
          </DialogDescription>
        </DialogHeader>

        {/* Target summary banner */}
        <div className="rounded-2xl border border-line bg-paper p-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs text-ink-soft">الباقة أو الكورس المختار</p>
            <h4 className="text-sm font-bold text-ink mt-0.5">{targetTitle}</h4>
          </div>
          <div className="text-start sm:text-end">
            <p className="text-xs text-ink-soft">المبلغ المطلوب للتحويل</p>
            <div className="flex items-baseline gap-2">
              {appliedPromo && (
                <span className="text-xs text-ink-soft line-through">
                  {formatPrice(amountCents, currency, false)}
                </span>
              )}
              <span className="text-lg font-black text-iris">
                {formatPrice(finalAmountCents, currency, false)}
              </span>
            </div>
          </div>
        </div>

        {/* Promo Code Input & Status */}
        {!isSuccess && (
          <div className="rounded-2xl border border-line bg-card p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold text-ink">
                <Tag className="size-3.5 text-iris" /> هل لديك كود خصم؟
              </span>
              <span className="text-[10px] text-ink-soft">
                جرّب كود <strong className="text-iris font-mono">LINKME20</strong> أو <strong className="text-iris font-mono">{companion.id === "khadija" ? "KHADIJA" : "YASSIN"}</strong>
              </span>
            </div>

            {appliedPromo ? (
              <div className="flex items-center justify-between rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-2.5 text-xs">
                <div className="flex items-center gap-2">
                  <CompanionAvatar size={28} />
                  <div>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">
                      تم تفعيل كود ({appliedPromo.code}): {appliedPromo.descriptionAr}
                    </span>
                    <p className="text-[11px] text-ink-soft">
                      {companion.id === "khadija"
                        ? appliedPromo.companionMessage?.khadija ?? "تم تطبيق الخصم يا قمر! 🌸"
                        : appliedPromo.companionMessage?.yassin ?? "تم تطبيق الخصم يا وحش! 🔥"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemovePromo}
                  className="text-xs text-rose-600 hover:text-rose-700 font-bold px-2 py-1"
                >
                  إلغاء
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={promoCodeInput}
                  onChange={(e) => setPromoCodeInput(e.target.value)}
                  placeholder="أدخل كود الخصم (مثال: LINKME20)"
                  className="h-9 flex-1 rounded-xl border border-line bg-paper px-3 text-xs uppercase font-mono tracking-wider focus:outline-none focus:ring-1 focus:ring-iris"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleApplyPromo();
                    }
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleApplyPromo}
                  className="h-9 rounded-xl bg-iris px-4 text-xs font-bold text-white hover:bg-iris-deep"
                >
                  تطبيق الكود
                </Button>
              </div>
            )}
          </div>
        )}

        {/* If successfully submitted */}
        {isSuccess ? (
          <div className="py-6 text-center space-y-4">
            <div className="size-16 rounded-full bg-emerald-500/10 text-emerald-500 mx-auto grid place-items-center animate-in zoom-in">
              <CheckCircle2 className="size-9" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-ink">
                تم استلام إيصالك بنجاح!
              </h3>
              <p className="text-xs text-ink-soft max-w-md mx-auto leading-relaxed">
                رقم الإيصال #{submittedReceiptId}. يقوم فريق المالك بمراجعة
                التحويل ومطابقته، وسيتم تفعيل حسابك فوراً وإرسال إشعار لك في
                الشات.
              </p>
            </div>
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300">
              ⏳ الحالة: <strong>قيد المراجعة والمطابقة</strong> (تستغرق عادة دقائق
              قليلة).
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link href="/chat">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="rounded-full gap-2 text-xs"
                >
                  <MessageCircle className="size-4 text-iris" /> افتح الشات مع
                  المدرس
                </Button>
              </Link>
              <Button
                onClick={() => onOpenChange(false)}
                className="rounded-full bg-iris text-white px-6 text-xs"
              >
                تم، إغلاق النافذة
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Method selection tabs */}
            <div>
              <label className="text-xs font-semibold text-ink-soft mb-2 block">
                اختر وسيلة التحويل:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedMethod("vodafone_cash")}
                  className={cn(
                    "flex flex-col items-center justify-center p-3.5 rounded-2xl border text-center transition-all",
                    selectedMethod === "vodafone_cash"
                      ? "border-iris bg-iris/10 text-iris shadow-sm ring-1 ring-iris"
                      : "border-line bg-paper hover:bg-paper-deep text-ink-soft"
                  )}
                >
                  <Smartphone className="size-5 mb-1 text-red-500" />
                  <span className="text-sm font-bold text-ink">فودافون كاش</span>
                  <span className="text-[10px] opacity-75">محفظة إلكترونية</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMethod("instapay")}
                  className={cn(
                    "flex flex-col items-center justify-center p-3.5 rounded-2xl border text-center transition-all",
                    selectedMethod === "instapay"
                      ? "border-iris bg-iris/10 text-iris shadow-sm ring-1 ring-iris"
                      : "border-line bg-paper hover:bg-paper-deep text-ink-soft"
                  )}
                >
                  <CreditCard className="size-5 mb-1 text-purple-500" />
                  <span className="text-sm font-bold text-ink">إنستاباي (InstaPay)</span>
                  <span className="text-[10px] opacity-75">تحويل بنكي فوري</span>
                </button>
              </div>
            </div>

            {/* Account Details Box with Copy button */}
            <div className="rounded-2xl border border-iris/20 bg-iris/5 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-ink-soft">
                  بيانات التحويل الرسمية للمنصة
                </span>
                <span className="text-[11px] font-medium text-iris bg-iris/10 px-2 py-0.5 rounded-full">
                  {methodConfig.badge}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3 bg-card p-3 rounded-xl border border-line">
                <div className="min-w-0">
                  <p className="text-[11px] text-ink-soft">
                    {selectedMethod === "vodafone_cash"
                      ? "رقم محفظة فودافون كاش"
                      : "عنوان الدفع اللحظي (IPA)"}
                  </p>
                  <p
                    dir="ltr"
                    className="font-mono text-base font-bold text-ink tracking-wider"
                  >
                    {methodConfig.numberOrHandle}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    handleCopy(methodConfig.numberOrHandle, "number")
                  }
                  className="rounded-xl shrink-0 gap-1.5 text-xs h-9"
                >
                  {copiedKey === "number" ? (
                    <>
                      <Check className="size-3.5 text-emerald-500" /> منسوخ
                    </>
                  ) : (
                    <>
                      <Copy className="size-3.5" /> نسخ
                    </>
                  )}
                </Button>
              </div>

              <div className="text-xs text-ink-soft space-y-1">
                <p>
                  <strong className="text-ink">اسم المستلم:</strong>{" "}
                  {methodConfig.recipientName}
                </p>
              </div>
            </div>

            {/* Step-by-step instructions */}
            <div className="space-y-1.5 bg-paper rounded-2xl p-3 border border-line">
              <p className="text-xs font-bold text-ink">خطوات التحويل:</p>
              <ul className="text-xs text-ink-soft space-y-1 list-disc list-inside">
                {methodConfig.instructions.map((step, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {step}
                  </li>
                ))}
              </ul>
            </div>

            {/* Submission Form */}
            <form onSubmit={handleSubmit} className="space-y-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">
                  {selectedMethod === "vodafone_cash"
                    ? "رقم المحفظة التي قمت بالتحويل منها *"
                    : "اسم حسابك أو رقم الهاتف المسجل في إنستاباي *"}
                </label>
                <input
                  required
                  type="text"
                  dir="ltr"
                  value={senderPhoneOrHandle}
                  onChange={e => setSenderPhoneOrHandle(e.target.value)}
                  placeholder={
                    selectedMethod === "vodafone_cash"
                      ? "مثال: 010XXXXXXXX"
                      : "مثال: username@instapay أو رقم الموبايل"
                  }
                  className={cn(inputClass, "font-mono text-sm")}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">
                  رقم العملية / المرجع المطبوع في الإيصال (اختياري)
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={transactionRef}
                  onChange={e => setTransactionRef(e.target.value)}
                  placeholder="مثال: Ref #123456789"
                  className={cn(inputClass, "font-mono text-sm")}
                />
              </div>

              {/* Receipt Image upload */}
              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">
                  صورة الإيصال أو لقطة شاشة التحويل *
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageSelect}
                  className="hidden"
                />

                {imageBase64 ? (
                  <div className="relative rounded-2xl border border-iris/40 bg-iris/5 p-3 flex items-center gap-3">
                    <img
                      src={imageBase64}
                      alt="معاينة الإيصال"
                      className="size-16 rounded-xl object-cover border border-line"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-ink flex items-center gap-1.5">
                        <FileCheck className="size-4 text-emerald-500" /> تم
                        اختيار الإيصال بنجاح
                      </p>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-[11px] text-iris hover:underline mt-1"
                      >
                        تغيير الصورة
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => setImageBase64(null)}
                      className="p-1 rounded-full text-ink-soft hover:bg-paper"
                      aria-label="حذف الصورة"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="cursor-pointer border-2 border-dashed border-line hover:border-iris/60 rounded-2xl p-6 text-center space-y-2 transition-colors bg-paper hover:bg-paper-deep"
                  >
                    <UploadCloud className="size-8 mx-auto text-iris opacity-80" />
                    <p className="text-xs font-medium text-ink">
                      اضغط لاختيار صورة الإيصال من جهازك
                    </p>
                    <p className="text-[11px] text-ink-soft">
                      JPEG, PNG, WEBP (حد أقصى 8 ميجابايت)
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">
                  ملاحظة إضافية (اختياري)
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="أي تفاصيل تحب توضحها للإدارة..."
                  className={inputClass}
                />
              </div>

              {!user && (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300">
                  ⚠️ يجب تسجيل الدخول بحسابك أولاً حتى يتم ربط التفعيل به.
                </div>
              )}

              <Button
                type="submit"
                disabled={submitReceipt.isPending || !imageBase64}
                className="w-full h-12 rounded-full bg-iris hover:bg-iris/90 text-white font-bold text-sm shadow-md transition-all"
              >
                {submitReceipt.isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin me-2" /> جارٍ رفع
                    الإيصال وتسجيل طلبك…
                  </>
                ) : (
                  <>
                    <ShieldCheck className="size-4 me-2" /> إرسال الإيصال
                    للتأكيد والتفعيل
                  </>
                )}
              </Button>
            </form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
