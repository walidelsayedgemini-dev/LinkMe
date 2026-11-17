import { Link, useSearch } from "wouter";
import { Clock3, HelpCircle, MessageCircle, ShieldCheck } from "lucide-react";
import { PageShell } from "@/components/layout/site-footer";
import { OwnerInbox, StudentChat } from "@/components/chat";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { trpc } from "@/lib/trpc";
import { FAQ_GROUPS } from "@/lib/content";

export default function Chat() {
  const search = useSearch();
  const { user, loading } = useAuth();
  const authQuery = trpc.auth.me.useQuery(undefined, { retry: false });
  const question = new URLSearchParams(search).get("q")?.slice(0, 200) ?? undefined;
  const popular = FAQ_GROUPS[0]?.items.slice(0, 3) ?? [];

  return (
    <PageShell>
      <section className="border-b border-line bg-paper-deep/60">
        <div className="container grid gap-6 py-10 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="latin text-xs uppercase tracking-[0.2em] text-ink-soft">Direct chat</p>
            <h1 className="mt-2 text-4xl leading-tight text-ink sm:text-5xl">
              كلّمنا <span className="hl-word">مباشرة</span>
            </h1>
            <p className="mt-3 max-w-xl text-base leading-relaxed text-ink-soft">
              شات خاص بينك وبين المدرّس — اسأل عن مستواك، الجدول، الدفع، أو
              الواجبات، وهتلاقي الرد هنا داخل الموقع.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-ink-soft">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-card px-3 py-1.5">
              <Clock3 className="size-3.5 text-iris" /> الرد داخل الموقع
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-card px-3 py-1.5">
              <ShieldCheck className="size-3.5 text-iris" /> شات خاص بحسابك
            </span>
          </div>
        </div>
      </section>

      <section className="container grid gap-8 py-10 lg:grid-cols-[1fr_320px]">
        <div>
          {loading || authQuery.isLoading ? (
            <div className="rounded-3xl border border-line bg-card p-8 text-center text-sm text-ink-soft">
              جارٍ التحقق من الحساب…
            </div>
          ) : authQuery.isError ? (
            <div className="rounded-3xl border border-line bg-card p-8 text-center">
              <p className="text-sm text-ink-soft">تعذر التحقق من جلسة الدخول.</p>
              <Button
                type="button"
                variant="outline"
                className="mt-4 rounded-full"
                onClick={() => void authQuery.refetch()}
              >
                إعادة المحاولة
              </Button>
            </div>
          ) : user?.role === "admin" ? (
            <OwnerInbox />
          ) : (
            <StudentChat initialQuestion={question} />
          )}
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-line bg-card p-5">
            <p className="flex items-center gap-2 text-sm font-semibold text-ink">
              <HelpCircle className="size-4 text-iris" /> أسئلة بيسألها الطلاب
            </p>
            <ul className="mt-3 space-y-2">
              {popular.map(item => (
                <li key={item.q}>
                  <Link
                    href={`/faq?q=${encodeURIComponent(item.q)}`}
                    className="block rounded-xl border border-line bg-paper px-3 py-2 text-xs text-ink-soft transition hover:border-iris/40 hover:text-iris"
                  >
                    {item.q}
                  </Link>
                </li>
              ))}
            </ul>
            <Link
              href="/faq"
              className="mt-3 inline-flex items-center gap-1 text-xs text-iris hover:underline"
            >
              كل الأسئلة الشائعة
            </Link>
          </div>

          <div className="rounded-2xl border border-line bg-navy p-5 text-white">
            <MessageCircle className="size-5 text-white/80" />
            <p className="mt-2 text-sm font-semibold">محتاج تكلّمنا على واتساب؟</p>
            <p className="mt-1 text-xs leading-relaxed text-white/70">
              زرار الواتساب العائم موجود في كل الصفحات لو حابب تبعت صوت أو تدفع.
            </p>
          </div>
        </aside>
      </section>
    </PageShell>
  );
}
