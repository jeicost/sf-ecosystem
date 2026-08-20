import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { Nav } from "@/components/app/Nav";
import { Footer } from "@/components/app/Footer";
import { BlogCategorias } from "@/components/blog/BlogCategorias";
import { BlogGrid } from "@/components/blog/BlogGrid";
import {
  getAllPosts,
  getCategories,
  getCategoriaBySlug,
  getPostsByCategoria,
  periodoDelArchivo,
} from "@/lib/posts";

/**
 * El blog filtrado por categoría.
 *
 * Ruta estática por categoría en vez de un filtro en cliente sobre el índice:
 * son siete listas que salen de 50 artículos horneados en build-time, así que
 * cada una puede existir de verdad —URL propia, title propio, indexable,
 * compartible— por el mismo precio que esconder tarjetas con JavaScript. El
 * blog vive del SEO: siete puertas de entrada más ("comer y beber en Madrid",
 * "historia y leyendas") valen bastante más que un filtro que solo existe
 * mientras alguien mira la pantalla.
 *
 * El segmento se llama `categoria` y no `category` porque la web es en
 * castellano y `/category/*` ya está ocupado: son las 19 categorías del
 * WordPress viejo, que `next.config.ts` redirige al índice desde 2016. Dos
 * rutas casi iguales apuntando a sitios distintos serían una trampa.
 *
 * Sobre el choque con `/blog/[slug]`: en el App Router cada página es una ruta
 * con su propio patrón, y `/blog/categoria/<slug>` solo casa con esta. El que
 * sí cae en `[slug]` es `/blog/categoria` a secas —no hay página en ese nivel—,
 * y ahí el artículo no existe: `[slug]` ya llama a `notFound()`, así que sale
 * un 404 y no una portada rara. No se enlaza desde ningún sitio.
 */
export function generateStaticParams() {
  return getCategories().map((c) => ({ slug: c.slug }));
}

/**
 * Las categorías salen de los artículos ya horneados: fuera de esa lista no hay
 * nada que servir, ni hoy ni entre builds. Cualquier otro slug es un 404 seco
 * en vez de una página que se intenta generar a la carrera.
 */
export const dynamicParams = false;

/** "14 artículos" / "1 artículo" — el plural a mano, que aquí no hace falta más. */
function cuantos(total: number): string {
  return total === 1 ? "1 artículo" : `${total} artículos`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const categoria = getCategoriaBySlug(slug);
  if (!categoria) {
    return buildMetadata({
      title: "Categoría no encontrada — Discoolver",
      description: "",
      path: `/blog/categoria/${slug}`,
      soloEs: true,
      noindex: true,
    });
  }
  const periodo = periodoDelArchivo(getPostsByCategoria(slug));
  // La categoría abre la frase: es la palabra por la que se llega desde Google
  // y la única parte que cambia entre las siete descriptions. Y va tal cual la
  // escribe el CMS —nada de bajarla a minúsculas para encajarla en un "de X"—,
  // que con "Con niños" o "Salir de noche" salían frases torcidas.
  return buildMetadata({
    title: `${categoria.nombre} — Blog de Discoolver`,
    description: `${categoria.nombre}: ${cuantos(categoria.total)} del archivo del blog de discoolver${
      periodo ? ` (${periodo})` : ""
    }. Rutas, listas y rincones que no salen en las guías de siempre.`,
    path: `/blog/categoria/${categoria.slug}`,
    soloEs: true,
  });
}

export default async function CategoriaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const categoria = getCategoriaBySlug(slug);
  if (!categoria) notFound();

  const posts = getPostsByCategoria(slug);
  const periodo = periodoDelArchivo(posts);

  return (
    <>
      <Nav locale="es" />
      <main className="section" style={{ paddingTop: 120 }}>
        <div className="container">
          {/* El eyebrow dice "Blog" y no la categoría: el H1 ya es la categoría
              y repetirla dos veces seguidas no orienta a nadie. Lo que hace
              falta saber al aterrizar aquí desde Google es que esto es el blog. */}
          <span className="eyebrow">Blog</span>
          <h1 className="display-lg" style={{ marginBottom: 12 }}>
            {categoria.nombre}
          </h1>
          {/* Mismo rótulo que el índice, pero con las fechas de ESTA categoría:
              es lo primero que hay que saber de una lista de bares de hace años. */}
          <p className="blog-card__meta" style={{ marginBottom: 16 }}>
            Del archivo de discoolver{periodo ? ` · ${periodo}` : ""} · {cuantos(categoria.total)}
          </p>
          <p className="section__lead" style={{ maxWidth: "56ch", marginBottom: 20 }}>
            Lo mantenemos publicado tal cual se escribió: por lo que cuenta, no por lo
            que siga abierto hoy. Comprueba horarios antes de ir.
          </p>

          <BlogCategorias
            categorias={getCategories()}
            total={getAllPosts().length}
            activa={categoria.slug}
          />

          <BlogGrid posts={posts} />
        </div>
      </main>
      <Footer locale="es" />
    </>
  );
}
