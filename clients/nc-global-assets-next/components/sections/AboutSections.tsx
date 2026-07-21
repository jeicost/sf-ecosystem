import { Eyebrow } from '@/lib/constants'

// Ported from clients/nc-global-assets/src/App.jsx (AboutStory L1611,
// AboutManifesto L1648, AboutNumbers L1686, AboutValues L1710, AboutApproach L1744)

export function AboutStory() {
  return (
    <section className="about-story section">
      <div className="container">
        <div className="about-story__grid">
          <div className="about-story__text">
            <Eyebrow>Our Story</Eyebrow>
            <h2 className="display-lg" style={{ marginTop: 16, marginBottom: 28 }}>
              Built from the ground up<br/>in <span className="italic gold">Bangkok.</span>
            </h2>
            <p className="lede" style={{ marginBottom: 20 }}>
              NC Global Assets was founded by entrepreneurs who understood firsthand how hard it is to bring an international brand into a new market — especially one as dynamic and nuanced as Thailand.
            </p>
            <p className="body-text" style={{ marginBottom: 20 }}>
              We saw brilliant brands fail not because their product was wrong, but because they tried to build everything from scratch, alone, without local knowledge or operational infrastructure. We decided to build that infrastructure ourselves.
            </p>
            <p className="body-text">
              Today, our Bangkok building — with its cloud kitchen, offices and showroom — is the operational base from which we help international brands test, launch and grow across Thailand and Southeast Asia. Not as consultants. As partners with skin in the game.
            </p>
          </div>
          <div className="about-story__visual">
            <div className="about-story__img-stack">
              <img src="/assets/ops-kitchen.webp" alt="NC Global Assets Bangkok operations" className="about-story__img about-story__img--main" loading="lazy" />
              <img src="/assets/gallery-cafe.webp" alt="Bangkok brand launch" className="about-story__img about-story__img--accent" loading="lazy" />
              <div className="about-story__stat">
                <div className="about-story__stat-val">2+</div>
                <div className="about-story__stat-label">Years operating<br/>in Bangkok</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export function AboutManifesto() {
  const pillars = [
    { num: '01', label: 'Real infrastructure', icon: '◈', desc: 'We operate from our own building in Bangkok — cloud kitchen, offices and showroom. No setup time. No rental risk. Everything is already running from day one.' },
    { num: '02', label: 'Local execution', icon: '⬡', desc: 'A bilingual team on the ground that speaks Thai, knows the market and executes alongside your brand every single day — not a remote advisor team.' },
    { num: '03', label: 'Long-term alignment', icon: '◎', desc: 'Structured as partners, not service providers. Our commercial agreements are tied to your results — we grow when you grow.' },
  ]
  return (
    <section className="about-manifesto">
      <div className="container">
        <div className="about-manifesto__header">
          <div>
            <p className="about-manifesto__eyebrow">What makes us different</p>
          </div>
          <div>
            <h2 className="about-manifesto__headline">
              We don&apos;t advise<br/><span className="gold italic">We operate</span>
            </h2>
            <p className="about-manifesto__sub">Most market-entry firms hand you a report and move on. We stay — managing operations, tracking results and adjusting alongside your brand until the numbers work.</p>
          </div>
        </div>
        <div className="about-pillars">
          {pillars.map((p, i) => (
            <div className="about-pillar" key={i}>
              <div className="about-pillar__top">
                <div className="about-pillar__num">{p.num}</div>
                <div className="about-pillar__icon">{p.icon}</div>
              </div>
              <div className="about-pillar__label">{p.label}</div>
              <p className="about-pillar__desc">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function AboutNumbers() {
  const stats = [
    { value: '15+', label: 'Years of founder & operator experience in startups and international expansion' },
    { value: '6+', label: 'Years of Digital Marketing expertise driving brands in the Thai market' },
    { value: '4–8w', label: 'From brief to first revenue using our Bangkok infrastructure' },
    { value: 'SEA', label: 'Strategic gateway — Thailand as your launchpad for Southeast Asia' },
  ]
  return (
    <section className="about-numbers">
      <div className="container">
        <div className="about-numbers__grid">
          {stats.map((s, i) => (
            <div className="about-stat" key={i}>
              <div className="about-stat__value">{s.value}</div>
              <div className="about-stat__label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function AboutValues() {
  const values = [
    { label: 'Local first', desc: 'Every decision starts from a deep understanding of Thailand — its consumers, its culture and its business dynamics.' },
    { label: 'Execution over advice', desc: "We don't write strategies that gather dust. We implement them, track them and improve them on the ground." },
    { label: 'Honest partnership', desc: "We tell you what will work and what won't. No overselling, no generic playbooks — just clear, honest guidance." },
    { label: 'Shared accountability', desc: "Our commercial models are tied to your performance. If you don't win, we don't win. That keeps us focused." },
  ]
  return (
    <section className="section section--surface" id="values">
      <div className="container">
        <div className="sec-header">
          <div className="lhs">
            <Eyebrow>Our Values</Eyebrow>
            <h2 className="display-lg">How we show <span className="italic gold">up every day</span></h2>
          </div>
          <div>
            <p className="lede">These aren&apos;t wall posters. They are the criteria we use to decide who we work with, how we price our services and whether a partnership is working.</p>
          </div>
        </div>
        <div className="about-values-grid">
          {values.map((v, i) => (
            <div className="about-value-card" key={i}>
              <div className="about-value-card__num">0{i + 1}</div>
              <div className="about-value-card__label">{v.label}</div>
              <p className="about-value-card__desc">{v.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function AboutApproach() {
  const phases = [
    { num: '01', label: 'Understand', time: 'Week 1–2', desc: 'We start by learning your brand deeply — product, positioning, goals and real constraints. We do market mapping, competitive research and consumer analysis specific to your category in Thailand. No generic playbooks. No assumptions.' },
    { num: '02', label: 'Test', time: 'Week 3–6', desc: 'We run a real market pilot in Bangkok using our existing infrastructure. Your product reaches real customers through our cloud kitchen and delivery channels. We collect data, ratings and feedback before you commit to full scale.' },
    { num: '03', label: 'Build', time: 'Month 2–6', desc: "Once validated, we build the full operational foundation — local team, sales channels, distribution partners and commercial systems. We grow your brand's footprint across Bangkok and into Southeast Asia with clear performance milestones." },
  ]
  return (
    <section className="section" id="approach">
      <div className="container">
        <div className="sec-header" style={{ marginBottom: 48 }}>
          <div className="lhs">
            <Eyebrow>How We Work</Eyebrow>
            <h2 className="display-lg">Three phases<br/><span className="italic gold">One team</span></h2>
          </div>
          <div>
            <p className="lede">We don&apos;t hand off deliverables and disappear. We work alongside your brand through every step — from first conversation to full commercial operation.</p>
          </div>
        </div>
        <div className="about-phases">
          {phases.map((p, i) => (
            <div className="about-phase" key={i}>
              <div>
                <div className="about-phase__num">{p.num}</div>
                <div className="about-phase__time">{p.time}</div>
              </div>
              <div>
                <div className="about-phase__label">{p.label}</div>
                <p className="about-phase__desc">{p.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
