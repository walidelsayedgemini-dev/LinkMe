import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import {
  AuthError,
  AuthInput,
  AuthLayout,
  Field,
  PasswordStrength,
  SubmitButton,
} from "./auth-layout";
import { trpc } from "@/lib/trpc";

export default function ResetPassword() {
  const [, navigate] = useLocation();
  const [setup, setSetup] = useState(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const query = new URLSearchParams(window.location.search);
    return {
      token: hash.get("token") ?? query.get("token") ?? "",
      owner: hash.get("owner") === "1" || query.get("owner") === "1",
    };
  });
  const [activationCode, setActivationCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    // The token stays only in component memory, not referrers or browser history URLs.
    if (
      window.location.hash ||
      new URLSearchParams(window.location.search).has("token")
    )
      window.history.replaceState(null, "", window.location.pathname);
  }, []);
  const reset = trpc.auth.resetPassword.useMutation({
    onSuccess: () => {
      toast.success("اتحفظت كلمة المرور. ادخل حسابك دلوقتي.");
      navigate(setup.owner ? "/login?next=/admin&owner=1" : "/login");
    },
    onError: err => setError(err.message),
  });
  return (
    <AuthLayout
      badge={setup.owner ? "تفعيل خاص لحساب المالك" : "تغيير كلمة المرور"}
      title={
        <>
          {setup.owner ? "جهّز كلمة مرور " : "اختار كلمة مرور "}
          <span className="auth-title-highlight">
            {setup.owner ? "الإدارة" : "جديدة"}
          </span>
        </>
      }
      subtitle="رابط خاص، مؤقت ولمرة واحدة. اختار كلمة مرور قوية من 8 أحرف على الأقل."
    >
      {!setup.token ? (
        <form
          className="space-y-5"
          onSubmit={event => {
            event.preventDefault();
            const code = activationCode.trim();
            if (!/^[a-f0-9]{48}$/i.test(code))
              return setError("اكتب رمز التفعيل كاملًا من ملفك الخاص.");
            setError(null);
            setSetup({ ...setup, token: code });
          }}
        >
          <p className="text-sm leading-relaxed text-ink-soft">
            لو معاك رمز التفعيل الخاص، حطه هنا. الرمز بيتسلّم لك بشكل خاص، مش
            لأي زائر. لو الرمز مش معاك أو انتهى،{" "}
            <Link href="/forgot-password" className="font-semibold text-iris">
              اطلب المساعدة
            </Link>
            .
          </p>
          <Field label="رمز التفعيل الخاص">
            <AuthInput
              icon="lock"
              type="password"
              value={activationCode}
              onChange={e => setActivationCode(e.target.value)}
              autoComplete="off"
              placeholder="الصق الرمز من ملفك الخاص"
              required
            />
          </Field>
          <AuthError message={error} />
          <SubmitButton pending={false}>كمّل لتعيين كلمة المرور</SubmitButton>
        </form>
      ) : (
        <form
          className="space-y-5"
          noValidate
          onSubmit={e => {
            e.preventDefault();
            setError(null);
            if (password.length < 8)
              return setError("كلمة المرور لازم تكون 8 أحرف على الأقل.");
            if (password !== confirm)
              return setError("كلمتا المرور مش متطابقتين.");
            reset.mutate({ token: setup.token, password });
          }}
        >
          <Field label="كلمة المرور الجديدة">
            <AuthInput
              icon="lock"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              invalid={Boolean(error)}
            />
            <PasswordStrength value={password} />
          </Field>
          <Field label="تأكيد كلمة المرور">
            <AuthInput
              icon="lock"
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              invalid={confirm.length > 0 && confirm !== password}
            />
          </Field>
          <AuthError message={error} />
          <SubmitButton pending={reset.isPending} pendingLabel="بنحفظ…">
            {setup.owner ? "فعّل دخول المالك" : "احفظ كلمة المرور"}
          </SubmitButton>
        </form>
      )}
    </AuthLayout>
  );
}
