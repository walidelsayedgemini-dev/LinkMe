export const ASSESSMENT_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;
export type AssessmentLevel = (typeof ASSESSMENT_LEVELS)[number];
export type AssessmentSkill = "grammar" | "vocabulary" | "usage" | "reading";
export type AssessmentFormat = "choice" | "gap" | "reading" | "dialogue";
export const STAGE_SIZE = 12;
export const PASS_PERCENT = 75;
export const LEVEL_NAMES: Record<AssessmentLevel, string> = {
  A1: "أول خطوة",
  A2: "أساس قوي",
  B1: "اتكلم بثقة",
  B2: "طلاقة ودقة",
  C1: "فروق دقيقة",
  C2: "تحدي الإتقان",
};
export const SKILL_NAMES: Record<AssessmentSkill, string> = {
  grammar: "القواعد",
  vocabulary: "المفردات",
  usage: "مواقف يومية",
  reading: "فهم المقروء",
};
export const BANK_COUNTS: Record<AssessmentLevel, number> = {
  A1: 180,
  A2: 180,
  B1: 180,
  B2: 180,
  C1: 160,
  C2: 120,
};
export type AssessmentQuestion = {
  id: string;
  level: AssessmentLevel;
  skill: AssessmentSkill;
  format: AssessmentFormat;
  prompt: string;
  context: string;
  options: string[];
};
export type BankQuestion = AssessmentQuestion & {
  answer: number;
  explanationAr: string;
};
export type QuestionFeedback = {
  questionId: string;
  correct: boolean;
  correctIndex: number;
  chosenIndex: number;
  explanationAr: string;
};
export type StageReport = {
  level: AssessmentLevel;
  score: number;
  total: number;
  percent: number;
  passed: boolean;
  skills: Record<AssessmentSkill, { correct: number; total: number }>;
  feedback: QuestionFeedback[];
};
export type AssessmentSummary = {
  level: AssessmentLevel;
  belowA1: boolean;
  score: number;
  total: number;
  percent: number;
  saved: boolean;
  skills: Record<AssessmentSkill, { correct: number; total: number }>;
  recommendations: {
    id: number;
    slug: string;
    titleAr: string;
    title: string;
    coverImage: string | null;
    priceCents: number;
    currency: string;
    level: string;
  }[];
};
export type AssessmentView = {
  sessionId: string;
  token: string;
  mode: "placement" | "practice";
  level: AssessmentLevel;
  phase: "answering" | "stage-result" | "completed";
  questions: AssessmentQuestion[];
  answers: Record<string, number>;
  reports: StageReport[];
  canAdvance: boolean;
  feedback: QuestionFeedback | null;
  /** Practice-only explanations for answered questions; never exposed during measurement. */
  feedbackByQuestionId?: Record<string, QuestionFeedback>;
  summary: AssessmentSummary | null;
};
