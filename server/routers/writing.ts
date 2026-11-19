import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, router } from "../_core/trpc";
import {
  DEFAULT_PRIMARY_MODEL,
  evaluatePronunciationWithGemini,
  evaluateSpeechAudioWithGemini,
  evaluateWritingWithGemini,
  getApiKeyDetails,
} from "../gemini";

export const writingRouter = router({
  /**
   * Diagnostic check to verify process.env.GEMINI_API_KEY and model availability
   */
  checkGeminiStatus: publicProcedure.query(async () => {
    const keyDetails = getApiKeyDetails();
    if (!keyDetails.isConfigured || !keyDetails.key) {
      return {
        configured: false,
        keyMasked: "NOT_SET",
        primaryModel: process.env.GEMINI_MODEL || DEFAULT_PRIMARY_MODEL,
        message: "process.env.GEMINI_API_KEY is undefined on this server.",
      };
    }

    // Ping check with gemini-2.5-flash (primary) and backup
    const testModel = process.env.GEMINI_MODEL || DEFAULT_PRIMARY_MODEL;
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${testModel}:generateContent?key=${keyDetails.key}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: "ping" }] }],
          }),
          signal: AbortSignal.timeout(5000),
        }
      );

      const errText = !res.ok ? await res.text().catch(() => "") : "";
      return {
        configured: true,
        keyMasked: keyDetails.masked,
        primaryModel: testModel,
        status: res.status,
        ok: res.ok,
        details: res.ok ? "Connected successfully" : errText,
      };
    } catch (err: any) {
      return {
        configured: true,
        keyMasked: keyDetails.masked,
        primaryModel: testModel,
        status: 0,
        ok: false,
        details: err.message || String(err),
      };
    }
  }),

  evaluate: publicProcedure
    .input(
      z.object({
        text: z.string().trim().min(5, "اكتب 5 كلمات على الأقل").max(30000),
        promptTopic: z.string().trim().max(300).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const outcome = await evaluateWritingWithGemini(input.text, input.promptTopic);

      if (outcome.success && outcome.data) {
        return {
          source: outcome.modelUsed || "gemini",
          isAi: true,
          modelUsed: outcome.modelUsed,
          attemptedModels: outcome.attemptedModels,
          apiKeyMasked: outcome.apiKeyStatus.masked,
          realErrors: outcome.errors,
          errorReason: null,
          ...outcome.data,
        };
      }

      // Fallback with full real error diagnostics
      const words = input.text.trim().split(/\s+/).filter(Boolean);
      const wordCount = words.length;

      const primaryError =
        outcome.errors.find((e) => e.status === 404)?.message ||
        outcome.errors[0]?.message ||
        (outcome.apiKeyStatus.isConfigured
          ? "فشل الاتصال بـ Google Gemini لجميع الموديلات المتاحة."
          : "process.env.GEMINI_API_KEY غير موجود في بيئة التشغيل على السيرفر (undefined).");

      return {
        source: "engine",
        isAi: false,
        modelUsed: null,
        attemptedModels: outcome.attemptedModels,
        apiKeyMasked: outcome.apiKeyStatus.masked,
        realErrors: outcome.errors,
        errorReason: primaryError,
        correctedText: input.text
          .replace(/\bi was go\b/gi, "I went")
          .replace(/\bthey was\b/gi, "they were"),
        estimatedLevel: (wordCount > 60 ? "B2" : wordCount > 30 ? "B1" : "A2") as
          | "A1"
          | "A2"
          | "B1"
          | "B2"
          | "C1",
        overallScore: 78,
        wordCount,
        scores: {
          grammar: 76,
          vocabulary: 75,
          coherence: 74,
          style: 78,
        },
        overview: `تم استخدام المحرك الاحتياطي؛ سبب عدم استجابة الذكاء الاصطناعي: ${primaryError}`,
        weaknesses: [
          {
            id: "tenses_check",
            category: "grammar" as const,
            title: "تناسق الأزمنة (Tense Consistency)",
            description: "تأكد من استخدام زمن موحد عند سرد أحداث حدثت في الماضي.",
            suggestedFix: "راجع تصريف الأفعال الشاذة واستخدام الماضي البسيط.",
            recommendedResource: {
              title: "كورس أساسيات القواعد",
              type: "course" as const,
              url: "/courses/english-grammar-foundations",
            },
            recommendedBook: {
              title: "English Grammar in Use",
              author: "Raymond Murphy",
              chapterOrTip: "الوحدات 5-10: Past Simple vs Present Perfect",
            },
          },
        ],
        encouragement: "استمر في الكتابة؛ الممارسة اليومية هي سر الطلاقة الحقيقية!",
      };
    }),

  evaluatePronunciation: publicProcedure
    .input(
      z.object({
        expectedText: z.string().trim().min(2).max(1000),
        spokenText: z.string().trim().min(1).max(1000),
      })
    )
    .mutation(async ({ input }) => {
      const outcome = await evaluatePronunciationWithGemini(
        input.expectedText,
        input.spokenText
      );
      if (outcome.success && outcome.data) {
        return {
          source: outcome.modelUsed || "gemini",
          isAi: true,
          ...outcome.data,
        };
      }

      // Heuristic fallback
      const expWords = input.expectedText.toLowerCase().split(/\s+/);
      const spkWords = input.spokenText.toLowerCase().split(/\s+/);
      const matched = expWords.filter((w) => spkWords.includes(w)).length;
      const accuracy = Math.round((matched / Math.max(1, expWords.length)) * 100);

      return {
        source: "engine",
        isAi: false,
        score: Math.max(60, accuracy),
        accuracyRate: accuracy,
        fluencyScore: 80,
        detectedErrors: expWords.filter((w) => !spkWords.includes(w)),
        phoneticTips: [
          "احرص على إخراج أصوات الحروف اللثوية مثل TH في 'the' و 'think'",
          "ركز على التشديد (Word Stress) في المقاطع الأولى",
        ],
        feedbackAr: "نطق واضح ومفهوم جداً! ركز على نطق الكلمات بسلاسة وبدون تقطيع بين الكلمة والتي تليها.",
      };
    }),

  /**
   * Multimodal Audio Evaluation: Student records speech -> analyzed directly by Gemini
   * Evaluates pronunciation, fluency, grammar, phonetics, and provides actionable tips.
   * NO FAKE FALLBACK DATA.
   */
  evaluateAudioSpeech: publicProcedure
    .input(
      z.object({
        audioBase64: z.string().min(50, "ملف الصوت غير صالح أو فارغ"),
        mimeType: z.string().default("audio/webm"),
        targetPhrase: z.string().trim().max(1000).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const outcome = await evaluateSpeechAudioWithGemini(
        input.audioBase64,
        input.mimeType,
        input.targetPhrase
      );

      if (outcome.success && outcome.data) {
        return {
          success: true,
          source: outcome.modelUsed || "gemini",
          modelUsed: outcome.modelUsed,
          ...outcome.data,
        };
      }

      // No fake fallback! Throw clear error with exact cause
      const primaryError =
        outcome.errors.find((e) => e.status === 404)?.message ||
        outcome.errors[0]?.message ||
        "تعذر تحليل التسجيل الصوتي عبر Google Gemini API.";

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: primaryError,
        cause: outcome.errors,
      });
    }),
});
