import Image from "next/image";
import Link from "next/link";
import { Cta } from "@/components/b360/Bits";
import { withLocale, type Locale } from "@/lib/i18n";

/**
 * El hero de las páginas de discoolver 360.
 *
 * DE DÓNDE SALE. El CEO pasó un componente de 21st.dev (`responsive-hero-banner`):
 * imagen a sangre, píldora de badge, titular grande a dos líneas, dos CTA y una
 * fila de logos al pie. Se adapta la ESTRUCTURA, no el código:
 *
 *  · El proyecto **no es shadcn** y no conviene que lo sea. Es Next 16 con un
 *    sistema propio (`brand360.css`, tokens `--b-*`, Poppins/Inter/Space Mono).
 *    Instalar shadcn traería un segundo sistema de diseño y dos fuentes más
 *    para una sola sección.
 *  · El original trae su propia `<header>` con nav y hamburguesa. Aquí no: ya
 *    existe `Nav360`, con su menú responsive. Dos navegaciones en la misma
 *    página es un error de accesibilidad, no un detalle.
 *  · Tipografía y color van a los tokens de 360, no a `Instrument Serif` sobre
 *    neutros de Zinc: eso es la identidad del ejemplo, no la nuestra.
 *
 * FUNCIONA SIN FOTO. `imagen` es opcional a propósito. Cuando no hay, el fondo
 * lo pone una malla de degradados con los dos colores de marca — magenta y
 * cian— sobre el azul casi negro. Así la sección se sostiene hoy y mejora el
 * día que entren las fotos de ciudad, sin tocar una línea.
 */
export type Logo360 = { src: string; alt: string; href?: string };

export function Hero360({
  locale = "es",
  eyebrow,
  badge,
  titulo,
  tituloLinea2,
  sub,
  ctaPrimario,
  ctaPrimarioHref,
  ctaSecundario,
  ctaSecundarioHref,
  imagen,
  imagenAlt,
  avalesTitulo,
  avales = [],
}: {
  locale?: Locale;
  eyebrow?: string;
  badge?: string;
  titulo: string;
  tituloLinea2?: string;
  sub: string;
  ctaPrimario: string;
  ctaPrimarioHref: string;
  ctaSecundario?: string;
  ctaSecundarioHref?: string;
  /** Foto de ciudad a sangre. Sin ella, malla de degradados de marca. */
  imagen?: string;
  imagenAlt?: string;
  avalesTitulo?: string;
  avales?: Logo360[];
}) {
  return (
    <section className={`b360-hero${imagen ? " b360-hero--foto" : ""}`}>
      {imagen && (
        <>
          <Image
            className="b360-hero__foto"
            src={imagen}
            alt={imagenAlt ?? ""}
            fill
            priority
            sizes="100vw"
            quality={82}
          />
          {/* Dos velos, no uno: el vertical asienta el texto sobre la parte
              baja y el de marca tiñe la foto para que no compita con el
              magenta. Con un solo velo plano la foto se veía sucia. */}
          <span className="b360-hero__velo" aria-hidden="true" />
        </>
      )}

      <div className="b360-hero__in">
        {(eyebrow || badge) && (
          <p className="b360-hero__badge">
            {badge && <span className="b360-hero__badge-chip">{badge}</span>}
            {eyebrow && <span>{eyebrow}</span>}
          </p>
        )}

        <h1 className="b360-hero__titulo">
          {titulo}
          {tituloLinea2 && (
            <>
              <br />
              <span className="b360-hero__titulo-2">{tituloLinea2}</span>
            </>
          )}
        </h1>

        <p className="b360-hero__sub">{sub}</p>

        <div className="b360-hero__ctas">
          <Cta href={withLocale(ctaPrimarioHref, locale)}>{ctaPrimario}</Cta>
          {ctaSecundario && ctaSecundarioHref && (
            <Link className="b360-hero__cta-2" href={withLocale(ctaSecundarioHref, locale)}>
              {ctaSecundario}
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          )}
        </div>

        {avales.length > 0 && (
          <div className="b360-hero__avales">
            {avalesTitulo && <p className="b360-hero__avales-t">{avalesTitulo}</p>}
            <ul role="list">
              {avales.map((l) => (
                <li key={l.alt}>
                  {/* Sin next/image: son logos pequeños de un tercero y algunos
                      son SVG; el optimizador no aporta y añade dependencia. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={l.src} alt={l.alt} loading="lazy" decoding="async" />
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
