export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="hero" id="top">
        <div className="hero-bg" style={{ backgroundImage: "url(/hero-bkk.webp), url(/hero-bangkok.webp)" }} />
        <div className="hero-content container">
          <div className="hero-eyebrow-row">
            <span className="eyebrow" style={{ color: 'var(--accent)' }}>Bangkok · Local Operating Partner</span>
            <span className="rule" />
          </div>
          <h1 className="hero-headline">
            <span className="line">Enter Thailand.</span>
            <span className="line">Skip the <span className="gold italic">hard part.</span></span>
            <span className="line gold italic">Your brand live in weeks.</span>
          </h1>
          <h2 style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', overflow: 'hidden' }}>
            Premium Real Estate &amp; Investment Management in Bangkok
          </h2>
          <div className="hero-body">
            <div className="hero-lede-col">
              <p className="lede">
                We give international brands the infrastructure, the local team and the operational base to enter Thailand. No setup from scratch. Real revenue from day one.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Intro Section */}
      <section className="intro section">
        <div className="container">
          <h2>Why NC Global Assets</h2>
          <p className="lede">
            We're not consultants. We're operators with real infrastructure in Bangkok—cloud kitchen, offices, showroom—ready to serve your brand's launch day one.
          </p>
          <div className="intro-grid">
            <div className="intro-card">
              <h3>Real Infrastructure</h3>
              <p>Cloud kitchen, offices, and showroom ready for your brand's operations on day one.</p>
            </div>
            <div className="intro-card">
              <h3>Local Expertise</h3>
              <p>Deep understanding of Thai market dynamics, consumer behavior, and regulatory environment.</p>
            </div>
            <div className="intro-card">
              <h3>Hands-On Execution</h3>
              <p>We manage every aspect of your launch—supply chain, operations, customer experience.</p>
            </div>
            <div className="intro-card">
              <h3>Growth Partner</h3>
              <p>Our success is tied to yours. We're invested in your long-term growth across Southeast Asia.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="services-preview section">
        <div className="container">
          <h2>What We Do</h2>
          <div className="services-grid">
            <div className="service-item">
              <h3>Market Entry</h3>
              <p>Validate your product in Bangkok, understand local demand, optimize pricing and positioning.</p>
            </div>
            <div className="service-item">
              <h3>Brand Launch</h3>
              <p>Go from concept to live revenue in weeks using our operational base and market connections.</p>
            </div>
            <div className="service-item">
              <h3>F&B Operations</h3>
              <p>Cloud kitchen, delivery platform setup, menu optimization, and full operational management.</p>
            </div>
            <div className="service-item">
              <h3>Scale & Growth</h3>
              <p>Expand across delivery platforms, launch additional locations, enter new markets in SEA.</p>
            </div>
          </div>
          <div style={{ textAlign: 'center', marginTop: '3rem' }}>
            <a href="/services" className="btn btn--primary">
              Explore All Services →
            </a>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-banner section" style={{ backgroundColor: 'var(--accent-dark)', color: 'white' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h2>Ready to test your brand in Bangkok?</h2>
          <p className="lede" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
            Let's talk about how NC Global Assets can help you launch successfully.
          </p>
          <a href="https://calendly.com/ncglobalassets/intro" target="_blank" rel="noopener" className="btn btn--primary">
            Schedule a Call →
          </a>
        </div>
      </section>

      {/* Case Study Preview */}
      <section className="section">
        <div className="container">
          <h2 style={{ marginBottom: '2rem' }}>Featured Case Study</h2>
          <div className="case-study-card">
            <h3>Salsa Burgers — Launched in 12 Days</h3>
            <p>From brand brief to first delivery order in under two weeks using our Bangkok operations and platform partnerships.</p>
            <a href="/case-studies/salsa-burgers" className="btn btn--ghost">
              Read Case Study →
            </a>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="faq section">
        <div className="container">
          <h2>Frequently Asked Questions</h2>
          <div className="faq-grid">
            <details className="faq-item">
              <summary>What markets do you focus on?</summary>
              <p>We focus exclusively on Thailand, with Bangkok as our primary operating base. From Bangkok, brands can build a foundation for wider Southeast Asian expansion.</p>
            </details>
            <details className="faq-item">
              <summary>How long does a launch typically take?</summary>
              <p>A focused market test can be set up in 4-8 weeks. A full market launch typically takes 3-6 months depending on product complexity.</p>
            </details>
            <details className="faq-item">
              <summary>Do you only work with F&B brands?</summary>
              <p>F&B is our strongest vertical, but we work with selected brands across lifestyle, sustainability, and digital platforms.</p>
            </details>
            <details className="faq-item">
              <summary>How do I get started?</summary>
              <p>Book a call or contact us. We'll review your brand, understand your goals, and outline how we can support your Thailand entry.</p>
            </details>
          </div>
        </div>
      </section>
    </>
  )
}
