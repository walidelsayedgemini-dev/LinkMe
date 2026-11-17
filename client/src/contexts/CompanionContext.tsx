import React, { createContext, useContext, useEffect, useState } from "react";

export type CompanionId = "yassin" | "khadija";

export interface CompanionConfig {
  id: CompanionId;
  name: string;
  englishName: string;
  role: string;
  title: string;
  badge: string;
  tagline: string;
  avatarUrl: string;
  fallbackAvatarUrl: string;
  auraGradient: string;
  shadowColor: string;
  accentColor: string;
  accentBg: string;
  accentText: string;
  borderClass: string;
  gender: "male" | "female";
  favoriteEmoji: string;
  description: string;
  welcomeMessage: string;
  personalityTraits: string[];
  quotes: string[];
}

export const COMPANIONS: Record<CompanionId, CompanionConfig> = {
  yassin: {
    id: "yassin",
    name: "ياسين",
    englishName: "Yassin",
    role: "مساعدك في الرحلة",
    title: "أ. ياسين · مرشدك الذكي 🚀",
    badge: "مرشدك الذكي",
    tagline: "معاك خطوة بخطوة لحد ما تتكلم إنجليزي بثقة وطلاقة!",
    avatarUrl: "/img/yassin-avatar.jpg",
    fallbackAvatarUrl: "/img/yassin.jpg",
    auraGradient: "conic-gradient(from 140deg,#7cc8ff,#3b6bff,#8ad8ff,#3b6bff,#7cc8ff)",
    shadowColor: "rgba(37,99,235,0.75)",
    accentColor: "#3b6bff",
    accentBg: "bg-iris",
    accentText: "text-iris",
    borderClass: "border-iris/25",
    gender: "male",
    favoriteEmoji: "🚀",
    description: "بطل المغامرة، دايماً معاك يشجعك ويبسّط القواعد والمحادثات بطريقة ذكية وعملية وبدون أي تعقيد.",
    welcomeMessage: "أهلاً بيك يا بطل! أنا ياسين، هكون معاك في كل خطوة لحد ما تتكلم إنجليزي بطلاقة وثقة! 🎯",
    personalityTraits: ["ذكي ونشيط ⚡", "عملي ومشجع 💪", "بيبسّط القواعد 🎯"],
    quotes: [
      "عاش يا بطل! الاستمرار هو سر الطلاقة والنجاح 💪",
      "متقلقش من الغلط خالص، كل غلطة بنتعلم منها ونطلع خطوة لقدام 🚀",
      "الهدف مش إنك تحفظ، الهدف إنك تستخدم الإنجليزي في حياتك اليومية 🎯",
      "خمس دقايق إنجليزي كل يوم أحسن من 5 ساعات مرة في الأسبوع! ⭐",
    ],
  },
  khadija: {
    id: "khadija",
    name: "خديجة",
    englishName: "Khadija",
    role: "مرشدتك الكيوت في الرحلة",
    title: "مِس خديجة · مرشدتك الكيوت 🌸",
    badge: "مرشدتك الكيوت",
    tagline: "هنذاكر سوا بطريقة لذيذة وخفيفة خالص ومليانة طاقة حلوة! ✨",
    avatarUrl: "/img/khadija-avatar.jpg",
    fallbackAvatarUrl: "/img/khadija-avatar.svg",
    auraGradient: "conic-gradient(from 140deg,#fbcfe8,#ec4899,#f472b6,#d946ef,#fbcfe8)",
    shadowColor: "rgba(236,72,153,0.75)",
    accentColor: "#ec4899",
    accentBg: "bg-pink-500",
    accentText: "text-pink-600 dark:text-pink-400",
    borderClass: "border-pink-300/40",
    gender: "female",
    favoriteEmoji: "🌸",
    description: "شخصية كيوت ولطيفة جداً، بتشرح بالراحة وبابتسامة وبتخلي التعلم ممتع ولذيذ وخفيف على القلب! ✨",
    welcomeMessage: "يا هلا ومية مرحب! أنا خديجة، مبسوطة أوي إني هكون معاك.. هنذاكر سوا بطريقة لذيذة وسهلة خالص! ✨🌸",
    personalityTraits: ["كيوت ولطيفة جداً 🌸", "صبورة ومبتسمة دايماً 😊", "طاقة إيجابية وتشجيع 💖"],
    quotes: [
      "شاطر جداً وممتاز! كمل معايا يا سكر وبإذن الله هتبقى عبقري في الإنجليزي 💖🌸",
      "الإنجليزي سهل ولذيذ، متقلقش من أي حاجة خالص، إحنا فريق واحد 🎀✨",
      "ابتسم كده وخد نفس عميق.. يلا نبدأ يوم جديد لطيف وممتع سوا 🧁",
      "فخورة بيك وبكل خطوة صغيرة بتعملها كل يوم يا بطل! 🌟🍰",
    ],
  },
};

const STORAGE_KEY = "linkme_companion_choice";

interface CompanionContextType {
  companionId: CompanionId;
  companion: CompanionConfig;
  setCompanionId: (id: CompanionId) => void;
  toggleCompanion: () => void;
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
}

const CompanionContext = createContext<CompanionContextType | null>(null);

export function CompanionProvider({ children }: { children: React.ReactNode }) {
  const [companionId, setCompanionIdState] = useState<CompanionId>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "khadija" || saved === "yassin") return saved;
    } catch {}
    return "yassin";
  });

  const [isModalOpen, setIsModalOpen] = useState(false);

  const setCompanionId = (id: CompanionId) => {
    setCompanionIdState(id);
    try {
      localStorage.setItem(STORAGE_KEY, id);
      window.dispatchEvent(new CustomEvent("linkme:companion", { detail: id }));
    } catch {}
  };

  const toggleCompanion = () => {
    setCompanionId(companionId === "yassin" ? "khadija" : "yassin");
  };

  useEffect(() => {
    const handleCustomChange = (e: Event) => {
      const customEvent = e as CustomEvent<CompanionId>;
      if (customEvent.detail && (customEvent.detail === "yassin" || customEvent.detail === "khadija")) {
        setCompanionIdState(customEvent.detail);
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && (e.newValue === "yassin" || e.newValue === "khadija")) {
        setCompanionIdState(e.newValue);
      }
    };

    window.addEventListener("linkme:companion", handleCustomChange);
    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("linkme:companion", handleCustomChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const companion = COMPANIONS[companionId] || COMPANIONS.yassin;

  return (
    <CompanionContext.Provider
      value={{
        companionId,
        companion,
        setCompanionId,
        toggleCompanion,
        isModalOpen,
        setIsModalOpen,
      }}
    >
      {children}
    </CompanionContext.Provider>
  );
}

export function useCompanion() {
  const ctx = useContext(CompanionContext);
  if (!ctx) {
    // Fallback if rendered outside provider
    return {
      companionId: "yassin" as CompanionId,
      companion: COMPANIONS.yassin,
      setCompanionId: () => {},
      toggleCompanion: () => {},
      isModalOpen: false,
      setIsModalOpen: () => {},
    };
  }
  return ctx;
}
