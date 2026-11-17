import { ASSESSMENT_LEVELS, type AssessmentLevel, type AssessmentQuestion, type QuestionFeedback, type AssessmentSkill } from "./assessment";

export const PREMIUM_LEVELS = ASSESSMENT_LEVELS;
export const PREMIUM_PRICE_CENTS = 300000;
export const PREMIUM_DURATIONS = [30, 365] as const;
export const DAILY_QUIZ_SIZE = 10;
export type PremiumDuration = (typeof PREMIUM_DURATIONS)[number];
export type PremiumStatus = "active" | "paused" | "cancelled";
export type PremiumLessonSummary = { id: string; level: AssessmentLevel; title: string; description: string; minutes: number; skill: AssessmentSkill; order: number };
export type PremiumExample = { english: string; egyptian: string; kind: "affirmative" | "negative" | "question" | "contrast" };
export type PremiumLesson = PremiumLessonSummary & { explanation: string; rule: string; examples: PremiumExample[]; commonMistakes: { wrong: string; right: string; why: string }[]; practiceTip: string; quiz: (AssessmentQuestion & { answer: number; explanationAr: string })[] };
export type PublicPremiumLesson = Omit<PremiumLesson, "quiz"> & { quiz: AssessmentQuestion[] };
export type PremiumWeakness = { skill: AssessmentSkill; percent: number | null; total: number; action: string; lessonIds: string[] };
export type PremiumDailyView = { dayIndex: number; level: AssessmentLevel; questions: AssessmentQuestion[]; answers: Record<string,number>; completed: boolean; score: number | null; total: number; feedback: QuestionFeedback[] };
