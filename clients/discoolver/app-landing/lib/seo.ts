import type { Metadata } from "next";
import { site } from "./site";

interface SeoArgs {
  title: string;
  description: string;
  path?: string;
  image?: string;
  noindex?: boolean;
}

export function buildMetadata({ title, description, path = "", image, noindex }: SeoArgs): Metadata {
  const url = `${site.url}${path}`;
  const ogImage = image ?? site.ogImage;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: site.name,
      locale: site.locale,
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
