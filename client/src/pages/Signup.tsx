import { useState } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { toast } from "sonner";
import {
  AuthError,
  AuthInput,
  AuthLayout,
  Field,
  getSafeNext,
  PasswordStrength,
  SubmitButton,
} from "./auth-layout";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";

export default function Signup() {
  const search = useSearch();
  const [, navigate] = useLocation();
  const next = getSafeNext(new URLSearchParams(search).get("next"));
  const { refresh } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [terms, setTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signup = trpc.auth.signup.useMutation({
    onSuccess: async () => {
      await refresh();
      toast.success("تم إنشاء حسابك — أهلًا بيك!");
      navigate(next);
    },
    onError: err => setError(err.message),
  });

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (name.trim().length < 2) return setError("اكتب اسمك الكامل.");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim()))
      return setError("البريد الإلكتروني غير صحيح.");
    if (password.length < 8)
      return setError("كلمة المرور لازم تكون 8 أحرف على الأقل.");
    if (password !== confirm) return setError("كلمتا المرور غير متطابقتين.");
    if (!terms) return setError("لازم توافق على الشروط وسياسة الخصوصية.");
    signup.mutate({
      name: name.trim(),
      email: email.trim(),
      password,
      role: "user",
    });
  };

  return (
    <AuthLayout
      badge="ابدأ مجانًا"
      title={
        <>
          ابدأ <span className="auth-title-highlight">رحلتك</span>
        </>
      }
      subtitle="حساب واحد يكفي: تتابع تقدمك، تحفظ كورساتك، وتكمّل على مهلك."
      footer={
        <>
          عندك حساب بالفعل؟{" "}
          <Link
            href="/login"
            className="font-semibold text-iris hover:text-iris-deep hover:underline"
          >
            سجّل الدخول
          </Link>
        </>
      }
    >
      <form className="space-y-5" noValidate onSubmit={submit}>
        <Field label="الاسم الكامل">
          <AuthInput
            icon="user"
            value={name}
            onChange={event => setName(event.target.value)}
            placeholder="مثال: مريم عبد الرحمن"
            autoComplete="name"
          />
        </Field>

        <Field label="البريد الإلكتروني">
          <AuthInput
            icon="mail"
            type="email"
            value={email}
            onChange={event => setEmail(event.target.value)}
            placeholder="you@example.com"
            dir="ltr"
            autoComplete="email"
          />
        </Field>

        <Field label="كلمة المرور">
          <AuthInput
            icon="lock"
            type="password"
            value={password}
            onChange={event => setPassword(event.target.value)}
            placeholder="8 أحرف على الأقل"
            dir="ltr"
            autoComplete="new-password"
          />
          <PasswordStrength value={password} />
        </Field>

        <Field label="تأكيد كلمة المرور">
          <AuthInput
            icon="lock"
            type="password"
            value={confirm}
            onChange={event => setConfirm(event.target.value)}
            placeholder="أعد كتابة كلمة المرور"
            dir="ltr"
            autoComplete="new-password"
            invalid={confirm.length > 0 && confirm !== password}
          />
          {confirm.length > 0 && confirm !== password && (
            <span className="block text-xs text-destructive">
              كلمتا المرور غير متطابقتين
            </span>
          )}
        </Field>

        <label className="flex cursor-pointer items-start gap-2 text-xs leading-relaxed text-ink-soft">
          <input
            type="checkbox"
            checked={terms}
            onChange={event => setTerms(event.target.checked)}
            className="mt-0.5 size-4 rounded border-line accent-[var(--color-iris)]"
          />
          موافق على استخدام بيانات الحساب لمتابعة تعلّمي والتواصل بخصوص
          الكورسات.
        </label>

        <AuthError message={error} />

        <SubmitButton
          pending={signup.isPending}
          pendingLabel="جارٍ إنشاء الحساب…"
        >
          إنشاء الحساب
        </SubmitButton>
      </form>
    </AuthLayout>
  );
}
