import "dotenv/config";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { categories, courses, lessons, modules, plans } from "../drizzle/schema";

const db = drizzle(process.env.DATABASE_URL!);

const IMG = {
  group: "/img/hero.webp",
  cafe: "/img/cafe.webp",
  online: "/img/online.webp",
  business: "/img/business.webp",
  oneOnOne: "/img/oneonone.webp",
  kids: "/img/kids.webp",
  travel: "/img/travel.webp",
  ielts: "/img/ielts.webp",
  mall: "/img/mall.webp",
  pronunciation: "/img/pronunciation.webp",
  writing: "/img/writing.webp",
};

const EGP = (pounds: number) => pounds * 100;

type LessonSeed = { title: string; minutes?: number; preview?: boolean; body?: string };
type ModuleSeed = { title: string; summary: string; lessons: LessonSeed[] };

async function replaceCurriculum(courseId: number, moduleSeeds: ModuleSeed[]) {
  const existing = await db.select().from(modules).where(eq(modules.courseId, courseId));
  for (const module of existing) {
    await db.delete(lessons).where(eq(lessons.moduleId, module.id));
  }
  await db.delete(modules).where(eq(modules.courseId, courseId));
  for (const [index, moduleSeed] of moduleSeeds.entries()) {
    const [created] = await db
      .insert(modules)
      .values({ courseId, title: moduleSeed.title, summary: moduleSeed.summary, position: index + 1 })
      .$returningId();
    for (const [lessonIndex, lesson] of moduleSeed.lessons.entries()) {
      await db.insert(lessons).values({
        courseId,
        moduleId: created.id,
        title: lesson.title,
        description: lesson.body ?? null,
        content: lesson.body ?? null,
        durationMinutes: lesson.minutes ?? 14,
        isPreview: lesson.preview ?? false,
        position: lessonIndex + 1,
      });
    }
  }
}

const tenseModules: ModuleSeed[] = [
  {
    title: "المستوى 1 — المضارع البسيط (Present Simple)",
    summary: "الروتين والعادات والحقائق: التكوين، النفي، السؤال، وأخطاء المتعلمين الشائعة.",
    lessons: [
      { title: "إمتى بنستخدم المضارع البسيط؟", preview: true },
      { title: "s / es / ies — قاعدة الإضافة الصح" },
      { title: "النفي والسؤال: do / does" },
      { title: "تدريب: 20 جملة عن روتينك اليومي" },
    ],
  },
  {
    title: "المستوى 2 — المضارع المستمر (Present Continuous)",
    summary: "اللي بيحصل دلوقتي، الخطط المستقبلية القريبة، وأفعال الحالة.",
    lessons: [
      { title: "am / is / are + V-ing" },
      { title: "الفرق بين Simple و Continuous في الموقف الواحد" },
      { title: "أفعال ما بتاخدش ing (stative verbs)" },
      { title: "تدريب: وصف مشهد قدامك دلوقتي" },
    ],
  },
  {
    title: "المستوى 3 — المضارع التام (Present Perfect)",
    summary: "الخبرة، النتيجة الحالية، since و for، والفرق بينه وبين Past Simple.",
    lessons: [
      { title: "have / has + past participle" },
      { title: "since و for و just و already و yet" },
      { title: "Present Perfect ولا Past Simple؟" },
      { title: "تدريب: تكلم عن خبراتك في 10 جمل" },
    ],
  },
  {
    title: "المستوى 4 — المضارع التام المستمر",
    summary: "حاجة بدأت ومستمرة لحد دلوقتي، ومدتها.",
    lessons: [
      { title: "have been + V-ing" },
      { title: "الفرق بين Present Perfect و Perfect Continuous" },
      { title: "تدريب صوتي: من إمتى بتتعلم إنجليزي؟" },
    ],
  },
  {
    title: "المستوى 5 — الماضي البسيط (Past Simple)",
    summary: "أحداث خلصت في وقت معروف: الأفعال المنتظمة والشاذة.",
    lessons: [
      { title: "الأفعال المنتظمة والشاذة" },
      { title: "did / didn’t والزمن المحدد" },
      { title: "تدريب: احكي عن آخر إجازة" },
    ],
  },
  {
    title: "المستوى 6 — الماضي المستمر والماضي التام",
    summary: "الخلفية والقصة: was/were + ing، و had + p.p.",
    lessons: [
      { title: "Past Continuous: الحدث اللي كان شغّال" },
      { title: "when / while بين الماضي البسيط والمستمر" },
      { title: "Past Perfect: الحدث الأسبق" },
      { title: "تدريب: اكتب قصة 150 كلمة" },
    ],
  },
  {
    title: "المستوى 7 — المستقبل بكل أشكاله",
    summary: "will / going to / present continuous للخطط والقرارات.",
    lessons: [
      { title: "will مقابل going to" },
      { title: "المستقبل بالحاضر: مواعيد وخطط" },
      { title: "تدريب: خطتك للشهر الجاي" },
    ],
  },
  {
    title: "المستوى 8 — الأفعال الناقصة (Modals)",
    summary: "can / must / should / might — القدرة، الالتزام، النصيحة، والاحتمال.",
    lessons: [
      { title: "can / could / be able to" },
      { title: "must / have to / should" },
      { title: "might / may / must — درجات الاحتمال" },
    ],
  },
  {
    title: "المستوى 9 — الجمل الشرطية (Conditionals)",
    summary: "Zero / First / Second / Third + Mixed، وأفكار الـ if الحقيقية والافتراضية.",
    lessons: [
      { title: "Zero و First Conditional" },
      { title: "Second Conditional: لو أنا كنت مكانك" },
      { title: "Third Conditional والندم" },
      { title: "تدريب: اكتب 10 جمل شرطية عن حياتك" },
    ],
  },
  {
    title: "المستوى 10 — المبني للمجهول والكلام المنقول",
    summary: "Passive Voice و Reported Speech في السياق الأكاديمي والمهني.",
    lessons: [
      { title: "Passive Voice في كل الأزمنة" },
      { title: "Reported Speech: تغيير الأزمنة والضمائر" },
      { title: "تدريب نهائي شامل + اختبار" },
    ],
  },
];

const travelModules: ModuleSeed[] = [
  {
    title: "في المول (At the Mall)",
    summary: "محاكاة موقف حقيقي: تسأل عن محل، تجرب حاجة، تسأل عن السعر والخصم، وترجع منتج.",
    lessons: [
      { title: "عبارات السؤال عن الأقسام والمحلات", preview: true },
      { title: "تجربة المنتج والاستفسار عن المقاسات" },
      { title: "الدفع، الخصم، والاسترجاع" },
      { title: "محاكاة حوار كامل في المول" },
    ],
  },
  {
    title: "في المطعم (At the Restaurant)",
    summary: "حجز ترابيزة، تطلب، تسأل عن مكونات الأكل، وتتعامل مع أي مشكلة في الطلب.",
    lessons: [
      { title: "حجز ترابيزة والعبارات الأساسية" },
      { title: "الطلب من المنيو والحساسية الغذائية" },
      { title: "المشاكل: الطلب متأخر أو غلط" },
      { title: "محاكاة: عشاء كامل بالإنجليزي" },
    ],
  },
  {
    title: "حجز الفندق (Hotel Booking)",
    summary: "حجز، تسجيل دخول وخروج، خدمات الغرفة، والشكاوى.",
    lessons: [
      { title: "الحجز بالإيميل والتليفون" },
      { title: "Check-in / Check-out" },
      { title: "خدمات الغرفة والمشاكل" },
    ],
  },
  {
    title: "في المطار (At the Airport)",
    summary: "تسجيل الوصول، الأمن، البوابات، والتحويلات.",
    lessons: [
      { title: "Check-in وشنطة اليد" },
      { title: "الأمن والبوابة والتأخير" },
      { title: "محاكاة: رحلة كاملة من القاهرة للندن" },
    ],
  },
  {
    title: "المواصلات والسوق الشعبي",
    summary: "التاكسي والمترو والمساومة، وعبارات الطوارئ.",
    lessons: [
      { title: "التاكسي والمترو والاتجاهات" },
      { title: "السوق والمساومة" },
      { title: "مواقف الطوارئ والفقدان" },
    ],
  },
];

const kidsModules: ModuleSeed[] = [
  ...["KG1", "KG2", "الصف الأول الابتدائي", "الصف الثاني الابتدائي", "الصف الثالث الابتدائي", "الصف الرابع الابتدائي", "الصف الخامس الابتدائي", "الصف السادس الابتدائي", "الصف الأول الإعدادي", "الصف الثاني الإعدادي", "الصف الثالث الإعدادي"].map(grade => ({
    title: `منهج ${grade}`,
    summary: "فيديوهات أنيميشن لكل درس + حل كامل للكتاب الخارجي والمراجعة النهائية.",
    lessons: [
      { title: `${grade}: Unit 1 — فيديو أنيميشن` },
      { title: `${grade}: Unit 2 — فيديو أنيميشن` },
      { title: `${grade}: حل تمارين الكتاب الخارجي` },
      { title: `${grade}: مراجعة ونماذج امتحانات` },
    ],
  })),
];

const pathLevels = [
  { n: 1, name: "Pre-Starter A", level: "beginner" as const, focus: "الحروف، الأصوات، والكلمات الأولى" },
  { n: 2, name: "Pre-Starter B", level: "beginner" as const, focus: "جمل قصيرة وتعارف وترحيب" },
  { n: 3, name: "Pre-Starter C", level: "beginner" as const, focus: "الروتين اليومي والأسئلة الأساسية" },
  { n: 4, name: "Core 1 (A1)", level: "beginner" as const, focus: "أساسيات المضارع والمفردات اليومية" },
  { n: 5, name: "Core 2 (A1+)", level: "beginner" as const, focus: "الماضي البسيط والمواقف اليومية" },
  { n: 6, name: "Core 3 (A2)", level: "intermediate" as const, focus: "التعبير عن الرأي والحياة الاجتماعية" },
  { n: 7, name: "Core 4 (A2+)", level: "intermediate" as const, focus: "التخطيط للمستقبل والسفر" },
  { n: 8, name: "Core 5 (B1)", level: "intermediate" as const, focus: "الحديث عن التجارب والعمل" },
  { n: 9, name: "Core 6 (B1+)", level: "intermediate" as const, focus: "الطلاقة، الربط، والمحادثة الطويلة" },
  { n: 10, name: "Conversation Pro 1", level: "advanced" as const, focus: "محادثات مفتوحة عن الرأي والجدل الهادي" },
  { n: 11, name: "Conversation Pro 2", level: "advanced" as const, focus: "مقابلات عمل، عروض، وإقناع" },
  { n: 12, name: "Conversation Pro 3", level: "advanced" as const, focus: "إنجليزية احترافية وطلاقة شبه أصلية" },
];

async function main() {
  // 1. Category for the full path
  const [pathCategory] = await db
    .insert(categories)
    .values({ slug: "path", nameAr: "الاستقلال اللغوي", nameEn: "Independence Path", description: "مسار متكامل من 12 مستوى من الصفر لـ B1", position: 9 })
    .onDuplicateKeyUpdate({ set: { nameAr: "الاستقلال اللغوي" } })
    .$returningId()
    .catch(async () => {
      const [existing] = await db.select().from(categories).where(eq(categories.slug, "path")).limit(1);
      return [existing];
    });

  // 2. Twelve path levels
  const pathImages = [IMG.online, IMG.cafe, IMG.group, IMG.oneOnOne, IMG.writing, IMG.mall];
  for (const item of pathLevels) {
    const slug = `independence-level-${item.n}`;
    const values = {
      slug,
      title: `English Independence — Level ${item.n}: ${item.name}`,
      titleAr: `مسار الاستقلال اللغوي — المستوى ${item.n}: ${item.name}`,
      subtitle: `${item.focus} — المستوى ${item.n} من 12`,
      description: `المستوى ${item.n} من مسار الاستقلال اللغوي: 12 مستوى من الصفر لحد B1. التركيز هنا على ${item.focus}، بمحاضرات أونلاين مباشرة وتمارين محادثة وتقييم مستمر. السعر 1000 جنيه للمستوى.`,
      level: item.level,
      categoryId: pathCategory.id,
      instructorId: 2,
      priceCents: EGP(1000),
      currency: "EGP",
      durationHours: 24,
      coverImage: pathImages[item.n % pathImages.length],
      accent: "iris",
      featured: item.n === 1,
      outcomes: JSON.stringify([
        `${item.focus} بشكل عملي ومحادثة حقيقية`,
        "تقييم مستمر ومتابعة من المدرّس بعد كل مستوى",
        "الاستعداد للمستوى اللي بعده بخطة واضحة",
      ]),
      requirements: JSON.stringify(["مفيش أي متطلبات سابقة في المستويات الأولى", "مذاكرة 20 دقيقة يوميًا كفاية"]),
      audience: JSON.stringify(["مبتدئ من الصفر", "حد عنده أساس ضعيف وعايز نظام واضح"]),
      tags: JSON.stringify(["مسار", `مستوى ${item.n}`, item.name]),
    };
    const [existing] = await db.select().from(courses).where(eq(courses.slug, slug)).limit(1);
    if (existing) {
      await db.update(courses).set(values).where(eq(courses.id, existing.id));
    } else {
      await db.insert(courses).values(values);
    }
  }

  // 3. Update existing specialised courses
  const updates: Record<string, { priceCents: number; coverImage: string; titleAr?: string; subtitle?: string }> = {
    "speak-english-confidently": { priceCents: EGP(1200), coverImage: IMG.cafe },
    "ielts-band-7-blueprint": { priceCents: EGP(2500), coverImage: IMG.ielts },
    "english-grammar-foundations": { priceCents: 0, coverImage: IMG.online },
    "business-english-negotiations": { priceCents: EGP(1800), coverImage: IMG.business },
    "pronunciation-masterclass": { priceCents: EGP(1200), coverImage: IMG.pronunciation },
    "vocabulary-power-2000": { priceCents: EGP(900), coverImage: IMG.mall },
    "academic-writing-essentials": { priceCents: EGP(1500), coverImage: IMG.writing },
    "ielts-speaking-intensive": { priceCents: EGP(1800), coverImage: IMG.oneOnOne },
    "job-interview-english": { priceCents: EGP(1000), coverImage: IMG.business },
    "everyday-english-travel": { priceCents: EGP(900), coverImage: IMG.travel },
    "master-english-tenses": {
      priceCents: EGP(1000),
      coverImage: IMG.writing,
      titleAr: "إتقان القواعد: من المضارع البسيط للجمل الشرطية",
      subtitle: "مسار تصاعدي في 10 مستويات: كل زمن وقاعدة بجلسة مستقلة، من الأبسط للأصعب.",
    },
  };
  for (const [slug, patch] of Object.entries(updates)) {
    await db
      .update(courses)
      .set({ ...patch, currency: "EGP" })
      .where(eq(courses.slug, slug));
  }

  // 4. Kids Interactive
  const kidsValues = {
    title: "Kids Interactive — English for School",
    titleAr: "إنجليزي الأطفال التفاعلي — من كي جي لثالثة إعدادي",
    subtitle: "منهج المدرسة كامل بفيديوهات أنيميشن وحل كل الكتب الخارجية — 1000 جنيه للترم.",
    description:
      "برنامج إنجليزي الأطفال التفاعلي بيغطي المنهج الدراسي كامل من كي جي لحد ثالثة إعدادي: فيديوهات أنيميشن لكل درس، حل كامل للكتب الخارجية، مراجعات ونماذج امتحانات. التسعير: 1000 جنيه للترم للفيديوهات المسجلة، و200 جنيه للسيشن الخاصة الفردية.",
    level: "beginner" as const,
    priceCents: EGP(1000),
    currency: "EGP",
    coverImage: IMG.kids,
    featured: true,
    outcomes: JSON.stringify([
      "تغطية منهج المدرسة كامل من كي جي لثالثة إعدادي",
      "فيديوهات أنيميشن لكل درس تحبس انتباه الطفل",
      "حل كل الكتب الخارجية والمراجعات",
      "سيشن خاصة فردية بـ 200 جنيه لما تحتاج",
    ]),
    requirements: JSON.stringify(["الكتاب الخارجي للمادة", "جهاز لمشاهدة الفيديوهات"]),
    audience: JSON.stringify(["أطفال من 5 لـ 15 سنة", "أولياء الأمور اللي عايزين متابعة منهج المدرسة"]),
    tags: JSON.stringify(["أطفال", "منهج المدرسة", "أنيميشن"]),
  };
  const [kidsExisting] = await db.select().from(courses).where(eq(courses.slug, "english-for-kids-adventure")).limit(1);
  if (kidsExisting) await db.update(courses).set(kidsValues).where(eq(courses.id, kidsExisting.id));
  await replaceCurriculum(kidsExisting.id, kidsModules);

  // Kids private session product
  const privateValues = {
    slug: "kids-private-session",
    title: "Kids Private Session",
    titleAr: "سيشن خاصة للأطفال",
    subtitle: "جلسة فردية 60 دقيقة على المنهج أو الواجب — 200 جنيه للسيشن.",
    description: "سيشن فردية للأطفال مع مدرّس متخصص: تقوية درس معين، حل واجب، أو تدريب نطق. 200 جنيه للسيشن الواحدة.",
    level: "beginner" as const,
    categoryId: 8,
    instructorId: 5,
    priceCents: EGP(200),
    currency: "EGP",
    durationHours: 1,
    coverImage: IMG.oneOnOne,
    featured: false,
    outcomes: JSON.stringify(["متابعة فردية لدرس المدرسة", "تصحيح النطق خطوة بخطوة"]),
    requirements: JSON.stringify(["الكتاب أو الدرس المطلوب"]),
    audience: JSON.stringify(["أطفال في أي مرحلة دراسية"]),
    tags: JSON.stringify(["أطفال", "سيشن خاصة"]),
  };
  const [privateExisting] = await db.select().from(courses).where(eq(courses.slug, "kids-private-session")).limit(1);
  if (privateExisting) await db.update(courses).set(privateValues).where(eq(courses.id, privateExisting.id));
  else await db.insert(courses).values(privateValues);

  // 5. Progressive curricula
  const [tenses] = await db.select().from(courses).where(eq(courses.slug, "master-english-tenses")).limit(1);
  await replaceCurriculum(tenses.id, tenseModules);
  const [travel] = await db.select().from(courses).where(eq(courses.slug, "everyday-english-travel")).limit(1);
  await replaceCurriculum(travel.id, travelModules);

  // 6. Plans in EGP
  const monthly = { pro: EGP(950), intensive: EGP(2450) };
  await db.update(plans).set({ priceMonthlyCents: monthly.pro, priceYearlyCents: Math.round(monthly.pro * 12 * 0.65) }).where(eq(plans.slug, "pro"));
  await db.update(plans).set({ priceMonthlyCents: monthly.intensive, priceYearlyCents: Math.round(monthly.intensive * 12 * 0.65) }).where(eq(plans.slug, "intensive"));

  console.log("curriculum updated");
  process.exit(0);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
