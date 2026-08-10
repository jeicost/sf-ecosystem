import type { Metadata } from 'next'
import { LocaleProvider } from './locale-provider'
import './globals.css'

// Force Vercel redeploy - Opción A complete + Opción B i18n (ES/EN on all pages)
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'MIRA — AI Agency Platform',
  description: 'Your AI marketing team + Quick Actions framework to scale your business.',
  icons: { icon: '/favicon.svg' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <LocaleProvider>
          {children}
        </LocaleProvider>
      </body>
    </html>
  )
}
