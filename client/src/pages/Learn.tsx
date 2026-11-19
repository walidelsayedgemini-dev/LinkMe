import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useRoute } from "wouter";
import ReactMarkdown from "react-markdown";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronLeft,
  ListVideo,
  Lock,
  Mic,
  PlayCircle,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { ProgressBar } from "@/components/bits";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import { trpc } from "@/lib/trpc";
import { formatPrice, levelLabel } from "@/lib/format";
import { cn } from "@/lib/utils";
import NotFound from "./NotFound";
import { CourseRecording } from "@/components/course-recording";
import { VoicePractice } from "@/components/voice-practice";
import { soundEffects } from "@/lib/sound-effects";
import { recordDailyActivity, awardXP } from "@/lib/gamification";
import {
  LessonAudioController,
  LessonPrintCheatSheet,
  LessonQuickQuiz,
} from "@/components/lesson-interactive-features";
import { ShadowingChallenge } from "@/components/shadowing-challenge";

export default function Learn() {
  const [, params] = useRoute("/learn/:slug");
  const slug = params?.slug ?? "";
  const [, navigate] = useLocation();
  const { user, loading } = useAuth();
  const utils = trpc.useUtils();

  const { data: access, isLoading, error: accessError, refetch: reloadAccess } = trpc.learning.access.useQuery(
    { slug },
    { enabled: Boolean(user) && Boolean(slug) }
  );

  const flatLessons = useMemo(
    () => (access?.modules ?? []).flatMap(module => module.lessons),
    [access?.modules]
  );

  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => {
    if (!access) return;
    setSelectedId(
      current => current ?? access.lastLessonId ?? flatLessons[0]?.id ?? null
    );
  }, [access, flatLessons]);

  const { data: lessonData, isLoading: lessonLoading, error: lessonError, refetch: reloadLesson } = trpc.learning.lesson.useQuery(
    { lessonId: selectedId ?? 0 },
    {
      enabled:
        Boolean(user) &&
        Boolean(selectedId) &&
        Boolean(access?.access),
    }
  );

  const toggle = trpc.learning.toggleLesson.useMutation({
    onSuccess: async result => {
      await utils.learning.access.invalidate({ slug });
      await utils.learning.dashboard.invalidate();
      recordDailyActivity();
      if (result.progress === 100) {
        soundEffects.playTrophy();
        toast.success("مبروك! أكملت كل دروس الكورس بنجاح 🎉🎓");
      } else {
        soundEffects.playCorrect();
        toast.success("تم إكمال الدرس! أضيف +10 XP لرصيدك ✨");
      }
    },
    onError: error => toast.error(error.message),
  });

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-paper pt-[72px]">
        <div className="container py-20">
          <div className="h-10 w-1/2 animate-pulse rounded-full bg-ink/[0.06]" />
          <div className="mt-6 h-96 animate-pulse rounded-3xl bg-ink/[0.06]" />
        </div>
      </div>
    );
  }

  if (!user) {
    navigate(`/login?next=${encodeURIComponent(`/learn/${slug}`)}`);
    return null;
  }

  if (accessError) return <div className="container py-24 text-ink" role="alert"><p>الكورس ما اتحمّلش، جرّب تاني.</p><Button onClick={() => void reloadAccess()} className="mt-4">إعادة التحميل</Button></div>;
  if (!access) return <NotFound />;

  const completedSet = new Set(access.completedLessonIds);
  const total = flatLessons.length;
  const done = access.completedLessonIds.length;
  const progress = total ? Math.round((done / total) * 100) : 0;
  const currentIndex = flatLessons.findIndex(item => item.id === selectedId);
  const prevLesson = currentIndex > 0 ? flatLessons[currentIndex - 1] : null;
  const nextLesson =
    currentIndex >= 0 && currentIndex < total - 1
      ? flatLessons[currentIndex + 1]
      : null;

  const curriculum = (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-ink-soft">
        <span>
          {done} من {total} دروس
        </span>
        <span className="latin">{progress}%</span>
      </div>
      <ProgressBar value={progress} />
      {access.modules.map((module, moduleIndex) => (
        <div key={module.id} className="space-y-1">
          <p className="px-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
            <span className="latin me-1">0{moduleIndex + 1}</span>{" "}
            {module.title}
          </p>
          {module.lessons.map(lesson => {
            const unlocked = access.access;
            const isDone = completedSet.has(lesson.id);
            const active = lesson.id === selectedId;
            return (
              <button
                key={lesson.id}
                disabled={!unlocked}
                onClick={() => setSelectedId(lesson.id)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-start text-sm transition-colors",
                  active
                    ? "bg-iris text-white"
                    : "text-ink-soft hover:bg-ink/5",
                  !unlocked && "opacity-50"
                )}
              >
                {isDone ? (
                  <CheckCircle2
                    className={cn(
                      "size-4 shrink-0",
                      active ? "text-acid" : "text-acid-deep"
                    )}
                  />
                ) : unlocked ? (
                  <PlayCircle className="size-4 shrink-0" />
                ) : (
                  <Lock className="size-4 shrink-0" />
                )}
                <span className="flex-1 truncate">{lesson.title}</span>
                <span className="latin text-[11px] opacity-70">
                  {lesson.durationMinutes}د
                </span>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );

  const isCompleted = selectedId ? completedSet.has(selectedId) : false;

  return (
    <div className="min-h-screen bg-paper pt-[72px]">
      <div className="border-b border-line bg-card">
        <div className="container flex flex-wrap items-center justify-between gap-3 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href={`/courses/${access.course.slug}`}
              className="grid size-9 shrink-0 place-items-center rounded-full border border-line text-ink-soft hover:border-ink hover:text-ink"
            >
              <ChevronLeft className="size-4 rotate-180" />
            </Link>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">
                {access.course.titleAr}
              </p>
              <p className="latin truncate text-[11px] text-ink-soft">
                {access.course.title} · {levelLabel(access.course.level)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden w-40 sm:block">
              <ProgressBar value={progress} />
            </div>
            <span className="latin text-xs font-semibold text-ink">
              {progress}%
            </span>
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  className="rounded-full border-ink/20 lg:hidden"
                  size="sm"
                >
                  <ListVideo className="me-1.5 size-4" /> المحتوى
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-[88vw] max-w-sm overflow-y-auto bg-paper p-5"
              >
                <SheetTitle className="mb-4 text-base">محتوى الكورس</SheetTitle>
                {curriculum}
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      <div className="container grid gap-8 py-8 lg:grid-cols-[300px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto rounded-3xl border border-line bg-card p-5">
            <h2 className="mb-4 text-sm font-bold text-ink">محتوى الكورس</h2>
            {curriculum}
          </div>
        </aside>

        <div className="min-w-0">
          {lessonError && <div role="alert" className="mb-4 rounded-2xl border border-line bg-card p-5"><p className="text-ink">الدرس ما اتحمّلش.</p><Button variant="outline" className="mt-3" onClick={() => void reloadLesson()}>جرّب تاني</Button></div>}
          {lessonLoading && <p role="status" className="mb-4 text-ink-soft">بنحمّل شرح الدرس…</p>}
          {!access.access ? (
            <div className="rounded-3xl border border-ink bg-card p-10 text-center shadow-[5px_5px_0_0_var(--color-ink)]">
              <Lock className="mx-auto size-8 text-ink-soft" />
              <h2 className="mt-4 text-2xl text-ink">
                هذا الدرس جزء من كورس مدفوع
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-soft">
                اشترك في الكورس أو فعّل خطة برو لفتح كل الدروس. مفيش دروس
                مجانية للمعاينة — الوصول كامل بعد تفعيل الاشتراك.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                <Button asChild className="rounded-full bg-iris text-white">
                  <Link href={`/courses/${access.course.slug}`}>
                    الالتحاق بـ {formatPrice(access.course.priceCents)}{" "}
                    <ArrowLeft className="ms-2 size-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="rounded-full border-ink/20"
                >
                  <Link href="/pricing">اشتراك كل الكورسات</Link>
                </Button>
              </div>
            </div>
          ) : lessonData ? (
            <article className="space-y-6">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-ink-soft">
                    <span>
                      الدرس {currentIndex + 1} من {total}
                    </span>
                    <span>·</span>
                    <span>{lessonData.lesson.durationMinutes} دقيقة</span>
                    {lessonData.lesson.isPreview && (
                      <span className="rounded-full bg-acid px-2 py-0.5 text-[10px] font-semibold text-ink">
                        درس معاينة
                      </span>
                    )}
                  </div>
                  <LessonPrintCheatSheet
                    lessonTitle={lessonData.lesson.title}
                    courseTitle={access.course.titleAr || access.course.title}
                  />
                </div>
                <h1 className="mt-2 text-3xl leading-tight text-ink">
                  {lessonData.lesson.title}
                </h1>
                <p className="mt-2 text-sm text-ink-soft">
                  {lessonData.lesson.description}
                </p>
              </div>

              {/* Audio Pronunciation Controller */}
              {lessonData.lesson.content && (
                <LessonAudioController content={lessonData.lesson.content} />
              )}

              <CourseRecording url={lessonData.lesson.videoUrl} />
              <VoicePractice />

              {/* Content */}
              <div className="rounded-3xl border border-line bg-card p-6 sm:p-8">
                <div className="prose-ar max-w-none">
                  <ReactMarkdown
                    components={{
                      h2: ({ children }) => (
                        <h2 className="mt-8 mb-3 text-xl font-black text-ink dark:text-white border-b border-line/70 pb-2 flex items-center gap-2">
                          {children}
                        </h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className="mt-5 mb-2 text-base font-extrabold text-iris dark:text-sky-400">
                          {children}
                        </h3>
                      ),
                      table: ({ children }) => (
                        <div className="my-5 overflow-x-auto rounded-2xl border border-line bg-card shadow-xs">
                          <table className="w-full text-start text-sm divide-y divide-line">
                            {children}
                          </table>
                        </div>
                      ),
                      th: ({ children }) => (
                        <th className="bg-paper-deep px-4 py-3 font-bold text-ink dark:text-white text-start text-xs uppercase tracking-wider">
                          {children}
                        </th>
                      ),
                      td: ({ children }) => (
                        <td className="px-4 py-3 text-sm text-ink-soft dark:text-slate-300 leading-relaxed border-t border-line/50">
                          {children}
                        </td>
                      ),
                      blockquote: ({ children }) => (
                        <blockquote className="my-4 border-s-4 border-iris bg-iris/5 dark:bg-iris/15 px-4 py-3 rounded-e-2xl text-ink dark:text-white">
                          {children}
                        </blockquote>
                      ),
                      strong: ({ children }) => (
                        <strong className="font-extrabold text-iris dark:text-amber-300">
                          {children}
                        </strong>
                      ),
                    }}
                  >
                    {lessonData.lesson.content?.trim() ||
                      (lessonData.lesson.videoUrl
                        ? "### شوف تسجيل المحاضرة\n\nاتفرج على التسجيل، وطبّق الأمثلة مع المدرّس قبل ما تعلّم الدرس كمكتمل."
                        : "### شرح الدرس لسه مش مرفوع\n\nالمدرّس محتاج يضيف محتوى الدرس وملفاته. ما تعتبرش الدرس مكتمل من غير شرح. تقدر تسأله من المحادثة عن موعد رفعه.")}
                  </ReactMarkdown>
                </div>
              </div>

              {/* Quick Lesson Comprehension Quiz */}
              {lessonData.lesson.content && (
                <LessonQuickQuiz
                  lessonTitle={lessonData.lesson.title}
                  content={lessonData.lesson.content}
                  onPassed={() => awardXP(30)}
                />
              )}

              {/* Instant Accent Shadowing Challenge */}
              <ShadowingChallenge className="mt-4" />

              {/* Actions */}
              <div className="flex flex-col gap-3 rounded-3xl border border-line bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant={isCompleted ? "outline" : "default"}
                    className={cn(
                      "rounded-full",
                      isCompleted ? "border-ink/20" : "bg-iris text-white"
                    )}
                    onClick={() =>
                      toggle.mutate({
                        lessonId: lessonData.lesson.id,
                        completed: !isCompleted,
                      })
                    }
                    disabled={toggle.isPending || (!isCompleted && !lessonData.lesson.content?.trim() && !lessonData.lesson.videoUrl?.trim())}
                  >
                    {isCompleted ? (
                      <RotateCcw className="me-2 size-4" />
                    ) : (
                      <Check className="me-2 size-4" />
                    )}
                    {isCompleted ? "إلغاء الإكمال" : "تحديد كمكتمل"}
                  </Button>
                  {nextLesson && (
                    <Button
                      variant="ghost"
                      className="rounded-full"
                      onClick={() => {
                        if (!isCompleted)
                          toggle.mutate({
                            lessonId: lessonData.lesson.id,
                            completed: true,
                          });
                        setSelectedId(nextLesson.id);
                      }}
                    >
                      الدرس التالي <ArrowLeft className="ms-2 size-4" />
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full border-ink/20"
                    disabled={!prevLesson}
                    onClick={() => prevLesson && setSelectedId(prevLesson.id)}
                  >
                    <ArrowRight className="me-1.5 size-4" /> السابق
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full border-ink/20"
                    disabled={!nextLesson}
                    onClick={() => nextLesson && setSelectedId(nextLesson.id)}
                  >
                    التالي <ArrowLeft className="ms-1.5 size-4" />
                  </Button>
                </div>
              </div>
            </article>
          ) : (
            <div className="rounded-3xl border border-line bg-card p-10 text-center text-sm text-ink-soft">
              اختر درسًا من المحتوى لتبدأ.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
