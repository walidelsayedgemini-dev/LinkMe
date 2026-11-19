import { useEffect, useMemo, useState } from "react";
import { useSearch } from "wouter";
import { ChevronLeft, ChevronRight, Filter, Search, X } from "lucide-react";
import { PageShell } from "@/components/layout/site-footer";
import { AnimatedAurora, StudyDoodles } from "@/components/decor";
import { CourseCard } from "@/components/course-card";
import { Reveal } from "@/components/reveal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LEVELS } from "@/lib/format";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

const SORTS = [
  { value: "popular", label: "الأكثر شعبية" },
  { value: "rating", label: "الأعلى تقييمًا" },
  { value: "newest", label: "الأحدث" },
  { value: "price_asc", label: "الأقل سعرًا" },
  { value: "price_desc", label: "الأعلى سعرًا" },
] as const;

const PRICES = [
  { value: "all", label: "الكل" },
  { value: "paid", label: "مدفوع" },
] as const;

type SortValue = (typeof SORTS)[number]["value"];
type PriceValue = (typeof PRICES)[number]["value"];

export default function Courses() {
  const search = useSearch();
  const [, navigate] = useLocation();
  const params = useMemo(() => new URLSearchParams(search), [search]);

  const q = params.get("q") ?? "";
  const category = params.get("category") ?? "";
  const instructor = params.get("instructor") ?? "";
  const level = (params.get("level") ?? "") as "" | "beginner" | "intermediate" | "advanced" | "all";
  const price = (params.get("price") ?? "all") as PriceValue;
  const minRating = Number(params.get("rating") ?? 0);
  const sort = (params.get("sort") ?? "popular") as SortValue;
  const page = Math.max(1, Number(params.get("page") ?? 1));

  const [searchInput, setSearchInput] = useState(q);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => setSearchInput(q), [q]);

  // Scroll to top smoothly when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [page]);

  const update = (patch: Record<string, string | number | undefined>) => {
    const next = new URLSearchParams(params.toString());
    Object.entries(patch).forEach(([key, value]) => {
      if (value === undefined || value === "" || value === 0 || value === "all") next.delete(key);
      else next.set(key, String(value));
    });
    if (!("page" in patch)) next.delete("page");
    navigate(`/courses${next.toString() ? `?${next.toString()}` : ""}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const { data: categories } = trpc.catalog.categories.useQuery();
  const { data: instructors } = trpc.catalog.instructors.useQuery({});
  const { data, isLoading } = trpc.catalog.courses.useQuery({
    q: q || undefined,
    category: category || undefined,
    instructor: instructor || undefined,
    level: level || undefined,
    price,
    minRating,
    sort,
    page,
    pageSize: 9,
  });

  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / 9));
  const paginationItems = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const items: (number | "...")[] = [];
    const left = Math.max(2, page - 1);
    const right = Math.min(totalPages - 1, page + 1);

    items.push(1);
    if (left > 2) items.push("...");
    for (let i = left; i <= right; i++) {
      items.push(i);
    }
    if (right < totalPages - 1) items.push("...");
    items.push(totalPages);
    return items;
  }, [page, totalPages]);
  const activeFilters = [
    category && { key: "category", label: categories?.find(item => item.slug === category)?.nameAr ?? category },
    instructor && { key: "instructor", label: instructors?.find(item => item.slug === instructor)?.name ?? instructor },
    level && { key: "level", label: LEVELS.find(item => item.value === level)?.label ?? level },
    price !== "all" && { key: "price", label: PRICES.find(item => item.value === price)?.label ?? price },
    minRating > 0 && { key: "rating", label: `تقييم ${minRating}+` },
    q && { key: "q", label: `«${q}»` },
  ].filter(Boolean) as { key: string; label: string }[];

  const FilterGroup = ({
    title,
    children,
  }: {
    title: string;
    children: React.ReactNode;
  }) => (
    <div className="space-y-3 border-b border-line pb-5 last:border-0 last:pb-0">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-soft">{title}</h3>
      {children}
    </div>
  );

  const Option = ({
    active,
    onClick,
    children,
    count,
  }: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
    count?: number;
  }) => (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors",
        active ? "bg-iris text-white" : "text-ink-soft hover:bg-ink/5 hover:text-ink",
      )}
    >
      <span>{children}</span>
      {count !== undefined && <span className="latin text-xs opacity-70">{count}</span>}
    </button>
  );

  const filtersPanel = (
    <div className="space-y-6">
      <FilterGroup title="المسار">
        <Option active={!category} onClick={() => update({ category: undefined })}>
          كل المسارات
        </Option>
        {(categories ?? []).map(item => (
          <Option
            key={item.slug}
            active={category === item.slug}
            onClick={() => update({ category: item.slug })}
            count={item.courseCount}
          >
            {item.nameAr}
          </Option>
        ))}
      </FilterGroup>
      <FilterGroup title="المستوى">
        <Option active={!level} onClick={() => update({ level: undefined })}>
          كل المستويات
        </Option>
        {LEVELS.filter(item => item.value !== "all").map(item => (
          <Option key={item.value} active={level === item.value} onClick={() => update({ level: item.value })}>
            {item.label}
          </Option>
        ))}
      </FilterGroup>
      <FilterGroup title="السعر">
        <div className="flex gap-2">
          {PRICES.map(item => (
            <button
              key={item.value}
              onClick={() => update({ price: item.value })}
              className={cn(
                "flex-1 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                price === item.value ? "border-ink bg-iris text-white" : "border-line text-ink-soft hover:border-ink",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </FilterGroup>
      <FilterGroup title="التقييم">
        {[4.5, 4, 3].map(value => (
          <Option key={value} active={minRating === value} onClick={() => update({ rating: minRating === value ? undefined : value })}>
            {value}+ نجوم
          </Option>
        ))}
      </FilterGroup>
      <FilterGroup title="المدرّس">
        <Option active={!instructor} onClick={() => update({ instructor: undefined })}>
          كل المدرّسين
        </Option>
        {(instructors ?? []).map(item => (
          <Option key={item.slug} active={instructor === item.slug} onClick={() => update({ instructor: item.slug })}>
            {item.name}
          </Option>
        ))}
      </FilterGroup>
    </div>
  );

  return (
    <PageShell>
      <section className="relative overflow-hidden border-b border-line bg-paper-deep/60 dark:bg-gradient-to-br dark:from-[#0b1120] dark:via-[#0f172a] dark:to-[#172554]/40 dark:border-white/10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -end-24 size-96 rounded-full bg-cyan-500/10 blur-3xl hidden dark:block"
        />
        <AnimatedAurora className="opacity-60" />
        <StudyDoodles variant="soft" />
        <div className="container relative z-10 py-10 md:py-16">
          <p className="latin text-xs font-medium uppercase tracking-[0.2em] text-ink-soft">Course catalogue</p>
          <h1 className="mt-3 text-3xl leading-tight text-ink sm:text-5xl">
            كل الكورسات في <span className="hl-word">مكان واحد</span>
          </h1>
          <p className="mt-4 max-w-2xl text-sm sm:text-base leading-relaxed text-ink-soft">
            {data?.total ?? 0} كورسًا مصنّفة حسب المسار والمستوى والسعر. استخدم البحث والفلاتر للوصول لكورسك في ثوانٍ.
          </p>

          <form
            className="mt-6 sm:mt-8 flex w-full max-w-xl items-center gap-2"
            onSubmit={event => {
              event.preventDefault();
              update({ q: searchInput.trim() || undefined });
            }}
          >
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute start-4 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
              <input
                value={searchInput}
                onChange={event => setSearchInput(event.target.value)}
                placeholder="ابحث بالعنوان، المدرّس، أو الموضوع…"
                className="h-11 sm:h-12 w-full rounded-full border border-line bg-card ps-11 pe-4 text-sm text-ink placeholder:text-ink-soft/70 focus:border-ink focus:outline-none dark:bg-white/[0.06] dark:border-white/15 dark:text-white dark:focus:border-sky-400"
              />
            </div>
            <Button type="submit" className="h-11 sm:h-12 shrink-0 rounded-full bg-iris px-4 sm:px-6 text-white hover:bg-iris-deep">
              بحث
            </Button>
            <Button
              type="button"
              variant="outline"
              aria-label="الفلاتر"
              className="h-11 sm:h-12 shrink-0 rounded-full border-ink/20 lg:hidden"
              onClick={() => setShowFilters(value => !value)}
            >
              <Filter className="size-4" />
            </Button>
          </form>
        </div>
      </section>

      <section className="container py-10">
        <div className="grid gap-10 lg:grid-cols-[260px_1fr]">
          <aside className={cn("lg:block", showFilters ? "block" : "hidden")}>
            <div className="sticky top-24 rounded-3xl border border-line bg-card p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-bold text-ink">الفلاتر</h2>
                {activeFilters.length > 0 && (
                  <button
                    onClick={() => {
                      navigate("/courses");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="text-xs text-ink-soft underline-offset-2 hover:text-ink hover:underline"
                  >
                    مسح الكل
                  </button>
                )}
              </div>
              {filtersPanel}
            </div>
          </aside>

          <div>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {activeFilters.map(filter => (
                  <button
                    key={filter.key}
                    onClick={() => update({ [filter.key]: undefined })}
                    className="flex items-center gap-1.5 rounded-full bg-iris px-3 py-1.5 text-xs text-white"
                  >
                    {filter.label} <X className="size-3" />
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-ink-soft">ترتيب</span>
                <select
                  value={sort}
                  onChange={event => update({ sort: event.target.value })}
                  className="h-9 rounded-full border border-line bg-card px-3 text-xs text-ink focus:border-ink focus:outline-none dark:bg-[#0b1736] dark:text-white dark:border-white/20"
                >
                  {SORTS.map(item => (
                    <option key={item.value} value={item.value} className="bg-card text-ink dark:bg-[#0b1736] dark:text-white font-medium">
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {isLoading ? (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="h-80 animate-pulse rounded-3xl bg-ink/[0.06]" />
                ))}
              </div>
            ) : (data?.items.length ?? 0) === 0 ? (
              <div className="rounded-3xl border border-dashed border-ink/20 bg-card/60 p-16 text-center">
                <p className="text-lg font-semibold text-ink">لا توجد كورسات مطابقة</p>
                <p className="mt-2 text-sm text-ink-soft">جرّب مسح بعض الفلاتر أو البحث بكلمة أخرى.</p>
                <Button
                  variant="outline"
                  className="mt-6 rounded-full border-ink/20"
                  onClick={() => {
                    navigate("/courses");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  عرض كل الكورسات
                </Button>
              </div>
            ) : (
              <>
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {data!.items.map((course, index) => (
                    <Reveal key={course.id} delay={index * 0.04}>
                      <CourseCard course={course} />
                    </Reveal>
                  ))}
                </div>

                {totalPages > 1 && (
                  <nav aria-label="تنقل صفحات الكورسات" className="mt-10 flex flex-wrap items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-full border-ink/20 transition-transform active:scale-95"
                      disabled={page <= 1}
                      onClick={() => {
                        update({ page: page - 1 });
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      aria-label="الصفحة السابقة"
                    >
                      <ChevronRight className="size-4" />
                    </Button>
                    {paginationItems.map((item, index) =>
                      item === "..." ? (
                        <span key={`dots-${index}`} className="latin px-2 text-sm text-ink-soft select-none">
                          …
                        </span>
                      ) : (
                        <button
                          key={item}
                          type="button"
                          onClick={() => {
                            update({ page: item });
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                          className={cn(
                            "latin size-9 rounded-full text-sm font-medium transition-all duration-200",
                            page === item
                              ? "bg-iris text-white shadow-md shadow-iris/25 font-bold scale-105"
                              : "text-ink-soft hover:bg-ink/5 hover:text-ink",
                          )}
                          aria-current={page === item ? "page" : undefined}
                          aria-label={`انتقل إلى صفحة ${item}`}
                        >
                          {item}
                        </button>
                      ),
                    )}
                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-full border-ink/20 transition-transform active:scale-95"
                      disabled={page >= totalPages}
                      onClick={() => {
                        update({ page: page + 1 });
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      aria-label="الصفحة التالية"
                    >
                      <ChevronLeft className="size-4" />
                    </Button>
                  </nav>
                )}
              </>
            )}
          </div>
        </div>
      </section>
    </PageShell>
  );
}
