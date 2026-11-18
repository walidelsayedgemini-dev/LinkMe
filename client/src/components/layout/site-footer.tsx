import type { ReactNode } from "react";
import { Link } from "wouter";
import { ArrowUpLeft } from "lucide-react";
import { Logo } from "@/components/brand";
import { WhatsAppIcon, openWhatsApp } from "@/components/whatsapp";

const COLUMNS = [
  {
    title: "رحلتك",
    links: [
      { label: "كل الكورسات", href: "/courses" },
      { label: "مسار الاستقلال اللغوي", href: "/path" },
      { label: "إنجليزي الأطفال", href: "/kids" },
      { label: "اختبار تحديد المستوى", href: "/level-test" },
    ],
  },
  {
    title: "عن Link Me",
    links: [
      { label: "عن المنصة", href: "/about" },
      { label: "طريقتنا", href: "/method" },
      { label: "أ. ياسين والمدرّسون", href: "/instructors" },
      { label: "الأسعار والحجز", href: "/pricing" },
      { label: "الأسئلة الشائعة", href: "/faq" },
    ],
  },
  {
    title: "حسابك",
    links: [
      { label: "تسجيل الدخول", href: "/login" },
      { label: "اعمل حسابك", href: "/signup" },
      { label: "لوحة التعلّم", href: "/dashboard" },
      { label: "واجباتي وتسليماتي", href: "/homework" },
      { label: "كلّم المدرّس", href: "/chat" },
      { label: "دخول المالك", href: "/owner" },
      { label: "تواصل معنا", href: "/contact" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="relative mt-16 sm:mt-20 border-t border-line bg-paper-deep pb-16 sm:pb-0">
      <div className="container grid gap-9 py-12 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-ink-soft">
            إنجليزي من غير ما تترجم.
            <br />
            شرح بالمصري، تدريب عملي، ومتابعة تخلّي كل خطوة ليها معنى.
          </p>
          <button
            type="button"
            onClick={() => openWhatsApp()}
            className="mt-5 inline-flex items-center gap-2 rounded-full border border-line bg-card px-4 py-2.5 text-xs font-semibold text-ink hover:border-iris"
          >
            <WhatsAppIcon className="size-4 text-[#138645]" />
            كلّمنا على واتساب <ArrowUpLeft className="size-3.5" />
          </button>
        </div>
        {COLUMNS.map(column => (
          <div key={column.title}>
            <h3 className="text-sm font-semibold text-ink">{column.title}</h3>
            <ul className="mt-5 space-y-3">
              {column.links.map(link => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-xs text-ink-soft hover:text-iris"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="container flex flex-col gap-2 border-t border-line py-5 text-[11px] text-ink-soft sm:flex-row sm:items-center sm:justify-between">
        <span>© {new Date().getFullYear()} Link Me · كل الحقوق محفوظة</span>
        <span>خطوة صغيرة. فرق كبير.</span>
      </div>
    </footer>
  );
}

/** Header lives outside the animated route, so it always stays fixed to the viewport. */
export function PageShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <main id="main-content" className="pt-[72px]">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
