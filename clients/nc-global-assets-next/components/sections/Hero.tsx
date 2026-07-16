'use client'

import Link from 'next/link'
import { CONFIG, Arrow, Eyebrow } from '@/lib/constants'

export function Hero() {
  return (
    <section className="hero" id="top">
      <div
        className="hero-bg"
        style={{ backgroundImage: "url(/assets/hero-bkk.webp), url(/assets/bkk-daytime.webp), url(/assets/hero-bangkok.webp)" }}
      />
      <div className="hero-content container">
        <div className="hero-eyebrow-row">
          <Eyebrow style={{ color: "var(--accent)" }}>Bangkok · Local Operating Partner</Eyebrow>
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
          <div className="hero-spaces">
            <div className="hero-spaces__label">What's ready for your brand</div>
            {[
              { icon: "◈", label: "Showroom", desc: "Present your brand to buyers & partners" },
              { icon: "⬡", label: "Offices", desc: "Local team base & brand management" },
              { icon: "◎", label: "Cloud Kitchen", desc: "Production-ready, live on delivery apps" },
            ].map((s, i) => (
              <div className="hero-space-item" key={i}>
                <span className="hero-space-item__dot" />
                <div>
                  <div className="hero-space-item__label">{s.label}</div>
                  <div className="hero-space-item__desc">{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="hero-stats">
        <div className="hero-stat">
          <div className="num">15<span style={{ fontSize: "0.45em", verticalAlign: "top", fontWeight: 400 }}>+</span></div>
          <div className="lbl">Years of founder<br/>& operator experience</div>
        </div>
        <div className="hero-stat">
          <div className="num">7</div>
          <div className="lbl">Brands in our<br/>active network</div>
        </div>
        <div className="hero-stat">
          <div className="num">2<span style={{ fontSize: "0.45em", verticalAlign: "top", fontWeight: 400 }}>w</span></div>
          <div className="lbl">From brief to<br/>live on delivery apps</div>
        </div>
        <div className="hero-stat">
          <div className="num">SEA</div>
          <div className="lbl">Strategic gateway<br/>to the region</div>
        </div>
      </div>
      <div className="scroll-cue">
        <span>Scroll</span>
        <span className="line" />
      </div>
    </section>
  )
}
