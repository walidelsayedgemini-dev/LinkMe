import { useState } from "react";
import { Link } from "wouter";
import { Clock, Mail, MapPin, MessageSquare, Send, Users } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";
import { inputClass } from "./auth-layout";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { SUPPORT_EMAIL } from "@/lib/content";
import { WhatsAppIcon, openWhatsApp } from "@/components/whatsapp";

const TOPICS = ["سؤال عن كورس", "مشكلة في الدفع", "مشكلة تقنية", "شراكة أو تعاون", "أخرى"];

export default function Contact() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: TOPICS[0],
    message: "",
  });
  const [sent, setSent] = useState(false);

  const send = trpc.billing.sendMessage.useMutation({
    onSuccess: () => {
      setSent(true);
      setForm({ name: "", email: "", subject: TOPICS[0], message: "" });
      toast.success("تم إرسال رسالتك — سنرد خلال 24 ساعة");
    },
    onError: error => toast.error(error.message),
  });

  return (
    <PageShell>
      <section className="border-b border-line bg-paper-deep/60">
        <div className="container py-14">
          <p className="latin text-xs uppercase tracking-[0.2em] text-ink-soft">Contact</p>
          <h1 className="mt-3 text-4xl leading-tight text-ink sm:text-5xl">تواصل معنا</h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-soft">
            سؤال عن كورس، مشكلة دفع، أو اقتراح؟ اكتبلنا ونرد عليك خلال يوم عمل واحد.
          </p>
        </div>
      </section>

      <section className="container grid gap-10 py-12 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-line bg-card p-6 sm:p-8">
          {sent ? (
            <div className="py-10 text-center">
              <span className="mx-auto grid size-14 place-items-center rounded-full bg-acid">
                <Send className="size-6 text-ink" />
              </span>
              <h2 className="mt-5 text-2xl text-ink">وصلتنا رسالتك</h2>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-soft">
                شكرًا لتواصلك. فريق الدعم سيراجع الرسالة ويرد على بريدك خلال 24 ساعة في أيام العمل.
              </p>
              <Button variant="outline" className="mt-6 rounded-full border-ink/20" onClick={() => setSent(false)}>
                إرسال رسالة أخرى
              </Button>
            </div>
          ) : (
            <form
              className="space-y-4"
              onSubmit={event => {
                event.preventDefault();
                send.mutate({
                  name: form.name || user?.name || "",
                  email: form.email || user?.email || "",
                  subject: form.subject,
                  message: form.message,
                });
              }}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1.5 text-sm">
                  <span className="font-medium text-ink">الاسم</span>
                  <input
                    required
                    className={inputClass}
                    value={form.name || user?.name || ""}
                    onChange={event => setForm({ ...form, name: event.target.value })}
                    placeholder="اسمك"
                  />
                </label>
                <label className="space-y-1.5 text-sm">
                  <span className="font-medium text-ink">البريد الإلكتروني</span>
                  <input
                    type="email"
                    required
                    dir="ltr"
                    className={inputClass}
                    value={form.email || user?.email || ""}
                    onChange={event => setForm({ ...form, email: event.target.value })}
                    placeholder="you@example.com"
                  />
                </label>
              </div>

              <div className="space-y-1.5 text-sm">
                <span className="font-medium text-ink">موضوع الرسالة</span>
                <div className="flex flex-wrap gap-2">
                  {TOPICS.map(topic => (
                    <button
                      key={topic}
                      type="button"
                      onClick={() => setForm({ ...form, subject: topic })}
                      className={cn(
                        "rounded-full border px-3.5 py-1.5 text-xs transition-colors",
                        form.subject === topic ? "border-ink bg-iris text-white" : "border-line text-ink-soft hover:border-ink",
                      )}
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </div>

              <label className="block space-y-1.5 text-sm">
                <span className="font-medium text-ink">الرسالة</span>
                <textarea
                  required
                  minLength={10}
                  className={cn(inputClass, "min-h-[150px] py-3")}
                  value={form.message}
                  onChange={event => setForm({ ...form, message: event.target.value })}
                  placeholder="اكتب تفاصيل سؤالك أو المشكلة…"
                />
              </label>

              <Button type="submit" disabled={send.isPending} className="h-11 w-full rounded-full bg-iris text-white hover:bg-iris-deep sm:w-auto sm:px-8">
                {send.isPending ? "جارٍ الإرسال…" : "إرسال الرسالة"}
              </Button>
              <p className="text-[11px] leading-relaxed text-ink-soft">
                لا نشارك بياناتك مع أي طرف ثالث. تُستخدم فقط للرد على استفسارك.
              </p>
            </form>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-[#25D366]/35 bg-[#25D366]/8 p-6">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-[#25D366] text-white">
                <WhatsAppIcon className="size-5" />
              </span>
              <h3 className="font-semibold text-ink">واتساب مباشر</h3>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">
              أسرع طريقة للتواصل — افتح المحادثة وابعت رسالتك، وهنرد عليك في نفس اليوم في أوقات العمل.
            </p>
            <button
              type="button"
              onClick={() => openWhatsApp()}
              className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#25D366] text-sm font-semibold text-white transition-colors hover:bg-[#1fb857]"
            >
              <WhatsAppIcon className="size-4" /> افتح محادثة واتساب
            </button>
          </div>
          {[
            { icon: Mail, title: "البريد الإلكتروني", lines: [SUPPORT_EMAIL, "للطلبات العامة والشكاوى"] },
            { icon: Clock, title: "وقت الرد", lines: ["خلال 24 ساعة في أيام العمل", "الأحد – الخميس · 9 ص – 6 م (GMT+2)"] },
            { icon: Users, title: "دعم المدرّسين", lines: ["instructors@linkme.app", "لطلبات نشر الكورسات"] },
            { icon: MapPin, title: "المكاتب", lines: ["القاهرة · دبي · لندن", "عمل مرن عن بُعد"] },
          ].map(card => (
            <div key={card.title} className="rounded-3xl border border-line bg-card p-6">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-paper-deep text-ink">
                  <card.icon className="size-5" />
                </span>
                <h3 className="font-semibold text-ink">{card.title}</h3>
              </div>
              {card.lines.map(line => (
                <p key={line} className="mt-2 text-sm text-ink-soft">{line}</p>
              ))}
            </div>
          ))}

          <div className="rounded-3xl border border-ink bg-navy p-6 text-white">
            <MessageSquare className="size-5 text-acid" />
            <p className="mt-3 text-sm leading-relaxed text-white/80">
              أسئلة سريعة عن الاشتراك أو الاسترجاع؟ كثير من الإجابات موجودة في{" "}
              <Link href="/faq" className="font-semibold text-acid underline underline-offset-4">الأسئلة الشائعة</Link>.
            </p>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
