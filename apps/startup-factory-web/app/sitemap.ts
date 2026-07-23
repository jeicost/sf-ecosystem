import type { MetadataRoute } from "next";
import { getPosts } from "@/lib/cms-posts";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://startupsfactory.es";
  const locales = ['es', 'en', 'th'];

  const routes = [
    { path: '', priority: 1.0, changeFrequency: "weekly" as const },
    { path: '/team-as-a-service', priority: 0.9, changeFrequency: "monthly" as const },
    { path: '/equipo-por-horas', priority: 0.8, changeFrequency: "monthly" as const },
    { path: '/growth-partner', priority: 0.8, changeFrequency: "monthly" as const },
    { path: '/innovacion-abierta-colaborativa', priority: 0.8, changeFrequency: "monthly" as const },
    { path: '/emprendedores', priority: 0.8, changeFrequency: "monthly" as const },
    { path: '/startups', priority: 0.8, changeFrequency: "monthly" as const },
    { path: '/corporates', priority: 0.7, changeFrequency: "monthly" as const },
    { path: '/venture', priority: 0.7, changeFrequency: "monthly" as const },
    { path: '/casos', priority: 0.7, changeFrequency: "weekly" as const },
    { path: '/equipo', priority: 0.6, changeFrequency: "monthly" as const },
    { path: '/contacto', priority: 0.9, changeFrequency: "yearly" as const },
    { path: '/aplica', priority: 1.0, changeFrequency: "monthly" as const },
    { path: '/programa', priority: 0.8, changeFrequency: "monthly" as const },
    { path: '/ai-for-founders', priority: 0.9, changeFrequency: "weekly" as const },
    { path: '/startup-audit', priority: 0.9, changeFrequency: "monthly" as const },
    { path: '/comunidad', priority: 0.8, changeFrequency: "monthly" as const },
    { path: '/blog', priority: 0.8, changeFrequency: "weekly" as const },
    { path: '/bio', priority: 0.5, changeFrequency: "monthly" as const },
    { path: '/faq', priority: 0.6, changeFrequency: "monthly" as const },
    { path: '/bangkok-trip', priority: 0.5, changeFrequency: "monthly" as const },
    { path: '/relocacion', priority: 0.6, changeFrequency: "monthly" as const },
  ];

  const staticPages = locales.flatMap(locale =>
    routes.map(route => ({
      url: `${baseUrl}/${locale}${route.path}`,
      lastModified: new Date(),
      changeFrequency: route.changeFrequency,
      priority: route.priority,
      alternates: {
        languages: Object.fromEntries(
          locales.map(l => [l, `${baseUrl}/${l}${route.path}`])
        ),
      },
    }))
  );

  const posts = await getPosts();
  const blogPages = posts.flatMap(post =>
    locales.map(locale => ({
      url: `${baseUrl}/${locale}/blog/${post.slug}`,
      lastModified: post.published_at ? new Date(post.published_at) : new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.7,
      alternates: {
        languages: Object.fromEntries(
          locales.map(l => [l, `${baseUrl}/${l}/blog/${post.slug}`])
        ),
      },
    }))
  );

  return [...staticPages, ...blogPages];
}
