'use client'

import { Eyebrow } from '@/lib/constants'
import { WHAT_WE_DO_DEFAULTS } from '@/lib/section-defaults'

export function WhatWeDo({ data = WHAT_WE_DO_DEFAULTS }: { data?: typeof WHAT_WE_DO_DEFAULTS }) {
  const cards = data.cards

  return (
    <section className="section section--surface" id="what">
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
        <div className="process-steps">
          {cards.map((c, i) => (
            <div className="process-step" key={c.idx} data-reveal style={{ transitionDelay: `${i * 80}ms` }}>
              <div className="process-step__circle">
                <span>{c.idx}</span>
              </div>
              {i < cards.length - 1 && <div className="process-step__line" />}
              <div className="process-step__card numcard">
                <h3 className="display-sm">{c.title}</h3>
                <p className="body-text">{c.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
