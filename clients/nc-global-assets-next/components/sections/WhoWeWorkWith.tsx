'use client'

import { Eyebrow } from '@/lib/constants'
import { WHO_WE_WORK_WITH_DEFAULTS } from '@/lib/section-defaults'

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
