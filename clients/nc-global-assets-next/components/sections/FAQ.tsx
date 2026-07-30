'use client'

import { useState } from 'react'
import { Eyebrow } from '@/lib/constants'

export const FAQ_DEFAULTS = {
  eyebrow: 'FAQ',
  headline_top: 'Frequently asked ',
  headline_gold: 'questions',
  lede: 'Everything you need to know about working with NC Global Assets and entering the Thai market.',
  items: [
    { q: "What markets do you focus on?", a: "We focus exclusively on Thailand, with Bangkok as our primary operating base. From Bangkok, brands can build a foundation for a wider Southeast Asian expansion." },
    { q: "Do you only work with F&B brands?", a: "F&B is our strongest vertical, but we work with selected brands across lifestyle, sustainability, sport and digital platforms. The key criterion is whether your brand has a differentiated product and a real ambition to grow in Thailand." },
    { q: "How does the partnership model work?", a: "We work alongside brands as a local operating partner — not an external consultant. Agreements are structured as fixed models, performance-based fees, revenue share or equity participation depending on the project." },
    { q: "Can I test the market before fully committing?", a: "Absolutely. Market validation is one of the first phases we support. We run real sales pilots, gather customer feedback and validate product-market fit in Bangkok before scaling." },
    { q: "How long does it take to launch in Thailand?", a: "A focused market test can be set up in 4–8 weeks using our existing infrastructure. A full market launch typically takes 3–6 months depending on the complexity of your product and model." },
    { q: "How do I get started?", a: "Book a call or send us a brief through the contact form. We will review your brand, understand your goals and come back with a clear view of how we can support your Thailand entry." },
  ],
}

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
