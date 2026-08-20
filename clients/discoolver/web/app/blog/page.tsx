import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { Nav } from "@/components/app/Nav";
import { Footer } from "@/components/app/Footer";
import { BlogCategorias } from "@/components/blog/BlogCategorias";
import { BlogGrid } from "@/components/blog/BlogGrid";
import { getAllPosts, getCategories, periodoDelArchivo } from "@/lib/posts";

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

          {/* Las categorías estaban aquí en texto plano: se leían, decían
              cuántos artículos tenía cada una y no llevaban a ninguna parte.
              Ahora son las siete rutas de /blog/categoria/<slug>, así que
              además de filtrar, cada categoría es una página con su title y su
              description en vez de una línea muerta. */}
          <BlogCategorias categorias={categorias} total={posts.length} />

          {posts.length === 0 ? (
            <p className="section__lead">
              Estamos preparando los primeros artículos. Vuelve en unos días.
            </p>
          ) : (
            <BlogGrid posts={posts} />
          )}
        </div>
      </main>
      <Footer locale="es" />
    </>
  );
}
