import type { AvatarPreset } from "./gamification-catalog";

export type AvatarCategory =
  | "pixar3d"
  | "adventure"
  | "artistic"
  | "cartoon"
  | "pro_vip";

export const AVATAR_CATEGORIES: {
  id: "all" | AvatarCategory;
  label: string;
  emoji: string;
}[] = [
  { id: "all", label: "الكل (100 أفتار 3D)", emoji: "✨" },
  { id: "pixar3d", label: "3D خاص بـ Link Me", emoji: "🎬" },
  { id: "adventure", label: "3D أبطال وطلاب", emoji: "🎓" },
  { id: "artistic", label: "3D مهن وشخصيات", emoji: "💼" },
  { id: "cartoon", label: "3D حيوانات لطيفة", emoji: "🐾" },
  { id: "pro_vip", label: "3D ملكي وVIP PRO", emoji: "👑" },
];

export const EXPANDED_AVATARS_87: AvatarPreset[] = [
  // 25 Adventure Heroes
  { id: "adv_01", label: "فارس الطلاقة", emoji: "🛡️", imageUrl: "/avatars/adv_01.webp", bgClass: "from-sky-400 to-blue-500", category: "adventure" },
  { id: "adv_02", label: "سلمى المبدعة", emoji: "🌸", imageUrl: "/avatars/adv_02.webp", bgClass: "from-pink-300 to-rose-400", category: "adventure" },
  { id: "adv_03", label: "يوسف البطل", emoji: "⚡", imageUrl: "/avatars/adv_03.webp", bgClass: "from-indigo-400 to-blue-500", category: "adventure" },
  { id: "adv_04", label: "ملك النشيطة", emoji: "☀️", imageUrl: "/avatars/adv_04.webp", bgClass: "from-amber-300 to-yellow-400", category: "adventure" },
  { id: "adv_05", label: "آدم المغامر", emoji: "🧭", imageUrl: "/avatars/adv_05.webp", bgClass: "from-emerald-300 to-teal-400", category: "adventure" },
  { id: "adv_06", label: "نور المشرقة", emoji: "✨", imageUrl: "/avatars/adv_06.webp", bgClass: "from-violet-300 to-purple-400", category: "adventure" },
  { id: "adv_07", label: "كريم الشجاع", emoji: "🦅", imageUrl: "/avatars/adv_07.webp", bgClass: "from-sky-300 to-cyan-400", category: "adventure" },
  { id: "adv_08", label: "فريدة الذكية", emoji: "💎", imageUrl: "/avatars/adv_08.webp", bgClass: "from-rose-300 to-pink-400", category: "adventure" },
  { id: "adv_09", label: "عمر السريع", emoji: "🔥", imageUrl: "/avatars/adv_09.webp", bgClass: "from-orange-300 to-amber-400", category: "adventure" },
  { id: "adv_10", label: "مريم الهادئة", emoji: "🌷", imageUrl: "/avatars/adv_10.webp", bgClass: "from-purple-300 to-fuchsia-400", category: "adventure" },
  { id: "adv_11", label: "زياد الطموح", emoji: "🚀", imageUrl: "/avatars/adv_11.webp", bgClass: "from-blue-300 to-indigo-400", category: "adventure" },
  { id: "adv_12", label: "جنى المرحة", emoji: "🌟", imageUrl: "/avatars/adv_12.webp", bgClass: "from-yellow-300 to-amber-400", category: "adventure" },
  { id: "adv_13", label: "طارق المستكشف", emoji: "🗺️", imageUrl: "/avatars/adv_13.webp", bgClass: "from-teal-300 to-emerald-400", category: "adventure" },
  { id: "adv_14", label: "هنا المتفوقة", emoji: "🦋", imageUrl: "/avatars/adv_14.webp", bgClass: "from-fuchsia-300 to-pink-400", category: "adventure" },
  { id: "adv_15", label: "حمزة النجم", emoji: "⭐", imageUrl: "/avatars/adv_15.webp", bgClass: "from-indigo-400 to-violet-500", category: "adventure" },
  { id: "adv_16", label: "ليلى الرقيقة", emoji: "🌺", imageUrl: "/avatars/adv_16.webp", bgClass: "from-red-300 to-rose-400", category: "adventure" },
  { id: "adv_17", label: "مصطفى الفائز", emoji: "🏆", imageUrl: "/avatars/adv_17.webp", bgClass: "from-green-300 to-emerald-400", category: "adventure" },
  { id: "adv_18", label: "سارة الموهوبة", emoji: "🎨", imageUrl: "/avatars/adv_18.webp", bgClass: "from-pink-300 to-fuchsia-400", category: "adventure" },
  { id: "adv_19", label: "علي المتحدي", emoji: "⚡", imageUrl: "/avatars/adv_19.webp", bgClass: "from-sky-400 to-blue-500", category: "adventure" },
  { id: "adv_20", label: "ياسمين الحلوة", emoji: "🌼", imageUrl: "/avatars/adv_20.webp", bgClass: "from-amber-300 to-orange-400", category: "adventure" },
  { id: "adv_21", label: "مازن الذكي", emoji: "🧠", imageUrl: "/avatars/adv_21.webp", bgClass: "from-violet-400 to-purple-500", category: "adventure" },
  { id: "adv_22", label: "روان النشيطة", emoji: "🌿", imageUrl: "/avatars/adv_22.webp", bgClass: "from-emerald-400 to-teal-500", category: "adventure" },
  { id: "adv_23", label: "إياد البطل", emoji: "🎯", imageUrl: "/avatars/adv_23.webp", bgClass: "from-orange-400 to-red-400", category: "adventure" },
  { id: "adv_24", label: "حبيبة المتألقة", emoji: "💖", imageUrl: "/avatars/adv_24.webp", bgClass: "from-pink-400 to-rose-500", category: "adventure" },
  { id: "adv_25", label: "سيف الطموح", emoji: "⚔️", imageUrl: "/avatars/adv_25.webp", bgClass: "from-blue-400 to-indigo-500", category: "adventure" },

  // 22 Artistic Portraits
  { id: "art_01", label: "بورتريه القمر", emoji: "🌙", imageUrl: "/avatars/art_01.webp", bgClass: "from-indigo-300 to-blue-400", category: "artistic" },
  { id: "art_02", label: "بورتريه الورد", emoji: "🌹", imageUrl: "/avatars/art_02.webp", bgClass: "from-pink-300 to-rose-400", category: "artistic" },
  { id: "art_03", label: "بورتريه البحر", emoji: "🌊", imageUrl: "/avatars/art_03.webp", bgClass: "from-sky-300 to-cyan-400", category: "artistic" },
  { id: "art_04", label: "بورتريه الشمس", emoji: "☀️", imageUrl: "/avatars/art_04.webp", bgClass: "from-amber-300 to-yellow-400", category: "artistic" },
  { id: "art_05", label: "بورتريه الياسمين", emoji: "🌸", imageUrl: "/avatars/art_05.webp", bgClass: "from-purple-300 to-violet-400", category: "artistic" },
  { id: "art_06", label: "بورتريه النسيم", emoji: "🍃", imageUrl: "/avatars/art_06.webp", bgClass: "from-emerald-300 to-teal-400", category: "artistic" },
  { id: "art_07", label: "بورتريه النجوم", emoji: "✨", imageUrl: "/avatars/art_07.webp", bgClass: "from-violet-300 to-indigo-400", category: "artistic" },
  { id: "art_08", label: "بورتريه الفجر", emoji: "🌅", imageUrl: "/avatars/art_08.webp", bgClass: "from-rose-300 to-pink-400", category: "artistic" },
  { id: "art_09", label: "بورتريه الكريستال", emoji: "💠", imageUrl: "/avatars/art_09.webp", bgClass: "from-cyan-300 to-sky-400", category: "artistic" },
  { id: "art_10", label: "بورتريه اللؤلؤ", emoji: "🤍", imageUrl: "/avatars/art_10.webp", bgClass: "from-yellow-200 to-amber-300", category: "artistic" },
  { id: "art_11", label: "بورتريه الربيع", emoji: "🌱", imageUrl: "/avatars/art_11.webp", bgClass: "from-green-300 to-emerald-400", category: "artistic" },
  { id: "art_12", label: "فنان السكيتش", emoji: "✏️", imageUrl: "/avatars/art_12.webp", bgClass: "from-blue-300 to-indigo-400", category: "artistic" },
  { id: "art_13", label: "مصمم الإبداع", emoji: "🎨", imageUrl: "/avatars/art_13.webp", bgClass: "from-violet-300 to-purple-400", category: "artistic" },
  { id: "art_14", label: "رسام الطموح", emoji: "🖌️", imageUrl: "/avatars/art_14.webp", bgClass: "from-orange-300 to-amber-400", category: "artistic" },
  { id: "art_15", label: "أيقونة الموضة", emoji: "✨", imageUrl: "/avatars/art_15.webp", bgClass: "from-pink-300 to-rose-400", category: "artistic" },
  { id: "art_16", label: "بطل القراءة", emoji: "📖", imageUrl: "/avatars/art_16.webp", bgClass: "from-emerald-300 to-teal-400", category: "artistic" },
  { id: "art_17", label: "صديق الكافيه", emoji: "☕", imageUrl: "/avatars/art_17.webp", bgClass: "from-amber-300 to-yellow-400", category: "artistic" },
  { id: "art_18", label: "عاشق الموسيقى", emoji: "🎵", imageUrl: "/avatars/art_18.webp", bgClass: "from-sky-300 to-blue-400", category: "artistic" },
  { id: "art_19", label: "قائد الحوار", emoji: "🎙️", imageUrl: "/avatars/art_19.webp", bgClass: "from-purple-300 to-fuchsia-400", category: "artistic" },
  { id: "art_20", label: "نجم المسرح", emoji: "🎭", imageUrl: "/avatars/art_20.webp", bgClass: "from-rose-300 to-pink-400", category: "artistic" },
  { id: "art_21", label: "مبدع السفر", emoji: "✈️", imageUrl: "/avatars/art_21.webp", bgClass: "from-teal-300 to-cyan-400", category: "artistic" },
  { id: "art_22", label: "ذكي القواعد", emoji: "💡", imageUrl: "/avatars/art_22.webp", bgClass: "from-indigo-300 to-blue-400", category: "artistic" },

  // 20 Fun Cartoon Characters
  { id: "car_01", label: "ضحكة السعادة", emoji: "😄", imageUrl: "/avatars/car_01.webp", bgClass: "from-yellow-300 to-amber-400", category: "cartoon" },
  { id: "car_02", label: "طالب الصباح", emoji: "☀️", imageUrl: "/avatars/car_02.webp", bgClass: "from-sky-300 to-blue-400", category: "cartoon" },
  { id: "car_03", label: "بطلة التحدي", emoji: "⭐", imageUrl: "/avatars/car_03.webp", bgClass: "from-pink-300 to-rose-400", category: "cartoon" },
  { id: "car_04", label: "صديق الفصل", emoji: "🤝", imageUrl: "/avatars/car_04.webp", bgClass: "from-green-300 to-emerald-400", category: "cartoon" },
  { id: "car_05", label: "مخترع صغير", emoji: "🔬", imageUrl: "/avatars/car_05.webp", bgClass: "from-violet-300 to-purple-400", category: "cartoon" },
  { id: "car_06", label: "عاشقة الكتب", emoji: "📚", imageUrl: "/avatars/car_06.webp", bgClass: "from-orange-300 to-amber-400", category: "cartoon" },
  { id: "car_07", label: "كابتن النطق", emoji: "🎧", imageUrl: "/avatars/car_07.webp", bgClass: "from-cyan-300 to-sky-400", category: "cartoon" },
  { id: "car_08", label: "فراشة المرح", emoji: "🦋", imageUrl: "/avatars/car_08.webp", bgClass: "from-fuchsia-300 to-pink-400", category: "cartoon" },
  { id: "car_09", label: "بطل القواعد", emoji: "📝", imageUrl: "/avatars/car_09.webp", bgClass: "from-indigo-300 to-blue-400", category: "cartoon" },
  { id: "car_10", label: "نجم الفلاش كارد", emoji: "🃏", imageUrl: "/avatars/car_10.webp", bgClass: "from-amber-400 to-orange-500", category: "cartoon" },
  { id: "car_11", label: "محترف الزووم", emoji: "💻", imageUrl: "/avatars/car_11.webp", bgClass: "from-blue-400 to-indigo-500", category: "cartoon" },
  { id: "car_12", label: "متحدثة بطلاقة", emoji: "💬", imageUrl: "/avatars/car_12.webp", bgClass: "from-pink-400 to-rose-500", category: "cartoon" },
  { id: "car_13", label: "مسافر حول العالم", emoji: "🌍", imageUrl: "/avatars/car_13.webp", bgClass: "from-emerald-400 to-teal-500", category: "cartoon" },
  { id: "car_14", label: "مطور المستقبل", emoji: "⚙️", imageUrl: "/avatars/car_14.webp", bgClass: "from-indigo-400 to-violet-500", category: "cartoon" },
  { id: "car_15", label: "نجمة الآيلتس", emoji: "🎯", imageUrl: "/avatars/car_15.webp", bgClass: "from-amber-300 to-yellow-500", category: "cartoon" },
  { id: "car_16", label: "قائد المجموعة", emoji: "🏫", imageUrl: "/avatars/car_16.webp", bgClass: "from-cyan-400 to-blue-500", category: "cartoon" },
  { id: "car_17", label: "عبقرية الكلام", emoji: "✨", imageUrl: "/avatars/car_17.webp", bgClass: "from-purple-400 to-fuchsia-500", category: "cartoon" },
  { id: "car_18", label: "بطل المسابقات", emoji: "🏆", imageUrl: "/avatars/car_18.webp", bgClass: "from-orange-400 to-red-500", category: "cartoon" },
  { id: "car_19", label: "محب القهوة", emoji: "☕", imageUrl: "/avatars/car_19.webp", bgClass: "from-rose-400 to-pink-500", category: "cartoon" },
  { id: "car_20", label: "بطل الـ 60 ثانية", emoji: "⚡", imageUrl: "/avatars/car_20.webp", bgClass: "from-green-400 to-emerald-500", category: "cartoon" },

  // 20 Exclusive PRO VIP Characters
  { id: "pro_01", label: "أمير الطلاقة PRO", emoji: "👑", imageUrl: "/avatars/pro_01.webp", bgClass: "from-amber-400 to-orange-500", category: "pro_vip", isPro: true },
  { id: "pro_02", label: "أميرة النخبة PRO", emoji: "👑", imageUrl: "/avatars/pro_02.webp", bgClass: "from-pink-400 to-purple-600", category: "pro_vip", isPro: true },
  { id: "pro_03", label: "أسطورة الآيلتس PRO", emoji: "🎯", imageUrl: "/avatars/pro_03.webp", bgClass: "from-indigo-500 to-blue-600", category: "pro_vip", isPro: true },
  { id: "pro_04", label: "قائد الشركات PRO", emoji: "💼", imageUrl: "/avatars/pro_04.webp", bgClass: "from-emerald-500 to-teal-600", category: "pro_vip", isPro: true },
  { id: "pro_05", label: "روبوت الذكاء PRO", emoji: "🤖", imageUrl: "/avatars/pro_05.webp", bgClass: "from-violet-600 to-blue-600", category: "pro_vip", isPro: true },
  { id: "pro_06", label: "سايبر الطلاقة PRO", emoji: "⚡", imageUrl: "/avatars/pro_06.webp", bgClass: "from-cyan-500 to-indigo-600", category: "pro_vip", isPro: true },
  { id: "pro_07", label: "تيتان النطق PRO", emoji: "🔥", imageUrl: "/avatars/pro_07.webp", bgClass: "from-amber-500 to-red-600", category: "pro_vip", isPro: true },
  { id: "pro_08", label: "فارس المجرة PRO", emoji: "🌌", imageUrl: "/avatars/pro_08.webp", bgClass: "from-purple-600 to-pink-500", category: "pro_vip", isPro: true },
  { id: "pro_09", label: "نجمة الألماس PRO", emoji: "💎", imageUrl: "/avatars/pro_09.webp", bgClass: "from-sky-400 to-indigo-500", category: "pro_vip", isPro: true },
  { id: "pro_10", label: "سيدة الأعمال PRO", emoji: "✨", imageUrl: "/avatars/pro_10.webp", bgClass: "from-amber-500 to-orange-600", category: "pro_vip", isPro: true },
  { id: "pro_11", label: "حكيم اللغات 3D PRO", emoji: "🦉", imageUrl: "/avatars/owl.webp", bgClass: "from-emerald-600 to-sky-600", category: "pro_vip", isPro: true },
  { id: "pro_12", label: "أسطورة الزمرد PRO", emoji: "❇️", imageUrl: "/avatars/pro_12.webp", bgClass: "from-emerald-500 to-green-700", category: "pro_vip", isPro: true },
  { id: "pro_13", label: "بطل الذهب PRO", emoji: "🥇", imageUrl: "/avatars/pro_13.webp", bgClass: "from-yellow-500 to-orange-500", category: "pro_vip", isPro: true },
  { id: "pro_14", label: "ملكة الكاريزما PRO", emoji: "🌟", imageUrl: "/avatars/pro_14.webp", bgClass: "from-pink-500 to-violet-600", category: "pro_vip", isPro: true },
  { id: "pro_15", label: "محترف التفاوض PRO", emoji: "🤝", imageUrl: "/avatars/pro_15.webp", bgClass: "from-blue-600 to-indigo-700", category: "pro_vip", isPro: true },
  { id: "pro_16", label: "رائد الابتكار PRO", emoji: "🚀", imageUrl: "/avatars/pro_16.webp", bgClass: "from-fuchsia-500 to-indigo-600", category: "pro_vip", isPro: true },
  { id: "pro_17", label: "حارس الشعلة PRO", emoji: "🔥", imageUrl: "/avatars/pro_17.webp", bgClass: "from-orange-500 to-rose-600", category: "pro_vip", isPro: true },
  { id: "pro_18", label: "سفير اللغات PRO", emoji: "🌐", imageUrl: "/avatars/pro_18.webp", bgClass: "from-teal-500 to-blue-600", category: "pro_vip", isPro: true },
  { id: "pro_19", label: "كابتن النخبة PRO", emoji: "🎖️", imageUrl: "/avatars/pro_19.webp", bgClass: "from-yellow-600 to-amber-700", category: "pro_vip", isPro: true },
  { id: "pro_20", label: "إمبراطور Link Me PRO", emoji: "👑", imageUrl: "/avatars/pro_20.webp", bgClass: "from-yellow-500 to-purple-600", category: "pro_vip", isPro: true },
];
