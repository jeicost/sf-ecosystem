import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { t } from "../lib/i18n";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [theme, setThemeState] = useState(
    () => localStorage.getItem("editor_theme") || "dark"
  );
  const [lang, setLangState] = useState(
    () => localStorage.getItem("editor_lang") || "es"
  );

  // Apply theme to <html>
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("editor_theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("editor_lang", lang);
  }, [lang]);

  const toggleTheme = useCallback(() => {
    setThemeState(t => t === "dark" ? "light" : "dark");
  }, []);

  const setLang = useCallback((l) => setLangState(l), []);

  const tr = useCallback((key) => t(lang, key), [lang]);

  return (
    <AppContext.Provider value={{ theme, toggleTheme, lang, setLang, t: tr }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be inside AppProvider");
  return ctx;
}
