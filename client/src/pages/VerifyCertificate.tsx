import { useEffect, useState } from "react";
import { Link, useLocation, useRoute } from "wouter";
import {
  Award,
  Calendar,
  CheckCircle2,
  GraduationCap,
  Loader2,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  User,
} from "lucide-react";
import { PageShell } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";

export default function VerifyCertificate() {
  const [, params] = useRoute("/verify/:code");
  const [, navigate] = useLocation();
  const routeCode = params?.code?.trim().toUpperCase() ?? "";
  const [inputCode, setInputCode] = useState(routeCode);

  useEffect(() => {
    setInputCode(routeCode);
  }, [routeCode]);

  const query = trpc.certificates.verify.useQuery(
    { code: routeCode },
    { enabled: routeCode.length >= 3, retry: false }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = inputCode.trim().toUpperCase().replace(/\s+/g, "");
    if (cleaned.length < 3) return;
    navigate(`/verify/${encodeURIComponent(cleaned)}`);
  };

  return (
    <PageShell>
      <section className="relative overflow-hidden border-b border-line bg-paper-deep/60">
        <div className="container py-12 sm:py-16 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-iris/30 bg-iris/10 px-3.5 py-1 text-xs font-bold text-iris">
            <ShieldCheck className="size-4" />
            بوابة التحقق الرسمية من الشهادات · Official Verification Portal
          </span>
          <h1 className="mt-4 text-3xl font-extrabold text-ink sm:text-4xl">
            التحقق من شهادة <span className="hl-word">Link Me</span>
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-ink-soft">
            أدخل رقم التحقق المطبوع على الشهادة أو امسح رمز الـ QR Code للتأكد
            فوراً من أصالة الشهادة وبيانات الطالب في سجلات أكاديمية Link Me.
          </p>

          <form
            onSubmit={handleSubmit}
            className="mx-auto mt-7 flex w-full max-w-md items-center gap-2"
          >
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute start-4 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
              <input
                type="text"
                dir="ltr"
                value={inputCode}
                onChange={e => setInputCode(e.target.value.toUpperCase())}
                placeholder="LM-XXXXXXXX"
                className="h-12 w-full rounded-full border border-line bg-card ps-11 pe-4 font-mono text-sm font-bold tracking-wider text-ink placeholder:font-normal placeholder:text-ink-soft/60 focus:border-iris focus:outline-none"
              />
            </div>
            <Button
              type="submit"
              className="h-12 shrink-0 rounded-full bg-iris px-6 text-sm font-bold text-white hover:bg-iris-deep"
            >
              تحقق
            </Button>
          </form>
        </div>
      </section>

      <section className="container py-10 sm:py-14">
        <div className="mx-auto max-w-2xl">
          {!routeCode ? (
            <div className="rounded-3xl border border-line bg-card p-8 text-center">
              <Award className="mx-auto size-12 text-amber-500" />
              <h2 className="mt-4 text-lg font-bold text-ink">
                أدخل كود الشهادة للتحقق الفوري
              </h2>
              <p className="mt-2 text-sm text-ink-soft">
                مثال على صيغة الكود الرسمي:{" "}
                <span className="font-mono font-bold text-iris" dir="ltr">
                  LM-7K9P2Q4X
                </span>
              </p>
            </div>
          ) : query.isLoading ? (
            <div className="rounded-3xl border border-line bg-card p-10 text-center">
              <Loader2 className="mx-auto size-10 animate-spin text-iris" />
              <p className="mt-3 text-sm font-medium text-ink-soft">
                جاري مراجعة سجل الشهادات الرسمي…
              </p>
            </div>
          ) : query.isError ? (
            <div className="rounded-3xl border border-destructive/30 bg-card p-8 text-center">
              <ShieldAlert className="mx-auto size-12 text-destructive" />
              <h2 className="mt-4 text-lg font-bold text-ink">
                تعذر الاتصال بقاعدة البيانات مؤقتاً
              </h2>
              <p className="mt-2 text-sm text-ink-soft">
                حاول تحديث الصفحة بعد ثوانٍ.
              </p>
            </div>
          ) : query.data?.valid ? (
            <div className="overflow-hidden rounded-3xl border-2 border-emerald-500/40 bg-card shadow-xl">
              {/* Verified Header Strip */}
              <div className="bg-gradient-to-l from-emerald-600 to-teal-600 px-6 py-5 text-white">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="grid size-12 place-items-center rounded-2xl bg-white/15 backdrop-blur-sm">
                      <CheckCircle2 className="size-7 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-emerald-100">
                        OFFICIALLY VERIFIED CERTIFICATE
                      </p>
                      <h2 className="text-xl font-extrabold">
                        شهادة رسمية موثقة ومعتمدة ✓
                      </h2>
                    </div>
                  </div>
                  <span
                    dir="ltr"
                    className="rounded-full bg-white/20 px-3.5 py-1 font-mono text-xs font-bold tracking-wider"
                  >
                    {query.data.certificate.code}
                  </span>
                </div>
              </div>

              {/* Certificate Details */}
              <div className="space-y-4 p-6 sm:p-8">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-line bg-paper p-4">
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-ink-soft">
                      <User className="size-3.5 text-iris" /> اسم الحاصل على الشهادة
                    </span>
                    <p className="mt-1.5 text-lg font-extrabold text-ink">
                      {query.data.certificate.studentName}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-line bg-paper p-4">
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-ink-soft">
                      <Sparkles className="size-3.5 text-amber-500" /> المستوى / التقييم
                    </span>
                    <p className="mt-1.5 text-sm font-bold text-ink" dir="ltr">
                      {query.data.certificate.levelTitle}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-line bg-paper p-4 sm:col-span-2">
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-ink-soft">
                      <GraduationCap className="size-3.5 text-iris" /> البرنامج / الكورس
                    </span>
                    <p className="mt-1.5 text-base font-bold text-ink">
                      {query.data.certificate.courseTitle}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-line bg-paper p-4">
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-ink-soft">
                      <Award className="size-3.5 text-emerald-600" /> نسبة الاجتياز
                    </span>
                    <p className="mt-1.5 font-mono text-xl font-extrabold text-emerald-600">
                      {query.data.certificate.scorePercentage}%
                    </p>
                  </div>

                  <div className="rounded-2xl border border-line bg-paper p-4">
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-ink-soft">
                      <Calendar className="size-3.5 text-iris" /> تاريخ الإصدار
                    </span>
                    <p className="mt-1.5 text-sm font-bold text-ink">
                      {new Intl.DateTimeFormat("ar-EG", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }).format(new Date(query.data.certificate.issuedAt))}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-xs text-ink-soft">
                  <span>
                    الجهة المُصدِرة:{" "}
                    <strong className="text-ink">
                      Link Me English Academy (link-me.tech)
                    </strong>
                  </span>
                  <Link
                    href="/level-test"
                    className="font-bold text-iris hover:underline"
                  >
                    اختبر مستواك واحصل على شهادتك ←
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border-2 border-rose-500/30 bg-card p-8 text-center shadow-md">
              <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-rose-500/10 text-rose-600">
                <ShieldAlert className="size-8" />
              </div>
              <h2 className="mt-4 text-xl font-bold text-ink">
                {query.data?.reason === "revoked"
                  ? "تم إلغاء هذه الشهادة"
                  : "كود الشهادة غير موجود في سجلات Link Me"}
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-ink-soft">
                تأكد من كتابة الكود{" "}
                <span className="font-mono font-bold text-ink" dir="ltr">
                  {routeCode}
                </span>{" "}
                بشكل صحيح، أو امسح رمز الـ QR Code الموجود أسفل الشهادة الأصلية.
              </p>
              <Button asChild variant="outline" className="mt-6 rounded-full">
                <Link href="/">العودة للصفحة الرئيسية</Link>
              </Button>
            </div>
          )}
        </div>
      </section>
    </PageShell>
  );
}
