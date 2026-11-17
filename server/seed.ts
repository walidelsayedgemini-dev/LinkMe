import { randomBytes } from "node:crypto";
import "dotenv/config";
import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  categories,
  courses,
  enrollments,
  instructors,
  lessonProgress,
  lessons,
  modules,
  plans,
  reviews,
  users,
} from "../drizzle/schema";
import { hashPassword } from "./auth";

const db = drizzle(process.env.DATABASE_URL!);

type LessonSeed = { title: string; minutes: number; description: string; content: string; preview?: boolean };
type ModuleSeed = { title: string; summary: string; lessons: LessonSeed[] };

const categoriesSeed = [
  { slug: "grammar", nameAr: "القواعد", nameEn: "Grammar", icon: "BookOpen", accent: "violet", description: "من الأزمنة إلى الجمل الشرطية، قواعد مشروحة بالعربي وبأمثلة إنجليزي واضحة." },
  { slug: "speaking", nameAr: "المحادثة", nameEn: "Speaking", icon: "MessageCircle", accent: "lime", description: "تكلّم بثقة في المواقف اليومية والسفر والعمل مع تدريبات صوتية." },
  { slug: "vocabulary", nameAr: "المفردات", nameEn: "Vocabulary", icon: "Library", accent: "coral", description: "كلمات وتعبيرات تُحفظ فعلًا مع سياق وأمثلة وتمارين تذكّر." },
  { slug: "ielts", nameAr: "آيلتس", nameEn: "IELTS", icon: "Target", accent: "ink", description: "استراتيجيات الأقسام الأربعة مع تدريبات محاكاة وتصحيح." },
  { slug: "business", nameAr: "إنجليزي الأعمال", nameEn: "Business English", icon: "Briefcase", accent: "violet", description: "بريد إلكتروني، اجتماعات، تفاوض ومقابلات عمل بالإنجليزية." },
  { slug: "writing", nameAr: "الكتابة", nameEn: "Writing", icon: "PenLine", accent: "coral", description: "من كتابة الفقرة إلى المقال الأكاديمي المنظم والأفكار المترابطة." },
  { slug: "pronunciation", nameAr: "النطق", nameEn: "Pronunciation", icon: "Mic", accent: "lime", description: "أصوات الإنجليزية، اللكنة، والإيقاع الطبيعي في الكلام." },
  { slug: "kids", nameAr: "إنجليزي الأطفال", nameEn: "English for Kids", icon: "Smile", accent: "ink", description: "دروس مرحة بالقصص والأغاني والأنشطة لعمر 6–12 سنة." },
];

const instructorsSeed = [
  {
    name: "Sarah Mitchell",
    email: "sarah@linkme.app",
    slug: "sarah-mitchell",
    title: "مدرّسة محادثة إنجليزية · 9 سنوات خبرة",
    bio: "أعمل مع متعلّمين عرب منذ 2016 على تحويل المعرفة إلى كلام حقيقي. أؤمن أن المحادثة تُبنى بالتكرار الآمن، لذلك أبدأ كل درس بموقف من الحياة اليومية وننتهي بمحادثة كاملة بينك وبيني.",
    experienceYears: 9,
    specialties: ["المحادثة اليومية", "السفر", "تقليل رهبة الكلام"],
    education: ["بكالوريوس آداب لغة إنجليزية — University of Leeds", "دبلوم تدريس الإنجليزية كلغة ثانية CELTA"],
    certifications: ["CELTA", "TESOL 120h"],
    city: "لندن",
    rating: 49,
    studentsCount: 4820,
    featured: true,
  },
  {
    name: "عمر السيد",
    email: "omar@linkme.app",
    slug: "omar-elsayed",
    title: "مدرّس قواعد وآيلتس · 11 سنة خبرة",
    bio: "شرحت القواعد لأكثر من 9 آلاف طالب مصري وعربي. طريقتي أن نفهم القاعدة في العربية أولًا، ثم نطبقها في جمل إنجليزية حقيقية، ثم نمتحنها في موقف يشبه الامتحان.",
    experienceYears: 11,
    specialties: ["القواعد", "الأزمنة", "IELTS Reading & Writing"],
    education: ["ليسانس آداب إنجليزي — جامعة عين شمس", "ماجستير المناهج وطرق تدريس اللغة الإنجليزية"],
    certifications: ["DELTA", "IELTS Examiner Training"],
    city: "القاهرة",
    rating: 50,
    studentsCount: 9310,
    featured: true,
  },
  {
    name: "ليلى حسن",
    email: "layla@linkme.app",
    slug: "layla-hassan",
    title: "مدرّسة إنجليزي الأعمال والكتابة · 7 سنوات خبرة",
    bio: "عملت 5 سنوات في فرق تواصل دولية، وأدرّس الآن إنجليزي العمل لمن يحتاجه فعلًا: بريد واضح، عرض مقنع، وتفاوض واثق. أسلوبي عملي: كل درس ينتهي بشيء تستخدمه غدًا في شغلك.",
    experienceYears: 7,
    specialties: ["البريد الإلكتروني", "الاجتماعات والعروض", "الكتابة الأكاديمية"],
    education: ["بكالوريوس إدارة أعمال — AUC", "شهادة Business English Teaching"],
    certifications: ["BELL Business English", "TKT"],
    city: "دبي",
    rating: 48,
    studentsCount: 3640,
    featured: true,
  },
  {
    name: "David Coleman",
    email: "david@linkme.app",
    slug: "david-coleman",
    title: "مدرّس نطق ولكنة · 12 سنة خبرة",
    bio: "أعمل على الأصوات التي يجدها المتحدثون العرب صعبة تحديدًا: /p/ و /v/ و /θ/ والإيقاع. لا أحاول أن تُصبح بريطانيًا، بل أن تكون مفهومًا وواضحًا ومريحًا في الكلام.",
    experienceYears: 12,
    specialties: ["النطق", "اللكنة الأمريكية", "الإيقاع والتشديد"],
    education: ["بكالوريوس لسانيات — University of Manchester"],
    certifications: ["IPA Certified", "Pronunciation Teaching Certificate"],
    city: "مانشستر",
    rating: 47,
    studentsCount: 2870,
    featured: false,
  },
  {
    name: "نور عادل",
    email: "nour@linkme.app",
    slug: "nour-adel",
    title: "مدرّسة إنجليزي أطفال ومفردات · 6 سنوات خبرة",
    bio: "أدرّس الأطفال من 6 إلى 12 سنة عبر القصص والأغاني والأنشطة القصيرة. الهدف أن يحبّ الطفل الإنجليزية قبل أن يحفظها، وأشارك ولي الأمر تقريرًا أسبوعيًا بسيطًا عن التقدم.",
    experienceYears: 6,
    specialties: ["إنجليزي الأطفال", "القصص", "بناء المفردات"],
    education: ["بكالوريوس تربية طفولة مبكرة — جامعة الإسكندرية"],
    certifications: ["Teaching Young Learners", "Phonics Certified"],
    city: "الإسكندرية",
    rating: 49,
    studentsCount: 1980,
    featured: false,
  },
  {
    name: "أحمد فاروق",
    email: "ahmed@linkme.app",
    slug: "ahmed-farouk",
    title: "مدرّس آيلتس وكتابة أكاديمية · 10 سنوات خبرة",
    bio: "حصل طلابي على أكثر من 3000 نتيجة آيلتس بين 6.5 و 8.0. أشرح معايير التقييم بوضوح، ونعمل على عيّنات كتابة حقيقية مع تصحيح مفصّل لكل فقرة.",
    experienceYears: 10,
    specialties: ["IELTS", "Academic Writing", "Task 2 Essays"],
    education: ["بكالوريوس لغة إنجليزية — جامعة الأزهر", "ماجستير الترجمة"],
    certifications: ["IELTS Teacher Training", "Cambridge C1 Advanced"],
    city: "الرياض",
    rating: 48,
    studentsCount: 6120,
    featured: true,
  },
];

const lesson = (title: string, minutes: number, description: string, body: string, preview = false): LessonSeed => ({
  title,
  minutes,
  description,
  preview,
  content: body,
});

const coursesSeed: Array<{
  slug: string;
  title: string;
  titleAr: string;
  subtitle: string;
  description: string;
  level: "beginner" | "intermediate" | "advanced" | "all";
  category: string;
  instructor: string;
  priceCents: number;
  compareAtCents?: number;
  durationHours: number;
  studentsCount: number;
  featured: boolean;
  accent: string;
  coverImage?: string;
  outcomes: string[];
  requirements: string[];
  audience: string[];
  tags: string[];
  modules: ModuleSeed[];
}> = [
  {
    slug: "speak-english-confidently",
    title: "English for Real-Life Conversations",
    titleAr: "تكلّم إنجليزي بثقة في الحياة اليومية",
    subtitle: "من «أفهم لكن لا أستطيع الكلام» إلى محادثة كاملة في المقهى والمطار والعمل.",
    description:
      "معظم متعلمي الإنجليزية يعرفون الكلمات لكنهم يتجمدون عند الكلام. هذا الكورس مبني عكس ذلك تمامًا: كل درس يبدأ بموقف حقيقي، نتعلم التعبيرات التي تُقال فعلًا في هذا الموقف، ثم نتدرّب عليها صوتيًا حتى تصبح تلقائية. لا حفظ قوائم، ولا قواعد معقدة — فقط كلام.",
    level: "intermediate",
    category: "speaking",
    instructor: "sarah-mitchell",
    priceCents: 3900,
    compareAtCents: 5900,
    durationHours: 18,
    studentsCount: 4820,
    featured: true,
    accent: "lime",
    outcomes: [
      "تبدأ محادثة مع غريب وتنهيها بشكل طبيعي دون توقف طويل",
      "تستخدم 150+ تعبيرًا حقيقيًا في المواقف اليومية",
      "تطلب وتشرح وتشتكي وتحجز بالإنجليزية بثقة",
      "تقليل الخوف من الخطأ والتفكير بالترجمة الحرفية",
    ],
    requirements: ["مستوى A2 على الأقل", "سماعات للتسجيل والاستماع", "10 دقائق تدريب يوميًا"],
    audience: ["من يفهم الإنجليزية لكن يتردد في الكلام", "المسافرون", "من يعمل مع أجانب"],
    tags: ["محادثة", "تعبيرات", "سفر", "ثقة"],
    modules: [
      {
        title: "Module 1 — Small Talk Without Freezing",
        summary: "كيف تبدأ حديثًا قصيرًا وتترك انطباعًا مريحًا.",
        lessons: [
          lesson("Opening lines that actually work", 14, "جمل بداية طبيعية حسب المكان.", "## Why small talk matters\n\nفي الإنجليزية، الدخول مباشرة في الموضوع قد يبدو جافًا. نبدأ بسؤال بسيط ثم ننتقل بسلاسة.\n\n### Openers\n- **Hi, is this seat taken?** — للمقعد في الكافيه أو المطار.\n- **How's your day going so far?** — سؤال عام آمن.\n- **Lovely weather today, isn't it?** — كسر جليد كلاسيكي.\n\n### قاعدة ذهبية\nاجعل سؤالك **مفتوحًا** (يبدأ بـ how/what) لا مغلقًا (yes/no).\n\n> تدريب: سجّل 60 ثانية تبدأ فيها محادثة وتستخدم تعبيرين من القائمة.", true),
          lesson("Keeping the conversation alive", 16, "أسئلة المتابعة وقاعدة الـ 3 أسئلة.", "## Follow-up questions\n\nالحديث يموت حين نقول: *Yes. Okay.* المتابعة هي أن تعلق ثم تسأل.\n\n| You hear | You follow up |\n| --- | --- |\n| I'm from Spain. | Oh nice — which part? |\n| I work in design. | That sounds creative. What kind of projects? |\n\n### قاعدة الـ 3\nعلّق → اسأل → شارك أنت. هذا الترتيب يجعل الطرف الآخر يتكلم ويعود إليك."),
          lesson("Ending a chat politely", 12, "إنهاء المحادثة بدون حرج.", "## Graceful exits\n\n- **It was great talking to you — I should let you get back to it.**\n- **I'll let you run — we'll catch up later.**\n\nلاحظ استخدام **let you** فهي أكثر لطفًا من *I have to go now*."),
          lesson("Pronunciation drill: linking words", 10, "الوصل بين الكلمات لسرعة طبيعية.", "## Connected speech\n\nالإنجليزي لا يُنطق كلمة كلمة. مثال:\n\n- *What are you doing?* → **Whaddaya doing?**\n- *Did you eat?* → **Dijoo eat?**\n\nابدأ بالنطق الواضح، ثم أضف الوصل تدريجيًا."),
        ],
      },
      {
        title: "Module 2 — Everyday Situations",
        summary: "المقهى، المطار، الفندق، والطبيب.",
        lessons: [
          lesson("Ordering food and coffee", 15, "الطلب والتخصيص والدفع.", "## At the counter\n\n- **Can I get a flat white, please?** (أفضل من *I want*)\n- **Could I have that to go?**\n- **I'm allergic to nuts — does this contain any?**\n\n### Payment\n- **Can we split the bill?** — نقسم الحساب.\n- **Keep the change.** — احتفظ بالباقي."),
          lesson("Airports, check-in and delays", 16, "الرحلات والتأخير والعفش.", "## Airport language\n\n- **I'd like to check in this bag.**\n- **Is this flight delayed?**\n- **My luggage hasn't arrived.**\n\n### Polite complaints\n- **Sorry to bother you, but my seat seems to be taken.**"),
          lesson("At the hotel", 14, "الحجز والمشاكل والخدمات.", "## Front desk\n\n- **I have a reservation under the name Hassan.**\n- **Could you change my room? The AC isn't working.**\n- **What time is checkout?**"),
          lesson("Describing problems to a doctor", 15, "الوصف الصحيح للأعراض.", "## Symptoms\n\n- **I've had a headache since yesterday.**\n- **It hurts when I breathe.**\n- **I'm allergic to penicillin.**\n\nاستخدم المضارع التام (**I've had**) لأن العرض بدأ في الماضي ويستمر."),
        ],
      },
      {
        title: "Module 3 — Speaking With Confidence",
        summary: "استراتيجيات التفكير والتصحيح الذاتي.",
        lessons: [
          lesson("Buying time like a native", 11, "كيف تكسب ثانية للتفكير.", "## Fillers that sound natural\n\n- **That's a good question — let me think.**\n- **How can I put this...**\n- **Well, to be honest with you...**\n\nهذه ليست أخطاء؛ المتحدثون الأصليون يستخدمونها كثيرًا."),
          lesson("Self-correction without panic", 12, "تصحيح نفسك بسلاسة.", "## Repair phrases\n\n- **Sorry, I mean...**\n- **What I'm trying to say is...**\n\nالتصحيح الذاتي علامة تقدم، وليس ضعفًا."),
          lesson("Your 5-minute speaking routine", 10, "روتين يومي يبني الطلاقة.", "## Daily routine\n\n1. سجّل 2 دقيقة عن موضوع اليوم.\n2. استمع ولاحظ 3 أشياء.\n3. أعد التسجيل مرة واحدة.\n\nالتكرار اليومي أهم من الجلسات الطويلة."),
        ],
      },
    ],
  },
  {
    slug: "ielts-band-7-blueprint",
    title: "IELTS Band 7 Blueprint",
    titleAr: "خطة الآيلتس لنيل Band 7",
    subtitle: "خطة كاملة لأقسام الآيلتس الأربعة مع استراتيجيات ومعايير تقييم مشروحة.",
    description:
      "هذا الكورس لا يعطيك حيلًا سريعة، بل يعلّمك كيف يفكر الممتحن. سنمر على الأقسام الأربعة، نقرأ عيّنات إجابات حقيقية، ونطبّق معايير التقييم الرسمية على كتابتك وكلامك، حتى تعرف بالضبط أين تخسر النقاط وكيف تستعيدها.",
    level: "advanced",
    category: "ielts",
    instructor: "omar-elsayed",
    priceCents: 7900,
    compareAtCents: 9900,
    durationHours: 26,
    studentsCount: 9310,
    featured: true,
    accent: "ink",
    outcomes: [
      "تفهم معايير التقييم الأربعة في Writing و Speaking",
      "تنهي Reading في الوقت المحدد باستراتيجية المسح والتصفح",
      "تكتب Task 2 بفقرة مقدمة واضحة وخاتمة مقنعة",
      "تدير وقت Listening وتقلل الأخطاء بسبب الإملاء",
    ],
    requirements: ["مستوى B1+", "هدف واضح (6.5 أو 7+)", "حوالي 6 ساعات أسبوعيًا"],
    audience: ["الطلاب المتقدمون للدراسة بالخارج", "المقيمون للأغراض المهنية", "من أعاد الامتحان أكثر من مرة"],
    tags: ["IELTS", "امتحان", "كتابة", "قراءة"],
    modules: [
      {
        title: "Module 1 — Understanding the Test",
        summary: "بنية الامتحان ومعايير التقييم.",
        lessons: [
          lesson("How IELTS scoring really works", 18, "شرح معايير التقييم الأربعة.", "## The four criteria\n\n| Section | Criteria |\n| --- | --- |\n| Writing | Task Response, Coherence, Lexical Resource, Grammar |\n| Speaking | Fluency, Lexical Resource, Grammar, Pronunciation |\n\nكل معيار 25% من الدرجة. الهدف ليس الإجابة المثالية، بل **الدرجة المستهدفة في كل معيار**.\n\n> مثال: للوصول إلى 7 في Task Response تحتاج موقفًا واضحًا مدعومًا بأمثلة، لا أكثر.", true),
          lesson("Time management across four sections", 15, "توزيع الوقت أثناء الامتحان.", "## Timing\n\n- Listening: 30 دقيقة + 10 للنقل\n- Reading: 60 دقيقة (20 لكل passage)\n- Writing: 60 دقيقة (20 للـ Task 1 و 40 للـ Task 2)\n- Speaking: 11–14 دقيقة"),
          lesson("Common myths that cost you points", 12, "خرافات شائعة.", "## Myths\n\n- ❌ «كلمات صعبة تعني درجة أعلى» — الاستخدام الدقيق أهم.\n- ❌ «يجب أن يكون اللكنة أمريكية» — الوضوح هو المطلوب.\n- ❌ «إجابة أطول أفضل» — الإجابة على السؤال أولًا."),
        ],
      },
      {
        title: "Module 2 — Writing Task 1 & 2",
        summary: "الرسوم البيانية والمقال.",
        lessons: [
          lesson("Task 1: describing charts", 20, "هيكل وصف الرسم البياني.", "## Structure\n\n1. Introduction — أعِد صياغة السؤال.\n2. Overview — أهم اتجاهين.\n3. Body 1 — التفاصيل الرئيسية.\n4. Body 2 — الباقي.\n\n**العبارات:** *rose sharply, plateaued, declined steadily, peaked at*."),
          lesson("Task 2: building a strong argument", 22, "مقدمة وفقرات وخاتمة.", "## Essay skeleton\n\n- **Intro:** paraphrase + clear position.\n- **Body 1:** claim + explanation + example.\n- **Body 2:** counter-view أو حجة ثانية.\n- **Conclusion:** إعادة الصياغة دون معلومات جديدة."),
          lesson("Coherence and linking words", 14, "روابط الحجج بدون تكرار.", "## Linking\n\nاستخدم روابط متنوعة: *Moreover, Nevertheless, In contrast, As a result*.\n\n⚠️ لا تبدأ كل جملة برابط — المعنى هو الذي يحدد الرابط."),
        ],
      },
      {
        title: "Module 3 — Reading & Listening",
        summary: "السرعة والدقة.",
        lessons: [
          lesson("Skimming, scanning and matching headings", 18, "تقنيات القراءة السريعة.", "## Strategy\n\nاقرأ السؤال أولًا، حدّد كلمات مفتاحية، ثم ابحث في النص. لا تقرأ النص كلمة بكلمة."),
          lesson("Listening for numbers and spellings", 15, "أخطاء الإملاء الشائعة.", "## Watch out\n\n- 13 / 30 — thirteen vs thirty\n- double letters: **accommodation**\n- أسماء الأماكن تُملى حرفًا حرفًا."),
          lesson("Full practice test walkthrough", 25, "جلسة محاكاة كاملة.", "## Practice\n\nنفّذ امتحانًا كاملًا بوقت حقيقي، ثم راجع الأخطاء وصنّفها: مفردات، سرعة، أم دقة."),
        ],
      },
    ],
  },
  {
    slug: "english-grammar-foundations",
    title: "English Grammar Foundations",
    titleAr: "أساسيات القواعد الإنجليزية من الصفر",
    subtitle: "ابدأ صح: الجملة، الأزمنة الأساسية، والضمائر — بشرح عربي مبسط.",
    description:
      "كورس تأسيسي مدفوع لمن يبدأ من الصفر أو يريد ترتيب معلوماته. كل قاعدة تُشرح بالعربي أولًا، ثم بأمثلة إنجليزية قصيرة، ثم بتمرين سريع. النهاية: تكتب فقرات بسيطة بلا أخطاء أساسية.",
    level: "beginner",
    category: "grammar",
    instructor: "omar-elsayed",
    priceCents: 90_000,
    durationHours: 12,
    studentsCount: 12400,
    featured: true,
    accent: "violet",
    outcomes: [
      "تكوّن جملة إنجليزية صحيحة: فاعل + فعل + تكملة",
      "تستخدم Present Simple و Past Simple بثقة",
      "تفرّق بين a/an/the والجمع",
      "تتجنب أشهر 20 خطأ للمبتدئين العرب",
    ],
    requirements: ["لا يوجد — ابدأ من هنا"],
    audience: ["المبتدئون تمامًا", "من نسي القواعد القديمة", "أولياء الأمور المراجعون مع أطفالهم"],
    tags: ["قواعد", "مبتدئ", "أساسيات"],
    modules: [
      {
        title: "Module 1 — The English Sentence",
        summary: "ترتيب الجملة الأساسي.",
        lessons: [
          lesson("Subject + verb + object", 12, "أساس الجملة الإنجليزية.", "## Word order\n\nالإنجليزية **SVO**: *Ali drinks coffee.*\n\nالخطأ الشائع عند العرب تقديم الفعل: ❌ *Drinks Ali coffee.*\n\n> تمرين: أعد ترتيب 10 جمل مختلطة.", true),
          lesson("Nouns: countable and uncountable", 14, "الأسماء المعدودة وغير المعدودة.", "## Countable / Uncountable\n\n- **information, advice, furniture, water** — غير معدودة.\n- نقول **a piece of advice** لا *an advice*."),
          lesson("Articles: a, an, the", 15, "أدوات التعريف.", "## Articles\n\n- **a/an** — أول ذكر لشيء غير محدد.\n- **the** — شيء معروف للمتكلم والسامع.\n- بدون أداة — جمع عام: *Cats are cute.*"),
        ],
      },
      {
        title: "Module 2 — Core Tenses",
        summary: "الحاضر والماضي.",
        lessons: [
          lesson("Present simple vs continuous", 16, "الفرق الجوهري.", "## Present\n\n- **I work** في شركة — عادة ثابتة.\n- **I'm working** on a project — الآن.\n\nكلمات الإشارة: *usually, every day* مقابل *now, at the moment*."),
          lesson("Past simple regular and irregular", 15, "الأفعال المنتظمة والشاذة.", "## Past simple\n\n- **work → worked**, **study → studied**\n- **go → went**, **buy → bought**, **teach → taught**"),
          lesson("Questions and negatives", 13, "بناء السؤال والنفي.", "## Do-support\n\n- *Do you like tea?* / *I don't like coffee.*\n- في الماضي: *Did you call him?*"),
        ],
      },
    ],
  },
  {
    slug: "business-english-negotiations",
    title: "Business English: Meetings & Negotiations",
    titleAr: "إنجليزي الأعمال: الاجتماعات والتفاوض",
    subtitle: "بريد واضح، اجتماع مرتب، وتفاوض باحتراف في بيئة عمل دولية.",
    description:
      "كورس عملي لمحترفي الأعمال. سنكتب بريدًا إلكترونيًا حقيقيًا، نشارك في اجتماع افتراضي، ونتفاوض على سعر ومدة تسليم. كل درس ينتهي بمخرَج تستخدمه في شغلك مباشرة.",
    level: "intermediate",
    category: "business",
    instructor: "layla-hassan",
    priceCents: 5900,
    compareAtCents: 7500,
    durationHours: 20,
    studentsCount: 3640,
    featured: true,
    accent: "violet",
    outcomes: [
      "تكتب بريدًا مهنيًا بثلاث فقرات وهيكل واضح",
      "تدير اجتماعًا قصيرًا وتلخص القرارات",
      "تستخدم لغة التفاوض: العرض، الرفض المهذب، والتنازل",
      "تقدم عرضًا من 5 دقائق بلغة واثقة",
    ],
    requirements: ["مستوى B1+", "بيئة عمل أو هدف وظيفي دولي"],
    audience: ["الموظفون في شركات دولية", "أصحاب المشاريع", "الباحثون عن ترقية"],
    tags: ["أعمال", "اجتماعات", "تفاوض", "بريد"],
    modules: [
      {
        title: "Module 1 — Emails That Get Replies",
        summary: "هيكل البريد المهني.",
        lessons: [
          lesson("The 3-paragraph email", 15, "قالب بريد فعّال.", "## Template\n\n1. **Context:** *I'm writing about the Q3 report.*\n2. **Ask:** *Could you share the final numbers by Thursday?*\n3. **Close:** *Happy to jump on a quick call if easier.*\n\nاحتفظ بالجملة الأولى قصيرة — لا مقدمات طويلة.", true),
          lesson("Tone: direct vs polite", 14, "الفرق بين الحسم والوقاحة.", "## Tone\n\n- ❌ *Send me the file.*\n- ✅ *Could you send me the file when you get a chance?*"),
          lesson("Following up without being pushy", 12, "المتابعة المهذبة.", "## Follow-up\n\n*Just checking in on this — no rush, but let me know if you need anything from me.*"),
        ],
      },
      {
        title: "Module 2 — Meetings",
        summary: "من الافتتاح إلى الملخص.",
        lessons: [
          lesson("Opening and facilitating", 16, "بدء الاجتماع وإدارة الوقت.", "## Openers\n\n- *Thanks everyone for joining — we have 30 minutes.*\n- *Let's start with the first item.*"),
          lesson("Interrupting and disagreeing politely", 15, "المشاركة بدون مقاطعة مزعجة.", "## Phrases\n\n- *Sorry to jump in, but...*\n- *I see your point, though I'd suggest...*"),
          lesson("Summarising action points", 12, "إغلاق الاجتماع بقرارات واضحة.", "## Wrap-up\n\n*So, to recap: Sara will send the draft by Tuesday, and we'll review on Thursday.*"),
        ],
      },
      {
        title: "Module 3 — Negotiation",
        summary: "لغة العرض والتنازل.",
        lessons: [
          lesson("Making and responding to offers", 16, "التفاوض خطوة بخطوة.", "## Negotiation\n\n- *If we increase the order, could you offer a discount?*\n- *That's a bit above our budget — is there flexibility?*"),
          lesson("Handling pressure and closing", 14, "إغلاق الصفقة.", "## Closing\n\n- *I think we have a deal.*\n- *Let me confirm this in writing.*"),
        ],
      },
    ],
  },
  {
    slug: "pronunciation-masterclass",
    title: "Pronunciation & Accent Masterclass",
    titleAr: "احتراف النطق واللكنة",
    subtitle: "الأصوات التي يخطئ فيها العرب، والإيقاع الذي يجعل كلامك مفهومًا.",
    description:
      "لن تحصل على لكنة مزيفة، بل على نطق واضح ومريح. نعمل صوتًا صوتًا مع تمارين تسجيل ومقارنة، ونصلح أشهر أخطاء النطق: /p/ و /v/ و /θ/ وحروف العلة الطويلة والقصيرة.",
    level: "all",
    category: "pronunciation",
    instructor: "david-coleman",
    priceCents: 4500,
    durationHours: 14,
    studentsCount: 2870,
    featured: false,
    accent: "lime",
    outcomes: [
      "تنطق الأصوات الصعبة بوضوح (/p/, /v/, /θ/, /r/)",
      "تفرّق بين ship/sheep و bad/bed",
      "تستخدم التشديد الصحيح في الكلمات الطويلة",
      "تتحدث بإيقاع طبيعي لا كلمة بكلمة",
    ],
    requirements: ["ميكروفون بسيط", "لا تحتاج مستوى متقدمًا"],
    audience: ["من يكرر نفسه ليُفهم", "المتحدثون في اجتماعات دولية", "المدرّسون"],
    tags: ["نطق", "لكنة", "أصوات"],
    modules: [
      {
        title: "Module 1 — Problem Sounds",
        summary: "الأصوات الصعبة للمتحدثين العرب.",
        lessons: [
          lesson("/p/ vs /b/", 12, "أشهر خطأ نطقي.", "## Minimal pairs\n\n- **pen / Ben**\n- **cap / cab**\n\nضع يدك أمام فمك: /p/ يخرج معها هواء.", true),
          lesson("/v/ vs /f/ and /w/", 13, "الشفة والأسنان.", "## Practice\n\n- **very / ferry**\n- **vine / wine**"),
          lesson("/θ/ and /ð/", 12, "th المعروفة.", "## th\n\nاللسان بين الأسنان قليلًا: **think, this, weather**."),
        ],
      },
      {
        title: "Module 2 — Rhythm and Stress",
        summary: "الإيقاع والتشديد.",
        lessons: [
          lesson("Word stress rules", 14, "أين يقع التشديد؟", "## Stress\n\n- **PHO-to-graph** → **pho-TOG-ra-phy**\n- الأسماء عادة في المقطع الأول، والأفعال في الثاني: **REcord** / **reCORD**"),
          lesson("Sentence stress and intonation", 15, "النغمة التي تعطي المعنى.", "## Intonation\n\nالسؤال بنعم/لا يرتفع في النهاية: *Are you coming?* ↗"),
        ],
      },
    ],
  },
  {
    slug: "english-for-kids-adventure",
    title: "English Adventure for Kids",
    titleAr: "مغامرة الإنجليزية للأطفال",
    subtitle: "قصص وأغاني وأنشطة قصيرة لعمر 6–12 سنة مع متابعة أسبوعية لولي الأمر.",
    description:
      "دروس قصيرة (10–15 دقيقة) مليئة بالقصص والألوان والحركة. الطفل يتعلم 300 كلمة أساسية وجملًا يستخدمها في البيت، وأنت كولي أمر تحصل على تقرير أسبوعي بسيط.",
    level: "beginner",
    category: "kids",
    instructor: "nour-adel",
    priceCents: 2900,
    durationHours: 10,
    studentsCount: 1980,
    featured: false,
    accent: "coral",
    outcomes: [
      "الطفل يعرّف عن نفسه ويصف بيته وعائلته",
      "300 كلمة أساسية مع الصور والصوت",
      "أنشطة طباعة وتمارين منزلية",
      "تقرير تقدم أسبوعي لولي الأمر",
    ],
    requirements: ["عمر 6–12 سنة", "حضور ولي الأمر في أول 5 دقائق"],
    audience: ["أولياء الأمور", "المدرّسون في الحضانات"],
    tags: ["أطفال", "قصص", "أنشطة"],
    modules: [
      {
        title: "Module 1 — Hello, World!",
        summary: "التحيات والتعريف بالنفس.",
        lessons: [
          lesson("Hello song & names", 10, "أغنية التحية.", "## Hello!\n\n*Hello, hello, how are you? I'm fine, thank you!*\n\nاطلب من الطفل أن يحيّي دمية أو أخاه كل صباح.", true),
          lesson("My family", 12, "أفراد العائلة.", "## Family words\n\nmother, father, sister, brother, grandma, grandpa.\n\nنشاط: ارسم شجرة العائلة واكتب الأسماء."),
          lesson("Colours and numbers", 12, "الألوان والأرقام.", "## Colours\n\nred, blue, yellow, green.\n\nنشاط: عدّ التفاحات وسمِّ اللون."),
        ],
      },
      {
        title: "Module 2 — My Day",
        summary: "الروتين والطعام والحيوانات.",
        lessons: [
          lesson("Morning routine", 12, "من الاستيقاظ إلى المدرسة.", "## Daily words\n\nwake up, brush my teeth, eat breakfast, go to school."),
          lesson("Animals in the zoo", 12, "الحيوانات والأصوات.", "## Animals\n\nlion, elephant, monkey, giraffe, penguin."),
        ],
      },
    ],
  },
  {
    slug: "vocabulary-power-2000",
    title: "Vocabulary Power: 2000 Words That Stick",
    titleAr: "قوة المفردات: 2000 كلمة لا تُنسى",
    subtitle: "نظام تذكّر يعتمد على السياق والتكرار المتباعد بدل قوائم الحفظ.",
    description:
      "الحفظ التقليدي ينسى بعد أسبوع. هنا نستخدم السياق والصور والكلمات المتشابهة والتكرار المتباعد لبناء 2000 كلمة تدوم. مقسّمة على 40 مجموعة موضوعية مع مراجعة أسبوعية.",
    level: "all",
    category: "vocabulary",
    instructor: "nour-adel",
    priceCents: 3500,
    durationHours: 16,
    studentsCount: 5410,
    featured: false,
    accent: "coral",
    outcomes: ["تحفظ 2000 كلمة في سياقات حقيقية", "تميز الكلمات المتقاربة المعنى", "تبني نظام مراجعة متباعدة شخصي"],
    requirements: ["لا يوجد"],
    audience: ["الطلاب قبل الامتحانات", "من يشعر أن كلماته محدودة"],
    tags: ["مفردات", "ذاكرة", "مراجعة"],
    modules: [
      {
        title: "Module 1 — How Memory Works",
        summary: "أساس التذكّر.",
        lessons: [
          lesson("Spaced repetition in practice", 14, "التكرار المتباعد.", "## Spaced repetition\n\nراجع بعد ساعة، يوم، ثلاثة أيام، أسبوع، شهر. استخدم بطاقات مع **جملة كاملة** لا كلمة وحيدة.", true),
          lesson("Context over lists", 15, "لماذا تفشل القوائم؟", "## Context\n\n*negotiate* في قائمة = كلمة. *We negotiated the price for two hours* = ذكرى."),
        ],
      },
      {
        title: "Module 2 — Word Families",
        summary: "عائلات الكلمات والاشتقاق.",
        lessons: [
          lesson("Prefixes and suffixes", 14, "بناء الكلمات.", "## Build\n\n- **un- + happy = unhappy**\n- **care + ful = careful**\n- **create → creation → creative**"),
          lesson("Collocations that sound natural", 15, "كلمات تذهب معًا.", "## Collocations\n\n**make** a decision (لا *do*), **take** a shower (BrE), **heavy** rain."),
        ],
      },
    ],
  },
  {
    slug: "academic-writing-essentials",
    title: "Academic Writing Essentials",
    titleAr: "أساسيات الكتابة الأكاديمية",
    subtitle: "من الفقرة إلى المقال البحثي: بنية، ربط، وأسلوب أكاديمي.",
    description:
      "لطلاب الجامعات والباحثين. نبني فقرة قوية، ثم مقالًا كاملًا، ثم نتعلم الاقتباس والأسلوب الأكاديمي وتجنب الحشو. مع تصحيح نموذجي لمقالات حقيقية.",
    level: "advanced",
    category: "writing",
    instructor: "ahmed-farouk",
    priceCents: 4900,
    durationHours: 18,
    studentsCount: 2230,
    featured: false,
    accent: "coral",
    outcomes: ["تكتب فقرة بجملة موضوع وثلاث جمل دعم", "تبني مقالًا من 5 فقرات", "تقتبس وتوثّق بأسلوب سليم"],
    requirements: ["مستوى B2+"],
    audience: ["طلاب الجامعة", "المتقدمون للدراسات العليا", "الباحثون"],
    tags: ["كتابة", "أكاديمي", "مقال"],
    modules: [
      {
        title: "Module 1 — Paragraph Craft",
        summary: "الفقرة القوية.",
        lessons: [
          lesson("Topic sentences", 14, "الجملة الافتتاحية.", "## Topic sentence\n\nتحدد الفكرة وتوجه باقي الفقرة.\n\n❌ *Technology is important.*\n✅ *Remote work has reshaped how companies hire talent.*", true),
          lesson("Evidence and explanation", 15, "الدعم والتحليل.", "## PEEL\n\nPoint → Evidence → Explanation → Link."),
        ],
      },
      {
        title: "Module 2 — The Academic Essay",
        summary: "الهيكل الكامل.",
        lessons: [
          lesson("Thesis statements", 15, "أطروحة المقال.", "## Thesis\n\nجملة واحدة تقول موقفك بوضوح: *This essay argues that...*"),
          lesson("Citations and plagiarism", 16, "الاقتباس الآمن.", "## Citation\n\n- Harvard: (Smith, 2021)\n- APA: (Smith, 2021, p. 14)\n\nحتى إعادة الصياغة تحتاج توثيقًا."),
        ],
      },
    ],
  },
  {
    slug: "ielts-speaking-intensive",
    title: "IELTS Speaking Intensive",
    titleAr: "آيلتس المحادثة مكثف",
    subtitle: "Parts 1-3 مع تدريبات تسجيل وتصحيح وفق معايير التقييم.",
    description:
      "مخصص لقسم Speaking فقط. ستتدرب على أسئلة Part 1 السريعة، الـ cue card في Part 2، والأسئلة التحليلية في Part 3، مع نماذج إجابة ورفع تسجيلاتك للمقارنة.",
    level: "intermediate",
    category: "ielts",
    instructor: "ahmed-farouk",
    priceCents: 6500,
    durationHours: 12,
    studentsCount: 4180,
    featured: false,
    accent: "ink",
    outcomes: ["تجيب Part 2 لمدة دقيقتين دون توقف", "تطور فكرة في Part 3 بعمق", "تستخدم مفردات متنوعة بدقة"],
    requirements: ["مستوى B1+", "مسجل صوتي"],
    audience: ["من امتحانه قريب", "من حصل على 6 في Speaking ويريد 7"],
    tags: ["IELTS", "محادثة", "امتحان"],
    modules: [
      {
        title: "Module 1 — Part 1 & 2",
        summary: "الأسئلة القصيرة والـ cue card.",
        lessons: [
          lesson("Part 1: 4-sentence answers", 14, "إجابات مختصرة قوية.", "## Formula\n\nAnswer → reason → example → return.\n\n*Do you like reading?* → *Yes, I do. I read before bed because it helps me switch off — mostly novels.*", true),
          lesson("Part 2: the 2-minute talk", 18, "التحدث لدقيقتين.", "## Structure\n\nWhat / when / where / why / how you felt. اكتب 5 كلمات فقط في دقيقة التحضير."),
        ],
      },
      {
        title: "Module 2 — Part 3 & Fluency",
        summary: "التحليل والطلاقة.",
        lessons: [
          lesson("Developing abstract answers", 17, "التفكير بصوت عالٍ.", "## Develop\n\nموقف → سبب → مثال → استثناء."),
          lesson("Reducing hesitation", 14, "تقليل التوقف.", "## Fluency\n\nاستبدل الصمت بعبارات مثل *That's an interesting point...*"),
        ],
      },
    ],
  },
  {
    slug: "job-interview-english",
    title: "Job Interview English",
    titleAr: "إنجليزي مقابلات العمل",
    subtitle: "أسئلة المقابلة الشائعة، STAR method، والحديث عن خبرتك بثقة.",
    description:
      "استعد لمقابلة عمل بالإنجليزية: قدّم نفسك في دقيقة، أجب عن نقاط قوتك وضعفك، استخدم STAR لرواية إنجازاتك، واسأل أسئلة ذكية في النهاية.",
    level: "intermediate",
    category: "business",
    instructor: "layla-hassan",
    priceCents: 3900,
    durationHours: 10,
    studentsCount: 3120,
    featured: false,
    accent: "violet",
    outcomes: ["تقدّم نفسك في 60 ثانية", "تجيب عن 15 سؤالًا شائعًا", "تستخدم STAR في الإجابة السلوكية"],
    requirements: ["مستوى B1+"],
    audience: ["الباحثون عن عمل", "المتقدمون لشركات دولية"],
    tags: ["مقابلات", "عمل", "أعمال"],
    modules: [
      {
        title: "Module 1 — The First Minute",
        summary: "التعريف بالنفس.",
        lessons: [
          lesson("Tell me about yourself", 15, "إجابة الدقيقة.", "## Formula\n\nPresent role → past experience → why this company.", true),
          lesson("Strengths and weaknesses", 14, "بصدق وذكاء.", "## Weakness\n\nاختر ضعفًا حقيقيًا + خطوة تحسين: *I used to over-prepare; now I set a time limit.*"),
        ],
      },
      {
        title: "Module 2 — Behavioural Answers",
        summary: "STAR والمواقف.",
        lessons: [
          lesson("The STAR method", 16, "Situation, Task, Action, Result.", "## STAR\n\nS: *Last year our launch slipped.*\nT: *I had to replan.*\nA: *I split the work into weekly milestones.*\nR: *We shipped two weeks late, not two months.*"),
          lesson("Questions to ask them", 12, "أسئلة ذكية.", "## Ask\n\n*What does success look like in the first 90 days?*"),
        ],
      },
    ],
  },
  {
    slug: "everyday-english-travel",
    title: "Everyday English: Travel & Life Abroad",
    titleAr: "إنجليزي السفر والحياة بالخارج",
    subtitle: "من المطار إلى إيجار الشقة: عبارات تنجيك في كل موقف.",
    description:
      "دليل عملي للسفر والدراسة والعمل بالخارج. مواقف حقيقية: المطار، الفندق، المطعم، الطبيب، الإيجار، والبنك — مع قوالب عبارات جاهزة للاستخدام.",
    level: "beginner",
    category: "speaking",
    instructor: "sarah-mitchell",
    priceCents: 2500,
    durationHours: 8,
    studentsCount: 4560,
    featured: false,
    accent: "lime",
    outcomes: ["تتعامل مع المطار والفندق والمطعم", "تشرح مشكلة وتطلب مساعدة", "تفهم التعليمات السريعة"],
    requirements: ["مستوى A2"],
    audience: ["المسافرون", "الطلاب بالخارج", "المقيمون الجدد"],
    tags: ["سفر", "عبارات", "حياة"],
    modules: [
      {
        title: "Module 1 — Getting Around",
        summary: "الوصول والتنقل.",
        lessons: [
          lesson("Immigration and customs", 12, "عند الحدود.", "## At the border\n\n- *I'm here on holiday for two weeks.*\n- *I have nothing to declare.*", true),
          lesson("Taxis, trains and directions", 13, "التنقل.", "## Directions\n\n- *How do I get to the station?*\n- *Is it within walking distance?*"),
        ],
      },
      {
        title: "Module 2 — Living Abroad",
        summary: "الإيجار والبنك والطبيب.",
        lessons: [
          lesson("Renting a flat", 14, "التعامل مع المالك.", "## Renting\n\n- *Is the deposit refundable?*\n- *Are utilities included?*"),
          lesson("Opening a bank account", 12, "البنك.", "## Bank\n\n- *I'd like to open a current account.*\n- *What documents do I need?*"),
        ],
      },
    ],
  },
  {
    slug: "master-english-tenses",
    title: "Master English Tenses",
    titleAr: "إتقان أزمنة الإنجليزية",
    subtitle: "12 زمنًا بمنطق واحد: الماضي والحاضر والمستقبل في كل بُعد.",
    description:
      "بدل حفظ 12 زمنًا منفصلًا، نفهم النظام: زمان + بُعد (بسيط، مستمر، تام، تام مستمر). مع مقارنات وجمل من الحياة اليومية وتدريبات تصحيح.",
    level: "intermediate",
    category: "grammar",
    instructor: "omar-elsayed",
    priceCents: 4200,
    durationHours: 15,
    studentsCount: 6740,
    featured: false,
    accent: "violet",
    outcomes: ["تختار الزمن الصحيح تلقائيًا", "تفرّق بين have done و did", "تستخدم المستقبل بثلاث طرق"],
    requirements: ["معرفة أساسية بالأزمنة"],
    audience: ["من يخلط بين الأزمنة", "طلاب الثانوية"],
    tags: ["قواعد", "أزمنة"],
    modules: [
      {
        title: "Module 1 — The System",
        summary: "خريطة الأزمنة.",
        lessons: [
          lesson("The tense map", 16, "نظرة شاملة.", "## Map\n\n| | Simple | Continuous | Perfect |\n| --- | --- | --- | --- |\n| Present | I work | I'm working | I have worked |\n| Past | I worked | I was working | I had worked |", true),
          lesson("Present perfect vs past simple", 18, "الفرق الذي يحيّر الجميع.", "## Perfect vs Past\n\n- *I have lost my keys* — النتيجة الآن.\n- *I lost my keys yesterday* — وقت محدد انتهى."),
        ],
      },
      {
        title: "Module 2 — Advanced Uses",
        summary: "التام المستمر والمستقبل.",
        lessons: [
          lesson("Perfect continuous", 15, "مدة تستمر.", "## Example\n\n*I've been studying English for three years.*"),
          lesson("Future forms compared", 15, "will / going to / present continuous.", "## Future\n\n- قرار لحظي → **will**\n- نية مسبقة → **going to**\n- ترتيب مؤكد → **present continuous**"),
        ],
      },
    ],
  },
];

const reviewSeed = [
  { rating: 5, comment: "أول مرة أتكلم إنجليزي 10 دقايق متواصلة من غير ما أقف أترجم في دماغي. التمارين الصوتية هي الفرق الحقيقي." },
  { rating: 5, comment: "الشرح بالعربي ثم التطبيق بالإنجليزي خلاني أفهم القاعدة من أول مرة. أفضل من أي كورس جربته." },
  { rating: 4, comment: "محتوى ممتاز ومنظم، كنت أتمنى دروس أكثر عن النطق في النص الأخير." },
  { rating: 5, comment: "أخذت 7.0 في الآيلتس بعد 6.0. معايير التقييم لوحدها تستاهل سعر الكورس." },
  { rating: 5, comment: "استخدمت عبارات البريد الإلكتروني في شغلي من أول أسبوع. المدربة عملية جدًا." },
  { rating: 4, comment: "الدروس قصيرة وسهلة أتابعها مع بنتي كل يوم بعد المدرسة. التقارير الأسبوعية مفيدة." },
  { rating: 5, comment: "الـ spaced repetition غيرت طريقة مراجعتي تمامًا، بقيت أفتكر الكلمات بعد شهور." },
  { rating: 4, comment: "محتوى قوي جدًا، ينقصه شوية أمثلة صوتية إضافية." },
  { rating: 5, comment: "أفضل شرح للأزمنة سمعته. الخريطة في أول درس جمعت كل حاجة في دماغي." },
  { rating: 5, comment: "قدمت مقابلة في شركة أجنبية واستخدمت الـ STAR حرفيًا، واتقبلت." },
];

async function main() {
  const existing = await db.select({ id: categories.id }).from(categories).limit(1);
  if (existing.length > 0) {
    console.log("Seed data already present — skipping.");
    process.exit(0);
  }

  console.log("Seeding categories…");
  const categoryIds = new Map<string, number>();
  for (const [index, category] of categoriesSeed.entries()) {
    const result = await db.insert(categories).values({ ...category, position: index });
    categoryIds.set(category.slug, Number(result[0].insertId));
  }

  console.log("Seeding instructors…");
  const instructorIds = new Map<string, number>();
  const password = hashPassword("linkme123");
  for (const person of instructorsSeed) {
    const userResult = await db.insert(users).values({
      openId: `seed_${person.slug}`,
      name: person.name,
      email: person.email,
      passwordHash: hashPassword(randomBytes(32).toString("hex")),
      role: "instructor",
      headline: person.title,
      bio: person.bio,
      country: person.city,
    });
    const userId = Number(userResult[0].insertId);
    const result = await db.insert(instructors).values({
      userId,
      slug: person.slug,
      title: person.title,
      bio: person.bio,
      experienceYears: person.experienceYears,
      specialties: JSON.stringify(person.specialties),
      education: JSON.stringify(person.education),
      certifications: JSON.stringify(person.certifications),
      city: person.city,
      rating: person.rating,
      studentsCount: person.studentsCount,
      featured: person.featured,
    });
    instructorIds.set(person.slug, Number(result[0].insertId));
  }

  console.log("Seeding demo students…");
  const students = [
    { name: "مريم عبد الرحمن", email: "mariam@example.com", level: "B1" as const, goal: "محادثة العمل" },
    { name: "يوسف الشاذلي", email: "youssef@example.com", level: "B2" as const, goal: "الدراسة بالخارج" },
    { name: "هدى مصطفى", email: "hoda@example.com", level: "A2" as const, goal: "السفر" },
    { name: "كريم جمال", email: "karim@example.com", level: "C1" as const, goal: "آيلتس 8" },
    { name: "سلمى فؤاد", email: "salma@example.com", level: "B1" as const, goal: "ترقية وظيفية" },
    { name: "أحمد نصر", email: "ahmed.n@example.com", level: "A2" as const, goal: "إنجليزي الأطفال" },
  ];
  const studentIds: number[] = [];
  for (const [index, student] of students.entries()) {
    const result = await db.insert(users).values({
      openId: `seed_student_${index}`,
      name: student.name,
      email: student.email,
      passwordHash: password,
      role: "user",
      englishLevel: student.level,
      learningGoal: student.goal,
    });
    studentIds.push(Number(result[0].insertId));
  }

  const demoResult = await db.insert(users).values({
    openId: "seed_demo_student",
    name: "طالب تجريبي",
    email: "student@linkme.app",
    passwordHash: password,
    role: "user",
    englishLevel: "B1",
    learningGoal: "محادثة واثقة",
  });
  studentIds.unshift(Number(demoResult[0].insertId));

  console.log("Seeding courses…");
  let reviewIndex = 0;
  for (const course of coursesSeed) {
    const { modules: moduleSeeds, category, instructor, outcomes, requirements, audience, tags, ...courseFields } = course;
    const result = await db.insert(courses).values({
      ...courseFields,
      currency: "EGP",
      categoryId: categoryIds.get(category)!,
      instructorId: instructorIds.get(instructor)!,
      outcomes: JSON.stringify(outcomes),
      requirements: JSON.stringify(requirements),
      audience: JSON.stringify(audience),
      tags: JSON.stringify(tags),
    });
    const courseId = Number(result[0].insertId);

    for (const [moduleIndex, moduleSeed] of moduleSeeds.entries()) {
      const moduleResult = await db.insert(modules).values({
        courseId,
        title: moduleSeed.title,
        summary: moduleSeed.summary,
        position: moduleIndex,
      });
      const moduleId = Number(moduleResult[0].insertId);
      for (const [lessonIndex, item] of moduleSeed.lessons.entries()) {
        await db.insert(lessons).values({
          courseId,
          moduleId,
          title: item.title,
          description: item.description,
          content: item.content,
          durationMinutes: item.minutes,
          isPreview: false,
          position: moduleIndex * 10 + lessonIndex,
        });
      }
    }

    // Reviews: 2–4 per course, one per student.
    const count = 2 + (courseId % 3);
    let ratingSum = 0;
    for (let i = 0; i < count; i++) {
      const template = reviewSeed[reviewIndex % reviewSeed.length];
      const userId = studentIds[(reviewIndex + i) % studentIds.length];
      reviewIndex++;
      try {
        await db.insert(reviews).values({ courseId, userId, rating: template.rating, comment: template.comment });
        ratingSum += template.rating;
      } catch {
        // duplicate review for the same student — ignore
      }
    }
    const rated = await db
      .select({ total: sql<number>`coalesce(sum(${reviews.rating}), 0)`, n: sql<number>`count(*)` })
      .from(reviews)
      .where(eq(reviews.courseId, courseId));
    await db
      .update(courses)
      .set({ ratingSum: Number(rated[0]?.total ?? ratingSum), ratingCount: Number(rated[0]?.n ?? count) })
      .where(eq(courses.id, courseId));
  }

  console.log("Seeding plans…");
  await db.insert(plans).values([
    {
      slug: "pro",
      nameAr: "برو",
      tagline: "الأكثر اختيارًا للمتعلّم الجاد",
      priceMonthlyCents: 1900,
      priceYearlyCents: 14900,
      features: JSON.stringify([
        "وصول غير محدود لكل الكورسات",
        "شهادات إتمام لكل كورس",
        "تقييمات ومراجعات بعد الالتحاق",
        "تحديثات المحتوى مجانًا",
        "إلغاء في أي وقت",
      ]),
      highlighted: true,
      position: 1,
    },
    {
      slug: "intensive",
      nameAr: "مكثف",
      tagline: "متابعة فردية ومسار آيلتس",
      priceMonthlyCents: 4900,
      priceYearlyCents: 39900,
      features: JSON.stringify([
        "كل مزايا برو",
        "جلسة فردية شهرية 30 دقيقة",
        "خطة تعلّم أسبوعية مخصصة",
        "تصحيح كتابة أو تسجيل صوتي",
        "أولوية في الدعم",
      ]),
      position: 2,
    },
  ]);

  console.log("Seeding demo enrollments…");
  const demoUser = studentIds[0];
  const courseRows = await db.select({ id: courses.id, slug: courses.slug }).from(courses);
  const demoCourses = courseRows.slice(0, 2);
  for (const demoCourse of demoCourses) {
    await db.insert(enrollments).values({ userId: demoUser, courseId: demoCourse.id, source: "purchase" });
    const lessonRows = await db
      .select({ id: lessons.id })
      .from(lessons)
      .where(eq(lessons.courseId, demoCourse.id))
      .limit(3);
    for (const row of lessonRows) {
      await db
        .insert(lessonProgress)
        .values({ userId: demoUser, courseId: demoCourse.id, lessonId: row.id })
        .onDuplicateKeyUpdate({ set: { completedAt: new Date() } });
    }
  }

  console.log("Seed complete.");
  process.exit(0);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
