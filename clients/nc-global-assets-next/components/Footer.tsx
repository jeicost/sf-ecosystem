'use client'

import { useState } from 'react'
import { guardarLead } from '@/lib/lead'
import Link from 'next/link'
import { Arrow, LinkedInIcon, CALENDLY_URL} from '@/lib/constants'

const CONFIG = {
  calendlyUrl: CALENDLY_URL,
  phone: '+66825366653',
  phoneDisplay: '082 536 6653',
  email: 'contact@ncglobalassets.com',
}

export function Footer() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleSub = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.includes('@')) {
      setErrorMsg('Please enter a valid email address.')
      setStatus('error')
      return
    }
    setStatus('sending')
    try {
      const res = await fetch('https://formsubmit.co/ajax/contact@ncglobalassets.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          email,
          _subject: `Newsletter signup — ${email}`,
          _template: 'table',
          source: 'Footer newsletter (Stay up to date)',
        }),
      })
      // FormSubmit responde HTTP 200 con success:"false" cuando rechaza, así que
      // `|| res.ok` convertía cada rechazo en un «You're on the list» y el correo
      // se perdía sin dejar rastro (auditoría 20-ago-2026).
      const data = (await res.json().catch(() => null)) as { success?: string | boolean } | null
      const avisado = data?.success === true || data?.success === 'true'
      // El aviso es best-effort; el destino real del dato es la base.
      const guardado = await guardarLead({ source: 'newsletter', email, locale: 'en', notified: avisado })
      if (guardado || avisado) {
        setStatus('done')
      } else {
        setErrorMsg(`Something went wrong. Email us directly at ${CONFIG.email}`)
        setStatus('error')
      }
    } catch {
      setErrorMsg(`Something went wrong. Email us directly at ${CONFIG.email}`)
      setStatus('error')
    }
  }

  return (
    <footer className="footer">
      <div className="footer-accent-bar" />
      <div className="container">
        <div className="footer-newsletter">
          <div className="footer-newsletter__copy">
            <h3>Stay up to date</h3>
            <p>Market insights, brand stories and updates from Bangkok.</p>
          </div>
          {status === 'done' ? (
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--accent)' }}>✓ You're on the list.</p>
          ) : (
            <div>
              <form className="footer-newsletter__form" onSubmit={handleSub}>
                <input className="footer-newsletter__input" type="email" placeholder="your@brand.com" value={email} onChange={e => setEmail(e.target.value)} />
                <button type="submit" className="footer-newsletter__btn" disabled={status === 'sending'}>
                  {status === 'sending' ? 'Subscribing…' : <>Subscribe <Arrow size={12} /></>}
                </button>
              </form>
              {status === 'error' && (
                <p style={{ fontSize: 12, color: 'var(--accent)', marginTop: 8 }}>{errorMsg}</p>
              )}
            </div>
          )}
        </div>
        <div className="footer-grid">
          <div>
            <div className="footer-logo">
              <img src="/assets/logo-gold.jpg" alt="NC Global Assets" onError={e => (e.target as HTMLImageElement).style.display='none'} />
            </div>
            <p className="footer-brand__desc">
              A local operating partner helping international brands enter and grow in Thailand.
            </p>
            <div className="footer-social">
              <a href="https://linkedin.com/company/ncglobalassets" target="_blank" rel="noopener" className="footer-social__link" aria-label="LinkedIn">
                <LinkedInIcon size={15} />
              </a>
            </div>
          </div>
          <div>
            <div className="footer-col-label">Contact</div>
            <div className="footer-links">
              <a href={CONFIG.calendlyUrl} target="_blank" rel="noopener">Book a Call</a>
              <Link href="/contact">Contact Us</Link>
            </div>
          </div>
          <div>
            <div className="footer-col-label">Office</div>
            <div className="footer-links">
              <span>507/10 Sathu Pradit Rd</span>
              <span>Chong Nonsi, Yan Nawa</span>
              <span>Bangkok 10120, Thailand</span>
              <a href={`tel:${CONFIG.phone}`} style={{ marginTop: 8, color: 'var(--accent)' }}>{CONFIG.phoneDisplay}</a>
              <a href={`mailto:${CONFIG.email}`} style={{ color: 'var(--accent)' }}>{CONFIG.email}</a>
              <span style={{ marginTop: 6, fontSize: 12, color: 'var(--muted)' }}>Mon–Sat · 10:00–18:00 (ICT)</span>
            </div>
          </div>
          <div>
            <div className="footer-col-label">Navigation</div>
            <div className="footer-links">
              <Link href="/">Home</Link>
              <Link href="/about">About Us</Link>
              <Link href="/services">Services</Link>
              <Link href="/contact">Contact</Link>
            </div>
          </div>
        </div>
        <div className="footer-copy">
          <span>© 2026 NC Global Assets</span>
          <span>Bangkok · 13.7563°N 100.5018°E</span>
        </div>
      </div>
    </footer>
  )
}
