export const locales = ['es', 'en', 'th'] as const
export type Locale = typeof locales[number]
export const defaultLocale: Locale = 'es'
export const localeNames: Record<Locale, string> = { es: 'ES', en: 'EN', th: 'TH' }
export const localeFull: Record<Locale, string> = { es: 'Español', en: 'English', th: 'ภาษาไทย' }
