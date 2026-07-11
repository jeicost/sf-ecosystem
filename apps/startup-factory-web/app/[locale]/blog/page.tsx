import type { Metadata } from "next";
import Link from "next/link";
import { getPosts } from "@/lib/cms";
import { locales } from "@/lib/i18n/config";
import type { Locale } from "@/lib/i18n/config";

const site = "https://www.startupsfactory.es";

const meta: Record<Locale, { title: string; description: string }> = {
  es: { title: "Blog — Startup Factory", description: "Artículos, casos y aprendizajes del equipo de Startup Factory." },
  en: { title: "Blog — Startup Factory", description: "Articles, cases and learnings from the Startup Factory team." },
  th: { title: "บล็อก — Startup Factory", description: "บทความ กรณีศึกษา และสิ่งที่เรียนรู้จากทีม Startup Factory" },
};

const labels: Record<Locale, { eyebrow: string; h1: string; empty: string; readMore: string }> = {
  es: { eyebrow: "Recursos", h1: "Blog & Artículos", empty: "Próximamente — primeros artículos en camino.", readMore: "Leer artículo" },
  en: { eyebrow: "Resources", h1: "Blog & Articles", empty: "Coming soon — first articles on their way.", readMore: "Read article" },
  th: { eyebrow: "ทรัพยากร", h1: "บล็อกและบทความ", empty: "เร็วๆ นี้ — บทความแรกกำลังมา", readMore: "อ่านบทความ" },
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const m = meta[locale as Locale] ?? meta.es;
  return {
    title: m.title, description: m.description,
    alternates: {
      canonical: `${site}/${locale}/blog`,
      languages: Object.fromEntries(locales.map((l) => [l, `${site}/${l}/blog`])),
    },
  };
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function BlogPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const l = locale as Locale;
  const t = labels[l] ?? labels.es;

  let posts = await getPosts().catch(() => []);

  return (
    <>
      <section className="relative overflow-hidden bg-black min-h-[30vh] flex items-center">
        <div className="orb-purple absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] rounded-full opacity-40" />
        <div className="relative w-full max-w-7xl mx-auto px-6 pt-24 pb-14">
          <span className="text-xs font-semibold text-[#A855F7] uppercase tracking-[0.15em] mb-5 block">{t.eyebrow}</span>
          <h1 className="font-[family-name:var(--font-space-grotesk)] font-black text-[clamp(40px,6vw,80px)] text-white leading-[0.92] tracking-[-0.03em]">
            {t.h1}
          </h1>
        </div>
      </section>

      <section className="relative bg-black py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-6">
          {posts.length === 0 ? (
            <p className="text-white/40 text-lg text-center py-20">{t.empty}</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <Link
                  key={post.slug}
                  href={`/${locale}/blog/${post.slug}`}
                  className="group card-dark rounded-2xl overflow-hidden hover:border-[#A855F7]/60 transition-all duration-300 flex flex-col"
                >
                  {post.cover_url && (
                    <div className="relative h-48 overflow-hidden bg-[#1a1a1a]">
                      <img
                        src={post.cover_url}
                        alt={post.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    </div>
                  )}
                  <div className="p-6 flex flex-col flex-1">
                    {post.category && (
                      <span className="text-[10px] font-bold text-[#A855F7] uppercase tracking-[0.15em] mb-3 block">{post.category}</span>
                    )}
                    <h2 className="font-[family-name:var(--font-space-grotesk)] font-bold text-white text-lg leading-snug mb-3 flex-1">{post.title}</h2>
                    {post.excerpt && (
                      <p className="text-white/40 text-sm leading-relaxed mb-5 line-clamp-3">{post.excerpt}</p>
                    )}
                    <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
                      <span className="text-xs text-white/30">
                        {post.published_at ? new Date(post.published_at).toLocaleDateString(locale === 'th' ? 'th-TH' : locale === 'en' ? 'en-GB' : 'es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                      </span>
                      <span className="text-xs font-semibold text-[#A855F7] group-hover:text-white transition-colors">{t.readMore} →</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
