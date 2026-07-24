import type { Metadata } from 'next'
import { Archivo, Hanken_Grotesk, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { buildMetadata } from '@/lib/seo'
import { personJsonLd } from '@/lib/jsonld'

const archivo = Archivo({
  variable: '--font-archivo',
  subsets: ['latin'],
  weight: ['600', '700', '800', '900'],
  display: 'swap',
})
const hanken = Hanken_Grotesk({
  variable: '--font-hanken',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
})
const jetbrains = JetBrains_Mono({
  variable: '--font-jetbrains',
  subsets: ['latin'],
  weight: ['500', '600'],
  display: 'swap',
})

export const metadata: Metadata = buildMetadata()

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${archivo.variable} ${hanken.variable} ${jetbrains.variable} h-full`}>
      <body className="min-h-full">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd()) }}
        />
        {children}
      </body>
    </html>
  )
}
