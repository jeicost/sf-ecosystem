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
/**
 * Los idiomas del sitio, en un solo sitio. TODO lo demás se deriva de aquí:
 * el tipo, el despeje del prefijo, el switcher y los hreflang.
 *
 * Antes esto era `type Locale = "es" | "en"` y cada función tenía su propio
 * ternario `locale === "en" ? … : …`, con la rama `else` asumiendo español. Un
 * mapeo del 20-ago-2026 encontró **172 sitios en 73 ficheros** que dependen del
 * idioma, y 89 de ellos caían al español SIN dar error. Añadir un idioma con
 * ese diseño era garantizar fallos mudos, así que primero se cambia el modelo:
 * de «uno u otro» a «el por defecto y los demás».
 *
 * El orden importa: DEFAULT_LOCALE vive en la raíz (`/guias`) y los demás bajo
 * su prefijo (`/en/guias`).
 */
export const LOCALES = ["es", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "es";

/** Valida lo que venga de una URL, del CMS o de un body: nada de `as Locale`. */
export function isLocale(x: unknown): x is Locale {
  return typeof x === "string" && (LOCALES as readonly string[]).includes(x);
}

/**
 * Quita el prefijo de idioma y devuelve la ruta canónica (la del idioma por
 * defecto). Es la pieza que antes estaba duplicada: existía aquí y otra vez en
 * lib/seo.ts con el nombre `stripEn` — y el nombre ya delataba que el diseño
 * solo contemplaba dos idiomas.
 */
export function stripLocale(path: string): string {
  const m = path.match(/^\/([a-z]{2})(?=\/|$)/);
  if (m && isLocale(m[1]) && m[1] !== DEFAULT_LOCALE) return path.slice(3) || "/";
  return path;
}

/** La misma ruta en otro idioma. Sirve para el switcher y para los hreflang. */
export function altPath(path: string, to: Locale): string {
  const clean = stripLocale(path);
  if (to === DEFAULT_LOCALE) return clean || "/";
  return clean === "/" || clean === "" ? `/${to}` : `/${to}${clean}`;
}

export function withLocale(path: string, locale: Locale): string {
  if (!path.startsWith("/")) return path; // anchors (#x), mailto:, tel:, querys
  return locale === DEFAULT_LOCALE ? path : altPath(path, locale);
}

/**
 * El idioma se lee de la URL porque es el único sitio donde siempre está: las
 * dos homes son el mismo componente (`/` y `/en` renderizan `AppHomePage`) y
 * el locale no baja por props hasta las secciones. Escrito una vez aquí para
 * que navs, pie y secciones no vuelvan a repetir el ternario cada una a su
 * manera —ya había tres variantes distintas del mismo `startsWith("/en")`—.
 */
export function localeFromPath(path: string | null | undefined): Locale {
  const seg = path?.split("/")[1];
  return isLocale(seg) && seg !== DEFAULT_LOCALE ? seg : DEFAULT_LOCALE;
}

/**
 * Las cadenas de UI del idioma pedido, con respaldo al por defecto.
 *
 * Existe para que los nueve ficheros que hoy hacen `UI[locale].loQueSea` dejen
 * de indexar en crudo: si un día llega un locale sin bloque en `UI`, indexar
 * devuelve `undefined` y el acceso encadenado revienta en render — y el primer
 * sitio donde pasaría es HtmlShell, que es la raíz del árbol: caería la página
 * entera, no un componente.
 */
export function t(locale: Locale): (typeof UI)[Locale] {
  return UI[locale] ?? UI[DEFAULT_LOCALE];
}

export const UI = {
  es: {
    nav: { guias: "Guías", curamos: "Cómo se elige", ia: "La IA de tu guía", faq: "FAQ", creators: "Creators", blog: "Blog", avisame: "Avísame", verGuias: "Ver las guías", comoFunciona: "Cómo funciona", lasGuias: "Las guías", verPlataforma: "Ver la plataforma", quieroEntrar: "Quiero entrar" },
    switcher: { label: "EN", aria: "Read in English" },
    nav360: { destinos: "Destinos", alojamientos: "Alojamientos", agencias: "Agencias", modulos: "Módulos", demo: "Pedir demo" },
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
      mapaAria: "Vista previa del mapa de la ciudad",
      puntosAria: "Sitios publicados en el barrio",
      cercaDeTi: "{n} sitios en este barrio",
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
    nav: { guias: "Guides", curamos: "How it\u2019s edited", ia: "The AI in your guide", faq: "FAQ", creators: "Creators", blog: "Blog", avisame: "Notify me", verGuias: "See the guides", comoFunciona: "How it works", lasGuias: "The guides", verPlataforma: "See the platform", quieroEntrar: "I\u2019m in" },
    switcher: { label: "ES", aria: "Leer en español" },
    nav360: { destinos: "Destinations", alojamientos: "Accommodation", agencias: "Agencies", modulos: "Modules", demo: "Book a demo" },
    heroForm: { city: "Your city", emailPlaceholder: "you@email.com", submit: "Notify me", ariaSubmit: "Notify me when the guide is out", done: "Done. We'll email you when your city's guide goes into production." },
    skip: "Skip to content",
    home: {
      comoFuncionaAria: "How Discoolver works",
      abrir: "Open it in the platform",
      abrirAria: "Open {x} in the platform",
      abrirEnPlataforma: "Open in the platform",
      verCatalogo: "See the whole catalogue",
      fichaCompleta: "Full listing in the platform",
      mapaAria: "City map preview",
      puntosAria: "Published places in the neighbourhood",
      cercaDeTi: "{n} places in this neighbourhood",
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

/**
 * Red de seguridad en tiempo de COMPILACIÓN: si mañana se añade un idioma a
 * LOCALES y se olvida su bloque en UI, esto no compila. Antes no había nada que
 * lo impidiera y el olvido se descubría en render, con un TypeError en la raíz
 * del árbol que tumbaba la página entera.
 *
 * Se hace con esta línea y no tipando UI directamente para no perder los tipos
 * literales que ya infiere `as const` ni tocar el objeto.
 */
const _todosLosIdiomasTienenUI: Record<Locale, unknown> = UI;
void _todosLosIdiomasTienenUI;
