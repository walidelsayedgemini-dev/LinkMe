import type {
  AssessmentSkill,
  BankQuestion,
  QuestionFeedback,
} from "@shared/assessment";
import type { PremiumWeakness } from "@shared/premium";
import { SKILL_NAMES } from "@shared/assessment";
import { assertExactAnswers } from "./questions";

export const PREMIUM_SKILLS: AssessmentSkill[] = [
  "grammar",
  "vocabulary",
  "usage",
  "reading",
];

export function feedbackFor(
  question: BankQuestion,
  chosenIndex: number,
): QuestionFeedback {
  return {
    questionId: question.id,
    correct: chosenIndex === question.answer,
    correctIndex: question.answer,
    chosenIndex,
    explanationAr: question.explanationAr,
  };
}

export function gradeQuestions(
  questions: readonly BankQuestion[],
  answers: Record<string, number>,
): { score: number; total: number; percent: number; feedback: QuestionFeedback[] } {
  assertExactAnswers(questions, answers);
  const feedback = questions.map(question =>
    feedbackFor(question, answers[question.id]),
  );
  const score = feedback.filter(item => item.correct).length;
  return {
    score,
    total: questions.length,
    percent: questions.length ? Math.round((score / questions.length) * 100) : 0,
    feedback,
  };
}

type SkillTotals = Record<AssessmentSkill, { correct: number; total: number }>;

export function emptySkillTotals(): SkillTotals {
  return Object.fromEntries(
    PREMIUM_SKILLS.map(skill => [skill, { correct: 0, total: 0 }]),
  ) as SkillTotals;
}

export function skillTotalsFor(
  questions: readonly BankQuestion[],
  answers: Record<string, number>,
): SkillTotals {
  const totals = emptySkillTotals();
  for (const question of questions) {
    totals[question.skill].total += 1;
    if (answers[question.id] === question.answer) totals[question.skill].correct += 1;
  }
  return totals;
}

export function weaknessesFromTotals(
  totals: SkillTotals,
  lessonIdsBySkill: Record<AssessmentSkill, string[]>,
): PremiumWeakness[] {
  return PREMIUM_SKILLS.map(skill => {
    const item = totals[skill];
    const percent = item.total ? Math.round((item.correct / item.total) * 100) : null;
    const action =
      percent === null
        ? `لسه مفيش إجابات كفاية في ${SKILL_NAMES[skill]}. ابدأ بتدريب بسيط.`
        : percent < 75
          ? `راجع ${SKILL_NAMES[skill]} خطوة خطوة وطبّق الأمثلة قبل المحاولة الجاية.`
          : `ممتاز في ${SKILL_NAMES[skill]}؛ ثبّت المهارة بممارسة قصيرة كل يوم.`;
    return {
      skill,
      percent,
      total: item.total,
      action,
      lessonIds: [...new Set(lessonIdsBySkill[skill] ?? [])],
    };
  });
}
