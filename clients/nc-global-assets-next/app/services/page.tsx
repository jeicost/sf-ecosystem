import type { Metadata } from 'next'
import { Eyebrow } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Services — Brand Launch, F&B Operations — NC Global Assets',
  description: 'Brand representation, go-to-market planning, cloud kitchen operations, local fulfillment and market entry in Bangkok, Thailand.',
  alternates: { canonical: '/services' },
  openGraph: {
    type: 'website',
    url: 'https://www.ncglobalassets.com/services',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630 }],
  },
}

export default function ServicesPage() {
  return (
    <section className="svc-hero">
      <div className="container">
        <Eyebrow style={{ color: 'var(--accent)' }}>Services</Eyebrow>
        <h1 className="svc-hero__headline">
          Three ways we<br/>
          <span className="gold italic">work with you</span>
        </h1>
      </div>
    </section>
  )
}
