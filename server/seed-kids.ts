import "dotenv/config";
import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { courses, lessons, modules } from "../drizzle/schema";

const db = drizzle(process.env.DATABASE_URL!);
const EGP = (pounds: number) => pounds * 100;

type LessonSeed = { title: string; minutes?: number };
type ModuleSeed = { title: string; summary: string; lessons: LessonSeed[] };

async function replaceCurriculum(courseId: number, seeds: ModuleSeed[]) {
  const existing = await db.select().from(modules).where(eq(modules.courseId, courseId));
  for (const module of existing) {
    await db.delete(lessons).where(eq(lessons.moduleId, module.id));
  }
  await db.delete(modules).where(eq(modules.courseId, courseId));
  for (const [index, seed] of seeds.entries()) {
    const [created] = await db
      .insert(modules)
      .values({ courseId, title: seed.title, summary: seed.summary, position: index + 1 })
      .$returningId();
    for (const [lessonIndex, lesson] of seed.lessons.entries()) {
      await db.insert(lessons).values({
        courseId,
        moduleId: created.id,
        title: lesson.title,
        description: null,
        content: null,
        durationMinutes: lesson.minutes ?? 14,
        isPreview: false,
        position: lessonIndex + 1,
      });
    }
  }
}

type Grade = { title: string; stage: string; units: [string, string]; extra: string[] };

/** Every school year is its own module, from KG1 up to 3rd preparatory. */
const GRADES: Grade[] = [
  { title: "منهج كي جي 1 (KG1)", stage: "رياض الأطفال", units: ["الحروف من A لـ M", "الأرقام والألوان"], extra: ["أغاني وأنشطة تفاعلية", "حل كتاب الأنشطة", "مراجعة الأسبوع"] },
  { title: "منهج كي جي 2 (KG2)", stage: "رياض الأطفال", units: ["أصوات الحروف (Phonics)", "عيلتي وأصدقائي"], extra: ["كلماتي الأولى", "حل كتاب الأنشطة", "مراجعة الأسبوع"] },
  { title: "منهج الصف الأول الابتدائي", stage: "المرحلة الابتدائية", units: ["Unit 1: My School", "Unit 2: My Family"], extra: ["Unit 3: My Body", "حل تمارين كتاب المدرسة", "حل الكتاب الخارجي", "مراجعة ونماذج امتحانات"] },
  { title: "منهج الصف الثاني الابتدائي", stage: "المرحلة الابتدائية", units: ["Unit 1: My Day", "Unit 2: Food and Drink"], extra: ["Unit 3: Animals", "حل تمارين كتاب المدرسة", "حل الكتاب الخارجي", "مراجعة ونماذج امتحانات"] },
  { title: "منهج الصف الثالث الابتدائي", stage: "المرحلة الابتدائية", units: ["Unit 1: My Home", "Unit 2: Clothes"], extra: ["Unit 3: Jobs", "حل تمارين كتاب المدرسة", "حل الكتاب الخارجي", "مراجعة ونماذج امتحانات"] },
  { title: "منهج الصف الرابع الابتدائي", stage: "المرحلة الابتدائية", units: ["Unit 1: Free Time", "Unit 2: My City"], extra: ["Unit 3: Health and Food", "حل تمارين كتاب المدرسة", "حل الكتاب الخارجي", "مراجعة ونماذج امتحانات"] },
  { title: "منهج الصف الخامس الابتدائي", stage: "المرحلة الابتدائية", units: ["Unit 1: Travel", "Unit 2: Our Environment"], extra: ["Unit 3: Technology", "حل تمارين كتاب المدرسة", "حل الكتاب الخارجي", "مراجعة ونماذج امتحانات"] },
  { title: "منهج الصف السادس الابتدائي", stage: "المرحلة الابتدائية", units: ["Unit 1: School Life", "Unit 2: Future Plans"], extra: ["Unit 3: Healthy Habits", "حل تمارين كتاب المدرسة", "حل الكتاب الخارجي", "مراجعة ونماذج امتحانات"] },
  { title: "منهج الصف الأول الإعدادي", stage: "المرحلة الإعدادية", units: ["Unit 1: Friends and Feelings", "Unit 2: Culture and Festivals"], extra: ["Unit 3: Science and Discovery", "حل تمارين كتاب المدرسة", "حل الكتاب الخارجي", "مراجعة ونماذج امتحانات"] },
  { title: "منهج الصف الثاني الإعدادي", stage: "المرحلة الإعدادية", units: ["Unit 1: Work and Jobs", "Unit 2: Media and News"], extra: ["Unit 3: Community", "حل تمارين كتاب المدرسة", "حل الكتاب الخارجي", "مراجعة ونماذج امتحانات"] },
  { title: "منهج الصف الثالث الإعدادي", stage: "المرحلة الإعدادية", units: ["Unit 1: Ambitions", "Unit 2: Global Issues"], extra: ["Unit 3: Revision", "حل تمارين كتاب المدرسة", "حل الكتاب الخارجي", "مراجعة ونماذج امتحانات نهاية العام"] },
];

const kidsModules: ModuleSeed[] = GRADES.map(grade => ({
  title: grade.title,
  summary: `${grade.stage} · فيديوهات أنيميشن لكل درس + حل كامل للكتاب الخارجي والمراجعة النهائية.`,
  lessons: [
    { title: `${grade.title} — ${grade.units[0]}`, minutes: 18 },
    { title: `${grade.title} — ${grade.units[1]}`, minutes: 18 },
    ...grade.extra.map(title => ({ title: `${grade.title} — ${title}`, minutes: 16 })),
  ],
}));

const privateModules: ModuleSeed[] = [
  {
    title: "سيشن 1 — تأسيس القراءة والكلمات",
    summary: "نبدأ من نقطة الطفل: أصوات، كلمات شائعة، وقراءة جمل قصيرة بثقة.",
    lessons: [
      { title: "الحروف والأصوات اللي بيغلط فيها الطفل" },
      { title: "الكلمات الشائعة في المنهج" },
      { title: "قراءة جمل قصيرة بصوت واضح" },
    ],
  },
  {
    title: "سيشن 2 — حل الواجبات والكتب الخارجية",
    summary: "بنحل واجب المدرسة صفحة بصفحة، والطفل هو اللي بيكتب ويحل.",
    lessons: [
      { title: "واجب اليوم خطوة بخطوة" },
      { title: "صفحة من الكتاب الخارجي مع الشرح" },
      { title: "تصحيح الأخطاء مع الطفل" },
    ],
  },
  {
    title: "سيشن 3 — محادثة ونطق",
    summary: "ألعاب كلمات وحوار قصير في موقف يومي، مع تصحيح النطق.",
    lessons: [
      { title: "النطق الصحيح للحروف والمقاطع" },
      { title: "حوار قصير: في المدرسة / في البيت" },
      { title: "ألعاب كلمات ومفردات" },
    ],
  },
  {
    title: "سيشن 4 — مراجعة قبل الامتحانات",
    summary: "مراجعة الوحدة ونموذج امتحان مع الشرح وخطة مراجعة للأسبوع.",
    lessons: [
      { title: "مراجعة الوحدة المطلوبة" },
      { title: "نموذج امتحان مع الشرح" },
      { title: "خطة مراجعة أسبوعية لولي الأمر" },
    ],
  },
];

async function main() {
  // 1. Kids Interactive: every grade as its own module, no free previews.
  const [kids] = await db.select().from(courses).where(eq(courses.slug, "english-for-kids-adventure")).limit(1);
  if (!kids) throw new Error("kids course missing");
  await db
    .update(courses)
    .set({
      title: "Kids Interactive — English for School",
      titleAr: "إنجليزي الأطفال التفاعلي — من كي جي لثالثة إعدادي",
      subtitle: "منهج المدرسة كامل: كل سنة دراسية لوحدها بفيديوهات أنيميشن وحل كل الكتب الخارجية — 1000 جنيه للترم.",
      description:
        "برنامج إنجليزي الأطفال التفاعلي بيغطي المنهج الدراسي كامل من كي جي 1 لحد تالتة إعدادي، وكل سنة دراسية ليها مسار فيديوهات مستقل: فيديوهات أنيميشن لكل درس، حل كامل للكتاب المدرسي والكتب الخارجية، مراجعات ونماذج امتحانات. التسعير: 1000 جنيه للترم للفيديوهات المسجلة، و200 جنيه للسيشن الخاصة الفردية.",
      coverImage: "/img/kids-hero.webp",
      priceCents: EGP(1000),
      currency: "EGP",
      featured: true,
      outcomes: JSON.stringify([
        "تغطية منهج المدرسة كامل من كي جي 1 لثالثة إعدادي — كل سنة لوحدها",
        "فيديوهات أنيميشن لكل درس تحبس انتباه الطفل",
        "حل كل الكتب الخارجية والمراجعات ونماذج الامتحانات",
        "سيشن خاصة فردية بـ 200 جنيه لما تحتاج",
      ]),
      requirements: JSON.stringify(["الكتاب الخارجي للمادة", "جهاز لمشاهدة الفيديوهات"]),
      audience: JSON.stringify(["أطفال من 4 لـ 15 سنة", "أولياء الأمور اللي عايزين متابعة منهج المدرسة"]),
      tags: JSON.stringify(["أطفال", "منهج المدرسة", "أنيميشن", "كل الصفوف"]),
    })
    .where(eq(courses.id, kids.id));
  await replaceCurriculum(kids.id, kidsModules);

  // 2. Private session product with its own curriculum and photo.
  const [privateCourse] = await db.select().from(courses).where(eq(courses.slug, "kids-private-session")).limit(1);
  const privateValues = {
    title: "Kids Private Session",
    titleAr: "سيشن خاصة للأطفال",
    subtitle: "جلسة فردية 60 دقيقة على المنهج أو الواجب — 200 جنيه للسيشن.",
    description:
      "سيشن فردية للأطفال مع مدرّس متخصص: تقوية درس معين، حل واجب أو كتاب خارجي، تدريب نطق ومحادثة، أو مراجعة قبل الامتحان. 200 جنيه للسيشن الواحدة، وبتتحدد مع المدرّس على الواتساب.",
    coverImage: "/img/kids-session.webp",
    priceCents: EGP(200),
    currency: "EGP",
    durationHours: 1,
    outcomes: JSON.stringify([
      "متابعة فردية لدرس المدرسة أو الكتاب الخارجي",
      "تصحيح النطق خطوة بخطوة",
      "مراجعة قبل الامتحانات بخطة واضحة لولي الأمر",
    ]),
    requirements: JSON.stringify(["الكتاب أو الدرس المطلوب", "جهاز متصل بالإنترنت"]),
    audience: JSON.stringify(["أطفال في أي مرحلة دراسية من KG لـ 3 إعدادي"]),
    tags: JSON.stringify(["أطفال", "سيشن خاصة"]),
  };
  if (privateCourse) {
    await db.update(courses).set(privateValues).where(eq(courses.id, privateCourse.id));
    await replaceCurriculum(privateCourse.id, privateModules);
  }

  // 3. No free part anywhere: every lesson is paid-only, and the free grammar
  // course becomes a regular paid course.
  await db.update(lessons).set({ isPreview: false }).where(eq(lessons.isPreview, true));
  await db
    .update(courses)
    .set({ priceCents: EGP(900), currency: "EGP" })
    .where(sql`${courses.priceCents} = 0`);

  console.log(`kids curriculum updated: ${GRADES.length} grades, ${privateModules.length} private sessions`);
  process.exit(0);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
