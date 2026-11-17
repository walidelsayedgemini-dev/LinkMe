import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import {
  ArrowLeft,
  CheckCheck,
  Loader2,
  MessageCircle,
  Send,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/format";
import { inputClass } from "@/pages/auth-layout";

const chat = trpc.chat;
const CHAT_READ_CHUNK_SIZE = 300;

export type ChatMessage = {
  id: number;
  fromOwner: boolean;
  body: string;
  createdAt: Date | string;
};

/** Interactive question chips: one tap writes the full question for you. */
export const QUICK_QUESTIONS = [
  "عايز أعرف مستواي المناسب أبدأ منين",
  "إزاي أدفع بفودافون كاش أو إنستاباي؟",
  "السيشن الأونلاين بتتسجّل ولا بتتنسى؟",
  "ممكن جدول مناسب لمحاضرات المسا؟",
  "الواجبات بتتصحح إمتى؟",
  "إيه الكورسات المناسبة لمستوايا وإزاي أبدأ؟",
];

function timeLabel(value: Date | string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return date.toLocaleTimeString("ar-EG", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Bubble({ message }: { message: ChatMessage }) {
  return (
    <div
      className={cn(
        "flex w-full gap-2",
        message.fromOwner ? "justify-start" : "justify-end"
      )}
    >
      {message.fromOwner && (
        <span className="mt-auto grid size-7 shrink-0 place-items-center rounded-full bg-iris/10 text-iris">
          <UserRound className="size-3.5" />
        </span>
      )}
      <div
        className={cn(
          "max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm",
          message.fromOwner
            ? "rounded-bl-md border border-line bg-card text-ink"
            : "rounded-br-md bg-iris text-white"
        )}
      >
        <p className="whitespace-pre-wrap break-words">{message.body}</p>
        <p
          className={cn(
            "mt-1 text-[10px]",
            message.fromOwner ? "text-ink-soft" : "text-white/70"
          )}
        >
          {timeLabel(message.createdAt)}
        </p>
      </div>
    </div>
  );
}

type ThreadProps = {
  messages: ChatMessage[];
  onSend: (body: string) => Promise<void>;
  sending?: boolean;
  disabled?: boolean;
  emptyText?: string;
  quickQuestions?: string[];
  inputPlaceholder?: string;
  conversationKey: string;
  initialDraft?: string;
  onLoadOlder?: () => Promise<void>;
  hasOlder?: boolean;
  loadingOlder?: boolean;
};

function readDraft(key: string) {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeDraft(key: string, value: string) {
  if (typeof window === "undefined") return;
  try {
    if (value) window.sessionStorage.setItem(key, value);
    else window.sessionStorage.removeItem(key);
  } catch {
    // Storage is a convenience; typing must still work when it is unavailable.
  }
}

/** Shared message list + composer used by the student page and the owner panel. */
export function ChatThread({
  messages,
  onSend,
  sending,
  disabled,
  emptyText = "مفيش رسائل لسه — اكتب سؤالك وهنرد عليك هنا.",
  quickQuestions = [],
  inputPlaceholder = "اكتب سؤالك بالإنجليزي أو بالعربي…",
  conversationKey,
  initialDraft,
  onLoadOlder,
  hasOlder = false,
  loadingOlder = false,
}: ThreadProps) {
  const storageKey = `fluently:chat-draft:${conversationKey}`;
  const [draft, setDraft] = useState(
    () => readDraft(storageKey) ?? initialDraft ?? ""
  );
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const shouldStickToBottomRef = useRef(true);
  const draftRef = useRef(draft);
  const submittingRef = useRef(false);
  const latestMessageId = messages[messages.length - 1]?.id;

  useEffect(() => {
    setDraft(readDraft(storageKey) ?? initialDraft ?? "");
  }, [storageKey, initialDraft]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || !shouldStickToBottomRef.current) return;
    viewport.scrollTo({ top: viewport.scrollHeight, behavior: "smooth" });
  }, [latestMessageId, messages.length]);

  const updateDraft = (value: string) => {
    draftRef.current = value;
    setDraft(value);
    writeDraft(storageKey, value);
  };

  const focusComposer = () => {
    requestAnimationFrame(() => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      textarea.focus();
      textarea.setSelectionRange(textarea.value.length, textarea.value.length);
    });
  };

  const submit = async (event?: React.FormEvent) => {
    event?.preventDefault();
    const body = draft.trim();
    const submittedDraft = draft;
    if (!body || sending || disabled || submittingRef.current) return;
    submittingRef.current = true;
    try {
      await onSend(body);
      if (draftRef.current === submittedDraft) updateDraft("");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "الرسالة مابعتتش، جرّب تاني."
      );
    } finally {
      submittingRef.current = false;
    }
  };

  const loadOlder = async () => {
    if (!onLoadOlder || loadingOlder) return;
    const viewport = viewportRef.current;
    const previousHeight = viewport?.scrollHeight ?? 0;
    const previousTop = viewport?.scrollTop ?? 0;
    shouldStickToBottomRef.current = false;
    await onLoadOlder();
    requestAnimationFrame(() => {
      if (!viewport || !viewportRef.current) return;
      viewport.scrollTop =
        previousTop + (viewport.scrollHeight - previousHeight);
    });
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div
        ref={viewportRef}
        onScroll={event => {
          const viewport = event.currentTarget;
          shouldStickToBottomRef.current =
            viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight <
            96;
        }}
        className="flex-1 space-y-3 overflow-y-auto bg-paper-deep/40 p-4"
      >
        {hasOlder && onLoadOlder && (
          <div className="flex justify-center pb-1">
            <Button
              type="button"
              variant="outline"
              className="h-8 rounded-full px-3 text-xs"
              onClick={() => void loadOlder()}
              disabled={loadingOlder}
            >
              {loadingOlder
                ? "جارٍ تحميل الرسائل الأقدم…"
                : "تحميل الرسائل الأقدم"}
            </Button>
          </div>
        )}
        {messages.length === 0 && (
          <p className="mx-auto mt-6 max-w-xs text-center text-sm text-ink-soft">
            {emptyText}
          </p>
        )}
        {messages.map(message => (
          <Bubble key={message.id} message={message} />
        ))}
      </div>

      {quickQuestions.length > 0 && (
        <div className="flex gap-2 overflow-x-auto border-t border-line bg-card px-3 py-2">
          {quickQuestions.map(question => (
            <button
              key={question}
              type="button"
              onClick={() => {
                updateDraft(question);
                focusComposer();
              }}
              className="shrink-0 rounded-full border border-line bg-paper px-3 py-1.5 text-[11px] text-ink-soft transition hover:border-iris/50 hover:text-iris"
            >
              {question}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={submit}
        className="flex items-end gap-2 border-t border-line bg-card p-3"
      >
        <textarea
          ref={textareaRef}
          dir="auto"
          value={draft}
          onChange={event => updateDraft(event.target.value)}
          onKeyDown={event => {
            if (
              event.key === "Enter" &&
              !event.shiftKey &&
              !event.nativeEvent.isComposing
            ) {
              event.preventDefault();
              void submit();
            }
          }}
          rows={1}
          maxLength={2000}
          disabled={disabled}
          placeholder={inputPlaceholder}
          className={cn(
            inputClass,
            "max-h-32 min-h-11 flex-1 resize-none py-2.5"
          )}
        />
        <Button
          type="submit"
          disabled={!draft.trim() || sending || disabled}
          className="size-11 shrink-0 rounded-full bg-iris p-0 text-white hover:bg-iris-deep"
          aria-label="إرسال"
        >
          {sending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Send className="size-4" />
          )}
        </Button>
      </form>
    </div>
  );
}

function QueryError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="rounded-3xl border border-line bg-card p-8 text-center">
      <p className="text-sm text-ink-soft">حصل عطل في تحميل الشات.</p>
      <Button
        type="button"
        variant="outline"
        className="mt-4 rounded-full"
        onClick={onRetry}
      >
        جرّب تاني
      </Button>
    </div>
  );
}

function mergeChatPages<T extends ChatMessage>(pages: T[][]) {
  const seen = new Set<number>();
  return pages
    .flat()
    .filter(message => {
      if (seen.has(message.id)) return false;
      seen.add(message.id);
      return true;
    })
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime() ||
        a.id - b.id
    );
}

/** Student side: my conversation with the owner. */
export function StudentChat({ initialQuestion }: { initialQuestion?: string }) {
  const { user, loading, refresh } = useAuth();
  const utils = trpc.useUtils();
  const mine = chat.mine.useInfiniteQuery(
    {},
    {
      enabled: Boolean(user),
      getNextPageParam: lastPage => lastPage.nextCursor ?? undefined,
      refetchInterval: 6000,
      refetchOnWindowFocus: true,
    }
  );
  const send = chat.send.useMutation();
  const markRead = chat.markRead.useMutation();
  const [bootstrapped, setBootstrapped] = useState(false);
  const [markReadError, setMarkReadError] = useState(false);
  const [readRetry, setReadRetry] = useState(0);
  const attemptedReadKey = useRef("");

  const messages = useMemo(
    () =>
      mergeChatPages(
        (mine.data?.pages ?? []).map(page => page.messages as ChatMessage[])
      ),
    [mine.data?.pages]
  );
  const unreadOwnerIds = useMemo(
    () =>
      messages.filter(message => message.fromOwner).map(message => message.id),
    [messages]
  );
  const unreadOwnerKey = unreadOwnerIds.join(",");

  useEffect(() => {
    const attemptKey = `${unreadOwnerKey}:${readRetry}`;
    if (
      !unreadOwnerKey ||
      attemptedReadKey.current === attemptKey ||
      markRead.isPending
    )
      return;
    attemptedReadKey.current = attemptKey;
    setMarkReadError(false);
    void (async () => {
      for (
        let start = 0;
        start < unreadOwnerIds.length;
        start += CHAT_READ_CHUNK_SIZE
      ) {
        await markRead.mutateAsync({
          messageIds: unreadOwnerIds.slice(start, start + CHAT_READ_CHUNK_SIZE),
        });
      }
    })()
      .then(() =>
        utils.chat.mine.invalidate().catch(() => {
          toast.warning("تم تعليم الرد كمقروء، لكن تعذر تحديث العداد.");
        })
      )
      .catch(() => setMarkReadError(true));
  }, [markRead, readRetry, unreadOwnerIds, unreadOwnerKey, utils]);

  if (loading) {
    return (
      <div className="rounded-3xl border border-line bg-card p-8 text-center text-sm text-ink-soft">
        جارٍ التحقق من الحساب…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="rounded-3xl border border-line bg-card p-8 text-center">
        <MessageCircle className="mx-auto size-8 text-iris" />
        <p className="mt-3 text-lg font-semibold text-ink">الشات متاح لحسابك</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-ink-soft">
          سجّل دخول أو اعمل حساب، وبعدها تكلم المدرّس مباشرة من هنا.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Button asChild className="rounded-full bg-iris text-white">
            <Link href="/login?next=%2Fchat">تسجيل الدخول</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/signup?next=%2Fchat">اعمل حساب</Link>
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="rounded-full"
            onClick={() => void refresh()}
          >
            تحديث الجلسة
          </Button>
        </div>
      </div>
    );
  }

  if (mine.isLoading) {
    return (
      <div className="rounded-3xl border border-line bg-card p-8 text-center text-sm text-ink-soft">
        جارٍ تحميل الرسائل…
      </div>
    );
  }

  if (mine.isError) return <QueryError onRetry={() => void mine.refetch()} />;

  return (
    <div className="flex h-[min(70vh,620px)] flex-col overflow-hidden rounded-3xl border border-line bg-card">
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-full bg-iris text-white">
            <MessageCircle className="size-4" />
          </span>
          <div>
            <p className="text-sm font-semibold text-ink">المدرّس · أ. ياسين</p>
            <p className="text-[11px] text-ink-soft">
              الرد بيظهر هنا داخل الموقع مع المتابعة الدورية
            </p>
          </div>
        </div>
        {mine.data?.pages[0]?.unreadFromOwner ? (
          <span className="rounded-full bg-iris/10 px-2.5 py-1 text-[11px] text-iris">
            {mine.data.pages[0].unreadFromOwner} رسالة جديدة
          </span>
        ) : (
          <span className="hidden items-center gap-1 text-[11px] text-ink-soft sm:flex">
            <CheckCheck className="size-3.5 text-iris" /> متابعة مباشرة
          </span>
        )}
      </div>
      {markReadError && (
        <div className="flex items-center justify-between gap-2 border-b border-line bg-amber-50 px-4 py-2 text-xs text-amber-800">
          <span>تعذر تحديث حالة الردود كمقروءة.</span>
          <Button
            type="button"
            variant="ghost"
            className="h-7 px-2 text-xs"
            onClick={() => {
              setReadRetry(value => value + 1);
            }}
          >
            إعادة المحاولة
          </Button>
        </div>
      )}
      <ChatThread
        conversationKey={`student:${user.id}`}
        initialDraft={initialQuestion}
        messages={messages}
        sending={send.isPending}
        quickQuestions={bootstrapped ? [] : QUICK_QUESTIONS}
        onSend={async body => {
          await send.mutateAsync({ body });
          setBootstrapped(true);
          void utils.chat.mine.invalidate().catch(() => {
            toast.warning(
              "اتحفظت رسالتك، لكن تعذر تحديث المحادثة. هتظهر مع المتابعة القادمة."
            );
          });
        }}
        hasOlder={Boolean(mine.hasNextPage)}
        loadingOlder={mine.isFetchingNextPage}
        onLoadOlder={async () => {
          if (mine.hasNextPage) await mine.fetchNextPage();
        }}
        emptyText="اكتب أول سؤال وهنرد عليك من هنا — مش محتاج واتساب."
        inputPlaceholder="اكتب رسالتك للمدرّس… (Enter للإرسال)"
      />
    </div>
  );
}

type ThreadSummary = {
  userId: number;
  name: string;
  email: string;
  lastMessageId: number | null;
  lastBody: string;
  lastFromOwner: boolean;
  lastAt: Date | string | null;
  unread: number;
};

/** Owner side: conversation list + reply box inside the admin console. */
export function OwnerInbox() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const [active, setActive] = useState<number | null>(null);
  const threads = chat.threads.useQuery(undefined, {
    enabled: user?.role === "admin",
    refetchInterval: 10_000,
  });
  const thread = chat.thread.useInfiniteQuery(
    { userId: active ?? 0 },
    {
      enabled: Boolean(active && user?.role === "admin"),
      getNextPageParam: lastPage => lastPage.nextCursor ?? undefined,
      refetchInterval: 8000,
    }
  );
  const reply = chat.reply.useMutation();

  const rows = useMemo(
    () => (threads.data ?? []) as ThreadSummary[],
    [threads.data]
  );
  const totalUnread = rows.reduce((sum, row) => sum + row.unread, 0);
  const threadPages = thread.data?.pages ?? [];
  const threadStudent = threadPages[0]?.student;
  const threadMessages = useMemo(
    () =>
      mergeChatPages(threadPages.map(page => page.messages as ChatMessage[])),
    [threadPages]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl text-ink">رسائل الطلاب</h2>
          <p className="mt-1 text-sm text-ink-soft">
            كل طالب ليه شات خاص معاك. الرد بيظهر عنده داخل الموقع مع المتابعة
            الدورية.
          </p>
        </div>
        <span
          className={cn(
            "w-fit rounded-full px-3 py-1 text-xs",
            totalUnread > 0
              ? "bg-iris/10 text-iris"
              : "border border-line text-ink-soft"
          )}
        >
          {totalUnread > 0 ? `${totalUnread} رسالة جديدة` : "مفيش رسائل جديدة"}
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
        <div className="overflow-hidden rounded-2xl border border-line bg-card">
          {threads.isLoading && (
            <p className="p-6 text-center text-sm text-ink-soft">
              جارٍ التحميل…
            </p>
          )}
          {threads.isError && (
            <div className="p-6 text-center">
              <p className="text-sm text-ink-soft">تعذر تحميل رسائل الطلاب.</p>
              <Button
                type="button"
                variant="outline"
                className="mt-3 rounded-full"
                onClick={() => void threads.refetch()}
              >
                جرّب تاني
              </Button>
            </div>
          )}
          {!threads.isLoading && !threads.isError && rows.length === 0 && (
            <p className="p-6 text-center text-sm text-ink-soft">
              مفيش حسابات طلاب متاحة للاختيار حاليًا.
            </p>
          )}
          <ul className="max-h-[520px] divide-y divide-line overflow-y-auto">
            {rows.map(row => (
              <li key={row.userId}>
                <button
                  type="button"
                  onClick={() => setActive(row.userId)}
                  className={cn(
                    "flex w-full items-start gap-2.5 px-3.5 py-3 text-start transition",
                    active === row.userId ? "bg-iris/8" : "hover:bg-paper"
                  )}
                >
                  <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-iris/10 text-xs font-bold text-iris">
                    {(row.name || "؟").slice(0, 1)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium text-ink">
                        {row.name}
                      </span>
                      <span className="shrink-0 text-[10px] text-ink-soft">
                        {timeLabel(row.lastAt)}
                      </span>
                    </span>
                    <span className="mt-0.5 block truncate text-[11px] text-ink-soft">
                      {row.lastFromOwner ? "أنت: " : ""}
                      {row.lastBody}
                    </span>
                  </span>
                  {row.unread > 0 && (
                    <span className="mt-1 grid size-5 shrink-0 place-items-center rounded-full bg-iris text-[10px] font-bold text-white">
                      {row.unread}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex h-[520px] flex-col overflow-hidden rounded-2xl border border-line bg-card">
          {!active ? (
            <div className="grid h-full place-items-center p-8 text-center">
              <div>
                <MessageCircle className="mx-auto size-8 text-ink-soft" />
                <p className="mt-3 text-sm font-semibold text-ink">
                  اختار طالب من القائمة
                </p>
                <p className="mt-1 text-xs text-ink-soft">
                  هتشوف كل رسائله وتقدر ترد عليه من هنا.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">
                    {threadStudent?.name ?? `طالب #${active}`}
                  </p>
                  <p className="truncate text-[11px] text-ink-soft">
                    {threadStudent?.email ?? ""}
                  </p>
                </div>
                <Link
                  href={`/students/${active}`}
                  className="inline-flex shrink-0 items-center gap-1 text-[11px] text-iris hover:underline"
                >
                  ملف الطالب <ArrowLeft className="size-3" />
                </Link>
              </div>
              {thread.isError ? (
                <div className="grid flex-1 place-items-center p-8 text-center">
                  <div>
                    <p className="text-sm text-ink-soft">
                      تعذر تحميل محادثة الطالب.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-3 rounded-full"
                      onClick={() => void thread.refetch()}
                    >
                      جرّب تاني
                    </Button>
                  </div>
                </div>
              ) : (
                <ChatThread
                  key={`owner:${active}`}
                  conversationKey={`owner:${active}`}
                  messages={threadMessages}
                  sending={reply.isPending}
                  onSend={async body => {
                    await reply.mutateAsync({ userId: active, body });
                    void Promise.all([
                      thread.refetch(),
                      utils.chat.threads.invalidate(),
                    ]).catch(() => {
                      toast.warning(
                        "اتحفظ ردك، لكن تعذر تحديث القائمة. هتظهر التغييرات مع المتابعة القادمة."
                      );
                    });
                  }}
                  hasOlder={Boolean(thread.hasNextPage)}
                  loadingOlder={thread.isFetchingNextPage}
                  onLoadOlder={async () => {
                    if (thread.hasNextPage) await thread.fetchNextPage();
                  }}
                  emptyText="لسه مفيش رسائل في المحادثة دي."
                  inputPlaceholder="اكتب ردك للطالب…"
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
