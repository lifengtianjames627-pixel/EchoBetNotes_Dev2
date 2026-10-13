export const scaffoldLocales = ["en", "zh", "ko", "ja", "fr", "ru"] as const;

export type ScaffoldLocale = (typeof scaffoldLocales)[number];

export type ScaffoldCopy = {
  title: string;
  status: string;
  loading: string;
  error: string;
  notFound: string;
  retry: string;
};

const copy: Record<ScaffoldLocale, ScaffoldCopy> = {
  en: {
    title: "Echoes Between Notes",
    status: "The local Next.js scaffold is ready.",
    loading: "Loading Echoes Between Notes.",
    error: "Echoes Between Notes could not load this page.",
    notFound: "Echoes Between Notes could not find this page.",
    retry: "Try again",
  },
  zh: {
    title: "音符之间的回声",
    status: "本地 Next.js 脚手架已就绪。",
    loading: "正在加载音符之间的回声。",
    error: "音符之间的回声无法加载此页面。",
    notFound: "音符之间的回声找不到此页面。",
    retry: "重试",
  },
  ko: {
    title: "음표 사이의 메아리",
    status: "로컬 Next.js 스캐폴드가 준비되었습니다.",
    loading: "음표 사이의 메아리를 불러오는 중입니다.",
    error: "음표 사이의 메아리가 이 페이지를 불러오지 못했습니다.",
    notFound: "음표 사이의 메아리가 이 페이지를 찾지 못했습니다.",
    retry: "다시 시도",
  },
  ja: {
    title: "音符のあいだの残響",
    status: "ローカルの Next.js スキャフォールドは準備できています。",
    loading: "音符のあいだの残響を読み込んでいます。",
    error: "音符のあいだの残響はこのページを読み込めませんでした。",
    notFound: "音符のあいだの残響はこのページを見つけられませんでした。",
    retry: "再試行",
  },
  fr: {
    title: "Échos entre les notes",
    status: "L’échafaudage Next.js local est prêt.",
    loading: "Chargement d’Échos entre les notes.",
    error: "Échos entre les notes n’a pas pu charger cette page.",
    notFound: "Échos entre les notes n’a pas trouvé cette page.",
    retry: "Réessayer",
  },
  ru: {
    title: "Эхо между нотами",
    status: "Локальный каркас Next.js готов.",
    loading: "Загрузка «Эхо между нотами».",
    error: "«Эхо между нотами» не удалось загрузить эту страницу.",
    notFound: "«Эхо между нотами» не нашло эту страницу.",
    retry: "Повторить",
  },
};

function isScaffoldLocale(locale: string): locale is ScaffoldLocale {
  return (scaffoldLocales as readonly string[]).includes(locale);
}

export function scaffoldCopy(locale: string): ScaffoldCopy {
  if (isScaffoldLocale(locale)) {
    return copy[locale];
  }
  return copy.en;
}
