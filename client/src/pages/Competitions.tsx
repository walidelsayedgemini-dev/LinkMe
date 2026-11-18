import { useState } from "react";
import { Link } from "wouter";
import {
  Check,
  Crown,
  Flame,
  Lock,
  Palette,
  Sparkles,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CompanionSays, useCompanion } from "@/components/companion";
import { StudentAvatarBadge } from "@/components/student-avatar-badge";
import { ReferralCard } from "@/components/referral-card";
import { useAuth } from "@/contexts/AuthContext";
import { trpc } from "@/lib/trpc";
import { soundEffects } from "@/lib/sound-effects";
import { cn } from "@/lib/utils";
import {
  AVATAR_PRESETS,
  STREAK_SKINS,
  getStreakSkin,
  type CompetitionPeriod,
} from "@shared/gamification-catalog";

const PERIODS: { id: CompetitionPeriod; label: string; icon: string }[] = [
  { id: "daily", label: "اليوم", icon: "🔥" },
  { id: "weekly", label: "الأسبوع", icon: "⚡" },
  { id: "monthly", label: "الشهر", icon: "🏆" },
  { id: "yearly", label: "السنة", icon: "👑" },
];

export default function Competitions() {
  const { user } = useAuth();
  const { companion } = useCompanion();
  const utils = trpc.useUtils();
  const [period, setPeriod] = useState<CompetitionPeriod>("weekly");
  const [claimedQuests, setClaimedQuests] = useState<Record<string, boolean>>(() => {
    if (typeof window === "undefined") return {};
    try {
      const today = new Date().toISOString().slice(0, 10);
      const raw = localStorage.getItem(`linkme_claimed_quests_${today}`);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  const board = trpc.community.leaderboard.useQuery({ period });
  const myProfile = trpc.community.myGameProfile.useQuery(undefined, {
    enabled: Boolean(user),
  });
  const myGroups = trpc.community.myGroups.useQuery(undefined, {
    enabled: Boolean(user),
  });

  const customize = trpc.community.updateCustomization.useMutation({
    onSuccess: async () => {
      soundEffects.playCorrect();
      await utils.community.myGameProfile.invalidate();
      await utils.community.leaderboard.invalidate();
      await utils.community.myGroups.invalidate();
      toast.success("تم حفظ مظهرك الجديد بنجاح! ✨");
    },
    onError: err => {
      soundEffects.playIncorrect();
      toast.error(err.message);
    },
  });

  const addXp = trpc.community.addXp.useMutation({
    onSuccess: async (data, vars) => {
      soundEffects.playTrophy();
      if (vars.questId) {
        const next = { ...claimedQuests, [vars.questId]: true };
        setClaimedQuests(next);
        try {
          const today = new Date().toISOString().slice(0, 10);
          localStorage.setItem(`linkme_claimed_quests_${today}`, JSON.stringify(next));
        } catch {}
      }
      await utils.community.leaderboard.invalidate();
      await utils.community.myGameProfile.invalidate();
      const awarded = data?.awardedAmount ?? vars.amount;
      toast.success(
        data?.isVip
          ? `👑 مضاعفة PRO x2! أضيف +${awarded} XP لرصيدك في المسابقة 🎉🔥`
          : `مبروك! أضيف +${awarded} XP لرصيدك في المسابقة 🎉🔥`
      );
    },
    onError: err => toast.error(err.message),
  });

  const entries = board.data?.entries ?? [];
  const topThree = entries.slice(0, 3);
  const restEntries = entries.slice(3);
  const quests = board.data?.quests ?? [];

  const currentStreak = myProfile.data?.streakDays ?? 1;
  const currentAvatar = myProfile.data?.avatarPreset ?? "lion";
  const currentSkin = myProfile.data?.equippedSkin ?? "classic";
  const isVip = Boolean(myProfile.data?.isVip);

  return (
    <PageShell>
      {/* Hero Banner */}
      <section className="relative overflow-hidden border-b border-line bg-paper-deep/60">
        <div className="container py-10 sm:py-14">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-700 dark:text-amber-300">
                <Trophy className="size-3.5" /> دوري Link Me الرسمي للتحديات والحماسة
              </span>
              <h1 className="mt-3 text-3xl font-extrabold text-ink sm:text-4xl">
                نافس، اجمع نقاط <span className="hl-word">الحماسة</span>، وافتح سكنات أسطورية! 🔥
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                تحديات يومية، أسبوعية، شهرية، وسنوية! كل يوم التزام بيقرّبك من المركز
                الأول وبيفتحلك إطارات وسكنات نادرة — وبخصوصية كاملة يظهر الاسم الأول فقط لكل طالب.
              </p>
            </div>

            {user && myProfile.data ? (
              <div className="flex items-center gap-4 rounded-3xl border border-line bg-card p-4 shadow-sm">
                <StudentAvatarBadge
                  avatarPreset={currentAvatar}
                  equippedSkin={currentSkin}
                  size="lg"
                />
                <div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="text-base font-extrabold text-ink">
                      {myProfile.data.firstName}
                    </p>
                    {isVip && (
                      <span className="rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 px-2 py-0.5 text-[10px] font-black text-white shadow-xs">
                        PRO 👑
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                    🔥 {currentStreak} أيام حماسة متتالية
                    {isVip && " · 🛡️ درع الحماسة مفعّل"}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-soft">
                    {isVip
                      ? "⚡ مضاعفة النقاط 2x مفعّلة تلقائياً!"
                      : `${getStreakSkin(currentSkin).badgeEmoji} ${getStreakSkin(currentSkin).name}`}
                  </p>
                </div>
              </div>
            ) : (
              <Button asChild className="rounded-full bg-iris px-6 text-white">
                <Link href="/login">سجّل دخولك وادخل المنافسة 🚀</Link>
              </Button>
            )}
          </div>
        </div>
      </section>

      <section className="container py-8 sm:py-10">
        <Tabs defaultValue="leaderboard" dir="rtl" className="space-y-6">
          <TabsList className="flex h-auto w-full flex-wrap justify-start gap-2 rounded-2xl border border-line bg-card p-1.5">
            <TabsTrigger value="leaderboard" className="gap-1.5 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold">
              <Trophy className="size-4 text-amber-500" /> المسابقات ولوحة الشرف
            </TabsTrigger>
            <TabsTrigger value="customize" className="gap-1.5 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold">
              <Palette className="size-4 text-iris" /> الأفتارات وسكنات الحماسة
            </TabsTrigger>
            <TabsTrigger value="classroom" className="gap-1.5 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold">
              <Users className="size-4 text-emerald-500" /> فصلي الدراسي ({myGroups.data?.length ?? 0})
            </TabsTrigger>
          </TabsList>

          {/* ================= TAB 1: LEADERBOARD & CHALLENGES ================= */}
          <TabsContent value="leaderboard" className="space-y-6">
            {/* Smart Rank Gap Motivator + Quick XP Boosters */}
            {(() => {
              const myEntry = board.data?.myEntry;
              const aboveEntry =
                myEntry && myEntry.rank > 1
                  ? entries.find(e => e.rank === myEntry.rank - 1)
                  : null;
              const xpGap = aboveEntry && myEntry ? Math.max(1, aboveEntry.xp - myEntry.xp + 1) : 0;
              return (
                <div className="space-y-3">
                  {myEntry && (
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-400/50 bg-gradient-to-r from-amber-500/10 via-card to-iris/10 px-4 py-3 text-xs sm:text-sm">
                      {myEntry.rank === 1 ? (
                        <p className="font-bold text-ink">
                          👑 بطل الصدارة! أنت في <b>المركز الأول</b> دلوقتي بـ{" "}
                          <span className="latin text-iris">{myEntry.xp} XP</span> — حافظ على القمة!
                        </p>
                      ) : aboveEntry ? (
                        <p className="font-bold text-ink">
                          🔥 باقي لك <span className="latin text-amber-600 dark:text-amber-400">{xpGap} XP</span> بس وتعدّي{" "}
                          <span className="text-iris">{aboveEntry.firstName}</span> وتطلع للمركز{" "}
                          <span className="latin">#{aboveEntry.rank}</span>!
                        </p>
                      ) : null}
                      <span className="latin rounded-full bg-iris-soft px-3 py-1 text-xs font-black text-iris">
                        #{myEntry.rank} · {myEntry.xp} XP ⚡
                      </span>
                    </div>
                  )}

                  <div className="grid gap-2.5 sm:grid-cols-3">
                    {[
                      {
                        href: "/roleplay",
                        emoji: "🎭",
                        title: "محاكي المواقف",
                        xp: "+30 XP",
                        sub: "تدرّب بالصوت الآن",
                      },
                      {
                        href: "/flashcards",
                        emoji: "🃏",
                        title: "فلاش كاردز الكلمات",
                        xp: "+10 XP / كلمة",
                        sub: "5 كلمات يومياً بالصوت",
                      },
                      {
                        href: "/speed-quiz",
                        emoji: "⚡",
                        title: "تحدي الـ 60 ثانية",
                        xp: "+30 XP",
                        sub: "اكسر الرقم القياسي",
                      },
                    ].map(action => (
                      <Link
                        key={action.href}
                        href={action.href}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-card px-4 py-3 transition hover:border-iris hover:bg-iris-soft/30"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-xl">{action.emoji}</span>
                          <div className="min-w-0">
                            <p className="truncate text-xs font-bold text-ink">
                              {action.title}
                            </p>
                            <p className="truncate text-[11px] text-ink-soft">
                              {action.sub}
                            </p>
                          </div>
                        </div>
                        <span className="latin shrink-0 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-black text-amber-700 dark:text-amber-300">
                          {action.xp}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Period Switcher */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                {PERIODS.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      soundEffects.playClick();
                      setPeriod(p.id);
                    }}
                    className={cn(
                      "rounded-full border px-4 py-2 text-xs sm:text-sm font-bold transition",
                      period === p.id
                        ? "border-iris bg-iris text-white shadow-md"
                        : "border-line bg-card text-ink-soft hover:border-iris/50 hover:text-ink"
                    )}
                  >
                    {p.icon} تحدي {p.label}
                  </button>
                ))}
              </div>
              {board.data?.myEntry && (
                <span className="rounded-full border border-iris/30 bg-iris/10 px-3.5 py-1.5 text-xs font-bold text-iris">
                  ترتيبك الحالي: #{board.data.myEntry.rank} · {board.data.myEntry.xp} XP ⚡
                </span>
              )}
            </div>

            {/* Active Quests for this period */}
            {user && <ReferralCard />}
            {quests.length > 0 && (
              <div className="grid gap-3 sm:grid-cols-2">
                {quests.map(quest => {
                  const claimed = Boolean(claimedQuests[quest.id]);
                  const lockedPro = Boolean(quest.isPro) && !isVip;
                  const displayXp = isVip ? quest.rewardXp * 2 : quest.rewardXp;
                  return (
                    <div
                      key={quest.id}
                      className={cn(
                        "flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4 shadow-xs",
                        quest.isPro
                          ? "border-amber-400/50 bg-gradient-to-r from-amber-500/[0.07] to-card"
                          : "border-line bg-card"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-iris/10 text-xl">
                          {quest.icon}
                        </span>
                        <div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <h3 className="text-sm font-bold text-ink">{quest.title}</h3>
                            {quest.isPro && (
                              <span className="rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-2 py-0.5 text-[9px] font-black text-white">
                                حصري PRO 👑
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 text-xs text-ink-soft">{quest.description}</p>
                        </div>
                      </div>
                      {lockedPro ? (
                        <Button
                          asChild
                          size="sm"
                          className="rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-xs font-bold text-white hover:from-amber-600 hover:to-orange-600"
                        >
                          <Link href="/pricing">
                            <Lock className="me-1 size-3" /> افتح بـ PRO (+{quest.rewardXp * 2} XP)
                          </Link>
                        </Button>
                      ) : user ? (
                        <Button
                          size="sm"
                          disabled={claimed || addXp.isPending}
                          onClick={() =>
                            addXp.mutate({ amount: quest.rewardXp, questId: quest.id })
                          }
                          className={cn(
                            "rounded-full text-xs font-bold",
                            claimed
                              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                              : "bg-iris text-white hover:bg-iris-deep"
                          )}
                        >
                          {claimed ? "تم الاستلام ✓" : `استلم +${displayXp} XP`}
                        </Button>
                      ) : (
                        <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-bold text-amber-700 dark:text-amber-300">
                          +{quest.rewardXp} XP
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Top 3 Podium */}
            {topThree.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-3">
                {topThree.map((entry, idx) => {
                  const medals = ["🥇 المركز الأول", "🥈 المركز الثاني", "🥉 المركز الثالث"];
                  const skin = getStreakSkin(entry.equippedSkin);
                  return (
                    <div
                      key={entry.id}
                      className={cn(
                        "relative flex flex-col items-center rounded-3xl border p-5 text-center shadow-sm transition hover:-translate-y-0.5",
                        idx === 0
                          ? "border-amber-400/70 bg-gradient-to-b from-amber-50/90 via-card to-card dark:from-amber-950/30"
                          : skin.cardGlowClass,
                        entry.isCurrentUser && "ring-2 ring-iris"
                      )}
                    >
                      <span className="mb-3 rounded-full bg-amber-500/15 px-3 py-0.5 text-xs font-extrabold text-amber-700 dark:text-amber-300">
                        {medals[idx]}
                      </span>
                      <StudentAvatarBadge
                        avatarPreset={entry.avatarPreset}
                        equippedSkin={entry.equippedSkin}
                        size="lg"
                      />
                      <h3 className="mt-3 flex flex-wrap items-center justify-center gap-1.5 text-lg font-extrabold text-ink">
                        <span>{entry.firstName}</span>
                        {entry.isVip && (
                          <span className="rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 px-2 py-0.5 text-[10px] font-black text-white">
                            PRO 👑
                          </span>
                        )}
                        {entry.isCurrentUser && (
                          <span className="text-xs font-bold text-iris">(أنت)</span>
                        )}
                      </h3>
                      <div className="mt-2 flex items-center gap-3 text-xs font-bold">
                        <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                          <Flame className="size-3.5 fill-amber-500 text-amber-500" />
                          {entry.streakDays} يوم
                        </span>
                        <span className="flex items-center gap-1 text-iris">
                          <Zap className="size-3.5" />
                          {entry.xp.toLocaleString()} XP
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Full Leaderboard Table */}
            <div className="overflow-hidden rounded-3xl border border-line bg-card">
              <div className="border-b border-line px-5 py-3.5 flex items-center justify-between">
                <h2 className="text-sm font-bold text-ink">
                  ترتيب المتنافسين (يظهر الاسم الأول فقط حفاظاً على الخصوصية 🔒)
                </h2>
                <span className="text-xs text-ink-soft">{entries.length} متنافس</span>
              </div>
              <div className="divide-y divide-line">
                {restEntries.map(entry => {
                  const skin = getStreakSkin(entry.equippedSkin);
                  return (
                    <div
                      key={entry.id}
                      className={cn(
                        "flex items-center justify-between gap-3 px-4 sm:px-5 py-3 transition",
                        entry.isCurrentUser
                          ? "bg-iris/10 font-bold"
                          : "hover:bg-paper-deep/50"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-7 text-center font-mono text-xs font-extrabold text-ink-soft">
                          #{entry.rank}
                        </span>
                        <StudentAvatarBadge
                          avatarPreset={entry.avatarPreset}
                          equippedSkin={entry.equippedSkin}
                          size="sm"
                        />
                        <div className="min-w-0">
                          <p className="flex items-center gap-1.5 truncate text-sm font-bold text-ink">
                            <span className="truncate">{entry.firstName}</span>
                            {entry.isVip && (
                              <span className="shrink-0 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 px-1.5 py-0.5 text-[9px] font-black text-white">
                                PRO 👑
                              </span>
                            )}
                            {entry.isCurrentUser && (
                              <span className="shrink-0 rounded-full bg-iris px-2 py-0.5 text-[10px] text-white">
                                أنت
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] text-ink-soft">
                            {skin.badgeEmoji} {skin.name}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-3 text-xs font-bold">
                        <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                          <Flame className="size-3.5 fill-amber-500 text-amber-500" />
                          {entry.streakDays}
                        </span>
                        <span className="rounded-full bg-paper-deep px-2.5 py-1 font-mono text-iris">
                          {entry.xp.toLocaleString()} XP
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          {/* ================= TAB 2: AVATARS & STREAK SKINS ================= */}
          <TabsContent value="customize" className="space-y-8">
            <CompanionSays
              message={
                companion.id === "khadija"
                  ? "اختاري الأفتار الكيوت اللي يعجبك، وكل ما تزودي أيام حماستك هتفتحي سكنات وإطارات فخمة جداً! 🌸✨"
                  : "اختار الأفتار بتاعك يا بطل وولّع الحماسة عشان تفتح السكن الذهبي والماسي وتبهر فصلك كله! 🔥💎"
              }
            />

            {!user && (
              <div className="rounded-2xl border border-amber-400/40 bg-amber-500/10 p-4 text-center text-sm">
                <p className="font-bold text-ink">سجّل دخولك عشان تحفظ الأفتار والسكنات الخاصة بك!</p>
                <Button asChild size="sm" className="mt-3 rounded-full bg-iris text-white">
                  <Link href="/login">تسجيل الدخول</Link>
                </Button>
              </div>
            )}

            {/* Avatars Grid */}
            <div className="space-y-3">
              <h2 className="text-lg font-extrabold text-ink">
                1. اختار الأفتار المفضل لك ({AVATAR_PRESETS.length} شخصية)
              </h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {AVATAR_PRESETS.map(avatar => {
                  const selected = currentAvatar === avatar.id;
                  const lockedByPro = Boolean(avatar.isPro) && !isVip;
                  return (
                    <button
                      key={avatar.id}
                      type="button"
                      disabled={!user || customize.isPending}
                      onClick={() => {
                        if (lockedByPro) {
                          toast.info("هذا الأفتار الملكي حصري لمشتركي PRO 👑 — رقّي حسابك من صفحة الأسعار!");
                          return;
                        }
                        customize.mutate({ avatarPreset: avatar.id });
                      }}
                      className={cn(
                        "relative flex flex-col items-center gap-2 rounded-2xl border p-4 transition hover:-translate-y-0.5",
                        selected
                          ? "border-iris bg-iris/10 ring-2 ring-iris/30 shadow-sm"
                          : avatar.isPro
                            ? "border-amber-400/50 bg-gradient-to-b from-amber-50/40 to-card dark:from-amber-950/20"
                            : "border-line bg-card hover:border-iris/40"
                      )}
                    >
                      {avatar.isPro && (
                        <span className="absolute top-2 end-2 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 px-1.5 py-0.5 text-[9px] font-black text-white">
                          PRO 👑
                        </span>
                      )}
                      <StudentAvatarBadge
                        avatarPreset={avatar.id}
                        equippedSkin={currentSkin}
                        size="lg"
                        showSkinBadge={false}
                      />
                      <span className="text-xs font-bold text-ink">{avatar.label}</span>
                      {selected ? (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-iris">
                          <Check className="size-3" /> مختار
                        </span>
                      ) : lockedByPro ? (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-600">
                          <Lock className="size-2.5" /> لمشتركي PRO
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Streak Skins Grid */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-extrabold text-ink">
                  2. سكنات وإطارات الحماسة النادرة ✨
                </h2>
                <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-bold text-amber-700 dark:text-amber-300">
                  حماستك الحالية: {currentStreak} أيام 🔥
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {STREAK_SKINS.map(skin => {
                  const unlocked = skin.isPro ? isVip : currentStreak >= skin.minStreak;
                  const equipped = currentSkin === skin.id;
                  const remaining = Math.max(0, skin.minStreak - currentStreak);
                  return (
                    <div
                      key={skin.id}
                      className={cn(
                        "flex flex-col justify-between gap-4 rounded-3xl border p-5 transition",
                        unlocked ? skin.cardGlowClass : "border-line bg-paper/70 opacity-85",
                        equipped && "ring-2 ring-iris"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <StudentAvatarBadge
                          avatarPreset={currentAvatar}
                          equippedSkin={skin.id}
                          size="lg"
                        />
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <h3 className="text-sm font-extrabold text-ink">{skin.name}</h3>
                            <span>{skin.badgeEmoji}</span>
                            {skin.isPro && (
                              <span className="rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 px-2 py-0.5 text-[9px] font-black text-white">
                                حصري PRO 👑
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-xs text-ink-soft leading-relaxed">
                            {skin.description}
                          </p>
                        </div>
                      </div>

                      {unlocked ? (
                        <Button
                          type="button"
                          size="sm"
                          disabled={!user || equipped || customize.isPending}
                          onClick={() => customize.mutate({ equippedSkin: skin.id })}
                          className={cn(
                            "w-full rounded-full text-xs font-bold",
                            equipped
                              ? "bg-emerald-600 text-white"
                              : "bg-iris text-white hover:bg-iris-deep"
                          )}
                        >
                          {equipped ? "مفعّل حالياً ✓" : "تفعيل هذا السكن ✨"}
                        </Button>
                      ) : skin.isPro ? (
                        <Button
                          asChild
                          size="sm"
                          className="w-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-xs font-bold text-white hover:from-amber-600 hover:to-orange-600"
                        >
                          <Link href="/pricing">
                            <Crown className="me-1.5 size-3.5" /> افتحه بترقية PRO 👑
                          </Link>
                        </Button>
                      ) : (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[11px] font-bold text-ink-soft">
                            <span className="flex items-center gap-1">
                              <Lock className="size-3" /> مغلق
                            </span>
                            <span>باقي {remaining} أيام حماسة 🔥</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-paper-deep">
                            <div
                              className="h-full rounded-full bg-amber-500 transition-all"
                              style={{
                                width: `${Math.min(100, Math.round((currentStreak / skin.minStreak) * 100))}%`,
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          {/* ================= TAB 3: MY CLASSROOM (FIRST NAME ONLY) ================= */}
          <TabsContent value="classroom" className="space-y-6">
            {!user ? (
              <div className="rounded-3xl border border-line bg-card p-10 text-center">
                <Users className="mx-auto size-10 text-iris" />
                <h2 className="mt-3 text-lg font-bold text-ink">سجّل دخولك لمشاهدة فصلك وزملائك</h2>
                <Button asChild className="mt-4 rounded-full bg-iris text-white">
                  <Link href="/login">تسجيل الدخول</Link>
                </Button>
              </div>
            ) : (myGroups.data ?? []).length === 0 ? (
              <div className="rounded-3xl border border-line bg-card p-10 text-center">
                <Users className="mx-auto size-10 text-ink-soft" />
                <h2 className="mt-3 text-lg font-bold text-ink">
                  لم يتم إضافتك لفصل دراسي بعد
                </h2>
                <p className="mt-2 text-sm text-ink-soft">
                  بمجرد ما المالك يضيفك لمجموعة أو فصل دراسي، هيظهرلك هنا اسم الفصل وزملائك وتنافسكم سوا!
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {(myGroups.data ?? []).map(group => (
                  <div
                    key={group.id}
                    className="overflow-hidden rounded-3xl border border-line bg-card shadow-sm"
                  >
                    <div className="border-b border-line bg-paper-deep/60 p-5 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <span className="inline-flex items-center gap-1 rounded-full bg-iris/15 px-2.5 py-0.5 text-xs font-bold text-iris">
                          <Crown className="size-3.5" /> مستوى {group.level}
                        </span>
                        <h2 className="mt-1.5 text-xl font-extrabold text-ink">{group.name}</h2>
                        {group.description && (
                          <p className="mt-1 text-xs text-ink-soft">{group.description}</p>
                        )}
                      </div>
                      <span className="rounded-full border border-line bg-card px-3 py-1 text-xs font-bold text-ink-soft">
                        {group.classmates.length} زميل في الفصل · يظهر الاسم الأول فقط 🔒
                      </span>
                    </div>

                    <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
                      {group.classmates.map((mate, i) => {
                        const skin = getStreakSkin(mate.equippedSkin);
                        return (
                          <div
                            key={mate.id}
                            className={cn(
                              "flex items-center justify-between gap-3 rounded-2xl border p-3.5",
                              mate.isCurrentUser
                                ? "border-iris bg-iris/10"
                                : skin.cardGlowClass
                            )}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="font-mono text-xs font-extrabold text-ink-soft">
                                #{i + 1}
                              </span>
                              <StudentAvatarBadge
                                avatarPreset={mate.avatarPreset}
                                equippedSkin={mate.equippedSkin}
                                size="sm"
                              />
                              <div className="min-w-0">
                                <p className="truncate text-sm font-bold text-ink">
                                  {mate.firstName}{" "}
                                  {mate.isCurrentUser && (
                                    <span className="text-[11px] text-iris">(أنت)</span>
                                  )}
                                </p>
                                <p className="text-[11px] text-ink-soft">
                                  {skin.badgeEmoji} {skin.name}
                                </p>
                              </div>
                            </div>
                            <div className="text-end text-xs font-bold">
                              <p className="text-amber-600 dark:text-amber-400">
                                🔥 {mate.streakDays}
                              </p>
                              <p className="font-mono text-[11px] text-iris">
                                {mate.weeklyXp} XP
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </section>
    </PageShell>
  );
}
