import type {
  AssessmentFormat,
  AssessmentLevel,
  AssessmentQuestion,
  AssessmentSkill,
} from "../../shared/assessment";
import type { PremiumLesson, PremiumLessonSummary } from "../../shared/premium";

type Tense =
  | "present simple"
  | "present continuous"
  | "present perfect"
  | "present perfect continuous"
  | "past simple"
  | "past continuous"
  | "past perfect"
  | "past perfect continuous"
  | "future simple"
  | "future continuous"
  | "future perfect"
  | "future perfect continuous"
  | "going to future"
  | "mixed tense review";

type QuestionDraft = {
  skill: AssessmentSkill;
  format: AssessmentFormat;
  prompt: string;
  options: string[];
  answer: number;
  explanationAr: string;
  context?: string;
};

type LessonDraft = {
  id: string;
  level: AssessmentLevel;
  title: string;
  description: string;
  minutes: number;
  order: number;
  tense: Tense;
  rule: string;
  explanation: string;
  examples: PremiumLesson["examples"];
  commonMistakes: PremiumLesson["commonMistakes"];
  practiceTip: string;
  questions: QuestionDraft[];
};

const ex = (
  english: string,
  egyptian: string,
  kind: PremiumLesson["examples"][number]["kind"]
): PremiumLesson["examples"][number] => ({ english, egyptian, kind });

const q = (
  skill: AssessmentSkill,
  format: AssessmentFormat,
  prompt: string,
  options: string[],
  answer: number,
  explanationAr: string,
  context = ""
): QuestionDraft => ({ skill, format, prompt, options, answer, explanationAr, context });

function makeLesson(draft: LessonDraft): PremiumLesson {
  const quiz = draft.questions.map((item, index) => ({
    id: `${draft.id}-q${index + 1}`,
    level: draft.level,
    skill: item.skill,
    format: item.format,
    prompt: item.prompt,
    context: item.context ?? "",
    options: item.options,
    answer: item.answer,
    explanationAr: item.explanationAr,
  } satisfies AssessmentQuestion & { answer: number; explanationAr: string }));

  return {
    id: draft.id,
    level: draft.level,
    title: draft.title,
    description: draft.description,
    minutes: draft.minutes,
    skill: "grammar",
    order: draft.order,
    explanation: draft.explanation,
    rule: draft.rule,
    examples: draft.examples,
    commonMistakes: draft.commonMistakes,
    practiceTip: draft.practiceTip,
    quiz,
  };
}

const lessons: LessonDraft[] = [
  {
    id: "a1-present-simple-routines",
    level: "A1",
    title: "Present simple: يومك وعاداتك",
    description: "اتكلم عن الروتين، الحقائق، والمواعيد الثابتة بجمل قصيرة وواضحة.",
    minutes: 20,
    order: 1,
    tense: "present simple",
    rule: "Subject + base verb; add -s/-es with he, she, and it. Use do/does for negatives and questions.",
    explanation: "الـ present simple بنستخدمه للحاجات اللي بتتكرر أو حقيقة ثابتة. مع he/she/it بنزوّد s للفعل، لكن بعد does الفعل يرجع أصله.",
    examples: [
      ex("I drink tea every morning.", "أنا بشرب شاي كل صباح.", "affirmative"),
      ex("Mona doesn't work on Fridays.", "منى مش بتشتغل يوم الجمعة.", "negative"),
      ex("Do you live near the metro?", "إنت ساكن قريب من المترو؟", "question"),
      ex("The shop opens at nine.", "المحل بيفتح الساعة تسعة (ميعاد ثابت).", "contrast"),
    ],
    commonMistakes: [
      { wrong: "He don't likes coffee.", right: "He doesn't like coffee.", why: "بعد doesn't بنستخدم الفعل الأساسي، وdoes هي اللي شايلة علامة الغائب." },
    ],
    practiceTip: "اكتب خمس جمل عن روتينك، وبعدها حوّل جملتين لنفي وسؤال بصوت عالي.",
    questions: [
      q("grammar", "gap", "My sister ___ to work by bus every day.", ["go", "goes", "going", "is go"], 1, "مع sister نستخدم goes لأن الفاعل مفرد في المضارع البسيط."),
      q("usage", "dialogue", "A: ___ your father cook? B: Yes, he does.", ["Do", "Does", "Is", "Has"], 1, "السؤال مع he يبدأ بـ Does، وبعده الفعل الأساسي."),
      q("vocabulary", "choice", "Choose the natural sentence for a repeated habit.", ["I am drink tea every day.", "I drink tea every day.", "I drank tea every day now.", "I drinking tea every day."], 1, "التكرار اليومي يحتاج المضارع البسيط: I drink."),
      q("reading", "reading", "What time does the café open?", ["At seven", "At eight", "At nine", "At ten"], 2, "النص يقول إن الكافيه بيفتح الساعة تسعة.", "The café opens at nine every morning and closes at six.")
    ],
  },
  {
    id: "a1-present-continuous-now",
    level: "A1",
    title: "Present continuous: دلوقتي",
    description: "وصف حاجة بتحصل الآن، أو ترتيب قريب واضح من السياق.",
    minutes: 20,
    order: 2,
    tense: "present continuous",
    rule: "Subject + am/is/are + verb-ing. Use it for an action happening around now.",
    explanation: "لما الحاجة بتحصل دلوقتي بنستخدم am/is/are ومعاهم الفعل بـ ing. كلمة now أو look غالبًا بتكون علامة مفيدة.",
    examples: [
      ex("I am waiting for the bus.", "أنا مستني الأتوبيس.", "affirmative"),
      ex("They aren't watching TV.", "هم مش بيتفرجوا على التلفزيون.", "negative"),
      ex("Are you listening to me?", "إنت سامعني؟", "question"),
      ex("Look! It is raining.", "بص! الدنيا بتمطر.", "contrast"),
    ],
    commonMistakes: [
      { wrong: "She cooking now.", right: "She is cooking now.", why: "لازم فعل be قبل -ing؛ cooking لوحدها مش جملة كاملة." },
    ],
    practiceTip: "بص حواليك واكتب ثلاث جمل تبدأ بـ Look أو Listen عن اللي بيحصل الآن.",
    questions: [
      q("grammar", "gap", "Listen! The baby ___ .", ["cries", "is crying", "cry", "crying is"], 1, "الفعل بيحصل لحظة الكلام، فنستخدم is crying."),
      q("usage", "choice", "Which reply fits: 'What are you doing?'.", ["I cook every Friday.", "I am making lunch.", "I made lunch yesterday.", "I have lunch at one."], 1, "السؤال عن اللحظة الحالية، والإجابة الطبيعية I am making lunch."),
      q("vocabulary", "dialogue", "A: Are the children playing? B: No, they ___.", ["isn't", "aren't", "don't", "not"], 1, "children جمع، لذلك النفي يكون aren't."),
      q("reading", "reading", "Why is Salma wearing a coat?", ["She is sleeping", "It is raining", "She is cooking", "The shop is closed"], 1, "النص يربط لبس المعطف بالمطر الجاري الآن.", "Salma is wearing a coat because it is raining outside.")
    ],
  },
  {
    id: "a1-past-simple-yesterday",
    level: "A1",
    title: "Past simple: امبارح",
    description: "احكي عن فعل انتهى في وقت ماضي محدد.",
    minutes: 22,
    order: 3,
    tense: "past simple",
    rule: "Use the past form for finished actions. Use did/didn't + base verb for questions and negatives.",
    explanation: "الـ past simple لحاجة خلصت. مع الأفعال العادية بنضيف -ed، لكن في أفعال شاذة زي go/went. بعد did الفعل بيرجع للمصدر.",
    examples: [
      ex("We visited my aunt yesterday.", "إحنا زرنا خالتي امبارح.", "affirmative"),
      ex("I didn't see the message.", "أنا ما شوفتش الرسالة.", "negative"),
      ex("Did you call Ahmed?", "إنت كلمت أحمد؟", "question"),
      ex("She went home at six.", "هي راحت البيت الساعة ستة.", "contrast"),
    ],
    commonMistakes: [
      { wrong: "Did you went home?", right: "Did you go home?", why: "did بالفعل بتحدد الماضي، فلا نكرر علامة الماضي على go." },
    ],
    practiceTip: "احكي في أربع جمل عملت إيه امبارح؛ استخدم فعلين منتظمين وفعلين شاذين.",
    questions: [
      q("grammar", "gap", "Omar ___ his keys this morning.", ["lose", "loses", "lost", "losing"], 2, "this morning هنا فترة انتهت في السياق، والفعل الماضي من lose هو lost."),
      q("usage", "choice", "Choose the correct question.", ["Did she bought bread?", "Did she buy bread?", "Does she bought bread?", "Was she buy bread?"], 1, "بعد Did نستخدم المصدر buy، وليس الماضي bought."),
      q("vocabulary", "dialogue", "A: Why were you late? B: I ___ the wrong bus.", ["take", "takes", "took", "am taking"], 2, "الإجابة عن سبب حدث وانتهى، وpast take هو took."),
      q("reading", "reading", "Where did Lina leave her bag?", ["At school", "On the bus", "At the café", "At home"], 1, "النص يقول إنها تركت الشنطة على الأتوبيس.", "Lina left her bag on the bus after she got off.")
    ],
  },
  {
    id: "a1-going-to-plans",
    level: "A1",
    title: "Going to: خطط قريبة",
    description: "عبّر عن نية أو خطة واضحة، وتوقّع مبني على دليل ظاهر.",
    minutes: 20,
    order: 4,
    tense: "going to future",
    rule: "Subject + am/is/are going to + base verb. Use it for a plan already decided or a prediction with evidence.",
    explanation: "بنستخدم going to لما تكون الخطة متقررة من قبل، أو لما يكون عندنا دليل واضح. فعل be بيتغير حسب الفاعل.",
    examples: [
      ex("I am going to study tonight.", "أنا ناوي أذاكر الليلة.", "affirmative"),
      ex("He isn't going to drive in this rain.", "هو مش هيسوق في المطر ده.", "negative"),
      ex("Are they going to visit us?", "هم ناويين يزورونا؟", "question"),
      ex("Those clouds are dark; it is going to rain.", "السحاب غامق؛ شكلها هتمطر.", "contrast"),
    ],
    commonMistakes: [
      { wrong: "I going to call her.", right: "I am going to call her.", why: "going to تحتاج am/is/are قبلها." },
    ],
    practiceTip: "اكتب خطتين للأسبوع ودليلين على توقعاتك، وكل جملة تبدأ بفاعل مختلف.",
    questions: [
      q("grammar", "gap", "We ___ going to clean the flat tomorrow.", ["am", "is", "are", "be"], 2, "الفاعل We جمع، لذلك نستخدم are going to."),
      q("usage", "choice", "The phone is ringing. I ___ answer it.", ["am going to", "was going", "have", "did"], 0, "النية التي قررتها الآن يمكن التعبير عنها بـ am going to."),
      q("vocabulary", "dialogue", "A: Is Nour going to travel? B: Yes, she ___ .", ["is", "does", "has", "going"], 0, "الإجابة القصيرة مع going to تكرر فعل be: Yes, she is."),
      q("reading", "reading", "What is Karim planning to do on Saturday?", ["Visit his cousin", "Work at the café", "Buy a phone", "Stay at school"], 0, "خطة كريم المعلنة هي زيارة ابن عمه.", "Karim has bought a gift because he is going to visit his cousin on Saturday.")
    ],
  },
  {
    id: "a2-present-perfect-experience",
    level: "A2",
    title: "Present perfect: الخبرة والنتيجة",
    description: "اربط الماضي بالحاضر من خلال خبرة أو حدث له أثر الآن.",
    minutes: 24,
    order: 5,
    tense: "present perfect",
    rule: "Subject + have/has + past participle. Use it for life experience, recent results, or unfinished time.",
    explanation: "الزمن ده بيربط الماضي بالدلوقتي: خبرة في الحياة، نتيجة لسه ظاهرة، أو وقت لسه ما خلصش. ما بنحطش معاه وقت ماضي منتهي زي yesterday.",
    examples: [
      ex("I have visited Aswan twice.", "أنا زرت أسوان مرتين قبل كده.", "affirmative"),
      ex("She hasn't finished her report yet.", "هي لسه ما خلصتش تقريرها.", "negative"),
      ex("Have you ever tried koshari?", "إنت جربت كشري قبل كده؟", "question"),
      ex("We have lost the key, so we can't enter.", "ضيّعنا المفتاح، عشان كده مش قادرين ندخل.", "contrast"),
    ],
    commonMistakes: [
      { wrong: "I have seen him yesterday.", right: "I saw him yesterday.", why: "yesterday وقت ماضي منتهي ويحتاج past simple، مش present perfect." },
    ],
    practiceTip: "اسأل زميلك Have you ever...? خمس مرات، ثم تابع بسؤال When لو كانت الإجابة Yes.",
    questions: [
      q("grammar", "gap", "Mariam ___ never ___ sushi.", ["has / tried", "have / try", "did / tried", "is / trying"], 0, "Mariam مفرد، فنستخدم has + التصريف الثالث tried."),
      q("usage", "choice", "Which sentence is correct?", ["I have finished it last night.", "I finished it last night.", "I finish it last night.", "I had finish it last night."], 1, "last night وقت منتهٍ، لذلك نستخدم past simple finished."),
      q("vocabulary", "dialogue", "A: Have you booked the room? B: Yes, I ___ it online.", ["book", "have booked", "am book", "did booking"], 1, "السؤال عن نتيجة حاضرة، والإجابة المناسبة have booked."),
      q("reading", "reading", "Why can't the family enter the house?", ["They lost the key", "It is raining", "They are travelling", "The door is new"], 0, "ضياع المفتاح هو النتيجة الحالية المذكورة في النص.", "The family has lost the key, so nobody can open the door.")
    ],
  },
  {
    id: "a2-past-continuous-scene",
    level: "A2",
    title: "Past continuous: مشهد في الماضي",
    description: "صف فعلًا كان مستمرًا عندما حدث شيء آخر.",
    minutes: 23,
    order: 6,
    tense: "past continuous",
    rule: "Subject + was/were + verb-ing. Use it for an action in progress at a past time or interrupted by another action.",
    explanation: "ده زمن تصوير المشهد: حاجة كانت شغالة في لحظة ماضية. الحدث القصير اللي قطعها غالبًا يكون past simple.",
    examples: [
      ex("I was cooking at eight.", "كنت بطبخ الساعة تمانية.", "affirmative"),
      ex("They weren't sleeping when I called.", "هم ما كانوش نايمين لما اتصلت.", "negative"),
      ex("Were you waiting outside?", "كنت مستني بره؟", "question"),
      ex("She was walking when it started to rain.", "كانت ماشية لما المطر بدأ.", "contrast"),
    ],
    commonMistakes: [
      { wrong: "We was watching a film.", right: "We were watching a film.", why: "We جمع وتأخذ were، وليس was." },
    ],
    practiceTip: "اكتب مشهدًا من سطرين يبدأ بـ At 9 p.m. ويدمج فعلًا مستمرًا مع when.",
    questions: [
      q("grammar", "gap", "At midnight, the neighbours ___ still ___ .", ["were / talking", "was / talk", "did / talking", "are / talked"], 0, "neighbours جمع، والزمن المستمر في الماضي هو were talking."),
      q("usage", "choice", "I ___ dinner when the lights went out.", ["cooked", "was cooking", "have cooked", "am cooking"], 1, "الطبخ كان مستمرًا، وانقطاع الكهرباء حدث أثناءه."),
      q("vocabulary", "dialogue", "A: What was Ali doing? B: He ___ for a taxi.", ["waited", "was waiting", "waits", "has waited"], 1, "السؤال عن نشاط مستمر في تلك اللحظة الماضية."),
      q("reading", "reading", "What was the dog doing when the door opened?", ["It was barking", "It was sleeping", "It was eating", "It was running"], 0, "النص يذكر أن نباح الكلب كان مستمرًا عند فتح الباب.", "The dog was barking when the front door suddenly opened.")
    ],
  },
  {
    id: "a2-will-predictions",
    level: "A2",
    title: "Future with will: توقع وقرار",
    description: "استخدم will للقرارات السريعة، الوعود، والتوقعات غير المرتبطة بخطة سابقة.",
    minutes: 22,
    order: 7,
    tense: "future simple",
    rule: "Subject + will + base verb; will not becomes won't. Use it for instant decisions, promises, and predictions.",
    explanation: "will بتيجي بعدها صيغة الفعل الأساسية مع كل الفاعلين. مناسبة لقرار لحظي أو وعد أو توقع، مش لخطة جاهزة مسبقًا.",
    examples: [
      ex("I will help you with that bag.", "أنا هساعدك في الشنطة دي.", "affirmative"),
      ex("We won't forget your birthday.", "إحنا مش هننسى عيد ميلادك.", "negative"),
      ex("Will you send me the address?", "ممكن تبعتلي العنوان؟", "question"),
      ex("I think prices will rise.", "أنا متوقع الأسعار هتزيد.", "contrast"),
    ],
    commonMistakes: [
      { wrong: "She will goes tomorrow.", right: "She will go tomorrow.", why: "بعد will يأتي المصدر، فلا نضيف s أو ed." },
    ],
    practiceTip: "اكتب وعدين وتوقعين وقرارًا لحظيًا، وكلهم باستخدام will بشكل طبيعي.",
    questions: [
      q("grammar", "gap", "Don't worry; I ___ you later.", ["call", "called", "will call", "am calling yesterday"], 2, "ده وعد/قرار من المتكلم، لذلك will call مناسب."),
      q("usage", "choice", "The room is cold. I ___ the window.", ["will close", "closed", "have closed", "was closing"], 0, "قرار اتخذ لحظة الكلام يُعبّر عنه بـ will."),
      q("vocabulary", "dialogue", "A: Will they join us? B: No, they ___.", ["won't", "don't", "aren't", "didn't"], 0, "النفي المختصر مع will هو won't."),
      q("reading", "reading", "What does Hany promise to do?", ["Send the file", "Buy a ticket", "Open a shop", "Cook dinner"], 0, "النص يحتوي على وعد بإرسال الملف.", "Hany says, 'I will send the file before lunch.'")
    ],
  },
  {
    id: "a2-present-perfect-continuous-duration",
    level: "A2",
    title: "Present perfect continuous: من إمتى؟",
    description: "ركّز على مدة نشاط بدأ قبل الآن وما زال مستمرًا أو أثره ظاهر.",
    minutes: 25,
    order: 8,
    tense: "present perfect continuous",
    rule: "Subject + have/has been + verb-ing. Use it for an activity continuing from the past to now, often with for or since.",
    explanation: "لما نهتم بالنشاط ومدته من الماضي لحد دلوقتي بنستخدم have/has been + ing. for للمدة، وsince لبداية محددة.",
    examples: [
      ex("I have been learning English for two years.", "أنا بتعلم إنجليزي بقالِي سنتين.", "affirmative"),
      ex("He hasn't been sleeping well recently.", "هو مش بينام كويس الفترة الأخيرة.", "negative"),
      ex("Have you been waiting long?", "إنت مستني بقالك كتير؟", "question"),
      ex("Her hands are dirty because she has been gardening.", "إيديها متسخة عشان كانت بتزرع.", "contrast"),
    ],
    commonMistakes: [
      { wrong: "I am studying English since 2022.", right: "I have been studying English since 2022.", why: "since مع نشاط مستمر من الماضي تحتاج present perfect continuous." },
    ],
    practiceTip: "استخدم for وsince في جملتين عن عادات بدأت عندك وما زالت مستمرة.",
    questions: [
      q("grammar", "gap", "They ___ been working here since May.", ["has", "have", "are", "did"], 1, "They جمع، ولذلك نستخدم have been working."),
      q("usage", "choice", "Why is Sam tired?", ["He has been running.", "He runs tomorrow.", "He ran next week.", "He is run."], 0, "النتيجة الحالية للتعب سببها نشاط مستمر قريبًا: has been running."),
      q("vocabulary", "dialogue", "A: How long have you been waiting? B: ___ twenty minutes.", ["Since", "For", "At", "During"], 1, "نستخدم for مع مدة زمنية مثل twenty minutes."),
      q("reading", "reading", "How long has the shop been repairing the lift?", ["Since Monday", "For one hour", "Since last year", "At noon"], 0, "النص يحدد بداية العمل بـ since Monday.", "The shop has been repairing the lift since Monday, so customers use the stairs.")
    ],
  },
  {
    id: "b1-past-perfect-sequence",
    level: "B1",
    title: "Past perfect: إيه حصل الأول؟",
    description: "رتّب حدثين في الماضي بوضوح، خصوصًا في الحكايات والتقارير.",
    minutes: 26,
    order: 9,
    tense: "past perfect",
    rule: "Subject + had + past participle for the earlier of two past events; the later event usually uses past simple.",
    explanation: "لما عندنا حدثين في الماضي وعايزين نوضح مين سبق، نستخدم had + التصريف الثالث للحدث الأقدم. الاتنين مش لازم يتقالوا بنفس الزمن.",
    examples: [
      ex("The train had left before we arrived.", "القطر كان مشي قبل ما نوصل.", "affirmative"),
      ex("She hadn't eaten before the exam.", "هي ما كانتش أكلت قبل الامتحان.", "negative"),
      ex("Had you met him before the conference?", "كنت قابلته قبل المؤتمر؟", "question"),
      ex("By noon, I had finished the urgent tasks.", "قبل الضهر كنت خلصت المهام العاجلة.", "contrast"),
    ],
    commonMistakes: [
      { wrong: "When I arrived, the film already started.", right: "When I arrived, the film had already started.", why: "بداية الفيلم سبقت الوصول، لذلك نحتاج had started." },
    ],
    practiceTip: "اكتب قصة قصيرة من ثلاث جمل فيها before وafter، وحدد الحدث الأقدم بالـ past perfect.",
    questions: [
      q("grammar", "gap", "By the time we got there, the meeting ___ .", ["ends", "has ended", "had ended", "was end"], 2, "انتهاء الاجتماع حدث قبل وصولنا في الماضي، لذلك had ended."),
      q("usage", "choice", "Which sentence clearly shows the earlier event?", ["She left after he had called.", "She left after he calls.", "She had leave after he called.", "She leaves after he had call."], 0, "had called يوضح أن المكالمة سبقت مغادرتها."),
      q("vocabulary", "dialogue", "A: Why was the cupboard empty? B: We ___ all the food.", ["had eaten", "eat", "are eating", "will eat"], 0, "الأكل انتهى قبل لحظة السؤال في الماضي، فنستخدم had eaten."),
      q("reading", "reading", "What had the travellers done before the storm?", ["They had found shelter", "They bought tickets", "They were sleeping", "They will leave"], 0, "النص يذكر أنهم وجدوا مأوى قبل العاصفة.", "Before the storm began, the travellers had found shelter in a small café.")
    ],
  },
  {
    id: "b1-past-perfect-continuous-cause",
    level: "B1",
    title: "Past perfect continuous: مدة قبل نقطة ماضية",
    description: "اشرح نشاطًا كان مستمرًا قبل حدث ماضٍ أو سببًا لنتيجة وقتها.",
    minutes: 27,
    order: 10,
    tense: "past perfect continuous",
    rule: "Subject + had been + verb-ing. Use it for duration or an ongoing cause before another past moment.",
    explanation: "الزمن ده بيصور مدة نشاط قبل لحظة ماضية: كنت بعمل حاجة لفترة، وبعدها حصل حدث تاني. التركيز على الاستمرار والسبب.",
    examples: [
      ex("He had been driving for hours before he stopped.", "كان سايق بقاله ساعات قبل ما يقف.", "affirmative"),
      ex("They hadn't been sleeping well before the trip.", "ما كانوش بيناموا كويس قبل الرحلة.", "negative"),
      ex("Had she been studying all night?", "هي كانت بتذاكر طول الليل؟", "question"),
      ex("The ground was wet because it had been raining.", "الأرض كانت مبلولة عشان الدنيا كانت بتمطر.", "contrast"),
    ],
    commonMistakes: [
      { wrong: "They had been wait for an hour.", right: "They had been waiting for an hour.", why: "بعد been في الزمن المستمر يأتي الفعل بـ -ing." },
    ],
    practiceTip: "كوّن جملتين تفسر فيهما نتيجة ماضية باستخدام because + had been + ing.",
    questions: [
      q("grammar", "gap", "She was exhausted because she ___ been running.", ["has", "had", "was", "did"], 1, "السبب نشاط مستمر قبل نتيجة ماضية، لذلك had been running."),
      q("usage", "choice", "Which sentence focuses on duration before a past event?", ["I had been waiting for an hour before the bus came.", "I wait for an hour tomorrow.", "I am waiting yesterday.", "I had wait before the bus."], 0, "for an hour وbefore the bus came يبرزان المدة السابقة لحدث ماضٍ."),
      q("vocabulary", "dialogue", "A: Why were the streets flooded? B: It ___ all morning.", ["had been raining", "rains", "will rain", "has rain"], 0, "المطر المستمر سبق الفيضانات في الماضي."),
      q("reading", "reading", "What had the mechanic been doing before noon?", ["Repairing the engine", "Selling tickets", "Driving a bus", "Cleaning a room"], 0, "النص يقول إنه كان يصلح المحرك منذ الصباح.", "The mechanic had been repairing the engine since dawn before he took a break at noon.")
    ],
  },
  {
    id: "b1-future-continuous-arrangements",
    level: "B1",
    title: "Future continuous: في وقت محدد قدّام",
    description: "توقع ما سيكون جاريًا في لحظة مستقبلية، واسأل بأدب عن خطط شخص.",
    minutes: 25,
    order: 11,
    tense: "future continuous",
    rule: "Subject + will be + verb-ing. Use it for an action in progress at a specified future time or a polite enquiry about plans.",
    explanation: "بنستخدم will be + ing عشان نقول إن نشاطًا هيكون شغال في وقت مستقبلي محدد. كمان مفيد للسؤال عن خطة بدون ما يبان السؤال ضغطًا.",
    examples: [
      ex("This time tomorrow, I will be flying to Rome.", "في الوقت ده بكرة هكون مسافر بالطائرة لروما.", "affirmative"),
      ex("We won't be using the office on Friday.", "مش هنكون بنستخدم المكتب يوم الجمعة.", "negative"),
      ex("Will you be staying for dinner?", "هتكون قاعد للعشا؟", "question"),
      ex("At ten, the team will be presenting its plan.", "الساعة عشرة الفريق هيكون بيعرض خطته.", "contrast"),
    ],
    commonMistakes: [
      { wrong: "At 8, I will working.", right: "At 8, I will be working.", why: "المستقبل المستمر يحتاج be بين will والفعل المنتهي بـ ing." },
    ],
    practiceTip: "اختار وقتًا غدًا واكتب ثلاث حاجات ستكون جاريًا وقتها، ثم اسأل شخصًا بأدب عن خطته.",
    questions: [
      q("grammar", "gap", "At this time next week, they ___ be relaxing by the sea.", ["will", "are", "have", "did"], 0, "الصيغة هي will be relaxing، لأن الفاعل لا يغير will."),
      q("usage", "choice", "Which is a polite enquiry about a future plan?", ["Will you be using the printer this afternoon?", "Use you the printer?", "Did you use tomorrow?", "Are you used the printer?"], 0, "will you be using تسأل عن الخطة المستقبلية بلطف ومن غير افتراض."),
      q("vocabulary", "dialogue", "A: Can I call at 9? B: I ___ be driving then.", ["will", "was", "have", "am"], 0, "الرد يحتاج will be driving لنشاط مستمر عند التاسعة."),
      q("reading", "reading", "What will the staff be doing at 2 p.m.?", ["Meeting customers", "Closing the shop", "Counting money", "Travelling home"], 0, "حسب الجدول، مقابلة العملاء ستكون جارية الساعة 2.", "At 2 p.m., the staff will be meeting customers in the main hall.")
    ],
  },
  {
    id: "b1-narrative-tense-review",
    level: "B1",
    title: "اختيار الزمن في الحكاية",
    description: "ميّز بين الخلفية المستمرة، الحدث الرئيسي، والحدث الأسبق في قصة طبيعية.",
    minutes: 28,
    order: 12,
    tense: "mixed tense review",
    rule: "Use past continuous for background, past simple for the main event, and past perfect for an earlier event.",
    explanation: "القصة الجيدة بتتنقل بين الأزمنة: المستمر يرسم الخلفية، البسيط يحرك الأحداث، وpast perfect يرجع خطوة لحدث أقدم. الاختيار مبني على المعنى مش على كلمة واحدة.",
    examples: [
      ex("I was walking home when I saw a wallet.", "كنت ماشي للبيت لما شفت محفظة.", "affirmative"),
      ex("I didn't take it because someone had lost it.", "ما أخدتهاش لأن حد كان ضايع منه.", "negative"),
      ex("Had anybody called the owner?", "هل حد كان كلم صاحبها؟", "question"),
      ex("The owner arrived while I was waiting.", "صاحبها وصل وأنا مستني.", "contrast"),
    ],
    commonMistakes: [
      { wrong: "I walked when the phone rang.", right: "I was walking when the phone rang.", why: "المشي كان الخلفية المستمرة، أما رنين الهاتف فهو الحدث القصير." },
    ],
    practiceTip: "سجّل قصة من خمس جمل عن موقف مفاجئ، وعلّم كل فعل: خلفية أم حدث رئيسي أم حدث أسبق.",
    questions: [
      q("grammar", "gap", "While I ___ home, I found a wallet.", ["walked", "was walking", "had walked", "walk"], 1, "While تقدم فعلًا مستمرًا كخلفية: was walking."),
      q("usage", "choice", "Choose the natural sequence.", ["She was cooking when the doorbell rang.", "She cooking when the doorbell ring.", "She had cooking when it rang.", "She cooks when it had rung."], 0, "الخلفية المستمرة هي was cooking، والحدث القصير past simple rang."),
      q("vocabulary", "dialogue", "A: Why did you recognise the place? B: I ___ there before.", ["had been", "am", "will be", "was being"], 0, "الخبرة الأقدم من لحظة القصة تحتاج had been."),
      q("reading", "reading", "What happened first?", ["The alarm rang", "Nadia left the room", "The guard arrived", "Nadia called the guard"], 1, "النص يوضح أن نادية غادرت قبل رنين الإنذار.", "Nadia had left the room before the alarm rang; then the guard arrived.")
    ],
  },
  {
    id: "b2-future-perfect-deadlines",
    level: "B2",
    title: "Future perfect: قبل موعد نهائي",
    description: "عبّر بدقة عن شيء سيكون قد اكتمل قبل نقطة مستقبلية.",
    minutes: 27,
    order: 13,
    tense: "future perfect",
    rule: "Subject + will have + past participle. Use it for an action completed before a future time or deadline.",
    explanation: "ده زمن المواعيد النهائية: عند وقت مستقبلي معين، الفعل هيكون خلص. after/before وby next week بيحددوا نقطة القياس.",
    examples: [
      ex("By Friday, we will have finished the project.", "بحلول الجمعة هنكون خلصنا المشروع.", "affirmative"),
      ex("She won't have received the letter by then.", "هي مش هتكون استلمت الجواب لحد الوقت ده.", "negative"),
      ex("Will you have completed the course by June?", "هتكون خلصت الكورس بحلول يونيو؟", "question"),
      ex("The team will have solved the issue before the launch.", "الفريق هيكون حل المشكلة قبل الإطلاق.", "contrast"),
    ],
    commonMistakes: [
      { wrong: "By 5 p.m., I will finished the report.", right: "By 5 p.m., I will have finished the report.", why: "بعد will نحتاج have، ثم التصريف الثالث finished." },
    ],
    practiceTip: "ضع ثلاثة مواعيد نهائية حقيقية واكتب ما ستكون قد أنجزته بحلول كل موعد.",
    questions: [
      q("grammar", "gap", "By next month, the builders ___ have completed the bridge.", ["will", "are", "had", "have"], 0, "الصيغة المستقبلية المكتملة تبدأ بـ will have completed."),
      q("usage", "choice", "Which sentence describes completion before a future deadline?", ["By Monday, I will have sent the contract.", "By Monday, I sent the contract yesterday.", "I will sending the contract.", "I have send it by Monday last year."], 0, "By Monday مع إنجاز مكتمل مستقبلًا يحتاج future perfect."),
      q("vocabulary", "dialogue", "A: When can we review the draft? B: I ___ have finished it by noon.", ["will", "was", "am", "did"], 0, "الرد يحدد اكتمال المسودة قبل وقت مستقبلي."),
      q("reading", "reading", "What will the museum have done by July?", ["Opened a new wing", "Closed forever", "Moved abroad", "Hired no staff"], 0, "الخطة تنص على أن الجناح الجديد سيكون قد افتتح بحلول يوليو.", "By July, the museum will have opened a new wing for local artists.")
    ],
  },
  {
    id: "b2-future-perfect-continuous-progress",
    level: "B2",
    title: "Future perfect continuous: مدة لحد نقطة قدّام",
    description: "حدّد مدة نشاط ستكون مستمرة حتى وقت مستقبلي، خصوصًا في العمل والدراسة.",
    minutes: 28,
    order: 14,
    tense: "future perfect continuous",
    rule: "Subject + will have been + verb-ing. Use it to emphasise the duration of an activity up to a future time.",
    explanation: "الزمن ده بيركز على المدة المتراكمة لحد نقطة مستقبلية: بحلول شهر معين هكون بعمل الحاجة بقالِي مدة.",
    examples: [
      ex("In August, I will have been working here for five years.", "في أغسطس هكون شغال هنا بقالِي خمس سنين.", "affirmative"),
      ex("They won't have been studying for long by the test.", "مش هيكونوا ذاكروا بقالهم وقت طويل وقت الامتحان.", "negative"),
      ex("Will you have been living there for a decade?", "هتكون عايش هناك بقالك عشر سنين؟", "question"),
      ex("By noon, she will have been travelling for twelve hours.", "بحلول الضهر هتكون مسافرة بقالها 12 ساعة.", "contrast"),
    ],
    commonMistakes: [
      { wrong: "Next year I will have work here for ten years.", right: "Next year I will have been working here for ten years.", why: "لما التركيز على المدة المستمرة نحتاج been + verb-ing." },
    ],
    practiceTip: "استخدم by وfor مع ثلاثة أهداف مستقبلية: مهارة، عمل، وعادة صحية.",
    questions: [
      q("grammar", "gap", "By December, he ___ have been teaching for ten years.", ["will", "has", "is", "had"], 0, "الصيغة الصحيحة will have been teaching."),
      q("usage", "choice", "Which sentence emphasises duration up to a future point?", ["By noon, we will have been driving for six hours.", "We drove tomorrow for six hours.", "We are drive by noon.", "We had driving next week."], 0, "for six hours حتى وقت مستقبلي يركز على المدة، لذلك future perfect continuous."),
      q("vocabulary", "dialogue", "A: Will Maya still be training in June? B: Yes, she ___ have been training for eight months.", ["will", "has", "was", "does"], 0, "الإجابة تحتاج will have been training لربط المدة بنقطة مستقبلية."),
      q("reading", "reading", "How long will the researcher have been collecting data by the end of the year?", ["Three months", "Six months", "One year", "Two years"], 2, "النص يذكر أن جمع البيانات بدأ في يناير، وبنهاية السنة تكون 12 شهرًا.", "The researcher started collecting data in January, so by December it will have been one year.")
    ],
  },
  {
    id: "b2-present-perfect-vs-past-simple",
    level: "B2",
    title: "Present perfect أم past simple؟",
    description: "اضبط العلاقة بين وقت منتهٍ وخبرة أو نتيجة مرتبطة بالحاضر.",
    minutes: 27,
    order: 15,
    tense: "present perfect",
    rule: "Use past simple with a finished past time; use present perfect when the time is unfinished, unspecified, or relevant now.",
    explanation: "الفرق مش في شكل الفعل بس؛ اسأل: هل الوقت خلص واتحدد؟ يبقى past simple. هل الخبرة أو النتيجة مهمة دلوقتي والوقت مش محدد؟ يبقى present perfect.",
    examples: [
      ex("I have read three reports this week.", "قريت تلات تقارير الأسبوع ده (والأسبوع لسه مستمر).", "affirmative"),
      ex("I haven't read the final report yet.", "لسه ما قريتش التقرير النهائي.", "negative"),
      ex("Did you read the report yesterday?", "قريت التقرير امبارح؟", "question"),
      ex("Have you read the latest version?", "قريت أحدث نسخة؟", "contrast"),
    ],
    commonMistakes: [
      { wrong: "Have you sent it last Monday?", right: "Did you send it last Monday?", why: "last Monday وقت محدد ومنتهٍ، فيحتاج past simple." },
    ],
    practiceTip: "اكتب زوجين من الجمل عن نفس الفعل: واحدة بوقت منتهٍ، وواحدة بنتيجة حاضرة.",
    questions: [
      q("grammar", "gap", "I ___ the invoice yesterday.", ["have sent", "sent", "send", "was sent"], 1, "yesterday وقت ماضٍ منتهٍ، لذلك sent."),
      q("usage", "choice", "Which question asks about life experience without a finished time?", ["Have you ever worked abroad?", "Did you work abroad last year?", "Were you work abroad?", "Have you worked abroad yesterday?"], 0, "ever للسؤال عن الخبرة العامة، لذلك present perfect هو المناسب."),
      q("vocabulary", "dialogue", "A: Can we use the printer? B: No, someone ___ all the paper.", ["has used", "used in 2010", "was use", "will uses"], 0, "نفاد الورق نتيجة موجودة الآن، فنستخدم has used."),
      q("reading", "reading", "Why is the author unavailable today?", ["She has gone to Cairo", "She went last year", "She will travel tomorrow", "She was go yesterday"], 0, "has gone يشرح غيابها الحالي كنتيجة سفرها.", "The author has gone to Cairo for a meeting and will return tonight.")
    ],
  },
  {
    id: "b2-tense-shifts-in-reports",
    level: "B2",
    title: "تنقّل الأزمنة في التقارير",
    description: "استخدم الأزمنة بوعي عند تلخيص أحداث، نتائج، وتوقعات في تقرير مهني.",
    minutes: 29,
    order: 16,
    tense: "mixed tense review",
    rule: "Choose each tense by its time relationship: completed events, current results, ongoing background, or future deadlines.",
    explanation: "في التقرير المهني ممكن تستخدم أكتر من زمن في فقرة واحدة: past simple للحدث، present perfect للنتيجة الحالية، وfuture perfect للموعد المتوقع. المهم إن العلاقة الزمنية تفضل واضحة.",
    examples: [
      ex("The team launched the tool in May.", "الفريق أطلق الأداة في مايو.", "affirmative"),
      ex("It hasn't reached all users yet.", "لسه ما وصلتش لكل المستخدمين.", "negative"),
      ex("Will the team have fixed the bug by Friday?", "هل الفريق هيكون أصلح الخطأ بحلول الجمعة؟", "question"),
      ex("Usage has increased since the launch.", "الاستخدام زاد من وقت الإطلاق.", "contrast"),
    ],
    commonMistakes: [
      { wrong: "The team has launched the tool in May.", right: "The team launched the tool in May.", why: "وجود شهر ماضٍ محدد ومنتهٍ يجعل past simple أدق." },
    ],
    practiceTip: "لخّص مشروعًا من أربع جمل: تاريخ إطلاق، نتيجة حتى الآن، نشاط جارٍ، وموعد إنجاز.",
    questions: [
      q("grammar", "gap", "Since the update, customer satisfaction ___ increased.", ["has", "did", "was", "will"], 0, "Since تربط بداية ماضية بنتيجة حتى الآن: has increased."),
      q("usage", "choice", "Which report sentence is most precise?", ["The trial ended in June and has produced useful data.", "The trial has ended in June and produced yesterday.", "The trial ending in June will produced data.", "The trial did ended and has produce."], 0, "in June يأخذ past simple، والنتيجة الحالية تأخذ present perfect."),
      q("vocabulary", "dialogue", "A: Is the audit complete? B: Not yet, but we ___ have finished it by Friday.", ["will", "had", "are", "did"], 0, "موعد إنجاز مستقبلي مكتمل يحتاج will have finished."),
      q("reading", "reading", "What has improved since the launch?", ["Customer satisfaction", "The launch date", "The office location", "The team size"], 0, "النص يقول إن رضا العملاء تحسن منذ الإطلاق.", "Since the launch, customer satisfaction has improved, although response times remain slow.")
    ],
  },
  {
    id: "c1-present-simple-stative-advanced",
    level: "C1",
    title: "Present simple: حقائق ومواقف ثابتة دقيقة",
    description: "ميّز بين الحقائق العامة، الأفعال الأدائية، والمواقف التي لا تأتي عادة في continuous.",
    minutes: 30,
    order: 17,
    tense: "present simple",
    rule: "Present simple can express stable states, general truths, schedules, and performative verbs such as agree, apologise, and promise.",
    explanation: "في المستوى المتقدم، المضارع البسيط مش بس للعادات؛ بنستخدمه للحقائق والمواقف الثابتة، وكمان أفعال زي agree وapologise اللي بتحصل بمجرد نطقها. أفعال الحالة غالبًا ما ينفعش تتحط continuous.",
    examples: [
      ex("I understand your concern.", "أنا فاهم قلقك.", "affirmative"),
      ex("This theory doesn't explain the result.", "النظرية دي ما بتفسرش النتيجة.", "negative"),
      ex("Do you agree with the proposed change?", "إنت موافق على التغيير المقترح؟", "question"),
      ex("I apologise for the delay.", "أنا بعتذر عن التأخير.", "contrast"),
    ],
    commonMistakes: [
      { wrong: "I am understanding the problem.", right: "I understand the problem.", why: "understand فعل حالة، والمضارع البسيط هو الطبيعي للتعبير عن الفهم." },
    ],
    practiceTip: "راجع رسالة مهنية واستخدم present simple لثلاث حقائق وفعل أدائي واحد بدل العبارات المبالغ فيها.",
    questions: [
      q("grammar", "choice", "Which sentence uses a stative verb naturally?", ["I am understanding the point.", "I understand the point.", "I understanding the point.", "I understood now every point."], 1, "understand غالبًا فعل حالة، والصيغة الطبيعية هنا present simple."),
      q("usage", "dialogue", "A: Do you accept the terms? B: Yes, I ___.", ["am accepting", "accept", "accepted tomorrow", "have accepting"], 1, "accept هنا فعل أدائي/موقف حالي ويأتي طبيعيًا في المضارع البسيط."),
      q("vocabulary", "gap", "The data ___ that the policy needs revision.", ["suggest", "is suggesting", "suggested tomorrow", "has suggesting"], 0, "البيانات تقدم استنتاجًا ثابتًا في السياق، وsuggest تأتي غالبًا في present simple."),
      q("reading", "reading", "What does the author believe about the proposal?", ["It solves every problem", "It requires revision", "It was cancelled", "It will never start"], 1, "الكاتب يقول إن المقترح يحتاج مراجعة.", "The author argues that the proposal is promising but does not address two central risks.")
    ],
  },
  {
    id: "c1-present-continuous-stance",
    level: "C1",
    title: "Present continuous: تغيّر وموقف مؤقت",
    description: "عبّر عن اتجاه متغير أو سلوك مؤقت، مع فهم الفرق الدلالي عن present simple.",
    minutes: 30,
    order: 18,
    tense: "present continuous",
    rule: "Present continuous can mark temporary behaviour, developing trends, and arrangements; the simple often sounds more permanent or objective.",
    explanation: "الفرق الدقيق إن continuous بيخلي الفعل مؤقت أو متطور أو موقف المتكلم منه واضح، بينما simple بيدي إحساس بالثبات أو الحقيقة العامة.",
    examples: [
      ex("More people are working remotely this year.", "ناس أكتر بقت بتشتغل عن بُعد السنة دي.", "affirmative"),
      ex("The company isn't ignoring the feedback.", "الشركة مش بتتجاهل الملاحظات (في الفترة الحالية).", "negative"),
      ex("Are you suggesting that we delay the launch?", "إنت بتقترح إننا نأجل الإطلاق؟", "question"),
      ex("She is being unusually cautious today.", "هي بتتصرف بحذر غير معتاد النهارده.", "contrast"),
    ],
    commonMistakes: [
      { wrong: "The climate changes rapidly this decade.", right: "The climate is changing rapidly this decade.", why: "اتجاه متطور خلال فترة حالية يأخذ continuous؛ simple قد يبدو كحقيقة ثابتة." },
    ],
    practiceTip: "اكتب جملتين عن اتجاه اجتماعي وجملتين عن سلوك مؤقت، واشرح لماذا اخترت continuous.",
    questions: [
      q("grammar", "choice", "Which sentence highlights a developing trend?", ["Online learning grows this year.", "Online learning is growing this year.", "Online learning grow yesterday.", "Online learning has grow now."], 1, "this year واتجاه متطور يناسبان is growing."),
      q("usage", "dialogue", "A: Why is Omar quiet? B: He ___ unusually cautious today.", ["is being", "is be", "being is", "has be"], 0, "سلوك مؤقت وغير معتاد يحتاج is being."),
      q("vocabulary", "gap", "The board ___ whether to postpone the vote.", ["is considering", "consider yesterday", "has consider", "was considers"], 0, "قرار قيد الدراسة الآن، لذلك is considering."),
      q("reading", "reading", "What change is the report describing?", ["Remote work is becoming more common", "Offices are disappearing tomorrow", "The policy ended last year", "Workers never travel"], 0, "التقرير يصف اتجاهًا جاريًا: العمل عن بعد يصبح أكثر شيوعًا.", "The report notes that remote work is becoming more common among small firms.")
    ],
  },
  {
    id: "c1-past-simple-narrative-distance",
    level: "C1",
    title: "Past simple: سرد وتحكم في المسافة",
    description: "استخدم الماضي البسيط لسرد أحداث مكتملة، حتى عند تلخيص تاريخ أو حجة معقدة.",
    minutes: 29,
    order: 19,
    tense: "past simple",
    rule: "Past simple presents completed events as a sequence; it can create narrative distance and is common in historical and analytical summaries.",
    explanation: "الماضي البسيط مش للمحادثة اليومية بس؛ في الكتابة الأكاديمية والسرد بيعرض الأحداث كوقائع مكتملة ومتتابعة، ويدي مسافة هادئة عن الحدث.",
    examples: [
      ex("The committee rejected the proposal in 2018.", "اللجنة رفضت المقترح سنة 2018.", "affirmative"),
      ex("The report did not address the main objection.", "التقرير ما تناولش الاعتراض الأساسي.", "negative"),
      ex("Why did the policy fail?", "ليه السياسة فشلت؟", "question"),
      ex("The reform changed how schools measured progress.", "الإصلاح غيّر طريقة قياس المدارس للتقدم.", "contrast"),
    ],
    commonMistakes: [
      { wrong: "The study did not concluded that.", right: "The study did not conclude that.", why: "بعد did not يعود الفعل للمصدر conclude." },
    ],
    practiceTip: "لخّص حدثًا تاريخيًا في خمس جمل past simple، وتجنب خلطه بـ present perfect مع تاريخ منتهٍ.",
    questions: [
      q("grammar", "gap", "The committee ___ the proposal in 2018.", ["rejects", "has rejected", "rejected", "is rejecting"], 2, "وجود in 2018 يجعل الحدث ماضيًا مكتملًا: rejected."),
      q("usage", "choice", "Which is the correct negative sentence?", ["The report did not addressed the risk.", "The report did not address the risk.", "The report not did address the risk.", "The report was not address the risk."], 1, "بعد did not نستخدم المصدر address."),
      q("vocabulary", "dialogue", "A: Why did the reform matter? B: It ___ access to schools.", ["expanded", "expands yesterday", "has expanding", "was expand"], 0, "الإجابة تحكي أثرًا مكتملًا في الماضي: expanded."),
      q("reading", "reading", "What did the court decide in 1999?", ["It upheld the rule", "It is writing a rule", "It has reject the rule", "It will hear the case"], 0, "النص يذكر قرارًا مكتملًا سنة 1999: upheld the rule.", "In 1999, the court upheld the rule after a lengthy appeal.")
    ],
  },
  {
    id: "c1-past-perfect-ellipsis",
    level: "C1",
    title: "Past perfect: ترتيب خفي في النص",
    description: "اقرأ ما وراء الكلمات واربط past perfect بالنتيجة أو الفرضية أو الندم.",
    minutes: 31,
    order: 20,
    tense: "past perfect",
    rule: "Past perfect marks an earlier past reference point and commonly appears in reported narratives, regrets, and third conditional clauses.",
    explanation: "في المستوى ده، past perfect ممكن يظهر من غير كلمة before صريحة: في نقل الكلام، الندم، والشرط الثالث. دورك تكتشف نقطة القياس الماضية.",
    examples: [
      ex("She said she had overlooked the warning.", "هي قالت إنها كانت غفلت عن التحذير.", "affirmative"),
      ex("We hadn't anticipated the delay.", "إحنا ما كناش متوقعين التأخير.", "negative"),
      ex("Had they informed us, we would have acted sooner.", "لو كانوا بلغونا، كنا هنتصرف بدري.", "question"),
      ex("He regretted that he had spoken too quickly.", "ندم إنه كان اتكلم بسرعة زيادة.", "contrast"),
    ],
    commonMistakes: [
      { wrong: "If I had knew, I would have helped.", right: "If I had known, I would have helped.", why: "بعد had نستخدم التصريف الثالث known، وليس الماضي knew." },
    ],
    practiceTip: "حوّل ثلاث جمل مباشرة إلى reported speech، وحافظ على past perfect لو نقطة الكلام في الماضي.",
    questions: [
      q("grammar", "gap", "She said that she ___ forgotten the appointment.", ["has", "had", "would", "was"], 1, "في الكلام المنقول الماضي الأقدم يأخذ had forgotten."),
      q("usage", "choice", "Which third conditional clause is correct?", ["If we had known, we would have acted.", "If we had knew, we would act.", "If we knew yesterday, we act.", "If we have known, we would acted."], 0, "الشرط الثالث: had + past participle، والنتيجة would have + past participle."),
      q("vocabulary", "dialogue", "A: Why did he apologise? B: He realised he ___ spoken too sharply.", ["had", "has", "will", "is"], 0, "الكلام الحاد سبق لحظة إدراكه الماضية، لذلك had spoken."),
      q("reading", "reading", "What had the witness noticed before the alarm?", ["A broken window", "A new guard", "A later meeting", "Nothing at all"], 0, "النص يذكر أن ملاحظة النافذة المكسورة سبقت الإنذار.", "The witness had noticed a broken window before the alarm sounded.")
    ],
  },
  {
    id: "c2-present-perfect-result",
    level: "C2",
    title: "Present perfect: نتيجة وحدود زمنية",
    description: "تحكم في الفرق بين الإنجاز، التجربة، والمدة مع الإشارات الزمنية الدقيقة.",
    minutes: 32,
    order: 21,
    tense: "present perfect",
    rule: "Present perfect frames past events from a present viewpoint; adverbs such as yet, already, still, and so far shape the implication.",
    explanation: "هنا بنركز على زاوية النظر: الحدث حصل قبل دلوقتي لكن أثره أو علاقته بالحاضر هي الأهم. كلمات زي so far وyet وalready بتغير المعنى الضمني.",
    examples: [
      ex("The minister has already announced the revised policy.", "الوزير أعلن السياسة المعدلة خلاص.", "affirmative"),
      ex("The review panel has not reached a decision yet.", "لجنة المراجعة لسه ما وصلتش لقرار.", "negative"),
      ex("How many versions have you compared so far?", "قارنت كام نسخة لحد دلوقتي؟", "question"),
      ex("The evidence has changed the debate.", "الأدلة غيّرت النقاش (والأثر لسه موجود).", "contrast"),
    ],
    commonMistakes: [
      { wrong: "The minister has announced it last Tuesday.", right: "The minister announced it last Tuesday.", why: "last Tuesday حد زمني منتهٍ؛ زاوية الحاضر لا تلغي ضرورة past simple." },
    ],
    practiceTip: "اكتب فقرة من ثلاث جمل فيها already وyet وso far، ثم وضح أثر كل كلمة على توقع القارئ.",
    questions: [
      q("grammar", "choice", "Which sentence correctly uses an unfinished time period?", ["We have reviewed four cases so far.", "We reviewed four cases so far last year.", "We have review four cases yesterday.", "We are reviewed four cases so far."], 0, "so far يفتح فترة مستمرة حتى الحاضر، لذلك have reviewed."),
      q("usage", "dialogue", "A: Is the decision final? B: No, the panel ___ reached one yet.", ["hasn't", "didn't", "isn't", "won't"], 0, "yet مع نتيجة لم تحدث حتى الآن يناسب hasn't reached."),
      q("vocabulary", "gap", "The new evidence has ___ the debate.", ["reshape", "reshaped", "reshaping", "reshapes yesterday"], 1, "بعد has يأتي التصريف الثالث reshaped."),
      q("reading", "reading", "What has changed as a result of the evidence?", ["The public debate", "The meeting date", "The minister's job", "The archive location"], 0, "النص يذكر أن الأدلة غيّرت النقاش العام.", "The new evidence has changed the public debate, although no policy has changed yet.")
    ],
  },
  {
    id: "c2-past-continuous-contrast",
    level: "C2",
    title: "Past continuous: خلفية وصوت سردي",
    description: "استخدم الماضي المستمر لصناعة خلفية أو إبراز فعل مؤقت مقابل عادة أو حكم عام.",
    minutes: 31,
    order: 22,
    tense: "past continuous",
    rule: "Past continuous foregrounds a temporary or developing activity at a past reference point, often contrasting with a stable habit or interruption.",
    explanation: "في الكتابة المتقدمة، اختيار past continuous بيحدد كاميرا السرد: بيخلّي النشاط مؤقتًا وجاريًا وقتها، وقد يلمّح إن السلوك مش معتاد أو إن حدثًا قطعه.",
    examples: [
      ex("The negotiators were testing a compromise when the talks collapsed.", "المفاوضون كانوا بيختبروا حلًا وسطًا لما المحادثات انهارت.", "affirmative"),
      ex("The minister was not answering questions that afternoon.", "الوزير ما كانش بيرد على الأسئلة بعد الظهر ده.", "negative"),
      ex("Were the observers recording the exchange?", "المراقبون كانوا بيسجلوا الحوار؟", "question"),
      ex("He usually speaks calmly, but he was shouting that day.", "هو عادة بيتكلم بهدوء، لكنه كان بيزعق اليوم ده.", "contrast"),
    ],
    commonMistakes: [
      { wrong: "He was usually arriving early.", right: "He usually arrived early.", why: "usually تصف عادة، والمضارع/الماضي البسيط أنسب من المستمر إلا لو المقصود سلوك مؤقت متكرر بشكل مزعج." },
    ],
    practiceTip: "اكتب فقرة تقارن عادة مستقرة بسلوك مؤقت في يوم استثنائي، مستخدمًا but وwhile.",
    questions: [
      q("grammar", "choice", "Which sentence clearly sets a temporary past scene?", ["They were negotiating when the alarm sounded.", "They negotiate when the alarm sounded.", "They had negotiate when it sounds.", "They are negotiated yesterday."], 0, "were negotiating يرسم نشاطًا جاريًا قطعه alarm sounded."),
      q("usage", "dialogue", "A: Did the director answer questions? B: No, she ___ them that afternoon.", ["was avoiding", "avoids", "has avoided yesterday", "will avoid"], 0, "السياق يصف سلوكًا جاريًا ومؤقتًا في بعد ظهر ماضٍ."),
      q("vocabulary", "gap", "While the witnesses ___, the lawyer took notes.", ["were speaking", "spoke tomorrow", "have spoken", "was speak"], 0, "witnesses جمع، والنشاط المستمر هو were speaking."),
      q("reading", "reading", "What contrast does the writer make?", ["Calm usual speech versus shouting that day", "A past job versus a future job", "A closed office versus a new building", "A short meeting versus a long holiday"], 0, "النص يقارن العادة الهادئة بالصراخ في اليوم الاستثنائي.", "He usually speaks calmly; however, he was shouting throughout that particular meeting.")
    ],
  },
  {
    id: "c2-future-perfect-formal",
    level: "C2",
    title: "Future perfect: توقّع مشروط ودقيق",
    description: "صغ توقعات إنجاز مستقبلية مع نقاط قياس وافتراضات واضحة في الكتابة الرسمية.",
    minutes: 32,
    order: 23,
    tense: "future perfect",
    rule: "Future perfect projects a completed state from a future vantage point and works well with by, by the time, and conditional forecasts.",
    explanation: "الزمن ده بيدي الكاتب نقطة نظر مستقبلية: لو الظروف استمرت، بحلول موعد معين هيكون الإنجاز اكتمل. مفيد في التقارير والتوقعات، ولازم نقطة القياس تكون واضحة.",
    examples: [
      ex("By 2030, the city will have redesigned its transport network.", "بحلول 2030 المدينة هتكون أعادت تصميم شبكة المواصلات.", "affirmative"),
      ex("The programme will not have solved every inequality by then.", "البرنامج مش هيكون حل كل أوجه عدم المساواة وقتها.", "negative"),
      ex("Will researchers have identified the source by the end of the trial?", "هل الباحثون هيكونوا حددوا المصدر بنهاية التجربة؟", "question"),
      ex("If funding continues, the archive will have digitised its core collection.", "لو التمويل استمر، الأرشيف هيكون رقمن مجموعته الأساسية.", "contrast"),
    ],
    commonMistakes: [
      { wrong: "By 2030, the city will has redesigned the network.", right: "By 2030, the city will have redesigned the network.", why: "بعد will نستخدم have دائمًا، وليس has مهما كان الفاعل." },
    ],
    practiceTip: "اكتب توقعًا رسميًا فيه by 2030 وشرطًا يوضح الافتراض الذي يعتمد عليه التوقع.",
    questions: [
      q("grammar", "gap", "By the end of the trial, researchers will ___ identified the source.", ["have", "has", "be", "had"], 0, "الصيغة هي will have identified."),
      q("usage", "choice", "Which forecast is logically complete?", ["If funding continues, the archive will have digitised its core files by 2030.", "If funding continues, the archive will has digitised by 2030.", "If funding continued, the archive has digitise by 2030.", "If funding continues, the archive will digitising by 2030."], 0, "الشرط واضح، وبعد will تأتي have + التصريف الثالث مع by 2030."),
      q("vocabulary", "dialogue", "A: Can the review be released in June? B: Yes, we ___ have completed it by then.", ["will", "had", "are", "did"], 0, "by then تشير إلى إنجاز مكتمل قبل نقطة مستقبلية."),
      q("reading", "reading", "What will the archive have done by 2030?", ["Digitised its core collection", "Closed all branches", "Moved the collection overseas", "Stopped receiving funds"], 0, "النص يربط موعد 2030 برقمنة المجموعة الأساسية.", "If the project stays on schedule, the archive will have digitised its core collection by 2030.")
    ],
  },
  {
    id: "c2-tense-shifting-register",
    level: "C2",
    title: "اختيار الزمن والنبرة",
    description: "راجع فقرة متعددة الأزمنة بحيث تبقى النبرة والمعنى الزمني دقيقين وطبيعيين.",
    minutes: 33,
    order: 24,
    tense: "mixed tense review",
    rule: "Advanced control means shifting tense deliberately for viewpoint, evidence, duration, narrative sequence, and future projection—not mechanically.",
    explanation: "الإتقان مش إنك تستخدم زمن صعب وخلاص؛ إنك تختار الزمن اللي يحدد زاوية النظر والنبرة. نفس الفكرة ممكن تتغير دلالتها لو بدلت simple بـ continuous أو perfect.",
    examples: [
      ex("The authors have argued that the pattern is changing.", "الكتّاب جادلوا إن النمط بيتغير (والحجة ما زالت مهمة).", "affirmative"),
      ex("They have not claimed that the evidence is conclusive.", "هم ما ادعوش إن الأدلة حاسمة.", "negative"),
      ex("How long will the debate have been continuing by then?", "النقاش هيكون مستمر بقاله قد إيه وقتها؟", "question"),
      ex("Earlier studies treated the issue differently.", "الدراسات الأقدم عالجت الموضوع بشكل مختلف.", "contrast"),
    ],
    commonMistakes: [
      { wrong: "The authors have published the paper in 2019.", right: "The authors published the paper in 2019.", why: "التاريخ المنتهي يحتاج past simple، حتى لو للورقة أثر مستمر الآن." },
    ],
    practiceTip: "حرّر فقرة قصيرة فيها تاريخ محدد، نتيجة حالية، نشاط متطور، وتوقع مستقبلي؛ اشرح كل انتقال زمني.",
    questions: [
      q("grammar", "choice", "Which sentence keeps the time relationships precise?", ["The study appeared in 2019 and has influenced later work.", "The study has appeared in 2019 and influenced yesterday.", "The study appearing in 2019 will influenced work.", "The study did appeared and has influence."], 0, "التاريخ المنتهي يأخذ past simple، والأثر الحالي present perfect."),
      q("usage", "dialogue", "A: Is the pattern stable? B: No, the evidence suggests it ___ changing.", ["is", "was", "has", "will have"], 0, "suggests it is changing يعبّر عن اتجاه متطور الآن."),
      q("vocabulary", "gap", "By the next review, the debate will have ___ for two years.", ["continued", "continue", "continuing", "continues"], 0, "بعد will have يأتي التصريف الثالث continued في future perfect."),
      q("reading", "reading", "What is the writer's main qualification?", ["The evidence is useful but not conclusive", "The evidence proves everything", "The issue ended in 2019", "No studies exist"], 0, "الكاتب يقر بفائدة الأدلة لكنه لا يعتبرها حاسمة.", "The authors have found a useful pattern, but they have not claimed that the evidence is conclusive.")
    ],
  },
];

export const PREMIUM_LESSONS: PremiumLesson[] = lessons.map(makeLesson);

export const PREMIUM_TENSE_COVERAGE: Readonly<Record<string, string[]>> = Object.fromEntries(
  lessons.reduce((coverage, lesson) => {
    const ids = coverage.get(lesson.tense) ?? [];
    ids.push(lesson.id);
    coverage.set(lesson.tense, ids);
    return coverage;
  }, new Map<Tense, string[]>())
);

const byId = new Map(PREMIUM_LESSONS.map(lesson => [lesson.id, lesson]));

export function premiumLessonById(id: string): PremiumLesson | undefined {
  return byId.get(id);
}

export function summariesForLevels(levels: AssessmentLevel[]): PremiumLessonSummary[] {
  const requested = new Set(levels);
  return PREMIUM_LESSONS
    .filter(lesson => requested.has(lesson.level))
    .map(({ id, level, title, description, minutes, skill, order }) => ({
      id,
      level,
      title,
      description,
      minutes,
      skill,
      order,
    }));
}

export const PREMIUM_TENSES: readonly Tense[] = [
  "present simple",
  "present continuous",
  "present perfect",
  "present perfect continuous",
  "past simple",
  "past continuous",
  "past perfect",
  "past perfect continuous",
  "future simple",
  "future continuous",
  "future perfect",
  "future perfect continuous",
];
