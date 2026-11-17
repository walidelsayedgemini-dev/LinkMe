import { useState } from "react";
import { Loader2, LockKeyhole } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

export function PasswordForm() {
  const { refresh } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const change = trpc.auth.changePassword.useMutation();
  const inputClass =
    "mt-2 w-full rounded-xl border border-line bg-paper p-3 text-ink outline-none focus:border-iris";
  return (
    <form
      className="rounded-3xl border border-line bg-card p-6"
      onSubmit={async event => {
        event.preventDefault();
        setError("");
        if (
          !currentPassword ||
          newPassword.length < 8 ||
          newPassword.length > 100
        ) {
          setError("اكتب كلمة المرور الحالية، وجديدة من 8 لـ100 حرف.");
          return;
        }
        if (newPassword !== confirmation) {
          setError("تأكيد كلمة المرور مش مطابق.");
          return;
        }
        try {
          await change.mutateAsync({ currentPassword, newPassword });
        } catch (failure) {
          setError(
            failure instanceof Error
              ? failure.message
              : "كلمة المرور ما اتغيّرتش. جرّب تاني."
          );
          return;
        }
        setCurrentPassword("");
        setNewPassword("");
        setConfirmation("");
        toast.success(
          "كلمة المرور اتغيّرت، والجلسات القديمة على الأجهزة التانية اتقفلت."
        );
        try {
          await refresh();
        } catch {
          toast.warning(
            "اتغيّرت كلمة المرور، لكن تحديث عرض الحساب اتأخر. حدّث الصفحة لو احتجت."
          );
        }
      }}
    >
      <h2 className="flex items-center gap-2 text-lg font-bold text-ink">
        <LockKeyhole className="size-5 text-iris" /> تغيير كلمة المرور
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">
        بعد التغيير، الأجهزة التانية هتحتاج تسجّل دخول تاني. رمز المالك منفصل عن
        الخطوة دي.
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <label className="text-sm text-ink">
          الحالية
          <input
            className={inputClass}
            dir="ltr"
            type={show ? "text" : "password"}
            autoComplete="current-password"
            maxLength={100}
            value={currentPassword}
            onChange={event => setCurrentPassword(event.target.value)}
            required
          />
        </label>
        <label className="text-sm text-ink">
          الجديدة
          <input
            className={inputClass}
            dir="ltr"
            type={show ? "text" : "password"}
            autoComplete="new-password"
            maxLength={100}
            minLength={8}
            value={newPassword}
            onChange={event => setNewPassword(event.target.value)}
            required
          />
        </label>
        <label className="text-sm text-ink">
          تأكيد الجديدة
          <input
            className={inputClass}
            dir="ltr"
            type={show ? "text" : "password"}
            autoComplete="new-password"
            maxLength={100}
            value={confirmation}
            onChange={event => setConfirmation(event.target.value)}
            required
          />
        </label>
      </div>
      <label className="mt-4 flex items-center gap-2 text-sm text-ink-soft">
        <input
          type="checkbox"
          checked={show}
          onChange={event => setShow(event.target.checked)}
        />{" "}
        إظهار الكلمات على الجهاز ده
      </label>
      {error && (
        <p className="mt-4 text-sm text-coral" role="alert">
          {error}
        </p>
      )}
      <Button
        type="submit"
        className="mt-4 rounded-full bg-iris text-white"
        disabled={change.isPending}
      >
        {change.isPending && <Loader2 className="me-2 size-4 animate-spin" />}
        {change.isPending ? "بنغيّرها…" : "حفظ كلمة المرور الجديدة"}
      </Button>
    </form>
  );
}
