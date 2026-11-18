import { useMemo, useState } from "react";
import {
  Check,
  Edit3,
  Flame,
  Plus,
  School,
  Search,
  ShieldCheck,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StudentAvatarBadge } from "@/components/student-avatar-badge";
import { cn } from "@/lib/utils";
import { inputClass } from "@/pages/auth-layout";

const CLASS_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2", "Kids", "General"];

type EditingGroup = {
  id: number | null; // null = create new
  name: string;
  level: string;
  description: string;
  memberIds: number[];
};

export function ClassroomsManager() {
  const utils = trpc.useUtils();
  const { data, isLoading, isError, refetch } =
    trpc.community.adminListGroups.useQuery();

  const [editing, setEditing] = useState<EditingGroup | null>(null);
  const [studentFilter, setStudentFilter] = useState("");

  const createGroup = trpc.community.adminCreateGroup.useMutation({
    onSuccess: async () => {
      toast.success("تم إنشاء الفصل الدراسي وإضافة الطلبة بنجاح 🏫");
      await utils.community.adminListGroups.invalidate();
      setEditing(null);
    },
    onError: err => toast.error(err.message),
  });

  const updateGroup = trpc.community.adminUpdateGroup.useMutation({
    onSuccess: async () => {
      toast.success("تم تحديث الفصل الدراسي بنجاح ✅");
      await utils.community.adminListGroups.invalidate();
      setEditing(null);
    },
    onError: err => toast.error(err.message),
  });

  const deleteGroup = trpc.community.adminDeleteGroup.useMutation({
    onSuccess: async () => {
      toast.success("تم حذف الفصل الدراسي");
      await utils.community.adminListGroups.invalidate();
    },
    onError: err => toast.error(err.message),
  });

  const allStudents = data?.allStudents ?? [];
  const groups = data?.groups ?? [];

  const filteredStudents = useMemo(() => {
    const q = studentFilter.trim().toLowerCase();
    if (!q) return allStudents;
    return allStudents.filter(
      s =>
        (s.name ?? "").toLowerCase().includes(q) ||
        (s.email ?? "").toLowerCase().includes(q) ||
        (s.phone ?? "").toLowerCase().includes(q)
    );
  }, [allStudents, studentFilter]);

  const toggleMember = (studentId: number) => {
    setEditing(prev => {
      if (!prev) return prev;
      const exists = prev.memberIds.includes(studentId);
      return {
        ...prev,
        memberIds: exists
          ? prev.memberIds.filter(id => id !== studentId)
          : [...prev.memberIds, studentId],
      };
    });
  };

  const handleSave = () => {
    if (!editing) return;
    const trimmedName = editing.name.trim();
    if (trimmedName.length < 2) {
      toast.error("اكتب اسم الفصل (حرفين على الأقل)");
      return;
    }

    if (editing.id === null) {
      createGroup.mutate({
        name: trimmedName,
        level: editing.level,
        description: editing.description.trim() || undefined,
        memberIds: editing.memberIds,
      });
    } else {
      updateGroup.mutate({
        groupId: editing.id,
        name: trimmedName,
        level: editing.level,
        description: editing.description.trim() || undefined,
        memberIds: editing.memberIds,
      });
    }
  };

  const isSaving = createGroup.isPending || updateGroup.isPending;

  return (
    <div className="space-y-5">
      {/* Header bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-line bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-ink">
            <School className="size-5 text-iris" /> إدارة الفصول والمجموعات الدراسية
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-ink-soft">
            جمّع أي عدد من الطلبة في فصل واحد وسمّي الفصل زي ما تحب (مثال: فصل
            المحادثة المسائي A2).
          </p>
          <p className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
            <ShieldCheck className="size-3.5 shrink-0" />
            خصوصية الطلبة مفعّلة: كل طالب بيشوف الاسم الأول فقط لزملائه داخل الفصل
          </p>
        </div>

        <Button
          onClick={() => {
            setStudentFilter("");
            setEditing({
              id: null,
              name: "",
              level: "A1",
              description: "",
              memberIds: [],
            });
          }}
          className="shrink-0 rounded-full bg-iris text-white hover:bg-iris-deep"
        >
          <Plus className="me-1.5 size-4" /> إنشاء فصل جديد
        </Button>
      </div>

      {isLoading && (
        <div className="rounded-2xl border border-line bg-card p-8 text-center text-sm text-ink-soft">
          جارٍ تحميل الفصول الدراسية…
        </div>
      )}

      {isError && (
        <div className="rounded-2xl border border-line bg-card p-6 text-center">
          <p className="text-sm text-ink">تعذّر تحميل الفصول الدراسية.</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3 rounded-full"
            onClick={() => void refetch()}
          >
            جرّب تاني
          </Button>
        </div>
      )}

      {!isLoading && !isError && groups.length === 0 && (
        <div className="rounded-3xl border border-dashed border-line bg-card p-10 text-center">
          <School className="mx-auto size-10 text-ink-soft/60" />
          <h3 className="mt-3 text-base font-bold text-ink">
            مفيش فصول دراسية لسه
          </h3>
          <p className="mt-1 text-xs text-ink-soft">
            اضغط «إنشاء فصل جديد» وسمّي الفصل واختار الطلبة اللي جواه.
          </p>
        </div>
      )}

      {/* Classrooms grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {groups.map(group => (
          <div
            key={group.id}
            className="flex flex-col rounded-2xl border border-line bg-card p-5 shadow-sm transition hover:border-iris/40"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate text-base font-bold text-ink">
                    {group.name}
                  </h3>
                  <span className="latin rounded-full bg-iris-soft px-2.5 py-0.5 text-[11px] font-bold text-iris">
                    {group.level}
                  </span>
                </div>
                {group.description && (
                  <p className="mt-1 text-xs leading-relaxed text-ink-soft">
                    {group.description}
                  </p>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setStudentFilter("");
                    setEditing({
                      id: group.id,
                      name: group.name,
                      level: group.level,
                      description: group.description ?? "",
                      memberIds: group.memberIds,
                    });
                  }}
                  title="تعديل الفصل والطلبة"
                  className="grid size-8 place-items-center rounded-full border border-line text-ink-soft transition hover:border-iris hover:text-iris"
                >
                  <Edit3 className="size-3.5" />
                </button>
                <button
                  type="button"
                  disabled={deleteGroup.isPending}
                  onClick={() => {
                    if (
                      window.confirm(
                        `هل أنت متأكد من حذف فصل «${group.name}»؟ (حسابات الطلبة لن تُحذف)`
                      )
                    ) {
                      deleteGroup.mutate({ groupId: group.id });
                    }
                  }}
                  title="حذف الفصل"
                  className="grid size-8 place-items-center rounded-full border border-line text-ink-soft transition hover:border-destructive hover:text-destructive"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-xs text-ink-soft">
              <span className="inline-flex items-center gap-1.5 font-semibold text-ink">
                <Users className="size-3.5 text-iris" />
                {group.members.length} طالب في الفصل
              </span>
              <span className="text-[11px]">
                يظهر للطلبة: الاسم الأول فقط
              </span>
            </div>

            {group.members.length === 0 ? (
              <p className="mt-3 rounded-xl bg-paper-deep/60 p-3 text-center text-xs text-ink-soft">
                مفيش طلبة مضافين في الفصل ده لسه — اضغط تعديل لإضافة طلبة.
              </p>
            ) : (
              <div className="mt-3 flex flex-wrap gap-2">
                {group.members.map(member => (
                  <div
                    key={member.id}
                    className="inline-flex items-center gap-2 rounded-full border border-line bg-paper-deep/50 py-1 pe-3 ps-1.5"
                    title={`${member.name} (${member.email}) — يظهر للزملاء باسم: ${member.firstName}`}
                  >
                    <StudentAvatarBadge
                      avatarPreset={member.avatarPreset}
                      equippedSkin={member.equippedSkin}
                      size="sm"
                      showSkinBadge={false}
                      className="scale-75 -m-1"
                    />
                    <div className="min-w-0 leading-tight">
                      <p className="text-xs font-semibold text-ink">
                        {member.name}
                      </p>
                      <p className="text-[10px] text-ink-soft">
                        للزملاء: <span className="font-bold text-iris">{member.firstName}</span>
                        {" · "}
                        <span className="latin inline-flex items-center gap-0.5 text-amber-600">
                          <Flame className="size-2.5 fill-amber-500 text-amber-500" />
                          {member.streakDays}
                        </span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Create / Edit Classroom Dialog */}
      <Dialog
        open={Boolean(editing)}
        onOpenChange={open => !open && setEditing(null)}
      >
        <DialogContent
          dir="rtl"
          className="max-h-[90vh] max-w-lg overflow-y-auto bg-card text-ink"
        >
          <DialogHeader className="text-start">
            <DialogTitle className="flex items-center gap-2">
              <School className="size-5 text-iris" />
              {editing?.id === null
                ? "إنشاء فصل دراسي جديد"
                : "تعديل الفصل الدراسي"}
            </DialogTitle>
            <DialogDescription>
              سمّي الفصل واختار الطلبة اللي هيكونوا سوا في نفس الفصل.
            </DialogDescription>
          </DialogHeader>

          {editing && (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-[1fr_130px]">
                <div>
                  <Label className="mb-1 block">اسم الفصل</Label>
                  <input
                    value={editing.name}
                    onChange={e =>
                      setEditing(prev =>
                        prev ? { ...prev, name: e.target.value } : prev
                      )
                    }
                    placeholder="مثال: أبطال المحادثة — مجموعة السبت"
                    className={inputClass}
                  />
                </div>
                <div>
                  <Label className="mb-1 block">المستوى</Label>
                  <select
                    value={editing.level}
                    onChange={e =>
                      setEditing(prev =>
                        prev ? { ...prev, level: e.target.value } : prev
                      )
                    }
                    className={inputClass}
                  >
                    {CLASS_LEVELS.map(lvl => (
                      <option key={lvl} value={lvl}>
                        {lvl}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <Label className="mb-1 block">وصف أو مواعيد الفصل (اختياري)</Label>
                <Textarea
                  rows={2}
                  value={editing.description}
                  onChange={e =>
                    setEditing(prev =>
                      prev ? { ...prev, description: e.target.value } : prev
                    )
                  }
                  placeholder="مثال: جلسات السبت والثلاثاء الساعة 8 مساءً بتوقيت القاهرة"
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <Label>
                    اختر الطلبة ({editing.memberIds.length} محدد)
                  </Label>
                  {editing.memberIds.length > 0 && (
                    <button
                      type="button"
                      onClick={() =>
                        setEditing(prev =>
                          prev ? { ...prev, memberIds: [] } : prev
                        )
                      }
                      className="text-[11px] font-semibold text-destructive hover:underline"
                    >
                      مسح التحديد
                    </button>
                  )}
                </div>

                <div className="relative mb-2">
                  <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
                  <input
                    value={studentFilter}
                    onChange={e => setStudentFilter(e.target.value)}
                    placeholder="ابحث باسم الطالب أو إيميله…"
                    className={cn(inputClass, "h-9 ps-9 text-xs")}
                  />
                </div>

                <div className="max-h-60 space-y-1.5 overflow-y-auto rounded-2xl border border-line bg-paper-deep/40 p-2">
                  {filteredStudents.length === 0 ? (
                    <p className="py-6 text-center text-xs text-ink-soft">
                      مفيش طلبة مطابقين للبحث.
                    </p>
                  ) : (
                    filteredStudents.map(student => {
                      const selected = editing.memberIds.includes(student.id);
                      return (
                        <button
                          key={student.id}
                          type="button"
                          onClick={() => toggleMember(student.id)}
                          className={cn(
                            "flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-2 text-start transition",
                            selected
                              ? "border-iris bg-iris-soft/60"
                              : "border-transparent bg-card hover:border-line"
                          )}
                        >
                          <div className="flex min-w-0 items-center gap-2.5">
                            <span
                              className={cn(
                                "grid size-5 shrink-0 place-items-center rounded-md border",
                                selected
                                  ? "border-iris bg-iris text-white"
                                  : "border-line bg-paper"
                              )}
                            >
                              {selected && <Check className="size-3.5" />}
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-xs font-bold text-ink">
                                {student.name ?? "طالب"}
                              </p>
                              <p
                                className="latin truncate text-[11px] text-ink-soft"
                                dir="ltr"
                              >
                                {student.email}
                              </p>
                            </div>
                          </div>
                          {student.englishLevel && (
                            <span className="latin shrink-0 rounded-full bg-paper-deep px-2 py-0.5 text-[10px] font-semibold text-ink-soft">
                              {student.englishLevel}
                            </span>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditing(null)}
            >
              إلغاء
            </Button>
            <Button
              type="button"
              disabled={isSaving || !editing?.name.trim()}
              onClick={handleSave}
              className="bg-iris text-white hover:bg-iris-deep"
            >
              {isSaving
                ? "جارٍ الحفظ…"
                : editing?.id === null
                  ? "إنشاء الفصل"
                  : "حفظ التعديلات"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
