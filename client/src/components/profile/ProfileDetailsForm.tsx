import { useEffect, useRef, useState } from "react";
import { Check, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

type Details = {
  city: string | null;
  birthYear: number | null;
  schoolGrade: string | null;
  learningGoal: string | null;
  preferredStudyTime: string | null;
  dailyStudyMinutes: number | null;
  bio: string | null;
};

export type ProfileRecord = {
  user: {
    id: number;
    name: string | null;
    phone: string | null;
    country: string | null;
  };
  details: Details | null;
};

type FormState = {
  name: string;
  phone: string;
  country: string;
  city: string;
  birthYear: string;
  schoolGrade: string;
  learningGoal: string;
  preferredStudyTime: "" | "morning" | "afternoon" | "evening" | "flexible";
  dailyStudyMinutes: string;
  bio: string;
};

const inputClass =
  "w-full rounded-2xl border border-line bg-paper-deep/30 px-4 py-3 text-sm text-ink outline-none transition placeholder:text-ink-soft/60 focus:border-iris focus:ring-2 focus:ring-iris/15";
const EMPTY_DETAILS: Details = {
  city: null,
  birthYear: null,
  schoolGrade: null,
  learningGoal: null,
  preferredStudyTime: null,
  dailyStudyMinutes: null,
  bio: null,
};

function formFromProfile(profile: ProfileRecord): FormState {
  const details = profile.details ?? EMPTY_DETAILS;
  return {
    name: profile.user.name ?? "",
    phone: profile.user.phone ?? "",
    country: profile.user.country ?? "",
    city: details.city ?? "",
    birthYear: details.birthYear?.toString() ?? "",
    schoolGrade: details.schoolGrade ?? "",
    learningGoal: details.learningGoal ?? "",
    preferredStudyTime:
      (details.preferredStudyTime as FormState["preferredStudyTime"]) ?? "",
    dailyStudyMinutes: details.dailyStudyMinutes?.toString() ?? "",
    bio: details.bio ?? "",
  };
}

function textOrNull(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export function ProfileDetailsForm({
  profile,
  onSaved,
}: {
  profile: ProfileRecord;
  onSaved: () => Promise<void>;
}) {
  const initializedUserId = useRef<number | null>(null);
  const [form, setForm] = useState<FormState>(() => formFromProfile(profile));
  const [dirty, setDirty] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const updateProfile = trpc.profile.update.useMutation();

  useEffect(() => {
    // Refetches never overwrite active typing. A different signed-in user is a
    // legitimate boundary and gets a fresh form exactly once.
    if (initializedUserId.current === profile.user.id) return;
    initializedUserId.current = profile.user.id;
    setForm(formFromProfile(profile));
    setDirty(false);
    setFieldErrors({});
  }, [profile]);

  const setField = <K extends keyof FormState>(
    field: K,
    value: FormState[K]
  ) => {
    setForm(previous => ({ ...previous, [field]: value }));
    setDirty(true);
    setFieldErrors(previous => ({ ...previous, [field]: "" }));
  };

  const validate = () => {
    const errors: Record<string, string> = {};
    if (form.name.trim().length < 2) errors.name = "اكتب اسمك على الأقل بحرفين";
    if (form.phone.trim() && !/^[+\d\s().-]{6,40}$/.test(form.phone.trim())) {
      errors.phone = "اكتب رقم هاتف صحيحًا";
    }
    if (form.birthYear.trim()) {
      const year = Number(form.birthYear);
      const currentYear = new Date().getFullYear();
      if (!Number.isInteger(year) || year < 1900 || year > currentYear)
        errors.birthYear = "اكتب سنة ميلاد صحيحة";
    }
    if (form.dailyStudyMinutes.trim()) {
      const minutes = Number(form.dailyStudyMinutes);
      if (!Number.isInteger(minutes) || minutes < 5 || minutes > 300)
        errors.dailyStudyMinutes = "اختار من 5 إلى 300 دقيقة";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;
    try {
      const saved = await updateProfile.mutateAsync({
        name: form.name.trim(),
        phone: textOrNull(form.phone),
        country: textOrNull(form.country),
        city: textOrNull(form.city),
        birthYear: form.birthYear.trim() ? Number(form.birthYear) : null,
        schoolGrade: textOrNull(form.schoolGrade),
        learningGoal: textOrNull(form.learningGoal),
        preferredStudyTime: form.preferredStudyTime || null,
        dailyStudyMinutes: form.dailyStudyMinutes.trim()
          ? Number(form.dailyStudyMinutes)
          : null,
        bio: textOrNull(form.bio),
      });
      // A successful mutation is the source of truth for this form. Keep the
      // saved state even if the follow-up auth/query refresh is unavailable.
      setForm(formFromProfile(saved as ProfileRecord));
      setDirty(false);
      toast.success("اتحفظت بياناتك");
      try {
        await onSaved();
      } catch {
        toast.warning(
          "اتحفظت بياناتك، لكن تحديث الجلسة اتأخر. اعمل تحديث للصفحة لاحقًا."
        );
      }
    } catch {
      // The mutation's localized server message is rendered below with retry.
    }
  };

  const update =
    (field: keyof FormState) =>
    (
      event: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >
    ) => {
      setField(field, event.target.value as never);
    };

  return (
    <form
      className="rounded-3xl border border-line bg-card p-6"
      onSubmit={save}
      noValidate
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-ink">بياناتك التعليمية</h2>
          <p className="mt-1 text-sm text-ink-soft">
            معلومات بسيطة تساعدنا نرشّح لك طريقة تعلّم مناسبة.
          </p>
        </div>
        {dirty && (
          <span className="rounded-full bg-acid/50 px-3 py-1 text-xs font-semibold text-ink">
            تعديلات غير محفوظة
          </span>
        )}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Field label="الاسم" error={fieldErrors.name} required>
          <input
            className={inputClass}
            value={form.name}
            onChange={update("name")}
            autoComplete="name"
          />
        </Field>
        <Field label="رقم الهاتف" error={fieldErrors.phone}>
          <input
            className={inputClass}
            dir="ltr"
            value={form.phone}
            onChange={update("phone")}
            inputMode="tel"
            autoComplete="tel"
            placeholder="+20 …"
          />
        </Field>
        <Field label="الدولة">
          <input
            className={inputClass}
            value={form.country}
            onChange={update("country")}
            autoComplete="country-name"
            placeholder="مصر"
          />
        </Field>
        <Field label="المدينة">
          <input
            className={inputClass}
            value={form.city}
            onChange={update("city")}
            autoComplete="address-level2"
            placeholder="القاهرة"
          />
        </Field>
        <Field label="سنة الميلاد" error={fieldErrors.birthYear}>
          <input
            className={inputClass}
            dir="ltr"
            type="number"
            min={1900}
            max={new Date().getFullYear()}
            value={form.birthYear}
            onChange={update("birthYear")}
            placeholder="2010"
          />
        </Field>
        <Field label="الصف أو المرحلة الدراسية">
          <input
            className={inputClass}
            value={form.schoolGrade}
            onChange={update("schoolGrade")}
            placeholder="مثال: الصف الثاني الإعدادي"
          />
        </Field>
        <Field label="هدفك من الإنجليزي">
          <input
            className={inputClass}
            value={form.learningGoal}
            onChange={update("learningGoal")}
            placeholder="محادثة، شغل، سفر…"
          />
        </Field>
        <Field label="الوقت المفضّل للمذاكرة">
          <select
            className={cn(inputClass, "appearance-none")}
            value={form.preferredStudyTime}
            onChange={update("preferredStudyTime")}
          >
            <option value="">اختار وقتًا</option>
            <option value="morning">الصبح</option>
            <option value="afternoon">بعد الظهر</option>
            <option value="evening">بالليل</option>
            <option value="flexible">أي وقت</option>
          </select>
        </Field>
        <Field
          label="دقائق المذاكرة اليومية"
          error={fieldErrors.dailyStudyMinutes}
        >
          <input
            className={inputClass}
            dir="ltr"
            type="number"
            min={5}
            max={300}
            step={5}
            value={form.dailyStudyMinutes}
            onChange={update("dailyStudyMinutes")}
            placeholder="25"
          />
        </Field>
      </div>
      <Field label="نبذة قصيرة عنك" className="mt-4">
        <textarea
          className={cn(inputClass, "min-h-[120px] resize-y")}
          value={form.bio}
          onChange={update("bio")}
          maxLength={1200}
          placeholder="قول لنا بتحب تتعلّم إزاي وإيه اللي نفسك توصله…"
        />
      </Field>

      {updateProfile.error && (
        <p className="mt-4 text-sm font-medium text-coral" role="alert">
          {updateProfile.error.message} — راجع البيانات وحاول تاني.
        </p>
      )}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button
          type="submit"
          disabled={updateProfile.isPending}
          className="rounded-full bg-iris text-white hover:bg-iris-deep"
        >
          {updateProfile.isPending ? (
            <Loader2 className="me-2 size-4 animate-spin" />
          ) : (
            <Save className="me-2 size-4" />
          )}
          {updateProfile.isPending ? "جارٍ الحفظ…" : "حفظ البيانات"}
        </Button>
        {!dirty && (
          <span className="inline-flex items-center gap-1 text-xs text-ink-soft">
            <Check className="size-3.5 text-iris" /> كل التعديلات محفوظة
          </span>
        )}
      </div>
    </form>
  );
}

function Field({
  label,
  error,
  required,
  className,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={cn("block space-y-1.5 text-sm", className)}>
      <span className="font-medium text-ink">
        {label}
        {required && (
          <span className="ms-1 text-coral" aria-hidden>
            *
          </span>
        )}
      </span>
      {children}
      {error && (
        <span className="block text-xs font-medium text-coral" role="alert">
          {error}
        </span>
      )}
    </label>
  );
}
