import type {
  AssessmentLevel,
  AssessmentQuestion,
  BankQuestion,
} from "@shared/assessment";
import { DAILY_QUIZ_SIZE } from "@shared/premium";
import { ASSESSMENT_BANK, publicQuestion } from "../content/assessment/engine";

function hashSeed(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/**
 * Selects a stable, non-repeating-within-a-day window. The seed moves the
 * window through the level bank as membership/day changes; it does not claim
 * that a year has 365 unique banks.
 */
export function dailyQuestionsFor(
  membershipId: number,
  dayIndex: number,
  level: AssessmentLevel,
  bank: readonly BankQuestion[] = ASSESSMENT_BANK,
): BankQuestion[] {
  const candidates = bank.filter(question => question.level === level);
  if (candidates.length < DAILY_QUIZ_SIZE)
    throw new Error(`Not enough premium questions for ${level}.`);
  const offset = hashSeed(`${membershipId}:${dayIndex}:${level}`) % candidates.length;
  return Array.from({ length: DAILY_QUIZ_SIZE }, (_, index) =>
    candidates[(offset + index) % candidates.length],
  );
}

export function publicDailyQuestions(
  questions: readonly BankQuestion[],
): AssessmentQuestion[] {
  return questions.map(publicQuestion);
}

export function questionMap(
  questions: readonly BankQuestion[],
): Map<string, BankQuestion> {
  return new Map(questions.map(question => [question.id, question]));
}

export function assertExactAnswers(
  questions: readonly BankQuestion[],
  answers: Record<string, number>,
): void {
  const expected = new Set(questions.map(question => question.id));
  const actual = Object.keys(answers);
  if (actual.length !== expected.size || actual.some(id => !expected.has(id))) {
    throw new Error("Answers must contain exactly the displayed questions.");
  }
  for (const question of questions) {
    const chosen = answers[question.id];
    if (
      !Number.isInteger(chosen) ||
      chosen < 0 ||
      chosen >= question.options.length
    ) {
      throw new Error(`Invalid option for question ${question.id}.`);
    }
  }
}
