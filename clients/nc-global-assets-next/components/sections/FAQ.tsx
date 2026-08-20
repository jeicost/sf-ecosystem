'use client'

import { useState } from 'react'
import { Eyebrow } from '@/lib/constants'
import { FAQ_DEFAULTS } from '@/lib/section-defaults'

export function FAQ({ data = FAQ_DEFAULTS }: { data?: typeof FAQ_DEFAULTS }) {
  const [open, setOpen] = useState<number | null>(null)
  const toggle = (i: number) => setOpen(open === i ? null : i)

  const items = data.items

  return (
    <section className="section" id="faq">
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
        <div className="faq-list">
          {items.map((item, i) => (
            <div className="faq-item" key={i}>
              <button
                className={`faq-trigger${open === i ? " open" : ""}`}
                onClick={() => toggle(i)}
                aria-expanded={open === i}
              >
                {item.q}
                <span className="faq-icon">+</span>
              </button>
              <div className={`faq-body${open === i ? " open" : ""}`}>
                <div className="faq-body-inner">{item.a}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
