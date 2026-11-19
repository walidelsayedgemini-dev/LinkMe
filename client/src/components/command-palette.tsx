import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import {
  ArrowRight,
  BookOpen,
  CornerDownLeft,
  Crown,
  Flame,
  Gauge,
  GraduationCap,
  Layers,
  MessageCircle,
  MessageSquare,
  Mic,
  PhoneCall,
  Search,
  Sparkles,
  Trophy,
  X,
  Zap,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { soundEffects } from "@/lib/sound-effects";

interface CommandItem {
  id: string;
  title: string;
  subtitle: string;
  category: "الكورسات والمسارات" | "المحادثة والصوتيات" | "الألعاب والتحديات" | "الوصول السريع";
  href: string;
  badge?: string;
  icon: typeof Search;
  keywords: string[];
}

const COMMAND_ITEMS: CommandItem[] = [
  // الكورسات والمسارات
  {
    id: "courses-all",
    title: "كل الكورسات والكتالوج",
    subtitle: "تصفّح كل الكورسات المصنّفة حسب المستوى والمهارة",
    category: "الكورسات والمسارات",
    href: "/courses",
    badge: "الكتالوج",
    icon: BookOpen,
    keywords: ["courses", "all", "catalog", "كورسات", "كتالوج", "بحث"],
  },
  {
    id: "course-speaking",
    title: "كورس المحادثة والطلاقة",
    subtitle: "اتكلم بجرأة وثقة ومن غير ما تترجم في دماغك",
    category: "الكورسات والمسارات",
    href: "/courses?category=speaking",
    badge: "الأكثر طلباً",
    icon: Mic,
    keywords: ["speaking", "fluency", "محادثة", "طلاقة", "كلام", "نطق"],
  },
  {
    id: "course-grammar",
    title: "كورس تأسيس القواعد من الصفر",
    subtitle: "قواعد مفهومة بالمصري وبأمثلة عملية من غير تعقيد",
    category: "الكورسات والمسارات",
    href: "/courses?category=grammar",
    badge: "تأسيس",
    icon: Layers,
    keywords: ["grammar", "قواعد", "تأسيس", "جرامر", "أزمنة"],
  },
  {
    id: "course-ielts",
    title: "كورس التحضير لاختبار الآيلتس (IELTS)",
    subtitle: "تكتيكات Speaking و Writing لتحقيق Band 7+",
    category: "الكورسات والمسارات",
    href: "/courses?category=ielts",
    badge: "امتحانات",
    icon: GraduationCap,
    keywords: ["ielts", "آيلتس", "سفر", "امتحان", "band 7"],
  },
  {
    id: "path-independence",
    title: "مسار الاستقلال (12 مستوى من A1 إلى B1)",
    subtitle: "خطة متكاملة تنقلك من أول حرف للطلاقة التامة",
    category: "الكورسات والمسارات",
    href: "/path",
    badge: "12 مستوى",
    icon: Layers,
    keywords: ["path", "levels", "مسار", "مستويات", "a1", "b1"],
  },
  {
    id: "kids-path",
    title: "ركن الأطفال (Kids Corner)",
    subtitle: "تأسيس ممتع ومناهج للمرحلة الابتدائية والإعدادية",
    category: "الكورسات والمسارات",
    href: "/kids",
    badge: "أطفال",
    icon: Sparkles,
    keywords: ["kids", "children", "أطفال", "تأسيس", "صغار"],
  },

  // المحادثة والصوتيات
  {
    id: "roleplay-scenarios",
    title: "محاكي المواقف الحقيقية (1,000 موقف)",
    subtitle: "إنترفيو، مطار، كافيه، فريلانس وتدريب صوتي فوري",
    category: "المحادثة والصوتيات",
    href: "/roleplay",
    badge: "1,000 موقف",
    icon: MessageSquare,
    keywords: ["roleplay", "scenarios", "مواقف", "رول بلاي", "إنترفيو", "محادثة"],
  },
  {
    id: "incoming-call",
    title: "مكالمة واردة ذكية (Incoming Call)",
    subtitle: "رنّة هاتف حقيقية ومحادثة فورية مع مرشدك الإنجليزي",
    category: "المحادثة والصوتيات",
    href: "/roleplay",
    badge: "PRO 👑",
    icon: PhoneCall,
    keywords: ["call", "phone", "مكالمة", "تليفون", "صوت"],
  },
  {
    id: "morning-sprint",
    title: "سباق الصباح اليومي (Morning Speaking Sprint)",
    subtitle: "3 دقائق كلام سريع كل صباح لتنشيط مخك بالإنجليزي",
    category: "المحادثة والصوتيات",
    href: "/roleplay",
    badge: "3 دقائق ⚡",
    icon: Flame,
    keywords: ["sprint", "morning", "صباح", "سباق", "تنشيط"],
  },
  {
    id: "ai-fluency-coach",
    title: "مدرّب النطق والطلاقة بالذكاء الاصطناعي",
    subtitle: "سجّل جملتك والذكاء الاصطناعي يحلل نطقك ويديك نصائح",
    category: "المحادثة والصوتيات",
    href: "/roleplay",
    badge: "AI 🎙️",
    icon: Mic,
    keywords: ["coach", "pronunciation", "نطق", "مدرّب", "ذكاء اصطناعي", "صوت"],
  },

  // الألعاب والتحديات
  {
    id: "speed-quiz",
    title: "تحدي الـ 60 ثانية اليومي (Speed Quiz)",
    subtitle: "100 سؤال سريع بتايمر ونقاط XP وماراثون يومي",
    category: "الألعاب والتحديات",
    href: "/speed-quiz",
    badge: "ماراثون ⚡",
    icon: Zap,
    keywords: ["speed", "quiz", "كويز", "أسئلة", "ماراثون", "60 ثانية"],
  },
  {
    id: "competitions",
    title: "دوري المسابقات وأبطال الأسبوع",
    subtitle: "لوحة الشرف و100 أفتار مميز مع سكنات نادرة",
    category: "الألعاب والتحديات",
    href: "/competitions",
    badge: "100 أفتار 👑",
    icon: Trophy,
    keywords: ["competitions", "leaderboard", "مسابقات", "أبطال", "أفتار", "ترتيب"],
  },
  {
    id: "flashcards",
    title: "فلاش كاردز الكلمات (Flashcards)",
    subtitle: "180 بطاقة تفاعلية بصور ونطق أمريكي أصيل",
    category: "الألعاب والتحديات",
    href: "/flashcards",
    badge: "180 كارت",
    icon: BookOpen,
    keywords: ["flashcards", "cards", "فلاش كاردز", "كلمات", "حفظ", "مفردات"],
  },

  // الوصول السريع
  {
    id: "level-test",
    title: "اختبار تحديد المستوى الذكي",
    subtitle: "15 دقيقة لتعرف مستواك الدقيق من A1 إلى C2 مع تقرير فوري",
    category: "الوصول السريع",
    href: "/level-test",
    badge: "مجاني 🎯",
    icon: Gauge,
    keywords: ["test", "level", "مستوى", "اختبار", "تحديد مستوى", "a1", "c2"],
  },
  {
    id: "premium-plan",
    title: "عضوية خطة الإتقان (30 يوم أو سنة)",
    subtitle: "10 أسئلة يومية مع كوتش ياسين وتصحيح تفصيلي بالمصري",
    category: "الوصول السريع",
    href: "/premium",
    badge: "VIP 💎",
    icon: Crown,
    keywords: ["premium", "mastery", "إتقان", "اشتراك", "خطة", "vip", "دفع"],
  },
  {
    id: "dashboard",
    title: "لوحة المتعلّم ومتابعة الدروس",
    subtitle: "تابع تقدمك، ساعات دراستك، والواجبات المطلوبة منك",
    category: "الوصول السريع",
    href: "/dashboard",
    badge: "حسابي",
    icon: GraduationCap,
    keywords: ["dashboard", "لوحتي", "دروسي", "تقدمي", "حساب"],
  },
  {
    id: "homework",
    title: "مركز الواجبات والتسجيلات الصوتية",
    subtitle: "سلّم تسجيلاتك الصوتية واستلم تقييم المعلّم",
    category: "الوصول السريع",
    href: "/homework",
    badge: "مهام 📝",
    icon: Layers,
    keywords: ["homework", "واجبات", "تسجيلات", "مهام", "تصحيح"],
  },
  {
    id: "writing-checker",
    title: "مصحّح الكتابة والـ Grammar الذكي",
    subtitle: "اكتب مقالك والذكاء الاصطناعي يصحح القواعد ويقترح جمل طبيعية",
    category: "الوصول السريع",
    href: "/writing",
    badge: "جديد ✨",
    icon: Sparkles,
    keywords: ["writing", "grammar", "كتابة", "تصحيح", "مقال", "إيميل"],
  },
];

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Keyboard shortcut Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        onOpenChange(!open);
      } else if (event.key === "/" && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  // Reset search when dialog opens
  useEffect(() => {
    if (open) {
      setSearch("");
      setSelectedIndex(0);
    }
  }, [open]);

  // Filter items
  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return COMMAND_ITEMS;
    return COMMAND_ITEMS.filter(item => {
      return (
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.keywords.some(k => k.toLowerCase().includes(q))
      );
    });
  }, [search]);

  // Keyboard navigation within results
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, filteredItems.length));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
    } else if (event.key === "Enter" && filteredItems[selectedIndex]) {
      event.preventDefault();
      handleSelect(filteredItems[selectedIndex].href);
    }
  };

  const handleSelect = (href: string) => {
    soundEffects.playClick();
    onOpenChange(false);
    navigate(href);
  };

  // Group filtered items by category
  const categories = useMemo(() => {
    const map = new Map<string, CommandItem[]>();
    filteredItems.forEach(item => {
      const list = map.get(item.category) || [];
      list.push(item);
      map.set(item.category, list);
    });
    return Array.from(map.entries());
  }, [filteredItems]);

  let flatIndex = 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        dir="rtl"
        onKeyDown={handleKeyDown}
        className="fixed top-[15%] translate-y-0 p-0 max-w-2xl overflow-hidden rounded-3xl border border-line bg-card shadow-2xl transition-all dark:bg-[#0c182e] dark:border-white/15"
      >
        <DialogTitle className="sr-only">البحث السريع والتنقل الذكي</DialogTitle>

        {/* Search Input Bar */}
        <div className="relative flex items-center border-b border-line px-4 py-3.5 bg-paper/50 dark:bg-[#0a1426]/70">
          <Search className="size-5 shrink-0 text-ink-soft ms-1" />
          <input
            autoFocus
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="ابحث عن كورس، موقف، لعبة، أو مهارة… (أو اضغط Esc للإغلاق)"
            className="flex-1 bg-transparent px-3 text-sm text-ink outline-none placeholder:text-ink-soft/70 dark:text-white"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="grid size-6 place-items-center rounded-full text-ink-soft hover:bg-ink/5 hover:text-ink"
            >
              <X className="size-3.5" />
            </button>
          )}
          <span className="latin hidden sm:inline-flex items-center gap-1 rounded-md border border-line bg-card px-2 py-0.5 text-[11px] font-semibold text-ink-soft dark:bg-white/10 dark:text-white/80">
            Esc
          </span>
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto p-3 space-y-4">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-base font-semibold text-ink dark:text-white">لا توجد نتائج مطابقة لـ «{search}»</p>
              <p className="mt-1 text-xs text-ink-soft">جرّب البحث بكلمة مثل: محادثة، آيلتس، كويز، أو قواعد.</p>
            </div>
          ) : (
            categories.map(([categoryName, items]) => (
              <div key={categoryName} className="space-y-1">
                <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-ink-soft/80">
                  {categoryName}
                </p>
                <div className="space-y-1">
                  {items.map(item => {
                    const isSelected = flatIndex === selectedIndex;
                    const currentIndex = flatIndex;
                    flatIndex++;
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelect(item.href)}
                        onMouseEnter={() => setSelectedIndex(currentIndex)}
                        className={cn(
                          "w-full flex items-center justify-between gap-3 rounded-2xl px-3 py-2.5 text-start transition-all duration-150 cursor-pointer",
                          isSelected
                            ? "bg-iris text-white shadow-md shadow-iris/25 translate-x-1"
                            : "text-ink hover:bg-ink/5 dark:text-white dark:hover:bg-white/5",
                        )}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={cn(
                              "grid size-9 shrink-0 place-items-center rounded-xl transition-colors",
                              isSelected
                                ? "bg-white/20 text-white"
                                : "bg-iris/10 text-iris dark:bg-white/10 dark:text-sky-300",
                            )}
                          >
                            <Icon className="size-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-xs sm:text-sm font-bold">
                              {item.title}
                            </p>
                            <p
                              className={cn(
                                "truncate text-[11px] transition-colors",
                                isSelected ? "text-white/80" : "text-ink-soft",
                              )}
                            >
                              {item.subtitle}
                            </p>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                          {item.badge && (
                            <span
                              className={cn(
                                "rounded-full px-2 py-0.5 text-[10px] font-bold transition-colors",
                                isSelected
                                  ? "bg-white/20 text-white"
                                  : "border border-line bg-paper text-ink-soft dark:bg-white/10 dark:text-white/80",
                              )}
                            >
                              {item.badge}
                            </span>
                          )}
                          <CornerDownLeft
                            className={cn(
                              "size-3.5 transition-opacity",
                              isSelected ? "opacity-100" : "opacity-0",
                            )}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer info bar */}
        <div className="flex items-center justify-between border-t border-line bg-paper/60 px-4 py-2.5 text-[11px] text-ink-soft dark:bg-[#0a1426]/70">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="latin rounded border border-line bg-card px-1 text-[10px] dark:bg-white/10">↑↓</span> للتنقل
            </span>
            <span className="flex items-center gap-1">
              <span className="latin rounded border border-line bg-card px-1 text-[10px] dark:bg-white/10">Enter</span> للفتح
            </span>
            <span className="flex items-center gap-1">
              <span className="latin rounded border border-line bg-card px-1 text-[10px] dark:bg-white/10">Esc</span> للإغلاق
            </span>
          </div>
          <span className="font-semibold text-iris dark:text-sky-400">
            Link Me Spotlight ⚡
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
