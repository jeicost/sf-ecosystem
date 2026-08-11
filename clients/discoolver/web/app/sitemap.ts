import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    { path: "", priority: 1 },
    { path: "/influencers", priority: 0.8 },
    // discoolver 360 — estrenada el 11-ago (agencias fuera: sigue noindex
    // hasta su piloto)
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
  ];
  return routes.map((route) => ({
    url: `${site.url}${route.path}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: route.priority,
  }));
}
