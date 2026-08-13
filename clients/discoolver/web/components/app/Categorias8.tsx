import Image from "next/image";
import { Reveal } from "@/components/ui/Reveal";
import { Icon } from "@/components/ui/Icon";
import { PLATFORM } from "@/lib/platform";
import type { AppHomeContent } from "@/lib/content/app-home";
import type { Locale } from "@/lib/i18n";

/**
 * Las ocho categorías de la taxonomía, con las fotos de cabeza de animal.
 *
 * POR QUÉ OCHO Y NO SEIS. La sección anterior enseñaba las seis categorías que
 * la plataforma tenía en agosto de 2026 (Gastronomía, Qué ver, Ocio y eventos,
 * Nightlife, Compras, Alojamiento). La taxonomía que se cerró con Diego el
 * 12-ago fija **ocho**, y son las mismas para la app, para las guías y para el
 * curador. Si la web enseña otras, cada superficie cuenta una historia distinta.
 * Fuente: deliverables/repaso-2026-08-10/TAXONOMIA_PARA_DIEGO.md.
 *
 * SIN CONTADORES, A PROPÓSITO. Las tarjetas viejas llevaban «367 sitios», «216»…
 * escritos a mano en el CMS, sin nada detrás que los actualizara. La API de la
 * plataforma solo expone recuentos por subcategoría (#hoteles, #arquitectura…)
 * y no hay forma de sumarlos a estas ocho sin adivinar el mapeo, así que no hay
 * número: mejor ninguno que uno inventado. Si Diego expone el recuento por
 * categoría, entra aquí y ya.
 *
 * LA FOTO QUE FALTA. Hay siete fotos de cabeza de animal utilizables y ocho
 * categorías. «Naturaleza y aire libre» se queda sin foto que le pegue —la del
 * conejo con albornoz es de balneario, no de campo— y se resuelve con portada
 * tipográfica, el mismo recurso que ya usan los artículos del blog que
 * perdieron su imagen. En cuanto haya foto, se añade a FOTOS y desaparece.
 */

type Categoria = {
  clave: string;
  /** El asset, o null si todavía no hay foto y va con portada tipográfica. */
  foto: string | null;
  /** Solo para la portada tipográfica: el color de fondo. */
  tono?: string;
};

const CATEGORIAS: Categoria[] = [
  { clave: "restaurantes", foto: "/assets/img-fox.jpg" },
  // Vida nocturna se lleva el canguro (metro de noche, neón) y experiencias el
  // oso (grada, palomitas: eso es un evento). Estaban al revés y experiencias
  // usaba el segundo búho, así que salían dos búhos casi idénticos uno al lado
  // del otro — la sección parecía repetida.
  { clave: "nightlife", foto: "/assets/img-metro-kangaroo.jpg" },
  { clave: "cultura", foto: "/assets/img-owl.jpg" },
  { clave: "experiencias", foto: "/assets/img-bear.jpg" },
  { clave: "compras", foto: "/assets/img-bunny.jpg" },
  { clave: "alojamiento", foto: "/assets/img-koala-rome.jpg" },
  { clave: "wellness", foto: "/assets/img-rabbit-cave.jpg" },
  { clave: "naturaleza", foto: null, tono: "#1f4a3a" },
];

export function Categorias8({ content, locale = "es" }: { content: AppHomeContent; locale?: Locale }) {
  const es = locale === "es";

  return (
    <section className="section categorias8" id="categorias" aria-labelledby="categorias-title">
      <div className="container">
        <Reveal delay={0}>
          <div className="section__head">
            <div className="section__head-text">
              <span className="eyebrow">{content.categories_eyebrow}</span>
              <h2 className="display-lg section__title" id="categorias-title">
                {content.categories_title}{" "}
                <span style={{ color: "var(--primary)" }}>{content.categories_title_highlight}</span>
              </h2>
              <p className="section__lead">{content.categories_lead}</p>
            </div>
            <a className="btn btn-ink" href={PLATFORM.search}>
              {content.categories_cta} <Icon name="arrow-up-right" size={14} />
            </a>
          </div>
        </Reveal>

        <div className="categorias8__grid" role="list">
          {CATEGORIAS.map((cat, i) => {
            const nombre = content[`cat8_${cat.clave}_name` as keyof AppHomeContent] as string;
            const pie = content[`cat8_${cat.clave}_desc` as keyof AppHomeContent] as string;
            return (
              <Reveal delay={i * 60} key={cat.clave}>
                <a
                  href={PLATFORM.search}
                  role="listitem"
                  className="categorias8__card"
                  aria-label={`${nombre} — ${es ? "buscar en la plataforma" : "search the platform"}`}
                >
                  <div className="categorias8__foto">
                    {cat.foto ? (
                      <Image
                        src={cat.foto}
                        alt=""
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1100px) 33vw, 25vw"
                        style={{ objectFit: "cover" }}
                      />
                    ) : (
                      <span className="categorias8__typo" style={{ background: cat.tono }} aria-hidden="true">
                        {nombre}
                      </span>
                    )}
                  </div>
                  <h3 className="categorias8__nombre">{nombre}</h3>
                  <p className="categorias8__pie">{pie}</p>
                </a>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
