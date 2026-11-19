import { useState, useEffect } from "react";
import { Download, Smartphone, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaInstallPrompt({ compact = false }: { compact?: boolean }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if running as installed PWA
    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true
    ) {
      setIsStandalone(true);
      return;
    }

    // Check iOS
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua);
    setIsIos(isIosDevice);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (isStandalone || dismissed) return null;
  // If not iOS and no beforeinstallprompt has fired yet, show a clean generic mobile prompt
  const canPrompt = Boolean(deferredPrompt);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setDeferredPrompt(null);
      }
    } else if (isIos) {
      setShowIosGuide(true);
    }
  };

  if (compact) {
    return (
      <div className="rounded-2xl border border-iris/25 bg-iris/5 p-3 dark:bg-iris/10">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="grid size-8 place-items-center rounded-xl bg-iris text-white shadow-xs">
              <Smartphone className="size-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-ink">تطبيق Link Me للهاتف</p>
              <p className="text-[10px] text-ink-soft">شاشة كاملة وتنبيهات يومية</p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={handleInstallClick}
            className="h-8 rounded-full bg-iris px-3 text-xs font-bold text-white shadow-xs hover:bg-iris-deep"
          >
            تثبيت 📲
          </Button>
        </div>
        {showIosGuide && (
          <div className="mt-2.5 rounded-xl border border-line bg-card p-2.5 text-xs text-ink-soft">
            <div className="flex items-start justify-between">
              <p className="font-semibold text-ink">على أجهزة iPhone / iPad:</p>
              <button onClick={() => setShowIosGuide(false)} className="text-ink-soft hover:text-ink">
                <X className="size-3.5" />
              </button>
            </div>
            <p className="mt-1 leading-relaxed text-[11px]">
              اضغط على زر المشاركة <span className="font-bold text-iris">⎋</span> في أسفل متصفح Safari، ثم اختر <span className="font-bold text-iris">إضافة إلى الصفحة الرئيسية ⊞</span>.
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-sky-400/30 bg-gradient-to-r from-sky-500/10 via-iris/10 to-indigo-500/10 p-3.5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="grid size-9 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-iris to-blue-600 text-white shadow-sm">
          <Download className="size-4" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-ink sm:text-sm">
            ثبّت Link Me كتطبيق على شاشة هاتفك
          </h4>
          <p className="text-[11px] text-ink-soft">
            تعلّم أسرع بشاشة كاملة وبدون استهلاك مساحة، مع وصول فوري للتمارين اليومية.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          onClick={handleInstallClick}
          className="rounded-full bg-iris px-4 text-xs font-bold text-white shadow-sm hover:bg-iris-deep"
        >
          {isIos ? "طريقة التثبيت 📲" : "تثبيت الآن ✨"}
        </Button>
        <button
          onClick={() => setDismissed(true)}
          className="grid size-7 place-items-center rounded-full text-ink-soft hover:bg-line/40 hover:text-ink"
          aria-label="إغلاق التنبيه"
        >
          <X className="size-4" />
        </button>
      </div>
      {showIosGuide && (
        <div className="w-full rounded-xl border border-line bg-card p-3 text-xs text-ink-soft">
          <div className="flex items-start justify-between">
            <p className="font-bold text-ink">طريقة التثبيت على أجهزة iPhone / iPad:</p>
            <button onClick={() => setShowIosGuide(false)} className="text-ink-soft hover:text-ink">
              <X className="size-3.5" />
            </button>
          </div>
          <p className="mt-1.5 leading-relaxed text-[11px]">
            1. اضغط على أيقونة المشاركة <span className="font-bold text-iris">⎋ (Share)</span> في متصفح Safari.<br />
            2. انزل للأسفل واضغط على <span className="font-bold text-iris">إضافة إلى الصفحة الرئيسية ⊞ (Add to Home Screen)</span>.<br />
            3. اضغط "إضافة" وستظهر أيقونة المنصة على شاشة هاتفك مباشرة!
          </p>
        </div>
      )}
    </div>
  );
}
