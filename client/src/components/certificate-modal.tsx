import { useEffect, useRef, useState } from "react";
import {
  Award,
  Download,
  ExternalLink,
  Loader2,
  Printer,
  QrCode,
  Share2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import QRCode from "qrcode";
import { Link } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCompanion, CompanionAvatar } from "@/components/companion";
import { soundEffects } from "@/lib/sound-effects";
import { trpc } from "@/lib/trpc";
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
  const [certId, setCertId] = useState<string>("");
  const [isVerifiedInDb, setIsVerifiedInDb] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const certRef = useRef<HTMLDivElement>(null);
  const issuedOnceRef = useRef(false);
  const { companion } = useCompanion();

  const issueMutation = trpc.certificates.issue.useMutation({
    onSuccess: data => {
      setCertId(data.code);
      setIsVerifiedInDb(true);
    },
    onError: () => {
      // Fallback code if offline so preview still renders
      if (!certId) {
        const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        let fallback = "LM-";
        for (let i = 0; i < 8; i++) {
          fallback += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setCertId(fallback);
      }
    },
  });

  // Auto-issue a real verifiable certificate in DB when modal opens
  useEffect(() => {
    if (!open) return;
    if (issuedOnceRef.current && certId) return;
    issuedOnceRef.current = true;
    issueMutation.mutate({
      studentName: studentName.trim() || defaultStudentName,
      courseTitle,
      levelTitle,
      scorePercentage,
    });
  }, [open]);

  const verifyUrl =
    typeof window !== "undefined" && certId
      ? `${window.location.origin}/verify/${certId}`
      : certId
        ? `https://www.link-me.tech/verify/${certId}`
        : "";

  // Generate crisp QR Code whenever verifyUrl changes
  useEffect(() => {
    if (!verifyUrl) return;
    let active = true;
    QRCode.toDataURL(verifyUrl, {
      width: 220,
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#0f172a", light: "#ffffff" },
    })
      .then(url => {
        if (active) setQrDataUrl(url);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [verifyUrl]);

  const currentDate = new Intl.DateTimeFormat("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date());

  const handleSaveName = () => {
    const clean = studentName.trim();
    if (clean.length < 2) {
      toast.error("اكتب اسمك بشكل واضح (حرفين على الأقل)");
      return;
    }
    setIsEditing(false);
    issueMutation.mutate(
      {
        existingCode: certId || undefined,
        studentName: clean,
        courseTitle,
        levelTitle,
        scorePercentage,
      },
      {
        onSuccess: () => {
          soundEffects.playCorrect();
          toast.success("تم حفظ اسمك وتوثيق الشهادة في سجل Link Me الرسمي ✓");
        },
      }
    );
  };

  const handlePrint = () => {
    soundEffects.playClick();
    window.print();
  };

  const handleDownloadImage = async () => {
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
    ctx.fillRect(1164 - cornerSize, 804 - cornerSize, cornerSize, cornerSize);

    // Academy header
    ctx.fillStyle = "#92400e";
    ctx.font = "bold 20px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("LINK ME ENGLISH ACADEMY", 600, 105);

    // Title
    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 44px serif";
    ctx.fillText("CERTIFICATE OF ACHIEVEMENT", 600, 170);

    // Arabic title
    ctx.fillStyle = "#475569";
    ctx.font = "bold 22px 'IBM Plex Sans Arabic', sans-serif";
    ctx.fillText("شهادة إتمام وتفوق معتمدة", 600, 215);

    // Subtitle
    ctx.fillStyle = "#64748b";
    ctx.font = "16px sans-serif";
    ctx.fillText("THIS IS PROUDLY PRESENTED TO", 600, 275);

    // Student Name
    ctx.fillStyle = "#4338ca";
    ctx.font = "bold 46px serif";
    ctx.fillText(studentName, 600, 345);

    // Underline
    ctx.strokeStyle = "#d97706";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(350, 365);
    ctx.lineTo(850, 365);
    ctx.stroke();

    // Body text
    ctx.fillStyle = "#334155";
    ctx.font = "20px 'IBM Plex Sans Arabic', sans-serif";
    ctx.fillText(`تقديراً لإتمامه بنجاح متطلبات «${courseTitle}»`, 600, 425);
    ctx.fillText(
      `واجتياز تقييم الكفاءة اللغوية بنسبة تفوق ${scorePercentage}% وفق المعايير الأوروبية`,
      600,
      462
    );

    // Level Badge
    ctx.fillStyle = "#fef3c7";
    ctx.beginPath();
    if ((ctx as any).roundRect) {
      (ctx as any).roundRect(380, 495, 440, 46, [23]);
    } else {
      ctx.rect(380, 495, 440, 46);
    }
    ctx.fill();
    ctx.strokeStyle = "#d97706";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = "#78350f";
    ctx.font = "bold 18px sans-serif";
    ctx.fillText(`★  ${levelTitle}  ★`, 600, 524);

    // Signature (Left)
    ctx.fillStyle = "#0f172a";
    ctx.font = "italic bold 24px serif";
    ctx.fillText("Walid Elsayed", 260, 665);
    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(160, 682);
    ctx.lineTo(360, 682);
    ctx.stroke();
    ctx.fillStyle = "#64748b";
    ctx.font = "16px 'IBM Plex Sans Arabic', sans-serif";
    ctx.fillText("مدير الأكاديمية", 260, 712);

    // Golden Seal (Center)
    ctx.fillStyle = "#f59e0b";
    ctx.beginPath();
    ctx.arc(600, 660, 48, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#78350f";
    ctx.font = "bold 13px sans-serif";
    ctx.fillText("OFFICIAL", 600, 655);
    ctx.fillText("VERIFIED", 600, 672);

    ctx.fillStyle = "#334155";
    ctx.font = "bold 14px monospace";
    ctx.fillText(certId || "LM-VERIFIED", 600, 732);
    ctx.fillStyle = "#64748b";
    ctx.font = "13px sans-serif";
    ctx.fillText(`Verify: link-me.tech/verify/${certId}`, 600, 756);

    // Date & QR Code (Right)
    if (qrDataUrl) {
      await new Promise<void>(resolve => {
        const qrImg = new Image();
        qrImg.onload = () => {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(928, 578, 124, 124);
          ctx.strokeStyle = "#d97706";
          ctx.lineWidth = 2;
          ctx.strokeRect(928, 578, 124, 124);
          ctx.drawImage(qrImg, 934, 584, 112, 112);
          ctx.fillStyle = "#64748b";
          ctx.font = "12px sans-serif";
          ctx.fillText("Scan to Verify", 990, 720);
          ctx.font = "13px 'IBM Plex Sans Arabic', sans-serif";
          ctx.fillText(currentDate, 990, 744);
          resolve();
        };
        qrImg.onerror = () => resolve();
        qrImg.src = qrDataUrl;
      });
    }

    // Download image
    const link = document.createElement("a");
    link.download = `LinkMe-Certificate-${certId || "official"}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    soundEffects.playTrophy();
    toast.success("تم تنزيل الشهادة الرسمية مع QR Code التحقق بنجاح! 🎓📸");
  };

  const handleShare = async () => {
    soundEffects.playClick();
    const shareText = `🎓 حصلت على شهادة موثقة لـ «${courseTitle}» من أكاديمية Link Me!\nكود التحقق الرسمي: ${certId}\nرابط التحقق: ${verifyUrl}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "شهادة إتمام موثقة — Link Me",
          text: shareText,
          url: verifyUrl,
        });
        toast.success("تمت المشاركة بنجاح!");
      } catch {
        // Cancelled
      }
    } else {
      await navigator.clipboard.writeText(shareText);
      toast.success("تم نسخ رابط التحقق الرسمي للشهادة للمشاركة على واتساب أو لينكد إن!");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl overflow-y-auto max-h-[92vh] p-4 sm:p-6 bg-paper print:m-0 print:p-0 print:border-none print:shadow-none">
        <DialogHeader className="print:hidden">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Award className="size-6 text-amber-500" />
              <DialogTitle className="text-lg font-bold">
                الشهادة الرقمية المعتمدة
              </DialogTitle>
            </div>
            <div className="flex items-center gap-2">
              {isVerifiedInDb ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                  <ShieldCheck className="size-3.5" /> موثقة برقم رسمي
                </span>
              ) : issueMutation.isPending ? (
                <span className="inline-flex items-center gap-1 text-[11px] text-ink-soft">
                  <Loader2 className="size-3.5 animate-spin" /> جارٍ التوثيق...
                </span>
              ) : null}
              <CompanionAvatar size={32} />
            </div>
          </div>
          <DialogDescription className="text-xs text-ink-soft">
            شهادتك الرسمية من أكاديمية Link Me مسجلة في قاعدة البيانات مع QR Code للتحقق الفوري
          </DialogDescription>
        </DialogHeader>

        {/* Name Customizer Banner */}
        <div className="print:hidden flex flex-wrap items-center justify-between gap-2 rounded-xl bg-card border border-line p-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-ink">الاسم على الشهادة:</span>
            {isEditing ? (
              <Input
                value={studentName}
                onChange={e => setStudentName(e.target.value)}
                className="h-8 w-52 text-xs font-bold"
                placeholder="اكتب اسمك الثلاثي"
                autoFocus
                onKeyDown={e => {
                  if (e.key === "Enter") handleSaveName();
                }}
              />
            ) : (
              <span className="font-bold text-iris text-sm">{studentName}</span>
            )}
          </div>
          {isEditing ? (
            <Button
              size="sm"
              onClick={handleSaveName}
              disabled={issueMutation.isPending}
              className="h-7 text-xs rounded-full bg-iris text-white"
            >
              {issueMutation.isPending ? "جاري الحفظ..." : "حفظ وتوثيق الاسم"}
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsEditing(true)}
              className="h-7 text-xs rounded-full"
            >
              تعديل الاسم
            </Button>
          )}
        </div>

        {/* Printable Certificate Design */}
        <div
          ref={certRef}
          id="linkme-certificate"
          className="relative overflow-hidden rounded-2xl border-8 border-double border-amber-600/40 bg-gradient-to-br from-amber-50/70 via-white to-amber-50/50 p-5 sm:p-10 text-center shadow-2xl dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 dark:border-amber-500/40"
          dir="ltr"
        >
          {/* Decorative Corner Filigrees */}
          <div className="absolute top-2 left-2 size-10 sm:size-12 border-t-2 border-l-2 border-amber-500/60 pointer-events-none" />
          <div className="absolute top-2 right-2 size-10 sm:size-12 border-t-2 border-r-2 border-amber-500/60 pointer-events-none" />
          <div className="absolute bottom-2 left-2 size-10 sm:size-12 border-b-2 border-l-2 border-amber-500/60 pointer-events-none" />
          <div className="absolute bottom-2 right-2 size-10 sm:size-12 border-b-2 border-r-2 border-amber-500/60 pointer-events-none" />

          {/* Watermark Logo */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
            <Award className="size-96 text-amber-900" />
          </div>

          <div className="relative z-10 space-y-4">
            {/* Header Badge */}
            <div className="flex items-center justify-center gap-2">
              <span className="h-px w-10 sm:w-12 bg-amber-500/50" />
              <span className="text-[11px] sm:text-xs uppercase tracking-[0.22em] font-bold text-amber-700 dark:text-amber-400">
                Link Me English Academy
              </span>
              <span className="h-px w-10 sm:w-12 bg-amber-500/50" />
            </div>

            <h1 className="text-xl sm:text-3xl font-extrabold tracking-wider text-slate-900 dark:text-white font-serif">
              CERTIFICATE OF ACHIEVEMENT
            </h1>
            <p
              className="text-xs sm:text-sm font-arabic font-medium text-slate-600 dark:text-slate-400"
              dir="rtl"
            >
              شهادة إتمام وتفوق معتمدة
            </p>

            <div className="pt-1 text-[11px] text-slate-500 uppercase tracking-widest">
              This is proudly presented to
            </div>

            {/* Recipient Name */}
            <div className="py-1">
              <div className="inline-block border-b-2 border-amber-600/60 pb-1 px-6 sm:px-8">
                <span className="text-2xl sm:text-4xl font-extrabold text-iris-deep dark:text-iris font-serif">
                  {studentName}
                </span>
              </div>
            </div>

            {/* Description */}
            <p
              className="max-w-xl mx-auto text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-arabic"
              dir="rtl"
            >
              تقديراً لإتمامه بنجاح متطلبات{" "}
              <span className="font-bold text-slate-900 dark:text-white">
                «{courseTitle}»
              </span>{" "}
              واجتياز تقييم الكفاءة اللغوية بنسبة تفوق{" "}
              <span className="font-bold text-iris">{scorePercentage}%</span> وفق
              الإطار الأوروبي المرجعي (CEFR).
            </p>

            <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-100/80 px-4 py-1 text-xs font-bold text-amber-900 dark:bg-amber-950/60 dark:text-amber-200">
              <Sparkles className="size-3.5 text-amber-600" />
              <span>{levelTitle}</span>
            </div>

            {/* Bottom Signatures, Gold Seal & Live Scannable QR Code */}
            <div className="pt-5 grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-2 items-center text-xs">
              <div className="space-y-1 text-center">
                <div className="h-9 flex items-center justify-center">
                  <span className="font-serif italic font-bold text-slate-800 dark:text-slate-200 text-base">
                    Walid Elsayed
                  </span>
                </div>
                <div className="border-t border-slate-300 dark:border-slate-700 pt-1 font-arabic text-[11px] text-slate-500">
                  مدير الأكاديمية · {currentDate}
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
                <span className="mt-1.5 font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300 tracking-wider">
                  {certId || "..."}
                </span>
              </div>

              {/* Scannable QR Code for /verify/:code */}
              <div className="flex flex-col items-center justify-center">
                {qrDataUrl ? (
                  <a
                    href={verifyUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="group rounded-xl border-2 border-amber-500/50 bg-white p-1.5 shadow-sm transition hover:scale-105"
                    title="امسح الـ QR Code أو اضغط للتحقق الرسمي"
                  >
                    <img
                      src={qrDataUrl}
                      alt={`QR Code للتحقق من الشهادة ${certId}`}
                      className="size-20 sm:size-24"
                    />
                  </a>
                ) : (
                  <div className="size-20 rounded-xl border border-dashed border-slate-300 grid place-items-center text-slate-400">
                    <QrCode className="size-8" />
                  </div>
                )}
                <span className="mt-1 text-[10px] font-medium text-slate-500">
                  Scan to Verify · link-me.tech
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Companion Encouragement Footer */}
        <div className="print:hidden rounded-xl bg-iris/5 border border-iris/20 p-3 flex items-center gap-3">
          <CompanionAvatar size={36} />
          <p className="text-xs text-ink leading-relaxed font-medium">
            {companion.id === "khadija"
              ? "مبسوطة بيكي أوي! شهادتك اتوثقت رسمياً بـ QR Code تقدري تشاركيها في الـ CV وعلى لينكد إن 🌸🎓"
              : "كده اللعب ع الكبار يا بطل! شهادتك اتوثقت رسمياً بـ QR Code، نزّلها صورة أو شارك رابط التحقق! 🔥🚀"}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="print:hidden flex flex-wrap items-center justify-between gap-2 pt-1">
          {certId ? (
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="h-9 gap-1.5 rounded-full text-xs font-bold text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-400"
            >
              <Link href={`/verify/${certId}`} onClick={() => onOpenChange(false)}>
                <ExternalLink className="size-3.5" />
                فتح صفحة التحقق الرسمية
              </Link>
            </Button>
          ) : (
            <div />
          )}

          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={handleDownloadImage}
              className="h-9 gap-1.5 rounded-full bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700 shadow-md"
            >
              <Download className="size-3.5" />
              تحميل صورة + QR (PNG)
            </Button>
            <Button
              onClick={handleShare}
              variant="outline"
              className="h-9 gap-1.5 rounded-full text-xs font-semibold"
            >
              <Share2 className="size-3.5" />
              مشاركة رابط التحقق
            </Button>
            <Button
              onClick={handlePrint}
              variant="outline"
              className="h-9 gap-1.5 rounded-full border-iris text-iris text-xs font-bold hover:bg-iris/10"
            >
              <Printer className="size-3.5" />
              طباعة / PDF
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
