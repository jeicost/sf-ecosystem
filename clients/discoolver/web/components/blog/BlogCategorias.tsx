import Link from "next/link";
import type { Categoria } from "@/lib/posts";

/**
 * El filtro por categoría del blog.
 *
 * Enlaces a rutas de verdad (`/blog/categoria/<slug>`) y no un filtro en
 * estado de React: el blog es estático y son 50 artículos rescatados que viven
 * del SEO, así que cada categoría tiene que ser una URL indexable, que se pueda
 * compartir, que aguante el botón de atrás y que tenga su propio title. Un
 * filtro en cliente se vería igual y no existiría para nadie más que para quien
 * ya está mirando la pantalla — además de obligar a mandar los 50 artículos al
 * navegador para esconder 36.
 *
 * Se ve en el índice y en cada categoría, siempre entera y en el mismo orden:
 * es la forma de saltar de "Compras" a "Con niños" sin volver al índice.
 */
export function BlogCategorias({
  categorias,
  total,
  activa,
}: {
  categorias: Categoria[];
  /** Artículos publicados en total — el número de "Todas". */
  total: number;
  /** Slug de la categoría abierta. Sin él, la activa es "Todas". */
  activa?: string;
}) {
  if (categorias.length === 0) return null;

  return (
    <nav className="blog-cats" aria-label="Categorías del blog">
      {/* "Todas" es la vuelta al índice y va primera para que el camino de
          salida esté donde el lector ya está mirando, no al final de la fila. */}
      <Link href="/blog" className="blog-cats__link" aria-current={activa ? undefined : "page"}>
        Todas <span className="blog-cats__total">({total})</span>
      </Link>
      {categorias.map((c) => (
        <Link
          key={c.slug}
          href={`/blog/categoria/${c.slug}`}
          className="blog-cats__link"
          // La activa se marca con aria-current, que es lo que un lector de
          // pantalla necesita para saber dónde está; el estilo cuelga de ese
          // mismo atributo en vez de una clase paralela que se pueda quedar
          // desincronizada con él.
          aria-current={activa === c.slug ? "page" : undefined}
        >
          {c.nombre} <span className="blog-cats__total">({c.total})</span>
        </Link>
      ))}
    </nav>
  );
}
