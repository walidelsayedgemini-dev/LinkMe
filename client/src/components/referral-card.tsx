import { useState } from "react";
import { Check, Copy, Gift, MessageCircle, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

export function ReferralCard({ className }: { className?: string }) {
  const { data, isLoading } = trpc.community.myReferral.useQuery();
  const [copied, setCopied] = useState(false);

  if (isLoading || !data) return null;

  const shareMessage = `أهلاً! أنا بتعلم إنجليزي على منصة Link Me بطريقة ممتعة جداً وفيها مسابقات وفلاش كاردز وشهادات معتمدة 🔥\nسجّل من رابط الدعوة بتاعي وهتاخد +100 نقطة XP هدية فورية:\n${data.shareUrl}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(data.shareUrl);
      setCopied(true);
      toast.success("تم نسخ رابط الدعوة الخاص بيك 📋");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("تعذّر النسخ");
    }
  };

  return (
    <div
      className={cn(
        "rounded-2xl border border-amber-400/40 bg-gradient-to-br from-amber-500/10 via-card to-iris/5 p-5",
        className
      )}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-0.5 text-xs font-bold text-amber-700 dark:text-amber-300">
            <Gift className="size-3.5" /> ادعُ صاحبك واكسب +150 XP
          </div>
          <h3 className="text-base font-bold text-ink">
            شارك رابطك مع صحابك واكسبوا سوا! 🎁
          </h3>
          <p className="text-xs leading-relaxed text-ink-soft">
            أي صديق يسجّل من رابطك بياخد{" "}
            <b className="text-ink">+100 XP هدية ترحيب</b> وأنت بتكسب{" "}
            <b className="text-iris">+150 XP فورية</b> تزقّك لصدارة المسابقات!
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <div className="rounded-xl border border-line bg-card px-3 py-2 text-center">
            <p className="latin text-lg font-black text-iris">
              {data.invitedCount}
            </p>
            <p className="text-[10px] text-ink-soft">أصدقاء انضموا</p>
          </div>
          <div className="rounded-xl border border-line bg-card px-3 py-2 text-center">
            <p className="latin text-lg font-black text-amber-600 dark:text-amber-400">
              +{data.totalBonusXp}
            </p>
            <p className="text-[10px] text-ink-soft">XP مكتسبة</p>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          readOnly
          value={data.shareUrl}
          dir="ltr"
          className="latin h-10 flex-1 rounded-xl border border-line bg-paper px-3 text-xs font-medium text-ink outline-none"
        />
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleCopy}
            className="h-10 rounded-xl px-4 text-xs font-bold"
          >
            {copied ? (
              <>
                <Check className="me-1.5 size-3.5 text-emerald-600" /> تم النسخ
              </>
            ) : (
              <>
                <Copy className="me-1.5 size-3.5" /> نسخ الرابط
              </>
            )}
          </Button>
          <Button
            asChild
            className="h-10 rounded-xl bg-[#16A34A] px-4 text-xs font-bold text-white hover:bg-[#15803D]"
          >
            <a
              href={`https://wa.me/?text=${encodeURIComponent(shareMessage)}`}
              target="_blank"
              rel="noreferrer"
            >
              <MessageCircle className="me-1.5 size-3.5" /> ابعت على واتساب
            </a>
          </Button>
        </div>
      </div>

      {data.invitedFriends.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px] text-ink-soft">
          <Users className="size-3.5 text-iris" />
          <span>أصدقاؤك المنضمون:</span>
          {data.invitedFriends.slice(0, 8).map(friend => (
            <span
              key={friend.id}
              className="rounded-full bg-paper-deep px-2.5 py-0.5 font-semibold text-ink"
            >
              {friend.firstName} (+{friend.rewardXp} XP)
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
