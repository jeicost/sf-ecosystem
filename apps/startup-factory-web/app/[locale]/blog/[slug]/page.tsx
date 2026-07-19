import type { Metadata } from "next";
import Link from "next/link";
import { getPost } from "@/lib/cms-posts";
import { locales } from "@/lib/i18n/config";
import type { Locale } from "@/lib/i18n/config";
import { notFound } from "next/navigation";

const site = "https://www.startupsfactory.es";

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = await getPost(slug).catch(() => null);
  if (!post) return {};
  return {
    title: post.seo_title ?? post.title,
    description: post.seo_description ?? post.excerpt ?? undefined,
    alternates: {
      canonical: `${site}/${locale}/blog/${slug}`,
      languages: Object.fromEntries(locales.map((l) => [l, `${site}/${l}/blog/${slug}`])),
    },
    openGraph: {
      title: post.seo_title ?? post.title,
      description: post.seo_description ?? post.excerpt ?? undefined,
      images: post.og_image_url ? [post.og_image_url] : undefined,
    },
  };
}

function ArticleSchema({ post, locale, slug }: { post: NonNullable<Awaited<ReturnType<typeof getPost>>>; locale: string; slug: string }) {
  const url = `${site}/${locale}/blog/${slug}`;
  const schema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "description": post.excerpt ?? undefined,
    "author": { "@type": "Person", "name": post.author_name ?? "Startup Factory", "url": "https://www.linkedin.com/in/carlosjacoste/" },
    "publisher": { "@type": "Organization", "name": "Startup Factory", "logo": { "@type": "ImageObject", "url": `${site}/logo-white.svg` } },
    "datePublished": post.published_at ?? undefined,
    "dateModified": post.published_at ?? undefined,
    ...(post.cover_url ? { "image": post.cover_url } : {}),
    "url": url,
    "mainEntityOfPage": { "@type": "WebPage", "@id": url },
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />;
}

const backLabel: Record<Locale, string> = {
  es: "← Volver al blog",
  en: "← Back to blog",
  th: "← กลับไปที่บล็อก",
};

export default async function BlogPostPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const l = locale as Locale;
  const post = await getPost(slug).catch(() => null);
  if (!post) notFound();

  return (
    <>
      <ArticleSchema post={post} locale={locale} slug={slug} />
      {post.cover_url && (
        <div className="relative h-[40vh] md:h-[50vh] overflow-hidden bg-black">
          <img src={post.cover_url} alt={post.title} className="w-full h-full object-cover opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        </div>
      )}

      <section className={`relative bg-black ${!post.cover_url ? 'pt-28' : '-mt-32 relative z-10'}`}>
        <div className="max-w-3xl mx-auto px-6 pb-24">
          <Link href={`/${locale}/blog`} className="text-sm text-white/40 hover:text-[#A855F7] transition-colors mb-8 block">
            {backLabel[l] ?? backLabel.es}
          </Link>

          {post.category && (
            <span className="text-xs font-bold text-[#A855F7] uppercase tracking-[0.15em] mb-4 block">{post.category}</span>
          )}

          <h1 className="font-[family-name:var(--font-space-grotesk)] font-black text-[clamp(32px,5vw,60px)] text-white leading-tight tracking-[-0.02em] mb-6">
            {post.title}
          </h1>

          <div className="flex items-center gap-4 text-sm text-white/30 mb-10 pb-8 border-b border-white/[0.08]">
            {post.author_name && <span>{post.author_name}</span>}
            {post.author_name && post.published_at && <span>·</span>}
            {post.published_at && (
              <span>{new Date(post.published_at).toLocaleDateString(locale === 'th' ? 'th-TH' : locale === 'en' ? 'en-GB' : 'es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            )}
          </div>

          {post.content_html ? (
            <div
              className="prose prose-invert prose-lg max-w-none prose-headings:font-[family-name:var(--font-space-grotesk)] prose-headings:tracking-tight prose-a:text-[#A855F7] prose-a:no-underline hover:prose-a:underline"
              dangerouslySetInnerHTML={{ __html: post.content_html }}
            />
          ) : post.excerpt ? (
            <p className="text-white/60 text-xl leading-relaxed">{post.excerpt}</p>
          ) : null}
        </div>
      </section>
    </>
  );
}
