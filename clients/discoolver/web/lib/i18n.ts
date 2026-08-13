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

/**
 * El idioma se lee de la URL porque es el único sitio donde siempre está: las
 * dos homes son el mismo componente (`/` y `/en` renderizan `AppHomePage`) y
 * el locale no baja por props hasta las secciones. Escrito una vez aquí para
 * que navs, pie y secciones no vuelvan a repetir el ternario cada una a su
 * manera —ya había tres variantes distintas del mismo `startsWith("/en")`—.
 */
export function localeFromPath(path: string | null | undefined): Locale {
  return path === "/en" || path?.startsWith("/en/") ? "en" : "es";
}

export const UI = {
  es: {
    nav: { guias: "Guías", curamos: "Cómo curamos", ia: "IA", faq: "FAQ", creators: "Creators", blog: "Blog", avisame: "Avísame", verGuias: "Ver las guías" },
    switcher: { label: "EN", aria: "Read in English" },
    nav360: { destinos: "Destinos", alojamientos: "Alojamientos", modulos: "Módulos", demo: "Pedir demo" },
    heroForm: { city: "Tu ciudad", emailPlaceholder: "tu@correo.com", submit: "Avísame", ariaSubmit: "Avisarme cuando salga la guía", done: "Hecho. Te avisamos cuando la guía de tu ciudad entre en edición." },
    skip: "Saltar al contenido",
    // Home de la plataforma: lo que no es copy editable, sino etiquetas de la
    // interfaz. `{x}` se sustituye en el sitio de uso, igual que `{days}` del CMS.
    home: {
      comoFuncionaAria: "Cómo funciona Discoolver",
      abrir: "Ábrelo en la plataforma",
      abrirAria: "Abrir {x} en la plataforma",
      abrirEnPlataforma: "Abrir en la plataforma",
      verCatalogo: "Ver todo el catálogo",
      fichaCompleta: "Ficha completa en la plataforma",
      mapaAria: "Mapa interactivo de la ciudad",
      puntosAria: "Puntos de interés cercanos",
      cercaDeTi: "{n} cerca de ti",
    },
    app: {
      formAria: "Suscribirse al aviso de lanzamiento de la app",
      emailAria: "Tu email",
      storeSoon: "App Store · pronto",
      storeAria: "App Store — próximamente",
      playSoon: "Google Play · pronto",
      playAria: "Google Play — próximamente",
      done: "Listo — te avisaremos por email en cuanto lancemos.",
      error: "No se pudo enviar la solicitud. Inténtalo de nuevo en unos minutos.",
    },
    // Pantalla de la app dibujada en el mockup. Es decorativa (aria-hidden),
    // pero se lee: en /en enseñaba la app en español y delataba la traducción.
    mockup: {
      ciudadAhora: "Madrid · ahora",
      saludo: "Hola,",
      nombre: "Lucía",
      mapPill: "Cool Map · 4 cerca",
      planHoy: "Plan de hoy:",
      planHoyEm: "al sunset",
      chips: ["Todos", "Gastro", "Cultura", "Aire libre"],
      card1Cat: "Gastro",
      card1: "Vermut & vinilos",
      card2Cat: "Aire libre",
      card2: "Kayak al sunset",
    },
    guias: { formatoAria: "{x} — apuntarme a la lista de lanzamiento" },
  },
  en: {
    nav: { guias: "Guides", curamos: "How we curate", ia: "AI", faq: "FAQ", creators: "Creators", blog: "Blog", avisame: "Notify me", verGuias: "See the guides" },
    switcher: { label: "ES", aria: "Leer en español" },
    nav360: { destinos: "Destinations", alojamientos: "Accommodation", modulos: "Modules", demo: "Book a demo" },
    heroForm: { city: "Your city", emailPlaceholder: "you@email.com", submit: "Notify me", ariaSubmit: "Notify me when the guide is out", done: "Done. We'll email you when your city's guide goes into production." },
    skip: "Skip to content",
    home: {
      comoFuncionaAria: "How Discoolver works",
      abrir: "Open it in the platform",
      abrirAria: "Open {x} in the platform",
      abrirEnPlataforma: "Open in the platform",
      verCatalogo: "See the whole catalogue",
      fichaCompleta: "Full listing in the platform",
      mapaAria: "Interactive city map",
      puntosAria: "Places of interest nearby",
      cercaDeTi: "{n} near you",
    },
    app: {
      formAria: "Sign up for the app launch alert",
      emailAria: "Your email",
      storeSoon: "App Store · soon",
      storeAria: "App Store — coming soon",
      playSoon: "Google Play · soon",
      playAria: "Google Play — coming soon",
      done: "Done — we'll email you the moment we launch.",
      error: "We couldn't send your request. Try again in a few minutes.",
    },
    mockup: {
      ciudadAhora: "Madrid · now",
      saludo: "Hi,",
      nombre: "Lucía",
      mapPill: "Cool Map · 4 nearby",
      planHoy: "Today's plan:",
      planHoyEm: "at sunset",
      chips: ["All", "Food", "Culture", "Outdoors"],
      card1Cat: "Food",
      card1: "Vermouth & vinyl",
      card2Cat: "Outdoors",
      card2: "Kayak at sunset",
    },
    guias: { formatoAria: "{x} — join the launch list" },
  },
} as const;
