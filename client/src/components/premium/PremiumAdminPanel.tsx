import { useMemo, useState } from "react";
import {
  CheckCircle2,
  ChevronLeft,
  Filter,
  RefreshCw,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import { ASSESSMENT_LEVELS, type AssessmentLevel } from "@shared/assessment";
import type { PremiumStatus } from "@shared/premium";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  PremiumActivatePicker,
  PremiumCoachSelect,
  PremiumOwnerFeedback,
} from "./PremiumOwnerTools";
import { PremiumActivationDialog } from "./PremiumActivationDialog";

const STATUS_LABELS: Record<PremiumStatus, string> = {
  active: "نشطة",
  paused: "موقوفة",
  cancelled: "ملغاة",
};

export function PremiumAdminPanel({ userId }: { userId?: number }) {
  const [status, setStatus] = useState<"" | PremiumStatus>("");
  const [level, setLevel] = useState<"" | AssessmentLevel>("");
  const [activationTarget, setActivationTarget] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(userId ?? null);
  const utils = trpc.useUtils();
  const members = trpc.premium.members.useQuery();
  const detail = trpc.premium.student.useQuery(
    { userId: selectedId ?? 0 },
    { enabled: selectedId !== null }
  );
  const assignCoach = trpc.premium.assignCoach.useMutation({
    onSuccess: async () => {
      toast.success("اتحدّث تعيين المرشد");
      await utils.premium.members.invalidate();
    },
    onError: error => toast.error(error.message),
  });
  const filtered = useMemo(
    () =>
      (members.data ?? []).filter(
        member =>
          (!userId || member.userId === userId) &&
          (!status ||
            (member.status === status &&
              (status !== "active" || member.active))) &&
          (!level || member.levels.includes(level))
      ),
    [members.data, userId, status, level]
  );
  return (
    <section
      className="premium-admin-panel"
      aria-labelledby="premium-admin-title"
    >
      <div className="premium-section-heading">
        <div>
          <p className="premium-kicker">إدارة يدوية</p>
          <h2 id="premium-admin-title">عضويات خطة الإتقان</h2>
          <p className="premium-muted">
            راجع الدفع والحالة والتقدم. التعيين هنا على عضوية محددة، مش تغيير
            لدور الحساب.
          </p>
        </div>
        <Filter className="premium-section-icon" aria-hidden="true" />
      </div>
      {!userId && (
        <PremiumActivatePicker
          onChoose={student => {
            setSelectedId(student.id);
            setActivationTarget(student);
          }}
        />
      )}
      <div className="premium-filter-bar">
        <label>
          <span>الحالة</span>
          <select
            value={status}
            onChange={event => setStatus(event.target.value as typeof status)}
          >
            <option value="">كل الحالات</option>
            {(Object.keys(STATUS_LABELS) as PremiumStatus[]).map(item => (
              <option key={item} value={item}>
                {STATUS_LABELS[item]}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>المستوى</span>
          <select
            value={level}
            onChange={event => setLevel(event.target.value as typeof level)}
          >
            <option value="">كل المستويات</option>
            {ASSESSMENT_LEVELS.map(item => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="premium-members-list">
        {members.isLoading && (
          <div
            className="premium-loading-block"
            aria-label="جارٍ تحميل العضويات"
          />
        )}
        {members.isError && (
          <div className="premium-empty space-y-3">
            <p>تعذّر تحميل العضويات دلوقتي.</p>
            <Button
              type="button"
              variant="outline"
              onClick={() => void members.refetch()}
            >
              <RefreshCw className="me-2 size-4" /> إعادة المحاولة
            </Button>
          </div>
        )}
        {!members.isLoading && !members.isError && filtered.length === 0 && (
          <p className="premium-empty">مفيش عضويات مطابقة للفلاتر.</p>
        )}
        {filtered.map(member => {
          const isSelected = selectedId === member.userId;
          const student = member.student;
          return (
            <article
              key={member.id}
              className={cn(
                "premium-member-row",
                isSelected && "premium-member-row-selected"
              )}
            >
              <button
                type="button"
                className="premium-member-main"
                onClick={() => setSelectedId(isSelected ? null : member.userId)}
                aria-expanded={isSelected}
              >
                <span className="premium-avatar">
                  {(student?.name ?? "؟").slice(0, 1)}
                </span>
                <span className="min-w-0 flex-1 text-start">
                  <strong>{student?.name ?? `طالب ${member.userId}`}</strong>
                  <small dir="ltr">{student?.email ?? "—"}</small>
                </span>
                <span className="premium-member-levels">
                  {member.levels.join(" · ")}
                </span>
                <span
                  className="premium-status-pill"
                  data-status={member.status}
                >
                  {member.status === "active" && !member.active
                    ? "انتهت المدة"
                    : STATUS_LABELS[member.status]}
                </span>
                <span className="premium-member-score latin">
                  {member.currentLevel ?? "—"}
                </span>
                <ChevronLeft
                  className={cn(
                    "size-4 transition-transform",
                    isSelected && "-rotate-90"
                  )}
                />
              </button>
              <div className="premium-member-meta">
                <span>
                  اليوم:{" "}
                  <b className="latin">
                    {member.dayNumber}/{member.durationDays}
                  </b>
                </span>
                <span>
                  المبلغ:{" "}
                  <b className="latin">{member.paidAmountCents / 100} ج.م</b>
                </span>
                <span>
                  ينتهي: <b>{formatDate(member.endDate)}</b>
                </span>
              </div>
              {isSelected && (
                <div className="premium-member-detail">
                  {detail.isLoading ? (
                    <div className="premium-loading-line" />
                  ) : detail.isError ? (
                    <div className="premium-empty space-y-3">
                      <p>تعذّر تحميل تفاصيل العضوية دلوقتي.</p>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => void detail.refetch()}
                      >
                        <RefreshCw className="me-2 size-4" /> إعادة المحاولة
                      </Button>
                    </div>
                  ) : detail.data?.membership ? (
                    <>
                      <div className="premium-detail-grid">
                        <div>
                          <span>المستوى الحالي</span>
                          <strong className="latin">
                            {detail.data.currentLevel ?? "—"}
                          </strong>
                        </div>
                        <div>
                          <span>الأيام المكتملة</span>
                          <strong className="latin">
                            {
                              detail.data.dailyHistory.filter(
                                item => item.completed
                              ).length
                            }
                            /{detail.data.totalDays}
                          </strong>
                        </div>
                        <div>
                          <span>المرشد</span>
                          <strong>
                            {detail.data.membership.coachUserId
                              ? `حساب #${detail.data.membership.coachUserId}`
                              : "غير معيّن"}
                          </strong>
                        </div>
                      </div>
                      <PremiumCoachSelect
                        membershipId={member.id}
                        coachUserId={detail.data.membership.coachUserId}
                      />
                      <PremiumOwnerFeedback userId={member.userId} />
                    </>
                  ) : (
                    <p className="premium-empty">تفاصيل العضوية غير متاحة.</p>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>
      {!userId && (
        <p className="mt-4 text-xs text-ink-soft">
          اختار طالبًا من قائمة الإدارة لفتح التفعيل اليدوي، أو مرّر userId لعرض
          عضوية محددة.
        </p>
      )}
      {activationTarget && (
        <PremiumActivationDialog
          userId={activationTarget.id}
          studentName={activationTarget.name}
          open
          onOpenChange={open => !open && setActivationTarget(null)}
          onChanged={() => {
            void utils.premium.members.invalidate();
          }}
        />
      )}
      <div className="premium-admin-actions">
        <Button
          type="button"
          variant="outline"
          className="rounded-full border-ink/20"
          disabled={!selectedId}
          onClick={() => {
            const member = filtered.find(item => item.userId === selectedId);
            if (member)
              setActivationTarget({
                id: member.userId,
                name: member.student?.name ?? `طالب ${member.userId}`,
              });
          }}
        >
          <UserPlus className="me-2 size-4" /> تفعيل يدوي للطالب المحدد
        </Button>
        <span>
          <CheckCircle2 className="me-1 inline size-4 text-emerald-500" /> الدفع
          لا يُحصّل من الواجهة
        </span>
      </div>
    </section>
  );
}
