'use client'

import Image from 'next/image'
import { CONFIG, Arrow, Eyebrow, Calendar } from '@/lib/constants'

export const INTRO_DEFAULTS = {
  eyebrow: 'The Opportunity',
  badge_city: 'Bangkok',
  badge_label: "Southeast Asia's fastest-growing market",
  heading: "Thailand is one of Southeast Asia's fastest-growing consumer markets — and most international brands never make it past the planning stage. Not because the opportunity isn't there. Because they try to build everything",
  heading_accent: 'from scratch, alone.',
  lede: "We built the infrastructure so you don't have to. Cloud kitchen. Office. Showroom. Local team. Distribution channels. Everything you need to enter Thailand is already running — waiting for your brand.",
  cta_label: 'See how it works',
}

export function Intro({ data = INTRO_DEFAULTS }: { data?: typeof INTRO_DEFAULTS }) {
  return (
    <section className="section intro-section">
      <div className="container">
        <div className="intro-grid">
          <div className="intro-img">
            <Image
              src="/assets/gallery-cafe.webp"
              alt="Modern F&B space Bangkok — Thailand market entry opportunity"
              width={600}
              height={600}
              loading="lazy"
            />
            <div className="intro-img__overlay" />
            <div className="intro-img__badge">
              <span className="intro-img__badge-city">{data.badge_city}</span>
              <span className="intro-img__badge-label">{data.badge_label}</span>
            </div>
          </div>
          <div className="intro-content">
            <Eyebrow>{data.eyebrow}</Eyebrow>
            <p className="display-md" style={{ color: "var(--ink)", marginTop: 20 }}>
              {data.heading}{" "}
              <span className="italic gold">{data.heading_accent}</span>
            </p>
            <p className="lede" style={{ marginTop: 28 }}>
              {data.lede}
            </p>
            <a href={CONFIG.calendlyUrl} target="_blank" rel="noopener" className="btn btn--ghost" style={{ marginTop: 36, alignSelf: "flex-start" }}>
              <Calendar size={14} /> {data.cta_label} <Arrow />
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
