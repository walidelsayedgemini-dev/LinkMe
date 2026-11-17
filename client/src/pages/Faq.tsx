import { useEffect, useMemo, useState } from "react";
import { Link, useSearch } from "wouter";
import { ArrowLeft, MessageCircle, Search, Sparkles } from "lucide-react";
import { PageShell } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { FAQ_GROUPS } from "@/lib/content";
import { cn } from "@/lib/utils";

export default function Faq() {
  const search = useSearch();
  const preset = new URLSearchParams(search).get("q") ?? "";
  const [query, setQuery] = useState("");
  const [openItem, setOpenItem] = useState<string>("");

  // Opening /faq?q=... jumps to the closest question and expands it.
  useEffect(() => {
    const needle = preset.trim().toLowerCase();
    if (!needle) return;
    const entries = FAQ_GROUPS.flatMap(group =>
      group.items.map((item, index) => ({ key: `${group.title}-${index}`, item }))
    );
    const match =
      entries.find(entry => entry.item.q === preset) ??
      entries.find(entry => entry.item.q.toLowerCase().includes(needle)) ??
      entries.find(entry => entry.item.a.toLowerCase().includes(needle));
    if (!match) return;
    setOpenItem(match.key);
    requestAnimationFrame(() => {
      document
        .getElementById(match.key)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }, [preset]);

  const groups = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return FAQ_GROUPS;
    return FAQ_GROUPS.map(group => ({
      ...group,
      items: group.items.filter(
        item => item.q.toLowerCase().includes(needle) || item.a.toLowerCase().includes(needle),
      ),
    })).filter(group => group.items.length > 0);
  }, [query]);

  const total = groups.reduce((sum, group) => sum + group.items.length, 0);
  const shortcuts = FAQ_GROUPS.flatMap(group => group.items).slice(0, 6);

  return (
    <PageShell>
      <section className="border-b border-line bg-paper-deep/60">
        <div className="container py-14">
          <p className="latin text-xs uppercase tracking-[0.2em] text-ink-soft">Help centre</p>
          <h1 className="mt-3 text-4xl leading-tight text-ink sm:text-5xl">الأسئلة الشائعة</h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-soft">
            دوس على أي سؤال يفتح الإجابة على طول، ولو لسه محتاج توضيح اسألنا في الشات بنفس السؤال.
          </p>
          <div className="relative mt-8 max-w-md">
            <Search className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
            <input
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="ابحث في الأسئلة…"
              className="h-12 w-full rounded-full border border-line bg-card pe-11 ps-4 text-sm focus:border-ink focus:outline-none"
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 text-[11px] text-ink-soft">
              <Sparkles className="size-3.5 text-iris" /> الأكثر سؤالًا:
            </span>
            {shortcuts.map(item => (
              <button
                key={item.q}
                type="button"
                onClick={() => setQuery(item.q)}
                className={cn(
                  "rounded-full border px-3 py-1 text-[11px] transition",
                  query === item.q
                    ? "border-iris bg-iris text-white"
                    : "border-line bg-card text-ink-soft hover:border-iris/50 hover:text-iris"
                )}
              >
                {item.q}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="container grid gap-10 py-12 lg:grid-cols-[1fr_320px]">
        <div className="space-y-10">
          {total === 0 ? (
            <div className="rounded-3xl border border-dashed border-ink/20 bg-card/60 p-14 text-center">
              <p className="font-semibold text-ink">لا يوجد سؤال مطابق</p>
              <p className="mt-1 text-sm text-ink-soft">
                جرّب كلمة أبسط، أو اسألنا في الشات وهنرد عليك.
              </p>
              <Button asChild className="mt-4 rounded-full bg-iris text-white">
                <Link href={`/chat?q=${encodeURIComponent(query.trim())}`}>
                  اسأل في الشات
                </Link>
              </Button>
            </div>
          ) : (
            groups.map(group => (
              <div key={group.title} id={group.title}>
                <h2 className="text-2xl text-ink">{group.title}</h2>
                <Accordion
                  type="single"
                  collapsible
                  value={openItem}
                  onValueChange={setOpenItem}
                  className="mt-4 rounded-3xl border border-line bg-card px-6"
                >
                  {group.items.map((item, index) => {
                    const value = `${group.title}-${index}`;
                    return (
                      <AccordionItem
                        key={item.q}
                        value={value}
                        id={value}
                        className="border-line scroll-mt-24"
                      >
                        <AccordionTrigger className="text-start text-[15px] font-semibold text-ink hover:no-underline">
                          {item.q}
                        </AccordionTrigger>
                        <AccordionContent>
                          <p className="text-sm leading-relaxed text-ink-soft">{item.a}</p>
                          <Link
                            href={`/chat?q=${encodeURIComponent(item.q)}`}
                            className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-iris/30 bg-iris/5 px-3 py-1.5 text-xs text-iris transition hover:bg-iris/10"
                          >
                            <MessageCircle className="size-3.5" /> اسأل عن ده في الشات
                            <ArrowLeft className="size-3" />
                          </Link>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              </div>
            ))
          )}
        </div>

        <aside className="h-fit rounded-3xl border border-line bg-card p-6 shadow-[4px_4px_0_0_var(--color-ink)] lg:sticky lg:top-24">
          <MessageCircle className="size-6 text-iris" />
          <h3 className="mt-3 text-lg font-bold text-ink">لسه عندك سؤال؟</h3>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            افتح شات مباشر مع المدرّس — تكتب سؤالك، والرد يوصلك في نفس الصفحة.
          </p>
          <Button asChild className="mt-5 w-full rounded-full bg-iris text-white hover:bg-iris-deep">
            <Link href="/chat">كلّم المدرّس في الشات</Link>
          </Button>
          <Button asChild variant="outline" className="mt-2 w-full rounded-full border-ink/20">
            <Link href="/courses">تصفّح الكورسات</Link>
          </Button>
        </aside>
      </section>
    </PageShell>
  );
}
