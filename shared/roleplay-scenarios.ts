export interface RoleplayOption {
  id: string;
  textEn: string;
  quality: "best" | "good" | "weak";
  score: number;
  feedbackAr: string;
  nativeTipEn?: string;
}

export interface RoleplayTurn {
  id: string;
  speakerRole: string;
  promptEn: string;
  promptAr: string;
  options: RoleplayOption[];
}

export interface RoleplayScenario {
  id: string;
  titleAr: string;
  titleEn: string;
  emoji: string;
  level: "A1" | "A2" | "B1" | "B2";
  settingAr: string;
  partnerName: string;
  accent: string;
  rewardXp: number;
  isPro?: boolean;
  turns: RoleplayTurn[];
}

export const ROLEPLAY_SCENARIOS: RoleplayScenario[] = [
  {
    id: "job-interview",
    titleAr: "إنترفيو شغل بالإنجليزي",
    titleEn: "Job Interview",
    emoji: "💼",
    level: "B1",
    settingAr: "مقابلة عمل أونلاين مع مدير التوظيف في شركة دولية.",
    partnerName: "Sarah (HR Manager)",
    accent: "from-indigo-500 to-blue-600",
    rewardXp: 30,
    turns: [
      {
        id: "ji-1",
        speakerRole: "HR Manager",
        promptEn:
          "Welcome! Thanks for joining today. To start off, could you tell me a bit about yourself?",
        promptAr:
          "أهلاً بيك! شكراً إنك انضميت النهارده. في البداية، ممكن تكلمني شوية عن نفسك؟",
        options: [
          {
            id: "a",
            textEn:
              "Thank you for having me! I'm a dedicated professional with strong problem-solving skills, and I'm excited to bring value to your team.",
            quality: "best",
            score: 100,
            feedbackAr:
              "رد احترافي جداً! بدأت بشكر لطيف وربطت مهاراتك بقيمة هتضيفها للفريق.",
          },
          {
            id: "b",
            textEn:
              "Hello, my name is Ahmed, I graduated two years ago and I want to work here.",
            quality: "good",
            score: 70,
            feedbackAr:
              "كويس ومفهوم، بس تقدر تخليه أقوى لما تذكر مهارة بتميزك بدل مجرد التخرج.",
            nativeTipEn: "Try adding: 'I specialize in ... and I love solving real challenges.'",
          },
          {
            id: "c",
            textEn: "Everything is written in my CV, you can read it.",
            quality: "weak",
            score: 30,
            feedbackAr:
              "إوعى تقول كده في إنترفيو! دي جملة بتدي انطباع سلبي جداً. لازم تلخّص قصتك بابتسامة.",
          },
        ],
      },
      {
        id: "ji-2",
        speakerRole: "HR Manager",
        promptEn:
          "That's great. Can you share a challenge you faced recently and how you handled it?",
        promptAr:
          "ممتاز. تقدر تحكيلي عن تحدي واجهته قريب وإزاي اتعاملت معاه؟",
        options: [
          {
            id: "a",
            textEn:
              "We had a tight deadline last month, so I prioritized the key tasks, coordinated with my teammates, and delivered the project on time.",
            quality: "best",
            score: 100,
            feedbackAr:
              "برافو! استخدمت طريقة STAR (المشكلة + تصرفك + النتيجة) بلغة سلسة جداً.",
          },
          {
            id: "b",
            textEn:
              "We had a big problem with time, but I worked hard and finished it.",
            quality: "good",
            score: 70,
            feedbackAr:
              "إجابة لطيفة، بس الأفضل تذكر خطوة عملية عملتها زي prioritizing tasks.",
          },
          {
            id: "c",
            textEn: "I never have any problems at work.",
            quality: "weak",
            score: 35,
            feedbackAr:
              "محدش بيصدق إن مفيش مشاكل خالص! المحاور عايز يشوف طريقة تفكيرك في حل المشاكل.",
          },
        ],
      },
      {
        id: "ji-3",
        speakerRole: "HR Manager",
        promptEn:
          "Why do you want to join our company specifically?",
        promptAr: "ليه عايز تنضم لشركتنا إحنا بالتحديد؟",
        options: [
          {
            id: "a",
            textEn:
              "I admire your company's culture of innovation, and this role aligns perfectly with my career goals.",
            quality: "best",
            score: 100,
            feedbackAr:
              "ممتازة! بيّنت إنك عامل بحث عن الشركة وإن الوظيفة مناسبة لطموحك.",
          },
          {
            id: "b",
            textEn: "Because your company is famous and pays a good salary.",
            quality: "good",
            score: 60,
            feedbackAr:
              "صريحة زيادة عن اللزوم! دايماً ركّز على القيمة والتطور قبل المرتب.",
          },
          {
            id: "c",
            textEn: "I just need any job right now.",
            quality: "weak",
            score: 25,
            feedbackAr:
              "دي بتضعّف فرصتك فوراً — لازم تحسّسهم إنك مختارهم هم بالذات.",
          },
        ],
      },
      {
        id: "ji-4",
        speakerRole: "HR Manager",
        promptEn:
          "Awesome! Before we wrap up, do you have any questions for me?",
        promptAr: "رائع! قبل ما نخلص، هل عندك أي أسئلة ليا؟",
        options: [
          {
            id: "a",
            textEn:
              "Yes! What does success look like in the first 90 days of this role?",
            quality: "best",
            score: 100,
            feedbackAr:
              "سؤال عبقري بيبهر أي مدير توظيف! بيبيّن إنك داخل تشتغل وتنجح من أول يوم.",
          },
          {
            id: "b",
            textEn: "When will I hear back about the next step?",
            quality: "good",
            score: 80,
            feedbackAr: "سؤال عملي ومحترم جداً وبيبين اهتمامك بالوظيفة.",
          },
          {
            id: "c",
            textEn: "No, nothing. Bye.",
            quality: "weak",
            score: 40,
            feedbackAr:
              "دايماً جهّز سؤال ذكي واحد على الأقل عشان تسيب انطباع قوي في النهاية.",
          },
        ],
      },
    ],
  },
  {
    id: "cafe-order",
    titleAr: "طلب قهوة وأكل في كافيه",
    titleEn: "Ordering at a Café",
    emoji: "☕",
    level: "A1",
    settingAr: "داخل كافيه لطيف في لندن وعايز تطلب مشروب وحلوى بذوق.",
    partnerName: "Liam (Barista)",
    accent: "from-amber-500 to-orange-600",
    rewardXp: 25,
    turns: [
      {
        id: "cf-1",
        speakerRole: "Barista",
        promptEn: "Hi there! Good morning. What can I get started for you today?",
        promptAr: "أهلاً بيك! صباح الخير. تحب تبدأ تطلب إيه النهارده؟",
        options: [
          {
            id: "a",
            textEn: "Good morning! Could I please get a medium iced latte with oat milk?",
            quality: "best",
            score: 100,
            feedbackAr: "توب! استخدام 'Could I please get...' هو أشيك وأطبيعي طريقة للطلب.",
          },
          {
            id: "b",
            textEn: "I want one iced latte, please.",
            quality: "good",
            score: 75,
            feedbackAr: "مفهومة ولطيفة، بس 'I'd like' أو 'Could I get' أرقى بكتير من 'I want'.",
          },
          {
            id: "c",
            textEn: "Give me coffee now.",
            quality: "weak",
            score: 30,
            feedbackAr: "دي لهجة أمر ومش لطيفة في الإنجليزي — دايماً نستخدم Could I / I'd like.",
          },
        ],
      },
      {
        id: "cf-2",
        speakerRole: "Barista",
        promptEn: "Sure thing! Would you like anything to eat with that? Our croissants are fresh out of the oven.",
        promptAr: "أكيد! تحب تاكل حاجة معاه؟ الكرواسون لسه طالع سخن من الفرن.",
        options: [
          {
            id: "a",
            textEn: "Oh, that sounds amazing! I'll take one butter croissant, warmed up please.",
            quality: "best",
            score: 100,
            feedbackAr: "يا سلام! رد طبيعي 100% كأنك عايش هناك، وجملة 'warmed up' ممتازة.",
          },
          {
            id: "b",
            textEn: "Yes, one croissant please.",
            quality: "good",
            score: 80,
            feedbackAr: "قصيرة ومهذبة وشغالة تمام في أي كافيه.",
          },
          {
            id: "c",
            textEn: "No food, only drink.",
            quality: "weak",
            score: 50,
            feedbackAr: "ممكن تقول بألطف: 'I'm good with just the drink, thanks!'",
          },
        ],
      },
      {
        id: "cf-3",
        speakerRole: "Barista",
        promptEn: "Will that be for here or to go?",
        promptAr: "هتشربه هنا ولا تيك أواي؟",
        options: [
          {
            id: "a",
            textEn: "To go, please. And could I also have a couple of napkins?",
            quality: "best",
            score: 100,
            feedbackAr: "ممتاز! استخدام 'a couple of napkins' طبيعي جداً وسلس.",
          },
          {
            id: "b",
            textEn: "Take away, please.",
            quality: "good",
            score: 85,
            feedbackAr: "ممتازة جداً خصوصاً في الإنجليزي البريطاني!",
          },
          {
            id: "c",
            textEn: "Outside.",
            quality: "weak",
            score: 45,
            feedbackAr: "الصح نقول 'To go' أو 'Take away' مش 'Outside'.",
          },
        ],
      },
      {
        id: "cf-4",
        speakerRole: "Barista",
        promptEn: "Your total comes to £7.50. How would you like to pay?",
        promptAr: "الحساب 7.50 جنيه إسترليني. تحب تدفع إزاي؟",
        options: [
          {
            id: "a",
            textEn: "I'll pay by card, please. No receipt needed, thank you!",
            quality: "best",
            score: 100,
            feedbackAr: "هايل! جملة متكاملة وطبيعية جداً.",
          },
          {
            id: "b",
            textEn: "By card, please.",
            quality: "good",
            score: 85,
            feedbackAr: "مختصرة وصح 100%.",
          },
          {
            id: "c",
            textEn: "Visa.",
            quality: "weak",
            score: 50,
            feedbackAr: "الأفضل تقول 'By card, please' عشان تبان واثق ومتحدث بطلاقة.",
          },
        ],
      },
    ],
  },
  {
    id: "airport-hotel",
    titleAr: "المطار وتسجيل الفندق",
    titleEn: "Airport & Hotel Check-in",
    emoji: "✈️",
    level: "A2",
    settingAr: "وصلت الفندق بعد رحلة طيران طويلة وبتعمل Check-in في الاستقبال.",
    partnerName: "Emma (Front Desk)",
    accent: "from-sky-500 to-cyan-600",
    rewardXp: 25,
    turns: [
      {
        id: "ah-1",
        speakerRole: "Receptionist",
        promptEn: "Good evening and welcome to the Grand Hotel! How can I assist you?",
        promptAr: "مساء الخير وأهلاً بيك في فندق جراند! أقدر أساعدك إزاي؟",
        options: [
          {
            id: "a",
            textEn: "Good evening! I have a reservation for three nights under the name Kareem.",
            quality: "best",
            score: 100,
            feedbackAr: "مثالي! التعبير 'a reservation under the name...' هو الجملة الذهبية في أي فندق.",
          },
          {
            id: "b",
            textEn: "Hello, I booked a room online. My name is Kareem.",
            quality: "good",
            score: 80,
            feedbackAr: "واضحة جداً وصح، و'under the name' هتخليها أشيك كمان.",
          },
          {
            id: "c",
            textEn: "Room key please, I am tired.",
            quality: "weak",
            score: 35,
            feedbackAr: "محتاجة توضيح أكتر وتهذيب — قول دايماً 'I have a reservation'.",
          },
        ],
      },
      {
        id: "ah-2",
        speakerRole: "Receptionist",
        promptEn: "Got it! May I see your passport and a credit card for incidentals, please?",
        promptAr: "تمام! ممكن أشوف جواز السفر وكارت بنكي للتأمين لو سمحت؟",
        options: [
          {
            id: "a",
            textEn: "Of course, here you go. By the way, is breakfast included in my booking?",
            quality: "best",
            score: 100,
            feedbackAr: "عاش! استخدمت 'Here you go' و'By the way' وسألت سؤال مهم بطريقة طبيعية.",
          },
          {
            id: "b",
            textEn: "Here is my passport. Do you have breakfast?",
            quality: "good",
            score: 75,
            feedbackAr: "حلوة، والأدق نقول 'Is breakfast included?' عشان نعرف مجاني ولا لا.",
          },
          {
            id: "c",
            textEn: "Take it.",
            quality: "weak",
            score: 35,
            feedbackAr: "في الإنجليزي بنقول 'Here you go' أو 'Here you are' لما ندي حد حاجة، مش 'Take it'.",
          },
        ],
      },
      {
        id: "ah-3",
        speakerRole: "Receptionist",
        promptEn: "Yes, breakfast is served from 7 to 10 AM. Do you have any room preferences?",
        promptAr: "أيوه، الفطار من 7 لـ 10 صباحاً. هل عندك أي تفضيلات للغرفة؟",
        options: [
          {
            id: "a",
            textEn: "If possible, I'd love a quiet room on a higher floor away from the elevator.",
            quality: "best",
            score: 100,
            feedbackAr: "روعة! 'If possible, I'd love...' بتخلي أي موظف يساعدك بحب.",
          },
          {
            id: "b",
            textEn: "I want a quiet room, please.",
            quality: "good",
            score: 80,
            feedbackAr: "كويسة ومفهومة، وجرّب تبدل 'I want' بـ 'I'd prefer'.",
          },
          {
            id: "c",
            textEn: "Give me the best room.",
            quality: "weak",
            score: 40,
            feedbackAr: "أسلوب أمر — الأفضل تطلب بلطف وتحدد اللي محتاجه (quiet / high floor).",
          },
        ],
      },
      {
        id: "ah-4",
        speakerRole: "Receptionist",
        promptEn: "You're all set in Room 804! Here are your key cards. Enjoy your stay!",
        promptAr: "كله جاهز في غرفة 804! اتفضل كروت الغرفة وإقامة سعيدة!",
        options: [
          {
            id: "a",
            textEn: "Thank you so much! Could you also let me know the Wi-Fi password?",
            quality: "best",
            score: 100,
            feedbackAr: "إغلاق محترف وسؤال عملي جداً بأسلوب مهذب.",
          },
          {
            id: "b",
            textEn: "Thanks! What is the Wi-Fi password?",
            quality: "good",
            score: 85,
            feedbackAr: "ممتازة وسريعة وواضحة!",
          },
          {
            id: "c",
            textEn: "Okay, Wi-Fi?",
            quality: "weak",
            score: 45,
            feedbackAr: "كلمة واحدة مش كفاية — كمّل الجملة عشان كلامك يبقى سليم ومهذب.",
          },
        ],
      },
    ],
  },
  {
    id: "online-meeting",
    titleAr: "اجتماع شغل أونلاين (Zoom)",
    titleEn: "Online Business Meeting",
    emoji: "💻",
    level: "B2",
    settingAr: "اجتماع أونلاين مع عميل أجنبي لمناقشة جدول المشروع.",
    partnerName: "David (Client Lead)",
    accent: "from-violet-500 to-purple-600",
    rewardXp: 35,
    turns: [
      {
        id: "om-1",
        speakerRole: "Client",
        promptEn: "Hey! Sorry I'm a couple minutes late — can everyone hear me alright?",
        promptAr: "أهلاً! آسف على التأخير دقيقتين — الكل سامعني كويس؟",
        options: [
          {
            id: "a",
            textEn: "No worries at all, David! Yes, we can hear you loud and clear.",
            quality: "best",
            score: 100,
            feedbackAr: "تعبير 'loud and clear' هو التعبير الاحترافي الأشهر في اجتماعات Zoom!",
          },
          {
            id: "b",
            textEn: "Yes, the sound is good. Let's start.",
            quality: "good",
            score: 75,
            feedbackAr: "واضحة تماماً، بس إضافة 'No worries at all' بتخلي الجو ألطف بكتير.",
          },
          {
            id: "c",
            textEn: "You are late. Yes I hear.",
            quality: "weak",
            score: 30,
            feedbackAr: "حدّة غير مناسبة مع عميل — اللباقة أساس إنجليزي الأعمال!",
          },
        ],
      },
      {
        id: "om-2",
        speakerRole: "Client",
        promptEn: "Quick question: are we still on track to launch the first version next Thursday?",
        promptAr: "سؤال سريع: هل إحنا لسه ماشيين على الجدول عشان نطلق أول نسخة الخميس الجاي؟",
        options: [
          {
            id: "a",
            textEn: "Yes, we're right on schedule! Let me share my screen to walk you through our progress.",
            quality: "best",
            score: 100,
            feedbackAr: "عظمة! 'right on schedule' + 'walk you through' = إنجليزي شركات عالمي.",
          },
          {
            id: "b",
            textEn: "Yes, we will finish before Thursday. I will show you now.",
            quality: "good",
            score: 80,
            feedbackAr: "واضحة وإيجابية جداً!",
          },
          {
            id: "c",
            textEn: "Maybe, I don't know yet.",
            quality: "weak",
            score: 30,
            feedbackAr: "لو فيه شك، الأفضل تقول: 'I'll double-check with the team and confirm by end of day.'",
          },
        ],
      },
      {
        id: "om-3",
        speakerRole: "Client",
        promptEn: "Wait, sorry — your audio cut out for a second there. Could you repeat that last part?",
        promptAr: "ثانية، الصوت قطع لحظة. ممكن تعيد الجزء الأخير ده؟",
        options: [
          {
            id: "a",
            textEn: "Of course! What I was saying is that the testing phase wraps up this Tuesday.",
            quality: "best",
            score: 100,
            feedbackAr: "استخدام 'What I was saying is...' و'wraps up' في منتهى السلاسة والاحترافية.",
          },
          {
            id: "b",
            textEn: "Sure, we finish testing on Tuesday.",
            quality: "good",
            score: 80,
            feedbackAr: "مختصرة ومباشرة وممتازة.",
          },
          {
            id: "c",
            textEn: "My internet is fine, your internet is bad.",
            quality: "weak",
            score: 20,
            feedbackAr: "طبعاً مرفوضة في الشغل! دايماً نعيد الكلام بهدوء وابتسامة.",
          },
        ],
      },
      {
        id: "om-4",
        speakerRole: "Client",
        promptEn: "Sounds fantastic. Let's sync again after Tuesday's QA check!",
        promptAr: "ممتاز جداً. يلا نتواصل تاني بعد مراجعة الجودة يوم الثلاثاء!",
        options: [
          {
            id: "a",
            textEn: "Sounds like a plan! I'll send over a quick summary email with our action items right after this call.",
            quality: "best",
            score: 100,
            feedbackAr: "مستوى C1! 'Sounds like a plan' + 'action items' بتخلي العميل يثق فيك 100%.",
          },
          {
            id: "b",
            textEn: "Great, see you on Tuesday. Bye!",
            quality: "good",
            score: 80,
            feedbackAr: "لطيفة وواضحة ومناسبة.",
          },
          {
            id: "c",
            textEn: "Ok.",
            quality: "weak",
            score: 40,
            feedbackAr: "ختام سريع زيادة — حاول دايماً تلخّص الخطوة الجاية قبل ما تقفل المكالمة.",
          },
        ],
      },
    ],
  },
  // ================= PRO / VIP EXCLUSIVE SCENARIOS =================
  {
    id: "ielts-speaking-pro",
    titleAr: "محاكاة اختبار IELTS Speaking الرسمي",
    titleEn: "IELTS Speaking Examiner Simulation",
    emoji: "🎯",
    level: "B2",
    settingAr: "مقابلة تقييم رسمية مع ممتحن آيلتس بريطاني للحصول على Band 7.5+.",
    partnerName: "Dr. Oliver (IELTS Examiner)",
    accent: "from-amber-500 via-yellow-500 to-orange-600",
    rewardXp: 50,
    isPro: true,
    turns: [
      {
        id: "ielts-1",
        speakerRole: "Examiner",
        promptEn: "Let's talk about technology. How has technology changed the way people learn languages?",
        promptAr: "يلا نتكلم عن التكنولوجيا. إزاي التكنولوجيا غيّرت طريقة تعلّم الناس للغات؟",
        options: [
          {
            id: "a",
            textEn: "Technology has completely revolutionized language learning by giving learners instant access to native audio, interactive simulations, and personalized feedback anytime.",
            quality: "best",
            score: 100,
            feedbackAr: "إجابة Band 8! استخدمت كلمات أكاديمية قوية زي revolutionized و personalized feedback.",
          },
          {
            id: "b",
            textEn: "Technology made learning much easier because we can watch videos and use apps on our phones.",
            quality: "good",
            score: 75,
            feedbackAr: "إجابة Band 6.5 حلوة جداً — لو أضفت مثال محدد وكلمة زي 'instant access' ترفع درجتك لـ 7.5+.",
          },
          {
            id: "c",
            textEn: "Yes, phones are good for English.",
            quality: "weak",
            score: 30,
            feedbackAr: "قصيرة جداً في الآيلتس! لازم توسعهالـ 2–3 جمل بأسباب وأمثلة.",
          },
        ],
      },
      {
        id: "ielts-2",
        speakerRole: "Examiner",
        promptEn: "Do you think artificial intelligence will ever completely replace human teachers?",
        promptAr: "هل تعتقد إن الذكاء الاصطناعي ممكن يستبدل المدرّسين البشر بالكامل يوماً ما؟",
        options: [
          {
            id: "a",
            textEn: "While AI is a phenomenal practice tool, I believe human teachers remain irreplaceable because they provide empathy, motivation, and real emotional connection.",
            quality: "best",
            score: 100,
            feedbackAr: "روعة! بدأت بجملة متوازنة 'While AI is...' وقدمت 3 أسباب قوية بطلاقة Band 8+.",
          },
          {
            id: "b",
            textEn: "No, AI cannot replace teachers because teachers understand students' feelings.",
            quality: "good",
            score: 75,
            feedbackAr: "فكرة جميلة وصحيحة، جرّب تربطها بكلمة 'While...' عشان تبان أكاديمية أكتر.",
          },
          {
            id: "c",
            textEn: "No, never.",
            quality: "weak",
            score: 25,
            feedbackAr: "إجابة بكلمتين بتقلل درجة الطلاقة فوراً — اشرح دايماً 'ليه'!",
          },
        ],
      },
      {
        id: "ielts-3",
        speakerRole: "Examiner",
        promptEn: "What advice would you give to someone who feels shy about speaking English?",
        promptAr: "إيه النصيحة اللي تديها لحد بيحس بالخجل لما يتكلم إنجليزي؟",
        options: [
          {
            id: "a",
            textEn: "I'd encourage them to treat mistakes as natural milestones rather than failures, and to start with short five-minute daily conversations in a supportive environment.",
            quality: "best",
            score: 100,
            feedbackAr: "مذهلة! تعبير 'treat mistakes as natural milestones' يبهر أي ممتحن آيلتس.",
          },
          {
            id: "b",
            textEn: "They should practice every day and not be afraid of making mistakes.",
            quality: "good",
            score: 80,
            feedbackAr: "واضحة وممتازة! إضافة 'rather than...' هترفع التقييم في الـ Grammar.",
          },
          {
            id: "c",
            textEn: "Just speak.",
            quality: "weak",
            score: 30,
            feedbackAr: "مختصرة جداً — الآيلتس بيقيّم قدرتك على الشرح والتفصيل.",
          },
        ],
      },
      {
        id: "ielts-4",
        speakerRole: "Examiner",
        promptEn: "Finally, how important do you think learning English will be over the next decade?",
        promptAr: "أخيراً، مدى أهمية تعلّم الإنجليزي في رأيك خلال العشر سنين الجاية؟",
        options: [
          {
            id: "a",
            textEn: "It will remain a vital global bridge for remote work, higher education, and cross-cultural collaboration.",
            quality: "best",
            score: 100,
            feedbackAr: "خاتمة ذهبية Band 8.5! كلمات vital global bridge و cross-cultural collaboration قمة الاحترافية.",
          },
          {
            id: "b",
            textEn: "Very important for jobs, travel, and university.",
            quality: "good",
            score: 75,
            feedbackAr: "كويسة ومباشرة، جرّب تبنيها في جملة كاملة 'It will continue to be essential for...'",
          },
          {
            id: "c",
            textEn: "Very important.",
            quality: "weak",
            score: 30,
            feedbackAr: "لازم دايماً تعطي سبب أو مثالين في إجابتك.",
          },
        ],
      },
    ],
  },
  {
    id: "salary-negotiation-pro",
    titleAr: "التفاوض على المرتب والترقية",
    titleEn: "Salary Negotiation Masterclass",
    emoji: "💰",
    level: "B2",
    settingAr: "جلسة التقييم السنوي مع مديرك للتفاوض بثقة على زيادة المرتب.",
    partnerName: "Claire (Engineering Director)",
    accent: "from-emerald-500 via-teal-500 to-cyan-600",
    rewardXp: 50,
    isPro: true,
    turns: [
      {
        id: "sal-1",
        speakerRole: "Director",
        promptEn: "We're really happy with your work this year. What's on your mind regarding your growth here?",
        promptAr: "إحنا مبسوطين جداً بشغلك السنة دي. إيه اللي في بالك بخصوص تطورك معانا؟",
        options: [
          {
            id: "a",
            textEn: "Thank you, Claire! Over the past year I've led two major launches that boosted client retention by 25%, and I'd love to discuss aligning my compensation with this expanded impact.",
            quality: "best",
            score: 100,
            feedbackAr: "احترافية عالية جداً! بدأت بالأرقام والإنجازات قبل ما تطلب الزيادة بأسلوب راقي.",
          },
          {
            id: "b",
            textEn: "Thanks! I worked very hard this year and I think I deserve a raise.",
            quality: "good",
            score: 70,
            feedbackAr: "مقبولة، بس الأرقام والنتائج دايماً أقوى من مجرد 'I worked hard'.",
          },
          {
            id: "c",
            textEn: "Prices went up so I need more money.",
            quality: "weak",
            score: 30,
            feedbackAr: "الشركات بتزود المرتب بناءً على قيمتك ونتائجك في الشغل، مش على الأسعار بس.",
          },
        ],
      },
      {
        id: "sal-2",
        speakerRole: "Director",
        promptEn: "That's fair. Do you have a specific number or range in mind?",
        promptAr: "ده كلام منطقي. هل في دماغك رقم معين أو رينج محدد؟",
        options: [
          {
            id: "a",
            textEn: "Based on market benchmarks for this level and my recent deliverables, I'm targeting an adjustment in the 18% to 22% range.",
            quality: "best",
            score: 100,
            feedbackAr: "تفاوض على أعلى مستوى! استخدمت 'market benchmarks' وحددت رينج واضح بثقة.",
          },
          {
            id: "b",
            textEn: "I would like a 20% increase, please.",
            quality: "good",
            score: 80,
            feedbackAr: "واضحة ومباشرة! لو ربطتها بسوق العمل بتبقى أقوى بكتير.",
          },
          {
            id: "c",
            textEn: "Whatever you think is okay.",
            quality: "weak",
            score: 35,
            feedbackAr: "لو محددتش رقمك، غالباً هتاخد أقل زيادة ممكنة — خليك دايماً جاهز برينج واضح!",
          },
        ],
      },
      {
        id: "sal-3",
        speakerRole: "Director",
        promptEn: "Our current quarter budget is tight, so 20% might be tough right now. What if we start at 12%?",
        promptAr: "الميزانية الربع ده مضغوطة شوية، فـ 20% صعبة دلوقتي. إيه رأيك نبدأ بـ 12%؟",
        options: [
          {
            id: "a",
            textEn: "I appreciate the transparency! Could we agree on 14% now, with a scheduled 6-month review tied to clear KPIs to bridge the remaining gap?",
            quality: "best",
            score: 100,
            feedbackAr: "عبقري! مقبلتش بأول عرض ولا رفضت بعند — اقترحت حل وسط ذكي مربوط بأهداف واضحة!",
          },
          {
            id: "b",
            textEn: "Okay, 12% is fine, thank you.",
            quality: "good",
            score: 70,
            feedbackAr: "قبول لطيف، بس كان ممكن تاخد ميزة إضافية زي مراجعة بعد 6 شهور.",
          },
          {
            id: "c",
            textEn: "No, give me 20% or I quit.",
            quality: "weak",
            score: 20,
            feedbackAr: "التهديد بيدمر علاقتك بالمدير — التفاوض الذكي بيعتمد على Win-Win.",
          },
        ],
      },
      {
        id: "sal-4",
        speakerRole: "Director",
        promptEn: "That's a very reasonable proposal. Let me confirm with HR and get back to you by Friday!",
        promptAr: "ده اقتراح منطقي جداً. خليني أأكد مع الـ HR وأرجعلك يوم الجمعة!",
        options: [
          {
            id: "a",
            textEn: "Wonderful, thank you for advocating for me, Claire! I'll send a quick recap email with our agreed milestones.",
            quality: "best",
            score: 100,
            feedbackAr: "إغلاق محترف 100%! توثيق الاتفاق في إيميل لطيف بيضمن تنفيذه.",
          },
          {
            id: "b",
            textEn: "Thank you, waiting for Friday!",
            quality: "good",
            score: 80,
            feedbackAr: "لطيفة ومناسبة!",
          },
          {
            id: "c",
            textEn: "Don't forget.",
            quality: "weak",
            score: 35,
            feedbackAr: "لهجة مش احترافية — الأفضل تبعت إيميل متابعة لطيف (recap email).",
          },
        ],
      },
    ],
  },
  {
    id: "medical-travel-pro",
    titleAr: "العيادة والصيدلية أثناء السفر",
    titleEn: "Doctor & Pharmacy Abroad",
    emoji: "🏥",
    level: "B1",
    settingAr: "موقف طارئ أثناء السفر بره مصر وبتشرح أعراضك للدكتور والصيدلي بوضوح.",
    partnerName: "Dr. Hannah (Clinic Doctor)",
    accent: "from-rose-500 via-pink-500 to-red-600",
    rewardXp: 40,
    isPro: true,
    turns: [
      {
        id: "med-1",
        speakerRole: "Doctor",
        promptEn: "Hello! Take a seat. What symptoms have you been experiencing today?",
        promptAr: "أهلاً! اتفضل اقعد. إيه الأعراض اللي حاسس بيها النهارده؟",
        options: [
          {
            id: "a",
            textEn: "Hi Doctor. I've had a sore throat, mild fever, and a persistent cough since yesterday evening.",
            quality: "best",
            score: 100,
            feedbackAr: "وصف طبي دقيق وواضح جداً! sore throat + mild fever + persistent cough.",
          },
          {
            id: "b",
            textEn: "My throat hurts and I am coughing since yesterday.",
            quality: "good",
            score: 80,
            feedbackAr: "مفهومة جداً وصح — استخدام 'I've had...' هيخلي القواعد 100%.",
          },
          {
            id: "c",
            textEn: "I am sick.",
            quality: "weak",
            score: 35,
            feedbackAr: "عامة جداً! لازم تحدد مكان الألم والأعراض عشان الدكتور يقدر يساعدك.",
          },
        ],
      },
      {
        id: "med-2",
        speakerRole: "Doctor",
        promptEn: "Do you have any allergies to medications, or are you currently taking anything?",
        promptAr: "هل عندك أي حساسية من أدوية معينة، أو بتاخد أي دواء حالياً؟",
        options: [
          {
            id: "a",
            textEn: "No known drug allergies, and I only took some paracetamol this morning for the fever.",
            quality: "best",
            score: 100,
            feedbackAr: "إجابة نموذجية! التعبير 'No known drug allergies' واضح وآمن جداً.",
          },
          {
            id: "b",
            textEn: "No allergies. I took a painkiller this morning.",
            quality: "good",
            score: 80,
            feedbackAr: "كويسة ومفهومة، والأفضل تذكر اسم الدواء بالتحديد.",
          },
          {
            id: "c",
            textEn: "I don't know.",
            quality: "weak",
            score: 40,
            feedbackAr: "مهم دايماً توضح لو أخدت أي مسكن أو خافض حرارة قبل الكشف.",
          },
        ],
      },
      {
        id: "med-3",
        speakerRole: "Doctor",
        promptEn: "It looks like a mild viral infection. I'll write you a prescription for throat lozenges and nasal spray.",
        promptAr: "ده يبدو عدوى فيروسية خفيفة. هكتبلك روشتة لأقراص استحلاب وبخاخ للأنف.",
        options: [
          {
            id: "a",
            textEn: "Thank you, Doctor! How many times a day should I take them, and should I take them after meals?",
            quality: "best",
            score: 100,
            feedbackAr: "أسئلة مهمة وذكية جداً بأسلوب طبيعي وسليم 100%.",
          },
          {
            id: "b",
            textEn: "How do I use this medicine?",
            quality: "good",
            score: 80,
            feedbackAr: "واضحة وعملية وممتازة.",
          },
          {
            id: "c",
            textEn: "Give me antibiotics.",
            quality: "weak",
            score: 30,
            feedbackAr: "المضاد الحيوي لا يُستخدم للفيروسات والأفضل دايماً نسأل بلطف.",
          },
        ],
      },
      {
        id: "med-4",
        speakerRole: "Doctor",
        promptEn: "Take one lozenge every 4 hours and get plenty of rest. You should feel much better in 3 days!",
        promptAr: "خد قرص كل 4 ساعات وارتاح كويس. هتحس بتحسن كبير خلال 3 أيام!",
        options: [
          {
            id: "a",
            textEn: "I really appreciate your help, Doctor! Is there a 24-hour pharmacy nearby where I can fill this prescription?",
            quality: "best",
            score: 100,
            feedbackAr: "ممتاز! تعبير 'fill a prescription' (يصرف روشتة) هو التعبير الأصلي اللي بيستخدمه الأجانب!",
          },
          {
            id: "b",
            textEn: "Thank you! Where is the nearest pharmacy?",
            quality: "good",
            score: 85,
            feedbackAr: "واضحة وسهلة وممتازة جداً!",
          },
          {
            id: "c",
            textEn: "Bye.",
            quality: "weak",
            score: 45,
            feedbackAr: "دايماً اشكر الدكتور واتأكد من مكان أقرب صيدلية.",
          },
        ],
      },
    ],
  },
];
