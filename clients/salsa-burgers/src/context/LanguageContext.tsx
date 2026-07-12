"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { translations, Lang, Translations } from "@/lib/translations";

type LanguageContextType = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Translations;
};

const LanguageContext = createContext<LanguageContextType>({
  lang: "en",
  setLang: () => {},
  t: translations.en,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    // URL param ?lang=th takes priority over localStorage
    const param = new URLSearchParams(window.location.search).get("lang") as Lang | null;
    const stored = localStorage.getItem("sb-lang") as Lang | null;
    const resolved = param && ["en", "th", "es"].includes(param) ? param : stored;
    if (resolved) {
      setLangState(resolved);
      localStorage.setItem("sb-lang", resolved);
    }
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("sb-lang", l);
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: translations[lang] as Translations }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
