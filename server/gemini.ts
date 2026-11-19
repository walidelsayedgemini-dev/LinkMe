/**
 * Google Gemini AI Integration for Link Me
 * Powers automated writing evaluation, detailed weakness diagnosis, and pronunciation coaching.
 */

const GEMINI_MODEL = "gemini-3.8-flash";

function getApiKey(): string | undefined {
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
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

export async function evaluateWritingWithGemini(
  text: string,
  promptTopic?: string
): Promise<WritingAiAnalysis | null> {
  const apiKey = getApiKey();
  if (!apiKey) return null;

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

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: "application/json",
          },
        }),
      }
    );

    if (!response.ok) {
      console.warn(
        `[Gemini AI] API error ${response.status}:`,
        await response.text().catch(() => "")
      );
      return null;
    }

    const data = await response.json();
    const rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawContent) return null;

    const parsed = JSON.parse(rawContent.trim());
    return {
      ...parsed,
      wordCount: text.trim().split(/\s+/).filter(Boolean).length,
    };
  } catch (error) {
    console.warn("[Gemini AI] Failed to evaluate writing:", error);
    return null;
  }
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
): Promise<PronunciationAiAnalysis | null> {
  const apiKey = getApiKey();
  if (!apiKey) return null;

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

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: "application/json",
          },
        }),
      }
    );

    if (!response.ok) return null;
    const data = await response.json();
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!raw) return null;
    return JSON.parse(raw.trim());
  } catch {
    return null;
  }
}
