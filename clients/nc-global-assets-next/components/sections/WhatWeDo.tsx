'use client'

import { Eyebrow } from '@/lib/constants'

export const WHAT_WE_DO_DEFAULTS = {
  eyebrow: 'How It Works',
  headline_top: 'From market test to ',
  headline_gold: 'full operation',
  lede: 'Three phases. One local partner. From your first product test in Bangkok to a fully operating brand across Southeast Asia — we manage the entire journey with you.',
  cards: [
    {
      idx: "01",
      title: "Test the Market",
      body: "Validate real demand in Bangkok before committing — pilot your product, collect customer feedback and confirm product-market fit using our infrastructure.",
    },
    {
      idx: "02",
      title: "Build the Launch",
      body: "Adapt your brand for the Thai market, design your go-to-market strategy and activate the right local channels, partners and platforms from day one.",
    },
    {
      idx: "03",
      title: "Operate & Scale",
      body: "Run daily operations from our Bangkok base and grow your footprint across Thailand and Southeast Asia with a local team directly invested in your results.",
    },
  ],
}

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
