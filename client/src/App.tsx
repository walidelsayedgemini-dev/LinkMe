import { useEffect } from "react";
import { Route, Switch, useLocation } from "wouter";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import { lazy, Suspense } from "react";
import Home from "./pages/Home";

const Courses = lazy(() => import("./pages/Courses"));
const CourseDetail = lazy(() => import("./pages/CourseDetail"));
const Instructors = lazy(() => import("./pages/Instructors"));
const InstructorProfile = lazy(() => import("./pages/InstructorProfile"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Faq = lazy(() => import("./pages/Faq"));
const Contact = lazy(() => import("./pages/Contact"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Learn = lazy(() => import("./pages/Learn"));
const Homework = lazy(() => import("./pages/Homework"));
const Chat = lazy(() => import("./pages/Chat"));
const Premium = lazy(() => import("./pages/Premium"));
const Coaching = lazy(() => import("./pages/Coaching"));
const Profile = lazy(() => import("./pages/Profile"));
const Orders = lazy(() => import("./pages/Orders"));
const LevelTest = lazy(() => import("./pages/LevelTest"));
const Method = lazy(() => import("./pages/Method"));
const Owner = lazy(() => import("./pages/Owner"));
const About = lazy(() => import("./pages/About"));
const AdminConsole = lazy(() => import("./pages/Admin"));
const StudentProfile = lazy(() => import("./pages/StudentProfile"));
const Path = lazy(() => import("./pages/Path"));
const Kids = lazy(() => import("./pages/Kids"));
const VerifyCertificate = lazy(() => import("./pages/VerifyCertificate"));
const Competitions = lazy(() => import("./pages/Competitions"));
const Flashcards = lazy(() => import("./pages/Flashcards"));
const Roleplay = lazy(() => import("./pages/Roleplay"));
const SpeedQuiz = lazy(() => import("./pages/SpeedQuiz"));
const NotFound = lazy(() => import("./pages/NotFound"));
import { CompanionProvider } from "./contexts/CompanionContext";
import { CompanionFloatingWidget, CompanionSelectionDialog } from "./components/companion";
import { WhatsAppFab } from "./components/whatsapp";
import { CornerProps } from "@/components/decor";
import { SiteHeader } from "@/components/layout/site-header";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { StudyAtmosphere } from "@/components/study-atmosphere";
import { PwaInstallPrompt } from "@/components/pwa-install-prompt";

const ROUTE_LOADERS: Record<string, () => Promise<unknown>> = {
  "/about": () => import("./pages/About"),
  "/owner": () => import("./pages/Owner"),
  "/admin": () => import("./pages/Admin"),
  "/courses": () => import("./pages/Courses"),
  "/path": () => import("./pages/Path"),
  "/kids": () => import("./pages/Kids"),
  "/method": () => import("./pages/Method"),
  "/level-test": () => import("./pages/LevelTest"),
  "/instructors": () => import("./pages/Instructors"),
  "/pricing": () => import("./pages/Pricing"),
  "/faq": () => import("./pages/Faq"),
  "/contact": () => import("./pages/Contact"),
  "/login": () => import("./pages/Login"),
  "/signup": () => import("./pages/Signup"),
  "/dashboard": () => import("./pages/Dashboard"),
  "/homework": () => import("./pages/Homework"),
  "/chat": () => import("./pages/Chat"),
  "/premium": () => import("./pages/Premium"),
  "/coaching": () => import("./pages/Coaching"),
  "/orders": () => import("./pages/Orders"),
  "/profile": () => import("./pages/Profile"),
  "/competitions": () => import("./pages/Competitions"),
  "/flashcards": () => import("./pages/Flashcards"),
  "/roleplay": () => import("./pages/Roleplay"),
  "/speed-quiz": () => import("./pages/SpeedQuiz"),
};

/** Warm the next page's chunk while the visitor hovers a link, so navigation feels instant. */
function RoutePrefetch() {
  useEffect(() => {
    const loaded = new Set<string>();
    const prefetch = (href: string) => {
      const path = href.split("?")[0].split("#")[0];
      const loader =
        ROUTE_LOADERS[path] ??
        (path.startsWith("/courses/")
          ? () => import("./pages/CourseDetail")
          : path.startsWith("/instructors/")
            ? () => import("./pages/InstructorProfile")
            : path.startsWith("/learn/")
              ? () => import("./pages/Learn")
              : null);
      if (!loader || loaded.has(path)) return;
      loaded.add(path);
      void loader().catch(() => undefined);
    };
    const onOver = (event: PointerEvent) => {
      const link = (event.target as HTMLElement | null)?.closest?.("a");
      const href = link?.getAttribute("href");
      if (href && href.startsWith("/") && !href.startsWith("//"))
        prefetch(href);
    };
    document.addEventListener("pointerover", onOver, { passive: true });
    document.addEventListener("focusin", onOver as unknown as EventListener);
    return () => {
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener(
        "focusin",
        onOver as unknown as EventListener
      );
    };
  }, []);
  return null;
}

function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [location]);
  return null;
}

function PageLoader() {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <span
        className="size-8 animate-spin rounded-full border-2 border-line border-t-iris"
        aria-label="جارٍ التحميل"
      />
    </div>
  );
}

function Router() {
  const [location] = useLocation();
  return (
    <Suspense fallback={<PageLoader />}>
      <div key={location} className="page-enter">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/courses" component={Courses} />
          <Route path="/courses/:slug" component={CourseDetail} />
          <Route path="/path" component={Path} />
          <Route path="/kids" component={Kids} />
          <Route path="/instructors" component={Instructors} />
          <Route path="/instructors/:slug" component={InstructorProfile} />
          <Route path="/pricing" component={Pricing} />
          <Route path="/level-test" component={LevelTest} />
          <Route path="/verify" component={VerifyCertificate} />
          <Route path="/verify/:code" component={VerifyCertificate} />
          <Route path="/competitions" component={Competitions} />
          <Route path="/flashcards" component={Flashcards} />
          <Route path="/roleplay" component={Roleplay} />
          <Route path="/speed-quiz" component={SpeedQuiz} />
          <Route path="/method" component={Method} />
          <Route path="/about" component={About} />
          <Route path="/owner" component={Owner} />
          <Route path="/admin" component={AdminConsole} />
          <Route path="/students/:id" component={StudentProfile} />
          <Route path="/faq" component={Faq} />
          <Route path="/contact" component={Contact} />
          <Route path="/login" component={Login} />
          <Route path="/signup" component={Signup} />
          <Route path="/forgot-password" component={ForgotPassword} />
          <Route path="/reset-password" component={ResetPassword} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/homework" component={Homework} />
          <Route path="/chat" component={Chat} />
          <Route path="/premium" component={Premium} />
          <Route path="/coaching" component={Coaching} />
          <Route path="/learn/:slug" component={Learn} />
          <Route path="/profile" component={Profile} />
          <Route path="/orders" component={Orders} />
          <Route path="/404" component={NotFound} />
          <Route component={NotFound} />
        </Switch>
      </div>
    </Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable>
        <TooltipProvider>
          <AuthProvider>
            <CompanionProvider>
              <ScrollToTop />
              <RoutePrefetch />
              <Toaster position="top-center" richColors />
              <div aria-hidden className="global-notebook-grid notebook-grid" />
              <StudyAtmosphere />
              <CornerProps className="study-corners" />
              <div className="relative z-[1]">
                <SiteNavigation />
                <Router />
              </div>
              <FloatingCompanion />
              <FloatingWhatsApp />
              <MobileBottomNav />
              <PwaInstallPrompt />
              <CompanionSelectionDialog />
            </CompanionProvider>
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

const AUTH_PATHS = ["/login", "/signup", "/forgot-password", "/reset-password"];

function FloatingCompanion() {
  const [location] = useLocation();
  if (AUTH_PATHS.some(path => location.startsWith(path)) || location.startsWith("/level-test")) return null;
  return <CompanionFloatingWidget />;
}

/** The floating WhatsApp shortcut is hidden on the auth and active test screens. */
function FloatingWhatsApp() {
  const [location] = useLocation();
  if (AUTH_PATHS.some(path => location.startsWith(path)) || location.startsWith("/level-test")) return null;
  return <WhatsAppFab />;
}

function SiteNavigation() {
  const [location] = useLocation();
  if (AUTH_PATHS.some(path => location.startsWith(path))) return null;
  return <SiteHeader />;
}
