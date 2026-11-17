/**
 * Placement test bank. Answers stay on the server; the client only ever sees
 * prompts and options, so the result cannot be faked from the browser.
 */
export type PlacementSkill = "grammar" | "vocabulary" | "usage" | "reading";

export type PlacementQuestion = {
  id: string;
  level: "A1" | "A2" | "B1" | "B2" | "C1";
  skill: PlacementSkill;
  prompt: string;
  context?: string;
  options: string[];
  answer: number;
};

export const PLACEMENT_QUESTIONS: PlacementQuestion[] = [
  {
    id: "q1",
    level: "A1",
    skill: "grammar",
    prompt: "She ___ a teacher.",
    options: ["are", "is", "am", "be"],
    answer: 1,
  },
  {
    id: "q2",
    level: "A1",
    skill: "vocabulary",
    prompt: "I'm hungry. Let's have some ___.",
    options: ["water", "food", "shoes", "books"],
    answer: 1,
  },
  {
    id: "q3",
    level: "A2",
    skill: "grammar",
    prompt: "I ___ to the gym yesterday.",
    options: ["go", "gone", "went", "going"],
    answer: 2,
  },
  {
    id: "q4",
    level: "A2",
    skill: "usage",
    prompt: "A: Where is the station?  B: Go straight and ___ left.",
    options: ["turn", "take", "make", "put"],
    answer: 0,
  },
  {
    id: "q5",
    level: "A2",
    skill: "vocabulary",
    prompt: "My brother is my aunt's ___.",
    options: ["nephew", "cousin", "son", "uncle"],
    answer: 0,
  },
  {
    id: "q6",
    level: "B1",
    skill: "grammar",
    prompt: "If it rains tomorrow, we ___ the match.",
    options: ["will cancel", "would cancel", "cancelled", "are cancelling"],
    answer: 0,
  },
  {
    id: "q7",
    level: "B1",
    skill: "reading",
    context: "The library closes at 6 p.m. on weekdays, but stays open until 9 p.m. on Saturdays.",
    prompt: "According to the notice, when can you visit the library in the evening?",
    options: ["On Monday", "On Saturday", "On Sunday", "Never"],
    answer: 1,
  },
  {
    id: "q8",
    level: "B1",
    skill: "usage",
    prompt: "I'm sorry, I ___ hear you. The line is bad.",
    options: ["can't", "mustn't", "shouldn't", "needn't"],
    answer: 0,
  },
  {
    id: "q9",
    level: "B2",
    skill: "grammar",
    prompt: "By the time we arrived, the film ___.",
    options: ["already started", "has already started", "had already started", "was already starting"],
    answer: 2,
  },
  {
    id: "q10",
    level: "B2",
    skill: "vocabulary",
    prompt: "The manager asked for a ___ of the report before the meeting.",
    options: ["summary", "surgery", "surplus", "sympathy"],
    answer: 0,
  },
  {
    id: "q11",
    level: "C1",
    skill: "grammar",
    prompt: "Had we known about the traffic, we ___ earlier.",
    options: ["would leave", "would have left", "had left", "will leave"],
    answer: 1,
  },
  {
    id: "q12",
    level: "C1",
    skill: "vocabulary",
    prompt: "Her argument was so ___ that even her critics agreed with the main point.",
    options: ["compelling", "compulsory", "compliant", "comparable"],
    answer: 0,
  },
];

export type Level = PlacementQuestion["level"];

export const LEVEL_LABELS: Record<Level, string> = {
  A1: "مبتدئ",
  A2: "ما قبل المتوسط",
  B1: "متوسط",
  B2: "متوسط متقدم",
  C1: "متقدم",
};

export const LEVEL_DESCRIPTIONS: Record<Level, string> = {
  A1: "بتفهم كلمات وجمل بسيطة جدًا. أفضل بداية ليك هي الأساسيات: الضمائر، الأزمنة البسيطة، والمفردات اليومية.",
  A2: "بتقدر تتواصل في مواقف يومية بسيطة، ولسه محتاج تبني أساس قوي في الأزمنة والمفردات.",
  B1: "بتعرف تتعامل مع معظم مواقف السفر والعمل، ومحتاج تكسر الحاجز في المحادثة وتوسّع مفرداتك.",
  B2: "مستواك قوي في القواعد والمحادثة. الخطوة الجاية هي الدقة والطلاقة، وده اللي بيفرق في الآيلتس والشغل.",
  C1: "مستوى متقدم جدًا. هتركّز معاك على الكتابة الأكاديمية، الفروق الدقيقة في المفردات، والطريقة اللي بتتكلم بها.",
};

export const LEVEL_COURSE_FOCUS: Record<Level, string[]> = {
  A1: ["grammar", "vocabulary"],
  A2: ["grammar", "speaking"],
  B1: ["speaking", "vocabulary"],
  B2: ["ielts", "business"],
  C1: ["writing", "ielts"],
};

const ORDER: Level[] = ["A1", "A2", "B1", "B2", "C1"];

export function levelForScore(score: number, total: number): Level {
  const ratio = total > 0 ? score / total : 0;
  if (ratio <= 0.2) return "A1";
  if (ratio <= 0.42) return "A2";
  if (ratio <= 0.66) return "B1";
  if (ratio <= 0.85) return "B2";
  return "C1";
}

export function levelIndex(level: string): number {
  const index = ORDER.indexOf(level as Level);
  return index === -1 ? 1 : index;
}

export function publicQuestions() {
  return PLACEMENT_QUESTIONS.map(({ answer: _answer, ...rest }) => rest);
}

export type PlacementResult = {
  score: number;
  total: number;
  percent: number;
  level: Level;
  levelLabel: string;
  description: string;
  skills: Record<PlacementSkill, { correct: number; total: number }>;
  missed: { id: string; level: Level; skill: PlacementSkill }[];
};

export function grade(answers: Record<string, number>): PlacementResult {
  const skills: Record<PlacementSkill, { correct: number; total: number }> = {
    grammar: { correct: 0, total: 0 },
    vocabulary: { correct: 0, total: 0 },
    usage: { correct: 0, total: 0 },
    reading: { correct: 0, total: 0 },
  };
  const missed: PlacementResult["missed"] = [];
  let score = 0;

  for (const question of PLACEMENT_QUESTIONS) {
    skills[question.skill].total += 1;
    const given = answers[question.id];
    if (given === question.answer) {
      score += 1;
      skills[question.skill].correct += 1;
    } else {
      missed.push({ id: question.id, level: question.level, skill: question.skill });
    }
  }

  const total = PLACEMENT_QUESTIONS.length;
  const level = levelForScore(score, total);
  return {
    score,
    total,
    percent: Math.round((score / total) * 100),
    level,
    levelLabel: LEVEL_LABELS[level],
    description: LEVEL_DESCRIPTIONS[level],
    skills,
    missed,
  };
}
