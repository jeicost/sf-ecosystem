'use client'

import Image from 'next/image'
import { Eyebrow } from '@/lib/constants'
import { INFRASTRUCTURE_DEFAULTS } from '@/lib/section-defaults'

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
