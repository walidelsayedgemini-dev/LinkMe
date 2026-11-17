import { Link, useRoute } from "wouter";
import { Award, BookOpenCheck, GraduationCap, Languages, MapPin, Star } from "lucide-react";
import { PageShell } from "@/components/layout/site-footer";
import { CourseCard } from "@/components/course-card";
import { Stars, UserAvatar } from "@/components/bits";
import { Reveal } from "@/components/reveal";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { formatCount, formatDate } from "@/lib/format";
import NotFound from "./NotFound";

export default function InstructorProfile() {
  const [, params] = useRoute("/instructors/:slug");
  const slug = params?.slug ?? "";
  const { data: instructor, isLoading } = trpc.catalog.instructorBySlug.useQuery({ slug }, { enabled: Boolean(slug) });

  if (isLoading) {
    return (
      <PageShell>
        <div className="container py-20">
          <div className="h-40 animate-pulse rounded-3xl bg-ink/[0.06]" />
        </div>
      </PageShell>
    );
  }

  if (!instructor) return <NotFound />;

  const totalStudents = instructor.courses.reduce((sum, course) => sum + course.studentsCount, 0);

  return (
    <PageShell>
      <section className="relative overflow-hidden border-b border-line bg-paper-deep">
        <div className="absolute inset-0 dot-grid opacity-30" />
        <div className="container relative py-12 md:py-16">
          <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:items-center sm:text-start">
              <UserAvatar name={instructor.name} src={instructor.avatarUrl} size={96} className="ring-4 ring-card" />
              <div>
                <p className="latin text-xs uppercase tracking-[0.2em] text-ink-soft">Instructor profile</p>
                <h1 className="mt-2 text-4xl leading-tight text-ink sm:text-5xl">{instructor.name}</h1>
                <p className="mt-2 text-base text-ink-soft">{instructor.title}</p>
                <div className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-ink-soft sm:justify-start">
                  <span className="flex items-center gap-1.5"><Star className="size-4 fill-acid-deep text-acid-deep" /> {(instructor.rating / 10).toFixed(1)} تقييم</span>
                  <span className="flex items-center gap-1.5"><BookOpenCheck className="size-4" /> {instructor.courses.length} كورس</span>
                  <span className="flex items-center gap-1.5"><GraduationCap className="size-4" /> {instructor.experienceYears} سنة خبرة</span>
                  {instructor.city && <span className="flex items-center gap-1.5"><MapPin className="size-4" /> {instructor.city}</span>}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-3 sm:justify-end">
              <Button asChild className="rounded-full bg-iris px-6 text-white hover:bg-iris-deep">
                <Link href={`/courses?instructor=${instructor.slug}`}>كورساته</Link>
              </Button>
              <Button asChild variant="outline" className="rounded-full border-ink/20">
                <Link href="/contact">تواصل مع الفريق</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="container grid gap-10 py-12 lg:grid-cols-[1fr_340px]">
        <div className="space-y-10">
          <div>
            <h2 className="text-2xl text-ink">نبذة عن المدرّس</h2>
            <p className="mt-4 whitespace-pre-line text-[15px] leading-[1.95] text-ink-soft">{instructor.bio}</p>
          </div>

          {instructor.specialtyList.length > 0 && (
            <div>
              <h2 className="text-2xl text-ink">التخصصات</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {instructor.specialtyList.map(specialty => (
                  <span key={specialty} className="rounded-full border border-ink/15 bg-card px-4 py-2 text-sm text-ink">
                    {specialty}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="rounded-3xl border border-line bg-card p-6">
              <h3 className="flex items-center gap-2 text-lg font-bold text-ink"><GraduationCap className="size-5" /> التعليم</h3>
              <ul className="mt-4 space-y-3 text-sm leading-relaxed text-ink-soft">
                {instructor.educationList.map(item => (
                  <li key={item} className="flex gap-2"><span className="mt-2 size-1 shrink-0 rounded-full bg-navy" />{item}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-3xl border border-line bg-card p-6">
              <h3 className="flex items-center gap-2 text-lg font-bold text-ink"><Award className="size-5" /> الشهادات</h3>
              <ul className="mt-4 space-y-3 text-sm leading-relaxed text-ink-soft">
                {instructor.certificationList.map(item => (
                  <li key={item} className="flex gap-2"><span className="mt-2 size-1 shrink-0 rounded-full bg-navy" />{item}</li>
                ))}
              </ul>
              <p className="mt-5 flex items-center gap-2 border-t border-line pt-4 text-sm text-ink-soft">
                <Languages className="size-4" /> {instructor.languages}
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-2xl text-ink">كورساته على المنصة</h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              {instructor.courses.map((course, index) => (
                <Reveal key={course.id} delay={index * 0.04}>
                  <CourseCard course={course} />
                </Reveal>
              ))}
            </div>
          </div>

          {instructor.reviews.length > 0 && (
            <div>
              <h2 className="text-2xl text-ink">ماذا يقول الطلاب؟</h2>
              <div className="mt-5 space-y-4">
                {instructor.reviews.map(review => (
                  <div key={review.id} className="rounded-2xl border border-line bg-card p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <UserAvatar name={review.userName} src={review.avatarUrl} size={38} />
                        <div>
                          <p className="text-sm font-semibold text-ink">{review.userName}</p>
                          <p className="text-[11px] text-ink-soft">{review.courseTitleAr} · {formatDate(review.createdAt)}</p>
                        </div>
                      </div>
                      <Stars value={review.rating} />
                    </div>
                    {review.comment && <p className="mt-3 text-sm leading-relaxed text-ink-soft">{review.comment}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <aside className="space-y-6">
          <div className="rounded-3xl border border-ink bg-card p-6 shadow-[4px_4px_0_0_var(--color-ink)]">
            <h3 className="text-sm font-semibold text-ink-soft">بأرقام</h3>
            <div className="mt-4 grid grid-cols-2 gap-4">
              {[
                { label: "متعلّم", value: formatCount(totalStudents) },
                { label: "درسًا", value: instructor.lessonCount },
                { label: "كورسًا", value: instructor.courses.length },
                { label: "سنة خبرة", value: instructor.experienceYears },
              ].map(item => (
                <div key={item.label} className="rounded-2xl bg-paper p-4">
                  <p className="latin text-2xl font-bold text-ink">{item.value}</p>
                  <p className="text-xs text-ink-soft">{item.label}</p>
                </div>
              ))}
            </div>
            <p className="mt-5 text-xs leading-relaxed text-ink-soft">
              التقييم العام محسوب من تقييمات الطلاب داخل الكورسات. يُحدّث تلقائيًا مع كل مراجعة جديدة.
            </p>
          </div>
        </aside>
      </section>
    </PageShell>
  );
}
