import type { LanguageCode } from "@/types/language";
import { normalizeLanguageCode } from "@/types/language";

/**
 * Language codes and their Spanish display names
 */
export const LANGUAGE_NAMES: Record<LanguageCode, string> = {
  es: "Español",
  en: "Inglés",
  zh_cn: "Chino",
  fr: "Francés",
  de: "Alemán",
  ar: "Árabe",
  it: "Italiano",
  pt: "Portugués",
};

/**
 * Gets the display name for a language code
 * @param code - Language code (e.g., 'es', 'en')
 * @returns Display name in Spanish, or the code if not found
 */
export function getLanguageName(code: string): string {
  const normalized = normalizeLanguageCode(code);
  return LANGUAGE_NAMES[normalized] || code.toUpperCase();
}

/**
 * Gets all available languages as an array of { code, name } objects
 * @returns Array of language objects
 */
export function getLanguages(): Array<{ code: LanguageCode; name: string }> {
  return Object.entries(LANGUAGE_NAMES).map(([code, name]) => ({
    code: code as LanguageCode,
    name,
  }));
}
