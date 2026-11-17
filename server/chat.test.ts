import { describe, expect, it } from "vitest";
import type { TrpcContext } from "./_core/context";
import {
  aggregateUnreadByUser,
  buildOwnerThreadRows,
  chatRouter,
  isOlderThanCursor,
  isStudentChatRole,
  latestMessagesForDisplay,
} from "./routers/chat";

const context = (user: TrpcContext["user"]) =>
  ({ req: { headers: {}, ip: "test" }, res: {}, user }) as TrpcContext;

const student = { id: 11, role: "user" } as TrpcContext["user"];
const admin = { id: 99, role: "admin" } as TrpcContext["user"];

const message = (
  id: number,
  createdAt: Date,
  overrides: Record<string, unknown> = {}
) => ({
  id,
  userId: 11,
  senderRole: "student",
  body: `message ${id}`,
  readByStudentAt: null,
  readByOwnerAt: null,
  createdAt,
  ...overrides,
});

describe("chat role isolation", () => {
  it("keeps student and owner procedures separated before any database access", async () => {
    const studentCaller = chatRouter.createCaller(context(student));
    const adminCaller = chatRouter.createCaller(context(admin));

    await expect(studentCaller.threads()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(
      studentCaller.reply({ userId: 11, body: "reply" })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(adminCaller.mine()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(
      adminCaller.send({ body: "not a student message" })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("accepts only student-role targets for the student conversation", () => {
    expect(isStudentChatRole("user")).toBe(true);
    expect(isStudentChatRole("admin")).toBe(false);
    expect(isStudentChatRole("instructor")).toBe(false);
    expect(isStudentChatRole(undefined)).toBe(false);
  });

  it("rejects invalid read IDs at the caller boundary without a database", async () => {
    const caller = chatRouter.createCaller(context(student));
    await expect(caller.markRead({ messageIds: [0] })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
  });
});

describe("chat ordering and unread aggregation", () => {
  it("returns the newest 300 rows in chronological display order with ID tie-breaking", () => {
    const sameTime = new Date("2026-01-01T00:00:00.000Z");
    const rows = Array.from({ length: 301 }, (_, index) =>
      message(index + 1, sameTime)
    );
    const result = latestMessagesForDisplay(rows);

    expect(result).toHaveLength(300);
    expect(result[0].id).toBe(2);
    expect(result.at(-1)?.id).toBe(301);
  });

  it("uses an exclusive timestamp/ID cursor boundary", () => {
    const at = new Date("2026-01-01T00:00:00.000Z");
    const cursor = { createdAt: at, id: 10 };

    expect(isOlderThanCursor(message(9, at), cursor)).toBe(true);
    expect(isOlderThanCursor(message(10, at), cursor)).toBe(false);
    expect(isOlderThanCursor(message(11, at), cursor)).toBe(false);
    expect(
      isOlderThanCursor(message(12, new Date(at.getTime() - 1)), cursor)
    ).toBe(true);
  });

  it("counts every unread student message per user instead of grouping by body", () => {
    const rows = [
      message(1, new Date(), { userId: 11 }),
      message(2, new Date(), { userId: 11, body: "different body" }),
      message(3, new Date(), { userId: 11, senderRole: "owner" }),
      message(4, new Date(), { userId: 22, readByOwnerAt: new Date() }),
      message(5, new Date(), { userId: 22 }),
    ];
    const unread = aggregateUnreadByUser(rows);

    expect(unread.get(11)).toBe(2);
    expect(unread.get(22)).toBe(1);
  });

  it("chooses the actual latest row deterministically and carries all unread counts", () => {
    const at = new Date("2026-02-02T10:00:00.000Z");
    const rows = [
      {
        userId: 11,
        name: "Student 11",
        email: "11@example.test",
        lastId: 4,
        lastBody: "older",
        lastRole: "student",
        lastAt: at,
      },
      {
        userId: 11,
        name: "Student 11",
        email: "11@example.test",
        lastId: 9,
        lastBody: "latest",
        lastRole: "student",
        lastAt: at,
      },
      {
        userId: 22,
        name: null,
        email: null,
        lastId: 8,
        lastBody: "reply",
        lastRole: "owner",
        lastAt: new Date("2026-02-01T10:00:00.000Z"),
      },
    ];
    const result = buildOwnerThreadRows(
      rows,
      new Map([
        [11, 3],
        [22, 1],
      ])
    );

    expect(result.map(row => row.userId)).toEqual([11, 22]);
    expect(result[0]).toMatchObject({
      lastMessageId: 9,
      lastBody: "latest",
      unread: 3,
    });
    expect(result[1]).toMatchObject({
      name: "طالب #22",
      lastFromOwner: true,
      unread: 1,
    });
  });
});
