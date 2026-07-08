import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SF CRM — Startup Factory',
  description: 'Customer Relationship Management platform for Startup Factory and partner workspaces',
  robots: {
    index: false,
    follow: false,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
