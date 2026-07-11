/**
 * Language-related types
 */

/**
 * Available language codes (lowercase)
 */
export type LanguageCode =
  | "es"
  | "en"
  | "zh_cn"
  | "fr"
  | "de"
  | "ar"
  | "it"
  | "pt";

/**
 * Array of all available language codes
 */
export const LANGUAGE_CODES: readonly LanguageCode[] = [
  "es",
  "en",
  "zh_cn",
  "fr",
  "de",
  "ar",
  "it",
  "pt",
] as const;

/**
 * Default language code
 */
export const DEFAULT_LANGUAGE: LanguageCode = "es";

/**
 * Normalizes a language code string to a valid LanguageCode
 * @param code - Language code (any case or format)
 * @returns Normalized lowercase language code
 */
export function normalizeLanguageCode(code: string): LanguageCode {
  const normalized = code.toLowerCase();
  if (normalized === "zh_cn" || normalized === "zh-cn") {
    return "zh_cn";
  }
  return normalized as LanguageCode;
}
