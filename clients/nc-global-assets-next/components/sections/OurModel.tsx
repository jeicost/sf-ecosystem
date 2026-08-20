'use client'

import { Eyebrow } from '@/lib/constants'
import { OUR_MODEL_DEFAULTS } from '@/lib/section-defaults'

export function OurModel({ data = OUR_MODEL_DEFAULTS }: { data?: typeof OUR_MODEL_DEFAULTS }) {
  const blocks = data.blocks

  return (
    <section className="section" id="model">
      <div className="container">
        <div className="sec-header">
          <div className="lhs">
            <Eyebrow>{data.eyebrow}</Eyebrow>
            <h2 className="display-lg">{data.headline_top}<span className="italic gold">{data.headline_gold}</span></h2>
          </div>
          <div>
            <p className="lede" style={{ marginBottom: 20 }}>
              {data.lede}
            </p>
            <p style={{ fontFamily: "var(--font-display)", fontSize: "clamp(18px,2vw,24px)", fontStyle: "italic", fontWeight: 600, color: "var(--ink)", borderLeft: "3px solid var(--accent)", paddingLeft: 16, lineHeight: 1.4 }}>
              {data.quote}
            </p>
          </div>
        </div>
        <div className="cards-3">
          {blocks.map((b, i) => (
            <div className="numcard" key={i}>
              <div className="index">0{i + 1}</div>
              <h3 className="display-sm">{b.ttl}</h3>
              <p className="body-text" style={{ marginTop: "auto" }}>{b.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
