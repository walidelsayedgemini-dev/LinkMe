import type { TrpcContext } from "../_core/context";
import type { PremiumLesson, PremiumLessonSummary } from "@shared/premium";
import type { AssessmentLevel } from "@shared/assessment";
import type {
  PremiumCoachNote,
  PremiumDailyAttempt,
  PremiumLessonProgress,
  PremiumMembership,
} from "../../drizzle/premium-schema";

export type PremiumContext = TrpcContext & { premiumNow?: Date };
export type PremiumCurriculum = readonly PremiumLesson[];
export type PremiumCurriculumLookup = (lessonId: string) => PremiumLesson | undefined;
export type PremiumMembershipRow = PremiumMembership;
export type PremiumAttemptRow = PremiumDailyAttempt;
export type PremiumProgressRow = PremiumLessonProgress;
export type PremiumNoteRow = PremiumCoachNote;

export type PremiumSnapshot = {
  membership: ReturnType<
    typeof import("./serialization")["publicMembership"]
  >;
  active: boolean;
  currentLevel: AssessmentLevel | null;
  dayNumber: number;
  totalDays: number;
  lessons: PremiumLessonSummary[];
  lessonProgress: Array<{
    lessonId: string;
    level: AssessmentLevel;
    bestScore: number;
    total: number;
    attemptCount: number;
    completed: boolean;
    lastAttemptAt: Date | null;
  }>;
  dailyHistory: unknown[];
  weaknesses: unknown[];
  coachNotes: Array<{
    id: number;
    dayIndex: number | null;
    note: string;
    authorUserId: number;
    createdAt: Date;
  }>;
  today: unknown;
};
