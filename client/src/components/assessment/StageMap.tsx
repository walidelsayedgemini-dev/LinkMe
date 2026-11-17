import { Check, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AssessmentLevel, StageReport } from "@shared/assessment";
import { LEVEL_NAMES, LEVELS, percent } from "./shared";

type StageMapProps = {
  currentLevel: AssessmentLevel;
  reports: StageReport[];
  passPercent: number;
};

export function StageMap({
  currentLevel,
  reports,
  passPercent,
}: StageMapProps) {
  return (
    <nav className="assessment-progress-rail" aria-label="تقدم مراحل الاختبار">
      {LEVELS.map((level, index) => {
        const report = reports.find(item => item.level === level);
        const isCurrent = level === currentLevel;
        const passed = Boolean(report?.passed);
        return (
          <div
            key={level}
            className={cn(
              "assessment-rail-item",
              isCurrent && "is-current",
              passed && "is-passed"
            )}
          >
            <span className="assessment-rail-dot" aria-hidden>
              {passed ? (
                <Check className="size-3.5" />
              ) : report ? (
                <Circle className="size-2.5 fill-current" />
              ) : (
                <span className="latin">{level}</span>
              )}
            </span>
            <span className="assessment-rail-copy">
              <strong className="latin">{level}</strong>
              <small>{isCurrent ? "أنت هنا" : LEVEL_NAMES[level]}</small>
            </span>
            {report ? (
              <span className="assessment-rail-score">
                <span className="latin">
                  {percent(report.score, report.total)}%
                </span>
              </span>
            ) : null}
            {index < LEVELS.length - 1 ? (
              <span className="assessment-rail-line" aria-hidden />
            ) : null}
          </div>
        );
      })}
      <p className="assessment-rail-hint">
        <span className="latin">{passPercent}%</span> للانتقال في قياس المستوى
      </p>
    </nav>
  );
}
