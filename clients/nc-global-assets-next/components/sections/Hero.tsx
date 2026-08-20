'use client'

import { Eyebrow } from '@/lib/constants'
import { HERO_DEFAULTS } from '@/lib/section-defaults'

export function Hero({ data = HERO_DEFAULTS }: { data?: typeof HERO_DEFAULTS }) {
  return (
    <section className="hero" id="top">
      <div
        className="hero-bg"
        style={{ backgroundImage: "url(/assets/hero-bkk.webp), url(/assets/bkk-daytime.webp), url(/assets/hero-bangkok.webp)" }}
      />
      <div className="hero-content container">
        <div className="hero-eyebrow-row">
          <Eyebrow style={{ color: "var(--accent)" }}>{data.eyebrow}</Eyebrow>
          <span className="rule" />
        </div>
        <h1 className="hero-headline">
          <span className="line">{data.headline_line1}</span>
          <span className="line">{data.headline_line2}<span className="gold italic">{data.headline_line2_gold}</span></span>
          <span className="line gold italic">{data.headline_line3_gold}</span>
        </h1>
        <h2 style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', overflow: 'hidden' }}>
          {data.hidden_heading}
        </h2>
        <div className="hero-body">
          <div className="hero-lede-col">
            <p className="lede">
              {data.body}
            </p>
          </div>
          <div className="hero-spaces">
            <div className="hero-spaces__label">{data.spaces_label}</div>
            {data.spaces.map((s, i) => (
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
