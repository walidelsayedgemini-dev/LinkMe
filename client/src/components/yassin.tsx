import { cn } from "@/lib/utils";

/** ياسين — المساعد الافتراضي للرحلة: شخصية 3D بترافق الطالب في الاختبارات والكورسات. */
export const YASSIN_NAME = "ياسين";
export const YASSIN_ROLE = "مساعدك في الرحلة";

export function YassinAvatar({ size = 48, className }: { size?: number; className?: string }) {
  return (
    <span
      className={cn("yassin-avatar relative inline-grid shrink-0 place-items-center rounded-full", className)}
      style={{ width: size, height: size }}
    >
      <span
        aria-hidden
        className="absolute inset-[-3px] rounded-full bg-[conic-gradient(from_140deg,#7cc8ff,#3b6bff,#8ad8ff,#3b6bff,#7cc8ff)] opacity-90"
      />
      <span aria-hidden className="absolute inset-0 rounded-full bg-card shadow-[0_14px_30px_-16px_rgba(37,99,235,0.8)]" />
      <img
        src="/img/yassin-avatar.jpg"
        alt={`${YASSIN_NAME} — ${YASSIN_ROLE}`}
        className="relative size-[calc(100%-5px)] rounded-full object-cover"
        style={{ objectPosition: "50% 22%" }}
        loading="lazy"
      />
      <span className="absolute -bottom-0.5 -end-0.5 size-3 rounded-full border-2 border-white bg-emerald-500" />
    </span>
  );
}

export function YassinSays({
  message,
  hint,
  className,
  size = 52,
}: {
  message: React.ReactNode;
  hint?: React.ReactNode;
  className?: string;
  size?: number;
}) {
  return (
    <div className={cn("flex items-start gap-3", className)}>
      <YassinAvatar size={size} className="animate-float-sm" />
      <div className="relative flex-1 rounded-2xl rounded-ss-sm border border-line bg-card px-4 py-3 shadow-[0_18px_40px_-30px_rgba(10,27,51,0.55)]">
        <p className="text-[11px] font-semibold text-iris">
          {YASSIN_NAME} <span className="font-normal text-ink-soft">· {YASSIN_ROLE}</span>
        </p>
        <p className="mt-1 text-sm leading-relaxed text-ink">{message}</p>
        {hint ? <p className="mt-1.5 text-xs leading-relaxed text-ink-soft">{hint}</p> : null}
      </div>
    </div>
  );
}

/** Big avatar composition: orbiting ring, name chip and speech bubble. */
export function YassinHero({
  message,
  hint,
  className,
}: {
  message: React.ReactNode;
  hint?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("relative overflow-hidden rounded-3xl border border-line bg-card p-6 text-center", className)}>
      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_-10%,#dff1ff_0%,transparent_65%)] dark:bg-[radial-gradient(120%_90%_at_50%_-10%,#1b3563_0%,transparent_65%)]" />
      <div aria-hidden className="absolute inset-0 notebook-grid opacity-40" />

      <div className="relative mx-auto grid size-[190px] place-items-center">
        <span aria-hidden className="yassin-orbit absolute inset-0 rounded-full border border-iris/25" />
        <span aria-hidden className="absolute inset-4 rounded-full bg-iris/10 blur-xl" />
        <YassinAvatar size={150} className="yassin-bob relative" />
        <span className="absolute -bottom-1 start-1/2 -translate-x-1/2 rounded-full bg-iris px-3 py-1 text-[11px] font-bold text-white shadow-lg rtl:translate-x-1/2">
          {YASSIN_NAME}
        </span>
      </div>

      <div className="relative mt-5">
        <p className="text-base font-bold text-ink">{message}</p>
        {hint ? <p className="mx-auto mt-1.5 max-w-sm text-xs leading-relaxed text-ink-soft">{hint}</p> : null}
      </div>
    </div>
  );
}
