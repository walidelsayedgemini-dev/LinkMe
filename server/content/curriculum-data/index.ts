import { speakingLessons } from "./speaking";
import { grammarLessons } from "./grammar";
import { businessLessons } from "./business";
import { ieltsLessons } from "./ielts";
import { pronunciationLessons } from "./pronunciation";
import { skillsLessons } from "./skills";
import { kidsLessons } from "./kids";

const ALL_CURATED_LESSONS: Record<string, string> = {
  ...speakingLessons,
  ...grammarLessons,
  ...businessLessons,
  ...ieltsLessons,
  ...pronunciationLessons,
  ...skillsLessons,
  ...kidsLessons,
};

/**
 * Intelligent Lesson Content Provider
 * Returns an exhaustive, professionally structured Markdown lesson tutorial for any lesson.
 */
export function getLessonDetailedExplanation(
  courseSlug: string,
  lessonTitle: string,
  position = 1
): string {
  const cleanTitle = lessonTitle.trim();

  // 1. Exact match in curated lessons
  if (ALL_CURATED_LESSONS[cleanTitle]) {
    return ALL_CURATED_LESSONS[cleanTitle];
  }

  // 2. Partial / substring match
  for (const [key, content] of Object.entries(ALL_CURATED_LESSONS)) {
    if (
      cleanTitle.toLowerCase().includes(key.toLowerCase()) ||
      key.toLowerCase().includes(cleanTitle.toLowerCase())
    ) {
      return content;
    }
  }

  // 3. Domain-specific comprehensive generators
  if (courseSlug.includes("tense") || courseSlug.includes("grammar")) {
    return generateGrammarLesson(cleanTitle, position);
  }

  if (courseSlug.includes("travel") || courseSlug.includes("conversation") || courseSlug.includes("speak")) {
    return generateConversationLesson(cleanTitle, position);
  }

  if (courseSlug.includes("business") || courseSlug.includes("interview")) {
    return generateBusinessLesson(cleanTitle, position);
  }

  if (courseSlug.includes("ielts")) {
    return generateIeltsLesson(cleanTitle, position);
  }

  if (courseSlug.includes("kids")) {
    return generateKidsLesson(cleanTitle, position);
  }

  if (courseSlug.includes("independence")) {
    return generateIndependenceLesson(courseSlug, cleanTitle, position);
  }

  // Default universal high-value template
  return generateUniversalLesson(cleanTitle, position);
}

function generateGrammarLesson(title: string, pos: number): string {
  return `## 🎯 الهدف من الدرس (Lesson Objective)
في هذا الدرس رقم ${pos} (${title})، هتفهم القاعدة اللغوية بشكل عملي بدون حفظ جاف، وتعرف متى يستخدمها المتحدث الأصلي للتعبير عن أفكاره بدقة.

---

## 💡 القاعدة الأساسية بالعربي (The Core Rule)
* **الفكرة الجوهرية:** كل قاعدة في الإنجليزية وُضعت لحل مشكلة توقيت أو معنى محدد.
* ركّز على **السياق (*Context*)** وليس مجرد التكوين النظري.
* تأكد من ضبط الأفعال المساعدة (*Auxiliary Verbs*) وتوافق الفاعل مع الفعل (*Subject-Verb Agreement*).

### 📌 القاعدة الذهبية
> **افهم المعنى المقصود أولاً ثم اختر الزمن المناسب، وتجنب الترجمة الحرفية من العربية إلى الإنجليزية.**

---

## 💬 أمثلة وتطبيقات في جمل واقعية (Real-World Examples)

| الجملة بالإنجليزي (English) | النطق التقريبي والترجمة (Arabic & Pronunciation) | الملاحظة التعليمية |
| :--- | :--- | :--- |
| **"I usually take the train, but today I am driving."** | *آي يوجوالي تيك ذا ترين...* (عادة أركب القطار، لكن اليوم أقود سيارتي) | تباين بين العادة الدائمة والحدث المؤقت |
| **"She has already finished her assignment."** | *شي هاز أولريدي فينيشد...* (هي أنهت واجبها بالفعل) | حدث ماضٍ وله أثر مباشر في الحاضر |
| **"If you need any clarification, feel free to ask."** | *إف يو نيد إني كلاريفيكيشن...* (لو احتجت أي توضيح، تفضل بالسؤال) | أسلوب شرطي مهذب وراقي |

---

## ⚠️ أخطاء شائعة جداً بيقع فيها الطلاب (Common Traps)
* ❌ **الخطأ:** نسيان الفعل المساعد أو خلط الأزمنة في جملة واحدة.
* ✅ **الأصح:** الحفاظ على اتساق الزمن في سياق الحديث.
* 💡 **السبب:** اللغة الإنجليزية تتطلب تسلسلاً زمنياً صارماً (*Tense Consistency*).

---

## 🚀 التحدي التطبيقي للمحادثة (Voice & Practice Drill)
1. افتح أداة **التدريب الصوتي (Voice Practice)** بالأسفل.
2. كوّن جملتين من واقع حياتك اليومية تطبق فيهما قاعدة هذا الدرس (${title}).
3. سجّل صوتك واستمع للطلاقة والنطق السليم، وسجّل تقييم الذكاء الاصطناعي لتحسين أدائك.`;
}

function generateConversationLesson(title: string, pos: number): string {
  return `## 🎯 الهدف من الدرس (Conversation Mastery)
إتقان مهارة: **${title}** في المواقف اليومية الحقيقية (كافيه، مطار، تاكسي، تسوق) والتحدث بطلاقة وثقة دون خوف من ارتكاب الأخطاء.

---

## 💡 كسر حاجز الخوف والقاعدة الذهبية
* المتحدثون الأصليون لا يهتمون بنسبة القواعد 100% في الشارع؛ الأهم هو **الوضوح والطلاقة وسرعة الاستجابة (*Clarity & Fluency*)**.
* استخدم دائماً التعبيرات القصيرة الجاهزة (*Chunks & Idioms*) بدلاً من تكوين الجملة كلمة بكلمة.

---

## 💬 حوار واقعي متكامل (Realistic Dialogue)

* **الموقف:** محادثة حية في موقف ${title}:

> **Person A:** "Excuse me, could you point me in the right direction?"  
> *(معذرة، هل يمكنك إرشادي للاتجاه الصحيح؟)*  
> **Person B:** "Sure thing! It's just down this street, on your right hand side."  
> *(بالتأكيد! هي في نهاية هذا الشارع على يدك اليمنى.)*  
> **Person A:** "Appreciate it! Have a wonderful day."  
> *(ممتن جداً لمساعدتك! أتمنى لك يوماً رائعاً.)*

---

## 📋 أهم التعبيرات المستخدمة في هذا الموقف

| التعبير الإنجليزي | النطق | الاستخدام |
| :--- | :--- | :--- |
| **"Could you do me a quick favour?"** | *كود يو دو مي أ كويك فيفور؟* | طلب مساعدة بلطف شديد |
| **"I'm not quite sure about that."** | *آيم نوت كوايت شور أباوت ذات* | إبداء عدم التأكد بدبلوماسية |
| **"Thanks a million for your help!"** | *ثانكس أ ميليون...* | شكر عميق وودود |

---

## 🚀 تدريبك الصوتي الآن (Voice Challenge)
سجّل في أداة التدريب الصوتي أسفل الصفحة إجابتك على هذا السؤال:  
**"Imagine you are in this situation (${title}), what would you say to resolve it in under 30 seconds?"**`;
}

function generateBusinessLesson(title: string, pos: number): string {
  return `## 🎯 الهدف من الدرس (Business Professionalism)
إتقان التواصل المهني في موضوع: **${title}**، وتطوير لغتك في بيئة العمل الدولية، الاجتماعات، والمراسلات الرسمية.

---

## 💡 التفكير المهني الدولي
في الشركات العالمية والعمل عن بعد، التواصل الفعال يعتمد على ثلاث ركائز:
1. **الإيجاز الذكي (Brevity):** الوصول للنقطة مباشرة بدون حشو.
2. **الاحترام الدبلوماسي (Diplomatic Politeness):** استخدام كلمات التخفيف والطلب المهذب.
3. **وضوح الخطوة القادمة (Clear Call-to-Action):** تحديد المسؤولية والموعد النهائي.

---

## 📋 قوالب وتعبيرات مهنية جاهزة (Executive Phrases)

| العبارة المهنية | المعنى السياقي |
| :--- | :--- |
| **"Let's align on the deliverables before EOD."** | دعنا نتفق على المخرجات قبل نهاية اليوم. |
| **"I'd like to propose an alternative approach."** | أود اقتراح نهج بديل للنقاش. |
| **"We need to prioritize customer-facing impact."** | يجب أن نضع الأولوية للأثر المباشر على العملاء. |

---

## 🚀 التطبيق العملي
قم بكتابة فقرة من 3 أسطر أو تسجيل ملخص صوتي تشرح فيه وجهة نظرك في هذا الموضوع (${title}) مستخدماً تعبيرين من التعبيرات أعلاه.`;
}

function generateIeltsLesson(title: string, pos: number): string {
  return `## 🎯 الهدف من الدرس (IELTS Band 7.5+ Strategy)
تفكيك معايير الامتحان والتدريب على التكنيك الدقيق لموضوع: **${title}** لتحصيل أعلى الدرجات وتجنب فخاخ الوقت.

---

## 💡 سر درجات الآيلتس العالية
* لا تحاول استخدام كلمات صعبة لا تعرف سياقها الدقيق؛ المصحح يبحث عن **التلقائية والصياغة الطبيعية (*Natural Collocations*)**.
* في القراءة والاستماع: الكلمة المفتاحية في السؤال غالباً ما تتغير في النص إلى مرادف (*Synonym*) أو إعادة صياغة (*Paraphrase*).

---

## 📋 خريطة الإجابة النموذجية
1. وضوح الفكرة من أول جملة.
2. التوسع المنطقي مع مثال داعم.
3. استخدام أدوات ربط أكاديمية (*Whereas, Furthermore, In contrast, Consequently*).`;
}

function generateKidsLesson(title: string, pos: number): string {
  return `## 🎯 الهدف من الدرس (Kids Interactive English)
درس تفاعلي مرح للأطفال لتعلم: **${title}** مع القصص، النطق السليم، والأمثلة المصورة والأنشطة المشوقة.

---

## 🌟 أهداف الطفل في هذا الدرس:
* حفظ الكلمات الجديدة بالصوت والصورة.
* تكرار النطق الأمريكي السليم ومحاكاة التعبيرات.
* حل التمارين التفاعلية بثقة وفخر!

---

## 💬 كلمات وجمل ممتعة:
* استمع للكلمات الجديدة ورددها بصوت عالٍ مع ابتسامة!
* شارك ما تعلمته اليوم مع أسرتك ومعلمك.`;
}

function generateIndependenceLesson(courseSlug: string, title: string, pos: number): string {
  return `## 🎯 مسار الاستقلال اللغوي — المستوى التأسيسي والتطبيقي
هذا الدرس هو خطوة محورية في مسارك نحو التحدث المستقل بالإنجليزية: **${title}**.

---

## 💡 استراتيجية التعلّم في هذا المستوى
* **التأسيس المتين:** الانتقال من فهم الكلمات المفردة إلى تركيب جمل كاملة بدون تردد.
* **التدريب السمعي والبصري:** الاستماع لنماذج حقيقية ثم التكرار الفوري (*Shadowing Technique*).
* **التطبيق مع الذكاء الاصطناعي والمدرّس:** استخدم أداة المحاكاة والتدريب الصوتي لتثبيت الدرس في ذاكرتك النشطة.

---

## 📋 خطة الدرس:
1. استيعاب الفكرة والشرح العربي الموضح.
2. نطق الجمل الإنجليزية ثلاث مرات بصوت مسموع.
3. تسجيل صوتك في أداة التدريب لتقييم الطلاقة ومخارج الحروف.`;
}

function generateUniversalLesson(title: string, pos: number): string {
  return `## 🎯 الهدف من الدرس (Lesson Objective)
شرح شامل وتفصيلي لـ: **${title}** مع تدريبات عملية، أمثلة حية، وتوجيهات واضحة لنقل هذه المهارة إلى محادثاتك وكتاباتك اليومية.

---

## 💡 الشرح النظري والتطبيقي
* استيعاب الفكرة في سياقها الطبيعي.
* معرفة الفروق الدقيقة وأفضل الممارسات المتبعة عالمياً.
* التدريب على النطق والاستخدام بدون خوف أو تردد.

---

## 🚀 التحدي التطبيقي (Practice Drill)
قم بمراجعة النقاط الأساسية وسجّل صوتك في التدريب الصوتي أسفل الصفحة للتأكد من إتقانك الكامل للدرس.`;
}
