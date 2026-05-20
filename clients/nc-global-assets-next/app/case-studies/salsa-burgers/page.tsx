import type { Metadata } from 'next'

const DOMAIN = 'https://www.ncglobalassets.com'

export const metadata: Metadata = {
  title: 'Salsa Burgers Case Study — NC Global Assets',
  description: 'How Salsa Burgers launched in Bangkok in 12 days using NC Global Assets infrastructure and delivery platform partnerships.',
  alternates: { canonical: '/case-studies/salsa-burgers' },
  openGraph: {
    type: 'article',
    url: `${DOMAIN}/case-studies/salsa-burgers`,
    title: 'Salsa Burgers — Launched in 12 Days',
    description: 'From brand brief to first delivery order in under two weeks using our Bangkok operations.',
  },
}

export default function SalsaBurgersCaseStudy() {
  return (
    <>
      {/* Hero */}
      <section className="hero" style={{ minHeight: '40vh' }}>
        <div className="hero-content container">
          <h1 className="hero-headline">
            <span className="line">Salsa Burgers</span>
            <span className="line">Launched in <span className="gold italic">12 days</span></span>
          </h1>
        </div>
      </section>

      {/* Case Study Content */}
      <section className="section">
        <div className="container" style={{ maxWidth: '800px' }}>
          {/* Overview */}
          <div style={{ marginBottom: '4rem' }}>
            <h2 style={{ marginBottom: '1rem' }}>The Challenge</h2>
            <p style={{ lineHeight: 1.8, marginBottom: '1rem', fontSize: '1.1rem' }}>
              Salsa Burgers is a craft burger concept with a clear product vision and an ambitious founder. The team wanted to test the Bangkok market and validate demand for their concept before considering a full regional expansion.
            </p>
            <p style={{ lineHeight: 1.8, fontSize: '1.1rem', color: '#666' }}>
              The traditional path would take months: finding a kitchen, hiring local staff, navigating regulatory requirements, activating delivery platforms. Salsa needed to move fast.
            </p>
          </div>

          {/* Key Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', marginBottom: '4rem', padding: '2rem', backgroundColor: 'var(--surface)', borderRadius: '12px' }}>
            <div>
              <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--accent)', marginBottom: '0.5rem' }}>12</div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#666', textTransform: 'uppercase' }}>Days to Launch</div>
            </div>
            <div>
              <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--accent)', marginBottom: '0.5rem' }}>3</div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#666', textTransform: 'uppercase' }}>Delivery Platforms</div>
            </div>
            <div>
              <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--accent)', marginBottom: '0.5rem' }}>100+</div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#666', textTransform: 'uppercase' }}>Orders Week 1</div>
            </div>
            <div>
              <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--accent)', marginBottom: '0.5rem' }}>4.8★</div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#666', textTransform: 'uppercase' }}>Customer Rating</div>
            </div>
          </div>

          {/* Solution */}
          <div style={{ marginBottom: '4rem' }}>
            <h2 style={{ marginBottom: '1rem' }}>The Solution</h2>
            <p style={{ lineHeight: 1.8, marginBottom: '2rem', fontSize: '1.1rem' }}>
              NC Global's operating model gave Salsa everything they needed to launch immediately:
            </p>
            <div style={{ display: 'grid', gap: '1.5rem' }}>
              <div style={{ paddingBottom: '1.5rem', borderBottom: '1px solid #e0e0e0' }}>
                <h3 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Production-Ready Kitchen</h3>
                <p style={{ color: '#666', lineHeight: 1.6 }}>
                  Instead of building from scratch, Salsa walked into a fully equipped cloud kitchen already connected to delivery platforms and suppliers.
                </p>
              </div>
              <div style={{ paddingBottom: '1.5rem', borderBottom: '1px solid #e0e0e0' }}>
                <h3 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Instant Platform Activation</h3>
                <p style={{ color: '#666', lineHeight: 1.6 }}>
                  We activated Salsa on GrabFood, Foodpanda and Lineman within days. The relationships, account setup and logistics were already in place.
                </p>
              </div>
              <div style={{ paddingBottom: '1.5rem', borderBottom: '1px solid #e0e0e0' }}>
                <h3 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Local Operational Team</h3>
                <p style={{ color: '#666', lineHeight: 1.6 }}>
                  Day one, Salsa had a dedicated local team managing production, customer service and day-to-day execution. They focused entirely on product.
                </p>
              </div>
              <div>
                <h3 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Zero Setup Risk</h3>
                <p style={{ color: '#666', lineHeight: 1.6 }}>
                  No company registration, no long-term lease, no infrastructure investment. They could focus 100% on market validation and product refinement.
                </p>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div style={{ marginBottom: '4rem' }}>
            <h2 style={{ marginBottom: '2rem' }}>The Timeline</h2>
            <div style={{ display: 'grid', gap: '2rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '2rem', paddingBottom: '2rem', borderBottom: '1px solid #e0e0e0' }}>
                <div style={{ fontWeight: 700, color: 'var(--accent)' }}>Day 1</div>
                <div>
                  <h4 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Brand Brief & Kitchen Setup</h4>
                  <p style={{ color: '#666', fontSize: '0.95rem' }}>Founder presents concept. We allocate kitchen space and introduce the supplier network.</p>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '2rem', paddingBottom: '2rem', borderBottom: '1px solid #e0e0e0' }}>
                <div style={{ fontWeight: 700, color: 'var(--accent)' }}>Days 2–5</div>
                <div>
                  <h4 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Menu Localization & Trial Runs</h4>
                  <p style={{ color: '#666', fontSize: '0.95rem' }}>Recipe adaptation to Thai palate. Ingredient sourcing and production testing with our kitchen team.</p>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '2rem', paddingBottom: '2rem', borderBottom: '1px solid #e0e0e0' }}>
                <div style={{ fontWeight: 700, color: 'var(--accent)' }}>Days 6–8</div>
                <div>
                  <h4 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Platform Activation</h4>
                  <p style={{ color: '#666', fontSize: '0.95rem' }}>GrabFood, Foodpanda and Lineman accounts live. Photos, menu pricing and delivery parameters configured.</p>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '2rem' }}>
                <div style={{ fontWeight: 700, color: 'var(--accent)' }}>Day 12</div>
                <div>
                  <h4 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>First Orders Live</h4>
                  <p style={{ color: '#666', fontSize: '0.95rem' }}>100+ orders in the first week. Real customer feedback flowing back. Product validation underway.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Results */}
          <div style={{ marginBottom: '4rem' }}>
            <h2 style={{ marginBottom: '1rem' }}>Results</h2>
            <div style={{ padding: '2rem', backgroundColor: 'var(--surface)', borderRadius: '12px', marginBottom: '2rem' }}>
              <p style={{ fontSize: '1.1rem', fontStyle: 'italic', lineHeight: 1.8, color: '#333' }}>
                "We went from brief to live on GrabFood in under two weeks. NC Global gave us the kitchen, the team and the delivery activation. We focused entirely on the product. Real orders from day one."
              </p>
              <p style={{ marginTop: '1rem', fontWeight: 600, color: '#666' }}>
                — Carlos Jacoste, Founder, Salsa Burgers
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
              <div>
                <h4 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Market Validation</h4>
                <p style={{ color: '#666', fontSize: '0.95rem', lineHeight: 1.6 }}>
                  Salsa validated the Bangkok burger market. Customer feedback was immediate and actionable. They understood product-market fit in weeks, not months.
                </p>
              </div>
              <div>
                <h4 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Operational Learning</h4>
                <p style={{ color: '#666', fontSize: '0.95rem', lineHeight: 1.6 }}>
                  Working with our team, they learned local operating logistics, customer preferences and platform dynamics — crucial knowledge for any future expansion.
                </p>
              </div>
              <div>
                <h4 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Growth Path</h4>
                <p style={{ color: '#666', fontSize: '0.95rem', lineHeight: 1.6 }}>
                  After proving the concept, Salsa now had a clear path to scaling: multiple locations, regional expansion or attracting investor interest.
                </p>
              </div>
            </div>
          </div>

          {/* Takeaway */}
          <div style={{ padding: '2rem', backgroundColor: '#fafaf7', borderRadius: '12px', borderLeft: '4px solid var(--accent)' }}>
            <h3 style={{ fontWeight: 600, marginBottom: '1rem' }}>Key Takeaway</h3>
            <p style={{ lineHeight: 1.8, color: '#333' }}>
              The difference between an idea and a real market test isn't innovation — it's infrastructure and execution. Salsa Burgers had a great product. What they needed was someone to handle the operational complexity so they could focus on getting that product into customers' hands as fast as possible.
            </p>
            <p style={{ lineHeight: 1.8, color: '#333', marginTop: '1rem' }}>
              That's exactly what NC Global does.
            </p>
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
