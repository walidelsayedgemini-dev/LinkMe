import { describe, expect, it } from "vitest";
import type { TrpcContext } from "./_core/context";
import { homeworkRouter } from "./routers/homework";
import {
  canStudentSubmitHomework,
  canSubmitHomework,
  isSafeHttpsUrl,
  reviewHomework,
} from "../shared/homework";

const context = (user: TrpcContext["user"]) =>
  ({ req: { headers: {}, ip: "test" }, res: {}, user }) as TrpcContext;

const student = { id: 11, role: "user" } as TrpcContext["user"];
const admin = { id: 99, role: "admin" } as TrpcContext["user"];

describe("homework authorization and validation", () => {
  it("rejects anonymous homework reads and submissions", async () => {
    const caller = homeworkRouter.createCaller(context(null));
    await expect(caller.mine()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(
      caller.submit({ taskId: 1, submissionText: "answer" })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("keeps list, create, and review admin-only", async () => {
    const caller = homeworkRouter.createCaller(context(student));
    await expect(caller.list()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      caller.create({
        studentIds: [11],
        title: "Practice",
        instructions: "Write five sentences",
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      caller.review({
        taskId: 1,
        action: "review",
        score: 90,
        feedback: "Good",
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("rejects whitespace-only submissions and unsafe URLs before any DB call", async () => {
    const caller = homeworkRouter.createCaller(context(student));
    await expect(
      caller.submit({ taskId: 1, submissionText: "   ", submissionUrl: "  " })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(
      caller.submit({ taskId: 1, submissionUrl: "http://example.com/work" })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(
      caller.submit({
        taskId: 1,
        submissionUrl: "https://user:pass@example.com/work",
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(isSafeHttpsUrl("https://example.com/work")).toBe(true);
  });

  it("accepts voice/audio submissions as a valid answer", async () => {
    const caller = homeworkRouter.createCaller(context(student));
    // Submitting audio should pass validation and reach DB check rather than BAD_REQUEST
    await expect(
      caller.submit({
        taskId: 1,
        submissionAudio: "data:audio/webm;base64,GkXfo59ChoEBQveBAULygQRC84EIQoKEd2VibUKHgQRChYECGFOAZwEAAAA=",
      })
    ).rejects.not.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("enforces score limits at the caller boundary", async () => {
    const caller = homeworkRouter.createCaller(context(admin));
    await expect(
      caller.review({
        taskId: 1,
        action: "review",
        score: 101,
        feedback: "Good",
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(
      caller.review({
        taskId: 1,
        action: "review",
        score: -1,
        feedback: "Good",
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});

describe("homework state transitions", () => {
  it("allows only the owner with an assigned/in-progress task to submit", () => {
    expect(canStudentSubmitHomework(7, 11, "assigned")).toBe(false);
    expect(canStudentSubmitHomework(11, 11, "assigned")).toBe(true);
    expect(canStudentSubmitHomework(11, 11, "in_progress")).toBe(true);
    expect(canStudentSubmitHomework(11, 11, "submitted")).toBe(false);
    expect(canStudentSubmitHomework(11, 11, "reviewed")).toBe(false);
    expect(canSubmitHomework("reviewed")).toBe(false);
  });

  it("models return then review and prevents direct review of non-submitted tasks", () => {
    expect(reviewHomework("reviewed", "review", 90, "Good")).toBeNull();
    const returned = reviewHomework(
      "submitted",
      "return",
      null,
      "Please revise"
    );
    expect(returned).toEqual({
      status: "in_progress",
      feedback: "Please revise",
      score: null,
    });
    const reviewed = reviewHomework("submitted", "review", 0, "Needs work");
    expect(reviewed).toEqual({
      status: "reviewed",
      feedback: "Needs work",
      score: 0,
    });
    expect(reviewHomework("submitted", "return", null, " ")).toBeNull();
    expect(reviewHomework("submitted", "review", null, " ")).toBeNull();
  });
});
