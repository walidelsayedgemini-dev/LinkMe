export type HomeworkStatus =
  | "assigned"
  | "in_progress"
  | "submitted"
  | "reviewed";

export type HomeworkReviewAction = "review" | "return";

export function isMeaningfulText(value: string | null | undefined): boolean {
  return Boolean(value?.trim() && value.trim().length >= 2);
}

export function isSafeHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return (
      url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      Boolean(url.hostname)
    );
  } catch {
    return false;
  }
}

export function canSubmitHomework(status: HomeworkStatus): boolean {
  return status === "assigned" || status === "in_progress";
}

export function canStudentSubmitHomework(
  taskUserId: number,
  currentUserId: number,
  status: HomeworkStatus
): boolean {
  return taskUserId === currentUserId && canSubmitHomework(status);
}

export type HomeworkReviewTransition = {
  status: "in_progress" | "reviewed";
  feedback: string | null;
  score: number | null;
};

/** Pure state transition rules shared by the router tests and UI-facing code. */
export function reviewHomework(
  status: HomeworkStatus,
  action: HomeworkReviewAction,
  score: number | null | undefined,
  feedback: string | null | undefined
): HomeworkReviewTransition | null {
  if (status !== "submitted") return null;
  const normalizedFeedback = feedback?.trim() || null;
  if (action === "return") {
    if (!isMeaningfulText(normalizedFeedback)) return null;
    return { status: "in_progress", feedback: normalizedFeedback, score: null };
  }
  if (score === null || score === undefined) {
    if (!isMeaningfulText(normalizedFeedback)) return null;
  }
  return {
    status: "reviewed",
    feedback: normalizedFeedback,
    score: score ?? null,
  };
}
