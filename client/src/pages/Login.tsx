import { useEffect, useState } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { Gauge } from "lucide-react";
import { toast } from "sonner";
import {
  AuthError,
  AuthInput,
  AuthLayout,
  Field,
  getSafeNext,
  SocialDivider,
  SubmitButton,
} from "./auth-layout";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";

const REMEMBER_KEY = "linkme:remember-email";

function readRememberedEmail() {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(REMEMBER_KEY);
  } catch {
    return null;
  }
}

function saveRememberedEmail(email: string, remember: boolean) {
  if (typeof window === "undefined") return;
  try {
    if (remember) window.localStorage.setItem(REMEMBER_KEY, email);
    else window.localStorage.removeItem(REMEMBER_KEY);
  } catch {
    // localStorage may be blocked by the browser; login should still continue.
  }
}

export default function Login() {
  const search = useSearch();
  const [, navigate] = useLocation();
  const params = new URLSearchParams(search);
  const next = getSafeNext(params.get("next"));
  const ownerMode = params.get("owner") === "1" || next === "/admin";
  const { refresh } = useAuth();
  const { data: providers } = trpc.auth.providers.useQuery();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = readRememberedEmail();
    if (saved) {
      setEmail(saved);
      setRemember(true);
    }
  }, []);

  const login = trpc.auth.login.useMutation({
    onSuccess: async result => {
      saveRememberedEmail(email.trim(), remember);
      await refresh();
      toast.success("أهلًا بيك من جديد!");
      navigate(
        params.get("next")
          ? next
          : result.role === "admin"
            ? "/admin"
            : result.role === "instructor"
              ? "/coaching"
              : "/dashboard"
      );
    },
    onError: err => setError(err.message),
  });

  return (
    <AuthLayout
      badge={ownerMode ? "دخول المالك · لوحة الإدارة" : "رجوع سريع لتعلّمك"}
      title={
        <>
          {ownerMode ? "ادخل مساحة " : "سجّل "}
          <span className="auth-title-highlight">
            {ownerMode ? "الإدارة" : "دخولك"}
          </span>
        </>
      }
      subtitle={
        ownerMode
          ? "إيميل المالك وكلمة المرور اللي اخترتها. حضور الطلاب، تقدّمهم وحجوزاتهم قدّامك."
          : "ادخل بحسابك وكمّل من المكان اللي وقفت عنده — تقدّمك مستنيك."
      }
      footer={
        <>
          {ownerMode ? "دي صفحة دخول الإدارة فقط. " : "أول مرة معانا؟ "}
          <Link
            href={
              ownerMode
                ? "/"
                : `/signup${next !== "/dashboard" ? `?next=${encodeURIComponent(next)}` : ""}`
            }
            className="font-semibold text-iris transition-colors hover:text-iris-deep hover:underline"
          >
            {ownerMode ? "ارجع للمنصة" : "أنشئ حسابك"}
          </Link>
        </>
      }
    >
      <form
        className="space-y-5"
        noValidate
        onSubmit={event => {
          event.preventDefault();
          setError(null);
          if (!email.trim() || !password) {
            setError("اكتب البريد الإلكتروني وكلمة المرور.");
            return;
          }
          login.mutate({ email: email.trim(), password });
        }}
      >
        <Field label="البريد الإلكتروني">
          <AuthInput
            icon="mail"
            type="email"
            value={email}
            onChange={event => setEmail(event.target.value)}
            placeholder="you@example.com"
            dir="ltr"
            autoComplete="email"
            autoFocus
            invalid={Boolean(error)}
          />
        </Field>

        <Field
          label="كلمة المرور"
          aside={
            <Link
              href="/forgot-password"
              className="text-xs font-semibold text-iris hover:text-iris-deep hover:underline"
            >
              نسيت كلمة المرور؟
            </Link>
          }
        >
          <AuthInput
            icon="lock"
            type="password"
            value={password}
            onChange={event => setPassword(event.target.value)}
            placeholder="••••••••"
            dir="ltr"
            autoComplete="current-password"
            invalid={Boolean(error)}
          />
        </Field>

        <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-soft">
          <input
            type="checkbox"
            checked={remember}
            onChange={event => setRemember(event.target.checked)}
            className="size-4 rounded border-line accent-[var(--color-iris)]"
          />
          فاكرني على الجهاز ده
        </label>

        <AuthError message={error} />

        <SubmitButton pending={login.isPending} pendingLabel="بندخّلك…">
          تسجيل الدخول
        </SubmitButton>
      </form>

      {!ownerMode && <SocialDivider />}

      {!ownerMode && (
        <div className="space-y-3">
          {providers?.google && (
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
              الدخول السريع بحساب Google
            </a>
          )}
          <Link
            href="/level-test"
            className="flex w-full items-center justify-between rounded-xl border border-line px-4 py-3 text-sm text-ink transition-colors hover:border-iris hover:bg-iris-soft/50"
          >
            <span className="flex items-center gap-2">
              <Gauge className="size-4 text-iris" /> مش عارف تبدأ منين؟ اعرف
              مستواك الأول
            </span>
            <span className="text-xs text-ink-soft">اختبار</span>
          </Link>
        </div>
      )}
      {ownerMode && (
        <Link
          href="/owner"
          className="mt-5 block text-center text-xs text-iris"
        >
          عن لوحة المالك وصلاحياتها
        </Link>
      )}
    </AuthLayout>
  );
}
