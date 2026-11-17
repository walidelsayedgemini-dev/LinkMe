import { useRef, useState } from "react";
import { Award, Download, Printer, Share2, Sparkles, CheckCircle2, ShieldCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCompanion, CompanionAvatar } from "@/components/companion";
import { soundEffects } from "@/lib/sound-effects";
import { toast } from "sonner";

interface CertificateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultStudentName?: string;
  courseTitle?: string;
  levelTitle?: string;
  scorePercentage?: number;
}

export function CertificateModal({
  open,
  onOpenChange,
  defaultStudentName = "بطل Link Me",
  courseTitle = "دورة التحدث بالإنجليزية وإتقان المحادثة",
  levelTitle = "Level B1 — Intermediate Independent User",
  scorePercentage = 88,
}: CertificateModalProps) {
  const [studentName, setStudentName] = useState(defaultStudentName);
  const [isEditing, setIsEditing] = useState(false);
  const certRef = useRef<HTMLDivElement>(null);
  const { companion } = useCompanion();

  // Stable random certificate ID
  const [certId] = useState(() => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "LM-";
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  });

  const currentDate = new Intl.DateTimeFormat("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date());

  const handlePrint = () => {
    soundEffects.playClick();
    window.print();
  };

  const handleDownloadImage = () => {
    soundEffects.playClick();
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 840;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      toast.error("حدث خطأ أثناء إنشاء الصورة");
      return;
    }

    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 1200, 840);
    bgGrad.addColorStop(0, "#fcfbf7");
    bgGrad.addColorStop(0.5, "#ffffff");
    bgGrad.addColorStop(1, "#f9f6ee");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1200, 840);

    // Double borders
    ctx.strokeStyle = "#d97706";
    ctx.lineWidth = 14;
    ctx.strokeRect(20, 20, 1160, 800);

    ctx.strokeStyle = "#b45309";
    ctx.lineWidth = 3;
    ctx.strokeRect(36, 36, 1128, 768);

    // Filigree corners
    ctx.fillStyle = "#d97706";
    const cornerSize = 24;
    ctx.fillRect(36, 36, cornerSize, cornerSize);
    ctx.fillRect(1164 - cornerSize, 36, cornerSize, cornerSize);
    ctx.fillRect(36, 804 - cornerSize, cornerSize, cornerSize);
    ctx.fillRect(1164 - cornerSize, 804 - cornerSize, cornerSize);

    // Academy header
    ctx.fillStyle = "#92400e";
    ctx.font = "bold 20px sans-serif";
    ctx.textAlign = "center";
    ctx.letterSpacing = "6px";
    ctx.fillText("LINK ME ENGLISH ACADEMY", 600, 110);

    // Title
    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 44px serif";
    ctx.letterSpacing = "2px";
    ctx.fillText("CERTIFICATE OF ACHIEVEMENT", 600, 180);

    // Arabic title
    ctx.fillStyle = "#475569";
    ctx.font = "bold 22px 'IBM Plex Sans Arabic', sans-serif";
    ctx.letterSpacing = "0px";
    ctx.fillText("شهادة إتمام وتفوق معتمدة", 600, 225);

    // Subtitle
    ctx.fillStyle = "#64748b";
    ctx.font = "16px sans-serif";
    ctx.fillText("THIS IS PROUDLY PRESENTED TO", 600, 290);

    // Student Name
    ctx.fillStyle = "#4338ca";
    ctx.font = "bold 46px serif";
    ctx.fillText(studentName, 600, 365);

    // Underline
    ctx.strokeStyle = "#d97706";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(350, 385);
    ctx.lineTo(850, 385);
    ctx.stroke();

    // Body text
    ctx.fillStyle = "#334155";
    ctx.font = "20px 'IBM Plex Sans Arabic', sans-serif";
    ctx.fillText(`تقديراً لإتمامه بنجاح متطلبات «${courseTitle}»`, 600, 445);
    ctx.fillText(`واجتياز تقييم الكفاءة اللغوية بنسبة تفوق ${scorePercentage}% وفق المعايير الأوروبية`, 600, 485);

    // Level Badge
    ctx.fillStyle = "#fef3c7";
    ctx.beginPath();
    ctx.roundRect(400, 525, 400, 45, [22]);
    ctx.fill();
    ctx.strokeStyle = "#d97706";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = "#78350f";
    ctx.font = "bold 18px sans-serif";
    ctx.fillText(`★  ${levelTitle}  ★`, 600, 554);

    // Signatures
    ctx.fillStyle = "#0f172a";
    ctx.font = "italic bold 22px serif";
    ctx.fillText("Omar Elsayed", 300, 680);
    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(200, 695);
    ctx.lineTo(400, 695);
    ctx.stroke();
    ctx.fillStyle = "#64748b";
    ctx.font = "16px 'IBM Plex Sans Arabic', sans-serif";
    ctx.fillText("المشرف الأكاديمي", 300, 725);

    // Golden Seal in center
    ctx.fillStyle = "#f59e0b";
    ctx.beginPath();
    ctx.arc(600, 690, 48, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#78350f";
    ctx.font = "bold 13px sans-serif";
    ctx.fillText("OFFICIAL", 600, 685);
    ctx.fillText("VERIFIED", 600, 702);

    ctx.fillStyle = "#64748b";
    ctx.font = "12px monospace";
    ctx.fillText(certId, 600, 755);

    // Date
    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 18px sans-serif";
    ctx.fillText(currentDate, 900, 680);
    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(800, 695);
    ctx.lineTo(1000, 695);
    ctx.stroke();
    ctx.fillStyle = "#64748b";
    ctx.font = "16px 'IBM Plex Sans Arabic', sans-serif";
    ctx.fillText("تاريخ الاعتماد", 900, 725);

    // Download image
    const link = document.createElement("a");
    link.download = `LinkMe-Certificate-${certId}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    soundEffects.playTrophy();
    toast.success("تم تنزيل الشهادة كصورة عالية الجودة بنجاح! 🎓📸");
  };

  const handleShare = async () => {
    soundEffects.playClick();
    const shareText = `🎓 حصلت على شهادة إتمام ${courseTitle} من منصة Link Me! كود التحقق: ${certId}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "شهادة إتمام معتمدة — Link Me",
          text: shareText,
          url: window.location.origin,
        });
        toast.success("تمت المشاركة بنجاح!");
      } catch {
        // User cancelled share
      }
    } else {
      await navigator.clipboard.writeText(`${shareText}\n${window.location.origin}`);
      toast.success("تم نسخ تفاصيل الشهادة للمشاركة على واتساب أو لينكد إن!");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl overflow-y-auto max-h-[92vh] p-4 sm:p-6 bg-paper print:m-0 print:p-0 print:border-none print:shadow-none">
        <DialogHeader className="print:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="size-6 text-amber-500" />
              <DialogTitle className="text-lg font-bold">الشهادة الرقمية المعتمدة</DialogTitle>
            </div>
            <div className="flex items-center gap-2">
              <CompanionAvatar size={32} />
              <span className="text-xs font-semibold text-ink-soft">
                {companion.id === "khadija" ? "مبارك يا سكرة! 🌸" : "عاش يا وحش! 🔥"}
              </span>
            </div>
          </div>
          <DialogDescription className="text-xs text-ink-soft">
            شهادتك الرسمية من أكاديمية Link Me موثقة برقم تحقق حصري
          </DialogDescription>
        </DialogHeader>

        {/* Name Customizer Banner */}
        <div className="print:hidden flex flex-wrap items-center justify-between gap-2 rounded-xl bg-card border border-line p-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-ink">الاسم على الشهادة:</span>
            {isEditing ? (
              <Input
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                className="h-8 w-48 text-xs font-bold"
                placeholder="اكتب اسمك الثلاثي"
                autoFocus
              />
            ) : (
              <span className="font-bold text-iris text-sm">{studentName}</span>
            )}
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsEditing(!isEditing)}
            className="h-7 text-xs rounded-full"
          >
            {isEditing ? "تأكيد الاسم" : "تعديل الاسم"}
          </Button>
        </div>

        {/* The Printable Certificate Design */}
        <div
          ref={certRef}
          id="linkme-certificate"
          className="relative overflow-hidden rounded-2xl border-8 border-double border-amber-600/40 bg-gradient-to-br from-amber-50/70 via-white to-amber-50/50 p-6 sm:p-10 text-center shadow-2xl dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 dark:border-amber-500/40"
          dir="ltr"
        >
          {/* Decorative Corner Filigrees */}
          <div className="absolute top-2 left-2 size-12 border-t-2 border-l-2 border-amber-500/60 pointer-events-none" />
          <div className="absolute top-2 right-2 size-12 border-t-2 border-r-2 border-amber-500/60 pointer-events-none" />
          <div className="absolute bottom-2 left-2 size-12 border-b-2 border-l-2 border-amber-500/60 pointer-events-none" />
          <div className="absolute bottom-2 right-2 size-12 border-b-2 border-r-2 border-amber-500/60 pointer-events-none" />

          {/* Watermark Logo */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
            <Award className="size-96 text-amber-900" />
          </div>

          <div className="relative z-10 space-y-4">
            {/* Header Badge */}
            <div className="flex items-center justify-center gap-2">
              <span className="h-px w-12 bg-amber-500/50" />
              <span className="text-xs uppercase tracking-[0.25em] font-bold text-amber-700 dark:text-amber-400">
                Link Me English Academy
              </span>
              <span className="h-px w-12 bg-amber-500/50" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-wider text-slate-900 dark:text-white font-serif">
              CERTIFICATE OF ACHIEVEMENT
            </h1>
            <p className="text-xs sm:text-sm font-arabic font-medium text-slate-600 dark:text-slate-400" dir="rtl">
              شهادة إتمام وتفوق معتمدة
            </p>

            <div className="pt-2 text-xs text-slate-500 uppercase tracking-widest">
              This is proudly presented to
            </div>

            {/* Recipient Name */}
            <div className="py-2">
              <div className="inline-block border-b-2 border-amber-600/60 pb-1 px-8">
                <span className="text-2xl sm:text-4xl font-extrabold text-iris-deep dark:text-iris font-serif">
                  {studentName}
                </span>
              </div>
            </div>

            {/* Description */}
            <p className="max-w-xl mx-auto text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-arabic" dir="rtl">
              تقديراً لإتمامه بنجاح متطلبات <span className="font-bold text-slate-900 dark:text-white">«{courseTitle}»</span> واجتياز تقييم الكفاءة اللغوية بنسبة تفوق <span className="font-bold text-iris">{scorePercentage}%</span> وفق الإطار الأوروبي المرجعي (CEFR).
            </p>

            <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-100/80 px-4 py-1 text-xs font-bold text-amber-900 dark:bg-amber-950/60 dark:text-amber-200">
              <Sparkles className="size-3.5 text-amber-600" />
              <span>{levelTitle}</span>
            </div>

            {/* Bottom Signatures & Seal */}
            <div className="pt-6 grid grid-cols-3 items-end text-xs">
              <div className="space-y-1 text-center">
                <div className="h-10 flex items-center justify-center">
                  <span className="font-serif italic font-bold text-slate-800 dark:text-slate-200 text-base">
                    Omar Elsayed
                  </span>
                </div>
                <div className="border-t border-slate-300 dark:border-slate-700 pt-1 font-arabic text-[11px] text-slate-500">
                  المشرف الأكاديمي
                </div>
              </div>

              {/* Gold Ribbon Seal */}
              <div className="flex flex-col items-center">
                <div className="relative size-16 sm:size-20 rounded-full bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-500 p-0.5 shadow-xl flex items-center justify-center">
                  <div className="size-full rounded-full border border-dashed border-amber-900/30 flex flex-col items-center justify-center bg-gradient-to-b from-amber-400 to-yellow-500 text-amber-950 font-bold text-[9px] uppercase tracking-tighter shadow-inner">
                    <ShieldCheck className="size-5 sm:size-6 text-amber-900 mb-0.5" />
                    <span>VERIFIED</span>
                  </div>
                </div>
                <span className="mt-1 font-mono text-[10px] text-slate-500 tracking-wider">
                  {certId}
                </span>
              </div>

              <div className="space-y-1 text-center font-arabic">
                <div className="h-10 flex items-center justify-center font-medium text-slate-700 dark:text-slate-300 text-xs">
                  {currentDate}
                </div>
                <div className="border-t border-slate-300 dark:border-slate-700 pt-1 text-[11px] text-slate-500">
                  تاريخ الاعتماد
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Companion Encouragement Footer */}
        <div className="print:hidden rounded-xl bg-iris/5 border border-iris/20 p-3 flex items-center gap-3">
          <CompanionAvatar size={36} />
          <p className="text-xs text-ink leading-relaxed font-medium">
            {companion.id === "khadija"
              ? "مبسوطة بيكي أوي ومستنياكي تكملي الكورس اللي بعده كمان عشان نشيل شهادات أكتر! 🌸🎓"
              : "كده اللعب ع الكبار يا صاحبي! نزل الشهادة وابعتها ع الواتساب أو شاركها وخلّي الكل يشوف مجهودك! 🔥🚀"}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="print:hidden flex flex-wrap items-center justify-end gap-2 pt-2">
          <Button
            onClick={handleDownloadImage}
            className="h-9 gap-1.5 rounded-full bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700 shadow-md"
          >
            <Download className="size-3.5" />
            تحميل كصورة (PNG)
          </Button>
          <Button
            onClick={handleShare}
            variant="outline"
            className="h-9 gap-1.5 rounded-full text-xs font-semibold"
          >
            <Share2 className="size-3.5" />
            مشاركة الشهادة
          </Button>
          <Button
            onClick={handlePrint}
            variant="outline"
            className="h-9 gap-1.5 rounded-full border-iris text-iris text-xs font-bold hover:bg-iris/10"
          >
            <Printer className="size-3.5" />
            طباعة أو حفظ كـ PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
