import { Link } from "wouter";
import { ArrowLeft, CalendarCheck, Crown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { trpc } from "@/lib/trpc";

export function PremiumAccountSummary() {
  const { user } = useAuth();
  const query = trpc.premium.mine.useQuery(undefined, { enabled: Boolean(user) && user?.role !== "admin" });
  if (user?.role === "admin") return (
    <Link href="/admin?tab=premium" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-iris/30 bg-iris-soft p-5 font-semibold text-iris"><span className="flex items-center gap-2"><Crown className="size-5" /> فعّل خطة طالب وتابع مراجعته اليومية</span><ArrowLeft className="size-5" /></Link>
  );
  if (query.isPending) return <p className="text-sm text-ink-soft" role="status">بنحمّل حالة خطتك الشخصية…</p>;
  if (query.isError) return <div className="rounded-2xl border border-line bg-card p-5 text-sm text-ink" role="alert">حالة خطتك ما اتحمّلتش. <button type="button" className="font-semibold text-iris underline" onClick={() => void query.refetch()}>جرّب تاني</button></div>;
  const membership = query.data?.membership;
  return (
    <div className="flex flex-col justify-between gap-4 rounded-3xl border border-iris/30 bg-card p-6 sm:flex-row sm:items-center">
      <div>
        <p className="flex items-center gap-2 text-xs font-semibold text-iris"><Crown className="size-4" /> {query.data?.active ? "خطتك المدفوعة متفعّلة" : membership ? "سجل خطتك الشخصية" : "خطة الإتقان الفردية"}</p>
        <h2 className="mt-2 text-xl font-semibold text-ink">{query.data?.active ? <>راجع النهارده، وشوف <span className="hl-word">فرقك.</span></> : <>تعلّم على خطة معمولة <span className="hl-word">ليك.</span></>}</h2>
        <p className="mt-2 text-sm leading-7 text-ink-soft">{query.data?.active ? `اليوم ${query.data.dayNumber} من ${query.data.totalDays} · المستوى ${query.data.currentLevel} · واجب مراجعة ونتيجة وشرح من نفس حسابك.` : membership ? "شوف نتائجك السابقة. فتح دروس جديدة محتاج خطة سارية وتأكيد الإدارة." : "3000 جنيه لكل مستوى، ودروس وأمثلة ومراجعة يومية. المالك بيفعّل المدة والمستويات بعد ما يتأكد من الدفع."}</p>
      </div>
      <Link href="/premium" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-iris px-5 py-3 text-sm font-semibold text-white"><CalendarCheck className="size-4" /> {query.data?.active ? "افتح خطة النهارده" : membership ? "افتح سجلك" : "شوف تفاصيل الخطة"}</Link>
    </div>
  );
}
