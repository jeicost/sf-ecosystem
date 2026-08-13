import type { MetadataRoute } from "next";
import { site } from "@/lib/site";
import { getAllPosts } from "@/lib/posts";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    // La raíz es la plataforma desde el 12-ago-2026; la tienda de guías vive
    // en /guias. Las dos con prioridad alta: son dos productos, no una página
    // y su subpágina.
    { path: "", priority: 1 },
    { path: "/guias", priority: 0.9 },
    { path: "/en/guias", priority: 0.8 },
    { path: "/influencers", priority: 0.8 },
    // discoolver 360 — estrenada el 11-ago. Fuera de la lista, a propósito:
    // /360/agencias y /en/360/agencias (noindex hasta el piloto con una DMC) y
    // /gracias + /en/gracias (noindex, son la pantalla de después del form).
    // Sacar una ruta de aquí no la desindexa: lo que la desindexa es el
    // `noindex: true` de su metadata. Van juntos o no sirve ninguno de los dos.
    { path: "/360", priority: 0.9 },
    { path: "/360/destinos", priority: 0.8 },
    { path: "/360/alojamientos", priority: 0.8 },
    { path: "/360/demo", priority: 0.7 },
    // inglés
    { path: "/en", priority: 0.9 },
    { path: "/en/influencers", priority: 0.7 },
    { path: "/en/360", priority: 0.8 },
    { path: "/en/360/destinos", priority: 0.7 },
    { path: "/en/360/alojamientos", priority: 0.7 },
    { path: "/en/360/demo", priority: 0.6 },
    // legales — prioridad baja pero indexables: Google penaliza una tienda
    // que no publica quién vende ni en qué condiciones.
    { path: "/aviso-legal", priority: 0.3 },
    { path: "/terminos", priority: 0.3 },
    { path: "/privacidad", priority: 0.3 },
    { path: "/cookies", priority: 0.3 },
    { path: "/en/aviso-legal", priority: 0.2 },
    { path: "/en/terminos", priority: 0.2 },
    { path: "/en/privacidad", priority: 0.2 },
    { path: "/en/cookies", priority: 0.2 },
    { path: "/blog", priority: 0.7 },
  ];

  // Los artículos, uno a uno. Son el rescate del blog viejo de discoolver.com:
  // esas URLs tuvieron tráfico e enlaces durante años, así que entran al sitemap
  // para que Google las reencuentre en su sitio nuevo.
  const articulos = getAllPosts().map((p) => ({
    url: `${site.url}/blog/${p.slug}`,
    lastModified: p.date ? new Date(`${p.date}T00:00:00Z`) : new Date(),
    changeFrequency: "yearly" as const,
    priority: 0.5,
  }));
  return [
    ...routes.map((route) => ({
      url: `${site.url}${route.path}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: route.priority,
    })),
    ...articulos,
  ];
}
