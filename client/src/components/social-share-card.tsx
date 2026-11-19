import { useState, useRef, useEffect } from "react";
import {
  Share2,
  Download,
  Copy,
  Check,
  Flame,
  Trophy,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useGamification } from "@/components/gamification-badges";
import { getLevelInfo } from "@/lib/gamification";
import { soundEffects } from "@/lib/sound-effects";
import { cn } from "@/lib/utils";

export function SocialShareCardModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { user } = useAuth();
  const gamification = useGamification();
  const levelInfo = getLevelInfo(gamification.xp);
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const learnerName = user?.name || "بطل Link Me";

  const renderCardCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 1080 x 1920 (9:16 Story format)
    const W = 1080;
    const H = 1920;
    canvas.width = W;
    canvas.height = H;

    // Background Gradient
    const bgGrad = ctx.createLinearGradient(0, 0, W, H);
    bgGrad.addColorStop(0, "#091833");
    bgGrad.addColorStop(0.5, "#0e2452");
    bgGrad.addColorStop(1, "#1e1b4b");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Glowing Circles
    const drawGlow = (x: number, y: number, r: number, color: string) => {
      const g = ctx.createRadialGradient(x, y, 10, x, y, r);
      g.addColorStop(0, color);
      g.addColorStop(1, "transparent");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    };
    drawGlow(W * 0.8, H * 0.2, 400, "rgba(99, 102, 241, 0.35)");
    drawGlow(W * 0.2, H * 0.7, 500, "rgba(16, 185, 129, 0.25)");

    // Card Surface
    const pad = 80;
    const cardX = pad;
    const cardY = 160;
    const cardW = W - pad * 2;
    const cardH = H - 320;

    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
    ctx.shadowBlur = 60;
    ctx.fillStyle = "rgba(15, 30, 66, 0.75)";
    ctx.strokeStyle = "rgba(99, 102, 241, 0.4)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, 48);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // Link Me Header Logo
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 64px 'Cairo', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Link Me 🚀", W / 2, cardY + 120);

    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.font = "bold 34px 'Cairo', sans-serif";
    ctx.fillText("إنجليزي من غير ما تترجم", W / 2, cardY + 175);

    // Divider
    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cardX + 60, cardY + 230);
    ctx.lineTo(cardX + cardW - 60, cardY + 230);
    ctx.stroke();

    // User Avatar Badge Circle
    ctx.save();
    ctx.fillStyle = "#4f46e5";
    ctx.beginPath();
    ctx.arc(W / 2, cardY + 360, 85, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 80px sans-serif";
    ctx.fillText("🎓", W / 2, cardY + 390);

    // Learner Name
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 56px 'Cairo', sans-serif";
    ctx.fillText(learnerName, W / 2, cardY + 520);

    // Level Badge Pill
    const levelText = `المستوى ${levelInfo.level} • بطل Link Me`;
    ctx.save();
    ctx.fillStyle = "rgba(245, 158, 11, 0.2)";
    ctx.strokeStyle = "rgba(245, 158, 11, 0.7)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(W / 2 - 220, cardY + 560, 440, 70, 35);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#fbbf24";
    ctx.font = "bold 32px 'Cairo', sans-serif";
    ctx.fillText(levelText, W / 2, cardY + 606);
    ctx.restore();

    // 2 Big Stats Boxes (XP & Streak)
    const boxW = (cardW - 160) / 2;
    const boxY = cardY + 690;
    const boxH = 220;

    // XP Box
    ctx.fillStyle = "rgba(255, 255, 255, 0.06)";
    ctx.strokeStyle = "rgba(99, 102, 241, 0.3)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(cardX + 60, boxY, boxW, boxH, 32);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.font = "bold 30px 'Cairo', sans-serif";
    ctx.fillText("مجموع النقاط 🏆", cardX + 60 + boxW / 2, boxY + 70);
    ctx.fillStyle = "#38bdf8";
    ctx.font = "900 64px 'Cairo', sans-serif";
    ctx.fillText(`${gamification.xp} XP`, cardX + 60 + boxW / 2, boxY + 155);

    // Streak Box
    ctx.beginPath();
    ctx.roundRect(cardX + 60 + boxW + 40, boxY, boxW, boxH, 32);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.font = "bold 30px 'Cairo', sans-serif";
    ctx.fillText("حماس المذاكرة 🔥", cardX + 60 + boxW + 40 + boxW / 2, boxY + 70);
    ctx.fillStyle = "#f97316";
    ctx.font = "900 64px 'Cairo', sans-serif";
    ctx.fillText(`${gamification.streak} يوم`, cardX + 60 + boxW + 40 + boxW / 2, boxY + 155);

    // Achievement Statement
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 44px 'Cairo', sans-serif";
    ctx.fillText("“بتكلم إنجليزي بثقة وطلاقة من غير ترجمة!”", W / 2, cardY + 1010);

    ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
    ctx.font = "32px 'Cairo', sans-serif";
    ctx.fillText("تعال نافسني على دوري مسابقات Link Me اليومي ⚡", W / 2, cardY + 1070);

    // Call to Action footer
    ctx.fillStyle = "#10b981";
    ctx.font = "bold 36px 'Cairo', sans-serif";
    ctx.fillText("جرب مجاناً الآن: www.link-me.tech", W / 2, cardY + 1200);
  };

  useEffect(() => {
    if (open) {
      setTimeout(renderCardCanvas, 100);
    }
  }, [open, gamification.xp, gamification.streak]);

  const handleDownloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setGenerating(true);
    soundEffects.playClick();

    try {
      const dataUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `link-me-story-${learnerName}.png`;
      a.click();
      soundEffects.playTrophy();
      toast.success("تم تنزيل كارت الستوري بنجاح! 📸");
    } catch {
      toast.error("حدث خطأ أثناء تنزيل الصورة.");
    } finally {
      setGenerating(false);
    }
  };

  const shareText = `🚀 أنا بتعلم إنجليزي على Link Me ووصلت لـ ${gamification.xp} XP وشعلة ${gamification.streak} أيام! جرب الموقع مجاناً: https://www.link-me.tech`;

  const handleShareWhatsApp = () => {
    soundEffects.playClick();
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(url, "_blank");
  };

  const handleCopyLink = () => {
    soundEffects.playClick();
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    toast.success("تم نسخ رسالة التحدي للمشاركة!");
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md overflow-hidden rounded-3xl border border-line bg-card p-6 text-ink shadow-2xl">
        <DialogHeader className="text-center">
          <span className="inline-flex items-center justify-center gap-1.5 self-center rounded-full bg-iris-soft/40 px-3 py-1 text-xs font-bold text-iris">
            <Sparkles className="size-3.5" /> شارك فخرك وإنجازك 📱
          </span>
          <DialogTitle className="text-xl font-black">
            كارت الستوري وحالة واتساب
          </DialogTitle>
          <p className="text-xs text-ink-soft">
            صورة فخمة جاهزة بمستواك ونقاطك لمشاركتها مع أصحابك على واتساب وإنستجرام.
          </p>
        </DialogHeader>

        {/* Live Preview of Canvas Card */}
        <div className="relative my-3 flex justify-center overflow-hidden rounded-2xl border border-line bg-slate-950 p-2 shadow-inner">
          <canvas
            ref={canvasRef}
            className="h-[340px] w-auto rounded-xl object-contain shadow-md"
          />
        </div>

        {/* Action Buttons */}
        <div className="grid gap-2">
          <Button
            type="button"
            onClick={handleShareWhatsApp}
            className="w-full rounded-full bg-emerald-600 font-bold text-white shadow-md hover:bg-emerald-500"
          >
            <Share2 className="me-2 size-4" /> شارك على حالة واتساب 💬
          </Button>

          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleDownloadImage}
              disabled={generating}
              className="rounded-full text-xs font-bold"
            >
              <Download className="me-1.5 size-4" /> تحميل صورة PNG
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleCopyLink}
              className="rounded-full text-xs font-bold"
            >
              {copied ? (
                <>
                  <Check className="me-1.5 size-4 text-emerald-600" /> تم النسخ!
                </>
              ) : (
                <>
                  <Copy className="me-1.5 size-4" /> نسخ نص التحدي
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Standalone Quick Flex Trigger Button */
export function SocialShareCardButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          soundEffects.playClick();
          setOpen(true);
        }}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border border-iris/40 bg-iris-soft/30 px-3 py-1.5 text-xs font-bold text-iris transition hover:scale-105 active:scale-95 shadow-xs",
          className
        )}
      >
        <Share2 className="size-3.5" />
        <span>شارك إنجازك 📱</span>
      </button>

      <SocialShareCardModal open={open} onOpenChange={setOpen} />
    </>
  );
}
