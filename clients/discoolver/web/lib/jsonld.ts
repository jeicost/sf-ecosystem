import { site } from "./site";
import type { Locale } from "./i18n";

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: site.organization.name,
    legalName: site.organization.legalName,
    url: site.url,
    logo: `${site.url}${site.organization.logo}`,
    sameAs: site.organization.sameAs,
  };
}

/**
 * El WebSite del sitio, uno por idioma.
 *
 * Estaba fijo en `es-ES` y se emitía desde el root layout, así que las 13
 * páginas de /en salían declarando español mientras su propio `og:locale` decía
 * `en_US` y el hreflang apuntaba al espejo: tres señales, dos idiomas. La `url`
 * también cambia porque si dos WebSite comparten URL y difieren en idioma,
 * Google los lee como la misma entidad contradiciéndose, no como dos versiones.
 *
 * Ojo al llamarlo: este nodo describe el sitio, no la página. Va en la home de
 * cada idioma (`app/page.tsx` y `app/en/page.tsx`), no en un layout compartido
 * que no sabe en qué idioma está.
 */
export function websiteJsonLd(locale: Locale = "es") {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: site.name,
    url: locale === "en" ? `${site.url}/en` : site.url,
    inLanguage: locale === "en" ? "en-US" : "es-ES",
  };
}

export function faqJsonLd(items: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}
