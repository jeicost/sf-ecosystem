'use client'
import React from 'react'

const PORTAL_URL = 'https://mira.startupsfactory.es/login'

export default function ThankYou() {
  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 50% 60% at 50% 40%, rgba(124,58,237,0.18) 0%, transparent 65%)', pointerEvents: 'none' }} />
      <div style={{ position: 'relative', maxWidth: 540, textAlign: 'center' }}>
        {/* MIRA logo */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 40 }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', border: '1px solid rgba(124,58,237,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 40px rgba(124,58,237,0.25)' }}>
            <svg width="44" height="44" viewBox="0 0 100 100" fill="none">
              <path d="M16,82 L16,26 C16,12 24,10 35,10 C46,10 55,24 50,42 C40,56 40,66 50,72" stroke="#f4f4f8" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              <path d="M84,82 L84,26 C84,12 76,10 65,10 C54,10 45,24 50,42 C60,56 60,66 50,72" stroke="#f4f4f8" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              <circle cx="50" cy="57" r="2.2" fill="#7c3aed"/>
            </svg>
          </div>
        </div>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 16px', borderRadius: 100, border: '1px solid rgba(16,185,129,0.35)', background: 'rgba(16,185,129,0.08)', marginBottom: 28 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981' }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: '#10B981', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Request received</span>
        </div>

        <h1 style={{ fontSize: 'clamp(36px,7vw,64px)', fontWeight: 800, letterSpacing: '-0.05em', lineHeight: 1.0, marginBottom: 20 }}>
          Your AI team<br />
          <span style={{ background: 'linear-gradient(135deg,#a78bfa 0%,#7c3aed 50%,#c4b5fd 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>is getting ready.</span>
        </h1>

        <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.4)', lineHeight: 1.65, marginBottom: 48 }}>
          We'll reach out within 24 hours to get your Brand Brain configured and your agents operational.
        </p>

        {/* Next steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 48, textAlign: 'left' }}>
          {[
            { n: '01', title: 'Check your inbox', desc: "We'll send a confirmation + a short Brand Brain form within the hour." },
            { n: '02', title: 'Brand Brain setup', desc: 'Fill in your brand docs or jump on a 20-min async form. MIRA maps everything automatically.' },
            { n: '03', title: 'Your team goes live', desc: 'Marketing agents operational in 24h. Full Stack in 48h. No technical setup required.' },
          ].map((step, i) => (
            <div key={i} style={{ padding: '20px 24px', borderRadius: 12, background: i === 0 ? 'rgba(124,58,237,0.07)' : 'rgba(255,255,255,0.02)', border: i === 0 ? '1px solid rgba(124,58,237,0.2)' : '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.1em', flexShrink: 0, paddingTop: 2 }}>{step.n}</span>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#f4f4f8', marginBottom: 4 }}>{step.title}</p>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.55 }}>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <a href={PORTAL_URL} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 32px', borderRadius: 12, fontWeight: 700, fontSize: 15, textDecoration: 'none', color: '#fff', background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', boxShadow: '0 0 32px rgba(124,58,237,0.4)' }}>
          Sign in to your portal →
        </a>

        <p style={{ marginTop: 20, fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>
          Questions? Reply to the confirmation email.
        </p>
      </div>
    </main>
  )
}
