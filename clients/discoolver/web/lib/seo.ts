import type { Metadata } from "next";
import { site } from "./site";
import { LOCALES, DEFAULT_LOCALE, altPath, stripLocale, type Locale } from "./i18n";

interface SeoArgs {
  title: string;
  description: string;
  path?: string;
  image?: string;
  noindex?: boolean;
  /** Las páginas de /360 son otra marca: "discoolver 360", no "Discoolver". */
  siteName?: string;
  /**
   * Emite hreflang hacia los equivalentes. El tipo se IMPORTA de lib/i18n: antes
   * se redeclaraba a mano aquí (`"es" | "en"`), así que ampliar Locale en i18n
   * NO ampliaba esto y el fallo aparecía en un fichero que nadie asocia con
   * idiomas (mapeo 20-ago-2026).
   */
  locale?: Locale;
  /**
   * Corta el hreflang. Para páginas que solo existen en español: el blog es el
   * rescate del blog viejo y no hay traducción. Declarar un `en` que redirige
   * de vuelta al español le dice a Google que existe una versión que no existe.
   */
  soloEs?: boolean;
}

/** El código OpenGraph de cada idioma. Una entrada por LOCALES. */
const OG_LOCALE: Record<Locale, string> = { es: site.locale, en: "en_US", th: "th_TH" };

export function buildMetadata({
  title,
  description,
  path = "",
  image,
  noindex,
  siteName,
  locale = DEFAULT_LOCALE,
  soloEs,
}: SeoArgs): Metadata {
  const url = `${site.url}${path}`;
  const ogImage = image ?? site.ogImage;
  const base = stripLocale(path);
  // Un hreflang por idioma, derivado de LOCALES: añadir un idioma no obliga a
  // volver aquí. Antes eran dos URLs escritas a mano (esUrl/enUrl).
  const languages = Object.fromEntries(
    LOCALES.map((l) => [l, `${site.url}${altPath(base || "/", l)}`])
  ) as Record<Locale, string>;
  const canonicalPorDefecto = `${site.url}${altPath(base || "/", DEFAULT_LOCALE)}`;
  return {
    title,
    description,
    alternates: {
      canonical: url,
      ...(soloEs ? {} : { languages: { ...languages, "x-default": canonicalPorDefecto } }),
    },
    openGraph: {
      title,
      description,
      url,
      siteName: siteName ?? site.name,
      // OG locale por idioma. Antes era un ternario binario con el else en español.
      locale: OG_LOCALE[locale] ?? site.locale,
      type: "website",
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: { card: "summary_large_image", title, description, images: [ogImage] },
    robots: noindex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
        },
  };
}
