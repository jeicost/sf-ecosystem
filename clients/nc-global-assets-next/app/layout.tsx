import type { Metadata } from 'next'
import './globals.css'
import { PageShell } from '@/components/Layout'

const DOMAIN = 'https://www.ncglobalassets.com'

export const metadata: Metadata = {
  metadataBase: new URL(DOMAIN),
  title: 'NC Global Assets — Launch your brand in Thailand',
  description: 'NC Global Assets helps international brands test, launch and operate in Bangkok. Local infrastructure, market expertise and hands-on execution in Thailand and Southeast Asia.',
  keywords: 'brand launch Thailand, Bangkok market entry, F&B Thailand, operating partner Bangkok, Southeast Asia expansion, local partner Thailand',
  authors: [{ name: 'NC Global Assets' }],
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    url: DOMAIN,
    title: 'NC Global Assets — Launch your brand in Thailand',
    description: 'We help international brands test, launch and operate in Bangkok — with real local infrastructure, hands-on execution and partners invested in your success.',
    siteName: 'NC Global Assets',
    images: [
      {
        url: `${DOMAIN}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: 'NC Global Assets Bangkok',
      },
    ],
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NC Global Assets — Launch your brand in Thailand',
    description: 'We help international brands test, launch and operate in Bangkok with real local infrastructure and hands-on execution.',
    images: [`${DOMAIN}/og-image.jpg`],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: 'NC Global Assets Co. Ltd.',
    description: 'Local operating partner helping international brands enter and grow in Thailand. Market entry, F&B operations, brand launch and local execution in Bangkok.',
    url: DOMAIN,
    email: 'nirada@ncglobalassets.com',
    telephone: '+6682536653',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '507/10 Sathu Pradit Rd',
      addressLocality: 'Chong Nonsi, Yan Nawa',
      addressRegion: 'Bangkok',
      postalCode: '10120',
      addressCountry: 'TH',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: '13.6973',
      longitude: '100.5344',
    },
    areaServed: ['Thailand', 'Southeast Asia'],
    sameAs: ['https://www.instagram.com/globalassets.thailand'],
  }

  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'NC Global Assets',
    description: 'Investment and asset management firm specializing in brand launches and market entry in Bangkok, Thailand.',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '507/10 Sathu Pradit Rd',
      addressLocality: 'Bangkok',
      postalCode: '10120',
      addressCountry: 'TH',
    },
    telephone: '+6682536653',
    email: 'nirada@ncglobalassets.com',
    url: DOMAIN,
    geo: {
      '@type': 'GeoCoordinates',
      latitude: '13.6973',
      longitude: '100.5344',
    },
  }

  return (
    <html lang="en">
      <head>
        <meta name="geo.region" content="TH-10" />
        <meta name="geo.placename" content="Bangkok, Thailand" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400;1,600;1,700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
        />
        {/* Google Tag Manager */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-K5Z8P2T5');`,
          }}
        />
      </head>
      <body>
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-K5Z8P2T5"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        <PageShell>{children}</PageShell>
      </body>
    </html>
  )
}
