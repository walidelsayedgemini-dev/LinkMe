import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  ArrowLeft,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  Moon,
  Search,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Sun,
  Trophy,
  User,
  Volume2,
  VolumeX,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useCompanion, CompanionAvatar } from "@/components/companion";
import { HeaderStreakIndicator } from "@/components/gamification-badges";
import { isSoundEnabled, setSoundEnabled, soundEffects } from "@/lib/sound-effects";
import { Logo } from "@/components/brand";
import { UserAvatar } from "@/components/bits";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NAV = [
  { href: "/", label: "الرئيسية", section: "top" },
  { href: "/courses", label: "الكورسات", section: "courses" },
  { href: "/competitions", label: "المسابقات 🏆", section: "competitions" },
  { href: "/method", label: "طريقتنا", section: "method" },
  { href: "/level-test", label: "اختبار المستوى", section: "level-test" },
  { href: "/pricing", label: "الأسعار", section: "pricing" },
  { href: "/faq", label: "الأسئلة", section: "faq" },
];

export function SiteHeader() {
  const [location, navigate] = useLocation();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { companion, toggleCompanion, setIsModalOpen } = useCompanion();
  const [soundOn, setSoundOn] = useState(() => isSoundEnabled());
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeSection, setActiveSection] = useState("top");

  useEffect(() => {
    setOpen(false);
    setSearchOpen(false);
  }, [location]);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      setScrolled(window.scrollY > 12);
      if (location !== "/") return;
      let active = "top";
      NAV.forEach(item => {
        const el = document.getElementById(item.section);
        if (el && el.getBoundingClientRect().top <= 170) active = item.section;
      });
      setActiveSection(active);
    };
    const queue = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    queue();
    window.addEventListener("scroll", queue, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", queue);
    };
  }, [location]);

  const goToSection = (event: React.MouseEvent, item: (typeof NAV)[number]) => {
    if (
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      location !== "/"
    )
      return;
    const section = document.getElementById(item.section);
    if (!section) return;
    event.preventDefault();
    setOpen(false);
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    requestAnimationFrame(() =>
      section.scrollIntoView({
        behavior: reduced ? "auto" : "smooth",
        block: "start",
      })
    );
    window.history.replaceState(
      null,
      "",
      item.section === "top" ? "/" : `/#${item.section}`
    );
  };
  const isActive = (item: (typeof NAV)[number]) =>
    location === "/"
      ? item.section === activeSection
      : item.href !== "/" && location.startsWith(item.href);
  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    setSearchOpen(false);
    setOpen(false);
    navigate(
      query.trim()
        ? `/courses?q=${encodeURIComponent(query.trim())}`
        : "/courses"
    );
  };
  const handleToggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
    if (next) {
      soundEffects.playClick();
      toast.success("تم تفعيل المؤثرات الصوتية 🔊");
    } else {
      toast.info("تم كتم المؤثرات الصوتية 🔇");
    }
  };
  const themeButton = (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={
        theme === "dark" ? "تفعيل الوضع النهاري" : "تفعيل الوضع الليلي"
      }
      className="grid size-9 sm:size-10 shrink-0 place-items-center rounded-full border border-line bg-card text-ink-soft hover:border-iris hover:text-iris"
    >
      {theme === "dark" ? (
        <Sun className="size-[18px]" />
      ) : (
        <Moon className="size-[18px]" />
      )}
    </button>
  );

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 border-b bg-paper transition-[border-color,box-shadow] duration-200",
        scrolled ? "border-line shadow-sm" : "border-line/60"
      )}
    >
      <div className="container flex h-[72px] items-center justify-between gap-3">
        <Logo />
        <nav
          aria-label="القائمة الرئيسية"
          className="hidden items-center gap-0.5 xl:flex"
        >
          {NAV.map(item => (
            <Link
              key={item.href}
              href={item.href}
              onClick={event => goToSection(event, item)}
              aria-current={
                isActive(item)
                  ? location === "/"
                    ? "location"
                    : "page"
                  : undefined
              }
              className={cn(
                "whitespace-nowrap rounded-full px-3 py-2 text-[13px] font-medium",
                isActive(item)
                  ? "bg-iris-soft text-iris"
                  : "text-ink-soft hover:bg-paper-deep hover:text-ink"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            aria-label="افتح بحث الكورسات"
            className="grid size-9 sm:size-10 place-items-center rounded-full border border-line bg-card text-ink-soft hover:border-iris hover:text-iris"
          >
            <Search className="size-[17px] sm:size-[18px]" />
          </button>
          <HeaderStreakIndicator className="hidden md:inline-flex" />
          <button
            type="button"
            onClick={handleToggleSound}
            aria-label={soundOn ? "كتم المؤثرات الصوتية" : "تشغيل المؤثرات الصوتية"}
            title={soundOn ? "المؤثرات الصوتية مفعّلة — اضغط للكتم" : "المؤثرات الصوتية مكتومة — اضغط للتشغيل"}
            className={cn(
              "hidden md:grid size-10 place-items-center rounded-full border border-line bg-card transition hover:border-iris",
              soundOn ? "text-iris" : "text-ink-soft opacity-60"
            )}
          >
            {soundOn ? <Volume2 className="size-[18px]" /> : <VolumeX className="size-[18px]" />}
          </button>
          <div className="hidden md:block">{themeButton}</div>
          <button
            type="button"
            onClick={toggleCompanion}
            aria-label={`تبديل المرشد (الحالي: ${companion.name})`}
            className={cn(
              "flex items-center gap-1 sm:gap-1.5 rounded-full border p-1 sm:px-2.5 sm:py-1 text-xs font-bold transition hover:scale-105 active:scale-95 shadow-sm",
              companion.id === "khadija"
                ? "border-pink-300 bg-pink-50/90 text-pink-700 hover:bg-pink-100 dark:bg-pink-950/50 dark:text-pink-300"
                : "border-blue-300 bg-blue-50/90 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/50 dark:text-blue-300"
            )}
            title={`المرشد الحالي: ${companion.name} (${companion.badge}) — اضغط للتبديل`}
          >
            <CompanionAvatar size={26} />
            <span className="hidden sm:inline font-semibold">{companion.name}</span>
            <span className="hidden sm:inline text-[10px] opacity-75">{companion.favoriteEmoji}</span>
          </button>
          {user ? (
            <DropdownMenu dir="rtl">
              <DropdownMenuTrigger asChild>
                <button
                  aria-label="قائمة حسابي"
                  className="rounded-full border border-line bg-card p-1"
                >
                  <UserAvatar name={user.name} src={user.avatarUrl} size={30} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 bg-card text-ink"
              >
                <DropdownMenuLabel>
                  <span className="block">{user.name}</span>
                  <span
                    dir="ltr"
                    className="block truncate text-xs font-normal text-ink-soft"
                  >
                    {user.email}
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {user.role === "admin" ? <>
                  <DropdownMenuItem onClick={() => navigate("/admin")}><ShieldCheck className="size-4 text-iris" /> لوحة المالك والطلاب</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/admin?tab=classrooms")}><GraduationCap className="size-4" /> الفصول الدراسية 🏫</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/admin?tab=tasks")}><ClipboardList className="size-4" /> واجبات الطلاب ومتابعتهم</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/admin?tab=messages")}><MessageCircle className="size-4" /> محادثات الطلاب</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/admin?tab=premium")}><GraduationCap className="size-4" /> التفعيل المدفوع وخطط الإتقان</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/admin?tab=curriculum")}><LayoutDashboard className="size-4" /> تعديل محتوى الكورسات</DropdownMenuItem>
                </> : user.role === "instructor" ? <DropdownMenuItem onClick={() => navigate("/coaching")}><GraduationCap className="size-4" /> متابعة الطلاب المعيّنين لي</DropdownMenuItem> : <>
                  <DropdownMenuItem onClick={() => navigate("/dashboard")}><LayoutDashboard className="size-4" /> لوحة تعلّمي</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/competitions")}><Trophy className="size-4 text-amber-500" /> المسابقات وفصلي والأفتارات 🏆</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/homework")}><ClipboardList className="size-4" /> واجباتي وتسليماتي</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/chat")}><MessageCircle className="size-4" /> كلّم المدرّس</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/premium")}><GraduationCap className="size-4" /> خطة الإتقان والمراجعة اليومية</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate(`/students/${user.id}`)}><GraduationCap className="size-4" /> ملفي الدراسي</DropdownMenuItem>
                </>}
                <DropdownMenuItem onClick={() => navigate("/profile")}>
                  <Settings className="size-4" /> حسابي وإعداداتي
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/orders")}>
                  <ShoppingBag className="size-4" /> مشترياتي
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={async () => {
                    await logout();
                    navigate("/");
                  }}
                >
                  <LogOut className="size-4" /> تسجيل الخروج
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link
              href="/login"
              className="hidden h-10 items-center gap-2 rounded-full bg-iris px-4 text-xs font-semibold text-white hover:bg-iris-deep sm:inline-flex"
            >
              <User className="size-3.5" /> تسجيل الدخول
            </Link>
          )}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="افتح قائمة التنقل"
                className="rounded-full xl:hidden"
              >
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[85vw] max-w-[320px] overflow-y-auto bg-paper p-0"
              dir="rtl"
            >
              <SheetTitle className="sr-only">قائمة التنقل</SheetTitle>
              <div className="flex min-h-full flex-col gap-5 p-5 pt-6">
                <div className="pe-10">
                  <Logo />
                </div>
                <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-line bg-card p-3">
                  <HeaderStreakIndicator />
                  <button
                    type="button"
                    onClick={handleToggleSound}
                    aria-label={soundOn ? "كتم المؤثرات الصوتية" : "تشغيل المؤثرات الصوتية"}
                    className={cn(
                      "grid size-9 place-items-center rounded-full border border-line bg-paper transition hover:border-iris",
                      soundOn ? "text-iris" : "text-ink-soft opacity-60"
                    )}
                  >
                    {soundOn ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
                  </button>
                  {themeButton}
                </div>
                <nav aria-label="القائمة الجوالة" className="flex flex-col">
                  {NAV.map((item, i) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={event => {
                        goToSection(event, item);
                        setOpen(false);
                      }}
                      className={cn(
                        "flex items-center justify-between border-b border-line py-4 text-sm",
                        isActive(item)
                          ? "font-semibold text-iris"
                          : "text-ink-soft"
                      )}
                    >
                      <span>{item.label}</span>
                      <span className="latin text-[10px] opacity-50">0{i}</span>
                    </Link>
                  ))}
                </nav>
                <div className="mt-auto space-y-3">
                  {user ? (
                    <>
                      <Button
                        asChild
                        className="w-full rounded-full bg-iris text-white"
                      >
                        <Link href="/dashboard">لوحة التعلّم</Link>
                      </Button>
                      <Button
                        asChild
                        variant="outline"
                        className="w-full rounded-full"
                      >
                        <Link href="/homework">واجباتي وتسليماتي</Link>
                      </Button>
                      {user.role === "admin" && (
                        <Button
                          asChild
                          variant="outline"
                          className="w-full rounded-full"
                        >
                          <Link href="/admin">
                            <ShieldCheck className="size-4" /> لوحة التحكم
                          </Link>
                        </Button>
                      )}
                    </>
                  ) : (
                    <>
                      <Button
                        asChild
                        className="w-full rounded-full bg-iris text-white"
                      >
                        <Link href="/signup">اعمل حسابك</Link>
                      </Button>
                      <Button
                        asChild
                        variant="outline"
                        className="w-full rounded-full"
                      >
                        <Link href="/login">تسجيل الدخول</Link>
                      </Button>
                    </>
                  )}
                  <Link
                    href="/contact"
                    className="block py-2 text-center text-xs text-ink-soft"
                  >
                    محتاج مساعدة؟ كلّمنا
                  </Link>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent
          dir="rtl"
          className="rounded-3xl border-line bg-card p-6 text-ink sm:max-w-xl"
        >
          <DialogHeader className="text-start">
            <DialogTitle className="text-xl">
              خطوتك الجاية في <span className="hl-word">كورس.</span>
            </DialogTitle>
            <DialogDescription className="text-ink-soft">
              دوّر باسم الكورس أو المهارة اللي عايز تطوّرها.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={submitSearch}
            className="flex items-center gap-3 rounded-2xl border border-line bg-paper p-2 ps-4 focus-within:border-iris focus-within:ring-2 focus-within:ring-iris/15"
          >
            <Search aria-hidden className="size-5 shrink-0 text-ink-soft" />
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="محادثة، قواعد، آيلتس…"
              aria-label="اسم الكورس أو المهارة"
              className="h-10 min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-soft"
            />
            <button
              type="submit"
              className="grid size-10 shrink-0 place-items-center rounded-xl bg-iris text-white"
              aria-label="تنفيذ البحث"
            >
              <ArrowLeft className="size-4" />
            </button>
          </form>
          <div className="flex flex-wrap gap-2">
            {[
              { label: "محادثة", href: "/courses?category=speaking" },
              { label: "قواعد", href: "/courses?category=grammar" },
              { label: "آيلتس", href: "/courses?category=ielts" },
              { label: "للأطفال", href: "/kids" },
            ].map(item => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSearchOpen(false)}
                className="rounded-full border border-line px-3 py-1.5 text-xs text-ink-soft hover:border-iris hover:text-iris"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
}
