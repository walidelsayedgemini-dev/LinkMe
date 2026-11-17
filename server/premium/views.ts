import type { AssessmentLevel, QuestionFeedback } from "@shared/assessment";
import type { PremiumDailyView, PremiumLessonSummary } from "@shared/premium";
import type { PremiumDailyAttempt } from "../../drizzle/premium-schema";
import { cairoDateForDay } from "./dates";
import { parseAttemptAnswers, parseAttemptFeedback } from "./access";
import { publicDailyQuestions } from "./questions";
import type { BankQuestion } from "@shared/assessment";

export function dailyView(
  attempt: PremiumDailyAttempt,
  questions: readonly BankQuestion[],
): PremiumDailyView {
  const submitted = attempt.submittedAt !== null && attempt.score !== null;
  return {
    dayIndex: attempt.dayIndex,
    level: attempt.level as AssessmentLevel,
    questions: publicDailyQuestions(questions),
    answers: submitted ? parseAttemptAnswers(attempt.answers) : {},
    completed: submitted,
    score: submitted ? attempt.score : null,
    total: attempt.total ?? questions.length,
    feedback: submitted ? (parseAttemptFeedback(attempt.feedback) as QuestionFeedback[]) : [],
  };
}

export function dailyHistoryView(
  attempts: readonly PremiumDailyAttempt[],
  questionsFor: (attempt: PremiumDailyAttempt) => readonly BankQuestion[],
): PremiumDailyView[] {
  return [...attempts]
    .sort((a, b) => a.dayIndex - b.dayIndex)
    .map(attempt => dailyView(attempt, questionsFor(attempt)));
}

export function lessonSummaryView(lessons: readonly PremiumLessonSummary[]): PremiumLessonSummary[] {
  return [...lessons].sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
}

export function dayDateFor(startDate: Date, dayIndex: number): string {
  return cairoDateForDay(startDate, dayIndex);
}
