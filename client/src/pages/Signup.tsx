import { useState } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { Gift } from "lucide-react";
import { toast } from "sonner";
import {
  AuthError,
  AuthInput,
  AuthLayout,
  Field,
  getSafeNext,
  PasswordStrength,
  SocialDivider,
  SubmitButton,
} from "./auth-layout";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";

export default function Signup() {
  const search = useSearch();
  const [, navigate] = useLocation();
  const params = new URLSearchParams(search);
  const next = getSafeNext(params.get("next"));
  const referralCode = params.get("ref")?.trim().toUpperCase() || "";
  const { refresh } = useAuth();
  const { data: providers } = trpc.auth.providers.useQuery();

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
      referralCode: referralCode || undefined,
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
        {referralCode && (
          <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-3.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
            <Gift className="size-4 shrink-0 text-emerald-600" />
            <span>
              دعوة صديقك مفعّلة ({referralCode}) — هتاخد{" "}
              <b>+100 نقطة XP هدية ترحيب فورية</b> بعد التسجيل! 🎉
            </span>
          </div>
        )}
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

      {providers?.google && (
        <>
          <SocialDivider />
          <a
            href={`/api/auth/google?next=${encodeURIComponent(next)}`}
            className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-line bg-card px-4 py-3 text-sm font-semibold text-ink transition hover:border-iris hover:bg-iris-soft/40"
          >
            <svg className="size-4" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.79-.07-1.54-.19-2.27h-11.3v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
              />
              <path
                fill="#34A853"
                d="M12.255 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96h-3.98v3.09C3.515 21.3 7.565 24 12.255 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.525 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62h-3.98a11.86 11.86 0 000 10.76l3.98-3.09z"
              />
              <path
                fill="#EA4335"
                d="M12.255 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C18.205 1.19 15.495 0 12.255 0c-4.69 0-8.74 2.7-10.71 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
              />
            </svg>
            المتابعة بحساب Google
          </a>
        </>
      )}
    </AuthLayout>
  );
}
