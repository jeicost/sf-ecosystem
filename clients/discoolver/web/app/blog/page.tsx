import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import { Nav } from "@/components/app/Nav";
import { Footer } from "@/components/app/Footer";
import { getAllPosts, getCategories, fechaLegible } from "@/lib/posts";

/**
 * El blog — índice.
 *
 * Los artículos vienen de SF-CMS horneados en build-time (ver lib/posts.ts).
 * El contenido de arranque es el rescate del blog viejo de discoolver.com, que
 * vivía en un WordPress cuyo alojamiento ya no existe: se recuperó del archivo
 * de Internet y se reimportó al CMS, así que a partir de aquí se edita como
 * cualquier otra cosa, sin WordPress de por medio.
 */
export const metadata = buildMetadata({
  title: "Blog — Discoolver",
  description:
    "Rutas, listas y secretos de las ciudades que curamos. Lo que cuentan quienes viven allí, editado por nuestro equipo.",
  path: "/blog",
  soloEs: true,
});

export default function BlogPage() {
  const posts = getAllPosts();
  const categorias = getCategories();

  return (
    <>
      <Nav locale="es" />
      <main className="section" style={{ paddingTop: 120 }}>
        <div className="container">
          <span className="eyebrow">Blog</span>
          <h1 className="display-lg" style={{ marginBottom: 18 }}>
            Las ciudades, por dentro.
          </h1>
          <p className="section__lead" style={{ maxWidth: "56ch", marginBottom: 20 }}>
            Rutas, listas y rincones que no salen en las guías de siempre. Lo que cuenta
            quien vive la ciudad, editado por nuestro equipo.
          </p>

          {categorias.length > 0 && (
            <p style={{ marginBottom: 40, fontSize: 13.5, color: "var(--ink-2)" }}>
              {categorias.map((c, i) => (
                <span key={c.nombre}>
                  {i > 0 && " · "}
                  {c.nombre} <span style={{ opacity: 0.6 }}>({c.total})</span>
                </span>
              ))}
            </p>
          )}

          {posts.length === 0 ? (
            <p className="section__lead">
              Estamos preparando los primeros artículos. Vuelve en unos días.
            </p>
          ) : (
            <div className="blog-grid">
              {posts.map((p) => (
                <article key={p.slug} className="blog-card">
                  <Link href={`/blog/${p.slug}`} className="blog-card__link">
                    {p.ogImage && (
                      // eslint-disable-next-line @next/next/no-img-element -- imágenes
                      // rescatadas del blog viejo, de tamaños dispares; el optimizador
                      // de Vercel no aporta aquí y encarece el build.
                      <img className="blog-card__img" src={p.ogImage} alt="" loading="lazy" />
                    )}
                    <div className="blog-card__body">
                      <div className="blog-card__meta">
                        {p.category && <span className="blog-card__cat">{p.category}</span>}
                        {p.date && <time dateTime={p.date}>{fechaLegible(p.date)}</time>}
                      </div>
                      <h2 className="blog-card__title">{p.title}</h2>
                      {p.excerpt && <p className="blog-card__excerpt">{p.excerpt}</p>}
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
