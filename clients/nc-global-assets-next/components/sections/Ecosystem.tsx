'use client'

import Image from 'next/image'
import { Eyebrow } from '@/lib/constants'
import { ECOSYSTEM_DEFAULTS } from '@/lib/section-defaults'

export function Ecosystem({ data = ECOSYSTEM_DEFAULTS }: { data?: typeof ECOSYSTEM_DEFAULTS }) {
  const partners = [
    { name: "Makeat", logo: "/assets/partner-makeat.png" },
    { name: "KM Zero", logo: "/assets/partner-kmzero.png", inv: true },
    { name: "CERØ", logo: "/assets/partner-cero.png" },
    { name: "Bfound 0%", logo: "/assets/partner-bfound.png" },
    { name: "Cámara de Comercio", logo: "/assets/partner-camara.svg" },
    { name: "Startups Factory", logo: "/assets/partner-startupsfactory.svg", inv: true },
  ]

  return (
    <section className="section section--light" id="ecosystem">
      <div className="container">
        <div className="sec-header">
          <div className="lhs">
            <Eyebrow>{data.eyebrow}</Eyebrow>
            <h2 className="display-lg">{data.headline_pre}<span className="italic" style={{ color: "var(--accent)" }}>{data.headline_accent}</span>{data.headline_suffix}</h2>
          </div>
          <div>
            <p className="lede">{data.lede}</p>
          </div>
        </div>
        <div className="logo-grid">
          {partners.map((p, i) => (
            <div className="logo-cell" key={i}>
              {p.logo ? (
                <Image
                  src={p.logo}
                  alt={p.name}
                  width={120}
                  height={60}
                  className={`partner-logo${p.inv ? ' inv' : ''}`}
                />
              ) : (
                p.name
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
