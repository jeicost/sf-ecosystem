import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";
import { Book3D } from "@/components/ui/Book3D";
import { Icon } from "@/components/ui/Icon";
import type { AppHomeContent } from "@/lib/content/app-home";
import type { Locale } from "@/lib/i18n";

/**
 * El puente de la home hacia la tienda de guías.
 *
 * POR QUÉ EXISTE. Hasta el 13-ago-2026 el cuerpo de la home no enlazaba ni una
 * sola vez a /guias ni a /360: 25 enlaces llevaban a la plataforma gratuita y
 * cero a los dos negocios que cobran. Los únicos accesos a la tienda estaban en
 * el menú y en el pie, que es donde nadie los busca. Esta sección es el único
 * sitio del recorrido B2C donde alguien se entera de que existe un producto de
 * pago.
 *
 * Las portadas son las mismas piezas 3D en CSS que usa el catálogo
 * (`Book3D`), no capturas: así no hay imágenes que mantener y el bloque pesa
 * cero. Y NO llevan firma de autor — las que había eran nombres inventados y
 * se retiraron; las de verdad entran cuando los creadores firmen.
 *
 * REESCRITO 19-ago-2026 con el brief del CEO. Tres reglas que lo gobiernan:
 *
 *  · **Nada de escasez.** La producción es bajo demanda: no hay tirada
 *    limitada, ni ejemplares numerados, ni "últimas unidades". Lo que hace
 *    especial a la guía es que la edición es ANUAL y la selección editorial,
 *    no que se acabe. "Edición limitada" era falso y está prohibido.
 *  · **El precio aparece dos veces, no cinco.** Solo en la línea de apoyo del
 *    CTA y en cada tarjeta. Fuera del subtítulo y fuera del botón.
 *  · **La nota de gratuidad no es opcional.** La conversión principal de la
 *    home es entrar en la plataforma, que es gratis; sin esa línea, quien pasa
 *    en scroll rápido asocia estos 14€/29€ al acceso.
 *
 * ⚠️ "{n} sitios · {n} creadores" del brief queda fuera a propósito: ese dato
 * es de la guía, no del catálogo de la plataforma, y vive en el dg-editor, al
 * que esta web no tiene acceso. Poner aquí los 1.099 de Madrid sería enseñar
 * el catálogo entero como si fuera el índice de la guía. Cuando el editor lo
 * exponga, entra en `PORTADAS` y se pinta.
 */

/**
 * La colección, en el orden que fijó el CEO.
 *
 * `estado` no es decoración: **ninguna guía está a la venta todavía**. La
 * tienda dice que Madrid sale el 1 de septiembre y el resto en otoño, así que
 * una tarjeta que enseñe precio y un "ver la guía" sin más haría creer que se
 * puede comprar hoy. Las que tienen fecha llevan precio y enlace; las que
 * están en preparación llevan solo su estado — no hay ficha que ver.
 *
 * Las siete son las mismas, con los mismos colores y los mismos estados, aquí
 * y en /guias: una guía no puede verse distinta según por dónde se llegue.
 * Ronda salió de las dos el 19-ago-2026.
 */
/** Una portada por ciudad. `cityEn` solo donde el nombre cambia en inglés. */
type Portada = {
  city: string;
  cityEn?: string;
  bg: string;
  ink: string;
  accent: string;
  estado: "fecha" | "otono" | "pronto";
};

const PORTADAS: Portada[] = [
  { city: "Madrid", bg: "#22578a", ink: "#f2f0ea", accent: "#f4b47a", estado: "fecha" },
  { city: "Barcelona", bg: "#c8006b", ink: "#f2f0ea", accent: "#c9ff3f", estado: "otono" },
  { city: "Málaga", bg: "#c9ff3f", ink: "#141414", accent: "#c8006b", estado: "otono" },
  { city: "Valencia", bg: "#6d2f5e", ink: "#f2f0ea", accent: "#f4b47a", estado: "pronto" },
  { city: "Ibiza", bg: "#f2f0ea", ink: "#141414", accent: "#c8006b", estado: "otono" },
  { city: "Bangkok", bg: "#8f004d", ink: "#f2f0ea", accent: "#f4b47a", estado: "pronto" },
  // `cityEn` solo donde el nombre cambia: las demás se escriben igual en
  // los dos idiomas. Sin esto, /en enseñaba «Dubái» en el lomo, en la cubierta
  // y en el título de la tarjeta (encontrado el 20-ago-2026).
  { city: "Dubái", cityEn: "Dubai", bg: "#2b3a6b", ink: "#f2f0ea", accent: "#e6c26a", estado: "pronto" },
] as const;

export function GuiasBridge({ content, locale }: { content: AppHomeContent; locale: Locale }) {
  const es = locale === "es";
  const href = es ? "/guias" : "/en/guias";

  return (
    <section className="section" id="guias-bridge" aria-labelledby="guias-bridge-title">
      <div className="container">
        <Reveal delay={0}>
          <div className="section__head">
            <div className="section__head-text">
              <span className="eyebrow">{content.shop_eyebrow}</span>
              <h2 className="display-lg section__title" id="guias-bridge-title">
                {content.shop_title_1}
                <br />
                <span style={{ color: "var(--primary)" }}>{content.shop_title_highlight}</span>
              </h2>
              <p className="section__lead">{content.shop_lead}</p>
            </div>
            <div className="guias__accion">
              <Link className="btn btn-primary" href={href}>
                {content.shop_cta} <Icon name="arrow-right" size={14} />
              </Link>
              {/* El precio va DEBAJO del botón, nunca dentro: un botón que
                  lleva cifra se lee como un pago inmediato. */}
              <p className="guias__apoyo">{content.shop_price_line}</p>
            </div>
          </div>
        </Reveal>

        {/* Rejilla fija, no auto-fit: con siete portadas el auto-fit metía seis
            arriba y dejaba a Dubái sola en una segunda fila. Cuatro y tres. */}
        <div className="guias__rejilla" role="list">
          {PORTADAS.map((p, i) => {
            const enPreparacion = p.estado === "pronto";
            const ciudad = es ? p.city : (p.cityEn ?? p.city);
            const estado =
              p.estado === "fecha"
                ? content.shop_estado_fecha
                : p.estado === "otono"
                  ? content.shop_estado_otono
                  : content.shop_estado_pronto;
            return (
            <Reveal delay={i * 60} key={p.city}>
              <Link
                href={href}
                role="listitem"
                className={`guias__tarjeta${enPreparacion ? " guias__tarjeta--pronto" : ""}`}
                aria-label={`${ciudad} — ${estado}`}
              >
                <div className="book-scene" style={{ marginBottom: 14 }}>
                  <Book3D
                    cover={{
                      kind: "typo",
                      city: ciudad,
                      sub: es ? "Edición 2026" : "2026 Edition",
                      bg: p.bg,
                      ink: p.ink,
                      accent: p.accent,
                      chip: es ? undefined : "Discoolver Guide · 2026",
                    }}
                    spineText={ciudad}
                    spineColor={p.bg}
                  />
                </div>
                {/* La ciudad y el año ya van impresos en la portada 3D; aquí
                    se decían otra vez cada uno. Queda el nombre una sola vez. */}
                <h3 className="guias__ciudad">{ciudad}</h3>
                <p className="guias__estado">{estado}</p>
                {/* Sin fecha no hay precio ni "ver la guía": no hay nada que
                    ver todavía y la cifra sugeriría que se puede comprar. */}
                {!enPreparacion && (
                  <>
                    <p className="guias__precio">{content.shop_price}</p>
                    <span className="guias__cta-tarjeta">
                      {content.shop_card_cta.replace("{ciudad}", p.city)} <Icon name="arrow-right" size={12} />
                    </span>
                  </>
                )}
              </Link>
            </Reveal>
            );
          })}
        </div>

        <Reveal delay={240}>
          <div className="guias__argumentos">
            {[1, 2, 3].map((n) => (
              <p key={n}>
                <strong>{content[`shop_arg_${n}_title` as keyof AppHomeContent]}</strong>{" "}
                {content[`shop_arg_${n}_desc` as keyof AppHomeContent]}
              </p>
            ))}
          </div>
          <p className="guias__aparte">{content.shop_aparte}</p>
        </Reveal>
      </div>
    </section>
  );
}
