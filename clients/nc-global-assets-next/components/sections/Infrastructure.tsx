'use client'

import Image from 'next/image'
import { Eyebrow } from '@/lib/constants'

export const INFRASTRUCTURE_DEFAULTS = {
  eyebrow: 'Infrastructure',
  headline_top: 'Real infrastructure',
  headline_gold: 'Real',
  headline_suffix: ' market entry',
  lede: 'Our Bangkok-based operating infrastructure lets brands enter the market efficiently — without building everything from scratch on day one.',
  blocks: [
    { num: "01", title: "Production", body: "Local food preparation, product adaptation and operational setup from day one." },
    { num: "02", title: "Sales Channels", body: "Activation across delivery platforms, retail and selected commercial partners." },
    { num: "03", title: "Market Feedback", body: "Real customer insights, sales performance data and continuous product validation." },
    { num: "04", title: "Daily Operations", body: "On-the-ground management, local coordination and growth execution." },
  ],
}

export function Infrastructure({ data = INFRASTRUCTURE_DEFAULTS }: { data?: typeof INFRASTRUCTURE_DEFAULTS }) {
  const blocks = data.blocks

  return (
    <section className="section" id="infra">
      <div className="container">
        <div className="sec-header">
          <div className="lhs">
            <Eyebrow>{data.eyebrow}</Eyebrow>
            <h2 className="display-lg">{data.headline_top}<br/><span className="italic gold">{data.headline_gold}</span>{data.headline_suffix}</h2>
          </div>
          <div>
            <p className="lede">{data.lede}</p>
          </div>
        </div>
        <div className="infra-grid">
          <div className="infra-img">
            <Image
              src="/assets/freepik_majestic-bangkok-skyline-_2861587919.webp"
              alt="Bangkok business district"
              width={600}
              height={600}
              loading="lazy"
            />
          </div>
          <div>
            {blocks.map(b => (
              <div className="infra-row" key={b.num}>
                <div className="num">{b.num}</div>
                <div>
                  <div className="ttl">{b.title}</div>
                  <p className="body-text">{b.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
