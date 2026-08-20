'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Eyebrow, Arrow } from '@/lib/constants'
import { BRANDS_PROJECTS_DEFAULTS } from '@/lib/section-defaults'

export function BrandsProjects({ data = BRANDS_PROJECTS_DEFAULTS }: { data?: typeof BRANDS_PROJECTS_DEFAULTS }) {
  const brands = [
    { name: "Salsa Burgers", tag: "F&B · Bangkok", desc: "Craft burger concept developed and operated in Bangkok.", logo: "/assets/brand-salsa-logo.png", bg: "#FFFFFF", caseStudy: "/case-studies/salsa-burgers" },
    { name: "Plesh", tag: "Food · Wellness", desc: "Next-generation chocolate snacks — full flavour, zero added sugar, backed by Marc Gasol and Gerard Piqué.", logo: "/assets/brand-plesh-logo.svg", bg: "#FAFAF7" },
    { name: "Souji", tag: "Sustainability", desc: "Sustainable products focused on circular innovation.", logo: "/assets/partner-souji.svg", bg: "#EEF5EE" },
    { name: "Dadybox", tag: "Logistics", desc: "E-commerce logistics and fulfillment platform scaling across Europe.", logo: "/assets/brand-dadybox-logo.svg", bg: "#0B1829" },
    { name: "Discoolver", tag: "Digital Platform", desc: "Digital platform connecting people with local experiences.", logo: "/assets/brand-discoolver-logo.png", bg: "#FAFAF7" },
    { name: "Taykus", tag: "Sport Tech · Padel", desc: "Court booking and club management platform for padel and tennis — expanding across Asia.", logo: "/assets/brand-taykus-logo.png", bg: "#0D1829" },
    { name: "The Padel Society", tag: "Sport · Lifestyle", desc: "Sports and lifestyle project riding the padel wave in Asia.", logo: "/assets/brand-padel-logo.png", bg: "#F8FFF8" },
  ]

  return (
    <section className="section" id="brands">
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
        <div className="brand-grid">
          {brands.map((b, i) => (
            <div className="brand-card" key={i} data-reveal style={{ transitionDelay: `${(i % 4) * 60}ms` }}>
              <div className="img is-logo" style={{ background: b.bg }}>
                <Image src={b.logo} alt={b.name} width={120} height={120} loading="lazy" />
              </div>
              <div className="meta">
                <div className="name">{b.name}</div>
                <div className="tag">{b.tag}</div>
              </div>
              <div className="desc">{b.desc}</div>
              {b.caseStudy && (
                <Link href={b.caseStudy} className="brand-card__cs-link">
                  Read case study <Arrow size={12} />
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
