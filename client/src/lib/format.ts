export const LEVELS = [
  { value: "beginner", label: "مبتدئ" },
  { value: "intermediate", label: "متوسط" },
  { value: "advanced", label: "متقدم" },
  { value: "all", label: "كل المستويات" },
] as const;

export function levelLabel(level: string): string {
  return LEVELS.find(item => item.value === level)?.label ?? level;
}

export function formatPrice(cents: number, currency = "EGP", freeLabel = true): string {
  if (cents === 0 && freeLabel) return "مجاني";
  const amount = cents / 100;
  const symbol = currency === "USD" ? "$" : currency === "EGP" ? "ج.م" : currency;
  const formatted = Number.isInteger(amount) ? amount.toString() : amount.toFixed(2);
  return currency === "EGP" ? `${formatted} ${symbol}` : `${symbol}${formatted}`;
}

export function formatHours(hours: number): string {
  return `${hours} ساعة`;
}

export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} دقيقة`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} ساعة و${rest} دقيقة` : `${hours} ساعة`;
}

export function formatMinutesShort(minutes: number): string {
  if (minutes < 60) return `${minutes} دقيقة`;
  const hours = minutes / 60;
  const rounded = hours >= 10 ? Math.round(hours) : Math.round(hours * 10) / 10;
  return `${rounded} ساعة`;
}

export function formatCount(value: number): string {
  if (value >= 1000) {
    const short = value / 1000;
    return `${short % 1 === 0 ? short.toFixed(0) : short.toFixed(1)} ألف`;
  }
  return value.toString();
}

export function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("ar-EG", { day: "numeric", month: "long", year: "numeric" }).format(date);
}

export function formatDateTime(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("ar-EG", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function initials(name: string | null | undefined): string {
  if (!name) return "؟";
  const parts = name.trim().split(/\s+/);
  return parts.slice(0, 2).map(part => part[0]).join("");
}

export const ACCENTS: Record<string, { bg: string; text: string; ring: string; solid: string }> = {
  sky: { bg: "bg-acid", text: "text-ink", ring: "border-acid-deep", solid: "#4f7cff" },
  cobalt: { bg: "bg-iris-soft", text: "text-iris", ring: "border-iris/40", solid: "#2563ff" },
  deep: { bg: "bg-coral-soft", text: "text-coral", ring: "border-coral/40", solid: "#1a4fd6" },
  navy: { bg: "bg-navy", text: "text-white", ring: "border-navy", solid: "#0f2a5c" },
};

export function accentOf(value: string | null | undefined) {
  return ACCENTS[value ?? "cobalt"] ?? ACCENTS.cobalt;
}
