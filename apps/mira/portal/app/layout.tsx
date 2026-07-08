import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'MIRA — AI Agency Platform',
  description: '30 agentes de IA trabajando 24/7 para hacer crecer tu negocio.',
  icons: { icon: '/favicon.svg' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
