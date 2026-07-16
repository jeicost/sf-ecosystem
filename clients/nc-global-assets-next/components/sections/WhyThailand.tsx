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

export function WhyThailand() {
  const bullets = [
    "One of SEA's fastest-growing F&B and lifestyle markets",
    "Strong delivery ecosystem and digital adoption",
    "High concentration of international consumers and tourism",
    "Strategic gateway to the rest of Southeast Asia",
    "A market genuinely open to new concepts and experiences",
  ]

  return (
    <section className="section section--light" id="why">
      <div className="container">
        <div className="sec-header">
          <div className="lhs">
            <Eyebrow>Why Thailand</Eyebrow>
            <h2 className="display-lg">Bangkok first<br/><span className="italic" style={{ color: "var(--accent)" }}>Southeast Asia</span> next</h2>
          </div>
          <div>
            <p className="lede">Bangkok offers a unique combination of scale, creativity and openness to international concepts — the ideal testing ground before expanding across the region.</p>
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
            A market built for brands that know how to <span className="italic" style={{ color: "var(--accent)" }}>show up well</span>.
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
