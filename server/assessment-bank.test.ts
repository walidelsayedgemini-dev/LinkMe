import { describe, expect, it } from "vitest";
import { ASSESSMENT_LEVELS, BANK_COUNTS } from "../shared/assessment";
import {
  ASSESSMENT_BANK,
  publicQuestion,
  selectStageQuestions,
  validateBank,
  gradeStage,
} from "./content/assessment/engine";

describe("production assessment bank", () => {
  it("contains exactly 1000 unique questions with complete choices and Arabic explanations", () => {
    validateBank();
    expect(ASSESSMENT_BANK).toHaveLength(1000);
    const texts = ASSESSMENT_BANK.map(q =>
      (q.prompt + " " + q.context).toLowerCase().replace(/\s+/g, " ").trim()
    );
    expect(new Set(texts).size).toBe(1000);
    for (const q of ASSESSMENT_BANK) {
      expect(
        new Set(q.options.map((o: string) => o.trim().toLowerCase())).size
      ).toBe(4);
      expect(q.options[q.answer]).toBeTruthy();
      expect(q.explanationAr).toMatch(/[\u0600-\u06ff]/);
      const safe = publicQuestion(q);
      expect(safe).not.toHaveProperty("answer");
      expect(safe).not.toHaveProperty("explanationAr");
    }
  });

  for (const level of ASSESSMENT_LEVELS)
    it(`selects 12 unique balanced questions for ${level}`, () => {
      expect(ASSESSMENT_BANK.filter(q => q.level === level)).toHaveLength(
        BANK_COUNTS[level]
      );
      const stage = selectStageQuestions(level);
      expect(stage).toHaveLength(12);
      expect(new Set(stage.map(q => q.id)).size).toBe(12);
      for (const skill of ["grammar", "vocabulary", "usage", "reading"])
        expect(stage.filter(q => q.skill === skill)).toHaveLength(3);
    });

  it("passes exactly 9/12 and fails 8/12", () => {
    const stage = selectStageQuestions("A1");
    const answers = Object.fromEntries(
      stage.map((q, i) => [q.id, i < 9 ? q.answer : (q.answer + 1) % 4])
    );
    const passed = gradeStage(
      "A1",
      stage.map(q => q.id),
      answers
    );
    expect(passed.percent).toBe(75);
    expect(passed.passed).toBe(true);
    answers[stage[8].id] = (stage[8].answer + 1) % 4;
    expect(
      gradeStage(
        "A1",
        stage.map(q => q.id),
        answers
      ).passed
    ).toBe(false);
  });
});
