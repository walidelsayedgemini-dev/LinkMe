export type PaymentMethodType = "vodafone_cash" | "instapay";
export type ReceiptStatus = "pending" | "approved" | "rejected";
export type TargetItemType = "course" | "premium" | "plan";

export interface PaymentMethodConfig {
  id: PaymentMethodType;
  nameAr: string;
  badge: string;
  iconName: "smartphone" | "building";
  numberOrHandle: string;
  recipientName: string;
  instructions: string[];
}

export const PAYMENT_METHODS_CONFIG: Record<PaymentMethodType, PaymentMethodConfig> = {
  vodafone_cash: {
    id: "vodafone_cash",
    nameAr: "فودافون كاش",
    badge: "محفظة ذكية",
    iconName: "smartphone",
    numberOrHandle: "01022412243",
    recipientName: "Link Me Academy",
    instructions: [
      "افتح تطبيق أنا فودافون أو اطلب *9*7*الرقم*المبلغ#",
      "حوّل المبلغ المطلوب بالكامل للرقم الموضح بالأعلى",
      "خد لقطة شاشة (سكرين شوت) واضحة لرسالة تأكيد التحويل",
      "ارفع صورة الإيصال واكتب رقم المحفظة المحوّل منها",
    ],
  },
  instapay: {
    id: "instapay",
    nameAr: "إنستاباي (InstaPay)",
    badge: "تحويل لحظي فوري",
    iconName: "building",
    numberOrHandle: "linkme@instapay",
    recipientName: "Link Me Academy — CIB Bank",
    instructions: [
      "افتح تطبيق InstaPay واختر 'إرسال نقود'",
      "حوّل إلى عنوان الدفع اللحظي (IPA) الموضح أعلاه",
      "تأكد من اسم المستلم والمبلغ المحدد قبل التأكيد",
      "احفظ إيصال العملية وارفع صورته مع رقم المرجع",
    ],
  },
};

export const RECEIPT_STATUS_LABELS: Record<
  ReceiptStatus,
  { labelAr: string; badgeClass: string; hintAr: string }
> = {
  pending: {
    labelAr: "قيد المراجعة",
    badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    hintAr: "تم استلام إيصالك، جاري مراجعة التحويل وتفعيل الحساب خلال دقائق.",
  },
  approved: {
    labelAr: "تم التأكيد والتفعيل",
    badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    hintAr: "تم التحقق من التحويل وتفعيل وصولك بنجاح! 🎉",
  },
  rejected: {
    labelAr: "مرفوض",
    badgeClass: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    hintAr: "تعذر التحقق من الإيصال. يرجى مراجعة السبب وإعادة الرفع.",
  },
};
