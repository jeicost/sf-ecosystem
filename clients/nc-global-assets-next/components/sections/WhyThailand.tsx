'use client'

import Image from 'next/image'
import { Eyebrow } from '@/lib/constants'

interface ImgCardProps {
  src: string
  alt: string
  caption: string
  className?: string
}

function ImgCard({ src, alt, caption, className = "" }: ImgCardProps) {
  return (
    <div className={`imgcard ${className}`}>
      <Image src={src} alt={alt} width={300} height={300} loading="lazy" />
      {caption && <span className="caption">{caption}</span>}
    </div>
  )
}

export const WHY_THAILAND_DEFAULTS = {
  eyebrow: 'Why Thailand',
  headline_top: 'Bangkok first',
  headline_accent: 'Southeast Asia',
  headline_suffix: ' next',
  lede: 'Bangkok offers a unique combination of scale, creativity and openness to international concepts — the ideal testing ground before expanding across the region.',
  subheading_pre: 'A market built for brands that know how to ',
  subheading_accent: 'show up well',
  subheading_suffix: '.',
  bullets: [
    "One of SEA's fastest-growing F&B and lifestyle markets",
    "Strong delivery ecosystem and digital adoption",
    "High concentration of international consumers and tourism",
    "Strategic gateway to the rest of Southeast Asia",
    "A market genuinely open to new concepts and experiences",
  ],
}

export function WhyThailand({ data = WHY_THAILAND_DEFAULTS }: { data?: typeof WHY_THAILAND_DEFAULTS }) {
  const bullets = data.bullets

  return (
    <section className="section section--light" id="why">
      <div className="container">
        <div className="sec-header">
          <div className="lhs">
            <Eyebrow>{data.eyebrow}</Eyebrow>
            <h2 className="display-lg">{data.headline_top}<br/><span className="italic" style={{ color: "var(--accent)" }}>{data.headline_accent}</span>{data.headline_suffix}</h2>
          </div>
          <div>
            <p className="lede">{data.lede}</p>
          </div>
        </div>
        <div className="gallery" style={{ marginBottom: 48 }}>
          <ImgCard src="/assets/freepik_elegant-bangkok-skyline-a_2861587914.webp" alt="Bangkok skyline" caption="Bangkok Skyline" className="g1" />
          <ImgCard src="/assets/market-bkk.webp" alt="Bangkok night market" caption="Night Market" className="g2" />
          <ImgCard src="/assets/rooftop-bkk.webp" alt="Bangkok rooftop" caption="Rooftop Scene" className="g3" />
          <ImgCard src="/assets/freepik_sleek-bangkok-skyline-at-_2861587897.webp" alt="Bangkok city night" caption="City at Night" className="g4" />
          <ImgCard src="/assets/gallery-cafe.webp" alt="Bangkok café" caption="Modern Café" className="g5" />
          <ImgCard src="/assets/temple-bkk.webp" alt="Wat Arun" caption="Wat Arun · BKK" className="g6" />
        </div>
        <div className="why-grid">
          <h3 className="display-md" style={{ color: "var(--ink-light)" }}>
            {data.subheading_pre}<span className="italic" style={{ color: "var(--accent)" }}>{data.subheading_accent}</span>{data.subheading_suffix}
          </h3>
          <ul className="checklist">
            {bullets.map((b, i) => (
              <li key={i}><span className="tick" /><span>{b}</span></li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
