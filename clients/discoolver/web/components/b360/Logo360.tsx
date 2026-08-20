import Link from "next/link";
import type { Locale } from "@/lib/i18n";

/**
 * Marca de discoolver 360.
 *
 * El isotipo es el asset original que pasó Carlos (2026-08-10), no una
 * reconstrucción: tiene degradado, sombra burdeos y el swoosh, y eso no se
 * redibuja a mano sin bifurcar la marca. Maestro en `public/assets/360/`:
 *
 *   logo-360-mark-calado.webp lo que carga la web sobre fondo oscuro
 *   logo-360-mark.webp        el original tal cual lo pasó Carlos, intacto
 *   logo-360-mark.png         mismo bitmap en PNG, para deck/firmas/export
 *   logo-360-mark-white.png   silueta de una tinta, para fondos que no admiten color
 *   icon-512.png / apple-icon.png   favicon del segmento /360
 *
 * Se sirve con <img> y no con next/image a propósito: son 27 KB, el optimizador
 * no aporta nada y así el nav no depende de la image optimization de Vercel.
 *
 * POR QUÉ HAY UNA VERSIÓN «CALADA» (19-ago-2026). En el original, el hueco de
 * la D está **pintado de blanco**, no calado. Sobre papel o sobre fondo claro
 * se lee como un hueco; sobre el nav de 360 —que es casi negro— es una mancha
 * blanca en mitad de la letra, y a 34 px se come el dibujo. La versión calada
 * pone ese blanco a alfa 0 con un borde progresivo: **no se redibuja nada**,
 * cada píxel del trazo se conserva y el hueco pasa a ser un hueco de verdad.
 * El original se queda para papel, firmas y cualquier fondo claro.
 */

const MARK_W = 671;
const MARK_H = 720;

export function Mark360({ size = 34, className }: { size?: number; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/assets/360/logo-360-mark-calado.webp"
      alt=""
      aria-hidden="true"
      width={Math.round((size * MARK_W) / MARK_H)}
      height={size}
      className={className}
      loading="eager"
      decoding="async"
    />
  );
}

/** Lockup completo: isotipo + "discoolver 360". Es el enlace a /360. */
export function Logo360({
  href = "/360",
  size = 34,
  className,
  locale,
}: {
  href?: string;
  size?: number;
  className?: string;
  locale: Locale;
}) {
  return (
    <Link
      href={href}
      className={`b360-logo ${className ?? ""}`.trim()}
      // Lo único del lockup que cambia de idioma: el resto es la marca, que no
      // se traduce. Iba fijo en español y era lo primero que leía un lector de
      // pantalla en /en/360.
      aria-label={locale === "en" ? "discoolver 360 — home" : "discoolver 360 — inicio"}
    >
      <Mark360 size={size} />
      <span className="b360-logo__wm">
        discoolver <span className="b360-logo__360">360</span>
      </span>
    </Link>
  );
}
