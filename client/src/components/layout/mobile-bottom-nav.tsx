import { Link, useLocation } from "wouter";
import {
  BookOpen,
  Home,
  LayoutDashboard,
  MessageSquare,
  Trophy,
  User,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const HIDDEN_PREFIXES = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/level-test",
  "/admin",
  "/owner",
];

export function MobileBottomNav() {
  const [location] = useLocation();
  const { user } = useAuth();

  if (HIDDEN_PREFIXES.some(prefix => location.startsWith(prefix))) {
    return null;
  }

  const items = [
    { href: "/", label: "الرئيسية", icon: Home },
    { href: "/courses", label: "الكورسات", icon: BookOpen },
    { href: "/roleplay", label: "تدرّب", icon: MessageSquare },
    { href: "/competitions", label: "المسابقات", icon: Trophy },
    {
      href: user ? "/dashboard" : "/login",
      label: user ? "لوحتي" : "دخول",
      icon: user ? LayoutDashboard : User,
    },
  ];

  const isActive = (href: string) =>
    href === "/" ? location === "/" : location.startsWith(href);

  return (
    <nav
      aria-label="التنقل السريع"
      dir="rtl"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/95 backdrop-blur-md md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto grid max-w-md grid-cols-5">
        {items.map(item => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-semibold transition-colors",
                active ? "text-iris" : "text-ink-soft hover:text-ink"
              )}
            >
              <span
                className={cn(
                  "grid size-8 place-items-center rounded-full transition-colors",
                  active && "bg-iris-soft text-iris"
                )}
              >
                <Icon className="size-[18px]" strokeWidth={active ? 2.3 : 1.8} />
              </span>
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
