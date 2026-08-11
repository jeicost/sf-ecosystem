import type { Metadata } from "next";
import { site } from "./site";

interface SeoArgs {
  title: string;
  description: string;
  path?: string;
  image?: string;
  noindex?: boolean;
  /** Las páginas de /360 son otra marca: "discoolver 360", no "Discoolver". */
  siteName?: string;
  /** "es" (raíz) o "en" (/en/*). Emite hreflang hacia el equivalente. */
  locale?: "es" | "en";
}

/** /360/x ↔ /en/360/x — mismo path sin el prefijo /en. */
function stripEn(path: string): string {
  return path === "/en" ? "/" : path.startsWith("/en/") ? path.slice(3) : path;
}

export function buildMetadata({
  title,
  description,
  path = "",
  image,
  noindex,
  siteName,
  locale = "es",
}: SeoArgs): Metadata {
  const url = `${site.url}${path}`;
  const ogImage = image ?? site.ogImage;
  const base = stripEn(path);
  const esUrl = `${site.url}${base || "/"}`;
  const enUrl = `${site.url}${base === "/" ? "/en" : `/en${base}`}`;
  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: { es: esUrl, en: enUrl, "x-default": esUrl },
    },
    openGraph: {
      title,
      description,
      url,
      siteName: siteName ?? site.name,
      locale: locale === "en" ? "en_US" : site.locale,
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
