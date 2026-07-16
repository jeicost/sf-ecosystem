'use client'

import { useState } from 'react'
import { Eyebrow, Arrow } from '@/lib/constants'

export function LeadMagnet() {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !name) return
    setStatus('sending')
    try {
      const res = await fetch('https://formsubmit.co/ajax/contact@ncglobalassets.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          name,
          email,
          _subject: `New checklist request — ${name}`,
          _template: 'table',
          source: 'Bangkok Brand Entry Checklist',
        }),
      })
      const data = await res.json()
      setStatus((data as any).success === 'true' || res.ok ? 'done' : 'error')
    } catch {
      setStatus('error')
    }
  }

  const points = [
    'Market validation checklist before you commit',
    'The 5 setup mistakes foreign brands make in Bangkok',
    'Platform activation guide: GrabFood, Foodpanda & Lineman',
    'Local partner evaluation framework',
    '90-day launch timeline template',
  ]

  return (
    <section className="lm-section" id="checklist">
      <div className="container">
        <div className="lm-grid">
          <div className="lm-left">
            <Eyebrow style={{ color: 'var(--accent)' }}>Free Resource</Eyebrow>
            <h2 className="display-lg" style={{ marginTop: 16 }}>
              The Bangkok<br/>
              <span className="italic gold">Brand Entry</span><br/>
              Checklist.
            </h2>
            <p className="lede" style={{ marginTop: 20 }}>
              Everything you need to validate, plan and launch your brand in Thailand — in a single practical guide. Used internally by every brand we onboard.
            </p>
            <ul className="lm-points">
              {points.map((p, i) => (
                <li key={i}><span className="tick-sm" /><span>{p}</span></li>
              ))}
            </ul>
          </div>
          <div className="lm-right">
            {status === 'done' ? (
              <div className="lm-success">
                <div className="lm-success__icon">✓</div>
                <p className="lm-success__title">You're on the list.</p>
                <p className="lm-success__sub">Check your inbox — we'll send the checklist shortly. Or download it directly below.</p>
                <a href="/downloads/bangkok-brand-entry-checklist.pdf" download style={{ display: 'inline-block', marginTop: 16, fontSize: 13, color: 'var(--accent)', fontFamily: 'var(--font-mono)', textDecoration: 'underline' }}>
                  ↓ Download PDF now
                </a>
              </div>
            ) : (
              <form className="lm-form" onSubmit={handleSubmit} noValidate>
                <p className="lm-form__label">Get the free checklist</p>
                <input
                  className="lm-input"
                  type="text"
                  placeholder="Your first name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  autoComplete="given-name"
                />
                <input
                  className="lm-input"
                  type="email"
                  placeholder="Work email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
                <button
                  type="submit"
                  className="btn btn--primary lm-btn"
                  disabled={status === 'sending'}
                >
                  {status === 'sending' ? 'Sending…' : <>Send me the checklist <Arrow /></>}
                </button>
                {status === 'error' && (
                  <p style={{ fontSize: 12, color: 'var(--accent)', marginTop: 8 }}>
                    Something went wrong. Email us directly at contact@ncglobalassets.com
                  </p>
                )}
                <p className="lm-privacy">No spam. Unsubscribe at any time.</p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
