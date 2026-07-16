import type { Metadata } from 'next'
import { Eyebrow } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'About — NC Global Assets',
  description: 'Bringing international brands to Thailand with local infrastructure, market expertise and hands-on operations.',
  alternates: { canonical: '/about' },
  openGraph: {
    type: 'website',
    url: 'https://www.ncglobalassets.com/about',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630 }],
  },
}

export default function AboutPage() {
  return (
    <section className="svc-hero">
      <div className="container">
        <Eyebrow style={{ color: 'var(--accent)' }}>About</Eyebrow>
        <h1 className="svc-hero__headline">
          Why we built<br/>
          <span className="gold italic">NC Global Assets</span>
        </h1>
        <p className="svc-hero__sub">
          The gap between wanting to enter Thailand and actually succeeding was too big. We filled it.
        </p>
      </div>
    </section>
  )
}
