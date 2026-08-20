'use client'

import { Eyebrow, Arrow, Calendar, ChatIcon } from '@/lib/constants'
import { FINAL_CTA_DEFAULTS } from '@/lib/section-defaults'

const CONFIG = {
  calendlyUrl: 'https://calendly.com/nc-global-assets/discover-call',
}

export function FinalCTA({ data = FINAL_CTA_DEFAULTS }: { data?: typeof FINAL_CTA_DEFAULTS }) {
  return (
    <div className="dual-cta">
      <div className="dual-cta__ready">
        <div className="dual-cta__ready-bg" style={{ backgroundImage: 'url(/assets/cta-pool.webp)' }} />
        <div className="dual-cta__ready-content">
          <Eyebrow style={{ color: 'rgba(255,255,255,0.5)' }}>{data.ready_eyebrow}</Eyebrow>
          <h2 className="display-lg" style={{ color: '#fff' }}>
            {data.ready_headline_line1}<br/>
            {data.ready_headline_line2}<br/>
            <span style={{ color: 'var(--accent)', fontStyle: 'italic' }}>{data.ready_headline_gold}</span>
          </h2>
          <p className="lede" style={{ color: 'rgba(255,255,255,0.7)', maxWidth: '38ch' }}>
            {data.ready_lede}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'flex-start' }}>
            <a href={CONFIG.calendlyUrl} target="_blank" rel="noopener" className="btn btn--primary">
              <Calendar size={14} /> Book a Call <Arrow />
            </a>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)' }}>
                {data.ready_note1}
              </p>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.22)' }}>
                {data.ready_note2}
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="dual-cta__notready">
        <div className="dual-cta__notready-icon">
          <span style={{ fontSize: 28, opacity: 0.6 }}>→</span>
        </div>
        <Eyebrow>{data.notready_eyebrow}</Eyebrow>
        <h2 className="display-lg">{data.notready_headline_top}<br/><span className="italic gold">{data.notready_headline_gold}</span></h2>
        <p className="lede">{data.notready_lede}</p>
        <div className="dual-cta__btn-row">
          <a href="#" className="btn btn--ghost" onClick={(e) => { e.preventDefault(); window.open('https://chat.ncglobalassets.com') }}>
            <ChatIcon /> Chat with Us <Arrow />
          </a>
          <a href="#contact" className="btn btn--ghost" style={{ borderColor: 'rgba(255,255,255,0.15)' }}>
            Send a Brief <Arrow />
          </a>
        </div>
        <p className="small" style={{ marginTop: 16, color: 'var(--muted)' }}>{data.notready_footer}</p>
      </div>
    </div>
  )
}
