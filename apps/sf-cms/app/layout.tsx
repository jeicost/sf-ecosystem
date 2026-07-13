import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SF-CMS — Startup Factory Content Management',
  description: 'Headless CMS for client landing sites',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50">
        {children}
      </body>
    </html>
  )
}
