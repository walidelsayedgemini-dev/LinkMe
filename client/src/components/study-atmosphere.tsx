import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import "../study-atmosphere.css";

type StudyAtmosphereProps = {
  className?: string;
};

/**
 * A quiet study margin for pages that already provide the content hierarchy.
 * Every element is decorative: it is hidden from assistive technology and never
 * participates in hit testing, so the parent can place it behind page content.
 */
export function StudyAtmosphere({ className }: StudyAtmosphereProps) {
  const [isPageHidden, setIsPageHidden] = useState(false);

  useEffect(() => {
    const syncVisibility = () => setIsPageHidden(document.hidden);
    syncVisibility();
    document.addEventListener("visibilitychange", syncVisibility);
    return () =>
      document.removeEventListener("visibilitychange", syncVisibility);
  }, []);

  return (
    <div
      aria-hidden="true"
      className={cn(
        "study-atmosphere",
        isPageHidden && "study-atmosphere--paused",
        className
      )}
    >
      <div className="study-atmosphere__pattern" />

      <div className="study-atmosphere__margin study-atmosphere__margin--start">
        <span className="study-atmosphere__paper study-atmosphere__paper--blue study-atmosphere__motion">
          <span className="study-atmosphere__paper-lines" />
          <span className="study-atmosphere__paper-check" />
        </span>
        <span className="study-atmosphere__memo" />
      </div>

      <div className="study-atmosphere__margin study-atmosphere__margin--end">
        <span className="study-atmosphere__paper study-atmosphere__paper--mint">
          <span className="study-atmosphere__paper-lines" />
          <span className="study-atmosphere__paper-lines study-atmosphere__paper-lines--short" />
        </span>
        <span className="study-atmosphere__underline" />
        <span className="study-atmosphere__dash study-atmosphere__motion" />
      </div>

      <svg
        aria-hidden="true"
        className="study-atmosphere__geometry"
        viewBox="0 0 1200 760"
        preserveAspectRatio="none"
      >
        <path
          className="study-atmosphere__line"
          d="M42 174c35-15 71-15 106 0"
        />
        <path
          className="study-atmosphere__line study-atmosphere__line--soft"
          d="M88 190h92"
        />
        <path
          className="study-atmosphere__line"
          d="M1028 192c22-18 51-18 73 0l-18 18h-55z"
        />
        <path
          className="study-atmosphere__line study-atmosphere__line--soft"
          d="M1038 224h73"
        />
        <circle className="study-atmosphere__dot" cx="214" cy="136" r="4" />
        <circle
          className="study-atmosphere__dot study-atmosphere__dot--small"
          cx="1000"
          cy="270"
          r="3"
        />
        <path
          className="study-atmosphere__line"
          d="M72 616l28-24 28 24-28 24z"
        />
        <path
          className="study-atmosphere__line study-atmosphere__line--soft"
          d="M101 592v48M77 616h46"
        />
      </svg>
    </div>
  );
}
