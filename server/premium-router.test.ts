import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";
import { premiumRouter } from "./routers/premium";
import { hashPassword } from "./auth";
import {
  premiumCoachNotes,
  premiumDailyAttempts,
  premiumLessonProgress,
  premiumMemberships,
} from "../drizzle/premium-schema";
import { orders, users } from "../drizzle/schema";

const mocks = vi.hoisted(() => ({ getDb: vi.fn() }));
vi.mock("./db", () => ({ getDb: mocks.getDb }));

type State = {
  users: any[];
  memberships: any[];
  attempts: any[];
  progress: any[];
  notes: any[];
  orders: any[];
  selectQueue: any[][];
};

function context(
  user: { id: number; role: "user" | "admin" | "instructor" },
  premiumNow: Date
): TrpcContext & { premiumNow: Date } {
  return {
    req: { headers: {}, ip: "premium-test" },
    res: {},
    user,
    premiumNow,
  } as TrpcContext & { premiumNow: Date };
}

function createDb(state: State) {
  const tableRows = (table: unknown) => {
    if (table === users) return state.users;
    if (table === premiumMemberships) return state.memberships;
    if (table === premiumDailyAttempts) return state.attempts;
    if (table === premiumLessonProgress) return state.progress;
    if (table === premiumCoachNotes) return state.notes;
    if (table === orders) return state.orders;
    return [];
  };
  const selectRows = (table: unknown) =>
    state.selectQueue.length ? state.selectQueue.shift()! : tableRows(table);
  const db: any = {
    select: vi.fn(() => {
      const query: any = { table: null as unknown, rows: [] as any[] };
      query.from = (table: unknown) => {
        query.table = table;
        query.rows = selectRows(table);
        return query;
      };
      query.where = () => query;
      query.orderBy = () => query;
      query.limit = () => query;
      query.for = async () => query.rows;
      query.then = (
        resolve: (value: any[]) => unknown,
        reject?: (reason: unknown) => unknown
      ) => Promise.resolve(query.rows).then(resolve, reject);
      return query;
    }),
    insert: vi.fn((table: unknown) => ({
      values: async (values: any) => {
        const rows = tableRows(table);
        rows.push({ id: rows.length + 1, ...values });
        return [{ insertId: rows.length, affectedRows: 1 }, []];
      },
    })),
    update: vi.fn((table: unknown) => ({
      set: (values: any) => ({
        where: async () => {
          for (const row of tableRows(table)) Object.assign(row, values);
        },
      }),
    })),
    transaction: async (callback: (tx: any) => unknown) => callback(db),
  };
  return db;
}

function membership(overrides: Partial<any> = {}) {
  const startDate = new Date("2026-03-29T00:00:00.000Z");
  return {
    id: 1,
    userId: 1,
    levels: JSON.stringify(["A1"]),
    startDate,
    endDate: new Date("2026-04-28T00:00:00.000Z"),
    status: "active",
    durationDays: 30,
    paidAmountCents: 300000,
    paymentReference: "receipt-1",
    activatedBy: 99,
    coachUserId: null,
    createdAt: startDate,
    updatedAt: startDate,
    ...overrides,
  };
}

const student = {
  id: 1,
  role: "user" as const,
  name: "Student",
  email: "student@example.com",
};
const coach = {
  id: 9,
  role: "instructor" as const,
  name: "Coach",
  email: "coach@example.com",
};
const admin = {
  id: 99,
  role: "admin" as const,
  name: "Owner",
  email: "owner@example.com",
};
const now = new Date("2026-03-29T03:00:00.000Z");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("premium router authorization and activation", () => {
  it("keeps catalog public and exposes the server price per level", async () => {
    const result = await premiumRouter
      .createCaller(context({ id: 1, role: "user" }, now))
      .catalog();
    expect(result.priceCents).toBe(300000);
    expect(result.pricePerLevelCents).toBe(300000);
    expect(result.terms.manualActivation).toBe(true);
    expect(result).not.toHaveProperty("questions");
  });

  it("rejects non-admin activation before any database operation", async () => {
    const db = createDb({
      users: [student],
      memberships: [],
      attempts: [],
      progress: [],
      notes: [],
      orders: [],
      selectQueue: [],
    });
    mocks.getDb.mockResolvedValue(db);
    await expect(
      premiumRouter.createCaller(context(student, now)).activate({
        userId: 1,
        levels: ["A1"],
        durationDays: 30,
        paymentConfirmed: true,
        paymentReference: "receipt-1",
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("requires a real role=user student and computes amount from unique levels", async () => {
    const state: State = {
      users: [student],
      memberships: [],
      attempts: [],
      progress: [],
      notes: [],
      orders: [],
      selectQueue: [],
    };
    const db = createDb(state);
    mocks.getDb.mockResolvedValue(db);
    const result = await premiumRouter
      .createCaller(context(admin, now))
      .activate({
        userId: 1,
        levels: ["A1", "B1"],
        durationDays: 365,
        paymentConfirmed: true,
        paymentReference: "bank-transfer-7",
      });
    expect(result.amountCents).toBe(600000);
    expect(result.membership.paidAmountCents).toBe(600000);
    expect(result.membership.levels).toEqual(["A1", "B1"]);
    expect(state.orders).toHaveLength(1);
    expect(state.orders[0]).toMatchObject({
      kind: "subscription",
      amountCents: 600000,
      currency: "EGP",
      status: "paid",
      provider: "manual",
      reference: "premium:1 bank-transfer-7",
    });
    expect(state.users[0].role).toBe("user");

    state.users[0].role = "admin";
    await expect(
      premiumRouter.createCaller(context(admin, now)).activate({
        userId: 1,
        levels: ["C2"],
        durationDays: 30,
        paymentConfirmed: true,
        paymentReference: "bank-transfer-8",
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("validates and stores an optional coach in the activation transaction", async () => {
    const activationStudent = { ...student, role: "user" as const };
    const state: State = {
      users: [activationStudent, coach],
      memberships: [],
      attempts: [],
      progress: [],
      notes: [],
      orders: [],
      selectQueue: [[activationStudent, coach], [coach]],
    };
    const db = createDb(state);
    mocks.getDb.mockResolvedValue(db);
    const result = await premiumRouter
      .createCaller(context(admin, now))
      .activate({
        userId: student.id,
        levels: ["A1"],
        durationDays: 30,
        paymentConfirmed: true,
        paymentReference: "bank-transfer-coach",
        coachUserId: coach.id,
      });
    expect(result.membership.coachUserId).toBe(coach.id);
    expect(state.memberships[0].coachUserId).toBe(coach.id);
  });

  it("hides and rejects seeded instructors until they use a private password", async () => {
    const demoCoach = {
      id: 10,
      role: "instructor" as const,
      name: "Demo Coach",
      openId: "seed_demo_coach",
      passwordHash: hashPassword("linkme123"),
    };
    const staffDb = createDb({
      users: [admin, coach, demoCoach],
      memberships: [],
      attempts: [],
      progress: [],
      notes: [],
      orders: [],
      selectQueue: [],
    });
    mocks.getDb.mockResolvedValue(staffDb);
    const staff = await premiumRouter.createCaller(context(admin, now)).staff();
    expect(staff.some(item => item.id === demoCoach.id)).toBe(false);
    expect(staff[0]).not.toHaveProperty("passwordHash");

    const activationStudent = { ...student, role: "user" as const };
    const activationDb = createDb({
      users: [activationStudent, demoCoach],
      memberships: [],
      attempts: [],
      progress: [],
      notes: [],
      orders: [],
      selectQueue: [[activationStudent, demoCoach], [demoCoach]],
    });
    mocks.getDb.mockResolvedValue(activationDb);
    await expect(
      premiumRouter.createCaller(context(admin, now)).activate({
        userId: activationStudent.id,
        levels: ["A1"],
        durationDays: 30,
        paymentConfirmed: true,
        paymentReference: "demo-coach-blocked",
        coachUserId: demoCoach.id,
      })
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: "حساب المدرس التجريبي محتاج كلمة مرور خاصة قبل تعيينه",
    });
    expect(activationDb.insert).not.toHaveBeenCalled();

    const assignDb = createDb({
      users: [demoCoach],
      memberships: [membership()],
      attempts: [],
      progress: [],
      notes: [],
      orders: [],
      selectQueue: [[membership()], [demoCoach]],
    });
    mocks.getDb.mockResolvedValue(assignDb);
    await expect(
      premiumRouter.createCaller(context(admin, now)).assignCoach({
        membershipId: 1,
        coachUserId: demoCoach.id,
      })
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: "حساب المدرس التجريبي محتاج كلمة مرور خاصة قبل تعيينه",
    });
    expect(assignDb.update).not.toHaveBeenCalled();
  });
});

describe("premium router student boundaries and daily attempts", () => {
  it("does not let a different student open another student's detail", async () => {
    const db = createDb({
      users: [student],
      memberships: [membership()],
      attempts: [],
      progress: [],
      notes: [],
      orders: [],
      selectQueue: [],
    });
    mocks.getDb.mockResolvedValue(db);
    await expect(
      premiumRouter
        .createCaller(context({ id: 2, role: "user" }, now))
        .student({ userId: 1 })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("rejects future days and inactive memberships while retaining mine history", async () => {
    const paused = membership({ status: "paused" });
    const db = createDb({
      users: [student],
      memberships: [paused],
      attempts: [],
      progress: [],
      notes: [],
      orders: [],
      selectQueue: [],
    });
    mocks.getDb.mockResolvedValue(db);
    await expect(
      premiumRouter.createCaller(context(student, now)).day({ dayIndex: 1 })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });

    const activeDb = createDb({
      users: [student],
      memberships: [membership()],
      attempts: [],
      progress: [],
      notes: [],
      orders: [],
      selectQueue: [],
    });
    mocks.getDb.mockResolvedValue(activeDb);
    await expect(
      premiumRouter.createCaller(context(student, now)).day({ dayIndex: 2 })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("persists one selected daily set and makes submit idempotent", async () => {
    const dbState: State = {
      users: [student],
      memberships: [membership()],
      attempts: [],
      progress: [],
      notes: [],
      orders: [],
      selectQueue: [],
    };
    const db = createDb(dbState);
    mocks.getDb.mockResolvedValue(db);
    const caller = premiumRouter.createCaller(context(student, now));
    const first = await caller.day({ dayIndex: 1 });
    const second = await caller.day({ dayIndex: 1 });
    expect(second.questions.map((item: any) => item.id)).toEqual(
      first.questions.map((item: any) => item.id)
    );
    expect(dbState.attempts).toHaveLength(1);

    const answers = Object.fromEntries(
      first.questions.map((item: any) => [item.id, 0])
    );
    const submitted = await caller.submitDaily({ dayIndex: 1, answers });
    const repeated = await caller.submitDaily({ dayIndex: 1, answers });
    expect(submitted.completed).toBe(true);
    expect(repeated.score).toBe(submitted.score);
    expect(dbState.attempts).toHaveLength(1);
  });
});

describe("premium coach boundaries", () => {
  it("returns only assigned coach students and rejects unassigned feedback", async () => {
    const assigned = membership({ coachUserId: 9 });
    const db = createDb({
      users: [student],
      memberships: [assigned],
      attempts: [],
      progress: [],
      notes: [],
      orders: [],
      selectQueue: [],
    });
    mocks.getDb.mockResolvedValue(db);
    const coach = premiumRouter.createCaller(
      context({ id: 9, role: "instructor" }, now)
    );
    const students = await coach.coachStudents();
    expect(students).toHaveLength(1);
    expect(students[0].userId).toBe(1);
    expect(students[0].name).toBe("Student");

    await expect(
      premiumRouter
        .createCaller(context({ id: 8, role: "instructor" }, now))
        .feedback({ userId: 1, note: "مش مخصص لي" })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
