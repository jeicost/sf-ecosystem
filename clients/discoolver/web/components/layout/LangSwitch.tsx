"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LOCALES, altPath, localeFromPath, type Locale } from "@/lib/i18n";

/**
 * Selector de idioma. Lleva a la MISMA página en el otro idioma, no a la home:
 * el de /360 mandaba siempre a la portada de la sección, así que quien estaba
 * leyendo alojamientos y pulsaba EN perdía la página y tenía que volver a
 * buscarla. Por eso vive en cliente: la URL actual es el único dato que hace
 * falta y así el mismo componente sirve a las ocho subpáginas y a las legales.
 *
 * Dejó de ser un interruptor de dos posiciones el 26-ago-2026, al entrar el
 * tailandés: antes calculaba el destino con `locale === "en" ? "es" : "en"`, así
 * que con un tercer idioma el botón habría mandado al equivocado y no habría
 * forma de llegar a /th. Ahora pinta un enlace por cada idioma que no sea el
 * actual, derivado de LOCALES: añadir uno más no obliga a volver aquí.
 */

/** Cómo se llama cada idioma en su propio idioma, y el aria para quien no ve. */
const ETIQUETA: Record<Locale, { label: string; aria: string }> = {
  es: { label: "ES", aria: "Leer en español" },
  en: { label: "EN", aria: "Read in English" },
  th: { label: "ไทย", aria: "อ่านภาษาไทย" },
};

export function LangSwitch({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  const pathname = usePathname() ?? "/";
  const actual = localeFromPath(pathname);
  const otros = LOCALES.filter((l) => l !== actual);

  return (
    <>
      {otros.map((l) => (
        <Link
          key={l}
          href={altPath(pathname, l)}
          aria-label={ETIQUETA[l].aria}
          hrefLang={l}
          className={className}
          style={style}
        >
          {ETIQUETA[l].label}
        </Link>
      ))}
    </>
  );
}
