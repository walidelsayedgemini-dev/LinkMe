import type { AssessmentLevel, AssessmentSkill, QuestionFeedback } from "@shared/assessment";
import type { PremiumDailyView, PremiumDuration, PremiumLessonSummary, PremiumStatus, PremiumWeakness } from "@shared/premium";

export type PremiumMembership = {
  id: number;
  userId: number;
  levels: AssessmentLevel[];
  startDate: Date | string;
  endDate: Date | string;
  status: PremiumStatus;
  durationDays: PremiumDuration;
  paidAmountCents: number;
  paymentReference: string;
  activatedBy: number;
  coachUserId: number | null;
  createdAt: Date | string;
  updatedAt: Date | string;
};

export type PremiumLessonProgress = {
  lessonId: string;
  level: AssessmentLevel;
  bestScore: number;
  total: number;
  attemptCount: number;
  completed: boolean;
  lastAttemptAt: Date | string | null;
};

export type PremiumCoachNote = {
  id: number | string;
  note: string;
  dayIndex: number | null;
  authorUserId: number;
  createdAt: Date | string;
};

export type PremiumMineView = {
  membership: PremiumMembership | null;
  active: boolean;
  currentLevel: AssessmentLevel | null;
  dayNumber: number;
  totalDays: number;
  lessons: PremiumLessonSummary[];
  lessonProgress: PremiumLessonProgress[];
  dailyHistory: PremiumDailyView[];
  weaknesses: PremiumWeakness[];
  coachNotes: PremiumCoachNote[];
  today: PremiumDailyView | null;
};

export type LessonQuizState = {
  answers: Record<string, number>;
  feedback: QuestionFeedback[];
  score: number | null;
  total: number;
  submitted: boolean;
};

export type SkillLabelMap = Record<AssessmentSkill, string>;
