'use client'

import { Eyebrow } from '@/lib/constants'

export const WHO_WE_WORK_WITH_DEFAULTS = {
  eyebrow: 'Who We Work With',
  headline_top: 'Selected brands with ',
  headline_gold: 'real potential',
  lede: 'We work with a curated number of brands at a time — ensuring each partnership gets real attention, local expertise and hands-on execution.',
  items: [
    { idx: "01", ttl: "F&B Thailand", sub: "Concepts with a distinct product and a real story to tell in Thailand." },
    { idx: "02", ttl: "Proven Operators", sub: "Teams with track record ready to scale their model internationally." },
    { idx: "03", ttl: "Ambitious Founders", sub: "Builders committed to a thoughtful, long-term regional expansion." },
    { idx: "04", ttl: "Strategic Projects", sub: "Ventures aligned with Thailand's lifestyle and innovation landscape." },
  ],
}

export function WhoWeWorkWith({ data = WHO_WE_WORK_WITH_DEFAULTS }: { data?: typeof WHO_WE_WORK_WITH_DEFAULTS }) {
  const items = data.items

  return (
    <section className="section section--surface" id="partners">
      <div className="container">
        <div className="sec-header">
          <div className="lhs">
            <Eyebrow>{data.eyebrow}</Eyebrow>
            <h2 className="display-lg">{data.headline_top}<span className="italic gold">{data.headline_gold}</span></h2>
          </div>
          <div>
            <p className="lede">{data.lede}</p>
          </div>
        </div>
        <div className="cards-4">
          {items.map((it, i) => (
            <div className="numcard" key={it.idx} data-reveal style={{ transitionDelay: `${i * 70}ms` }}>
              <div className="index">{it.idx}</div>
              <h3 className="display-sm">{it.ttl}</h3>
              <p className="body-text" style={{ marginTop: "auto" }}>{it.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
