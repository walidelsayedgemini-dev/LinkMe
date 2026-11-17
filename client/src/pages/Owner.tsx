import { useState } from "react";
import { Link, Redirect, useLocation } from "wouter";
import {
  ShieldCheck,
  Users,
  Video,
  ClipboardCheck,
  CalendarCheck,
  LogOut,
  KeyRound,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { PageShell } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

const CODE_INPUT =
  "latin h-12 w-full rounded-xl border border-line bg-paper px-4 text-center text-base font-bold tracking-[0.2em] text-ink outline-none placeholder:tracking-normal placeholder:font-normal placeholder:text-ink-soft/70 focus:border-iris focus:ring-2 focus:ring-iris/15";

export default function Owner() {
  const { user, loading, logout, refresh } = useAuth();
  const [, navigate] = useLocation();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const ownerLogin = trpc.auth.ownerLogin.useMutation({
    onSuccess: async () => {
      await refresh();
      toast.success("أهلًا يا وليد — دخلت لوحة التحكم.");
      navigate("/admin");
    },
    onError: err => setError(err.message),
  });

  if (loading)
    return (
      <PageShell>
        <div className="container py-24 text-center text-ink-soft" role="status">
          بنتحقق من حسابك…
        </div>
      </PageShell>
    );
  if (user?.role === "admin") return <Redirect to="/admin" />;

  return (
    <PageShell>
      <section className="container py-14 sm:py-20">
        <div className="mx-auto grid max-w-4xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-3xl border border-line bg-card p-6 sm:p-9">
            <ShieldCheck className="mb-5 size-11 text-iris" />
            <p className="mb-3 text-xs uppercase tracking-wider text-ink-soft">
              LINK ME · OWNER CONSOLE
            </p>
            <h1 className="text-3xl leading-snug text-ink sm:text-4xl">
              كل رحلات الطلاب، <span className="hl-word">قدّامك.</span>
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-ink-soft">
              دخول المالك برمز سري واحد بس — من غير إيميل ولا رابط ولا كلمة مرور.
              اكتب رمزك وهتدخل على طول للطلاب والتقدّم والحضور والجلسات والتقييم
              والواجبات والحجوزات.
            </p>
            <div className="my-7 grid gap-3 sm:grid-cols-2">
              {[
                { icon: Users, label: "الطلاب وتقدّمهم" },
                { icon: Video, label: "الجلسات والحضور" },
                { icon: ClipboardCheck, label: "التقييمات والواجبات" },
                { icon: CalendarCheck, label: "الحجوزات وتفعيل الوصول" },
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-3 rounded-xl border border-line bg-paper p-4 text-sm text-ink"
                >
                  <Icon className="size-5 text-iris" />
                  {label}
                </div>
              ))}
            </div>
            <p className="text-xs leading-relaxed text-ink-soft">
              الرمز خاص بيك ومش ظاهر لأي حد. تقدر تولّد رمزًا جديدًا في أي وقت من
              تبويب <b className="text-ink">أمان المالك</b> جوه لوحة التحكم.
            </p>
          </div>

          <div className="rounded-3xl border border-iris/30 bg-iris/5 p-6 sm:p-8">
            <div className="flex items-center gap-2 text-sm font-semibold text-ink">
              <KeyRound className="size-4 text-iris" /> ادخل برمز المالك
            </div>
            <form
              className="mt-5 space-y-4"
              onSubmit={event => {
                event.preventDefault();
                setError(null);
                if (code.replace(/[\s-]/g, "").length < 8) {
                  setError("اكتب رمز المالك كامل.");
                  return;
                }
                ownerLogin.mutate({ code });
              }}
            >
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-ink-soft">
                  رمز المالك
                </span>
                <input
                  dir="ltr"
                  autoComplete="off"
                  spellCheck={false}
                  value={code}
                  onChange={event => {
                    setCode(event.target.value);
                    setError(null);
                  }}
                  placeholder="XXXX-XXXX-XXXX-XXXX-XXXX"
                  className={cn(CODE_INPUT, error && "border-destructive")}
                />
              </label>
              {error && (
                <p className="rounded-lg bg-destructive/10 p-2.5 text-sm text-destructive">
                  {error}
                </p>
              )}
              <Button
                type="submit"
                disabled={ownerLogin.isPending}
                className="h-12 w-full rounded-full bg-iris text-white hover:bg-iris-deep"
              >
                {ownerLogin.isPending ? (
                  <>
                    <Loader2 className="me-2 size-4 animate-spin" /> بنتحقق…
                  </>
                ) : (
                  <>
                    دخول لوحة التحكم <ArrowLeft className="ms-2 size-4" />
                  </>
                )}
              </Button>
            </form>

            {user && (
              <div className="mt-5 rounded-xl border border-line bg-card p-4 text-sm leading-relaxed text-ink-soft">
                أنت داخل بحساب طالب.{" "}
                <button
                  type="button"
                  onClick={async () => {
                    await logout();
                  }}
                  className="font-semibold text-iris hover:underline"
                >
                  سجّل خروج
                </button>{" "}
                وبعدها اكتب رمز المالك.
              </div>
            )}

            <p className="mt-6 text-xs leading-relaxed text-ink-soft">
              ضيّعت الرمز؟ ادخل لوحة التحكم بأي رمز قديم شغّال وولّد واحد جديد، أو{" "}
              <Link href="/contact" className="text-iris hover:underline">
                كلّمنا من صفحة التواصل
              </Link>
              .
            </p>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
