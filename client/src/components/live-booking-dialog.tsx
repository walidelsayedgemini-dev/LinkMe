import { useState } from "react";
import {
  Calendar,
  Check,
  Clock,
  GraduationCap,
  MessageCircle,
  Sparkles,
  User,
  Video,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { soundEffects } from "@/lib/sound-effects";
import { cn } from "@/lib/utils";

const SCHEDULE_OPTIONS = [
  {
    id: "sat_tue_7pm",
    days: "السبت والثلاثاء",
    time: "7:00 مساءً (توقيت القاهرة)",
    badge: "الأكثر طلبًا 🔥",
  },
  {
    id: "sat_tue_9pm",
    days: "السبت والثلاثاء",
    time: "9:00 مساءً (توقيت القاهرة)",
    badge: "مسائي مريح 🌙",
  },
  {
    id: "sun_wed_7pm",
    days: "الأحد والأربعاء",
    time: "7:00 مساءً (توقيت القاهرة)",
    badge: "متاح الآن ✨",
  },
  {
    id: "sun_wed_9pm",
    days: "الأحد والأربعاء",
    time: "9:00 مساءً (توقيت القاهرة)",
    badge: "متاح الآن ✨",
  },
  {
    id: "mon_thu_8pm",
    days: "الإثنين والخميس",
    time: "8:00 مساءً (توقيت القاهرة)",
    badge: "نهاية الأسبوع ⚡",
  },
];

const INSTRUCTORS = [
  {
    id: "sarah",
    name: "Sarah Mitchell",
    role: "محادثة وطلاقة وكسر حاجز الخوف",
    avatar: "/avatars/pro_10.webp",
    focus: "محادثات تفاعلية صوتية مباشرة (Conversation Focus)",
  },
  {
    id: "omar",
    name: "أ/ عمر السيد",
    role: "تأسيس القواعد واختبارات الآيلتس",
    avatar: "/avatars/pro_07.webp",
    focus: "قواعد مشروحة بالعربي وتطبيقات عملية (Grammar & IELTS)",
  },
  {
    id: "yasmine",
    name: "د/ ياسمين الشريف",
    role: "إنجليزي الأعمال والمقابلات المهنية",
    avatar: "/avatars/pro_08.webp",
    focus: "إيميلات واجتماعات وإنترفيو الشركات (Business English)",
  },
];

export function LiveBookingDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [selectedSchedule, setSelectedSchedule] = useState("sat_tue_7pm");
  const [selectedInstructor, setSelectedInstructor] = useState("sarah");
  const [studentName, setStudentName] = useState("");
  const [phone, setPhone] = useState("");
  const [booked, setBooked] = useState(false);

  const activeInstructor = INSTRUCTORS.find(i => i.id === selectedInstructor);
  const activeSlot = SCHEDULE_OPTIONS.find(s => s.id === selectedSchedule);

  const handleConfirm = () => {
    if (!studentName.trim() || !phone.trim()) {
      toast.warning("اكتب اسمك ورقم الواتساب لتأكيد موعد الحصتين.");
      return;
    }
    soundEffects.playCorrect();
    setBooked(true);

    const scheduleText = `${activeSlot?.days} الساعة ${activeSlot?.time}`;
    const message = encodeURIComponent(
      `مرحبًا Link Me! أنا حابب أحجز الحصتين الأونلاين أسبوعيًا:\n- المسار والمعلم: ${activeInstructor?.name} (${activeInstructor?.role})\n- الموعد المختار: ${scheduleText}\n- اسمي: ${studentName}\n- تليفوني: ${phone}`
    );

    // Open WhatsApp after a brief delay
    setTimeout(() => {
      window.open(`https://wa.me/201017799548?text=${message}`, "_blank");
    }, 1200);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6" dir="rtl">
        <DialogHeader className="text-start">
          <DialogTitle className="text-2xl font-extrabold flex items-center gap-2">
            <Video className="size-6 text-iris" />
            حجز جدول المحاضرات الأونلاين (حصتين في الأسبوع)
          </DialogTitle>
          <DialogDescription className="text-sm text-ink-soft">
            معلّم معاك لايف مش فيديو وبس! حصتين أسبوعيًا مدة كل محاضرة 60 دقيقة عبر Google Meet / Zoom بمتابعة وتطبيق فوري.
          </DialogDescription>
        </DialogHeader>

        {booked ? (
          <div className="py-8 text-center space-y-4">
            <div className="mx-auto grid size-16 place-items-center rounded-full bg-emerald-100 text-emerald-600">
              <Check className="size-8" />
            </div>
            <h3 className="text-xl font-bold text-ink">تم تجهيز موعدك بنجاح! 🎉</h3>
            <p className="text-sm text-ink-soft max-w-md mx-auto">
              يا {studentName}، تم اختيار موعدك: <strong>{activeSlot?.days}</strong> ({activeSlot?.time}) مع <strong>{activeInstructor?.name}</strong>.
              جارٍ تحويلك إلى واتساب لاستلام رابط الجلسة المباشر.
            </p>
            <Button
              type="button"
              className="rounded-full bg-emerald-600 text-white font-bold hover:bg-emerald-700"
              onClick={() => {
                setBooked(false);
                onOpenChange(false);
              }}
            >
              تم، شكراً لك!
            </Button>
          </div>
        ) : (
          <div className="space-y-6 pt-2">
            {/* Step 1: Choose Instructor / Focus */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-soft mb-2.5">
                1. اختار المعلم ومسار التعلّم:
              </label>
              <div className="grid gap-2.5 sm:grid-cols-3">
                {INSTRUCTORS.map(inst => (
                  <button
                    key={inst.id}
                    type="button"
                    onClick={() => {
                      setSelectedInstructor(inst.id);
                      soundEffects.playClick();
                    }}
                    className={cn(
                      "flex flex-col text-start rounded-2xl border p-3.5 transition-all text-xs",
                      selectedInstructor === inst.id
                        ? "border-iris bg-iris-soft/40 ring-2 ring-iris/40 shadow-xs"
                        : "border-line bg-card hover:border-iris/40"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <img
                        src={inst.avatar}
                        alt={inst.name}
                        className="size-8 rounded-full object-cover border border-iris/20"
                      />
                      <span className="font-extrabold text-ink">{inst.name}</span>
                    </div>
                    <span className="text-[11px] text-iris font-semibold mb-1">
                      {inst.role}
                    </span>
                    <p className="text-[10px] text-ink-soft line-clamp-2">
                      {inst.focus}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Choose 2-sessions/week Time Slot */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-soft mb-2.5">
                2. اختار موعد الحصتين الأسبوعيتين (حصتان كل أسبوع):
              </label>
              <div className="grid gap-2 sm:grid-cols-2">
                {SCHEDULE_OPTIONS.map(slot => (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() => {
                      setSelectedSchedule(slot.id);
                      soundEffects.playClick();
                    }}
                    className={cn(
                      "flex items-center justify-between rounded-2xl border p-3.5 transition-all text-xs",
                      selectedSchedule === slot.id
                        ? "border-iris bg-iris-soft/50 ring-2 ring-iris/40 font-bold"
                        : "border-line bg-card hover:border-iris/30 text-ink"
                    )}
                  >
                    <div className="text-start">
                      <span className="block font-bold text-ink">{slot.days}</span>
                      <span className="text-[11px] text-ink-soft flex items-center gap-1 mt-0.5">
                        <Clock className="size-3 text-iris" /> {slot.time}
                      </span>
                    </div>
                    <span className="rounded-full bg-paper px-2 py-0.5 text-[10px] text-iris border border-iris/20">
                      {slot.badge}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 3: Contact Info */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-soft mb-2.5">
                3. بياناتك لاستلام رابط المحاضرة:
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  type="text"
                  placeholder="اسمك بالكامل"
                  value={studentName}
                  onChange={e => setStudentName(e.target.value)}
                  className="w-full rounded-2xl border border-line bg-paper-deep/30 px-4 py-3 text-sm text-ink outline-none transition focus:border-iris focus:ring-2 focus:ring-iris/20"
                />
                <input
                  type="tel"
                  placeholder="رقم الواتساب (مثال: 01012345678)"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full rounded-2xl border border-line bg-paper-deep/30 px-4 py-3 text-sm text-ink outline-none transition focus:border-iris focus:ring-2 focus:ring-iris/20"
                  dir="ltr"
                />
              </div>
            </div>

            {/* Confirm Button */}
            <div className="pt-2 border-t border-line flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs text-ink-soft flex items-center gap-1">
                <Sparkles className="size-3.5 text-amber-500" />
                المحاضرات تفاعلية لايف مع تطبيق عملي وحضور مسجّل في حسابك.
              </span>
              <Button
                type="button"
                onClick={handleConfirm}
                className="rounded-full bg-iris px-6 py-2.5 text-white font-bold hover:bg-iris-deep shadow-md w-full sm:w-auto text-sm"
              >
                تأكيد حجز الحصتين الآن 🚀
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
