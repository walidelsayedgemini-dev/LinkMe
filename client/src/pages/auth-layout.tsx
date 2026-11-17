import { useState, type InputHTMLAttributes, type ReactNode } from "react";
import { Link } from "wouter";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  Moon,
  Phone,
  Sparkles,
  Sun,
  User,
} from "lucide-react";
import { Logo, LogoMark, LogoWord } from "@/components/brand";
import { YassinAvatar } from "@/components/yassin";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import "./auth.css";

const PANEL_POINTS = [
  "ابدأ من المستوى المناسب ليك",
  "تقدّمك بيتحفظ تلقائيًا",
  "خطوات واضحة من غير زحمة",
];

export function getSafeNext(value: string | null, fallback = "/dashboard") {
  return value && value.startsWith("/") && !value.startsWith("//")
    ? value
    : fallback;
}

function ThemeButton() {
  const { theme, toggleTheme } = useTheme();
  if (!toggleTheme) return null;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={
        theme === "dark" ? "تفعيل الوضع النهاري" : "تفعيل الوضع الليلي"
      }
      title={theme === "dark" ? "الوضع النهاري" : "الوضع الليلي"}
      className="grid size-10 place-items-center rounded-full border border-line bg-card text-ink-soft transition-colors hover:border-iris hover:text-iris"
    >
      {theme === "dark" ? (
        <Sun className="size-[18px]" />
      ) : (
        <Moon className="size-[18px]" />
      )}
    </button>
  );
}

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
  badge,
}: {
  title: ReactNode;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
  badge?: string;
}) {
  return (
    <main
      dir="rtl"
      className="auth-shell min-h-dvh bg-paper text-ink lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(420px,0.9fr)]"
    >
      <section className="auth-form-side relative flex min-h-dvh flex-col px-5 py-5 sm:px-10 sm:py-7 lg:px-16 xl:px-24">
        <div className="flex items-center justify-between gap-4">
          <Logo />
          <div className="flex items-center gap-3">
            <Link
              href="/contact"
              className="hidden text-xs text-ink-soft underline-offset-4 transition-colors hover:text-ink hover:underline sm:block"
            >
              محتاج مساعدة؟
            </Link>
            <ThemeButton />
          </div>
        </div>

        <div className="mx-auto flex w-full max-w-[470px] flex-1 flex-col justify-center py-10 sm:py-14">
          <div className="auth-form-card animate-pop rounded-[1.75rem] border border-line bg-card p-6 shadow-[0_30px_80px_-58px_rgba(10,27,51,0.55)] sm:p-9">
            {badge && (
              <span className="mb-5 inline-flex items-center gap-1.5 rounded-full bg-iris-soft px-3 py-1.5 text-[11px] font-semibold text-iris">
                <Sparkles className="size-3.5" /> {badge}
              </span>
            )}
            <h1 className="max-w-[16ch] text-[2rem] leading-[1.25] tracking-[-0.03em] text-ink sm:text-[2.45rem]">
              {title}
            </h1>
            <p className="mt-3 max-w-[42ch] text-sm leading-8 text-ink-soft sm:text-[15px]">
              {subtitle}
            </p>
            <div className="mt-7">{children}</div>
            {footer && (
              <div className="mt-7 border-t border-line pt-5 text-sm leading-7 text-ink-soft">
                {footer}
              </div>
            )}
          </div>

          <div className="mt-5 flex items-center gap-3 rounded-2xl border border-line bg-card/80 p-3.5 shadow-[0_18px_40px_-38px_rgba(10,27,51,0.65)]">
            <YassinAvatar size={42} className="auth-guide-avatar" />
            <p className="text-xs leading-6 text-ink-soft">
              <span className="font-semibold text-ink">ياسين</span> · مساعد
              افتراضي في الرحلة — هيساعدك تبدأ من الخطوة المناسبة.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 text-xs text-ink-soft">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 transition-colors hover:text-ink"
          >
            <ArrowLeft className="size-3.5 rotate-180" /> رجوع للرئيسية
          </Link>
          <span className="hidden sm:inline">
            © {new Date().getFullYear()} Link Me
          </span>
        </div>
      </section>

      <aside className="auth-brand-panel relative hidden overflow-hidden bg-navy text-white lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
        <div aria-hidden className="auth-panel-grid absolute inset-0" />
        <div aria-hidden className="auth-panel-orbit auth-panel-orbit-one" />
        <div aria-hidden className="auth-panel-orbit auth-panel-orbit-two" />

        <div className="relative flex items-center justify-between gap-5">
          <div className="flex items-center gap-2.5">
            <LogoMark tone="solid" animated={false} className="size-11" />
            <LogoWord invert className="text-[25px]" />
          </div>
          <span className="rounded-full border border-white/15 px-3.5 py-1.5 text-[11px] text-white/65">
            Link Me
          </span>
        </div>

        <div className="relative max-w-[510px] py-14">
          <div className="mb-8 grid size-24 place-items-center rounded-[1.8rem] border border-white/15 bg-white/[0.07] shadow-[0_28px_70px_-35px_rgba(37,99,255,0.9)] transition-transform duration-500 hover:-translate-y-1 hover:rotate-[-3deg]">
            <LogoMark tone="solid" animated={false} className="size-16" />
          </div>
          <p className="serif-accent text-2xl text-[#a9c4ff]">
            Speak it, don&apos;t translate it.
          </p>
          <h2 className="mt-4 max-w-[12ch] text-[3.2rem] leading-[1.18] font-semibold tracking-[-0.04em] text-white">
            الإنجليزي يبقى <span className="auth-panel-highlight">أسهل</span>{" "}
            لما تمشي بخطوة واضحة.
          </h2>
          <p className="mt-6 max-w-[40ch] text-[15px] leading-8 text-white/65">
            مساحة هادئة تراجع فيها اللي اتعلمته، تعرف خطوتك الجاية، وتكمّل من
            غير ما تبدأ من الصفر كل مرة.
          </p>

          <div className="mt-9 grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            {PANEL_POINTS.map((point, index) => (
              <div
                key={point}
                className="rounded-2xl border border-white/10 bg-white/[0.055] p-4 text-[13px] leading-6 text-white/75 transition-transform duration-300 hover:-translate-y-1"
              >
                <div className="mb-4 grid size-7 place-items-center rounded-full bg-[#8fb4ff]/15 text-xs font-bold text-[#bcd2ff]">
                  {String(index + 1).padStart(2, "0")}
                </div>
                {point}
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex items-center justify-between gap-4 border-t border-white/10 pt-5 text-xs text-white/45">
          <span>اتعلّم على مهلك، وكمل على طريقتك.</span>
          <CheckCircle2 className="size-4 text-[#8fb4ff]" aria-hidden />
        </div>
      </aside>
    </main>
  );
}

export function Field({
  label,
  children,
  hint,
  aside,
}: {
  label: string;
  children: ReactNode;
  hint?: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-ink">{label}</span>
        {aside}
      </span>
      {children}
      {hint && (
        <span className="block text-xs leading-5 text-ink-soft">{hint}</span>
      )}
    </label>
  );
}

type AuthInputProps = InputHTMLAttributes<HTMLInputElement> & {
  icon?: "mail" | "lock" | "user" | "phone";
  invalid?: boolean;
};

export function AuthInput({
  icon,
  invalid,
  className,
  type = "text",
  dir: inputDir,
  ...props
}: AuthInputProps) {
  const [visible, setVisible] = useState(false);
  const isPassword = type === "password";
  const fieldDir = inputDir ?? (["email", "tel", "password"].includes(type) ? "ltr" : "auto");
  const Icon =
    icon === "mail"
      ? Mail
      : icon === "lock"
        ? Lock
        : icon === "user"
          ? User
          : icon === "phone"
            ? Phone
            : null;

  return (
    <div
      dir={fieldDir}
      className={cn(
        "auth-field-row flex h-13 w-full items-center gap-2 rounded-xl border bg-paper px-3.5 text-ink transition-colors focus-within:ring-4 focus-within:ring-iris/15",
        invalid
          ? "border-destructive focus-within:border-destructive"
          : "border-line focus-within:border-iris"
      )}
    >
      {Icon && (
        <span
          className="grid size-5 shrink-0 place-items-center text-ink-soft/70"
          aria-hidden
        >
          <Icon className="size-4" />
        </span>
      )}
      <input
        {...props}
        dir={fieldDir}
        type={isPassword && visible ? "text" : type}
        className={cn(
          "min-w-0 flex-1 border-0 bg-transparent text-[15px] text-ink outline-none placeholder:text-ink-soft/50",
          className
        )}
      />
      {isPassword && (
        <button
          type="button"
          onClick={() => setVisible(value => !value)}
          className="grid size-8 shrink-0 place-items-center rounded-lg text-ink-soft transition-colors hover:bg-ink/5 hover:text-ink"
          aria-label={visible ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      )}
    </div>
  );
}

export function AuthError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <div className="flex items-start gap-2 rounded-xl border border-destructive/25 bg-destructive/5 px-3.5 py-2.5 text-xs leading-relaxed text-destructive">
      <AlertCircle className="mt-0.5 size-3.5 shrink-0" /> {message}
    </div>
  );
}

export function SubmitButton({
  pending,
  children,
  pendingLabel,
}: {
  pending: boolean;
  children: ReactNode;
  pendingLabel?: string;
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-iris px-5 text-[15px] font-semibold text-white shadow-[0_16px_30px_-18px_var(--color-iris)] transition-all hover:-translate-y-0.5 hover:bg-iris-deep disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending && <Loader2 className="size-4 animate-spin" />}
      {pending ? (pendingLabel ?? "لحظة…") : children}
    </button>
  );
}

export function PasswordStrength({ value }: { value: string }) {
  const score = [/.{8,}/, /[A-Za-z]/, /\d/, /[^A-Za-z0-9]/].filter(re =>
    re.test(value)
  ).length;
  const level =
    value.length === 0
      ? 0
      : score <= 1
        ? 1
        : score === 2
          ? 2
          : score === 3
            ? 3
            : 4;
  const labels = ["", "ضعيفة", "متوسطة", "جيدة", "قوية"];
  const colors = [
    "",
    "bg-destructive",
    "bg-amber-500",
    "bg-iris",
    "bg-emerald-500",
  ];
  return (
    <div className="mt-1.5">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map(index => (
          <span
            key={index}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors",
              index <= level ? colors[level] : "bg-ink/10"
            )}
          />
        ))}
      </div>
      {value.length > 0 && (
        <p className="mt-1 text-[11px] text-ink-soft">
          قوة كلمة المرور: {labels[level]}
        </p>
      )}
    </div>
  );
}

export function SocialDivider() {
  return (
    <div className="my-5 flex items-center gap-3 text-[11px] text-ink-soft">
      <span className="h-px flex-1 bg-line" />
      أو
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}

export const inputClass =
  "h-13 w-full rounded-xl border border-line bg-paper px-3.5 text-[15px] text-ink placeholder:text-ink-soft/50 focus:border-iris focus:outline-none focus:ring-4 focus:ring-iris/15";
