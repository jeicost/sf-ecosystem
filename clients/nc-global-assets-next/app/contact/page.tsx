import type { Metadata } from 'next'

const DOMAIN = 'https://www.ncglobalassets.com'

export const metadata: Metadata = {
  title: 'Contact — NC Global Assets',
  description: 'Get in touch with NC Global Assets. We reply from Bangkok within 24 hours. Book a call, send a message or chat with our team.',
  alternates: { canonical: '/contact' },
  openGraph: {
    type: 'website',
    url: `${DOMAIN}/contact`,
    title: 'Contact — NC Global Assets',
    description: 'Reach out to discuss how we can help your brand enter Thailand.',
  },
}

export default function Contact() {
  return (
    <>
      {/* Hero */}
      <section className="hero" style={{ minHeight: '40vh' }}>
        <div className="hero-content container">
          <h1 className="hero-headline">
            <span className="line">Let's talk</span>
            <span className="line">about your <span className="gold italic">brand</span></span>
          </h1>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="section">
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '3rem', marginBottom: '4rem' }}>
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--accent)', letterSpacing: '0.05em', marginBottom: '1rem', textTransform: 'uppercase' }}>
                Quick Call
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>Book a consultation</h3>
              <p style={{ marginBottom: '1.5rem', lineHeight: 1.6 }}>
                We review your brand, understand your goals and outline how we can support your Thailand entry. 30 minutes.
              </p>
              <a href="https://calendly.com/ncglobalassets/intro" target="_blank" rel="noopener" className="btn btn--primary">
                Book via Calendly →
              </a>
            </div>

            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--accent)', letterSpacing: '0.05em', marginBottom: '1rem', textTransform: 'uppercase' }}>
                Send Message
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>Use the form below</h3>
              <p style={{ marginBottom: '1.5rem', lineHeight: 1.6 }}>
                Tell us about your brand and what you're looking to achieve. We'll get back to you within 24 hours from Bangkok.
              </p>
              <a href="#form" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>
                Jump to form ↓
              </a>
            </div>

            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--accent)', letterSpacing: '0.05em', marginBottom: '1rem', textTransform: 'uppercase' }}>
                Direct Contact
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>Get in touch</h3>
              <div style={{ lineHeight: 2 }}>
                <p style={{ marginBottom: '0.5rem' }}>
                  <strong>Email:</strong> contact@ncglobalassets.com
                </p>
                <p style={{ marginBottom: '0.5rem' }}>
                  <strong>Phone:</strong> +66 82 536 6653
                </p>
                <p>
                  <strong>Hours:</strong> Mon–Sat, 10:00–18:00 (ICT)
                </p>
              </div>
            </div>
          </div>

          <hr style={{ margin: '3rem 0' }} />

          {/* Contact Form */}
          <div id="form">
            <h2 style={{ marginBottom: '2rem' }}>Tell us about your brand</h2>
            <form style={{ maxWidth: '600px' }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  placeholder="Your name"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    fontFamily: 'inherit',
                    fontSize: '1rem',
                  }}
                  required
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
                  Email *
                </label>
                <input
                  type="email"
                  placeholder="you@brand.com"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    fontFamily: 'inherit',
                    fontSize: '1rem',
                  }}
                  required
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
                  Brand / Company *
                </label>
                <input
                  type="text"
                  placeholder="Your brand name"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    fontFamily: 'inherit',
                    fontSize: '1rem',
                  }}
                  required
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
                  Country / Based in
                </label>
                <input
                  type="text"
                  placeholder="Where are you based?"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    fontFamily: 'inherit',
                    fontSize: '1rem',
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
                  What brings you to Thailand?
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {['Test my brand in Thailand', 'Launch operations', 'Find local partners', 'Explore F&B market', 'Other'].map((option) => (
                    <label key={option} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                      <input type="radio" name="looking" value={option} style={{ marginRight: '0.5rem' }} />
                      {option}
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
                  Tell us more about your brand (optional)
                </label>
                <textarea
                  placeholder="What's your brand story? What are your goals? Timeline?"
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    fontFamily: 'inherit',
                    fontSize: '1rem',
                    resize: 'vertical',
                  }}
                />
              </div>

              <button
                type="submit"
                style={{
                  display: 'inline-block',
                  backgroundColor: 'var(--accent)',
                  color: 'white',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '8px',
                  border: 'none',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '1rem',
                }}
              >
                Send Message →
              </button>

              <p style={{ fontSize: '0.875rem', color: '#999', marginTop: '1rem' }}>
                We never share your details. You'll hear from us within 24 hours.
              </p>
            </form>
          </div>
        </div>
      </section>

      {/* Office Info */}
      <section className="section" style={{ backgroundColor: 'var(--surface)' }}>
        <div className="container">
          <h2 style={{ marginBottom: '3rem' }}>Our Bangkok Office</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '3rem' }}>
            <div>
              <h3 style={{ fontWeight: 600, marginBottom: '1rem' }}>Address</h3>
              <p style={{ lineHeight: 1.8, color: '#666' }}>
                507/10 Sathu Pradit Road<br />
                Chong Nonsi, Yan Nawa<br />
                Bangkok 10120, Thailand
              </p>
            </div>
            <div>
              <h3 style={{ fontWeight: 600, marginBottom: '1rem' }}>Hours</h3>
              <p style={{ lineHeight: 1.8, color: '#666' }}>
                Monday–Saturday<br />
                10:00–18:00 (ICT)<br />
                <br />
                Closed Sundays & Thai holidays
              </p>
            </div>
            <div>
              <h3 style={{ fontWeight: 600, marginBottom: '1rem' }}>Visit Us</h3>
              <p style={{ lineHeight: 1.8, color: '#666' }}>
                Our building includes a cloud kitchen, offices and showroom. Schedule a tour when you book your call.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
