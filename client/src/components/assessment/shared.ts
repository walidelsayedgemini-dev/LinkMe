import type {
  AssessmentLevel,
  AssessmentSkill,
  AssessmentView,
  StageReport,
} from "@shared/assessment";

export const LEVELS: AssessmentLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

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

export const LEVEL_DESCRIPTIONS: Record<AssessmentLevel, string> = {
  A1: "جمل أساسية ومواقف يومية بسيطة",
  A2: "أساس ثابت للتواصل في مواقف مألوفة",
  B1: "تقدر تتكلم عن حياتك وأهدافك بثقة أكبر",
  B2: "تواصل مريح مع دقة وتنوع في التعبير",
  C1: "فهم عميق وفروق دقيقة في اللغة",
  C2: "تحكم متقدم جدًا في التعبير والفهم",
};

export function percent(correct: number, total: number) {
  return total ? Math.round((correct / total) * 100) : 0;
}

export function levelIndex(level: AssessmentLevel) {
  return LEVELS.indexOf(level);
}

export function latestReport(view: AssessmentView): StageReport | null {
  return view.reports.length ? view.reports[view.reports.length - 1] : null;
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("ar-EG").format(value);
}

export function errorText(
  error: unknown,
  fallback = "حصلت مشكلة بسيطة. جرّب تاني."
) {
  const message = error instanceof Error ? error.message : "";
  return message || fallback;
}
