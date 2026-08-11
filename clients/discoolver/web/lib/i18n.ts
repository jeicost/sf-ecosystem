/**
 * i18n mínimo del sitio — dos locales, cero librerías.
 *
 * El COPY de página vive en lib/content/** (ES) y lib/content/en/** (EN),
 * espejo clave a clave, con páginas propias en el CMS (sufijo `-en`). Este
 * fichero solo lleva las CADENAS DE UI que viven en componentes (navs,
 * footers, formularios): lo que no tiene sentido editar desde el CMS.
 *
 * Rutas: el ES vive en la raíz (/, /influencers, /360/...) y el EN en /en/*.
 * `altPath` calcula la URL equivalente en el otro idioma para el switcher y
 * para los hreflang de lib/seo.ts.
 */
export type Locale = "es" | "en";

export function altPath(path: string, to: Locale): string {
  const clean = path.startsWith("/en/") ? path.slice(3) : path === "/en" ? "/" : path;
  return to === "en" ? (clean === "/" ? "/en" : `/en${clean}`) : clean || "/";
}

export function withLocale(path: string, locale: Locale): string {
  if (!path.startsWith("/")) return path; // anchors (#x), mailto:, tel:, querys
  return locale === "en" ? altPath(path, "en") : path;
}

export const UI = {
  es: {
    nav: { guias: "Guías", curamos: "Cómo curamos", ia: "IA", faq: "FAQ", creators: "Creators", avisame: "Avísame", verGuias: "Ver las guías" },
    switcher: { label: "EN", aria: "Read in English" },
    nav360: { destinos: "Destinos", alojamientos: "Alojamientos", modulos: "Módulos", demo: "Pedir demo" },
    heroForm: { city: "Tu ciudad", emailPlaceholder: "tu@correo.com", submit: "Avísame", ariaSubmit: "Avisarme cuando salga la guía", done: "Hecho. Te avisamos cuando la guía de tu ciudad entre en edición." },
  },
  en: {
    nav: { guias: "Guides", curamos: "How we curate", ia: "AI", faq: "FAQ", creators: "Creators", avisame: "Notify me", verGuias: "See the guides" },
    switcher: { label: "ES", aria: "Leer en español" },
    nav360: { destinos: "Destinations", alojamientos: "Accommodation", modulos: "Modules", demo: "Book a demo" },
    heroForm: { city: "Your city", emailPlaceholder: "you@email.com", submit: "Notify me", ariaSubmit: "Notify me when the guide is out", done: "Done. We'll email you when your city's guide goes into production." },
  },
} as const;
