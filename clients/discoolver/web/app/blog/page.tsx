import Link from "next/link";
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { Nav } from "@/components/app/Nav";
import { Footer } from "@/components/app/Footer";
import { getAllPosts, getCategories, fechaLegible, periodoDelArchivo } from "@/lib/posts";

/**
 * El blog — índice.
 *
 * Los artículos vienen de SF-CMS horneados en build-time (ver lib/posts.ts).
 * El contenido de arranque es el rescate del blog viejo de discoolver.com, que
 * vivía en un WordPress cuyo alojamiento ya no existe: se recuperó del archivo
 * de Internet y se reimportó al CMS, así que a partir de aquí se edita como
 * cualquier otra cosa, sin WordPress de por medio.
 *
 * La sección se presenta como ARCHIVO, no como un blog vivo. No es cosmética:
 * el artículo más nuevo es de diciembre de 2021 y dentro hay presentes y
 * futuros que ya no se sostienen ("el 5 de enero los Tres Reyes llegarán…",
 * "¡Feliz 2019!"). Prometer "lo que cuenta quien vive la ciudad" en presente,
 * como decía esta portada, convertía un archivo perfectamente respetable en
 * una web abandonada. Fechado es una decisión editorial; sin fechar, un
 * descuido. Se retira el día que se publique con regularidad, no antes.
 */
export function generateMetadata(): Metadata {
  const periodo = periodoDelArchivo();
  return buildMetadata({
    title: "Blog — Discoolver",
    description: `El archivo del blog de discoolver${periodo ? ` (${periodo})` : ""}: rutas, listas y rincones de la ciudad que no salen en las guías de siempre.`,
    path: "/blog",
    soloEs: true,
  });
}

export default function BlogPage() {
  const posts = getAllPosts();
  const categorias = getCategories();
  const periodo = periodoDelArchivo();

  return (
    <>
      <Nav locale="es" />
      <main className="section" style={{ paddingTop: 120 }}>
        <div className="container">
          <span className="eyebrow">Blog</span>
          <h1 className="display-lg" style={{ marginBottom: 12 }}>
            Las ciudades, por dentro.
          </h1>
          {periodo && (
            // Mismo tratamiento tipográfico que la fecha de cada tarjeta: el
            // rótulo se lee como el pie de foto de la sección, no como un aviso.
            <p className="blog-card__meta" style={{ marginBottom: 16 }}>
              Del archivo de discoolver · {periodo}
            </p>
          )}
          <p className="section__lead" style={{ maxWidth: "56ch", marginBottom: 20 }}>
            Rutas, listas y rincones que no salen en las guías de siempre. Lo mantenemos
            publicado tal cual se escribió: por lo que cuenta, no por lo que siga abierto
            hoy. Comprueba horarios antes de ir.
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
                    {p.ogImage ? (
                      // Imágenes rescatadas del blog viejo, de tamaños dispares; el
                      // optimizador de Vercel no aporta aquí y encarece el build. El
                      // disable va pegado al <img> porque "next-line" es literal: con
                      // la explicación en medio suprimía el comentario, no el aviso.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img className="blog-card__img" src={p.ogImage} alt="" loading="lazy" />
                    ) : (
                      // 32 de los 50 artículos rescatados perdieron su foto con el
                      // alojamiento viejo y no están en el archivo. Antes que inventar
                      // una imagen con IA —que no correspondería al sitio del que habla
                      // el artículo— se pone un fondo tipográfico por categoría: la
                      // rejilla queda pareja y se lee como una decisión, no como un
                      // hueco. El color sale de la categoría, así que es estable entre
                      // renders y agrupa visualmente los temas.
                      <div
                        className="blog-card__img blog-card__falso"
                        data-cat={p.category || "Ciudad"}
                        aria-hidden="true"
                      >
                        <span>{p.category || "Discoolver"}</span>
                      </div>
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
