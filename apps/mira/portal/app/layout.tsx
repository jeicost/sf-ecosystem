import type { Metadata } from 'next'
import { LocaleProvider } from './locale-provider'
import './globals.css'

// Force Vercel redeploy - Opción A complete + Opción B i18n (ES/EN on all pages)
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'MIRA — AI Agency Platform',
  description: 'Your AI marketing team + Quick Actions framework to scale your business.',
  icons: { icon: '/favicon.svg' },
  // El traductor de Edge/Chrome reescribe los nodos de texto por debajo de
  // React; al siguiente re-render React no encuentra sus nodos y la página
  // revienta con «insertBefore… no es hijo de este nodo» (Usoa, 30-sep-2026,
  // /licitaciones en Edge en español). El portal YA tiene español propio: se
  // le dice al navegador que no traduzca y se ofrece el idioma desde dentro.
  other: { google: 'notranslate' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" translate="no">
      <body>
        <LocaleProvider>
          {children}
        </LocaleProvider>
      </body>
    </html>
  )
}
