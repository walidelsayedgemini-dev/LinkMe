import { useState } from "react";
import { Volume2, VolumeX, Printer, CheckCircle2, XCircle, Sparkles, Zap, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { soundEffects } from "@/lib/sound-effects";
import { triggerConfetti } from "@/lib/confetti";
import { cn } from "@/lib/utils";

interface LessonInteractiveFeaturesProps {
  lessonTitle: string;
  courseTitle: string;
  content: string;
  onQuizPassed?: () => void;
}

export function LessonAudioController({ content }: { content: string }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<number>(1.0);

  // Extract English sentences from content (lines with English letters)
  const englishPhrases = content
    .split("\n")
    .map(line => line.replace(/^[#*|\s-]+/, "").trim())
    .filter(line => /[a-zA-Z]{3,}/.test(line) && !line.startsWith("http"));

  const handleSpeak = (text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    if (isPlaying) {
      setIsPlaying(false);
      return;
    }

    const toSpeak = text || englishPhrases.slice(0, 5).join(". ");
    const utter = new SpeechSynthesisUtterance(toSpeak);
    utter.lang = "en-US";
    utter.rate = speed;
    utter.onstart = () => setIsPlaying(true);
    utter.onend = () => setIsPlaying(false);
    utter.onerror = () => setIsPlaying(false);
    window.speechSynthesis.speak(utter);
  };

  const handleStop = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    setIsPlaying(false);
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-iris/25 bg-iris/5 p-3 dark:bg-iris/10">
      <div className="flex items-center gap-2.5">
        <div className="grid size-9 place-items-center rounded-xl bg-iris text-white shadow-xs">
          <Volume2 className="size-4" />
        </div>
        <div>
          <p className="text-xs font-bold text-ink">مساعد النطق الصوتي للدرس</p>
          <p className="text-[11px] text-ink-soft">استمع لنطق التعبيرات والمحادثات بلكنة أمريكية واضحة</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Speed selector */}
        <div className="flex items-center rounded-full border border-line bg-card p-0.5 text-xs font-bold">
          {[
            { label: "0.8x 🐢", val: 0.8 },
            { label: "1.0x 🗣️", val: 1.0 },
            { label: "1.2x ⚡", val: 1.2 },
          ].map(s => (
            <button
              key={s.val}
              type="button"
              onClick={() => setSpeed(s.val)}
              className={cn(
                "rounded-full px-2 py-0.5 transition-colors",
                speed === s.val ? "bg-iris text-white" : "text-ink-soft hover:text-ink"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>

        <Button
          size="sm"
          type="button"
          onClick={() => (isPlaying ? handleStop() : handleSpeak(englishPhrases.slice(0, 6).join(". ")))}
          className={cn(
            "h-8 rounded-full text-xs font-bold shadow-xs",
            isPlaying ? "bg-rose-600 hover:bg-rose-700 text-white" : "bg-iris hover:bg-iris-deep text-white"
          )}
        >
          {isPlaying ? (
            <>
              <VolumeX className="size-3.5 me-1" /> إيقاف
            </>
          ) : (
            <>
              <Volume2 className="size-3.5 me-1" /> استمع للدرس
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

export function LessonPrintCheatSheet({
  lessonTitle,
  courseTitle,
}: {
  lessonTitle: string;
  courseTitle: string;
}) {
  const handlePrint = () => {
    if (typeof window === "undefined") return;
    window.print();
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handlePrint}
      className="h-9 rounded-full border-line hover:border-iris text-xs font-bold gap-1.5"
      title="طباعة أو حفظ ملخص الدرس بصيغة PDF للرجوع إليه بدون إنترنت"
    >
      <Printer className="size-3.5 text-iris" />
      <span>ملخص الدرس (PDF / طباعة) 📄</span>
    </Button>
  );
}

export function LessonQuickQuiz({
  lessonTitle,
  content,
  onPassed,
}: {
  lessonTitle: string;
  content: string;
  onPassed?: () => void;
}) {
  // Generate a tailored 2-question quiz based on the lesson context
  const isBusiness = content.includes("تفاوض") || content.includes("email") || content.includes("Meeting") || content.includes("Client");
  const isGrammar = content.includes("زمن") || content.includes("Tense") || content.includes("قاعدة") || content.includes("verb");
  const isTravel = content.includes("مطار") || content.includes("فندق") || content.includes("Flight") || content.includes("Hotel");

  const questions = isBusiness
    ? [
        {
          q: "What is the most polite and professional way to follow up on an email?",
          options: [
            { text: "Just following up on my previous email regarding our project.", isCorrect: true },
            { text: "Why haven't you answered my email yet?", isCorrect: false },
            { text: "Check your inbox now please.", isCorrect: false },
          ],
        },
        {
          q: "When negotiating, which phrase shows openness to compromise?",
          options: [
            { text: "Take it or leave it.", isCorrect: false },
            { text: "We might be able to meet in the middle if we adjust the timeline.", isCorrect: true },
            { text: "This is impossible for us.", isCorrect: false },
          ],
        },
      ]
    : isGrammar
    ? [
        {
          q: "Which sentence correctly expresses an ongoing action right now?",
          options: [
            { text: "I am currently practicing my English conversation.", isCorrect: true },
            { text: "I practice now conversation.", isCorrect: false },
            { text: "I was practice right now.", isCorrect: false },
          ],
        },
        {
          q: "Which word best completes: 'She has lived in Cairo ___ three years'?",
          options: [
            { text: "since", isCorrect: false },
            { text: "for", isCorrect: true },
            { text: "during", isCorrect: false },
          ],
        },
      ]
    : isTravel
    ? [
        {
          q: "How do you naturally ask for a window seat at airport check-in?",
          options: [
            { text: "Could I please get a window seat if one is available?", isCorrect: true },
            { text: "Give me window place now.", isCorrect: false },
            { text: "I want to look outside the plane.", isCorrect: false },
          ],
        },
        {
          q: "At hotel reception, what is the best phrase to request late checkout?",
          options: [
            { text: "Is it possible to request a late checkout tomorrow?", isCorrect: true },
            { text: "I will leave late tomorrow bye.", isCorrect: false },
            { text: "Don't kick me out early.", isCorrect: false },
          ],
        },
      ]
    : [
        {
          q: "What is the best native response when someone asks: 'How are you doing today?'",
          options: [
            { text: "Doing great, thanks! How about yourself?", isCorrect: true },
            { text: "I am fine thank you and you.", isCorrect: false },
            { text: "Yes I do.", isCorrect: false },
          ],
        },
        {
          q: "How do you naturally invite a colleague or friend for a quick coffee?",
          options: [
            { text: "Are you free to grab a quick coffee this afternoon?", isCorrect: true },
            { text: "Drink coffee with me now.", isCorrect: false },
            { text: "Go to cafe quickly.", isCorrect: false },
          ],
        },
      ];

  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [passed, setPassed] = useState(false);

  const handleSelect = (qIdx: number, oIdx: number) => {
    if (submitted) return;
    setSelectedAnswers(prev => ({ ...prev, [qIdx]: oIdx }));
  };

  const checkAnswers = () => {
    let allCorrect = true;
    for (let i = 0; i < questions.length; i++) {
      const selected = selectedAnswers[i];
      if (selected === undefined || !questions[i].options[selected].isCorrect) {
        allCorrect = false;
        break;
      }
    }

    setSubmitted(true);
    setPassed(allCorrect);

    if (allCorrect) {
      soundEffects.playCorrect();
      triggerConfetti(2000);
      onPassed?.();
    } else {
      soundEffects.playIncorrect();
    }
  };

  const handleRetry = () => {
    setSelectedAnswers({});
    setSubmitted(false);
    setPassed(false);
  };

  return (
    <div className="rounded-3xl border border-iris/25 bg-gradient-to-br from-card via-paper to-iris/5 p-5 sm:p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
        <div className="flex items-center gap-2">
          <div className="grid size-8 place-items-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
            <HelpCircle className="size-4" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-ink">تحدي الفهم السريع للدرس (2 أسئلة)</h3>
            <p className="text-[11px] text-ink-soft">اختبر استيعابك للنقاط الأساسية قبل إكمال الدرس واحصل على +30 XP ⚡</p>
          </div>
        </div>
        {passed && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="size-3.5" /> أحسنت! إجابات صحيحة 100%
          </span>
        )}
      </div>

      <div className="mt-4 space-y-4">
        {questions.map((q, qIdx) => (
          <div key={qIdx} className="space-y-2">
            <p className="text-xs font-bold text-ink leading-relaxed">
              <span className="latin text-iris font-black me-1">{qIdx + 1}.</span> {q.q}
            </p>
            <div className="grid gap-2">
              {q.options.map((opt, oIdx) => {
                const isSelected = selectedAnswers[qIdx] === oIdx;
                const isCorrect = opt.isCorrect;
                return (
                  <button
                    key={oIdx}
                    type="button"
                    onClick={() => handleSelect(qIdx, oIdx)}
                    disabled={submitted && passed}
                    className={cn(
                      "flex items-center justify-between rounded-xl border p-2.5 text-xs text-start transition-all",
                      isSelected
                        ? submitted
                          ? isCorrect
                            ? "border-emerald-500 bg-emerald-50/70 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"
                            : "border-rose-500 bg-rose-50/70 text-rose-900 dark:bg-rose-950/40 dark:text-rose-200"
                          : "border-iris bg-iris/10 text-iris font-bold"
                        : "border-line bg-card/80 text-ink-soft hover:border-iris/40 hover:text-ink"
                    )}
                  >
                    <span>{opt.text}</span>
                    {submitted && isSelected && (
                      isCorrect ? (
                        <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                      ) : (
                        <XCircle className="size-4 text-rose-600 shrink-0" />
                      )
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-line flex items-center justify-between">
        {!submitted ? (
          <Button
            size="sm"
            type="button"
            onClick={checkAnswers}
            disabled={Object.keys(selectedAnswers).length < questions.length}
            className="rounded-full bg-iris hover:bg-iris-deep text-white text-xs font-bold px-4 shadow-sm"
          >
            تأكيد الإجابات واحتساب الـ XP 🎯
          </Button>
        ) : passed ? (
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <Sparkles className="size-4" /> تم فتح علامة إكمال الدرس بنجاح!
          </div>
        ) : (
          <div className="flex items-center justify-between w-full">
            <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold">
              راجع إجابتك الخاطئة وجرّب مرة ثانية لتحصل على الدرجة الكاملة!
            </p>
            <Button
              size="sm"
              type="button"
              variant="outline"
              onClick={handleRetry}
              className="rounded-full text-xs font-bold"
            >
              حاول مرة تانية 🔄
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
