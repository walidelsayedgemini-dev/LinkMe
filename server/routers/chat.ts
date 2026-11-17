import { alias } from "drizzle-orm/mysql-core";
import {
  and,
  asc,
  desc,
  eq,
  gt,
  inArray,
  isNull,
  lt,
  notExists,
  or,
  sql,
} from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { chatMessages, users } from "../../drizzle/schema";
import { adminProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { enforceRateLimit } from "../rate-limit";

const bodySchema = z.string().trim().min(1, "اكتب رسالتك الأول").max(2000);
const CHAT_PAGE_SIZE = 300;
const cursorSchema = z.object({
  createdAt: z.coerce.date(),
  id: z.number().int().positive(),
});
const minePageInput = z.object({ cursor: cursorSchema.optional() }).default({});
const threadPageInput = z.object({
  userId: z.number().int().positive(),
  cursor: cursorSchema.optional(),
});

async function requireDb() {
  const db = await getDb();
  if (!db)
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "تعذر الاتصال بقاعدة البيانات. جرّب تاني بعد شوية.",
    });
  return db;
}

export function isStudentChatRole(role: string | null | undefined) {
  return role === "user";
}

function requireStudentChatRole(ctx: { user: { role: string } }) {
  if (!isStudentChatRole(ctx.user.role)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "المحادثة الطلابية متاحة لحساب الطالب فقط.",
    });
  }
}

type ChatRow = typeof chatMessages.$inferSelect;

type OwnerLatestRow = {
  userId: number;
  name: string | null;
  email: string | null;
  lastId: number | null;
  lastBody: string | null;
  lastRole: string | null;
  lastAt: Date | null;
};

function toMessage(row: ChatRow) {
  return {
    id: row.id,
    fromOwner: row.senderRole === "owner",
    body: row.body,
    createdAt: row.createdAt,
  };
}

/** Keep the newest 300 rows, then restore chronological order for rendering. */
export function latestMessagesForDisplay<
  T extends Pick<ChatRow, "id" | "createdAt">,
>(rows: T[]): T[] {
  return [...rows]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() ||
        b.id - a.id
    )
    .slice(0, 300)
    .reverse();
}

/** A page cursor is exclusive, so equal timestamps are safely split by ID. */
export function isOlderThanCursor(
  row: Pick<ChatRow, "id" | "createdAt">,
  cursor: { id: number; createdAt: Date }
) {
  const rowTime = new Date(row.createdAt).getTime();
  const cursorTime = new Date(cursor.createdAt).getTime();
  return rowTime < cursorTime || (rowTime === cursorTime && row.id < cursor.id);
}

export function aggregateUnreadByUser(
  rows: Array<Pick<ChatRow, "userId" | "senderRole" | "readByOwnerAt">>
) {
  const unread = new Map<number, number>();
  for (const row of rows) {
    if (row.senderRole !== "student" || row.readByOwnerAt) continue;
    unread.set(row.userId, (unread.get(row.userId) ?? 0) + 1);
  }
  return unread;
}

/** One deterministic latest row per student, with unread counts from every row. */
export function buildOwnerThreadRows(
  latestRows: OwnerLatestRow[],
  unreadByUser: ReadonlyMap<number, number>
) {
  const seen = new Set<number>();
  return [...latestRows]
    .sort(
      (a, b) =>
        (b.lastAt ? new Date(b.lastAt).getTime() : -Infinity) -
          (a.lastAt ? new Date(a.lastAt).getTime() : -Infinity) ||
        (b.lastId ?? 0) - (a.lastId ?? 0) ||
        a.userId - b.userId
    )
    .filter(row => {
      if (seen.has(row.userId)) return false;
      seen.add(row.userId);
      return true;
    })
    .map(row => ({
      userId: row.userId,
      name: row.name ?? `طالب #${row.userId}`,
      email: row.email ?? "",
      lastMessageId: row.lastId,
      lastBody: row.lastBody ?? "لسه مفيش رسائل",
      lastFromOwner: row.lastRole === "owner",
      lastAt: row.lastAt,
      unread: unreadByUser.get(row.userId) ?? 0,
    }));
}

export const chatRouter = router({
  /** Student: newest page first; older pages are fetched with an exclusive cursor. */
  mine: protectedProcedure
    .input(minePageInput)
    .query(async ({ ctx, input }) => {
      requireStudentChatRole(ctx);
      const db = await requireDb();
      const rows = await db
        .select()
        .from(chatMessages)
        .where(
          and(
            eq(chatMessages.userId, ctx.user.id),
            input.cursor
              ? or(
                  lt(chatMessages.createdAt, input.cursor.createdAt),
                  and(
                    eq(chatMessages.createdAt, input.cursor.createdAt),
                    lt(chatMessages.id, input.cursor.id)
                  )
                )
              : undefined
          )
        )
        .orderBy(desc(chatMessages.createdAt), desc(chatMessages.id))
        .limit(CHAT_PAGE_SIZE + 1);
      const [unreadRow] = await db
        .select({
          unread: sql<number>`count(*)`,
        })
        .from(chatMessages)
        .where(
          and(
            eq(chatMessages.userId, ctx.user.id),
            eq(chatMessages.senderRole, "owner"),
            isNull(chatMessages.readByStudentAt)
          )
        );
      const hasMore = rows.length > CHAT_PAGE_SIZE;
      const pageRows = rows.slice(0, CHAT_PAGE_SIZE);
      const orderedRows = [...pageRows].reverse();
      const oldest = pageRows.at(-1);
      return {
        messages: orderedRows.map(toMessage),
        unreadFromOwner: Number(unreadRow?.unread ?? 0),
        nextCursor:
          hasMore && oldest
            ? { createdAt: oldest.createdAt, id: oldest.id }
            : null,
      };
    }),

  /** Student: send a message to the owner. */
  send: protectedProcedure
    .input(z.object({ body: bodySchema }))
    .mutation(async ({ ctx, input }) => {
      requireStudentChatRole(ctx);
      enforceRateLimit(ctx.req, "chat", 30, 5 * 60 * 1000);
      const db = await requireDb();
      const result = await db.insert(chatMessages).values({
        userId: ctx.user.id,
        senderRole: "student",
        body: input.body,
      });
      return { ok: true, messageId: Number(result[0].insertId) };
    }),

  /** Student: clear only the owner messages that were actually fetched. */
  markRead: protectedProcedure
    .input(
      z.object({ messageIds: z.array(z.number().int().positive()).max(300) })
    )
    .mutation(async ({ ctx, input }) => {
      requireStudentChatRole(ctx);
      const db = await requireDb();
      if (input.messageIds.length > 0) {
        await db
          .update(chatMessages)
          .set({ readByStudentAt: new Date() })
          .where(
            and(
              eq(chatMessages.userId, ctx.user.id),
              eq(chatMessages.senderRole, "owner"),
              isNull(chatMessages.readByStudentAt),
              inArray(chatMessages.id, input.messageIds)
            )
          );
      }
      return { ok: true };
    }),

  /** Owner: every conversation, newest activity first, with unread counts. */
  threads: adminProcedure.query(async () => {
    const db = await requireDb();
    const newer = alias(chatMessages, "newerChatMessage");
    const latestRows = await db
      .select({
        userId: users.id,
        name: users.name,
        email: users.email,
        lastId: chatMessages.id,
        lastBody: chatMessages.body,
        lastRole: chatMessages.senderRole,
        lastAt: chatMessages.createdAt,
      })
      .from(users)
      .leftJoin(chatMessages, eq(users.id, chatMessages.userId))
      .where(
        and(
          eq(users.role, "user"),
          or(
            isNull(chatMessages.id),
            notExists(
              db
                .select({ id: newer.id })
                .from(newer)
                .where(
                  and(
                    eq(newer.userId, chatMessages.userId),
                    or(
                      gt(newer.createdAt, chatMessages.createdAt),
                      and(
                        eq(newer.createdAt, chatMessages.createdAt),
                        gt(newer.id, chatMessages.id)
                      )
                    )
                  )
                )
            )
          )
        )
      )
      .orderBy(
        desc(chatMessages.createdAt),
        desc(chatMessages.id),
        asc(users.id)
      );
    const unreadRows = await db
      .select({
        userId: chatMessages.userId,
        unread: sql<number>`count(*)`,
      })
      .from(chatMessages)
      .where(
        and(
          eq(chatMessages.senderRole, "student"),
          isNull(chatMessages.readByOwnerAt)
        )
      )
      .groupBy(chatMessages.userId);
    const unreadByUser = new Map(
      unreadRows.map(row => [row.userId, Number(row.unread ?? 0)])
    );
    return buildOwnerThreadRows(latestRows, unreadByUser);
  }),

  /** Owner: read one conversation page and mark only that fetched page as read. */
  thread: adminProcedure.input(threadPageInput).query(async ({ input }) => {
    const db = await requireDb();
    const rows = await db
      .select()
      .from(chatMessages)
      .where(
        and(
          eq(chatMessages.userId, input.userId),
          input.cursor
            ? or(
                lt(chatMessages.createdAt, input.cursor.createdAt),
                and(
                  eq(chatMessages.createdAt, input.cursor.createdAt),
                  lt(chatMessages.id, input.cursor.id)
                )
              )
            : undefined
        )
      )
      .orderBy(desc(chatMessages.createdAt), desc(chatMessages.id))
      .limit(CHAT_PAGE_SIZE + 1);
    const hasMore = rows.length > CHAT_PAGE_SIZE;
    const pageRows = rows.slice(0, CHAT_PAGE_SIZE);
    const orderedRows = [...pageRows].reverse();
    const oldest = pageRows.at(-1);
    const [student] = await db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(eq(users.id, input.userId))
      .limit(1);
    const studentMessageIds = orderedRows
      .filter(row => row.senderRole === "student")
      .map(row => row.id);
    if (studentMessageIds.length > 0) {
      await db
        .update(chatMessages)
        .set({ readByOwnerAt: new Date() })
        .where(
          and(
            eq(chatMessages.userId, input.userId),
            eq(chatMessages.senderRole, "student"),
            isNull(chatMessages.readByOwnerAt),
            inArray(chatMessages.id, studentMessageIds)
          )
        );
    }
    return {
      student: student ?? { id: input.userId, name: null, email: null },
      messages: orderedRows.map(toMessage),
      nextCursor:
        hasMore && oldest
          ? { createdAt: oldest.createdAt, id: oldest.id }
          : null,
    };
  }),

  /** Owner: reply inside a valid student's thread. */
  reply: adminProcedure
    .input(z.object({ userId: z.number().int().positive(), body: bodySchema }))
    .mutation(async ({ ctx, input }) => {
      enforceRateLimit(ctx.req, "chat-reply", 120, 5 * 60 * 1000);
      const db = await requireDb();
      const [student] = await db
        .select({ id: users.id })
        .from(users)
        .where(and(eq(users.id, input.userId), eq(users.role, "user")))
        .limit(1);
      if (!student) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "الطالب غير موجود أو لم يعد حساب طالب صالحًا.",
        });
      }
      const result = await db.insert(chatMessages).values({
        userId: student.id,
        senderRole: "owner",
        body: input.body,
        readByOwnerAt: new Date(),
      });
      return { ok: true, messageId: Number(result[0].insertId) };
    }),
});
