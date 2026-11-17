import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

type Theme = "light" | "dark";
interface ThemeContextType {
  theme: Theme;
  toggleTheme?: () => void;
  setTheme: (theme: Theme) => void;
  switchable: boolean;
}
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
const STORAGE_KEY = "theme";
const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;
function initialTheme(fallback: Theme): Theme {
  if (typeof window === "undefined") return fallback;
  const forced = new URLSearchParams(window.location.search).get("theme");
  if (forced === "light" || forced === "dark") return forced;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    /* Private browsing does not prevent theme changes. */
  }
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : fallback;
}
interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  switchable?: boolean;
}
export function ThemeProvider({
  children,
  defaultTheme = "light",
  switchable = false,
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() =>
    switchable ? initialTheme(defaultTheme) : defaultTheme
  );
  const current = useRef(theme);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useIsomorphicLayoutEffect(() => {
    current.current = theme;
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.style.colorScheme = theme;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", theme === "dark" ? "#0f1c2e" : "#ffffff");
    if (switchable) {
      try {
        window.localStorage.setItem(STORAGE_KEY, theme);
      } catch {
        /* optional persistence */
      }
    }
  }, [theme, switchable]);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
      document.documentElement.classList.remove("theme-switching");
    },
    []
  );
  const setTheme = useCallback((next: Theme) => {
    if (next === current.current) return;
    current.current = next;
    if (timer.current) clearTimeout(timer.current);
    if (!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      document.documentElement.classList.add("theme-switching");
      timer.current = setTimeout(
        () => document.documentElement.classList.remove("theme-switching"),
        220
      );
    }
    // No ViewTransition screenshots: React and the document stay interactive.
    document.documentElement.classList.toggle("dark", next === "dark");
    setThemeState(next);
  }, []);
  const toggleTheme = useCallback(
    () => setTheme(current.current === "light" ? "dark" : "light"),
    [setTheme]
  );
  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        toggleTheme: switchable ? toggleTheme : undefined,
        switchable,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}
