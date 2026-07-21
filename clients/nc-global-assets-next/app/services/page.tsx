import type { Metadata } from 'next'
import { Arrow, Eyebrow } from '@/lib/constants'
import { CompareSection } from '@/components/sections/CompareSection'
import { FinalCTA } from '@/components/sections/FinalCTA'
import { loadCmsSections, mergeCms } from '@/lib/cms-pages'

export const metadata: Metadata = {
  title: 'Services — Brand Launch, F&B Operations — NC Global Assets',
  description: 'Brand representation, go-to-market planning, cloud kitchen operations, local fulfillment and market entry in Bangkok, Thailand.',
  alternates: { canonical: '/services' },
  openGraph: {
    type: 'website',
    url: 'https://www.ncglobalassets.com/services',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630 }],
  },
}

// Ported from clients/nc-global-assets/src/App.jsx ServicesPage (L455-647)
const SERVICES = [
  {
    num: '01',
    title: 'Brand Representation & Action Plan',
    tag: 'Strategy · Go-to-Market',
    tagline: 'Enter the market with a clear roadmap — not guesswork.',
    body: 'We become your official brand representative in Thailand. Before you commit a single baht to local operations, we do the groundwork — market research, competitive mapping, brand adaptation and a full go-to-market roadmap built around your specific product, price point and audience.',
    cardFeatures: [
      'Thai market research & consumer insights',
      'Brand positioning and local adaptation',
      'Go-to-market strategy and launch roadmap',
      'Local partner and channel identification',
      'Dedicated local point of contact',
    ],
    features: [
      { label: 'Thai market research & consumer insights', desc: 'Deep dive into local behaviour, pricing benchmarks and category dynamics.' },
      { label: 'Brand positioning and local adaptation', desc: 'We adapt your messaging, visual identity and offer for the Thai market without losing your brand DNA.' },
      { label: 'Go-to-market strategy and launch roadmap', desc: 'A structured plan covering channels, milestones and commercial targets for your first 90 days.' },
      { label: 'Local partner and channel identification', desc: 'We map the right distributors, retailers and platforms for your category from day one.' },
      { label: 'Dedicated local point of contact', desc: 'A named person on the ground representing your brand in every meeting and conversation.' },
    ],
    img: '/assets/gallery-cafe.webp',
    outcome: 'You leave with a validated plan and a local partner — not a deck.',
    highlight: false,
  },
  {
    num: '02',
    title: 'Cloud Kitchen Operations',
    tag: 'F&B · Operations · Bangkok',
    tagline: 'Your food brand live in Bangkok in under two weeks.',
    body: 'Operate your food brand from our fully equipped Bangkok building — cloud kitchen, office and showroom included. No Thai company registration required. No setup from scratch. We manage production, logistics and platform activation so you generate real revenue from week one.',
    cardFeatures: [
      'Fully equipped cloud kitchen in central Bangkok',
      'Office and showroom space available',
      'No Thai company registration required',
      'Live on GrabFood, Foodpanda & Lineman in days',
      'Full operations management and logistics',
      'Real sales data and customer feedback from day one',
    ],
    features: [
      { label: 'Fully equipped cloud kitchen in central Bangkok', desc: 'Production-ready kitchen with Thai food safety certification, equipment and operating team.' },
      { label: 'Live on GrabFood, Foodpanda & Lineman in days', desc: "We activate your brand on Thailand's top delivery platforms and manage your store from day one." },
      { label: 'No Thai company registration required', desc: 'Operate legally under our structure — no legal setup, no bureaucracy, no wasted months.' },
      { label: 'Office and showroom space available', desc: 'Use our Bangkok base for your local team, partner meetings and brand presentations.' },
      { label: 'Full operations management and logistics', desc: 'We handle procurement, production scheduling, quality control and daily ops.' },
      { label: 'Real sales data and customer feedback from day one', desc: 'Weekly reporting with order volume, customer ratings and product performance data.' },
    ],
    img: '/assets/ops-kitchen.webp',
    outcome: 'From brief to first delivery order in under two weeks.',
    highlight: true,
  },
  {
    num: '03',
    title: 'Commercial & Distribution Services',
    tag: 'Sales · Distribution · Local Team',
    tagline: 'Open doors that would otherwise take years to build.',
    body: "Our local commercial team works your accounts every day — opening channels, building relationships and growing your brand's revenue footprint across Bangkok and Thailand. We activate retail, HORECA and B2B partnerships that take most foreign brands years to develop alone.",
    cardFeatures: [
      'Local commercial team working your accounts',
      'Retail, HORECA and corporate channel development',
      'Supplier and distribution network activation',
      'B2B partnership development',
      'Sales performance tracking and reporting',
    ],
    features: [
      { label: 'Local commercial team working your accounts', desc: 'Dedicated sales professionals who represent your brand in Thai — not translators, real operators.' },
      { label: 'Retail, HORECA and corporate channel development', desc: 'We open doors to supermarkets, specialty retailers, hotels, restaurants and corporate buyers.' },
      { label: 'Supplier and distribution network activation', desc: 'We plug your brand into existing logistics and cold chain networks across Bangkok and beyond.' },
      { label: 'B2B partnership development', desc: 'Strategic alliances with importers, co-packers and complementary brands for faster scale.' },
      { label: 'Sales performance tracking and reporting', desc: 'Monthly commercial dashboards covering pipeline, conversion, channel mix and revenue.' },
    ],
    img: '/assets/freepik_majestic-bangkok-skyline-_2861587919.webp',
    outcome: 'Real accounts. Real revenue. A commercial team that grows with you.',
    highlight: false,
  },
]

const HERO_DEFAULTS = {
  eyebrow: 'Our Services',
  headline_top: 'Three ways we',
  headline_gold: 'work with you',
  sub: 'Whether you need market clarity, an operational base or a commercial team on the ground — we have the infrastructure and the people to make it happen in Thailand.',
}

export default function ServicesPage() {
  const cms = loadCmsSections('services')
  const hero = mergeCms(HERO_DEFAULTS, cms['hero']?.data)

  return (
    <>
      {/* ── Hero ── */}
      <section className="svc-hero">
        <div className="container">
          <Eyebrow style={{ color: 'var(--accent)' }}>{hero.eyebrow}</Eyebrow>
          <h1 className="svc-hero__headline">
            {hero.headline_top}<br/>
            <span className="gold italic">{hero.headline_gold}</span>
          </h1>
          <p className="svc-hero__sub">{hero.sub}</p>
          <div className="svc-hero__pills">
            {['Strategy & Roadmap', 'Cloud Kitchen Operations', 'Commercial & Distribution'].map((t, i) => (
              <a key={i} href={`#svc-0${i + 1}`} className="svc-pill">0{i + 1} · {t}</a>
            ))}
          </div>
        </div>
      </section>

      {/* ── Card overview grid ── */}
      <section className="section section--surface">
        <div className="container">
          <div className="sec-header">
            <div className="lhs">
              <Eyebrow>At a glance</Eyebrow>
              <h2 className="display-lg">What&apos;s <span className="italic gold">included</span></h2>
            </div>
            <div>
              <p className="lede">Three complementary services — from strategy to full operations. You can engage with one or combine all three depending on your stage and goals.</p>
            </div>
          </div>
          <div className="services-grid">
            {SERVICES.map((s, i) => (
              <div
                className={`service-card${s.highlight ? ' service-card--highlight' : ''}`}
                key={i}
                data-reveal
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                <div className="service-card__top">
                  <span className="service-card__num">{s.num}</span>
                  <span className="service-card__tag">{s.tag}</span>
                </div>
                <h3 className="display-sm service-card__title">{s.title}</h3>
                <p className="body-text service-card__body">{s.tagline}</p>
                <ul className="service-card__list">
                  {s.cardFeatures.map((f, j) => (
                    <li key={j}><span className="tick-sm" />{f}</li>
                  ))}
                </ul>
                <a href={`#svc-0${i + 1}`} className={`service-card__cta${s.highlight ? ' btn btn--primary' : ''}`}>
                  See full detail <Arrow size={12} />
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Detailed blocks ── */}
      {SERVICES.map((s, idx) => (
        <section
          key={s.num}
          id={`svc-0${idx + 1}`}
          className={`svc-block${s.highlight ? ' svc-block--accent' : idx % 2 !== 0 ? ' svc-block--surface' : ''}`}
        >
          <div className="container">
            <div className={`svc-block__grid${idx % 2 !== 0 ? ' svc-block__grid--rev' : ''}`}>
              <div className="svc-block__img-wrap">
                <div className="svc-block__num">{s.num}</div>
                <img src={s.img} alt={s.title} loading="lazy" className="svc-block__img" />
                <div className="svc-block__outcome">
                  <span className="svc-block__outcome-icon">→</span>
                  {s.outcome}
                </div>
              </div>
              <div className="svc-block__content">
                <span className="svc-block__tag">{s.tag}</span>
                <h2 className="svc-block__title">{s.title}</h2>
                <p className="svc-block__tagline">{s.tagline}</p>
                <p className="svc-block__body">{s.body}</p>
                <ul className="svc-feature-list">
                  {s.features.map((f, j) => (
                    <li key={j} className="svc-feature-item">
                      <span className="svc-feature-item__dot" />
                      <div>
                        <div className="svc-feature-item__label">{f.label}</div>
                        <div className="svc-feature-item__desc">{f.desc}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>
      ))}

      <CompareSection />
      <FinalCTA />
    </>
  )
}
