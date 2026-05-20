import type { Metadata } from 'next'

const DOMAIN = 'https://www.ncglobalassets.com'

export const metadata: Metadata = {
  title: 'Services — NC Global Assets',
  description: 'Market entry, brand launch, F&B operations and SEA expansion services for international brands in Thailand. Real infrastructure, hands-on execution.',
  alternates: { canonical: '/services' },
  openGraph: {
    type: 'website',
    url: `${DOMAIN}/services`,
    title: 'Services — NC Global Assets',
    description: 'We help brands test, launch and operate in Bangkok with real local infrastructure and execution.',
  },
}

export default function Services() {
  return (
    <>
      {/* Hero */}
      <section className="hero" style={{ minHeight: '40vh' }}>
        <div className="hero-content container">
          <h1 className="hero-headline">
            <span className="line">What we do</span>
            <span className="line">to help you <span className="gold italic">succeed</span></span>
          </h1>
        </div>
      </section>

      {/* Services Overview */}
      <section className="section">
        <div className="container">
          <h2 style={{ marginBottom: '3rem' }}>Our Services</h2>
          <div style={{ display: 'grid', gap: '3rem' }}>
            {/* Market Entry */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--accent)', letterSpacing: '0.05em', marginBottom: '1rem' }}>
                  01. Market Entry
                </div>
                <h3 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '1rem' }}>
                  Validate your product in Bangkok
                </h3>
                <p style={{ lineHeight: 1.6, marginBottom: '1rem' }}>
                  We run real sales pilots using our existing infrastructure. Gather authentic customer feedback, validate product-market fit and understand local demand before committing to a full launch.
                </p>
                <ul style={{ lineHeight: 1.8 }}>
                  <li>✓ 4–8 week market validation pilot</li>
                  <li>✓ Real sales channels and customer feedback</li>
                  <li>✓ Product adaptation recommendations</li>
                  <li>✓ Pricing and positioning strategy</li>
                </ul>
              </div>
              <div style={{ backgroundColor: '#f5f5f5', borderRadius: '12px', padding: '2rem', minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#ccc', fontSize: '3rem', fontWeight: 300 }}>Market Entry Illustration</span>
              </div>
            </div>

            {/* Brand Launch */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', alignItems: 'center' }}>
              <div style={{ backgroundColor: '#f5f5f5', borderRadius: '12px', padding: '2rem', minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', order: -1 }}>
                <span style={{ color: '#ccc', fontSize: '3rem', fontWeight: 300 }}>Brand Launch Illustration</span>
              </div>
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--accent)', letterSpacing: '0.05em', marginBottom: '1rem' }}>
                  02. Brand Launch
                </div>
                <h3 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '1rem' }}>
                  Go live in weeks, not months
                </h3>
                <p style={{ lineHeight: 1.6, marginBottom: '1rem' }}>
                  Use our operational base and market connections to launch your brand from concept to revenue in weeks. We handle infrastructure, activation and operations so you can focus on product.
                </p>
                <ul style={{ lineHeight: 1.8 }}>
                  <li>✓ Cloud kitchen and operational setup</li>
                  <li>✓ Delivery platform activation (GrabFood, Foodpanda, Lineman)</li>
                  <li>✓ Local team and day-to-day operations</li>
                  <li>✓ Real revenue from week one</li>
                </ul>
              </div>
            </div>

            {/* F&B Operations */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--accent)', letterSpacing: '0.05em', marginBottom: '1rem' }}>
                  03. F&B Operations
                </div>
                <h3 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '1rem' }}>
                  End-to-end kitchen and delivery management
                </h3>
                <p style={{ lineHeight: 1.6, marginBottom: '1rem' }}>
                  Our cloud kitchen is equipped and ready for your concept. We manage production, quality, delivery logistics and platform relationships so you stay focused on brand growth.
                </p>
                <ul style={{ lineHeight: 1.8 }}>
                  <li>✓ Production-ready cloud kitchen</li>
                  <li>✓ Menu localization and adaptation</li>
                  <li>✓ Delivery logistics and fulfillment</li>
                  <li>✓ Quality control and customer experience</li>
                </ul>
              </div>
              <div style={{ backgroundColor: '#f5f5f5', borderRadius: '12px', padding: '2rem', minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#ccc', fontSize: '3rem', fontWeight: 300 }}>F&B Operations Illustration</span>
              </div>
            </div>

            {/* Scale & Growth */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', alignItems: 'center' }}>
              <div style={{ backgroundColor: '#f5f5f5', borderRadius: '12px', padding: '2rem', minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', order: -1 }}>
                <span style={{ color: '#ccc', fontSize: '3rem', fontWeight: 300 }}>Scale & Growth Illustration</span>
              </div>
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--accent)', letterSpacing: '0.05em', marginBottom: '1rem' }}>
                  04. Scale & Growth
                </div>
                <h3 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '1rem' }}>
                  Expand across Bangkok and Southeast Asia
                </h3>
                <p style={{ lineHeight: 1.6, marginBottom: '1rem' }}>
                  Once validated in Bangkok, we help you scale — additional locations, new platforms, and expansion into neighbouring SEA markets with the same operational rigor.
                </p>
                <ul style={{ lineHeight: 1.8 }}>
                  <li>✓ Multi-location operations</li>
                  <li>✓ Regional expansion strategy</li>
                  <li>✓ Platform and channel optimization</li>
                  <li>✓ Southeast Asia market entry</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="section" style={{ backgroundColor: 'var(--surface)' }}>
        <div className="container">
          <h2 style={{ marginBottom: '3rem', textAlign: 'center' }}>How It Works</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
            <div style={{ padding: '2rem', backgroundColor: '#fff', borderRadius: '12px' }}>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent)', marginBottom: '1rem' }}>1</div>
              <h3 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Discovery Call</h3>
              <p style={{ fontSize: '0.95rem', color: '#666' }}>
                We learn about your brand, goals and timeline. You understand our operating model and infrastructure.
              </p>
            </div>
            <div style={{ padding: '2rem', backgroundColor: '#fff', borderRadius: '12px' }}>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent)', marginBottom: '1rem' }}>2</div>
              <h3 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Partnership Agreement</h3>
              <p style={{ fontSize: '0.95rem', color: '#666' }}>
                We structure the partnership around your needs — fixed fee, performance-based, revenue share or equity.
              </p>
            </div>
            <div style={{ padding: '2rem', backgroundColor: '#fff', borderRadius: '12px' }}>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent)', marginBottom: '1rem' }}>3</div>
              <h3 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Operational Setup</h3>
              <p style={{ fontSize: '0.95rem', color: '#666' }}>
                Our team integrates your brand into our infrastructure — kitchen, team, platforms, customer experience.
              </p>
            </div>
            <div style={{ padding: '2rem', backgroundColor: '#fff', borderRadius: '12px' }}>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent)', marginBottom: '1rem' }}>4</div>
              <h3 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Launch & Grow</h3>
              <p style={{ fontSize: '0.95rem', color: '#666' }}>
                Go live with real sales. We manage operations while you focus on product and brand growth.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-banner section" style={{ backgroundColor: 'var(--accent-dark)', color: 'white' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h2>Ready to launch your brand in Thailand?</h2>
          <a href="https://calendly.com/ncglobalassets/intro" target="_blank" rel="noopener" className="btn btn--primary">
            Schedule a Consultation →
          </a>
        </div>
      </section>
    </>
  )
}
