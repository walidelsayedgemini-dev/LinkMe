import { describe, expect, it } from "vitest";
import { ASSESSMENT_LEVELS } from "../shared/assessment";
import {
  PREMIUM_LESSONS,
  PREMIUM_TENSES,
  PREMIUM_TENSE_COVERAGE,
  premiumLessonById,
  summariesForLevels,
} from "./content/premium-curriculum";

describe("premium progressive curriculum", () => {
  it("contains at least 24 lessons and exactly four lessons per level", () => {
    expect(PREMIUM_LESSONS.length).toBeGreaterThanOrEqual(24);
    for (const level of ASSESSMENT_LEVELS) {
      expect(PREMIUM_LESSONS.filter(lesson => lesson.level === level)).toHaveLength(4);
    }
  });

  it("has unique lesson IDs, stable question IDs, and 96 questions", () => {
    const lessonIds = PREMIUM_LESSONS.map(lesson => lesson.id);
    const questionIds = PREMIUM_LESSONS.flatMap(lesson => lesson.quiz.map(question => question.id));
    expect(new Set(lessonIds).size).toBe(lessonIds.length);
    expect(new Set(questionIds).size).toBe(questionIds.length);
    expect(questionIds).toHaveLength(96);
    expect(PREMIUM_LESSONS.every(lesson => lesson.quiz.length === 4)).toBe(true);
  });

  it("keeps every question aligned to its lesson and structurally answerable", () => {
    const allowedSkills = new Set(["grammar", "vocabulary", "usage", "reading"]);
    for (const lesson of PREMIUM_LESSONS) {
      expect(lesson.examples.some(example => example.kind === "affirmative")).toBe(true);
      expect(lesson.examples.some(example => example.kind === "negative")).toBe(true);
      expect(lesson.examples.some(example => example.kind === "question")).toBe(true);
      expect(lesson.rule.length).toBeGreaterThan(30);
      expect(lesson.explanation).toMatch(/[\u0600-\u06ff]/);
      expect(lesson.practiceTip).toMatch(/[\u0600-\u06ff]/);
      expect(lesson.commonMistakes.length).toBeGreaterThan(0);
      for (const question of lesson.quiz) {
        expect(question.level).toBe(lesson.level);
        expect(allowedSkills.has(question.skill)).toBe(true);
        expect(question.options).toHaveLength(4);
        expect(new Set(question.options.map(option => option.toLowerCase())).size).toBe(4);
        expect(question.answer).toBeGreaterThanOrEqual(0);
        expect(question.answer).toBeLessThan(question.options.length);
        expect(question.options[question.answer]).toBeTruthy();
        expect(question.explanationAr).toMatch(/[\u0600-\u06ff]/);
        expect(typeof question.context).toBe("string");
      }
    }
  });

  it("covers all twelve canonical English tenses with distinct lessons", () => {
    expect(PREMIUM_TENSES).toHaveLength(12);
    for (const tense of PREMIUM_TENSES) {
      expect(PREMIUM_TENSE_COVERAGE[tense]).toBeDefined();
      expect(PREMIUM_TENSE_COVERAGE[tense].length).toBeGreaterThan(0);
      for (const id of PREMIUM_TENSE_COVERAGE[tense]) {
        expect(premiumLessonById(id)).toBeDefined();
      }
    }
  });

  it("looks up lessons and returns summaries without quiz answers", () => {
    const first = PREMIUM_LESSONS[0];
    expect(premiumLessonById(first.id)).toBe(first);
    expect(premiumLessonById("does-not-exist")).toBeUndefined();

    const summaries = summariesForLevels(["A2", "C1"]);
    expect(summaries).toHaveLength(8);
    expect(summaries.every(summary => summary.level === "A2" || summary.level === "C1")).toBe(true);
    expect(summaries[0]).not.toHaveProperty("quiz");
    expect(summaries.map(summary => summary.order)).toEqual([5, 6, 7, 8, 17, 18, 19, 20]);
  });
});
