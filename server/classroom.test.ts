import { describe, expect, it } from "vitest";
import type { TrpcContext } from "./_core/context";
import {
  attendanceStatsForStudent,
  isAttendanceEligibleSession,
  isSafeHttpsMeetingUrl,
  isStudentEligibleForSession,
  isSessionWithinEnrollment,
  adminRouter,
} from "./routers/admin";

const context = (user: TrpcContext["user"]) =>
  ({ req: { headers: {}, ip: "test" }, res: {}, user }) as TrpcContext;
const admin = { id: 99, role: "admin" } as TrpcContext["user"];

const past = "2026-01-01T10:00:00.000Z";
const future = "2027-01-01T10:00:00.000Z";
const now = new Date("2026-06-01T00:00:00.000Z");

const session = (
  id: number,
  courseId: number | null,
  startsAt = past,
  status = "scheduled"
) => ({
  id,
  courseId,
  startsAt,
  status,
});

describe("classroom eligibility helpers", () => {
  it("does not count classes from before the learner joined", () => {
    const enrollment = [
      { courseId: 7, enrolledAt: "2026-02-01T00:00:00.000Z" },
    ];
    expect(isSessionWithinEnrollment(session(1, 7), enrollment)).toBe(false);
    expect(
      isSessionWithinEnrollment(
        session(2, 7, "2026-03-01T10:00:00.000Z"),
        enrollment
      )
    ).toBe(true);
    expect(isSessionWithinEnrollment(session(3, 8), enrollment)).toBe(false);
    expect(
      isSessionWithinEnrollment(
        session(4, null),
        [],
        "2026-02-01T00:00:00.000Z"
      )
    ).toBe(false);
  });
  it("uses all students for a legacy/global null course and enrollments for course sessions", () => {
    expect(isStudentEligibleForSession(null, 42, new Set())).toBe(true);
    expect(isStudentEligibleForSession(7, 42, new Set([7]))).toBe(true);
    expect(isStudentEligibleForSession(7, 42, new Set([8]))).toBe(false);
  });

  it("excludes canceled and future sessions but keeps completed sessions", () => {
    expect(isAttendanceEligibleSession(session(1, 7), now)).toBe(true);
    expect(isAttendanceEligibleSession(session(2, 7, future), now)).toBe(false);
    expect(
      isAttendanceEligibleSession(session(3, 7, future, "done"), now)
    ).toBe(true);
    expect(
      isAttendanceEligibleSession(session(4, 7, past, "canceled"), now)
    ).toBe(false);
  });

  it("counts missing marks as pending instead of absent", () => {
    const stats = attendanceStatsForStudent(
      [session(1, 7), session(2, 7), session(3, 8), session(4, null)],
      [{ sessionId: 1, userId: 11, status: "present" }],
      11,
      new Set([7]),
      now
    );
    expect(stats).toEqual({
      totalSessions: 3,
      attended: 1,
      unmarkedCount: 2,
      attendanceRate: 33,
    });
  });

  it("accepts only HTTPS meeting links without credentials", () => {
    expect(isSafeHttpsMeetingUrl("https://zoom.us/j/123")).toBe(true);
    expect(isSafeHttpsMeetingUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeHttpsMeetingUrl("https://user:pass@example.com/room")).toBe(
      false
    );
    expect(isSafeHttpsMeetingUrl("http://example.com/room")).toBe(false);
  });

  it("rejects malformed session dates and unsafe links before DB access", async () => {
    const caller = adminRouter.createCaller(context(admin));
    await expect(
      caller.createSession({
        courseId: 7,
        title: "Live practice",
        startsAt: "2026-06-01T10:00",
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(
      caller.createSession({
        courseId: 7,
        title: "Live practice",
        startsAt: "2026-06-01T10:00:00.000Z",
        meetingUrl: "javascript:alert(1)",
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
