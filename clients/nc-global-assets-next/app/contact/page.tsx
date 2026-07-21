import type { Metadata } from 'next'
import { Arrow, Calendar, CONFIG, Eyebrow } from '@/lib/constants'
import { ContactForm } from '@/components/ContactForm'
import { loadCmsSections, mergeCms } from '@/lib/cms-pages'

export const metadata: Metadata = {
  title: 'Contact — NC Global Assets',
  description: 'Get in touch to discuss your Thailand expansion. Reach out via phone, email, WhatsApp or LINE. Bangkok-based operating partner.',
  alternates: { canonical: '/contact' },
  openGraph: {
    type: 'website',
    url: 'https://www.ncglobalassets.com/contact',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630 }],
  },
}

const HERO_DEFAULTS = {
  eyebrow: 'Get in touch',
  headline_top: "Let's build your",
  headline_gold: 'Thailand growth',
  sub: 'Tell us about your brand, goals, and expansion plans. Our team will get back to you shortly with clear next steps.',
}

const ADDRESS = '507/10 Sathu Pradit Rd, Chong Nonsi, Yan Nawa, Bangkok 10120, Thailand'
const HOURS = 'Mon–Sat · 10:00–18:00 (ICT)'

export default function ContactPage() {
  const cms = loadCmsSections('contact')
  const hero = mergeCms(HERO_DEFAULTS, cms['hero']?.data)

  return (
    <>
      {/* Hero split — ported from App.jsx ContactPage (L1842-1975) */}
      <section className="page-hero">
        <div className="container">
          <div className="page-hero__inner">
            <div>
              <Eyebrow style={{ color: 'var(--accent)' }}>{hero.eyebrow}</Eyebrow>
              <h1 className="page-hero__headline">
                {hero.headline_top}<br/>
                <span className="italic gold">{hero.headline_gold}</span>
              </h1>
              <p className="page-hero__sub">{hero.sub}</p>
            </div>
            <div className="page-hero__divider" />
            <div className="page-hero__right">
              <div className="contact-direct">
                <a href={`tel:${CONFIG.phone}`} className="contact-direct__item">
                  <span className="contact-direct__icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.5 10.91 19.79 19.79 0 01.46 2.28 2 2 0 012.44.1h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.18 6.18l.91-.91a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 15.42v1.5z"/></svg>
                  </span>
                  <div>
                    <div className="contact-direct__label">Phone</div>
                    <div className="contact-direct__val">{CONFIG.phoneDisplay}</div>
                  </div>
                </a>
                <a href={`mailto:${CONFIG.email}`} className="contact-direct__item">
                  <span className="contact-direct__icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>
                  </span>
                  <div>
                    <div className="contact-direct__label">Email</div>
                    <div className="contact-direct__val">{CONFIG.email}</div>
                  </div>
                </a>
                <div className="contact-direct__item contact-direct__item--text">
                  <span className="contact-direct__icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                  </span>
                  <div>
                    <div className="contact-direct__label">Office Hours</div>
                    <div className="contact-direct__val">{HOURS}</div>
                  </div>
                </div>
                <div className="contact-direct__item contact-direct__item--text">
                  <span className="contact-direct__icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  </span>
                  <div>
                    <div className="contact-direct__label">Office</div>
                    <div className="contact-direct__val" style={{ fontSize: 14 }}>{ADDRESS}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Form section with sidebar */}
      <section className="contact-form-section">
        <div className="container">
          <div className="contact-form-grid">
            <div className="contact-form-aside">
              <p className="contact-form-aside__body">
                Fill in the form and we&apos;ll come back with a clear view of how NC Global Assets can support your brand&apos;s entry into Thailand — infrastructure, timeline and commercial model included.
              </p>
              <div className="contact-trust-items">
                {[
                  'We reply within one business day from Bangkok',
                  'No commitment required for a first conversation',
                  'We work with a limited number of brands per quarter',
                  'English, Spanish and Thai spoken',
                ].map((t, i) => (
                  <div className="contact-trust-item" key={i}>
                    <span className="contact-trust-dot" />
                    {t}
                  </div>
                ))}
              </div>
              <div className="contact-aside-channels">
                <p className="small" style={{ marginBottom: 12, color: 'var(--muted)' }}>Prefer a direct chat?</p>
                <div className="contact-channels-row">
                  <a href={CONFIG.calendlyUrl} target="_blank" rel="noopener" className="contact-channel">
                    <Calendar size={14} /> Book a Call <Arrow size={11} />
                  </a>
                </div>
              </div>
            </div>
            <div>
              <ContactForm embedded />
            </div>
          </div>

          {/* Company info strip */}
          <div className="contact-info-strip">
            <div className="contact-info-item">
              <span className="contact-info-item__label">Address</span>
              <span className="contact-info-item__val">{ADDRESS}</span>
            </div>
            <div className="contact-info-item">
              <span className="contact-info-item__label">Phone</span>
              <a href={`tel:${CONFIG.phone}`} className="contact-info-item__val">{CONFIG.phoneDisplay}</a>
            </div>
            <div className="contact-info-item">
              <span className="contact-info-item__label">Email</span>
              <a href={`mailto:${CONFIG.email}`} className="contact-info-item__val">{CONFIG.email}</a>
            </div>
            <div className="contact-info-item">
              <span className="contact-info-item__label">Office Hours</span>
              <span className="contact-info-item__val">{HOURS}</span>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
