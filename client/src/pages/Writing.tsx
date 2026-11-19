import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Compass,
  Copy,
  GraduationCap,
  History,
  Lightbulb,
  PenLine,
  RotateCcw,
  Send,
  Sparkles,
  TrendingUp,
  Trophy,
} from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/layout/site-footer";
import { Eyebrow } from "@/components/bits";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { soundEffects } from "@/lib/sound-effects";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

type CefrLevel = "A1" | "A2" | "B1" | "B2" | "C1";

type WeaknessDiagnosis = {
  id: string;
  category: "grammar" | "vocabulary" | "cohesion" | "style";
  title: string;
  description: string;
  exampleInText?: string;
  suggestedFix?: string;
  recommendedResource: {
    title: string;
    type: "course" | "flashcards" | "roleplay";
    url: string;
  };
  recommendedBook: {
    title: string;
    author: string;
    chapterOrTip: string;
  };
};

type EvaluationResult = {
  id: string;
  timestamp: string;
  originalText: string;
  correctedText: string;
  estimatedLevel: CefrLevel;
  overallScore: number;
  wordCount: number;
  scores: {
    grammar: number;
    vocabulary: number;
    coherence: number;
    style: number;
  };
  overview: string;
  weaknesses: WeaknessDiagnosis[];
  encouragement: string;
  isAi?: boolean;
  modelUsed?: string | null;
  errorReason?: string | null;
  apiKeyMasked?: string | null;
};

const SAMPLE_PROMPTS = [
  {
    id: "email",
    title: "إيميل مهني للعمل (Business Email)",
    level: "B1",
    prompt:
      "Write a professional email to your manager requesting approval for a one-week training course that will benefit your team's project.",
  },
  {
    id: "ielts2",
    title: "مقال رأي آيلتس (IELTS Task 2)",
    level: "B2",
    prompt:
      "Some people believe online education will replace traditional universities in the future. To what extent do you agree or disagree?",
  },
  {
    id: "daily",
    title: "وصف يومي وحياتي (Personal Narrative)",
    level: "A2",
    prompt:
      "Describe a memorable trip you took with your friends or family in Egypt. What did you do, and why was it special to you?",
  },
  {
    id: "work",
    title: "حل مشكلة في العمل (Workplace Challenge)",
    level: "B1+",
    prompt:
      "Describe a difficult situation you faced at work or university and explain how you handled it successfully.",
  },
];

const STORAGE_KEY = "linkme_writing_portfolio_v1";

function analyzeTextDeterministic(text: string): EvaluationResult {
  const words = text
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const wordCount = words.length;

  // Basic diagnostic heuristics
  const hasPastTenseConfusion =
    /\b(I was go|he did went|they was|we was|she didn't came|I have saw)\b/i.test(
      text
    );
  const hasPrepositionIssues =
    /\b(in the night|at the morning|listen music|interested for|depend of)\b/i.test(
      text
    );
  const hasRepetitiveGood =
    (text.match(/\b(good|very good|bad|thing|things|stuff)\b/gi) || []).length >= 3;
  const hasShortSentences = wordCount > 25 && (text.match(/\./g) || []).length > wordCount / 5;
  const hasLackOfConnectors =
    !/\b(however|furthermore|moreover|therefore|in addition|on the other hand|consequently|for instance|as a result)\b/i.test(
      text
    );
  const hasPassiveOrAdvancedVocab =
    /\b(significant|crucial|demonstrate|implement|substantial|comprehensive|fundamental|perspective|furthermore)\b/i.test(
      text
    );

  // Score calculations
  let grammarScore = 75;
  let vocabScore = 72;
  let coherenceScore = 70;
  let styleScore = 74;

  const weaknesses: WeaknessDiagnosis[] = [];

  if (hasPastTenseConfusion || /\b(he go|she want|it make)\b/i.test(text)) {
    grammarScore -= 14;
    weaknesses.push({
      id: "grammar_tenses",
      category: "grammar",
      title: "أزمنة الأفعال وتوافق الفاعل (Subject-Verb & Tenses)",
      description:
        "فيه خلط بين تصريفات الأفعال وتوافق المفرد والجمع (زي استخدام he go بدل he goes، أو الجمع بين did وفعل ماضي).",
      exampleInText: "راجع تصريف الأفعال مع He / She / It واستخدام المصدر بعد did.",
      suggestedFix: "تأكد من إضافة s للمضارع البسيط، واستخدام مصدر الفعل دائمًا بعد didn't.",
      recommendedResource: {
        title: "كورس أساسيات القواعد: درس الأزمنة وتوافق الفاعل",
        type: "course",
        url: "/courses/english-grammar-foundations",
      },
      recommendedBook: {
        title: "English Grammar in Use",
        author: "Raymond Murphy",
        chapterOrTip: "راجع الوحدات من 1 إلى 5 (Present Continuous & Simple).",
      },
    });
  }

  if (hasPrepositionIssues) {
    grammarScore -= 8;
    weaknesses.push({
      id: "prepositions",
      category: "grammar",
      title: "حروف الجر والتعبيرات الاصطلاحية (Prepositions)",
      description:
        "حروف الجر في الإنجليزي بتعتمد على الاصطلاح مش الترجمة الحرفية من العربي (زي at night مش in the night، و listen to مش listen بس).",
      recommendedResource: {
        title: "فلاش كاردز B1: حروف الجر وأشهر الأفعال المركبة",
        type: "flashcards",
        url: "/flashcards?deck=b1",
      },
      recommendedBook: {
        title: "Practical English Usage",
        author: "Michael Swan",
        chapterOrTip: "قسم حروف الجر (Prepositions after verbs and adjectives).",
      },
    });
  }

  if (hasRepetitiveGood) {
    vocabScore -= 12;
    weaknesses.push({
      id: "vocab_repetition",
      category: "vocabulary",
      title: "تكرار الكلمات العامة (good, bad, things)",
      description:
        "استخدام كلمات عامة مكررة بيضعف قوة النص الأكاديمي والمهني. استبدل good بـ beneficial, effective, outstanding.",
      exampleInText: "بدل 'a good idea'، اكتب 'an effective strategy' أو 'a compelling proposal'.",
      suggestedFix: "نوّع مفرداتك واستخدم صفات دقيقة تصف المعنى مباشرة.",
      recommendedResource: {
        title: "فلاش كاردز المفردات المتقدمة B2 وتعبيرات Business",
        type: "flashcards",
        url: "/flashcards?deck=b2",
      },
      recommendedBook: {
        title: "Oxford Word Skills (Advanced)",
        author: "Ruth Gairns & Stuart Redman",
        chapterOrTip: "الوحدات الخاصة بالصفات التقييمية ومفردات الرأي المهني.",
      },
    });
  }

  if (hasLackOfConnectors && wordCount >= 30) {
    coherenceScore -= 12;
    weaknesses.push({
      id: "cohesion_linking",
      category: "cohesion",
      title: "أدوات الربط والانتقال بين الجمل (Transitions & Cohesion)",
      description:
        "الجمل مكتوبة ورا بعض بشكل منفصل، محتاجة أدوات ربط تبيّن السبب والنتيجة والمقارنة عشان القارئ يتابع فكرتك بسلاسة.",
      suggestedFix:
        "استخدم: Moreover للإضافة، However للتناقض، Consequently للنتيجة، For instance لضرب مثال.",
      recommendedResource: {
        title: "محاكي المواقف الحقيقية: سيناريوهات كتابة التقارير والإيميلات",
        type: "roleplay",
        url: "/roleplay",
      },
      recommendedBook: {
        title: "Writing Academic English",
        author: "Alice Oshima & Ann Hogue",
        chapterOrTip: "الفصل الرابع: Sentence Connectors & Paragraph Unity.",
      },
    });
  }

  if (hasPassiveOrAdvancedVocab) {
    vocabScore += 10;
    coherenceScore += 8;
    styleScore += 8;
  }

  // Adjust for length
  if (wordCount < 30) {
    styleScore -= 10;
    weaknesses.push({
      id: "length_expansion",
      category: "style",
      title: "توسيع وتطوير الفكرة (Idea Elaboration)",
      description:
        "النص قصير نسبيًا. حاول تضيف أمثلة وتفاصيل إضافية لشرح وجهة نظرك وتدريب نفسك على الكتابة الأطول.",
      recommendedResource: {
        title: "مسار التأسيس 12 مستوى: تدريبات كتابة الفقرات",
        type: "course",
        url: "/path",
      },
      recommendedBook: {
        title: "Great Writing 2: Great Paragraphs",
        author: "Keith S. Folse",
        chapterOrTip: "قاعدة Supporting Sentences وشرح الأمثلة الداعمة.",
      },
    });
  }

  grammarScore = Math.max(50, Math.min(95, grammarScore));
  vocabScore = Math.max(50, Math.min(95, vocabScore));
  coherenceScore = Math.max(48, Math.min(95, coherenceScore));
  styleScore = Math.max(52, Math.min(96, styleScore));

  const overallScore = Math.round(
    (grammarScore * 0.35 + vocabScore * 0.25 + coherenceScore * 0.25 + styleScore * 0.15)
  );

  let estimatedLevel: CefrLevel = "B1";
  if (overallScore >= 88 && wordCount >= 70) estimatedLevel = "C1";
  else if (overallScore >= 78) estimatedLevel = "B2";
  else if (overallScore >= 66) estimatedLevel = "B1";
  else if (overallScore >= 56) estimatedLevel = "A2";
  else estimatedLevel = "A1";

  // Build a polished corrected version
  let polished = text
    .replace(/\bi was go\b/gi, "I went")
    .replace(/\bhe did went\b/gi, "he went")
    .replace(/\bthey was\b/gi, "they were")
    .replace(/\bwe was\b/gi, "we were")
    .replace(/\bshe didn't came\b/gi, "she didn't come")
    .replace(/\bi have saw\b/gi, "I have seen")
    .replace(/\bin the night\b/gi, "at night")
    .replace(/\bat the morning\b/gi, "in the morning")
    .replace(/\blisten music\b/gi, "listen to music")
    .replace(/\binterested for\b/gi, "interested in")
    .replace(/\bdepend of\b/gi, "depend on")
    .replace(/\bvery good idea\b/gi, "compelling idea")
    .replace(/\ba lot of things\b/gi, "numerous factors")
    .replace(/\bi want to say that\b/gi, "It is evident that")
    .replace(/\s+/g, " ")
    .trim();

  // Capitalize first letter of sentences
  polished = polished.replace(/(^\s*|[.!?]\s+)([a-z])/g, (_m, p1, p2) => p1 + p2.toUpperCase());

  return {
    id: `eval_${Date.now()}`,
    timestamp: new Date().toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
    originalText: text,
    correctedText: polished,
    estimatedLevel,
    overallScore,
    wordCount,
    scores: {
      grammar: grammarScore,
      vocabulary: vocabScore,
      coherence: coherenceScore,
      style: styleScore,
    },
    overview:
      overallScore >= 80
        ? "أداء ممتاز! كتابتك واضحة ومترابطة وعندك ثروة لغوية جيدة جدًا. التصحيحات طفيفة وتركز على الأسلوب الأكاديمي."
        : overallScore >= 68
          ? "أداء واعد ومبشّر! الفكرة مفهومة بشكل سليم، وتحتاج فقط إلى ضبط أزمنة الأفعال واستخدام أدوات ربط متقدمة."
          : "بداية ممتازة لمحاولة الكتابة. ركز على الجمل البسيطة (فاعل + فعل + مفعول) وتجنب الترجمة الحرفية من العربي.",
    weaknesses,
    encouragement:
      "الكتابة مهارة عضلية؛ كل نص بتكتبه وتصححه هنا بيبني طلاقتك خطوة بخطوة 🚀",
  };
}

export default function WritingPage() {
  const { user } = useAuth();
  const [inputText, setInputText] = useState("");
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [activeResult, setActiveResult] = useState<EvaluationResult | null>(null);
  const [history, setHistory] = useState<EvaluationResult[]>([]);
  const [copied, setCopied] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Load history from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch {
      // ignore JSON errors
    }
  }, []);

  const wordCount = useMemo(() => {
    return inputText
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;
  }, [inputText]);

  const evaluateMutation = trpc.writing.evaluate.useMutation();

  const handleEvaluate = async () => {
    if (wordCount < 4) {
      toast.warning("اكتب على الأقل 4 كلمات بالإنجليزية عشان نقدر نقيّم النص بدقة.");
      return;
    }
    soundEffects.playClick();
    setIsEvaluating(true);

    try {
      const serverResult = await evaluateMutation.mutateAsync({
        text: inputText,
      });

      const result: EvaluationResult = {
        id: `eval_${Date.now()}`,
        timestamp: new Date().toLocaleDateString("ar-EG", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        originalText: inputText,
        correctedText: serverResult.correctedText,
        estimatedLevel: serverResult.estimatedLevel as CefrLevel,
        overallScore: serverResult.overallScore,
        wordCount: serverResult.wordCount,
        scores: serverResult.scores,
        overview: serverResult.overview,
        weaknesses: serverResult.weaknesses as WeaknessDiagnosis[],
        encouragement: serverResult.encouragement,
        isAi: serverResult.isAi,
        modelUsed: serverResult.modelUsed,
        errorReason: serverResult.errorReason,
        apiKeyMasked: serverResult.apiKeyMasked,
      };

      setActiveResult(result);
      soundEffects.playCorrect();
      if (serverResult.isAi) {
        toast.success(`تم التقييم بنجاح بواسطة Google Gemini (${serverResult.modelUsed}) ⚡`);
      } else {
        toast.warning(
          serverResult.errorReason
            ? `استُخدم المحرك الاحتياطي: ${serverResult.errorReason.slice(0, 80)}...`
            : "تم التقييم بالمحرك الاحتياطي 🎯"
        );
      }

      const updated = [result, ...history.slice(0, 19)];
      setHistory(updated);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // ignore storage errors
      }
    } catch {
      // Fallback
      const fallback = analyzeTextDeterministic(inputText);
      setActiveResult(fallback);
      soundEffects.playCorrect();
      toast.success("تم تقييم النص وتشخيص نقاط الضعف بنجاح 🎯");
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleCopyCorrected = () => {
    if (!activeResult) return;
    navigator.clipboard.writeText(activeResult.correctedText);
    setCopied(true);
    soundEffects.playClick();
    toast.success("تم نسخ النص المصحّح!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSelectPrompt = (prompt: string) => {
    setInputText(prompt);
    setActiveResult(null);
    soundEffects.playClick();
  };

  return (
    <PageShell>
      {/* Hero Header */}
      <section className="relative overflow-hidden border-b border-line bg-paper-deep/60 dark:bg-gradient-to-br dark:from-[#0b1120] dark:via-[#0f172a] dark:to-[#172554]/40 dark:border-white/10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -start-24 size-96 rounded-full bg-sky-500/10 blur-3xl hidden dark:block"
        />
        <div className="container py-10 md:py-12">
          <Eyebrow>الذكاء الاصطناعي في خدمتك</Eyebrow>
          <div className="mt-3 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <h1 className="text-3xl leading-tight text-ink sm:text-4xl font-extrabold">
                مصحّح الكتابة الذكي <span className="hl-word">وتشخيص نقاط الضعف.</span>
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-soft">
                اكتب أي إيميل، فقرة أو مقال بالإنجليزية. الذكاء الاصطناعي هيصحّحلك لغويًا،
                يحدد نقاط ضعفك بالظبط، يرشحلك كتب ونصائح، ويقولك تروح فين في Link Me عشان تعالجها!
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowHistory(!showHistory)}
                className="rounded-full border-line bg-card text-ink"
              >
                <History className="me-2 size-4 text-iris" />
                سجل مقالاتي ({history.length})
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="container py-8 md:py-12">
        {/* Sample Prompts */}
        <div className="mb-6">
          <p className="text-xs font-semibold text-ink-soft mb-3 flex items-center gap-1.5">
            <Lightbulb className="size-3.5 text-amber-500" /> اختار موضوع تتدرب عليه، أو اكتب موضوعك الخاص مباشرة:
          </p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {SAMPLE_PROMPTS.map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelectPrompt(p.prompt)}
                className="flex flex-col text-start rounded-2xl border border-line bg-card p-3 transition hover:border-iris hover:bg-iris-soft/20 text-xs"
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="font-bold text-ink">{p.title}</span>
                  <span className="rounded-full bg-iris/15 px-2 py-0.5 text-[10px] font-bold text-iris">
                    {p.level}
                  </span>
                </div>
                <p className="text-[11px] text-ink-soft line-clamp-2 leading-relaxed">
                  {p.prompt}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Input & Action Area */}
        <div className="rounded-3xl border border-line bg-card p-5 sm:p-7 shadow-xs dark:bg-white/[0.04] dark:backdrop-blur-md dark:border-white/10 dark:shadow-[0_8px_32px_rgba(0,0,0,0.37)]">
          <div className="flex items-center justify-between pb-3 border-b border-line/60 text-xs text-ink-soft">
            <span className="font-bold text-ink flex items-center gap-1.5">
              <PenLine className="size-4 text-iris" /> منطقة الكتابة بالإنجليزية
            </span>
            <div className="flex items-center gap-3">
              <span>{wordCount} كلمة</span>
              <span>·</span>
              <span>{inputText.length} حرف</span>
            </div>
          </div>

          <textarea
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder="Write your paragraph, email, or essay here in English... (مثال: Yesterday I was go to Cairo to meet my friend. We was very happy and had a good talk...)"
            rows={7}
            dir="ltr"
            className="w-full mt-4 rounded-2xl border border-line bg-paper-deep/40 p-4 text-sm text-ink outline-none transition focus:border-iris focus:ring-2 focus:ring-iris/15 resize-y font-sans leading-relaxed"
          />

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setInputText("");
                setActiveResult(null);
              }}
              className="rounded-full text-ink-soft hover:text-ink text-xs"
              disabled={!inputText}
            >
              <RotateCcw className="me-1.5 size-3.5" /> مسح النص
            </Button>

            <Button
              type="button"
              onClick={handleEvaluate}
              disabled={isEvaluating || wordCount < 3}
              className="rounded-full bg-iris px-6 py-2.5 text-white hover:bg-iris-deep shadow-md font-bold text-sm"
            >
              {isEvaluating ? (
                <>
                  <Sparkles className="me-2 size-4 animate-spin text-amber-300" />
                  جارٍ التحليل والتشخيص...
                </>
              ) : (
                <>
                  <Sparkles className="me-2 size-4 text-amber-300" />
                  صحّح وشخّص نقاط ضعفي 🚀
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Evaluation & Diagnostic Results */}
        {activeResult && (
          <div className="mt-8 space-y-6">
            {/* Score Banner */}
            <div className="rounded-3xl border border-iris/30 bg-gradient-to-r from-iris/10 via-iris-soft/40 to-card p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="mb-3">
                    {activeResult.isAi ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                        <Sparkles className="size-3.5 text-emerald-500" />
                        <span>تقييم مباشر عبر Google Gemini ({activeResult.modelUsed}) ⚡</span>
                      </span>
                    ) : (
                      <div className="rounded-2xl border border-amber-300/80 bg-amber-50/90 dark:bg-amber-950/40 p-3.5 text-xs text-amber-900 dark:text-amber-200">
                        <div className="font-bold flex items-center gap-1.5 mb-1 text-amber-800 dark:text-amber-300">
                          <AlertCircle className="size-4 shrink-0 text-amber-600" />
                          <span>تنبيه: تم استخدام المحرك التحليلي البديل (Fallback)</span>
                        </div>
                        <p className="text-ink-soft leading-relaxed">
                          <strong>سبب عدم اتصال الذكاء الاصطناعي:</strong> {activeResult.errorReason || "لم يتم توفير تفاصيل الخطأ"}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-iris px-3 py-1 text-xs font-extrabold text-white">
                      مستوى النص التقديري: {activeResult.estimatedLevel}
                    </span>
                    <span className="text-xs text-ink-soft">
                      {activeResult.timestamp}
                    </span>
                  </div>
                  <h2 className="mt-2 text-2xl font-extrabold text-ink">
                    النتيجة الكلية: {activeResult.overallScore} / 100
                  </h2>
                  <p className="mt-1 text-sm text-ink-soft leading-relaxed max-w-2xl">
                    {activeResult.overview}
                  </p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
                  <div className="rounded-2xl border border-line bg-card p-3 text-center">
                    <span className="block text-[11px] text-ink-soft">القواعد</span>
                    <span className="text-base font-extrabold text-iris">
                      {activeResult.scores.grammar}%
                    </span>
                  </div>
                  <div className="rounded-2xl border border-line bg-card p-3 text-center">
                    <span className="block text-[11px] text-ink-soft">المفردات</span>
                    <span className="text-base font-extrabold text-emerald-600">
                      {activeResult.scores.vocabulary}%
                    </span>
                  </div>
                  <div className="rounded-2xl border border-line bg-card p-3 text-center">
                    <span className="block text-[11px] text-ink-soft">الترابط</span>
                    <span className="text-base font-extrabold text-sky-600">
                      {activeResult.scores.coherence}%
                    </span>
                  </div>
                  <div className="rounded-2xl border border-line bg-card p-3 text-center">
                    <span className="block text-[11px] text-ink-soft">الأسلوب</span>
                    <span className="text-base font-extrabold text-purple-600">
                      {activeResult.scores.style}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Corrected Text Box */}
            <div className="rounded-3xl border border-emerald-300/40 bg-emerald-50/40 dark:bg-emerald-950/20 p-6">
              <div className="flex items-center justify-between pb-3 border-b border-emerald-200/60 dark:border-emerald-800/40">
                <h3 className="font-extrabold text-emerald-900 dark:text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="size-5 text-emerald-600" />
                  النسخة المصححة والمحسّنة بالذكاء الاصطناعي (Corrected Text)
                </h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopyCorrected}
                  className="rounded-full border-emerald-300 bg-card text-emerald-700 hover:bg-emerald-100 text-xs"
                >
                  {copied ? (
                    <>
                      <Check className="me-1.5 size-3.5" /> تم النسخ!
                    </>
                  ) : (
                    <>
                      <Copy className="me-1.5 size-3.5" /> نسخ النص
                    </>
                  )}
                </Button>
              </div>
              <p
                dir="ltr"
                className="mt-4 text-sm font-sans leading-relaxed text-ink bg-card/80 p-4 rounded-2xl border border-emerald-200/50"
              >
                {activeResult.correctedText}
              </p>
            </div>

            {/* Diagnosed Weaknesses & Recommendations */}
            <div className="space-y-4">
              <h3 className="text-lg font-extrabold text-ink flex items-center gap-2">
                <AlertCircle className="size-5 text-amber-500" />
                تشخيص نقاط ضعفك المحددة وكيف تعالجها ({activeResult.weaknesses.length})
              </h3>

              {activeResult.weaknesses.length === 0 ? (
                <div className="rounded-2xl border border-line bg-card p-6 text-center text-sm text-ink-soft">
                  ما شاء الله! النص ممتاز وخالي من الأخطاء الواضحة. استمر في التدرب على نصوص متقدمة.
                </div>
              ) : (
                activeResult.weaknesses.map((w, idx) => (
                  <div
                    key={w.id}
                    className="rounded-3xl border border-line bg-card p-6 space-y-4 shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 font-bold px-2.5 py-0.5 text-xs">
                            نقطة ضعف #{idx + 1}
                          </span>
                          <h4 className="text-base font-bold text-ink">{w.title}</h4>
                        </div>
                        <p className="mt-2 text-sm text-ink-soft leading-relaxed">
                          {w.description}
                        </p>
                      </div>
                    </div>

                    {w.suggestedFix && (
                      <div className="rounded-2xl bg-paper-deep/60 p-3 text-xs text-ink leading-relaxed border border-line/60">
                        <span className="font-bold text-iris">💡 كيف تصلحها: </span>
                        {w.suggestedFix}
                      </div>
                    )}

                    <div className="grid gap-3 sm:grid-cols-2 pt-2 border-t border-line/60">
                      {/* Book & Practical Tip */}
                      <div className="rounded-2xl border border-indigo-200/60 bg-indigo-50/40 dark:bg-indigo-950/20 p-3.5 text-xs">
                        <span className="font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5 mb-1">
                          <BookOpen className="size-4" /> كتاب ونصيحة مرشحة لك:
                        </span>
                        <p className="font-semibold text-ink">
                          {w.recommendedBook.title} — {w.recommendedBook.author}
                        </p>
                        <p className="mt-1 text-ink-soft">{w.recommendedBook.chapterOrTip}</p>
                      </div>

                      {/* Where to go on Link Me */}
                      <div className="rounded-2xl border border-iris/30 bg-iris-soft/40 p-3.5 text-xs flex flex-col justify-between gap-2">
                        <div>
                          <span className="font-bold text-iris flex items-center gap-1.5 mb-1">
                            <Compass className="size-4" /> روح فين في Link Me عشان تعالجها:
                          </span>
                          <p className="font-semibold text-ink">
                            {w.recommendedResource.title}
                          </p>
                        </div>
                        <Button
                          asChild
                          size="sm"
                          className="rounded-full bg-iris text-white hover:bg-iris-deep w-fit text-xs font-bold"
                        >
                          <Link href={w.recommendedResource.url}>
                            افتح التدريب الآن <ArrowLeft className="ms-1 size-3.5" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* History / Portfolio Drawer or Section */}
        {showHistory && (
          <div className="mt-10 rounded-3xl border border-line bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-line">
              <h3 className="text-lg font-bold text-ink flex items-center gap-2">
                <History className="size-5 text-iris" />
                سجل مقالاتك وتقدّم مستواك في الكتابة ({history.length})
              </h3>
              {history.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (window.confirm("تحب تمسح سجل المقالات؟")) {
                      localStorage.removeItem(STORAGE_KEY);
                      setHistory([]);
                      toast.info("تم مسح السجل");
                    }
                  }}
                  className="rounded-full text-xs text-coral hover:text-coral-deep"
                >
                  مسح السجل
                </Button>
              )}
            </div>

            {history.length === 0 ? (
              <p className="py-8 text-center text-sm text-ink-soft">
                لسه ما حفظتش أي مقال هنا. اكتب مقالك فوق واضغط "صحّح واكشف نقاط ضعفي" وهيتحفظ في ملفك تلقائيًا!
              </p>
            ) : (
              <div className="mt-4 divide-y divide-line/60">
                {history.map((item, i) => (
                  <div
                    key={item.id || i}
                    className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-iris/15 text-iris text-xs font-bold px-2 py-0.5">
                          {item.estimatedLevel}
                        </span>
                        <span className="text-xs font-bold text-ink">
                          الدرجة: {item.overallScore}/100
                        </span>
                        <span className="text-xs text-ink-soft">· {item.wordCount} كلمة</span>
                        <span className="text-xs text-ink-soft">· {item.timestamp}</span>
                      </div>
                      <p
                        dir="ltr"
                        className="mt-1.5 text-xs text-ink-soft line-clamp-1 font-sans"
                      >
                        {item.originalText}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setActiveResult(item);
                        setInputText(item.originalText);
                        window.scrollTo({ top: 300, behavior: "smooth" });
                      }}
                      className="rounded-full text-xs shrink-0"
                    >
                      عرض التقرير
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>
    </PageShell>
  );
}
