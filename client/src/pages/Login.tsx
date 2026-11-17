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
