import { Check, Minus } from "lucide-react";
import { Link } from "wouter";
import { PageShell } from "@/components/layout/site-footer";
import { AnimatedAurora, StudyDoodles } from "@/components/decor";
import { PlanCards } from "@/components/plan-cards";
import { Reveal } from "@/components/reveal";
import { SectionHeading } from "@/components/bits";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { FAQ_GROUPS } from "@/lib/content";

const COMPARISON = [
  { feature: "تجربة الدرس الأول + اختبار تحديد المستوى", starter: true, pro: true, intensive: true },
  { feature: "الوصول غير المحدود لكل الـ 25 كورس", starter: false, pro: true, intensive: true },
  { feature: "شهادة إتمام رسمية معتمدة بـ QR Code 🎓", starter: false, pro: true, intensive: true },
  { feature: "مضاعفة نقاط المسابقات تلقائياً (2x XP Boost ⚡)", starter: false, pro: true, intensive: true },
  { feature: "درع حماية شعلة الحماسة اليومية تلقائياً (Streak Freeze 🛡️)", starter: false, pro: true, intensive: true },
  { feature: "سكنات وأفتارات PRO الملكية + شارة PRO 👑 في لوحة الشرف", starter: false, pro: true, intensive: true },
  { feature: "محاكي المواقف المتقدمة (IELTS Speaking + التفاوض على المرتب 🎭)", starter: false, pro: true, intensive: true },
  { feature: "حزمة فلاش كاردز C1 التنفيذية + تحميل ملخصات PDF للطباعة 📄", starter: false, pro: true, intensive: true },
  { feature: "متابعة التقدم وحفظ آخر درس من أي جهاز", starter: true, pro: true, intensive: true },
  { feature: "جلسة فردية مباشرة شهرياً مع المدرّس 🎥", starter: false, pro: false, intensive: true },
  { feature: "تصحيح كتابة وتسجيلات صوتية فردية 🎙️", starter: false, pro: false, intensive: true },
  { feature: "تقرير متابعة شهري مفصّل لولي الأمر على واتساب 📋", starter: false, pro: true, intensive: true },
  { feature: "خطة تعلّم أسبوعية مخصصة ومتابعة يومية", starter: false, pro: false, intensive: true },
];

export default function Pricing() {
  const paymentFaq = FAQ_GROUPS[2].items;

  return (
    <PageShell>
      <section className="relative overflow-hidden border-b border-line bg-paper-deep/60">        <AnimatedAurora className="opacity-60" />
        <StudyDoodles variant="soft" />
        <div className="absolute inset-0 dot-grid opacity-30" />
        <div className="container relative py-14 text-center md:py-20">
          <p className="latin text-xs uppercase tracking-[0.2em] text-ink-soft">Plans & pricing</p>
          <h1 className="mx-auto mt-3 max-w-3xl text-4xl leading-tight text-ink sm:text-5xl">
            اختار الطريقة اللي تناسبك: كورس واحد أو <span className="hl-word">كل الكورسات</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-ink-soft">
            كل الخطط تشمل حفظ التقدم ومتابعة الدروس من أي جهاز. التفعيل وتغيير المدة بيتموا مع الإدارة بعد تأكيد الدفع.
          </p>
        </div>
      </section>

      <section className="container py-12">
        <PlanCards />
      </section>

      <section className="container py-10">
        <SectionHeading align="center" title="مقارنة سريعة بين الخطط" />
        <div className="mt-8 overflow-x-auto rounded-3xl border border-line bg-card">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="bg-paper text-ink-soft">
                <th className="px-6 py-4 text-start font-medium">الميزة</th>
                <th className="px-4 py-4 text-center font-medium">البداية</th>
                <th className="bg-iris px-4 py-4 text-center font-medium text-white">برو</th>
                <th className="px-4 py-4 text-center font-medium">مكثف</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {COMPARISON.map(row => (
                <tr key={row.feature}>
                  <td className="px-6 py-3.5 text-ink">{row.feature}</td>
                  {[row.starter, row.pro, row.intensive].map((value, index) => (
                    <td key={index} className={index === 1 ? "bg-ink/[0.03] px-4 py-3.5 text-center" : "px-4 py-3.5 text-center"}>
                      {value ? <Check className="mx-auto size-4 text-acid-deep" strokeWidth={3} /> : <Minus className="mx-auto size-4 text-ink/25" />}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="container py-12">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <SectionHeading eyebrow="الدفع" title="أسئلة عن الدفع والاشتراك" />
            <p className="mt-4 text-sm leading-relaxed text-ink-soft">
              لو عندك طلب إلغاء أو استرجاع، ابعته للإدارة برقم الحجز؛ الفريق بيراجعه وبيوضح لك الشروط قبل الاتفاق.
            </p>
            <Button asChild variant="outline" className="mt-6 rounded-full border-ink/20">
              <Link href="/contact">تواصل مع الدعم</Link>
            </Button>
          </div>
          <Accordion type="single" collapsible className="rounded-3xl border border-line bg-card px-6">
            {paymentFaq.map((item, index) => (
              <AccordionItem key={item.q} value={`p-${index}`} className="border-line">
                <AccordionTrigger className="text-start text-[15px] font-semibold text-ink hover:no-underline">{item.q}</AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed text-ink-soft">{item.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <section className="container pb-16">
        <Reveal>
          <div className="rounded-[2rem] bg-iris px-8 py-12 text-center text-white sm:px-14">
            <h2 className="text-3xl leading-tight sm:text-4xl">مش متأكد من الخطة؟ كلّمنا الأول</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-white/70">
              قولنا مستواك وهدفك، ونرشح لك الخطة أو الكورس الأنسب — من غير أي التزام.
            </p>
            <Button asChild className="mt-7 h-12 rounded-full bg-acid px-7 text-base font-semibold text-ink hover:bg-acid-deep">
              <Link href="/contact">اختار معانا الخطة المناسبة</Link>
            </Button>
          </div>
        </Reveal>
      </section>
    </PageShell>
  );
}
