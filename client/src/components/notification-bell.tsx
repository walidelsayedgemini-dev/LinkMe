import { useState } from "react";
import { Bell, CheckCheck, Megaphone, Sparkles, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export function NotificationBell({ className }: { className?: string }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const utils = trpc.useUtils();

  const { data } = trpc.community.myAnnouncements.useQuery(undefined, {
    enabled: Boolean(user),
    refetchInterval: 60_000,
  });

  const markRead = trpc.community.markAnnouncementsRead.useMutation({
    onSuccess: () => {
      void utils.community.myAnnouncements.invalidate();
    },
  });

  if (!user) return null;

  const items = data?.items ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  const handleOpen = () => {
    setOpen(true);
    const unreadIds = items.filter(i => !i.isRead).map(i => i.id);
    if (unreadIds.length > 0) {
      markRead.mutate({ ids: unreadIds });
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        aria-label="الإشعارات والإعلانات"
        title="إشعارات الأكاديمية والفصل"
        className={cn(
          "relative grid size-9 sm:size-10 shrink-0 place-items-center rounded-full border border-line bg-card text-ink-soft transition hover:border-iris hover:text-iris",
          className
        )}
      >
        <Bell className="size-[17px] sm:size-[18px]" />
        {unreadCount > 0 && (
          <span className="latin absolute -top-1 -end-1 grid min-w-[18px] h-[18px] place-items-center rounded-full bg-destructive px-1 text-[10px] font-black text-white shadow-sm">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent dir="rtl" className="max-w-md bg-card text-ink">
          <DialogHeader className="text-start">
            <DialogTitle className="flex items-center gap-2">
              <Megaphone className="size-5 text-iris" />
              إشعارات وإعلانات Link Me
            </DialogTitle>
            <DialogDescription>
              آخر التنبيهات من إدارة الأكاديمية ومواعيد فصلك الدراسي.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[60vh] space-y-2.5 overflow-y-auto pe-1">
            {items.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-line bg-paper-deep/40 p-8 text-center text-xs text-ink-soft">
                مفيش إعلانات جديدة دلوقتي — أول ما ينزل إعلان أو ميعاد جلسة
                هيظهرلك هنا فوراً! 🔔
              </div>
            ) : (
              items.map(item => (
                <div
                  key={item.id}
                  className={cn(
                    "rounded-2xl border p-4 transition",
                    item.priority === "urgent"
                      ? "border-destructive/40 bg-destructive/5"
                      : item.priority === "celebration"
                        ? "border-amber-400/50 bg-amber-500/10"
                        : "border-line bg-paper-deep/40"
                  )}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      {item.priority === "urgent" ? (
                        <AlertCircle className="size-4 text-destructive" />
                      ) : item.priority === "celebration" ? (
                        <Sparkles className="size-4 text-amber-500" />
                      ) : (
                        <Megaphone className="size-4 text-iris" />
                      )}
                      <h4 className="text-sm font-bold text-ink">
                        {item.title}
                      </h4>
                    </div>
                    {item.targetGroupName && (
                      <span className="rounded-full bg-iris-soft px-2 py-0.5 text-[10px] font-bold text-iris">
                        🏫 {item.targetGroupName}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 whitespace-pre-line text-xs leading-relaxed text-ink-soft">
                    {item.body}
                  </p>
                  <p className="mt-2 text-[10px] text-ink-soft/80">
                    {formatDateTime(item.createdAt)}
                  </p>
                </div>
              ))
            )}
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            className="w-full rounded-full"
          >
            <CheckCheck className="me-1.5 size-4 text-emerald-600" /> تمام
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
