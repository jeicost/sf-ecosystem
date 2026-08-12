import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { site } from "@/lib/site";
import { Nav } from "@/components/app/Nav";
import { Footer } from "@/components/app/Footer";
import { getAllPosts, getPostBySlug, getRelated, fechaLegible } from "@/lib/posts";

/**
 * Un artículo del blog.
 *
 * `contentHtml` viene de SF-CMS y se inyecta con dangerouslySetInnerHTML. Es
 * seguro en este caso concreto porque el HTML no lo escribe un usuario
 * anónimo: entra por el CMS, cuyo acceso está controlado, y el rescate del
 * blog viejo pasó por un limpiador que solo dejó pasar etiquetas semánticas
 * (p, h2-h4, ul, li, a, img, strong, em, blockquote) — sin script, sin iframe,
 * sin atributos de evento. Si algún día el CMS admite HTML de terceros, esto
 * necesita un saneador en tiempo de render.
 */
export function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return buildMetadata({ title: "Artículo no encontrado — Discoolver", description: "", path: `/blog/${slug}`, noindex: true });
  return buildMetadata({
    title: post.seoTitle || post.title,
    description: post.seoDescription || post.excerpt,
    path: `/blog/${post.slug}`,
    image: post.ogImage || undefined,
  });
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const relacionados = getRelated(slug);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.seoDescription || post.excerpt,
    ...(post.ogImage ? { image: post.ogImage } : {}),
    // datePublished es obligatorio en el checklist de SEO del monorepo; si el
    // artículo rescatado no traía fecha, se omite en vez de inventarla.
    ...(post.date ? { datePublished: post.date } : {}),
    author: { "@type": "Organization", name: post.author || site.organization.name },
    publisher: {
      "@type": "Organization",
      name: site.organization.name,
      logo: { "@type": "ImageObject", url: `${site.url}${site.organization.logo}` },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": `${site.url}/blog/${post.slug}` },
  };

  return (
    <>
      <Nav locale="es" />
      <main className="section" style={{ paddingTop: 120 }}>
        <article className="container" style={{ maxWidth: 760 }}>
          <p style={{ marginBottom: 18 }}>
            <Link href="/blog" className="rev-link" style={{ color: "var(--ink-2)", fontSize: 13.5 }}>
              ← Volver al blog
            </Link>
          </p>
          <div className="blog-card__meta" style={{ marginBottom: 12 }}>
            {post.category && <span className="blog-card__cat">{post.category}</span>}
            {post.date && <time dateTime={post.date}>{fechaLegible(post.date)}</time>}
          </div>
          <h1 className="display-lg" style={{ marginBottom: 24 }}>
            {post.title}
          </h1>
          {post.excerpt && (
            <p className="section__lead" style={{ marginBottom: 36 }}>
              {post.excerpt}
            </p>
          )}

          <div
            className="prose blog-body"
            dangerouslySetInnerHTML={{ __html: post.contentHtml }}
          />

          {relacionados.length > 0 && (
            <section style={{ marginTop: 64, borderTop: "1px solid var(--line)", paddingTop: 32 }}>
              <h2 className="display-sm" style={{ marginBottom: 20 }}>
                Sigue leyendo
              </h2>
              <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: 12 }}>
                {relacionados.map((r) => (
                  <li key={r.slug}>
                    <Link href={`/blog/${r.slug}`} style={{ color: "var(--ink)" }}>
                      {r.title}
                    </Link>
                    {r.date && (
                      <span style={{ color: "var(--ink-2)", fontSize: 13 }}> · {fechaLegible(r.date)}</span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </article>
      </main>
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </>
  );
}
