'use client'

import { useState } from 'react'
import { Eyebrow, Arrow } from '@/lib/constants'
import { LEAD_MAGNET_DEFAULTS } from '@/lib/section-defaults'

export function LeadMagnet({ data = LEAD_MAGNET_DEFAULTS }: { data?: typeof LEAD_MAGNET_DEFAULTS }) {
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
      // Mismo bug que en Footer.tsx: FormSubmit devuelve 200 con success:"false"
      // al rechazar, así que `|| res.ok` daba por bueno todo rechazo y el lead
      // desaparecía en silencio (auditoría 20-ago-2026).
      const data = (await res.json().catch(() => null)) as { success?: string | boolean } | null
      setStatus(data?.success === true || data?.success === 'true' ? 'done' : 'error')
    } catch {
      setStatus('error')
    }
  }

  const points = data.points

  return (
    <section className="lm-section" id="checklist">
      <div className="container">
        <div className="lm-grid">
          <div className="lm-left">
            <Eyebrow style={{ color: 'var(--accent)' }}>{data.eyebrow}</Eyebrow>
            <h2 className="display-lg" style={{ marginTop: 16 }}>
              {data.headline_line1}<br/>
              <span className="italic gold">{data.headline_gold}</span><br/>
              {data.headline_line3}
            </h2>
            <p className="lede" style={{ marginTop: 20 }}>
              {data.lede}
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
                <p className="lm-success__title">{data.success_title}</p>
                <p className="lm-success__sub">{data.success_sub}</p>
                <a href="/downloads/bangkok-brand-entry-checklist.pdf" download style={{ display: 'inline-block', marginTop: 16, fontSize: 13, color: 'var(--accent)', fontFamily: 'var(--font-mono)', textDecoration: 'underline' }}>
                  ↓ Download PDF now
                </a>
              </div>
            ) : (
              <form className="lm-form" onSubmit={handleSubmit} noValidate>
                <p className="lm-form__label">{data.form_label}</p>
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
