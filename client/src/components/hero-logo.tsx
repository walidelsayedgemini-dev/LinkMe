import { useEffect, useRef } from "react";
import {
  ArrowUpLeft,
  BookOpen,
  BriefcaseBusiness,
  MessageCircle,
  Target,
} from "lucide-react";
import { Link } from "wouter";
import { LogoMark, LogoWord } from "@/components/brand";

const SKILLS = [
  {
    name: "Speaking",
    arabic: "اتكلم بثقة",
    href: "/courses?category=speaking",
    icon: MessageCircle,
  },
  {
    name: "Grammar",
    arabic: "افهم القاعدة",
    href: "/courses?category=grammar",
    icon: BookOpen,
  },
  {
    name: "IELTS",
    arabic: "جهّز لامتحانك",
    href: "/courses?category=ielts",
    icon: Target,
  },
  {
    name: "Business",
    arabic: "اتكلم في شغلك",
    href: "/courses?category=business",
    icon: BriefcaseBusiness,
  },
];

/** Only the mark tilts. Links never share its transform or stacking layer. */
export function HeroLogo() {
  const stage = useRef<HTMLDivElement>(null);
  const mark = useRef<HTMLDivElement>(null);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const el = stage.current;
    const targetEl = mark.current;
    if (
      !el ||
      !targetEl ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    let frame = 0;
    let targetX = 0;
    let targetY = 0;
    let x = 0;
    let y = 0;
    const tick = () => {
      x += (targetX - x) * 0.13;
      y += (targetY - y) * 0.13;
      targetEl.style.transform = `rotateX(${y.toFixed(3)}deg) rotateY(${x.toFixed(3)}deg)`;
      if (Math.abs(targetX - x) + Math.abs(targetY - y) > 0.015)
        frame = requestAnimationFrame(tick);
      else frame = 0;
    };
    const start = () => {
      if (!frame) frame = requestAnimationFrame(tick);
    };
    const move = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const rect = el.getBoundingClientRect();
      targetX = ((event.clientX - rect.left) / rect.width - 0.5) * 12;
      targetY = -((event.clientY - rect.top) / rect.height - 0.5) * 10;
      start();
    };
    const reset = () => {
      targetX = 0;
      targetY = 0;
      start();
    };
    el.addEventListener("pointermove", move, { passive: true });
    el.addEventListener("pointerleave", reset);
    return () => {
      cancelAnimationFrame(frame);
      if (tapTimer.current) clearTimeout(tapTimer.current);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", reset);
    };
  }, []);

  return (
    <div className="learning-stage" ref={stage}>
      <div className="learning-stage-grid" aria-hidden="true" />
      <span className="stage-label">
        <span className="stage-dot" /> YOUR NEXT CHAPTER
      </span>
      <div className="learning-orbit" aria-hidden="true">
        <span />
        <span />
      </div>
      <button
        type="button"
        className="learning-mark-button"
        aria-label="حرّك لوجو Link Me"
        onClick={() => {
          if (!mark.current) return;
          mark.current.classList.add("mark-tapped");
          if (tapTimer.current) clearTimeout(tapTimer.current);
          tapTimer.current = setTimeout(
            () => mark.current?.classList.remove("mark-tapped"),
            480
          );
        }}
      >
        <div className="learning-mark-tilt" ref={mark}>
          <div className="learning-mark-float">
            <LogoMark className="learning-mark-svg" />
          </div>
        </div>
      </button>
      <div className="learning-skill-grid">
        {SKILLS.map(({ name, arabic, href, icon: Icon }) => (
          <Link href={href} key={name} className="learning-skill">
            <Icon className="size-4" strokeWidth={1.8} />
            <span>
              <span className="latin block text-xs font-semibold">{name}</span>
              <span className="skill-ar">{arabic}</span>
            </span>
            <ArrowUpLeft className="skill-arrow size-3.5" />
          </Link>
        ))}
      </div>
      <div className="stage-signature">
        <LogoWord className="text-lg" />
        <span>مستواك الجديد بيبدأ هنا.</span>
      </div>
    </div>
  );
}
