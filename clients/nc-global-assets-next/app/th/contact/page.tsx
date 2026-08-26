import type { Metadata } from 'next'
import { ContactPage } from '../../contact/page'

/**
 * Versión tailandesa. Monta el MISMO componente que la raíz: lo único que
 * cambia es el idioma, que decide qué página pide al CMS (contactpage-th).
 *
 * Indexable desde el 26-ago-2026 por decisión de Carlos: se publica ya, aunque
 * el contenido siga en inglés hasta que Nirada traduzca en el CMS.
 */
export const metadata: Metadata = {
  title: 'Contact — NC Global Assets',
}

export default function Page() {
  return <ContactPage locale="th" />
}
