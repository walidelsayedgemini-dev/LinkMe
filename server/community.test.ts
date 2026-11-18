import { describe, expect, it } from "vitest";
import {
  AVATAR_PRESETS,
  CHALLENGE_QUESTS,
  STREAK_SKINS,
  buildVirtualCompetitors,
  firstNameOnly,
  getAvatarPreset,
  getStreakSkin,
} from "../shared/gamification-catalog";

describe("gamification catalog & student privacy", () => {
  it("enforces strict first-name-only formatting for peer visibility", () => {
    expect(firstNameOnly("أحمد محمد علي")).toBe("أحمد");
    expect(firstNameOnly("  سلمى   السيد  ")).toBe("سلمى");
    expect(firstNameOnly("Walid Elsayed")).toBe("Walid");
    expect(firstNameOnly("")).toBe("متعلّم");
    expect(firstNameOnly(null)).toBe("متعلّم");
    expect(firstNameOnly(undefined)).toBe("متعلّم");
  });

  it("provides realistic first-name-only virtual competitors for every period", () => {
    const periods = ["daily", "weekly", "monthly", "yearly"] as const;
    for (const period of periods) {
      const rivals = buildVirtualCompetitors(period);
      expect(rivals.length).toBeGreaterThanOrEqual(10);
      for (const rival of rivals) {
        expect(rival.firstName.includes(" ")).toBe(false);
        expect(rival.xp).toBeGreaterThan(0);
        expect(rival.streakDays).toBeGreaterThan(0);
        expect(Boolean(rival.isCurrentUser)).toBe(false);
      }
    }

    // Yearly XP totals should naturally exceed daily totals
    const dailyTop = Math.max(...buildVirtualCompetitors("daily").map(r => r.xp));
    const yearlyTop = Math.max(...buildVirtualCompetitors("yearly").map(r => r.xp));
    expect(yearlyTop).toBeGreaterThan(dailyTop);
  });

  it("includes quests for daily, weekly, monthly, and yearly challenges", () => {
    for (const period of ["daily", "weekly", "monthly", "yearly"] as const) {
      const matching = CHALLENGE_QUESTS.filter(q => q.period === period);
      expect(matching.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("provides selectable avatars and streak-gated skins with safe fallbacks", () => {
    expect(AVATAR_PRESETS.length).toBeGreaterThanOrEqual(12);
    expect(STREAK_SKINS.length).toBeGreaterThanOrEqual(6);
    expect(getAvatarPreset("unknown-id").id).toBe(AVATAR_PRESETS[0].id);
    expect(getStreakSkin("unknown-skin").id).toBe(STREAK_SKINS[0].id);

    // Skins should be ordered by ascending minStreak starting at 0
    expect(STREAK_SKINS[0].minStreak).toBe(0);
    for (let i = 1; i < STREAK_SKINS.length; i++) {
      expect(STREAK_SKINS[i].minStreak).toBeGreaterThan(
        STREAK_SKINS[i - 1].minStreak
      );
    }
  });
});
