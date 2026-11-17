import "dotenv/config";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  courses,
  enrollments,
  lessonProgress,
  lessons,
  liveSessions,
  sessionAttendance,
  studentRatings,
  studentTasks,
  users,
} from "../drizzle/schema";
import { hashPassword } from "./auth";

const db = drizzle(process.env.DATABASE_URL!);

function daysFromNow(days: number, hour = 19) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, 0, 0, 0);
  return date;
}

async function upsertUser(
  email: string,
  name: string,
  role: "user",
  level?: "A1" | "A2" | "B1" | "B2" | "C1" | "C2"
) {
  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (existing) {
    await db
      .update(users)
      .set({ name, role, englishLevel: level ?? existing.englishLevel })
      .where(eq(users.id, existing.id));
    return existing.id;
  }
  const [created] = await db
    .insert(users)
    .values({
      openId: `local-${email}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name,
      email,
      passwordHash: hashPassword("linkme123"),
      role,
      englishLevel: level ?? null,
      country: "مصر",
      learningGoal: "أتكلم بثقة في الشغل",
    })
    .$returningId();
  return created.id;
}

async function main() {
  const [admin] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.role, "admin"))
    .limit(1);
  if (!admin)
    throw new Error(
      "Provision the owner privately before classroom seeding; no demo administrator is created."
    );
  const adminId = admin.id;
  const students = [
    {
      email: "mariam@linkme.app",
      name: "مريم عبد الرحمن",
      level: "B2" as const,
    },
    { email: "youssef@linkme.app", name: "يوسف الشريف", level: "B1" as const },
    { email: "hoda@linkme.app", name: "هدى مصطفى", level: "A2" as const },
    { email: "karim@linkme.app", name: "كريم جمال", level: "C1" as const },
    { email: "salma@linkme.app", name: "سلمى فتحي", level: "A1" as const },
  ];
  const studentIds: { id: number; level: string }[] = [];
  for (const student of students) {
    studentIds.push({
      id: await upsertUser(student.email, student.name, "user", student.level),
      level: student.level,
    });
  }

  const courseRows = await db.select().from(courses);
  const bySlug = (slug: string) =>
    courseRows.find(course => course.slug === slug);

  // Enrollments + some progress
  for (const [index, student] of studentIds.entries()) {
    for (const slug of [
      "english-grammar-foundations",
      "speak-english-confidently",
      "business-english-negotiations",
    ].slice(0, 1 + (index % 3))) {
      const course = bySlug(slug);
      if (!course) continue;
      await db
        .insert(enrollments)
        .values({
          userId: student.id,
          courseId: course.id,
          source: slug === "english-grammar-foundations" ? "free" : "purchase",
        })
        .onDuplicateKeyUpdate({ set: { courseId: course.id } });
      const courseLessons = await db
        .select()
        .from(lessons)
        .where(eq(lessons.courseId, course.id));
      const take = Math.min(
        courseLessons.length,
        2 + ((index * 3) % Math.max(courseLessons.length - 1, 1))
      );
      for (const lesson of courseLessons.slice(0, take)) {
        await db
          .insert(lessonProgress)
          .values({
            userId: student.id,
            courseId: course.id,
            lessonId: lesson.id,
          })
          .onDuplicateKeyUpdate({ set: { lessonId: lesson.id } });
      }
    }
  }

  // Live online sessions
  const sessionPlan = [
    {
      slug: "speak-english-confidently",
      title: "Small talk: ابدأ الحوار في أول دقيقتين",
      day: -7,
      status: "done" as const,
    },
    {
      slug: "business-english-negotiations",
      title: "إدارة اجتماع باللغة الإنجليزية",
      day: -3,
      status: "done" as const,
    },
    {
      slug: "english-grammar-foundations",
      title: "Present Perfect بدون لخبطة",
      day: 0,
      status: "live" as const,
    },
    {
      slug: "ielts-band-7-blueprint",
      title: "IELTS Writing Task 2: خطة 40 دقيقة",
      day: 2,
      status: "scheduled" as const,
    },
    {
      slug: "speak-english-confidently",
      title: "موقف في المطار والمقهى — تدريب صوتي مباشر",
      day: 4,
      status: "scheduled" as const,
    },
    {
      slug: "business-english-negotiations",
      title: "مفاوضة راتب: عبارات تحسم الموقف",
      day: 6,
      status: "scheduled" as const,
    },
  ];

  const sessionIds: number[] = [];
  for (const plan of sessionPlan) {
    const course = bySlug(plan.slug);
    if (!course) continue;
    const [existing] = await db
      .select()
      .from(liveSessions)
      .where(eq(liveSessions.title, plan.title))
      .limit(1);
    if (existing) {
      sessionIds.push(existing.id);
      continue;
    }
    const [created] = await db
      .insert(liveSessions)
      .values({
        courseId: course.id,
        title: plan.title,
        agenda:
          "جلسة أونلاين مباشرة على Zoom: تدريب عملي، أسئلة، وتقييم سريع لكل مشارك.",
        startsAt: daysFromNow(plan.day),
        durationMinutes: 60,
        meetingUrl: "https://meet.linkme.app/room/demo",
        status: plan.status,
      })
      .$returningId();
    sessionIds.push(created.id);
  }

  // Attendance for finished + live sessions
  const statuses = ["present", "present", "late", "absent", "present"] as const;
  for (const sessionId of sessionIds.slice(0, 3)) {
    for (const [index, student] of studentIds.entries()) {
      const status = statuses[(index + sessionId) % statuses.length];
      await db
        .insert(sessionAttendance)
        .values({ sessionId, userId: student.id, status, markedBy: adminId })
        .onDuplicateKeyUpdate({ set: { status } });
    }
  }

  // Ratings
  const ratingNotes = [
    "تحسن واضح في الطلاقة، محتاجة تشتغل أكتر على نطق الـ th.",
    "جرامر قوي، بس بيبطئ في الكلام — ندريبه على السرعة.",
    "التزام ممتاز بالجلسات، محتاجة مفردات أكتر.",
    "مستوى متقدم، جاهز لمسار الآيلتس.",
    "بدأ من الصفر واتحسن بشكل ملحوظ.",
  ];
  const existingRatings = await db.select().from(studentRatings);
  if (existingRatings.length === 0) {
    for (const [index, student] of studentIds.entries()) {
      await db.insert(studentRatings).values({
        userId: student.id,
        ratedBy: adminId,
        stars: [5, 4, 4, 5, 3][index],
        speaking: [4, 3, 3, 5, 2][index],
        listening: [5, 4, 4, 5, 3][index],
        grammar: [4, 4, 3, 5, 2][index],
        vocabulary: [4, 3, 4, 5, 2][index],
        note: ratingNotes[index],
      });
    }
  }

  // Tasks
  const existingTasks = await db.select().from(studentTasks);
  if (existingTasks.length === 0) {
    const taskPlan = [
      {
        title: "تسجيل صوتي دقيقتين: عرّف بنفسك",
        instructions:
          "سجّل نفسك وأنت بتعرّف عن شغلك، وابعت التسجيل في الجلسة الجاية.",
        status: "submitted" as const,
      },
      {
        title: "اكتب إيميل طلب أجازة بالإنجليزي",
        instructions: "استخدم 3 عبارات من درس البريد الإلكتروني.",
        status: "assigned" as const,
      },
      {
        title: "راجع 20 كلمة من مجموعة السفر",
        instructions: "استخدم فلاش كاردز المنصة، وبعدين اكتب جملة لكل 5 كلمات.",
        status: "in_progress" as const,
      },
      {
        title: "حل تمرين IELTS Writing Task 1",
        instructions: "جدول ورسوم بيانية — 20 دقيقة بدون مساعدة.",
        status: "assigned" as const,
      },
      {
        title: "اسمع بودكاست 10 دقايق ولخّصه",
        instructions: "اكتب 5 جمل بالإنجليزي عن اللي فهمته.",
        status: "reviewed" as const,
      },
    ];
    for (const [index, student] of studentIds.entries()) {
      await db.insert(studentTasks).values({
        userId: student.id,
        assignedBy: adminId,
        title: taskPlan[index].title,
        instructions: taskPlan[index].instructions,
        dueAt: daysFromNow(3 + index),
        status: taskPlan[index].status,
        score: taskPlan[index].status === "reviewed" ? 88 : null,
        feedback:
          taskPlan[index].status === "reviewed"
            ? "تلخيص واضح، اشتغل على الربط بين الأفكار."
            : null,
      });
    }
  }

  console.log("classroom demo ready:", {
    adminId,
    students: studentIds.length,
    sessions: sessionIds.length,
  });
  process.exit(0);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
