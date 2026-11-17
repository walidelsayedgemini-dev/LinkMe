import { describe, expect, it } from "vitest";
import type { BankQuestion } from "../shared/assessment";
import { dailyView } from "./premium/views";
import {
  addCairoDays,
  cairoDate,
  cairoDateForDay,
  currentDayNumber,
  differenceInCairoDays,
} from "./premium/dates";
import { gradeQuestions, weaknessesFromTotals, emptySkillTotals } from "./premium/grading";
import { dailyQuestionsFor } from "./premium/questions";
import { levelForDay } from "./premium/access";

const question = (id: string, answer: number, level: BankQuestion["level"] = "A1", skill: BankQuestion["skill"] = "grammar"): BankQuestion => ({
  id,
  level,
  skill,
  format: "choice",
  prompt: `Prompt ${id}`,
  context: "",
  options: ["zero", "one", "two", "three"],
  answer,
  explanationAr: `شرح مصري ${id}`,
});

const bank = Array.from({ length: 20 }, (_, index) => question(`A1-${index}`, index % 4));

const membership = {
  id: 7,
  startDate: new Date("2026-03-28T22:00:00.000Z"),
  durationDays: 30,
  status: "active" as const,
  endDate: new Date("2026-04-27T22:00:00.000Z"),
};

describe("premium Cairo calendar and progression", () => {
  it("uses Cairo dates across UTC midnight and month boundaries", () => {
    // 2026-03-29 00:30 Cairo is still 2026-03-28 in UTC.
    const cairoLateUtc = new Date("2026-03-28T22:30:00.000Z");
    expect(cairoDate(cairoLateUtc)).toBe("2026-03-29");
    expect(cairoDateForDay(membership.startDate, 1)).toBe("2026-03-29");
    expect(cairoDateForDay(membership.startDate, 5)).toBe("2026-04-02");
    expect(addCairoDays("2026-03-31", 1)).toBe("2026-04-01");
    expect(differenceInCairoDays("2026-03-31", "2026-04-01")).toBe(1);
    expect(currentDayNumber(membership.startDate, 30, cairoLateUtc)).toBe(1);
  });

  it("keeps selected levels sequential over the membership duration", () => {
    expect(levelForDay(["A1", "B1", "C2"], 1, 30)).toBe("A1");
    expect(levelForDay(["A1", "B1", "C2"], 10, 30)).toBe("A1");
    expect(levelForDay(["A1", "B1", "C2"], 11, 30)).toBe("B1");
    expect(levelForDay(["A1", "B1", "C2"], 21, 30)).toBe("C2");
    expect(levelForDay(["A1"], 365, 365)).toBe("A1");
  });

  it("rotates deterministically and never mixes an unselected level", () => {
    const first = dailyQuestionsFor(7, 1, "A1", bank);
    const repeat = dailyQuestionsFor(7, 1, "A1", bank);
    const nextDay = dailyQuestionsFor(7, 2, "A1", bank);
    expect(first.map(item => item.id)).toEqual(repeat.map(item => item.id));
    expect(new Set(first.map(item => item.id)).size).toBe(10);
    expect(first.every(item => item.level === "A1")).toBe(true);
    expect(nextDay.map(item => item.id)).not.toEqual(first.map(item => item.id));
  });
});

describe("premium grading privacy and weaknesses", () => {
  it("does not expose keys or explanations before a daily attempt is submitted", () => {
    const questions = bank.slice(0, 10);
    const draft = {
      id: 1,
      membershipId: 7,
      dayIndex: 1,
      cairoDate: "2026-03-29",
      level: "A1",
      questionIds: JSON.stringify(questions.map(item => item.id)),
      answers: null,
      score: null,
      total: 10,
      feedback: null,
      submittedAt: null,
    } as any;
    const view = dailyView(draft, questions);
    expect(view.answers).toEqual({});
    expect(view.feedback).toEqual([]);
    expect(view.questions[0]).not.toHaveProperty("answer");
    expect(view.questions[0]).not.toHaveProperty("explanationAr");
  });

  it("grades exact question/option answers and returns Egyptian explanations only afterward", () => {
    const questions = bank.slice(0, 2);
    const result = gradeQuestions(questions, { [questions[0].id]: 0, [questions[1].id]: 1 });
    expect(result.score).toBe(2);
    expect(result.percent).toBe(100);
    expect(result.feedback[0].explanationAr).toContain("شرح مصري");
    expect(() => gradeQuestions(questions, { [questions[0].id]: 0 })).toThrow(/exactly/);
    expect(() => gradeQuestions(questions, { [questions[0].id]: 9, [questions[1].id]: 1 })).toThrow(/Invalid option/);
  });

  it("returns four skill weaknesses even when no real answers exist", () => {
    const weaknesses = weaknessesFromTotals(emptySkillTotals(), {
      grammar: ["a1-present-simple-routines"],
      vocabulary: [],
      usage: [],
      reading: [],
    });
    expect(weaknesses).toHaveLength(4);
    expect(weaknesses.every(item => item.percent === null && item.total === 0)).toBe(true);
    expect(weaknesses[0].lessonIds).toContain("a1-present-simple-routines");
  });
});
