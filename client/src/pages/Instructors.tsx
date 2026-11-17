import { useState } from "react";
import { Link } from "wouter";
import { Search, Star } from "lucide-react";
import { PageShell } from "@/components/layout/site-footer";
import { AnimatedAurora, StudyDoodles } from "@/components/decor";
import { Reveal } from "@/components/reveal";
import { UserAvatar } from "@/components/bits";
import { trpc } from "@/lib/trpc";
import { formatCount } from "@/lib/format";

export default function Instructors() {
  const [query, setQuery] = useState("");
  const { data: instructors, isLoading } = trpc.catalog.instructors.useQuery({ q: query.trim() || undefined });

  return (
    <PageShell>
      <section className="border-b border-line bg-paper-deep/60">        <AnimatedAurora className="opacity-50" />
        <StudyDoodles variant="soft" />
        <div className="container py-12 md:py-16">
          <p className="latin text-xs font-medium uppercase tracking-[0.2em] text-ink-soft">Our teachers</p>
          <h1 className="mt-3 text-4xl leading-tight text-ink sm:text-5xl">
            مدرّسون <span className="hl-word">بتفاصيل كاملة</span> قبل ما تختار
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-soft">
            كل صفحة مدرّس تحتوي على خبرته، شهاداته، تخصصاته، كورساته، وآراء الطلاب — لتقرر بثقة.
          </p>
          <div className="relative mt-8 max-w-md">
            <Search className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
            <input
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="ابحث باسم المدرّس أو التخصص…"
              className="h-12 w-full rounded-full border border-line bg-card pe-11 ps-4 text-sm focus:border-ink focus:outline-none"
            />
          </div>
        </div>
      </section>

      <section className="container py-12">
        {isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-72 animate-pulse rounded-3xl bg-ink/[0.06]" />
            ))}
          </div>
        ) : (instructors ?? []).length === 0 ? (
          <div className="rounded-3xl border border-dashed border-ink/20 bg-card/60 p-16 text-center">
            <p className="text-lg font-semibold text-ink">لا يوجد مدرّس بهذا الاسم</p>
            <p className="mt-2 text-sm text-ink-soft">جرّب كلمة أخرى مثل «آيلتس» أو «محادثة».</p>
          </div>
        ) : (
          <>
            {!query.trim() && (() => {
              const list = instructors ?? [];
              const lead = list.find(item => item.slug === "yassin") ?? list.find(item => item.featured) ?? list[0];
              if (!lead) return null;
              return (
                <div className="mb-10 overflow-hidden rounded-[2rem] border border-line bg-card">
                  <div className="grid gap-0 md:grid-cols-[300px_1fr]">
                    <div className="relative min-h-[260px] bg-gradient-to-b from-[#dbe8ff] to-[#eef4ff] dark:from-[#142a4d] dark:to-[#0f1e33]">
                      <img
                        src={lead.avatarUrl ?? "/img/yassin-avatar.jpg"}
                        alt={`صورة ${lead.name}`}
                        className="absolute inset-0 h-full w-full object-cover object-top"
                        loading="lazy"
                      />
                      <span className="absolute start-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold text-navy shadow-sm">
                        <Star className="size-3 fill-[#f59e0b] text-[#f59e0b]" /> المدرّس الرئيسي
                      </span>
                    </div>
                    <div className="flex flex-col p-6 sm:p-8">
                      <p className="text-xs text-ink-soft">مرشدك في الرحلة · مؤسس Link Me</p>
                      <h2 className="mt-1 whitespace-nowrap text-2xl font-bold text-ink sm:text-3xl">{lead.name}</h2>
                      <p className="mt-1 text-sm text-ink-soft">{lead.title}</p>
                      <p className="mt-4 line-clamp-4 text-sm leading-relaxed text-ink-soft">{lead.bio}</p>
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {lead.specialtyList.slice(0, 4).map(specialty => (
                          <span key={specialty} className="rounded-full bg-paper px-2.5 py-1 text-[11px] text-ink-soft">
                            {specialty}
                          </span>
                        ))}
                      </div>
                      <div className="mt-5 flex flex-wrap items-center gap-3">
                        <Link
                          href={`/instructors/${lead.slug}`}
                          className="inline-flex h-11 items-center rounded-full bg-iris px-5 text-sm font-medium text-white transition hover:bg-iris-deep"
                        >
                          شوف بروفايله كامل
                        </Link>
                        <Link
                          href="/level-test"
                          className="inline-flex h-11 items-center gap-2 rounded-full border border-line px-5 text-sm text-ink transition hover:border-iris/50"
                        >
                          اعرف مستواك مع ياسين
                        </Link>
                        <span className="flex items-center gap-3 text-xs text-ink-soft">
                          <b className="latin text-sm text-ink">{lead.experienceYears} سنة</b> خبرة
                          <span className="size-1 rounded-full bg-line" />
                          <b className="latin text-sm text-ink">{formatCount(lead.studentsCount)}</b> متعلّم
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {(instructors ?? [])
              .filter(instructor => query.trim() || instructor.slug !== "yassin")
              .map((instructor, index) => (
              <Reveal key={instructor.id} delay={index * 0.04}>
                <Link href={`/instructors/${instructor.slug}`} className="card-soft group flex h-full flex-col p-6">
                  <div className="flex items-start justify-between">
                    <UserAvatar name={instructor.name} src={instructor.avatarUrl} size={64} />
                    <span className="flex items-center gap-1 rounded-full bg-paper px-2.5 py-1 text-xs font-semibold text-ink">
                      <Star className="size-3 fill-acid-deep text-acid-deep" /> {(instructor.rating / 10).toFixed(1)}
                    </span>
                  </div>
                  <h2 className="mt-4 text-xl font-bold text-ink group-hover:text-iris">{instructor.name}</h2>
                  <p className="mt-1 text-sm text-ink-soft">{instructor.title}</p>
                  <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-ink-soft">{instructor.bio}</p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {instructor.specialtyList.slice(0, 3).map(specialty => (
                      <span key={specialty} className="rounded-full border border-ink/10 bg-paper px-2.5 py-1 text-[11px] text-ink-soft">
                        {specialty}
                      </span>
                    ))}
                  </div>
                  <div className="mt-auto grid grid-cols-3 gap-2 border-t border-line pt-4 text-center">
                    <div>
                      <p className="latin text-base font-bold text-ink">{instructor.courseCount}</p>
                      <p className="text-[11px] text-ink-soft">كورس</p>
                    </div>
                    <div>
                      <p className="latin text-base font-bold text-ink">{formatCount(instructor.studentsCount)}</p>
                      <p className="text-[11px] text-ink-soft">متعلّم</p>
                    </div>
                    <div>
                      <p className="latin text-base font-bold text-ink">{instructor.experienceYears}</p>
                      <p className="text-[11px] text-ink-soft">سنة خبرة</p>
                    </div>
                  </div>
                </Link>
              </Reveal>
            ))}
            </div>
          </>
        )}
      </section>
    </PageShell>
  );
}
