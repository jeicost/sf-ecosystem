'use client'

import { useState } from 'react'
import { Arrow, ChatIcon, Eyebrow, openChat } from '@/lib/constants'
import { guardarLead } from '@/lib/lead'

// Ported from clients/nc-global-assets/src/App.jsx ContactForm (L1332-1426)
export function ContactForm({ embedded }: { embedded?: boolean }) {
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState(false)
  const [form, setForm] = useState({ name: '', company: '', email: '', web: '', country: '', sector: '', looking: '' })
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))
  const valid = Boolean(form.name && form.email.includes('@') && form.company)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setTouched({ name: true, email: true, company: true })
    if (!valid) return
    // La base de datos es el destino; Formspree es el aviso. Antes esto marcaba
    // `submitted` incondicionalmente, sin mirar la respuesta y sin guardar en
    // ninguna parte: un rechazo —o agotar la cuota gratuita de 50 envíos al
    // mes— pintaba «Thank you, {nombre}» y el lead dejaba de existir. Y este es
    // el único camino de conversión que le queda al sitio, porque los CTA de
    // Calendly están caídos (auditoría 20-ago-2026).
    //
    // El aviso va primero porque anon no puede hacer UPDATE: `notified` hay que
    // escribirlo en el propio INSERT o no se escribe nunca.
    let avisado = false
    try {
      const res = await fetch('https://formspree.io/f/xqewnrwl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(form),
        signal: AbortSignal.timeout(8000),
      })
      avisado = res.ok
    } catch { /* el aviso es best-effort */ }

    const { email, ...resto } = form
    const guardado = await guardarLead({
      source: 'contact', email, locale: 'en', payload: resto, notified: avisado,
    })

    // Solo se da las gracias si el dato está en algún sitio recuperable.
    if (guardado || avisado) { setSubmitted(true); return }
    setError(true)
  }

  const formContent = submitted ? (
    <div style={{ textAlign: 'center', paddingBlock: 60 }}>
      <Eyebrow>Message sent</Eyebrow>
      <h2 className="display-lg" style={{ marginTop: 28, marginBottom: 20 }}>
        Thank you, {form.name.split(' ')[0]}.<br/>
        <span className="italic gold">We&apos;ll be in touch shortly.</span>
      </h2>
      <p className="lede">We typically reply within one business day from Bangkok.</p>
      <div style={{ marginTop: 32 }}>
        <button onClick={openChat} className="btn btn--ghost"><ChatIcon /> Continue the conversation <Arrow /></button>
      </div>
    </div>
  ) : (
    <form onSubmit={submit} className="simple-form">
      <div className="simple-form__row">
        <div className="simple-form__field">
          <label className="simple-form__label">Full Name <span className="simple-form__req">*</span></label>
          <input className="simple-form__input" placeholder="e.g. María García" value={form.name}
            onChange={(e) => update('name', e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, name: true }))} />
          {touched.name && !form.name && <span className="simple-form__error">Please enter your name</span>}
        </div>
        <div className="simple-form__field">
          <label className="simple-form__label">Email <span className="simple-form__req">*</span></label>
          <input className="simple-form__input" type="email" placeholder="you@brand.com" value={form.email}
            onChange={(e) => update('email', e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, email: true }))} />
          {touched.email && !form.email.includes('@') && <span className="simple-form__error">Please enter a valid email</span>}
        </div>
      </div>
      <div className="simple-form__row">
        <div className="simple-form__field">
          <label className="simple-form__label">Brand / Company <span className="simple-form__req">*</span></label>
          <input className="simple-form__input" placeholder="Your brand or company name" value={form.company}
            onChange={(e) => update('company', e.target.value)} />
        </div>
        <div className="simple-form__field">
          <label className="simple-form__label">Country</label>
          <input className="simple-form__input" placeholder="Where are you based?" value={form.country}
            onChange={(e) => update('country', e.target.value)} />
        </div>
      </div>
      <div className="simple-form__field">
        <label className="simple-form__label">What brings you to Thailand?</label>
        <div className="simple-form__options">
          {['Test my brand in Thailand', 'Find local partners', 'Launch operations', 'Explore F&B market entry', 'Other'].map((opt) => (
            <button type="button" key={opt}
              className={`simple-form__option${form.looking === opt ? ' active' : ''}`}
              onClick={() => update('looking', opt)}>
              {opt}
            </button>
          ))}
        </div>
      </div>
      <div className="simple-form__field">
        <label className="simple-form__label">Anything else you&apos;d like to share? <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(optional)</span></label>
        <textarea className="simple-form__input simple-form__textarea"
          placeholder="Tell us about your brand, goals or timeline…"
          value={form.web} onChange={(e) => update('web', e.target.value)} rows={3} />
      </div>
      {error && (
        <p role="alert" style={{ color: '#c0392b', fontSize: 14, lineHeight: 1.6, marginTop: 8 }}>
          We couldn&apos;t send your message. Please email us at{' '}
          <a href="mailto:contact@ncglobalassets.com" style={{ textDecoration: 'underline' }}>contact@ncglobalassets.com</a>
          {' '}and we&apos;ll get back to you.
        </p>
      )}
      <div className="simple-form__footer">
        <p className="simple-form__legal">We never share your details. You&apos;ll hear from us within 24h.</p>
        <button type="submit" className="btn btn--primary btn--lg" disabled={!valid}
          style={!valid ? { opacity: 0.4, cursor: 'not-allowed' } : {}}>
          Send Message <Arrow />
        </button>
      </div>
    </form>
  )

  if (embedded) return formContent
  return (
    <section className="section" id="contact">
      <div className="container">{formContent}</div>
    </section>
  )
}
