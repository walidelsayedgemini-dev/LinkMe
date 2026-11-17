import {
  AlertCircle,
  Check,
  Loader2,
  Pause,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { YassinSays } from "@/components/yassin";
import { errorText } from "./shared";

export function AssessmentLoading({
  label = "بنجهّز الجلسة…",
}: {
  label?: string;
}) {
  return (
    <div className="assessment-state-card">
      <Loader2 className="size-7 animate-spin text-iris" />
      <p className="mt-3 font-semibold text-ink">{label}</p>
      <p className="mt-1 text-sm text-ink-soft">
        الأسئلة بتوصل على دفعات صغيرة، مش البنك كله.
      </p>
    </div>
  );
}

export function AssessmentError({
  error,
  onRetry,
  label = "حصلت مشكلة في تحميل الاختبار.",
}: {
  error: unknown;
  onRetry: () => void;
  label?: string;
}) {
  return (
    <div className="assessment-state-card" role="alert">
      <span className="assessment-error-icon">
        <AlertCircle className="size-5" />
      </span>
      <p className="mt-3 font-semibold text-ink">{label}</p>
      <p className="mt-1 max-w-md text-sm leading-relaxed text-ink-soft">
        {errorText(
          error,
          "جرّب تحديث الجزء ده. لو استمرت المشكلة، ابدأ جلسة جديدة بعد شوية."
        )}
      </p>
      <Button
        type="button"
        variant="outline"
        className="mt-5 rounded-xl"
        onClick={onRetry}
      >
        <RefreshCw className="size-4" /> جرّب تاني
      </Button>
    </div>
  );
}

export function AssessmentPause({
  onResume,
  onStartOver,
}: {
  onResume: () => void;
  onStartOver: () => void;
}) {
  return (
    <div className="assessment-pause-screen">
      <div className="assessment-pause-icon">
        <Pause className="size-6" />
      </div>
      <h2 className="mt-4 text-2xl text-ink">الجلسة متوقفة مؤقتًا</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-soft">
        إجاباتك محفوظة في الجلسة الحالية. ارجع وقت ما تكون جاهز، أو ابدأ جلسة
        جديدة من غير ما نعتمد على الإجابات القديمة.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Button
          type="button"
          onClick={onResume}
          className="rounded-xl bg-iris text-white hover:bg-iris-deep"
        >
          كمّل من هنا <Sparkles className="size-4" />
        </Button>
        <Button
          type="button"
          onClick={onStartOver}
          variant="outline"
          className="rounded-xl"
        >
          ابدأ من جديد
        </Button>
      </div>
      <YassinSays
        className="mx-auto mt-8 max-w-lg text-start"
        message="الوقفة مش انسحاب. خُد وقتك وارجع للجلسة لما يناسبك."
      />
    </div>
  );
}

export function HalfwayBreak({
  onContinue,
  onPause,
}: {
  onContinue: () => void;
  onPause: () => void;
}) {
  return (
    <div
      className="assessment-break-card"
      role="dialog"
      aria-labelledby="assessment-break-title"
    >
      <div
        className="assessment-particle assessment-particle-one"
        aria-hidden
      />
      <div
        className="assessment-particle assessment-particle-two"
        aria-hidden
      />
      <div className="assessment-break-mark">
        <Check className="size-5" />
      </div>
      <div>
        <p className="assessment-eyebrow">نص المرحلة</p>
        <h2 id="assessment-break-title" className="mt-1 text-xl text-ink">
          برافو، خلصت 6 أسئلة
        </h2>
        <p className="mt-1 text-sm text-ink-soft">
          تحب تاخد نفسًا صغيرًا؟ الوقفة اختيارية والجلسة محفوظة.
        </p>
      </div>
      <div className="ms-auto flex shrink-0 flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          onClick={onContinue}
          className="rounded-xl bg-iris text-white hover:bg-iris-deep"
        >
          كمّل
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={onPause}
          className="rounded-xl"
        >
          وقفة
        </Button>
      </div>
    </div>
  );
}
