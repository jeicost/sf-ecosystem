import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { site } from "@/lib/site";
import { Nav } from "@/components/app/Nav";
import { Footer } from "@/components/app/Footer";
import {
  getAllPosts,
  getPostBySlug,
  getRelated,
  categoriaSlug,
  fechaLegible,
  ciudadDelPost,
  esDeArchivo,
} from "@/lib/posts";
import { BlogCTA } from "@/components/blog/BlogCTA";

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
  if (!post) return buildMetadata({ title: "Artículo no encontrado — Discoolver", description: "", path: `/blog/${slug}`, soloEs: true, noindex: true });
  return buildMetadata({
    title: post.seoTitle || post.title,
    description: post.seoDescription || post.excerpt,
    path: `/blog/${post.slug}`,
    soloEs: true,
    image: post.ogImage || undefined,
  });
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const relacionados = getRelated(slug);
  const archivo = esDeArchivo(post);
  const categoria = post.category;
  const categoriaRuta = categoriaSlug(categoria);
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
            {/* Aquí la categoría SÍ es un enlace —al revés que en la tarjeta del
                índice, que ya va entera dentro de un <a>—: quien acaba de leer
                un artículo de "Salir de noche" es exactamente quien quiere los
                otros nueve, y este es el sitio donde le apetece pedirlos. Sin
                slug (una categoría del CMS que se queda en nada al normalizar)
                no hay página que enlazar: mejor etiqueta muerta que 404. */}
            {categoria &&
              (categoriaRuta ? (
                <Link href={`/blog/categoria/${categoriaRuta}`} className="blog-card__cat">
                  {categoria}
                </Link>
              ) : (
                <span className="blog-card__cat">{categoria}</span>
              ))}
            {post.date && <time dateTime={post.date}>{fechaLegible(post.date)}</time>}
            {/* Pegado a la fecha y no en un banner: lo primero que hay que saber
                de un artículo de hace años es cuándo se escribió, y a esa altura
                el lector ya está mirando la fecha. La nota de abajo explica; esto
                es lo que se ve de un vistazo. */}
            {archivo && <span style={{ opacity: 0.7 }}>Archivo</span>}
          </div>
          <h1 className="display-lg" style={{ marginBottom: 24 }}>
            {post.title}
          </h1>
          {post.excerpt && (
            <p className="section__lead" style={{ marginBottom: 36 }}>
              {post.excerpt}
            </p>
          )}

          {/* Aviso de antigüedad. El blog es el rescate de artículos de 2016-2021
              sobre bares y tiendas concretos: muchos habrán cerrado. Se avisa en
              vez de despublicarlos, porque siguen trayendo el tráfico correcto y
              borrarlos sería tirar años de posicionamiento. Decirlo también nos
              protege: recomendar a ciegas un sitio cerrado desgasta la marca;
              fechar el artículo, no. Y hace falta decir explícitamente que los
              tiempos verbales son de entonces — hay textos en futuro ("el 5 de
              enero los Tres Reyes llegarán…") que sin contexto se leen como una
              web que no sabe en qué año vive. */}
          {archivo && (
            <p className="blog-viejo">
              Publicado en {post.date.slice(0, 4)} y no actualizado desde entonces. Lo
              mantenemos por lo que cuenta, pero las fechas, los horarios y los precios
              son los de aquel momento: comprueba antes de ir que el sitio sigue abierto.
            </p>
          )}

          <div
            className="prose blog-body"
            dangerouslySetInnerHTML={{ __html: post.contentHtml }}
          />

          <BlogCTA ciudad={ciudadDelPost(post)} />

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
      <Footer locale="es" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </>
  );
}
