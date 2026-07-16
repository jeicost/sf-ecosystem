'use client'

import { Eyebrow, Arrow, Calendar, ChatIcon } from '@/lib/constants'

const CONFIG = {
  calendlyUrl: 'https://calendly.com/nc-global-assets/discover-call',
}

export function FinalCTA() {
  return (
    <div className="dual-cta">
      <div className="dual-cta__ready">
        <div className="dual-cta__ready-bg" style={{ backgroundImage: 'url(/assets/cta-pool.webp)' }} />
        <div className="dual-cta__ready-content">
          <Eyebrow style={{ color: 'rgba(255,255,255,0.5)' }}>Next Step</Eyebrow>
          <h2 className="display-lg" style={{ color: '#fff' }}>
            Your brand<br/>
            Bangkok<br/>
            <span style={{ color: 'var(--accent)', fontStyle: 'italic' }}>Let's build it</span>
          </h2>
          <p className="lede" style={{ color: 'rgba(255,255,255,0.7)', maxWidth: '38ch' }}>
            Book a call with our team. We'll assess your brand and outline exactly how to enter Thailand — infrastructure, timeline and commercial model included.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'flex-start' }}>
            <a href={CONFIG.calendlyUrl} target="_blank" rel="noopener" className="btn btn--primary">
              <Calendar size={14} /> Book a Call <Arrow />
            </a>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)' }}>
                Limited spots per quarter
              </p>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.22)' }}>
                Transparent model · Pricing shared in the first call
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="dual-cta__notready">
        <div className="dual-cta__notready-icon">
          <span style={{ fontSize: 28, opacity: 0.6 }}>→</span>
        </div>
        <Eyebrow>Still exploring?</Eyebrow>
        <h2 className="display-lg">Let's talk<br/><span className="italic gold">before you decide</span></h2>
        <p className="lede">Not sure if Thailand is the right move yet? No pressure. We're happy to have an honest conversation about your brand, your goals and what market entry could realistically look like.</p>
        <div className="dual-cta__btn-row">
          <a href="#" className="btn btn--ghost" onClick={(e) => { e.preventDefault(); window.open('https://chat.ncglobalassets.com') }}>
            <ChatIcon /> Chat with Us <Arrow />
          </a>
          <a href="#contact" className="btn btn--ghost" style={{ borderColor: 'rgba(255,255,255,0.15)' }}>
            Send a Brief <Arrow />
          </a>
        </div>
        <p className="small" style={{ marginTop: 16, color: 'var(--muted)' }}>We reply from Bangkok within 24 hours.</p>
      </div>
    </div>
  )
}
