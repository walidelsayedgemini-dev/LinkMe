import { Link } from "wouter";
import {
  ArrowLeft,
  BookOpen,
  LockKeyhole,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { PremiumAccountSummary } from "@/components/premium-account-summary";
import { PageShell } from "@/components/layout/site-footer";
import {
  ProfileDetailsForm,
  type ProfileRecord,
} from "@/components/profile/ProfileDetailsForm";
import { ProfilePhotoCard } from "@/components/profile/ProfilePhotoCard";
import { PasswordForm } from "@/components/profile/PasswordForm";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function Profile() {
  const { user, loading, refresh } = useAuth();
  const profileQuery = trpc.profile.mine.useQuery(undefined, {
    enabled: Boolean(user),
    retry: 1,
    refetchOnWindowFocus: false,
  });

  if (loading) {
    return (
      <PageShell>
        <div className="container py-20">
          <div className="h-56 animate-pulse rounded-3xl bg-ink/[0.06]" />
        </div>
      </PageShell>
    );
  }

  if (!user) {
    return (
      <PageShell>
        <div className="container py-24 text-center">
          <UserRound className="mx-auto size-10 text-iris" />
          <h1 className="mt-4 text-3xl text-ink">سجّل الدخول لعرض ملفك</h1>
          <p className="mt-3 text-sm text-ink-soft">
            بياناتك التعليمية وصورتك محفوظة داخل حسابك فقط.
          </p>
          <Button asChild className="mt-6 rounded-full bg-iris text-white">
            <Link href="/login">تسجيل الدخول</Link>
          </Button>
        </div>
      </PageShell>
    );
  }

  if (profileQuery.isLoading) {
    return (
      <PageShell>
        <div className="container py-12">
          <div className="h-8 w-48 animate-pulse rounded-full bg-ink/[0.06]" />
          <div className="mt-6 h-56 animate-pulse rounded-3xl bg-ink/[0.06]" />
          <div className="mt-6 h-[480px] animate-pulse rounded-3xl bg-ink/[0.06]" />
        </div>
      </PageShell>
    );
  }

  if (profileQuery.isError || !profileQuery.data) {
    return (
      <PageShell>
        <div className="container py-24 text-center">
          <h1 className="text-2xl font-bold text-ink">
            مش قادرين نحمّل ملفك دلوقتي
          </h1>
          <p className="mt-3 text-sm text-ink-soft">
            بياناتك ما اتغيّرتش. جرّب إعادة المحاولة، ولو المشكلة مستمرة ارجع
            بعد شوية.
          </p>
          <Button
            type="button"
            className="mt-6 rounded-full bg-iris text-white"
            onClick={() => void profileQuery.refetch()}
          >
            حاول تاني
          </Button>
        </div>
      </PageShell>
    );
  }

  const profile = profileQuery.data as ProfileRecord & {
    user: ProfileRecord["user"] & { avatarUrl?: string | null };
  };
  const roleLabel =
    user.role === "admin"
      ? "مالك"
      : user.role === "instructor"
        ? "مدرّس"
        : "متعلّم";

  const refreshAfterSave = async () => {
    await refresh();
    await profileQuery.refetch();
  };

  return (
    <PageShell>
      <section className="border-b border-line bg-paper-deep/60">
        <div className="container py-10 md:py-12">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-ink/15 bg-card/70 px-3 py-1 text-xs font-medium text-ink-soft">
                <span className="size-1.5 rounded-full bg-acid-deep" /> ملفك
                الشخصي
              </p>
              <h1 className="mt-4 text-3xl leading-tight text-ink sm:text-4xl">
                خلّي بياناتك جاهزة <span className="hl-word">لرحلتك.</span>
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-soft">
                يا {profile.user.name?.split(" ")[0] ?? "صديقي"}، حدّث معلوماتك
                التعليمية عشان نساعدك بشكل أدق.
              </p>
            </div>
            <Button
              asChild
              variant="outline"
              className="rounded-full border-ink/20"
            >
              <Link
                href={
                  user.role === "admin"
                    ? "/admin"
                    : user.role === "instructor"
                      ? "/coaching"
                      : "/dashboard"
                }
              >
                <BookOpen className="me-2 size-4" />{" "}
                {user.role === "admin"
                  ? "لوحة المالك"
                  : user.role === "instructor"
                    ? "متابعة الطلاب"
                    : "لوحة التعلّم"}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="container py-8 md:py-10">
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="flex flex-wrap items-center gap-3 text-sm text-ink-soft">
            <span className="rounded-full bg-iris px-3 py-1 text-xs font-semibold text-white">
              {roleLabel}
            </span>
            <span className="latin">{user.email ?? ""}</span>
            <span className="text-ink/30">·</span>
            <span>بياناتك التعليمية خاصة بحسابك</span>
          </div>

          {user?.role === "user" && <PremiumAccountSummary />}
          <ProfilePhotoCard
            name={profile.user.name}
            avatarUrl={profile.user.avatarUrl ?? user.avatarUrl}
            onUploaded={() =>
              void refreshAfterSave().catch(() =>
                toast.warning("اتحفظت الصورة، لكن تحديث عرض الحساب اتأخر.")
              )
            }
            onDeleted={() =>
              void refreshAfterSave().catch(() =>
                toast.warning("اتشالت الصورة، لكن تحديث عرض الحساب اتأخر.")
              )
            }
          />

          <ProfileDetailsForm profile={profile} onSaved={refreshAfterSave} />
          {user.role !== "admin" && <PasswordForm />}

          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-3xl border border-line bg-card p-6">
              <div className="flex items-start gap-3">
                <LockKeyhole className="mt-0.5 size-5 shrink-0 text-iris" />
                <div>
                  <h2 className="font-bold text-ink">خصوصيتك مهمة</h2>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                    بنطلب معلومات تساعد على التعلّم فقط: مكانك بشكل عام، مرحلتك،
                    هدفك ووقتك المتاح. مش بنجمع عنوان بيت، بطاقة شخصية أو
                    معلومات صحية.
                  </p>
                </div>
              </div>
            </div>

            {user.role === "admin" ? (
              <div className="rounded-3xl border border-iris/25 bg-iris-soft/40 p-6">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 size-5 shrink-0 text-iris" />
                  <div className="min-w-0">
                    <h2 className="font-bold text-ink">أمان المالك</h2>
                    <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                      إدارة دخول المالك والرمز السري موجودة في لوحة الإدارة، مش
                      في نموذج بيانات الطالب.
                    </p>
                    <Button
                      asChild
                      variant="outline"
                      className="mt-4 rounded-full border-iris/30 text-iris hover:bg-iris hover:text-white"
                    >
                      <Link href="/admin">
                        فتح أمان الإدارة <ArrowLeft className="ms-2 size-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-3xl border border-line bg-card p-6">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 size-5 shrink-0 text-iris" />
                  <div>
                    <h2 className="font-bold text-ink">حسابك مؤمّن</h2>
                    <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                      غيّر كلمة المرور من النموذج الموجود فوق إذا احتجت، ولا
                      تشارك بيانات الدخول مع أي شخص.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </PageShell>
  );
}
