import { randomInt } from "node:crypto";
import type {
  AssessmentLevel,
  AssessmentQuestion,
  AssessmentSkill,
  AssessmentSummary,
  BankQuestion,
  QuestionFeedback,
  StageReport,
} from "@shared/assessment";
import {
  ASSESSMENT_LEVELS,
  BANK_COUNTS,
  LEVEL_NAMES,
  PASS_PERCENT,
  SKILL_NAMES,
  STAGE_SIZE,
} from "@shared/assessment";
// The parent task supplies this exact 1000-question JSON bank. The ts-ignore keeps
// the server's existing TypeScript configuration unchanged while esbuild bundles it.
// @ts-ignore JSON modules are bundled by the server build.
import bankJson from "./bank.json";

export const ASSESSMENT_BANK = bankJson as unknown as BankQuestion[];
export const ASSESSMENT_SKILLS: AssessmentSkill[] = [
  "grammar",
  "vocabulary",
  "usage",
  "reading",
];

export type PersistedStage = {
  questionIds: string[];
  answers: Record<string, number>;
};

export function validateBank(
  bank: readonly BankQuestion[] = ASSESSMENT_BANK
): void {
  if (bank.length !== 1000)
    throw new Error(
      `Assessment bank must contain exactly 1000 questions; got ${bank.length}.`
    );
  const ids = new Set<string>();
  const counts = Object.fromEntries(
    ASSESSMENT_LEVELS.map(level => [level, 0])
  ) as Record<AssessmentLevel, number>;
  for (const question of bank) {
    if (ids.has(question.id))
      throw new Error(`Duplicate assessment question id: ${question.id}`);
    ids.add(question.id);
    if (!ASSESSMENT_LEVELS.includes(question.level))
      throw new Error(`Invalid assessment level: ${question.level}`);
    if (!ASSESSMENT_SKILLS.includes(question.skill))
      throw new Error(`Invalid assessment skill: ${question.skill}`);
    if (
      !Number.isInteger(question.answer) ||
      question.answer < 0 ||
      question.answer > 3
    ) {
      throw new Error(
        `Invalid answer index for assessment question: ${question.id}`
      );
    }
    if (!Array.isArray(question.options) || question.options.length !== 4) {
      throw new Error(
        `Assessment question must have exactly four options: ${question.id}`
      );
    }
    if (typeof question.explanationAr !== "string")
      throw new Error(
        `Missing explanation for assessment question: ${question.id}`
      );
    counts[question.level] += 1;
  }
  for (const level of ASSESSMENT_LEVELS) {
    if (counts[level] !== BANK_COUNTS[level]) {
      throw new Error(
        `Assessment bank count for ${level} must be ${BANK_COUNTS[level]}; got ${counts[level]}.`
      );
    }
  }
}

function secureShuffle<T>(items: readonly T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = randomInt(i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function selectStageQuestions(
  level: AssessmentLevel,
  bank: readonly BankQuestion[] = ASSESSMENT_BANK
): BankQuestion[] {
  validateBank(bank);
  const candidates = bank.filter(question => question.level === level);
  const chosen: BankQuestion[] = [];
  for (const skill of ASSESSMENT_SKILLS) {
    const skillQuestions = secureShuffle(
      candidates.filter(question => question.skill === skill)
    );
    if (skillQuestions.length < 3)
      throw new Error(`Not enough ${skill} questions for ${level}.`);
    chosen.push(...skillQuestions.slice(0, 3));
  }
  return secureShuffle(chosen);
}

export function publicQuestion(question: BankQuestion): AssessmentQuestion {
  const {
    answer: _answer,
    explanationAr: _explanationAr,
    ...safeQuestion
  } = question;
  return { ...safeQuestion, options: [...safeQuestion.options] };
}

export function questionsForIds(
  ids: readonly string[],
  bank: readonly BankQuestion[] = ASSESSMENT_BANK
): BankQuestion[] {
  const byId = new Map(bank.map(question => [question.id, question]));
  return ids.map(id => {
    const question = byId.get(id);
    if (!question) throw new Error(`Assessment question not found: ${id}`);
    return question;
  });
}

export function feedbackFor(
  question: BankQuestion,
  chosenIndex: number
): QuestionFeedback {
  return {
    questionId: question.id,
    correct: chosenIndex === question.answer,
    correctIndex: question.answer,
    chosenIndex,
    explanationAr: question.explanationAr,
  };
}

export function gradeStage(
  level: AssessmentLevel,
  questionIds: readonly string[],
  answers: Record<string, number>,
  bank: readonly BankQuestion[] = ASSESSMENT_BANK
): StageReport {
  const questions = questionsForIds(questionIds, bank);
  if (questions.length !== STAGE_SIZE)
    throw new Error("An assessment stage must contain exactly 12 questions.");
  if (questions.some(question => !Number.isInteger(answers[question.id])))
    throw new Error(
      "All assessment questions must be answered before grading."
    );
  const skills = Object.fromEntries(
    ASSESSMENT_SKILLS.map(skill => [skill, { correct: 0, total: 0 }])
  ) as StageReport["skills"];
  const feedback = questions.map(question =>
    feedbackFor(question, answers[question.id])
  );
  for (const [index, question] of questions.entries()) {
    skills[question.skill].total += 1;
    if (feedback[index].correct) skills[question.skill].correct += 1;
  }
  const score = feedback.filter(item => item.correct).length;
  const percent = Math.round((score / STAGE_SIZE) * 100);
  return {
    level,
    score,
    total: STAGE_SIZE,
    percent,
    passed: percent >= PASS_PERCENT,
    skills,
    feedback,
  };
}

export function aggregateSkills(
  reports: readonly StageReport[]
): AssessmentSummary["skills"] {
  const skills = Object.fromEntries(
    ASSESSMENT_SKILLS.map(skill => [skill, { correct: 0, total: 0 }])
  ) as AssessmentSummary["skills"];
  for (const report of reports) {
    for (const skill of ASSESSMENT_SKILLS) {
      skills[skill].correct += report.skills[skill].correct;
      skills[skill].total += report.skills[skill].total;
    }
  }
  return skills;
}

export function consecutivePlacementLevel(reports: readonly StageReport[]): {
  level: AssessmentLevel;
  belowA1: boolean;
} {
  let lastPassed: AssessmentLevel | null = null;
  for (const level of ASSESSMENT_LEVELS) {
    const report = reports.find(item => item.level === level);
    if (!report) break;
    if (!report.passed) break;
    lastPassed = level;
  }
  return {
    level: lastPassed ?? "A1",
    belowA1:
      reports.some(report => report.level === "A1" && !report.passed) ||
      lastPassed === null,
  };
}

export function makeSummary(
  mode: "placement" | "practice",
  currentLevel: AssessmentLevel,
  reports: readonly StageReport[],
  saved: boolean,
  recommendations: AssessmentSummary["recommendations"]
): AssessmentSummary {
  const placement =
    mode === "placement"
      ? consecutivePlacementLevel(reports)
      : { level: currentLevel, belowA1: false };
  const score = reports.reduce((sum, report) => sum + report.score, 0);
  const total = reports.reduce((sum, report) => sum + report.total, 0);
  return {
    level: placement.level,
    belowA1: placement.belowA1,
    score,
    total,
    percent: total > 0 ? Math.round((score / total) * 100) : 0,
    saved,
    skills: aggregateSkills(reports),
    recommendations,
  };
}

export function catalogLevels() {
  return ASSESSMENT_LEVELS.map(level => ({
    level,
    name: LEVEL_NAMES[level],
    questionCount: BANK_COUNTS[level],
  }));
}

export const ASSESSMENT_SKILL_LABELS = SKILL_NAMES;
