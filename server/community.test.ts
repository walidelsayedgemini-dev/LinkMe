import fs from "node:fs";
import path from "node:path";
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
import { FLASHCARDS_DECK, type FlashcardLevel } from "../shared/flashcards-deck";
import { ROLEPLAY_SCENARIOS } from "../shared/roleplay-scenarios";
import { SPEED_QUIZ_BANK, getDailySpeedQuiz } from "../shared/speed-quiz-bank";
import { buildReferralCode, parseReferralCode } from "./routers/community";

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

  it("provides 100 illustrated WebP avatars and streak-gated skins with safe fallbacks", () => {
    expect(AVATAR_PRESETS.length).toBe(100);
    expect(STREAK_SKINS.length).toBeGreaterThanOrEqual(9);
    expect(getAvatarPreset("unknown-id").id).toBe(AVATAR_PRESETS[0].id);
    expect(getStreakSkin("unknown-skin").id).toBe(STREAK_SKINS[0].id);

    // Free streak skins should be ordered by ascending minStreak starting at 0
    const freeStreakSkins = STREAK_SKINS.filter(s => !s.isPro);
    const vipSkins = STREAK_SKINS.filter(s => s.isPro);
    expect(freeStreakSkins[0].minStreak).toBe(0);
    for (let i = 1; i < freeStreakSkins.length; i++) {
      expect(freeStreakSkins[i].minStreak).toBeGreaterThan(
        freeStreakSkins[i - 1].minStreak
      );
    }
    expect(vipSkins.length).toBeGreaterThanOrEqual(3);
    expect(AVATAR_PRESETS.filter(a => a.isPro).length).toBeGreaterThanOrEqual(24);
    for (const av of AVATAR_PRESETS) {
      expect(av.imageUrl).toMatch(/^\/avatars\/[a-z0-9_]+\.webp$/);
      const diskPath = path.resolve("client/public", av.imageUrl.slice(1));
      expect(fs.existsSync(diskPath)).toBe(true);
    }
  });

  it("generates tamper-proof referral codes and parses valid ones", () => {
    const code = buildReferralCode(42);
    expect(code).toMatch(/^LM42-[A-F0-9]{4}$/);
    expect(parseReferralCode(code)).toBe(42);
    expect(parseReferralCode(code.toLowerCase())).toBe(42);
    expect(parseReferralCode("LM42-0000")).toBeNull();
    expect(parseReferralCode("INVALID")).toBeNull();
  });

  it("ships complete audio vocabulary flashcards across all 8 decks (180+ cards)", () => {
    const levels: FlashcardLevel[] = [
      "A1",
      "A2",
      "B1",
      "B2",
      "C1",
      "IELTS",
      "BUSINESS",
      "IDIOMS",
    ];
    const ids = new Set<string>();
    expect(FLASHCARDS_DECK.length).toBeGreaterThanOrEqual(180);
    for (const lvl of levels) {
      const cards = FLASHCARDS_DECK.filter(c => c.level === lvl);
      expect(cards.length).toBeGreaterThanOrEqual(20);
      for (const card of cards) {
        expect(ids.has(card.id)).toBe(false);
        ids.add(card.id);
        expect(card.word.length).toBeGreaterThan(1);
        expect(card.meaningAr.length).toBeGreaterThan(1);
        expect(card.exampleEn.length).toBeGreaterThan(5);
      }
    }
  });

  it("provides 22+ multi-turn roleplay scenarios and 100+ speed quiz questions", () => {
    expect(ROLEPLAY_SCENARIOS.length).toBeGreaterThanOrEqual(22);
    expect(ROLEPLAY_SCENARIOS.filter(s => s.isPro).length).toBeGreaterThanOrEqual(18);
    for (const s of ROLEPLAY_SCENARIOS) {
      expect(s.turns.length).toBeGreaterThanOrEqual(4);
      for (const turn of s.turns) {
        expect(turn.options.some(o => o.quality === "best")).toBe(true);
      }
    }

    expect(SPEED_QUIZ_BANK.length).toBeGreaterThanOrEqual(100);
    const fixedDate = new Date("2026-11-18T10:00:00Z");
    const q1 = getDailySpeedQuiz(fixedDate);
    const q2 = getDailySpeedQuiz(fixedDate);
    expect(q1.length).toBe(5);
    expect(q1.map(q => q.id)).toEqual(q2.map(q => q.id));
  });
});
