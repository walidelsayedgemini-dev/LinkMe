import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";

export function StaffRoleControl({
  userId,
  role,
}: {
  userId: number;
  role: "user" | "instructor";
}) {
  const [confirmed, setConfirmed] = useState(false);
  const utils = trpc.useUtils();
  const update = trpc.admin.updateStudent.useMutation({
    onSuccess: () => {
      setConfirmed(false);
      toast.success(
        "اتحفظ نوع الحساب. تعيين طلاب للمدرس خطوة منفصلة في خطة الإتقان."
      );
      void Promise.all([
        utils.admin.overview.invalidate(),
        utils.admin.student.invalidate({ userId }),
        utils.premium.staff.invalidate(),
      ]).catch(() => toast.warning("النوع اتحفظ، لكن تحديث القوائم اتأخر."));
    },
    onError: error => toast.error(error.message),
  });
  return (
    <section className="rounded-2xl border border-line bg-card p-5">
      <h2 className="font-semibold text-ink">حساب عضو في فريق التدريس</h2>
      <p className="mt-2 text-xs leading-relaxed text-ink-soft">
        المدرس يعمل حساب بكلمة مرور خاصة بيه، وبعدها المالك يغيّر نوعه هنا.
        الحساب المدرّس مش إدارة، ومش تحويل لمدفوع. هيشوف طلاب الإتقان اللي
        اتعيّن عليهم بس.
      </p>
      <p className="mt-2 text-xs text-ink-soft">
        النوع الحالي: {role === "instructor" ? "مدرّس" : "طالب"}.
      </p>
      <label className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-ink">
        <input
          className="mt-0.5"
          type="checkbox"
          checked={confirmed}
          onChange={event => setConfirmed(event.target.checked)}
        />
        <span>
          راجعت صاحب الحساب وموافق{" "}
          {role === "user"
            ? "إنه يبقى مدرس في فريقي"
            : "إنه يرجع حساب طالب؛ وصول متابعة التدريس هيتوقف"}
          .
        </span>
      </label>
      <Button
        type="button"
        variant="outline"
        className="mt-3 rounded-xl"
        disabled={!confirmed || update.isPending}
        onClick={() =>
          update.mutate({
            userId,
            role: role === "user" ? "instructor" : "user",
          })
        }
      >
        {update.isPending
          ? "بنحفظ…"
          : role === "user"
            ? "تعيينه كمدرّس"
            : "إرجاعه لحساب طالب"}
      </Button>
    </section>
  );
}
