import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/botella", "/vino", "/estampado", "/envios"].map((ruta) => ({
    url: `${site.url}${ruta}`,
    changeFrequency: "weekly" as const,
    priority: ruta === "" ? 1 : 0.7,
  }));
}
