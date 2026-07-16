import type { Metadata } from 'next'
import { Eyebrow } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Contact — NC Global Assets',
  description: 'Get in touch with NC Global Assets. We reply from Bangkok within 24 hours.',
  alternates: { canonical: '/contact' },
  openGraph: {
    type: 'website',
    url: 'https://www.ncglobalassets.com/contact',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630 }],
  },
}

export default function ContactPage() {
  return (
    <section className="svc-hero">
      <div className="container">
        <Eyebrow style={{ color: 'var(--accent)' }}>Contact</Eyebrow>
        <h1 className="svc-hero__headline">
          Let's talk about<br/>
          <span className="gold italic">your Thailand entry</span>
        </h1>
      </div>
    </section>
  )
}
