'use client'

import Image from 'next/image'
import { Eyebrow } from '@/lib/constants'

export function Testimonials() {
  const testimonials = [
    {
      q: "We went from brief to live on GrabFood in under two weeks. NC Global gave us the kitchen, the team and the delivery activation — we focused entirely on the product. Real orders from day one.",
      name: "Carlos Jacoste",
      role: "Founder · Salsa Burgers",
      img: "/assets/carlos-dark.jpg",
    },
    {
      q: "What sets them apart is that they operate, not just advise. We had a local team representing our brand in Bangkok from the first week — that changes the entire dynamic of entering a new market.",
      name: "Founder",
      role: "The Padel Society · Sport & Lifestyle",
      img: null,
    },
    {
      q: "NC Global already had the infrastructure, the platforms and the relationships in place. We walked into a running system instead of building one from zero. That's months of groundwork we didn't have to do.",
      name: "Founder",
      role: "Souji · Food & Wellness",
      img: null,
    },
  ]

  return (
    <section className="section section--light" id="testimonials">
      <div className="container">
        <div className="sec-header">
          <div className="lhs">
            <Eyebrow>Founder Perspectives</Eyebrow>
            <h2 className="display-lg"><span className="italic" style={{ color: "var(--accent)" }}>Founder</span> perspectives</h2>
          </div>
          <div>
            <p className="lede">From the brands that have been through it — testing, launching and operating in Bangkok with NC Global as their local partner.</p>
          </div>
        </div>
        <div>
          {testimonials.map((t, i) => (
            <div className="tmbox" key={i} data-reveal style={{ transitionDelay: `${i * 100}ms` }}>
              <div>
                <div className="tm-attr">— {t.name}, {t.role}</div>
                {t.img
                  ? <Image src={t.img} alt={t.name} width={44} height={44} style={{ borderRadius: "50%", objectFit: "cover", marginTop: 16, border: "1.5px solid var(--accent)" }} />
                  : <div style={{ width: 44, height: 44, borderRadius: "50%", marginTop: 16, border: "1.5px solid var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--surface-2)", fontSize: 14, fontWeight: 700, color: "var(--accent)", fontFamily: "var(--font-display)", flexShrink: 0 }}>{t.name[0]}</div>
                }
              </div>
              <p className="tm-quote">"{t.q}"</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
