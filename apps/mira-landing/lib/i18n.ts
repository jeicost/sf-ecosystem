/**
 * i18n mínimo de la landing — dos locales, cero librerías (mismo criterio que
 * clients/discoolver/web/lib/i18n.ts).
 *
 * El COPY de la página vive en lib/content/home.ts (ES) y lib/content/en/home.ts
 * (EN), espejo clave a clave, y se edita desde SF-CMS. Aquí solo van las CADENAS
 * DE CHROME —nav, switcher, formulario, footer, etiquetas de agrupación— que no
 * tiene sentido dar a editar en el CMS porque van pegadas al layout.
 *
 * Rutas: el castellano vive en la raíz (/) y el inglés en /en.
 */
export type Locale = "es" | "en";

/** Ruta equivalente en el otro idioma. Alimenta el switcher y los hreflang. */
export function altPath(path: string, to: Locale): string {
  const clean = path.startsWith("/en/") ? path.slice(3) : path === "/en" ? "/" : path;
  return to === "en" ? (clean === "/" ? "/en" : `/en${clean}`) : clean || "/";
}

export const UI = {
  es: {
    nav: {
      byline: "de Startup Factory",
      brain: "El Cerebro",
      how: "Cómo funciona",
      pricing: "Precios",
      signIn: "Entrar",
    },
    switcher: { label: "EN", aria: "Read in English" },
    // Los cinco planes se venden en dos paquetes; la diferencia real es quién
    // entrena el Cerebro, que es justo lo que dice pricing_lead.
    pricing: {
      groupStarter: "Starter",
      groupStarterNote: "Entrenas tu marca tú, en minutos",
      groupEnterprise: "Enterprise",
      groupEnterpriseNote: "Entrenamos tu marca contigo",
      featured: "El más elegido",
      setup: "Alta",
    },
    form: {
      planPlaceholder: "¿Qué plan te encaja?",
      planOther: "Aún no lo sé",
      emailPlaceholder: "tu@correo.com",
      submit: "Enviar",
      subject: "Interés en MIRA desde la landing",
      aria: "Formulario de contacto",
    },
    faqAria: "Abrir respuesta",
    footer: { terms: "Términos", privacy: "Privacidad", cookies: "Cookies" },
  },
  en: {
    nav: {
      byline: "by Startup Factory",
      brain: "The Brain",
      how: "How it works",
      pricing: "Pricing",
      signIn: "Sign in",
    },
    switcher: { label: "ES", aria: "Leer en castellano" },
    pricing: {
      groupStarter: "Starter",
      groupStarterNote: "You train your brand, in minutes",
      groupEnterprise: "Enterprise",
      groupEnterpriseNote: "We train your brand with you",
      featured: "Most chosen",
      setup: "Onboarding",
    },
    form: {
      planPlaceholder: "Which plan fits you?",
      planOther: "Not sure yet",
      emailPlaceholder: "you@email.com",
      submit: "Send",
      subject: "MIRA interest from the landing page",
      aria: "Contact form",
    },
    faqAria: "Open answer",
    footer: { terms: "Terms", privacy: "Privacy", cookies: "Cookies" },
  },
} as const;
