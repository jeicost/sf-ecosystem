import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

/**
 * `site.url` es el host canónico (apex, sin www, decidido en el corte de
 * dominio del 12-ago-2026) y tiene que ser el mismo que emiten el sitemap, los
 * canonical y los OG. Lo que hunde el SEO es que discrepen, no cuál se elija.
 *
 * Las rutas con `noindex` (/gracias, /360/agencias y sus espejos /en) NO se
 * bloquean aquí a propósito: si el robots impide entrar, Googlebot nunca lee la
 * etiqueta noindex y acaba indexando la URL a pelo. /api sí se bloquea —no son
 * páginas, y los endpoints de Draft Mode no pintan nada en el índice.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: "/api/" }],
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
