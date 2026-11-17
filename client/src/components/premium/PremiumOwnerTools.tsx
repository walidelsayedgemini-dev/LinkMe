import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";

export function PremiumActivatePicker({ onChoose }: { onChoose: (student: { id: number; name: string }) => void }) {
  const students = trpc.admin.overview.useQuery();
  const [selected, setSelected] = useState("");
  const student = students.data?.students.find(item => item.id === Number(selected));
  return <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-line bg-card p-4">
    <label className="min-w-0 flex-1 text-sm text-ink"><span className="mb-2 block">تفعيل خطة لطالب بعد مراجعة الدفع</span>
      <select className="w-full rounded-xl border border-line bg-card p-3" value={selected} onChange={event => setSelected(event.target.value)} disabled={students.isPending}>
        <option value="">{students.isPending ? "بنحمّل الطلاب…" : "اختار الطالب"}</option>
        {(students.data?.students ?? []).map(item => <option key={item.id} value={item.id}>{item.name || item.email || `طالب ${item.id}`}</option>)}
      </select>
    </label>
    <Button disabled={!student} className="rounded-xl bg-iris text-white" onClick={() => student && onChoose({ id: student.id, name: student.name || "الطالب" })}>راجع الدفع وفعّل الخطة</Button>
    {students.isError && <button className="text-sm text-iris" onClick={() => void students.refetch()}>تحميل الطلاب فشل — جرّب تاني</button>}
  </div>;
}

export function PremiumCoachSelect({ membershipId, coachUserId }: { membershipId: number; coachUserId: number | null }) {
  const staff = trpc.premium.staff.useQuery();
  const utils = trpc.useUtils();
  const update = trpc.premium.assignCoach.useMutation({
    onSuccess: () => { toast.success("اتحفظ تعيين المرشد"); void utils.premium.student.invalidate(); void utils.premium.members.invalidate(); void utils.premium.coachStudents.invalidate(); },
    onError: error => toast.error(error.message),
  });
  return <label className="block text-sm text-ink"><span className="mb-2 block">المدرّس المسؤول عن المتابعة</span>
    <select className="w-full rounded-xl border border-line bg-card p-3" value={coachUserId ?? ""} disabled={staff.isPending || update.isPending} onChange={event => update.mutate({ membershipId, coachUserId: event.target.value ? Number(event.target.value) : null })}>
      <option value="">من غير مرشد معيّن</option>
      {(staff.data ?? []).map(item => <option key={item.id} value={item.id}>{item.name || `حساب ${item.id}`}{item.role === "admin" ? " — المالك" : ""}</option>)}
    </select>
    {staff.isError && <button type="button" className="mt-2 text-iris" onClick={() => void staff.refetch()}>قائمة المدرسين ما اتحمّلتش — جرّب تاني</button>}
  </label>;
}

export function PremiumOwnerFeedback({ userId }: { userId: number }) {
  const [note, setNote] = useState("");
  const utils = trpc.useUtils();
  const save = trpc.premium.feedback.useMutation({
    onSuccess: () => { setNote(""); toast.success("ملاحظتك وصلت لخطة الطالب"); void utils.premium.student.invalidate(); void utils.premium.mine.invalidate(); void utils.premium.coachStudents.invalidate(); },
    onError: error => toast.error(error.message),
  });
  return <form className="mt-4 space-y-3 rounded-2xl border border-line bg-paper p-4" onSubmit={event => { event.preventDefault(); if (note.trim()) save.mutate({ userId, note: note.trim() }); }}>
    <label htmlFor={`coach-note-${userId}`} className="block text-sm font-semibold text-ink">ملاحظتك وخطوة تدريب مخصوص للطالب</label>
    <textarea id={`coach-note-${userId}`} dir="auto" className="w-full rounded-xl border border-line bg-card p-3 text-ink outline-none focus:border-iris" rows={4} maxLength={4000} value={note} onChange={event => setNote(event.target.value)} placeholder="مثال: ركّز النهارده على المضارع التام، وحل الأسئلة اللي اتلغبطت فيها…" />
    <Button type="submit" className="rounded-xl bg-iris text-white" disabled={save.isPending || !note.trim()}>{save.isPending ? "بنبعت الملاحظة…" : "ابعت الملاحظة للطالب"}</Button>
    <p className="text-xs text-ink-soft">الملاحظة بتتحفظ باسم حسابك، مش رسالة متابعة أوتوماتيكية وهمية.</p>
  </form>;
}
