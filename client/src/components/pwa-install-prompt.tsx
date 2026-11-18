import { useEffect, useState } from "react";
import { Download, X, Smartphone, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCompanion, CompanionAvatar } from "@/components/companion";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const { companion } = useCompanion();

  useEffect(() => {
    // Register Service Worker only in production; unregister stale ones in dev mode
    if ("serviceWorker" in navigator) {
      if (import.meta.env.PROD) {
        navigator.serviceWorker
          .register("/sw.js")
          .then(() => console.log("[PWA] Service Worker registered"))
          .catch((err) => console.warn("[PWA] Service Worker registration failed:", err));
      } else {
        navigator.serviceWorker.getRegistrations().then((regs) => {
          regs.forEach((reg) => reg.unregister());
        }).catch(() => {});
      }
    }

    // Check if already in standalone mode
    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true
    ) {
      setIsInstalled(true);
      return;
    }

    // Check if dismissed recently (within 3 days)
    const dismissedUntil = localStorage.getItem("linkme_pwa_dismissed_until");
    if (dismissedUntil && Number(dismissedUntil) > Date.now()) {
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Suppress for 3 days
    localStorage.setItem("linkme_pwa_dismissed_until", (Date.now() + 3 * 24 * 60 * 60 * 1000).toString());
  };

  if (!showPrompt || isInstalled) return null;

  return (
    <aside
      aria-label="تثبيت تطبيق Link Me"
      className="fixed bottom-20 left-4 right-4 z-40 mx-auto max-w-md animate-in fade-in slide-in-from-bottom-5 duration-300 md:bottom-6 md:left-auto md:right-6"
    >
      <div className="relative overflow-hidden rounded-2xl border border-iris/30 bg-card/95 p-4 shadow-2xl backdrop-blur-md">
        {/* Glow accent */}
        <div className="absolute -left-10 -top-10 size-24 rounded-full bg-iris/10 blur-xl pointer-events-none" />

        <div className="flex items-start gap-3">
          <CompanionAvatar size={42} className="shrink-0 ring-2 ring-iris/20 shadow-sm" />
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold text-iris">
                <Smartphone className="size-3.5" />
                تثبيت تطبيق Link Me
              </span>
              <button
                type="button"
                onClick={handleDismiss}
                className="text-ink-soft hover:text-ink transition-colors p-1"
                aria-label="إغلاق التنبيه"
              >
                <X className="size-4" />
              </button>
            </div>
            <p className="text-xs text-ink font-medium leading-relaxed">
              {companion.id === "khadija"
                ? "خلّي التطبيق على شاشتك عشان نذاكر سوا كل يوم وما تضيعيش الـ Streak! 🌸"
                : "ثبّت التطبيق على شاشتك عشان تفضل محافظ على الـ Streak وتعلّمك أسرع! 🔥"}
            </p>
            <div className="pt-2 flex items-center gap-2">
              <Button
                size="sm"
                onClick={handleInstallClick}
                className="h-8 gap-1.5 rounded-full bg-iris px-3.5 text-xs font-bold text-white shadow-md hover:bg-iris-deep"
              >
                <Download className="size-3.5" />
                تثبيت على جهازي
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDismiss}
                className="h-8 rounded-full text-xs text-ink-soft hover:text-ink"
              >
                لاحقاً
              </Button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
