'use client'

import Image from 'next/image'
import { Eyebrow } from '@/lib/constants'

export function OperatingPartner() {
  const spaces = [
    { label: "Cloud Kitchen", desc: "Fully equipped production kitchen for F&B brands — ready to operate from day one." },
    { label: "Offices", desc: "Working space for brand management, local team coordination and partner meetings." },
    { label: "Showroom", desc: "Presentation space to showcase your brand to retail buyers, distributors and local partners." },
  ]

  return (
    <section className="section" id="operate">
      <div className="container">
        <div className="sec-header" style={{ marginBottom: 48 }}>
          <div className="lhs">
            <Eyebrow>Our Base</Eyebrow>
          </div>
          <div>
            <h2 className="display-lg">Our Bangkok building<br/><span className="italic gold">Your operational base</span></h2>
          </div>
        </div>
        <div className="op-grid">
          <div className="op-img">
            <Image
              src="/assets/gallery-delivery.webp"
              alt="NC Global Assets Bangkok operations"
              width={600}
              height={600}
              loading="lazy"
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            <p className="lede" style={{ color: "var(--ink)" }}>
              We operate from our own building in Bangkok — a dedicated space built for international brands entering Thailand. No rental risk. No setup delays. Everything is already running.
            </p>
            <p className="body-text">
              Under one roof: a fully equipped cloud kitchen, working offices and a branded showroom. Your brand gets a real operational home in Bangkok from the moment we start working together.
            </p>
            <div className="space-cards">
              {spaces.map((s, i) => (
                <div className="space-card" key={i}>
                  <div className="space-card__label">{s.label}</div>
                  <p className="space-card__desc">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <hr className="divider" style={{ margin: "40px 0 32px" }} />
        <p className="pullquote">
          Built for <span className="gold">execution</span><br/>not theory
        </p>
      </div>
    </section>
  )
}
