'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LOCALES, LOCALE_LABEL, altPath, localeFromPath } from '@/lib/i18n'

/**
 * Selector de idioma.
 *
 * Lleva a la MISMA página en el otro idioma, no a la portada: quien está
 * leyendo /services y pulsa ไทย tiene que acabar en /th/services. La URL actual
 * es el único dato que hace falta, por eso vive en cliente.
 *
 * Pinta un enlace por cada idioma distinto del actual, derivado de LOCALES: si
 * mañana entra un tercero no hay que volver aquí. Es el error que costó caro en
 * discoolver.com, donde el switcher era un ternario `locale === "en" ? … : …` y
 * con un idioma más habría mandado al equivocado sin dar error.
 */
export function LangSwitch({ className, onNavigate }: { className?: string; onNavigate?: () => void }) {
  const pathname = usePathname() ?? '/'
  const actual = localeFromPath(pathname)
  const otros = LOCALES.filter((l) => l !== actual)

  return (
    <>
      {otros.map((l) => (
        <Link
          key={l}
          href={altPath(pathname, l)}
          hrefLang={l}
          aria-label={LOCALE_LABEL[l].aria}
          className={className}
          onClick={onNavigate}
        >
          {LOCALE_LABEL[l].label}
        </Link>
      ))}
    </>
  )
}
