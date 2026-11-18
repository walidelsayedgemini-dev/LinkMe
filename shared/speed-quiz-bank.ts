import { SPEED_QUIZ_EXPANSION } from "./speed-quiz-expanded";

export interface SpeedQuizQuestion {
  id: string;
  category: "محادثة" | "قواعد" | "كلمات" | "مواقف";
  promptEn: string;
  choices: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
  explanationAr: string;
}

const BASE_SPEED_QUIZ_BANK: SpeedQuizQuestion[] = [
  {
    id: "sq-1",
    category: "قواعد",
    promptEn: "I look forward to ______ you next week!",
    choices: ["meet", "meeting", "met", "meets"],
    correctIndex: 1,
    explanationAr: "بعد look forward to دايماً بيجي الفعل مضاف له ing (meeting).",
  },
  {
    id: "sq-2",
    category: "محادثة",
    promptEn: "Someone says: 'Thank you so much for your help!' — Most natural reply:",
    choices: ["No problem, happy to help!", "You should thank me.", "It is nothing big.", "Yes, I helped."],
    correctIndex: 0,
    explanationAr: "'No problem, happy to help!' هو ألطف وأطبيعي رد يومي.",
  },
  {
    id: "sq-3",
    category: "كلمات",
    promptEn: "We ______ out of coffee, so I need to buy some.",
    choices: ["went", "made", "ran", "took"],
    correctIndex: 2,
    explanationAr: "التعبير الصحيح هو 'run out of' (الماضي: ran out of) بمعنى يخلص من عندنا.",
  },
  {
    id: "sq-4",
    category: "قواعد",
    promptEn: "She has been studying English ______ 2023.",
    choices: ["for", "since", "from", "during"],
    correctIndex: 1,
    explanationAr: "مع نقطة بداية محددة زي سنة 2023 بنستخدم since (أما for فللمدة الزمنية).",
  },
  {
    id: "sq-5",
    category: "مواقف",
    promptEn: "At a café, the politest way to order a latte is:",
    choices: ["Give me a latte.", "I want latte.", "Could I please get a latte?", "Bring latte now."],
    correctIndex: 2,
    explanationAr: "'Could I please get...?' هي الصيغة الأشيك والأكثر استخداماً في الكافيهات.",
  },
  {
    id: "sq-6",
    category: "قواعد",
    promptEn: "If I ______ more free time, I would travel around the world.",
    choices: ["have", "had", "will have", "am having"],
    correctIndex: 1,
    explanationAr: "الحالة الشرطية التانية (تخيل في الحاضر) بتاخد ماضي بسيط: If I had..., I would...",
  },
  {
    id: "sq-7",
    category: "كلمات",
    promptEn: "Which word means 'to delay a meeting to a later time'?",
    choices: ["Postpone", "Prepare", "Predict", "Promote"],
    correctIndex: 0,
    explanationAr: "Postpone معناها يؤجّل ميعاد لوقت تاني.",
  },
  {
    id: "sq-8",
    category: "محادثة",
    promptEn: "What does 'We are on the same page' mean?",
    choices: ["We are reading a book", "We agree and understand each other", "We live in the same street", "We are late"],
    correctIndex: 1,
    explanationAr: "معناها إننا متفقين وفاهمين بعض على نفس النقطة!",
  },
  {
    id: "sq-9",
    category: "قواعد",
    promptEn: "My teacher gave me some very useful ______.",
    choices: ["advices", "an advice", "advice", "advise"],
    correctIndex: 2,
    explanationAr: "كلمة advice (نصيحة) لا تُجمع ولا تأخذ a/an — نقول some advice أو a piece of advice.",
  },
  {
    id: "sq-10",
    category: "كلمات",
    promptEn: "Don't worry, we will ______ out a solution together!",
    choices: ["figure", "make", "do", "say"],
    correctIndex: 0,
    explanationAr: "Figure out معناها يكتشف أو يلاقي حل لمشكلة.",
  },
  {
    id: "sq-11",
    category: "قواعد",
    promptEn: "He suggested ______ a short break before continuing.",
    choices: ["to take", "taking", "take", "took"],
    correctIndex: 1,
    explanationAr: "بعد suggest بيجي الفعل مضاف له ing (suggested taking).",
  },
  {
    id: "sq-12",
    category: "مواقف",
    promptEn: "In an online Zoom meeting, 'I can hear you loud and clear' means:",
    choices: ["Your audio is too noisy", "Your audio is crystal clear", "Please turn off your mic", "You are muted"],
    correctIndex: 1,
    explanationAr: "Loud and clear معناها الصوت واضح جداً وممتاز!",
  },
  {
    id: "sq-13",
    category: "كلمات",
    promptEn: "A person you can always trust to do their job well is:",
    choices: ["Reliable", "Forgetful", "Fragile", "Temporary"],
    correctIndex: 0,
    explanationAr: "Reliable معناها موثوق فيه ويُعتمد عليه.",
  },
  {
    id: "sq-14",
    category: "قواعد",
    promptEn: "I'm not used to ______ up at 5 AM every morning.",
    choices: ["wake", "woke", "waking", "wakes"],
    correctIndex: 2,
    explanationAr: "بعد be/get used to دايماً بيجي اسم أو verb+ing (waking).",
  },
  {
    id: "sq-15",
    category: "محادثة",
    promptEn: "What does 'break the ice' mean in a conversation?",
    choices: ["Order a cold drink", "Make people feel relaxed at the start", "End a meeting early", "Argue loudly"],
    correctIndex: 1,
    explanationAr: "Break the ice معناها يكسر التوتر ويبدأ الكلام بجو لطيف.",
  },
  {
    id: "sq-16",
    category: "قواعد",
    promptEn: "Neither Ali nor his friends ______ ready yet.",
    choices: ["is", "are", "was", "has"],
    correctIndex: 1,
    explanationAr: "مع Neither...nor الفعل بيتبع الفاعل الأقرب له (his friends -> جمع -> are).",
  },
  {
    id: "sq-17",
    category: "كلمات",
    promptEn: "To 'go the extra mile' at work means to:",
    choices: ["Drive far to the office", "Do more than what is expected", "Take a long vacation", "Arrive late"],
    correctIndex: 1,
    explanationAr: "Go the extra mile معناها تبذل مجهود إضافي فوق المطلوب عشان تطلع نتيجة مبهرة.",
  },
  {
    id: "sq-18",
    category: "قواعد",
    promptEn: "By the time we arrived at the station, the train ______.",
    choices: ["already left", "had already left", "has already left", "leaves"],
    correctIndex: 1,
    explanationAr: "حدث وقع قبل حدث تاني في الماضي بياخد ماضي تام: had already left.",
  },
  {
    id: "sq-19",
    category: "مواقف",
    promptEn: "When checking into a hotel, you say: 'I have a reservation ______ the name Sara.'",
    choices: ["above", "under", "from", "over"],
    correctIndex: 1,
    explanationAr: "التعبير الثابت في الفنادق والمطاعم هو: under the name...",
  },
  {
    id: "sq-20",
    category: "كلمات",
    promptEn: "Which word is the closest synonym for 'simple and clear'?",
    choices: ["Complicated", "Straightforward", "Vague", "Stubborn"],
    correctIndex: 1,
    explanationAr: "Straightforward معناها مباشر وواضح وبسيط من غير تعقيد.",
  },
];

export const SPEED_QUIZ_BANK: SpeedQuizQuestion[] = [
  ...BASE_SPEED_QUIZ_BANK,
  ...SPEED_QUIZ_EXPANSION,
];

/** Returns 5 deterministic questions for today's Daily Challenge, or a fresh random set in endless mode. */
export function getDailySpeedQuiz(date = new Date()): SpeedQuizQuestion[] {
  const daySeed =
    date.getUTCFullYear() * 10000 +
    (date.getUTCMonth() + 1) * 100 +
    date.getUTCDate();
  const indexed = SPEED_QUIZ_BANK.map((q, idx) => ({
    q,
    score: ((daySeed * 31 + idx * 97) % 997),
  }));
  indexed.sort((a, b) => a.score - b.score);
  return indexed.slice(0, 5).map(item => item.q);
}

export function getRandomSpeedQuiz(count = 5): SpeedQuizQuestion[] {
  const copy = [...SPEED_QUIZ_BANK];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, count);
}
