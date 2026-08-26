/**
 * i18n del sitio — dos idiomas, cero librerías.
 *
 * Mismo modelo que discoolver.com, y por la misma razón: se deriva TODO de una
 * lista de idiomas en vez de escribir ternarios `locale === "th" ? … : …` por
 * el código. En Discoolver ese diseño binario dejó 89 sitios cayendo al idioma
 * equivocado sin dar error, y hubo que refactorizarlo antes de poder añadir
 * nada. Aquí se empieza bien desde el principio (26-ago-2026).
 *
 * El inglés vive en la raíz (`/services`) y el tailandés bajo su prefijo
 * (`/th/services`). El copy de página sale de los objetos `*_DEFAULTS` y lo
 * pisa SF-CMS, así que el tailandés real lo escribe Nirada desde el CMS —
 * el código solo tiene que saber qué página pedirle.
 */
export const LOCALES = ['en', 'th'] as const
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'en'

/** Valida lo que venga de una URL o del CMS: nada de `as Locale`. */
export function isLocale(x: unknown): x is Locale {
  return typeof x === 'string' && (LOCALES as readonly string[]).includes(x)
}

/** Quita el prefijo de idioma y devuelve la ruta canónica (la del inglés). */
export function stripLocale(path: string): string {
  const m = path.match(/^\/([a-z]{2})(?=\/|$)/)
  if (m && isLocale(m[1]) && m[1] !== DEFAULT_LOCALE) return path.slice(3) || '/'
  return path
}

/** La misma ruta en otro idioma. Para el selector y para los hreflang. */
export function altPath(path: string, to: Locale): string {
  const clean = stripLocale(path)
  if (to === DEFAULT_LOCALE) return clean || '/'
  return clean === '/' || clean === '' ? `/${to}` : `/${to}${clean}`
}

/** Prefija una ruta interna con el idioma actual. Deja en paz anclas y mailto. */
export function withLocale(path: string, locale: Locale): string {
  if (!path.startsWith('/')) return path
  return locale === DEFAULT_LOCALE ? path : altPath(path, locale)
}

/** El idioma sale de la URL, que es el único sitio donde siempre está. */
export function localeFromPath(path: string | null | undefined): Locale {
  const seg = path?.split('/')[1]
  return isLocale(seg) && seg !== DEFAULT_LOCALE ? seg : DEFAULT_LOCALE
}

/**
 * El slug de una página en un idioma: el inglés sin sufijo (`home`), los demás
 * con el suyo (`home-th`). Así el CMS tiene una página por idioma y Nirada
 * traduce sin que nadie toque código.
 */
export function slugFor(base: string, locale: Locale): string {
  return locale === DEFAULT_LOCALE ? base : `${base}-${locale}`
}

/** Cómo se llama cada idioma en su propio idioma, para el selector. */
export const LOCALE_LABEL: Record<Locale, { label: string; aria: string }> = {
  en: { label: 'EN', aria: 'Read in English' },
  th: { label: 'ไทย', aria: 'อ่านภาษาไทย' },
}
