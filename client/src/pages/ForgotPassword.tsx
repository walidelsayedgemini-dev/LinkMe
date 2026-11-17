import { useState } from "react";
import { Link } from "wouter";
import { ShieldCheck } from "lucide-react";
import {
  AuthError,
  AuthInput,
  AuthLayout,
  Field,
  SubmitButton,
} from "./auth-layout";
import { trpc } from "@/lib/trpc";
import { openWhatsApp } from "@/components/whatsapp";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const request = trpc.auth.requestPasswordReset.useMutation({
    onSuccess: () => setSent(true),
    onError: err => setError(err.message),
  });
  return (
    <AuthLayout
      badge="استعادة آمنة لحسابك"
      title={
        <>
          نرجّعك <span className="auth-title-highlight">تكمل.</span>
        </>
      }
      subtitle="اكتب بريد حسابك لطلب المساعدة في الاستعادة. حماية حسابك أولاً؛ رابط تغيير كلمة المرور مش بيظهر لأي زائر."
      footer={
        <Link href="/login" className="font-semibold text-iris">
          ارجع لتسجيل الدخول
        </Link>
      }
    >
      {sent ? (
        <div className="space-y-5">
          <div className="rounded-2xl border border-line bg-paper p-5">
            <ShieldCheck className="mb-3 size-6 text-iris" />
            <h2 className="font-semibold text-ink">استلمنا طلب المساعدة</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              كلّم الدعم عشان نتحقق من ملكية الحساب ونساعدك. إرسال بريد
              الاستعادة التلقائي لسه مش مفعّل؛ مش هنبعت أو نعرض رابطًا قبل
              التحقق.
            </p>
          </div>
          <button
            onClick={() =>
              openWhatsApp(
                `محتاج أستعيد حسابي على Link Me. بريد الحساب: ${email.trim()}. ممكن تساعدوني أتحقق من ملكية الحساب؟`
              )
            }
            className="w-full rounded-xl bg-iris px-4 py-3 font-semibold text-white"
          >
            تواصل مع الدعم على واتساب
          </button>
        </div>
      ) : (
        <form
          className="space-y-5"
          onSubmit={e => {
            e.preventDefault();
            setError(null);
            request.mutate({ email: email.trim() });
          }}
        >
          <Field label="بريد حسابك">
            <AuthInput
              icon="mail"
              type="email"
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
            />
          </Field>
          <AuthError message={error} />
          <SubmitButton pending={request.isPending} pendingLabel="بنسجّل طلبك…">
            اطلب المساعدة في الاستعادة
          </SubmitButton>
        </form>
      )}
    </AuthLayout>
  );
}
