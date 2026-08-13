"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { altPath, localeFromPath, UI } from "@/lib/i18n";

/**
 * Selector de idioma. Lleva a la MISMA página en el otro idioma, no a la home:
 * el de /360 mandaba siempre a la portada de la sección, así que quien estaba
 * leyendo alojamientos y pulsaba EN perdía la página y tenía que volver a
 * buscarla. Por eso vive en cliente: la URL actual es el único dato que hace
 * falta y así el mismo componente sirve a las ocho subpáginas y a las legales.
 */
export function LangSwitch({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  const pathname = usePathname() ?? "/";
  const locale = localeFromPath(pathname);
  const t = UI[locale].switcher;

  return (
    <Link
      href={altPath(pathname, locale === "en" ? "es" : "en")}
      aria-label={t.aria}
      hrefLang={locale === "en" ? "es" : "en"}
      className={className}
      style={style}
    >
      {t.label}
    </Link>
  );
}
