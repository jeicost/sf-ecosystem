import Link from "next/link";
import type { Locale } from "@/lib/i18n";

/**
 * Marca de discoolver 360.
 *
 * El isotipo es el asset original que pasó Carlos (2026-08-10), no una
 * reconstrucción: tiene degradado, sombra burdeos y el swoosh, y eso no se
 * redibuja a mano sin bifurcar la marca. Maestro en `public/assets/360/`:
 *
 *   logo-360-mark.webp        lo que carga la web (27 KB)
 *   logo-360-mark.png         mismo bitmap en PNG, para deck/firmas/export
 *   logo-360-mark-white.png   silueta de una tinta, para fondos que no admiten color
 *   icon-512.png / apple-icon.png   favicon del segmento /360
 *
 * Se sirve con <img> y no con next/image a propósito: son 27 KB, el optimizador
 * no aporta nada y así el nav no depende de la image optimization de Vercel.
 */

const MARK_W = 671;
const MARK_H = 720;

export function Mark360({ size = 34, className }: { size?: number; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/assets/360/logo-360-mark.webp"
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
  locale = "es",
}: {
  href?: string;
  size?: number;
  className?: string;
  locale?: Locale;
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
