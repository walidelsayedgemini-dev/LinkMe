import { useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, Check, RotateCcw } from "lucide-react";
const OPTIONS = ["go", "goes", "going"];
export function LearningPreview() {
  const [selected, setSelected] = useState<number | null>(null);
  return (
    <div className="rounded-3xl border border-line bg-card p-6 sm:p-8">
      <p className="mb-3 text-xs font-semibold text-iris">
        جرّبها بنفسك · تدريب قواعد قصير
      </p>
      <h2 className="text-2xl leading-snug text-ink sm:text-3xl">
        افهم القاعدة، <span className="hl-word">واستخدمها.</span>
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-ink-soft">
        بدل ما تحفظ، كمّل موقف بسيط من يومك. اختار الإجابة وشوف السبب فورًا.
      </p>
      <p
        dir="ltr"
        className="latin mt-6 rounded-xl bg-paper p-4 text-center text-lg text-ink"
      >
        She <span className="font-bold text-iris">___</span> to work every day.
      </p>
      <div dir="ltr" className="mt-4 grid grid-cols-3 gap-3">
        {OPTIONS.map((answer, index) => (
          <button
            key={answer}
            onClick={() => setSelected(index)}
            aria-pressed={selected === index}
            className={`latin rounded-xl border px-3 py-3 text-sm font-semibold transition-colors ${selected === index ? "border-iris bg-iris-soft text-ink" : "border-line text-ink hover:border-iris"}`}
          >
            {answer}
          </button>
        ))}
      </div>
      <div
        aria-live="polite"
        className="mt-4 min-h-24 rounded-xl bg-paper p-4 text-sm leading-relaxed text-ink-soft"
      >
        {selected === null ? (
          "اختار إجابة. هنا بنجرّب من غير ضغط، والغلط جزء من التعلّم."
        ) : selected === 1 ? (
          <>
            <Check className="me-2 inline size-4 text-iris" />
            صح! بنقول <b dir="ltr">She goes</b>. في المضارع البسيط، مع he / she
            / it بنضيف s أو es للفعل. كلمة every day معناها عادة يومية.
          </>
        ) : (
          <>
            جرّب تاني! every day بتشير لعادة يومية. مع She بنستخدم الفعل مع s أو
            es؛ الإجابة الصحيحة هي <b dir="ltr">goes</b>.
          </>
        )}
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={() => setSelected(null)}
          className="inline-flex items-center gap-2 text-xs text-ink-soft"
        >
          <RotateCcw className="size-3.5" />
          جرّب مرة تانية
        </button>
        <Link
          href="/courses?category=grammar"
          className="inline-flex items-center gap-2 text-sm font-semibold text-iris"
        >
          كمّل مع كورسات القواعد
          <ArrowLeft className="size-4" />
        </Link>
      </div>
    </div>
  );
}
