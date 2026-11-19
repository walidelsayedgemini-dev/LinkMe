/**
 * Google Gemini AI Integration for Link Me
 * Powers automated writing evaluation, detailed weakness diagnosis, and pronunciation coaching.
 */

// Primary model requested by configuration, with automatic fallback if Google returns 404 (deprecation)
export const DEFAULT_PRIMARY_MODEL = "gemini-2.5-flash";
export const BACKUP_MODELS = [
  "gemini-3.1-flash-lite",
  "gemini-3.5-flash-lite",
  "gemini-3.8-flash",
  "gemini-3-flash-preview",
];

export function getApiKeyDetails(): { key?: string; masked: string; isConfigured: boolean } {
  const raw = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
  if (!raw || !raw.trim()) {
    return { key: undefined, masked: "NOT_SET", isConfigured: false };
  }
  const trimmed = raw.trim();
  const masked =
    trimmed.length > 10
      ? `${trimmed.substring(0, 8)}...${trimmed.substring(trimmed.length - 4)}`
      : "SET (SHORT)";
  return { key: trimmed, masked, isConfigured: true };
}

export type WritingAiAnalysis = {
  correctedText: string;
  estimatedLevel: "A1" | "A2" | "B1" | "B2" | "C1";
  overallScore: number;
  wordCount: number;
  scores: {
    grammar: number;
    vocabulary: number;
    coherence: number;
    style: number;
  };
  overview: string;
  weaknesses: {
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
  }[];
  encouragement: string;
};

export type GeminiEvaluationOutcome = {
  success: boolean;
  data?: WritingAiAnalysis;
  modelUsed?: string;
  attemptedModels: string[];
  apiKeyStatus: {
    isConfigured: boolean;
    masked: string;
  };
  errors: { model: string; status?: number; message: string }[];
};

/**
 * Call Google Gemini generateContent API with timeout and robust error reporting
 */
async function callGeminiGenerateContent(
  model: string,
  apiKey: string,
  prompt: string,
  timeoutMs = 12000
): Promise<{ ok: boolean; status: number; text?: string; error?: string }> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      let parsedMsg = errText;
      try {
        const errJson = JSON.parse(errText);
        parsedMsg = errJson.error?.message || errText;
      } catch {
        // use raw errText
      }
      return {
        ok: false,
        status: response.status,
        error: `HTTP ${response.status}: ${parsedMsg}`,
      };
    }

    const data = await response.json();
    const rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawContent) {
      return {
        ok: false,
        status: response.status,
        error: "Empty candidates/parts returned by Gemini API",
      };
    }

    return {
      ok: true,
      status: response.status,
      text: rawContent,
    };
  } catch (err: any) {
    clearTimeout(timer);
    const msg = err.name === "AbortError" ? `Timeout after ${timeoutMs}ms` : err.message || String(err);
    return {
      ok: false,
      status: 0,
      error: `Network/Fetch Error: ${msg}`,
    };
  }
}

export async function evaluateWritingWithGemini(
  text: string,
  promptTopic?: string
): Promise<GeminiEvaluationOutcome> {
  const keyInfo = getApiKeyDetails();
  const attemptedModels: string[] = [];
  const errors: { model: string; status?: number; message: string }[] = [];

  if (!keyInfo.isConfigured || !keyInfo.key) {
    const errorMsg =
      "مفتاح GEMINI_API_KEY غير موجود في متغيرات البيئة (process.env.GEMINI_API_KEY is undefined or empty).";
    console.error(`[Gemini AI] ${errorMsg}`);
    return {
      success: false,
      attemptedModels: [],
      apiKeyStatus: { isConfigured: false, masked: "NOT_SET" },
      errors: [{ model: "none", status: 401, message: errorMsg }],
    };
  }

  const prompt = `You are an elite, encouraging ESL English Teacher and Examiner at Link Me (a premier English learning academy for Arab and Egyptian students).
Evaluate the following student writing submission:

"""
${text}
"""
${promptTopic ? `Topic/Context: "${promptTopic}"` : ""}

Respond strictly with a JSON object (no markdown, no backticks, just raw JSON) matching this exact schema:
{
  "correctedText": "The fully polished and grammatically correct English version with natural phrasing and appropriate connectors",
  "estimatedLevel": "A1" | "A2" | "B1" | "B2" | "C1",
  "overallScore": number (0 to 100),
  "scores": {
    "grammar": number (0 to 100),
    "vocabulary": number (0 to 100),
    "coherence": number (0 to 100),
    "style": number (0 to 100)
  },
  "overview": "Short encouraging evaluation in friendly Egyptian Arabic explaining strengths and general impression",
  "weaknesses": [
    {
      "id": "unique_string",
      "category": "grammar" | "vocabulary" | "cohesion" | "style",
      "title": "Short Arabic title of the weakness point (e.g. أزمنة الأفعال الماضي vs التام)",
      "description": "Clear explanation in Egyptian Arabic explaining why this is a mistake and how native speakers say it",
      "exampleInText": "Quote from student text where this occurred",
      "suggestedFix": "Concrete correction rule and improved example",
      "recommendedResource": {
        "title": "Targeted Link Me course or tool (e.g. كورس أساسيات القواعد: درس الأزمنة or فلاش كاردز B1)",
        "type": "course" | "flashcards" | "roleplay",
        "url": "/courses/english-grammar-foundations" | "/flashcards?deck=b1" | "/roleplay" | "/path"
      },
      "recommendedBook": {
        "title": "Standard accredited ESL Book (e.g. English Grammar in Use)",
        "author": "Author name (e.g. Raymond Murphy)",
        "chapterOrTip": "Specific unit or tip (e.g. راجع الوحدات 7-14 الخاصة بالأزمنة التامة)"
      }
    }
  ],
  "encouragement": "Inspiring closing remark in Egyptian Arabic motivating the student to keep writing"
}`;

  // Primary model requested by the user: gemini-2.5-flash
  // Followed by active fallback models if Google returns 404 (deprecation) or errors
  const configuredPrimary = process.env.GEMINI_MODEL || DEFAULT_PRIMARY_MODEL;
  const candidateModels = [
    configuredPrimary,
    ...BACKUP_MODELS.filter((m) => m !== configuredPrimary),
  ];

  for (const model of candidateModels) {
    attemptedModels.push(model);
    console.log(`[Gemini AI] Trying model "${model}" with key ${keyInfo.masked}...`);

    const result = await callGeminiGenerateContent(model, keyInfo.key, prompt, 14000);

    if (result.ok && result.text) {
      try {
        const parsed = JSON.parse(result.text.trim());
        const data: WritingAiAnalysis = {
          ...parsed,
          wordCount: text.trim().split(/\s+/).filter(Boolean).length,
        };

        console.log(`[Gemini AI] Success using model "${model}"!`);
        return {
          success: true,
          data,
          modelUsed: model,
          attemptedModels,
          apiKeyStatus: { isConfigured: true, masked: keyInfo.masked },
          errors,
        };
      } catch (parseErr: any) {
        const msg = `JSON parse failed for model ${model}: ${parseErr.message}`;
        console.warn(`[Gemini AI] ${msg}`);
        errors.push({ model, message: msg });
      }
    } else {
      const msg = result.error || "Unknown API error";
      console.warn(`[Gemini AI] Model ${model} failed (${msg})`);
      errors.push({ model, status: result.status, message: msg });
    }
  }

  // If all models failed
  return {
    success: false,
    attemptedModels,
    apiKeyStatus: { isConfigured: true, masked: keyInfo.masked },
    errors,
  };
}

export type PronunciationAiAnalysis = {
  score: number;
  accuracyRate: number;
  fluencyScore: number;
  detectedErrors: string[];
  phoneticTips: string[];
  feedbackAr: string;
};

export async function evaluatePronunciationWithGemini(
  expectedText: string,
  spokenText: string
): Promise<{
  success: boolean;
  data?: PronunciationAiAnalysis;
  modelUsed?: string;
  error?: string;
}> {
  const keyInfo = getApiKeyDetails();
  if (!keyInfo.isConfigured || !keyInfo.key) {
    return {
      success: false,
      error: "process.env.GEMINI_API_KEY is not configured",
    };
  }

  const prompt = `You are a native English speech coach at Link Me.
A student practiced speaking the following target sentence:
Expected: "${expectedText}"
Speech recognition transcribed their voice as: "${spokenText}"

Analyze their pronunciation accuracy, missing or mispronounced words, and give warm, actionable speech coaching tips in Egyptian Arabic.
Respond strictly with a JSON object (raw JSON, no markdown):
{
  "score": number (0 to 100),
  "accuracyRate": number (0 to 100),
  "fluencyScore": number (0 to 100),
  "detectedErrors": ["word or sound error 1", "word or sound error 2"],
  "phoneticTips": ["Actionable tip 1 in Arabic for mouth/tongue position", "Tip 2"],
  "feedbackAr": "Warm motivational feedback in Egyptian Arabic explaining how to sound natural"
}`;

  const configuredPrimary = process.env.GEMINI_MODEL || DEFAULT_PRIMARY_MODEL;
  const candidateModels = [
    configuredPrimary,
    ...BACKUP_MODELS.filter((m) => m !== configuredPrimary),
  ];

  for (const model of candidateModels) {
    const result = await callGeminiGenerateContent(model, keyInfo.key, prompt, 10000);
    if (result.ok && result.text) {
      try {
        const parsed = JSON.parse(result.text.trim());
        return {
          success: true,
          data: parsed,
          modelUsed: model,
        };
      } catch {
        continue;
      }
    }
  }

  return {
    success: false,
    error: "All Gemini speech models failed",
  };
}
