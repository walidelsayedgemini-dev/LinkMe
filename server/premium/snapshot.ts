import { and, eq } from "drizzle-orm";
import type { AssessmentLevel, AssessmentSkill, BankQuestion } from "@shared/assessment";
import type { PremiumDailyView, PremiumWeakness } from "@shared/premium";
import {
  premiumCoachNotes,
  premiumDailyAttempts,
  premiumLessonProgress,
  type PremiumDailyAttempt,
  type PremiumMembership,
} from "../../drizzle/premium-schema";
import { ASSESSMENT_BANK } from "../content/assessment/engine";
import { summariesForLevels } from "../content/premium-curriculum";
import { dayNumberFor, isActiveMembership, levelForDay, totalDaysFor, unlockedLevels } from "./access";
import { nowFor } from "./access";
import { parseAttemptAnswers, parseAttemptFeedback } from "./access";
import { cairoDateForDay } from "./dates";
import { PREMIUM_SKILLS, emptySkillTotals, skillTotalsFor, weaknessesFromTotals } from "./grading";
import { questionMap } from "./questions";
import { membershipLevels, publicMembership, parseJson } from "./serialization";
import { dailyView } from "./views";
import type { PremiumContext } from "./types";

const bankById = questionMap(ASSESSMENT_BANK);

function questionRowsForAttempt(attempt: PremiumDailyAttempt): BankQuestion[] {
  const ids = parseJson<string[]>(attempt.questionIds, []);
  return ids.map(id => bankById.get(id)).filter((question): question is BankQuestion => Boolean(question));
}

function emptyWeaknesses(): PremiumWeakness[] {
  const lessonIds = Object.fromEntries(
    PREMIUM_SKILLS.map(skill => [skill, [] as string[]]),
  ) as Record<AssessmentSkill, string[]>;
  return weaknessesFromTotals(emptySkillTotals(), lessonIds);
}

export async function snapshotForMembership(
  db: any,
  membership: PremiumMembership | null,
  ctx: PremiumContext,
  userId: number,
) {
  if (!membership) {
    return {
      membership: null,
      active: false,
      currentLevel: null,
      dayNumber: 0,
      totalDays: 0,
      lessons: [],
      lessonProgress: [],
      dailyHistory: [],
      weaknesses: emptyWeaknesses(),
      coachNotes: [],
      today: null,
    };
  }

  const now = nowFor(ctx);
  const levels = membershipLevels(membership);
  const totalDays = totalDaysFor(membership);
  const dayNumber = dayNumberFor(membership, now);
  const active = isActiveMembership(membership, now);
  const lessons = summariesForLevels(unlockedLevels(membership, now)).sort((a, b) => a.order - b.order);

  const [attempts, progress, notes] = await Promise.all([
    db
      .select()
      .from(premiumDailyAttempts)
      .where(eq(premiumDailyAttempts.membershipId, membership.id)),
    db
      .select()
      .from(premiumLessonProgress)
      .where(eq(premiumLessonProgress.membershipId, membership.id)),
    db
      .select()
      .from(premiumCoachNotes)
      .where(eq(premiumCoachNotes.membershipId, membership.id)),
  ]);

  const sortedAttempts = [...attempts].sort((a, b) => a.dayIndex - b.dayIndex);
  const dailyHistory: PremiumDailyView[] = sortedAttempts.map(attempt =>
    dailyView(attempt, questionRowsForAttempt(attempt)),
  );
  const totals = emptySkillTotals();
  const lessonIdsBySkill = Object.fromEntries(
    PREMIUM_SKILLS.map(skill => [skill, [] as string[]]),
  ) as Record<AssessmentSkill, string[]>;
  for (const lesson of lessons) lessonIdsBySkill[lesson.skill].push(lesson.id);

  for (const attempt of sortedAttempts) {
    if (attempt.submittedAt === null || attempt.score === null) continue;
    const questions = questionRowsForAttempt(attempt);
    const answers = parseAttemptAnswers(attempt.answers);
    const itemTotals = skillTotalsFor(questions, answers);
    for (const skill of PREMIUM_SKILLS) {
      totals[skill].correct += itemTotals[skill].correct;
      totals[skill].total += itemTotals[skill].total;
    }
  }

  const todayAttempt = sortedAttempts.find(attempt => attempt.dayIndex === dayNumber);
  const today = active && todayAttempt
    ? dailyView(todayAttempt, questionRowsForAttempt(todayAttempt))
    : null;

  return {
    membership: publicMembership(membership),
    active,
    currentLevel: levelForDay(levels, dayNumber, totalDays),
    dayNumber,
    totalDays,
    lessons,
    lessonProgress: [...progress]
      .sort((a, b) => a.lessonId.localeCompare(b.lessonId))
      .map(row => ({
        lessonId: row.lessonId,
        level: row.level as AssessmentLevel,
        bestScore: row.bestScore,
        total: row.total,
        attemptCount: row.attemptCount,
        completed: row.completed,
        lastAttemptAt: row.lastAttemptAt,
      })),
    dailyHistory,
    weaknesses: weaknessesFromTotals(totals, lessonIdsBySkill),
    coachNotes: [...notes]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map(note => ({
        id: note.id,
        dayIndex: note.dayIndex,
        note: note.note,
        authorUserId: note.authorUserId,
        createdAt: note.createdAt,
      })),
    today,
  };
}

export function dayDateForMembership(membership: PremiumMembership, dayIndex: number): string {
  return cairoDateForDay(membership.startDate, dayIndex);
}
