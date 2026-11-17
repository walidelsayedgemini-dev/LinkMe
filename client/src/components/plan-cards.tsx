import { useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/format";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { BookingButton } from "@/components/booking";

export function PlanCards({ compact = false }: { compact?: boolean }) {
  const [cycle, setCycle] = useState<"monthly" | "yearly">("monthly");
  const { data: plans, isLoading } = trpc.billing.plans.useQuery();

  if (isLoading) {
    return (
      <div className="grid gap-5 md:grid-cols-3">
        {[0, 1, 2].map(index => (
          <div
            key={index}
            className="h-80 animate-pulse rounded-3xl bg-card/70"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-center">
        <div className="inline-flex items-center rounded-full border border-ink/15 bg-card p-1">
          <button
            onClick={() => setCycle("monthly")}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition-colors",
              cycle === "monthly" ? "bg-iris text-white" : "text-ink-soft"
            )}
          >
            شهريًا
          </button>
          <button
            onClick={() => setCycle("yearly")}
            className={cn(
              "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
              cycle === "yearly" ? "bg-iris text-white" : "text-ink-soft"
            )}
          >
            سنويًا
            <span className="rounded-full bg-acid px-2 py-0.5 text-[10px] font-bold text-ink">
              اختار مدة اشتراكك
            </span>
          </button>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {(plans ?? []).filter(plan => plan.priceMonthlyCents > 0).map(plan => {
          const price =
            cycle === "monthly"
              ? plan.priceMonthlyCents
              : plan.priceYearlyCents;
          const highlighted = plan.highlighted;
          return (
            <div
              key={plan.id}
              className={cn(
                "plan-card group relative flex h-full flex-col rounded-3xl border p-7 transition-colors duration-300",
                highlighted
                  ? "border-iris bg-iris text-white shadow-[0_24px_60px_-40px_var(--color-iris)]"
                  : "border-line bg-card hover:border-iris/60"
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <h3
                  className={cn(
                    "text-xl font-bold",
                    highlighted ? "text-white" : "text-ink"
                  )}
                >
                  {plan.nameAr}
                </h3>
                {highlighted && (
                  <span className="rounded-full bg-white/20 px-3 py-1 text-[11px] font-bold text-white backdrop-blur">
                    الأكثر اختيارًا
                  </span>
                )}
              </div>
              <p
                className={cn(
                  "mt-1 text-sm",
                  highlighted ? "text-white/70" : "text-ink-soft"
                )}
              >
                {plan.tagline}
              </p>
              <div className="mt-6 flex items-end gap-1.5">
                <span
                  dir={price === 0 ? undefined : "ltr"}
                  className={cn(
                    price === 0
                      ? "text-4xl"
                      : "latin text-[2.6rem] leading-none",
                    "font-bold",
                    highlighted ? "text-white" : "text-ink"
                  )}
                >
                  {formatPrice(price)}
                </span>
                <span
                  className={cn(
                    "pb-1 text-xs",
                    highlighted ? "text-white/60" : "text-ink-soft"
                  )}
                >
                  {price === 0
                    ? ""
                    : cycle === "monthly"
                      ? "/ شهريًا"
                      : "/ سنويًا"}
                </span>
              </div>
              {!compact && plan.featureList.length > 0 && (
                <ul className="mt-6 space-y-3">
                  {plan.featureList.map(feature => (
                    <li
                      key={feature}
                      className="flex items-start gap-2.5 text-sm"
                    >
                      <span
                        className={cn(
                          "mt-0.5 grid size-4 shrink-0 place-items-center rounded-full",
                          highlighted
                            ? "bg-acid text-ink"
                            : "bg-acid/60 text-ink"
                        )}
                      >
                        <Check className="size-3" strokeWidth={3} />
                      </span>
                      <span
                        className={
                          highlighted ? "text-white/85" : "text-ink-soft"
                        }
                      >
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              {(

                <BookingButton
                  label={`احجز ${plan.nameAr}`}
                  courseTitle={plan.nameAr}
                  planSlug={plan.slug}
                  cycle={cycle}
                  eyebrow="حجز الاشتراك"
                  className={cn(
                    "mt-7 h-11 w-full rounded-full text-sm font-semibold",
                    highlighted
                      ? "bg-acid text-ink hover:bg-acid-deep"
                      : "bg-iris text-white hover:bg-iris-deep"
                  )}
                  packages={[
                    {
                      id: cycle,
                      title: `${plan.nameAr} — ${cycle === "monthly" ? "شهري" : "سنوي"}`,
                      priceCents: price,
                      currency: "EGP",
                    },
                  ]}
                />
              )}
            </div>
          );
        })}
      </div>
      <p className="text-center text-xs text-ink-soft">
        الأسعار بالجنيه المصري · تأكيد الحجز والدفع بالتواصل على واتساب
      </p>
    </div>
  );
}
