import { useState } from "react";
import ReactMarkdown from "react-markdown";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../../server/routers";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Lesson =
  inferRouterOutputs<AppRouter>["curriculum"]["lessons"]["modules"][number]["lessons"][number];
function LessonEditor({ lesson }: { lesson: Lesson }) {
  const [content, setContent] = useState(lesson.content ?? "");
  const [videoUrl, setVideoUrl] = useState(lesson.videoUrl ?? "");
  const [preview, setPreview] = useState(false);
  const utils = trpc.useUtils();
  const hasMaterial = Boolean(content.trim() || videoUrl.trim());
  const save = trpc.curriculum.save.useMutation({
    onSuccess: () => {
      toast.success("شرح الدرس اتحفظ وبيظهر للمشتركين");
      void utils.curriculum.lessons.invalidate();
      void utils.catalog.invalidate();
      void utils.learning.access.invalidate();
      void utils.learning.lesson.invalidate();
    },
    onError: error => toast.error(error.message),
  });
  return (
    <form
      className="mt-5 space-y-4 rounded-2xl border border-line bg-card p-5"
      onSubmit={event => {
        event.preventDefault();
        save.mutate({
          lessonId: lesson.id,
          content,
          videoUrl: videoUrl || null,
        });
      }}
    >
      <h3 className="text-lg text-ink">{lesson.title}</h3>
      <label className="block text-sm text-ink">
        شرح الدرس وأمثلته — ينفع Markdown
        <textarea
          className="mt-2 min-h-64 w-full rounded-xl border border-line bg-paper p-3 text-ink focus:border-iris focus:outline-none"
          dir="auto"
          value={content}
          onChange={event => setContent(event.target.value)}
          maxLength={60000}
          placeholder="اكتب شرح فعلي وأمثلة وأسئلة تطبيقية…"
        />
      </label>
      <label className="block text-sm text-ink">
        رابط تسجيل المحاضرة (HTTPS — YouTube أو mp4/webm/ogg أو رابط خارجي)
        <input
          className="mt-2 w-full rounded-xl border border-line bg-paper p-3 text-ink focus:border-iris focus:outline-none"
          dir="ltr"
          type="url"
          value={videoUrl}
          onChange={event => setVideoUrl(event.target.value)}
          placeholder="https://…"
        />
        <span className="mt-1 block text-xs leading-relaxed text-ink-soft">
          روابط HTTPS الأخرى تُحفظ كرابط خارجي يفتحه الطالب في تبويب جديد؛ لا
          يوجد رفع ملف مباشر أو تحويل تلقائي إلى مشغّل داخل الصفحة.
        </span>
      </label>
      <div className="flex flex-wrap gap-2">
        <Button
          className="rounded-xl bg-iris text-white"
          disabled={save.isPending || !hasMaterial}
        >
          {save.isPending ? "بنحفظ…" : "احفظ الشرح والتسجيل"}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="rounded-xl"
          onClick={() => setPreview(value => !value)}
        >
          {preview ? "اقفل المعاينة" : "عاين الشرح"}
        </Button>
      </div>
      {!hasMaterial && (
        <p className="text-sm leading-relaxed text-coral" role="alert">
          لا يمكن حفظ الدرس وهو فاضي: لازم تسيب شرحًا أو تسجيلًا واحدًا على
          الأقل. امسح المادة فقط بعد تجهيز البديل.
        </p>
      )}
      {preview && (
        <div
          className="lesson-prose rounded-xl border border-line bg-paper p-4"
          dir="auto"
        >
          <ReactMarkdown>{content || "الشرح لسه فاضي."}</ReactMarkdown>
        </div>
      )}
      <p className="text-xs leading-relaxed text-ink-soft">
        الحفظ مش بيغيّر عناوين المنهج ولا تقدم الطلاب. الشرح ورابط التسجيل ما
        بيظهروش لزائر غير مشترك.
      </p>
    </form>
  );
}
export function CourseEditor() {
  const courses = trpc.curriculum.courses.useQuery();
  const [courseId, setCourseId] = useState("");
  const [lessonId, setLessonId] = useState("");
  const details = trpc.curriculum.lessons.useQuery(
    { courseId: Number(courseId) },
    { enabled: Boolean(courseId) }
  );
  const lessons = details.data?.modules.flatMap(module => module.lessons) ?? [];
  const lesson = lessons.find(item => item.id === Number(lessonId));
  return (
    <section className="rounded-3xl border border-line bg-paper p-5 sm:p-7">
      <p className="text-xs text-iris">إدارة الشرح والتسجيلات</p>
      <h2 className="mt-2 text-2xl text-ink">
        كمّل محتوى <span className="hl-word">كورساتك.</span>
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">
        الدرس اللي له عنوان بس مش محتوى جاهز. هنا تعرف الناقص وتضيف شرحك أو
        تسجيل المحاضرة قبل ما الطالب يعتبره خلص.
      </p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="text-sm text-ink">
          الكورس
          <select
            className="mt-2 w-full rounded-xl border border-line bg-card p-3"
            value={courseId}
            onChange={event => {
              setCourseId(event.target.value);
              setLessonId("");
            }}
            disabled={courses.isPending}
          >
            <option value="">اختار الكورس</option>
            {(courses.data ?? []).map(course => (
              <option key={course.id} value={course.id}>
                {course.titleAr || course.title}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-ink">
          الدرس
          <select
            className="mt-2 w-full rounded-xl border border-line bg-card p-3"
            value={lessonId}
            onChange={event => setLessonId(event.target.value)}
            disabled={!courseId || details.isPending}
          >
            <option value="">اختار الدرس</option>
            {details.data?.modules.map(module => (
              <optgroup key={module.id} label={module.title}>
                {module.lessons.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.hasContent ? "جاهز — " : "محتاج شرح — "}
                    {item.title}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
      </div>
      {(courses.isError || details.isError) && (
        <div className="mt-4 text-sm text-ink" role="alert">
          البيانات ما اتحمّلتش.
          <Button
            variant="outline"
            className="ms-3"
            onClick={() => {
              void courses.refetch();
              if (courseId) void details.refetch();
            }}
          >
            جرّب تاني
          </Button>
        </div>
      )}
      {details.data && (
        <p className="mt-3 text-xs text-ink-soft">
          {lessons.filter(item => !item.hasContent).length} درس محتاج شرح أو
          تسجيل من إجمالي {lessons.length}.
        </p>
      )}
      {lesson && <LessonEditor key={lesson.id} lesson={lesson} />}
    </section>
  );
}
