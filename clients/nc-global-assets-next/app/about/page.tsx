import type { Metadata } from 'next'

const DOMAIN = 'https://www.ncglobalassets.com'

export const metadata: Metadata = {
  title: 'About — NC Global Assets',
  description: 'Learn about NC Global Assets, our team, values, and how we help international brands launch successfully in Bangkok and Thailand.',
  alternates: { canonical: '/about' },
  openGraph: {
    type: 'website',
    url: `${DOMAIN}/about`,
    title: 'About NC Global Assets',
    description: 'Local operating partner for brands entering Thailand',
  },
}

export default function About() {
  return (
    <>
      {/* Hero */}
      <section className="hero" style={{ minHeight: '40vh' }}>
        <div className="hero-content container">
          <h1 className="hero-headline">
            <span className="line">Built from the ground up</span>
            <span className="line">in <span className="gold italic">Bangkok.</span></span>
          </h1>
        </div>
      </section>

      {/* Story */}
      <section className="about-story section">
        <div className="container">
          <div className="about-story__grid">
            <div className="about-story__text">
              <h2 style={{ marginBottom: '1rem' }}>Our Story</h2>
              <p className="lede" style={{ marginBottom: '2rem' }}>
                NC Global Assets was founded by entrepreneurs who understood firsthand how hard it is to bring an international brand into a new market — especially one as dynamic and nuanced as Thailand.
              </p>
              <p style={{ marginBottom: '1rem' }}>
                We saw brilliant brands fail not because their product was wrong, but because they tried to build everything from scratch, alone, without local knowledge or operational infrastructure. We decided to build that infrastructure ourselves.
              </p>
              <p>
                Today, our Bangkok building — with its cloud kitchen, offices and showroom — is the operational base from which we help international brands test, launch and grow across Thailand and Southeast Asia. Not as consultants. As partners with skin in the game.
              </p>
            </div>
            <div className="about-story__visual">
              <img src="/assets-placeholder.jpg" alt="NC Global Assets Bangkok operations" style={{ width: '100%', borderRadius: '12px' }} />
              <div style={{ marginTop: '2rem', padding: '1.5rem', backgroundColor: 'var(--surface)', borderRadius: '12px' }}>
                <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--accent)' }}>2+</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Years operating in Bangkok</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="section">
        <div className="container">
          <h2 style={{ marginBottom: '3rem' }}>Our Values</h2>
          <div className="values-grid">
            <div className="value-card">
              <h3>Real Skin in the Game</h3>
              <p>We're not advisors. We share the upside and downside of your launch. Your success is our success.</p>
            </div>
            <div className="value-card">
              <h3>Local Expertise + Global Perspective</h3>
              <p>Deep Thailand knowledge combined with international brand experience. The best of both worlds.</p>
            </div>
            <div className="value-card">
              <h3>Execution First</h3>
              <p>We move fast. Talk less, build more. Real revenue from day one, not roadmaps in 18 months.</p>
            </div>
            <div className="value-card">
              <h3>Long-Term Partner</h3>
              <p>We invest in your growth across Thailand and Southeast Asia. Think in years, not campaigns.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="section">
        <div className="container">
          <h2 style={{ marginBottom: '2rem' }}>Our Team</h2>
          <p className="lede" style={{ marginBottom: '3rem', maxWidth: '700px' }}>
            The NC Global Assets team brings 15+ years of combined experience in brand launches, F&B operations, and Southeast Asian market entry across tech, hospitality, and FMCG sectors.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '120px', height: '120px', margin: '0 auto 1rem', backgroundColor: '#ddd', borderRadius: '50%' }} />
              <h3>Nirada</h3>
              <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Founder & Operating Partner</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '120px', height: '120px', margin: '0 auto 1rem', backgroundColor: '#ddd', borderRadius: '50%' }} />
              <h3>Operations Lead</h3>
              <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Cloud Kitchen & Logistics</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '120px', height: '120px', margin: '0 auto 1rem', backgroundColor: '#ddd', borderRadius: '50%' }} />
              <h3>Market Development</h3>
              <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Platform & Growth</p>
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
