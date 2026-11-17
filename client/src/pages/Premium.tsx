import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  Clock3,
  CreditCard,
  LockKeyhole,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";
import { Link } from "wouter";
import { PageShell } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";
import { PaymentReceiptDialog } from "@/components/payment-receipt-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { trpc } from "@/lib/trpc";
import { formatDate, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  ASSESSMENT_LEVELS,
  LEVEL_NAMES,
  type AssessmentLevel,
} from "@shared/assessment";
import {
  PREMIUM_PRICE_CENTS,
  type PremiumLessonSummary,
} from "@shared/premium";
import { LessonBrowser } from "@/components/premium/LessonBrowser";
import { PremiumDailyQuiz } from "@/components/premium/PremiumQuiz";
import { PremiumAdminPanel } from "@/components/premium/PremiumAdminPanel";
import type { PremiumMineView } from "@/components/premium/types";
import "@/premium.css";

export { PremiumAdminPanel };

type PremiumCatalog = {
  priceCents: number;
  pricePerLevelCents: number;
  currency: string;
  levels: { level: AssessmentLevel; name: string }[];
  durations: { durationDays: 30 | 365; label: string }[];
  terms: {
    manualActivation: boolean;
    dailyQuestions: number;
    passPercent: number;
    timezone: string;
    retryPolicy: { daily: string; lessons: string };
  };
};

export default function Premium() {
  const { user, loading } = useAuth();
  const catalog = trpc.premium.catalog.useQuery();
  const mine = trpc.premium.mine.useQuery(undefined, {
    enabled: Boolean(user),
  });

  if (loading) return <PremiumLoading />;
  if (!user) return <PremiumMarketing catalog={catalog.data} />;
  if (mine.isLoading) return <PremiumLoading />;
  if (mine.error) return <PremiumAccessError />;
  if (!mine.data?.membership)
    return <PremiumMarketing catalog={catalog.data} loggedIn />;
  if (!mine.data.active)
    return <PremiumInactive membership={mine.data.membership} />;
  return <PremiumStudentWorkspace data={mine.data} studentName={user.name} />;
}

function PremiumMarketing({
  catalog,
  loggedIn = false,
}: {
  catalog: PremiumCatalog | undefined;
  loggedIn?: boolean;
}) {
  const [selected, setSelected] = useState<AssessmentLevel[]>(["A1"]);
  const [openPaymentModal, setOpenPaymentModal] = useState(false);
  const pricePerLevel = catalog?.pricePerLevelCents ?? PREMIUM_PRICE_CENTS;
  const total = selected.length * pricePerLevel;
  const levels = catalog?.levels.length
    ? catalog.levels
    : ASSESSMENT_LEVELS.map(level => ({ level, name: LEVEL_NAMES[level] }));
  return (
    <PageShell>
      <section className="premium-public-hero">
        <div className="premium-hero-grid" />
        <div className="container premium-public-inner">
          <div className="premium-hero-copy">
            <span className="premium-eyebrow">
              <Sparkles className="size-4" /> خطة الإتقان الفردية
            </span>
            <h1>
              خطة يومية تمشي على <span>مستواك الحقيقي.</span>
            </h1>
            <p>
              من A1 لـ C2: درس واضح، 10 أسئلة مراجعة، وتصحيح بالمصري يوضح لك ليه
              إجابتك صح أو غلط. الدفع والتفعيل يدويًا من المالك فقط.
            </p>
            <div className="premium-hero-actions">
              <Button
                asChild
                className="rounded-full bg-iris text-white hover:bg-iris-deep"
              >
                <Link href={loggedIn ? "/dashboard" : "/login?next=/premium"}>
                  {loggedIn ? "ارجع للوحة التعلّم" : "سجّل الدخول للمتابعة"}
                  <ArrowLeft className="ms-2 size-4" />
                </Link>
              </Button>
              <a href="#premium-levels" className="premium-ghost-link">
                شوف المستويات والأسعار
              </a>
            </div>
            <div className="premium-trust-row">
              <span>
                <ShieldCheck className="size-4" /> تفعيل بعد مراجعة المالك
              </span>
              <span>
                <CalendarDays className="size-4" /> 30 أو 365 يوم
              </span>
              <span>
                <Target className="size-4" /> متابعة أداء فعلية
              </span>
            </div>
          </div>
          <div className="premium-hero-card" aria-label="ملخص خطة الإتقان">
            <div className="premium-hero-card-top">
              <span className="premium-chip">A1 → C2</span>
              <span className="latin">Link Me / premium</span>
            </div>
            <div className="premium-ring">
              <strong className="latin">10</strong>
              <span>أسئلة يومية</span>
            </div>
            <ul>
              <li>
                <Check className="size-4" /> دروس الأزمنة الـ 12 بأمثلة حقيقية
              </li>
              <li>
                <Check className="size-4" /> علاج نقاط الضعف من إجاباتك
              </li>
              <li>
                <Check className="size-4" /> ملاحظات بشرية من المرشد المعيّن
              </li>
            </ul>
            <small>
              الجلسات الأونلاين يحددها فريق المالك من النظام الحالي — مش حجز أو
              توظيف تلقائي.
            </small>
          </div>
        </div>
      </section>
      <section id="premium-levels" className="container premium-public-section">
        <div className="premium-section-heading">
          <div>
            <p className="premium-kicker">اختار اللي يناسبك</p>
            <h2>3000 جنيه لكل مستوى</h2>
            <p className="premium-muted">
              السعر بيتحسب على عدد المستويات. مفيش اشتراك تلقائي أو دفع من
              الصفحة دي.
            </p>
          </div>
          <div className="premium-price-note">
            <span className="latin">{formatPrice(total, "EGP")}</span>
            <small>للاختيار الحالي</small>
          </div>
        </div>
        <div className="premium-public-levels">
          {levels.map(item => {
            const active = selected.includes(item.level);
            return (
              <button
                type="button"
                key={item.level}
                className={cn(
                  "premium-public-level",
                  active && "premium-public-level-active"
                )}
                onClick={() =>
                  setSelected(previous =>
                    previous.includes(item.level)
                      ? previous.filter(level => level !== item.level)
                      : [...previous, item.level]
                  )
                }
              >
                <span className="latin">{item.level}</span>
                <strong>{item.name}</strong>
                <small>{formatPrice(pricePerLevel, "EGP")}</small>
                {active && <Check className="size-4" />}
              </button>
            );
          })}
        </div>

        {/* Instant Payment & Receipt Upload Card */}
        {selected.length > 0 && (
          <div className="my-10 rounded-3xl border border-iris/30 bg-iris/5 p-6 sm:p-8 text-center max-w-2xl mx-auto space-y-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
              <div className="text-start">
                <span className="text-xs text-ink-soft">المستويات المحددة:</span>
                <p className="text-base font-bold text-ink mt-0.5">
                  {selected.map(lvl => LEVEL_NAMES[lvl] || lvl).join(" + ")}
                </p>
              </div>
              <div className="text-end">
                <span className="text-xs text-ink-soft">إجمالي المبلغ المطلوب:</span>
                <p className="text-2xl font-black text-iris mt-0.5">
                  {formatPrice(total, "EGP", false)}
                </p>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                type="button"
                onClick={() => setOpenPaymentModal(true)}
                className="w-full sm:w-auto h-12 px-8 rounded-full bg-iris hover:bg-iris-deep text-white font-bold text-sm gap-2 shadow-lg shadow-iris/25 transition-transform hover:scale-[1.02]"
              >
                <CreditCard className="size-4" /> الدفع بكاش / إنستاباي ورفع الإيصال
              </Button>
              <Button
                type="button"
                variant="outline"
                asChild
                className="w-full sm:w-auto h-12 rounded-full text-xs font-semibold gap-2 border-line bg-card hover:bg-paper"
              >
                <Link href="/chat">
                  <MessageCircle className="size-4 text-iris" /> استفسر في الشات أولاً
                </Link>
              </Button>
            </div>
            <p className="text-[11px] text-ink-soft">
              تفعيل رسمي بعد مراجعة إيصال التحويل في دقائق معدودة، مع إشعار فوري بحسابك.
            </p>
          </div>
        )}

        <PaymentReceiptDialog
          open={openPaymentModal}
          onOpenChange={setOpenPaymentModal}
          targetType="premium"
          targetId={JSON.stringify(selected)}
          targetTitle={`خطة الإتقان الفردية (${selected.join(", ")})`}
          amountCents={total}
          currency="EGP"
        />

        <div className="premium-catalog-grid">
          <article className="premium-catalog-card">
            <div>
              <span className="premium-chip">يومي</span>
              <span className="premium-chip premium-chip-muted">10 أسئلة</span>
            </div>
            <h3>خطة شخصية مش محتوى عام</h3>
            <p>
              السيرفر يختار أسئلة المستوى حسب اليوم ويحتفظ بسجل إجاباتك وتصحيحك.
            </p>
          </article>
          <article className="premium-catalog-card">
            <div>
              <span className="premium-chip">12 زمن</span>
              <span className="premium-chip premium-chip-muted">أمثلة</span>
            </div>
            <h3>شرح بالمصري</h3>
            <p>مثبت ونفي وسؤال وأخطاء شائعة، وبعد كل درس اختبار بتقدم محفوظ.</p>
          </article>
          <article className="premium-catalog-card">
            <div>
              <span className="premium-chip">مالك</span>
              <span className="premium-chip premium-chip-muted">يدوي</span>
            </div>
            <h3>تفعيل واضح</h3>
            <p>
              مفيش حالة مدفوعة وهمية ولا تحصيل من الصفحة: المالك يؤكد الدفع ثم
              يفعّل الحساب.
            </p>
          </article>
        </div>
      </section>
    </PageShell>
  );
}

function PremiumStudentWorkspace({
  data,
  studentName,
}: {
  data: PremiumMineView;
  studentName: string | null;
}) {
  const {
    membership,
    currentLevel,
    dayNumber,
    totalDays,
    lessons,
    lessonProgress,
    dailyHistory,
    weaknesses,
    coachNotes,
    today,
  } = data;
  const [selectedDay, setSelectedDay] = useState(dayNumber);
  const dayQuery = trpc.premium.day.useQuery(
    { dayIndex: selectedDay },
    { enabled: Boolean(membership) }
  );
  const view = dayQuery.data ?? (selectedDay === dayNumber ? today : null);
  const availableDays = Math.min(dayNumber, totalDays);
  const progressMap = useMemo(
    () =>
      Object.fromEntries(
        lessonProgress.map(item => [
          item.lessonId,
          Math.round((item.bestScore / Math.max(item.total, 1)) * 100),
        ])
      ),
    [lessonProgress]
  );
  useEffect(() => {
    setSelectedDay(dayNumber);
  }, [dayNumber]);
  if (!membership) return null;
  return (
    <PageShell>
      <section className="premium-student-hero">
        <div className="container">
          <div className="premium-student-top">
            <div>
              <span className="premium-eyebrow">
                مساحتك الخاصة · خطة الإتقان
              </span>
              <h1>
                أهلًا {studentName?.split(" ")[0] ?? "يا بطل"}، نكمّل النهارده؟
              </h1>
              <p>
                الحساب ده طالب، والتقدم هنا مبني على إجاباتك المحفوظة فعلًا.
              </p>
            </div>
            <span className="premium-identity-badge">
              <ShieldCheck className="size-4" /> طالب · وصول مدفوع
            </span>
          </div>
          <div className="premium-membership-strip">
            <div>
              <span>المستويات</span>
              <strong className="latin">{membership.levels.join(" · ")}</strong>
            </div>
            <div>
              <span>العضوية</span>
              <strong>
                {formatDate(membership.startDate)} —{" "}
                {formatDate(membership.endDate)}
              </strong>
            </div>
            <div>
              <span>اليوم بالقاهرة</span>
              <strong className="latin">
                {dayNumber}/{totalDays}
              </strong>
            </div>
            <div>
              <span>المرشد</span>
              <strong>
                {membership.coachUserId ? "مرشد معيّن" : "غير معيّن"}
              </strong>
            </div>
          </div>
        </div>
      </section>
      <section className="container premium-student-section">
        <div className="premium-day-layout">
          <aside className="premium-day-rail">
            <div className="premium-section-heading compact">
              <div>
                <p className="premium-kicker">الروزنامة</p>
                <h2>أيامك</h2>
              </div>
              <CalendarDays className="premium-section-icon" />
            </div>
            <div className="premium-day-list">
              {Array.from({ length: totalDays }, (_, index) => index + 1).map(
                day => {
                  const available = day <= availableDays;
                  const history = dailyHistory.find(
                    item => item.dayIndex === day
                  );
                  return (
                    <button
                      type="button"
                      key={day}
                      disabled={!available}
                      onClick={() => setSelectedDay(day)}
                      className={cn(
                        "premium-day-button",
                        selectedDay === day && "premium-day-button-active",
                        !available && "premium-day-button-locked"
                      )}
                    >
                      <span className="latin">{day}</span>
                      <span>
                        {day === dayNumber
                          ? "النهارده"
                          : day < dayNumber
                            ? "يوم سابق"
                            : "مقفل"}
                      </span>
                      {available && history && (
                        <small className="latin">
                          {history.completed
                            ? `${history.score ?? "—"}/${history.total}`
                            : "—"}
                        </small>
                      )}
                      {!available && <LockKeyhole className="size-3.5" />}
                    </button>
                  );
                }
              )}
            </div>
          </aside>
          <div className="premium-day-content">
            <div className="premium-day-heading">
              <div>
                <p className="premium-kicker">اليوم {selectedDay}</p>
                <h2>
                  {selectedDay === dayNumber
                    ? "مهمتك النهارده"
                    : "مراجعة يوم سابق"}
                </h2>
                <p className="premium-muted">
                  المستوى الحالي:{" "}
                  <span className="latin font-semibold">
                    {currentLevel ?? "—"}
                  </span>{" "}
                  · التاريخ بيتحسب بتوقيت القاهرة.
                </p>
              </div>
              {view?.completed && (
                <span className="premium-completed-pill">
                  <Check className="size-4" /> مكتمل
                </span>
              )}
            </div>
            {dayQuery.isLoading ? (
              <div className="premium-loading-block" />
            ) : view ? (
              <PremiumDailyQuiz view={view} />
            ) : (
              <div className="premium-empty">
                اليوم ده مش متاح حاليًا. اختار يوم مفتوح من القائمة.
              </div>
            )}
          </div>
        </div>
      </section>
      <section className="container premium-student-section">
        <div className="premium-insight-grid">
          <div className="premium-card">
            <div className="premium-card-header">
              <div>
                <p className="premium-kicker">من أداءك الفعلي</p>
                <h2 className="premium-card-title">نقط نشتغل عليها</h2>
              </div>
              <Target className="premium-section-icon" />
            </div>
            {weaknesses.length === 0 ? (
              <p className="premium-muted">
                لسه مفيش بيانات كفاية لتحديد نقطة ضعف — حل كام تدريب وهنبني
                التوصية.
              </p>
            ) : (
              <div className="premium-weakness-list">
                {weaknesses.map(weakness => (
                  <div className="premium-weakness-row" key={weakness.skill}>
                    <div>
                      <strong>{weakness.skill}</strong>
                      <p>{weakness.action}</p>
                    </div>
                    <span className="latin">
                      {weakness.percent === null ? "—" : `${weakness.percent}%`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="premium-card">
            <div className="premium-card-header">
              <div>
                <p className="premium-kicker">رسائل المرشد</p>
                <h2 className="premium-card-title">ملاحظات على طريقك</h2>
              </div>
            </div>
            {coachNotes.length === 0 ? (
              <p className="premium-muted">
                مفيش ملاحظة جديدة لسه. المرشد المعيّن يقدر يكتب لك هنا.
              </p>
            ) : (
              <div className="premium-note-list">
                {coachNotes.slice(0, 4).map(note => (
                  <article key={String(note.id)}>
                    <p>{note.note}</p>
                    <small>ملاحظة محفوظة · {formatDate(note.createdAt)}</small>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
      <section className="container premium-student-section">
        <LessonBrowser lessons={lessons} progress={progressMap} />
      </section>
    </PageShell>
  );
}

function PremiumInactive({
  membership,
}: {
  membership: PremiumMineView["membership"];
}) {
  if (!membership) return null;
  return (
    <PageShell>
      <section className="container premium-state-page">
        <span className="premium-eyebrow">
          <LockKeyhole className="size-4" /> وصول غير نشط
        </span>
        <h1>خطة الإتقان مش مفتوحة حاليًا.</h1>
        <p>
          {membership.status === "paused"
            ? "العضوية موقوفة مؤقتًا من الإدارة. تواصل مع المالك لمعرفة الخطوة الجاية."
            : `العضوية انتهت في ${formatDate(membership.endDate)}. مفيش دروس أو اختبارات مفتوحة دلوقتي.`}
        </p>
        <div className="premium-state-meta">
          <span>
            المستويات: <b className="latin">{membership.levels.join(" · ")}</b>
          </span>
          <span>مفيش تحصيل تلقائي من الصفحة دي.</span>
        </div>
        <Button asChild className="mt-7 rounded-full bg-iris text-white">
          <Link href="/contact">
            تواصل مع المالك <ArrowLeft className="ms-2 size-4" />
          </Link>
        </Button>
      </section>
    </PageShell>
  );
}
function PremiumAccessError() {
  return (
    <PageShell>
      <section className="container premium-state-page">
        <h1>مش قادرين نقرأ خطة الإتقان دلوقتي.</h1>
        <p>
          جرّب تحديث الصفحة. لو المشكلة مستمرة، تواصل مع المالك — مش هنفترض إن
          عندك وصول مدفوع من غير تأكيد من السيرفر.
        </p>
        <Button asChild variant="outline" className="mt-7 rounded-full">
          <Link href="/dashboard">رجوع للوحة التعلّم</Link>
        </Button>
      </section>
    </PageShell>
  );
}
function PremiumLoading() {
  return (
    <PageShell>
      <section className="container premium-state-page">
        <div className="premium-loading-block" />
        <p className="mt-4 text-sm text-ink-soft">جارٍ تحميل مساحة الإتقان…</p>
      </section>
    </PageShell>
  );
}
