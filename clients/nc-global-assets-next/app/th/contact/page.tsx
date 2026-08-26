import type { Metadata } from 'next'
import { ContactPage } from '../../contact/page'

/**
 * Versión tailandesa. Monta el MISMO componente que la raíz: lo único que
 * cambia es el idioma, que decide qué página pide al CMS (contactpage-th).
 *
 * NOINDEX hasta que Nirada revise el tailandés en el CMS — no se indexa una
 * página a medio traducir. Quitar `robots` al aprobarla y redesplegar (el
 * contenido se hornea en build-time).
 */
export const metadata: Metadata = {
  title: 'Contact — NC Global Assets',
  robots: { index: false, follow: false },
}

export default function Page() {
  return <ContactPage locale="th" />
}
