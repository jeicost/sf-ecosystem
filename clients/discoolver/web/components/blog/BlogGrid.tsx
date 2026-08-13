import Link from "next/link";
import { fechaLegible, type Post } from "@/lib/posts";

/**
 * La rejilla de tarjetas del blog.
 *
 * Sale del índice a un componente desde que hay páginas de categoría: el índice
 * y las siete listas enseñan exactamente lo mismo con distinto filtro, y una
 * tarjeta duplicada se acaba tocando solo en un sitio — el blog se vería de dos
 * maneras según por dónde entres. La lista ya viene ordenada y filtrada de
 * `lib/posts.ts`; aquí solo se pinta.
 */
export function BlogGrid({ posts }: { posts: Post[] }) {
  return (
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
              {/* La categoría de la tarjeta se queda en <span>: la tarjeta
                  entera ya es un enlace al artículo y un <a> dentro de otro <a>
                  no es HTML válido —el navegador lo desanida y el resultado
                  depende de cada uno—. Filtrar se hace arriba, en la fila de
                  categorías, que es donde el lector va a buscarlo. */}
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
  );
}
