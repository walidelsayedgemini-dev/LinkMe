import { useState } from "react";
import { Megaphone, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { inputClass } from "@/pages/auth-layout";

export function AnnouncementsManager() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.community.adminListAnnouncements.useQuery();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [targetGroupId, setTargetGroupId] = useState<string>("");
  const [priority, setPriority] = useState<"info" | "urgent" | "celebration">(
    "info"
  );

  const create = trpc.community.adminCreateAnnouncement.useMutation({
    onSuccess: async () => {
      toast.success("تم إرسال الإعلان للطلبة فوراً 🔔");
      setTitle("");
      setBody("");
      setTargetGroupId("");
      setPriority("info");
      await utils.community.adminListAnnouncements.invalidate();
      await utils.community.myAnnouncements.invalidate();
    },
    onError: err => toast.error(err.message),
  });

  const remove = trpc.community.adminDeleteAnnouncement.useMutation({
    onSuccess: async () => {
      toast.success("تم حذف الإعلان");
      await utils.community.adminListAnnouncements.invalidate();
    },
    onError: err => toast.error(err.message),
  });

  const items = data?.items ?? [];
  const groups = data?.groups ?? [];

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
      {/* Compose Broadcast */}
      <div className="rounded-2xl border border-line bg-card p-5">
        <h2 className="flex items-center gap-2 text-base font-bold text-ink">
          <Megaphone className="size-5 text-iris" /> إرسال إعلان جديد للطلبة
        </h2>
        <p className="mt-1 text-xs text-ink-soft">
          يظهر فوراً في جرس الإشعارات 🔔 لكل الطلبة أو لفصل دراسي محدد.
        </p>

        <div className="mt-4 space-y-3.5">
          <div>
            <Label className="mb-1 block text-xs">عنوان الإعلان</Label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="مثال: جلسة محادثة مجانية يوم الجمعة الساعة 8!"
              className={inputClass}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label className="mb-1 block text-xs">الجمهور المستهدف</Label>
              <select
                value={targetGroupId}
                onChange={e => setTargetGroupId(e.target.value)}
                className={inputClass}
              >
                <option value="">🌍 كل الطلبة</option>
                {groups.map(g => (
                  <option key={g.id} value={g.id}>
                    🏫 فصل: {g.name} ({g.level})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label className="mb-1 block text-xs">نوع الإعلان</Label>
              <select
                value={priority}
                onChange={e =>
                  setPriority(
                    e.target.value as "info" | "urgent" | "celebration"
                  )
                }
                className={inputClass}
              >
                <option value="info">📢 معلومة / تنبيه عادي</option>
                <option value="urgent">🚨 عاجل ومهم</option>
                <option value="celebration">🎉 تهنئة / عرض ومسابقة</option>
              </select>
            </div>
          </div>

          <div>
            <Label className="mb-1 block text-xs">نص الإعلان</Label>
            <Textarea
              rows={4}
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="اكتب التفاصيل والرابط أو الميعاد…"
            />
          </div>

          <Button
            type="button"
            disabled={
              create.isPending || title.trim().length < 2 || body.trim().length < 3
            }
            onClick={() =>
              create.mutate({
                title: title.trim(),
                body: body.trim(),
                targetGroupId: targetGroupId ? Number(targetGroupId) : null,
                priority,
              })
            }
            className="w-full rounded-full bg-iris font-bold text-white hover:bg-iris-deep"
          >
            <Send className="me-2 size-4" />
            {create.isPending ? "جارٍ الإرسال…" : "نشر الإعلان الآن"}
          </Button>
        </div>
      </div>

      {/* Sent Announcements History */}
      <div className="space-y-3 rounded-2xl border border-line bg-card p-5">
        <h3 className="text-sm font-bold text-ink">
          الإعلانات المنشورة ({items.length})
        </h3>

        {isLoading ? (
          <p className="py-6 text-center text-xs text-ink-soft">
            جارٍ التحميل…
          </p>
        ) : items.length === 0 ? (
          <p className="rounded-xl bg-paper-deep/50 py-8 text-center text-xs text-ink-soft">
            لم تنشر أي إعلانات بعد.
          </p>
        ) : (
          <div className="space-y-2.5">
            {items.map(item => (
              <div
                key={item.id}
                className={cn(
                  "rounded-xl border p-4",
                  item.priority === "urgent"
                    ? "border-destructive/30 bg-destructive/5"
                    : item.priority === "celebration"
                      ? "border-amber-400/40 bg-amber-500/10"
                      : "border-line bg-paper-deep/40"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-bold text-ink">{item.title}</p>
                      <span className="rounded-full bg-iris-soft px-2 py-0.5 text-[10px] font-bold text-iris">
                        {item.targetGroupName}
                      </span>
                    </div>
                    <p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-ink-soft">
                      {item.body}
                    </p>
                    <p className="mt-1.5 text-[10px] text-ink-soft/75">
                      {formatDateTime(item.createdAt)}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => remove.mutate({ id: item.id })}
                    className="grid size-8 shrink-0 place-items-center rounded-full border border-line text-ink-soft hover:border-destructive hover:text-destructive"
                    title="حذف الإعلان"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
