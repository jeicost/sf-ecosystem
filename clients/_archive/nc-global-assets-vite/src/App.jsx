import React, { useState, useEffect } from 'react'
import { Routes, Route, Link, useLocation, useParams, useNavigate } from 'react-router-dom'
import { marked } from 'marked'
import posts from './content/posts.json'

const CONFIG = {
  calendlyUrl: "https://calendly.com/ncglobalassets/intro",
  whatsappNumber: "66825366653",
  lineId: "@ncglobalassets",
  phone: "+66825366653",
  phoneDisplay: "082 536 6653",
  email: "contact@ncglobalassets.com",
}

const getContactLinks = () => ({
  calendly: CONFIG.calendlyUrl,
  whatsapp: `https://wa.me/${CONFIG.whatsappNumber.replace(/\D/g,"")}?text=${encodeURIComponent("Hi NC Global Assets, I'd like to talk about launching my brand in Thailand.")}`,
  line: `https://line.me/R/ti/p/${encodeURIComponent(CONFIG.lineId)}`,
})

const openChat = () => window.dispatchEvent(new Event("nc:openchat"))

// ─── SEO Meta Updater ───
function updatePageMeta({ title, description, canonical, ogType = 'website', ogTitle, ogImage, publishedTime, author }) {
  // Title
  document.title = title || document.title

  // Description
  const descMeta = document.querySelector('meta[name="description"]')
  if (descMeta && description) descMeta.content = description

  // Canonical
  if (canonical) {
    let canonicalLink = document.querySelector('link[rel="canonical"]')
    if (canonicalLink) {
      canonicalLink.href = canonical
    } else {
      canonicalLink = document.createElement('link')
      canonicalLink.rel = 'canonical'
      canonicalLink.href = canonical
      document.head.appendChild(canonicalLink)
    }
  }

  // OG Tags
  const ogTags = {
    'og:type': ogType,
    'og:title': ogTitle || title,
    'og:description': description,
    ...(canonical && { 'og:url': canonical }),
    ...(ogImage && { 'og:image': ogImage }),
    ...(publishedTime && { 'article:published_time': publishedTime }),
    ...(author && { 'article:author': author }),
  }

  Object.entries(ogTags).forEach(([property, content]) => {
    if (!content) return
    let meta = document.querySelector(`meta[property="${property}"]`)
    if (!meta) {
      meta = document.createElement('meta')
      meta.setAttribute('property', property)
      document.head.appendChild(meta)
    }
    meta.content = content
  })

  // Article Schema
  if (ogType === 'article' && canonical) {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: ogTitle || title,
      description: description,
      url: canonical,
      ...(ogImage && { image: ogImage }),
      ...(publishedTime && { datePublished: publishedTime }),
      ...(author && { author: { '@type': 'Person', name: author } }),
      publisher: {
        '@type': 'Organization',
        name: 'NC Global Assets',
        url: 'https://www.ncglobalassets.com',
      },
      mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
    }

    const oldScript = document.getElementById('article-schema')
    if (oldScript) oldScript.remove()

    const script = document.createElement('script')
    script.id = 'article-schema'
    script.type = 'application/ld+json'
    script.textContent = JSON.stringify(schema)
    document.head.appendChild(script)
  }
}

function removeArticleSchema() {
  const script = document.getElementById('article-schema')
  if (script) script.remove()
}

// ─── Icons ───
const Arrow = ({ size = 14 }) => (
  <svg className="arrow" width={size} height={size} viewBox="0 0 14 14" fill="none">
    <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)
const WhatsAppIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.5 14.4c-.3-.1-1.7-.8-2-1-.3-.1-.5-.1-.6.1-.2.3-.7.9-.9 1.1-.2.1-.3.2-.6 0-1.6-.8-2.7-1.4-3.8-3.2-.3-.5.3-.5.8-1.5.1-.2 0-.3 0-.5s-.6-1.5-.9-2c-.2-.5-.5-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.3.3-.9.9-.9 2.2 0 1.3.9 2.6 1.1 2.8.1.2 1.9 2.9 4.6 4 1.7.7 2.4.8 3.2.6.5-.1 1.7-.7 1.9-1.4.2-.7.2-1.2.2-1.4-.1-.2-.3-.3-.6-.4zM12 2C6.5 2 2 6.5 2 12c0 1.7.4 3.3 1.2 4.7L2 22l5.4-1.2c1.4.7 2.9 1.1 4.6 1.1 5.5 0 10-4.5 10-10S17.5 2 12 2zm0 18.3c-1.5 0-3-.4-4.3-1.1l-.3-.2-3.2.7.7-3.1-.2-.3c-.8-1.3-1.2-2.8-1.2-4.3 0-4.6 3.7-8.3 8.3-8.3s8.3 3.7 8.3 8.3-3.7 8.3-8.3 8.3z"/>
  </svg>
)
const Calendar = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <rect x="2" y="3" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
    <path d="M2 6.5h12M5 1.5v3M11 1.5v3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
)
const ChatIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
  </svg>
)
const LineIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.365 9.89c.396 0 .708.32.708.71 0 .39-.312.706-.708.706h-1.962v1.257h1.962c.395 0 .708.318.708.708 0 .39-.313.71-.708.71h-2.67a.71.71 0 0 1-.706-.71V8.108a.71.71 0 0 1 .706-.708h2.67c.395 0 .708.32.708.71 0 .39-.313.708-.708.708h-1.962V9.89h1.962zm-3.96 3.39a.71.71 0 0 1-.708.71.703.703 0 0 1-.572-.286l-2.733-3.72v3.296a.71.71 0 0 1-.708.71.71.71 0 0 1-.708-.71V8.108c0-.305.197-.575.488-.673a.694.694 0 0 1 .795.247l2.745 3.72V8.108c0-.39.317-.708.713-.708.39 0 .708.318.708.708v5.172zm-6.86 0a.71.71 0 0 1-.71.71.71.71 0 0 1-.706-.71V8.108a.71.71 0 0 1 .708-.708.71.71 0 0 1 .71.708v5.172zm-2.43.71h-2.67a.71.71 0 0 1-.71-.71V8.108a.71.71 0 0 1 .71-.708.71.71 0 0 1 .71.708v4.464h1.962c.39 0 .708.317.708.708 0 .39-.317.71-.71.71M22.41 10C22.41 5.272 17.673 1.42 12 1.42 6.327 1.42 1.59 5.272 1.59 10c0 4.24 3.794 7.792 8.92 8.464.348.075.82.23.94.526.107.27.07.694.034.97l-.152.91c-.046.27-.215 1.054.923.575 1.137-.479 6.135-3.61 8.37-6.183 1.541-1.689 2.28-3.404 2.28-5.262"/>
  </svg>
)
const MailIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="5" width="18" height="14" rx="2"/>
    <path d="M3 7l9 6 9-6"/>
  </svg>
)
const LinkedInIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 0h-14c-2.76 0-5 2.24-5 5v14c0 2.76 2.24 5 5 5h14c2.76 0 5-2.24 5-5v-14c0-2.76-2.24-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.27c-.97 0-1.75-.78-1.75-1.73s.78-1.73 1.75-1.73 1.75.78 1.75 1.73-.78 1.73-1.75 1.73zm13.5 12.27h-3v-5.6c0-1.34-.03-3.07-1.87-3.07-1.87 0-2.16 1.46-2.16 2.97v5.7h-3v-11h2.88v1.5h.04c.4-.76 1.38-1.56 2.84-1.56 3.04 0 3.6 2 3.6 4.6v6.46z"/>
  </svg>
)

// ─── Reusable ───
const Eyebrow = ({ children, style }) => (
  <span className="eyebrow" style={style}><span className="dot"></span>{children}</span>
)

const ImgCard = ({ src, alt, caption, style, className = "" }) => (
  <div className={`imgcard ${className}`} style={style}>
    <img src={src} alt={alt || caption || ""} loading="lazy" />
    {caption && <span className="caption">{caption}</span>}
  </div>
)

// ─── Nav ───
const NAV_LINKS = [
  { to: "/",         label: "Home",     exact: true },
  { to: "/about",    label: "About Us" },
  { to: "/services", label: "Services" },
  { to: "/contact",  label: "Contact" },
]

function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 8)
    window.addEventListener("scroll", fn, { passive: true })
    return () => window.removeEventListener("scroll", fn)
  }, [])

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [menuOpen])

  const close = () => setMenuOpen(false)

  const isActive = (link) => {
    if (link.anchor) return false
    if (link.exact) return location.pathname === "/"
    return location.pathname.startsWith(link.to)
  }

  return (
    <nav className={`nav ${scrolled ? "scrolled" : ""}${menuOpen ? " menu-open" : ""}`}>
      <div className="container nav-inner">
        <Link to="/" className="logo" onClick={close}>
          <img src="/assets/logo-mark-gold.jpg" alt="NC Global Assets" onError={e => e.target.style.display='none'} />
          <span className="logo-word">NC Global Assets</span>
        </Link>
        <div className="nav-links">
          {NAV_LINKS.map(l =>
            l.anchor
              ? <a key={l.to} href={l.to} className="nav-link">{l.label}</a>
              : <Link key={l.to} to={l.to} className={`nav-link${isActive(l) ? " active" : ""}`}>{l.label}</Link>
          )}
        </div>
        <div className="nav-right">
          <a href={CONFIG.calendlyUrl} target="_blank" rel="noopener" className="btn btn--primary nav-cta">
            Book a Call <Arrow />
          </a>
          <button
            className={`nav-burger${menuOpen ? " open" : ""}`}
            onClick={() => setMenuOpen(o => !o)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
          >
            <span /><span /><span />
          </button>
        </div>
      </div>
      {menuOpen && (
        <div className="nav-mobile-menu">
          <div className="nav-mobile-links">
            {NAV_LINKS.map(l =>
              l.anchor
                ? <a key={l.to} href={l.to} onClick={close}>{l.label}</a>
                : <Link key={l.to} to={l.to} onClick={close} className={isActive(l) ? "active" : ""}>{l.label}</Link>
            )}
          </div>
          <div className="nav-mobile-cta">
            <a href={CONFIG.calendlyUrl} target="_blank" rel="noopener" className="btn btn--primary" onClick={close}>
              <Calendar /> Book a Call <Arrow />
            </a>
            <button type="button" onClick={() => { openChat(); close() }} className="btn btn--ghost">
              <ChatIcon /> Chat with Us
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}

// ─── Hero ───
function Hero() {
  return (
    <section className="hero" id="top">
      <div
        className="hero-bg"
        style={{ backgroundImage: "url(/assets/hero-bkk.webp), url(/assets/bkk-daytime.webp), url(/assets/hero-bangkok.webp)" }}
      />
      <div className="hero-content container">
        <div className="hero-eyebrow-row">
          <Eyebrow style={{ color: "var(--accent)" }}>Bangkok · Local Operating Partner</Eyebrow>
          <span className="rule" />
        </div>
        <h1 className="hero-headline">
          <span className="line">Enter Thailand.</span>
          <span className="line">Skip the <span className="gold italic">hard part.</span></span>
          <span className="line gold italic">Your brand live in weeks.</span>
        </h1>
        <h2 style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', overflow: 'hidden' }}>
          Premium Real Estate &amp; Investment Management in Bangkok
        </h2>
        <div className="hero-body">
          <div className="hero-lede-col">
            <p className="lede">
              We give international brands the infrastructure, the local team and the operational base to enter Thailand. No setup from scratch. Real revenue from day one.
            </p>
          </div>
          <div className="hero-spaces">
            <div className="hero-spaces__label">What's ready for your brand</div>
            {[
              { icon: "◈", label: "Showroom", desc: "Present your brand to buyers & partners" },
              { icon: "⬡", label: "Offices", desc: "Local team base & brand management" },
              { icon: "◎", label: "Cloud Kitchen", desc: "Production-ready, live on delivery apps" },
            ].map((s, i) => (
              <div className="hero-space-item" key={i}>
                <span className="hero-space-item__dot" />
                <div>
                  <div className="hero-space-item__label">{s.label}</div>
                  <div className="hero-space-item__desc">{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="hero-stats">
        <div className="hero-stat">
          <div className="num">15<span style={{ fontSize: "0.45em", verticalAlign: "top", fontWeight: 400 }}>+</span></div>
          <div className="lbl">Years of founder<br/>& operator experience</div>
        </div>
        <div className="hero-stat">
          <div className="num">7</div>
          <div className="lbl">Brands in our<br/>active network</div>
        </div>
        <div className="hero-stat">
          <div className="num">2<span style={{ fontSize: "0.45em", verticalAlign: "top", fontWeight: 400 }}>w</span></div>
          <div className="lbl">From brief to<br/>live on delivery apps</div>
        </div>
        <div className="hero-stat">
          <div className="num">SEA</div>
          <div className="lbl">Strategic gateway<br/>to the region</div>
        </div>
      </div>
      <div className="scroll-cue">
        <span>Scroll</span>
        <span className="line" />
      </div>
    </section>
  )
}

// ─── Hero Strip ───
function HeroStrip() {
  const items = [
    { logo: "/assets/brand-salsa-logo.png", bg: "#0a0a0a", name: "Salsa Burgers", tag: "F&B · Bangkok" },
    { logo: "/assets/brand-plesh-logo.svg", bg: "#FAFAF7", name: "Plesh", tag: "Food · Wellness" },
    { logo: "/assets/brand-dadybox-logo.svg", bg: "#0B1829", name: "Dadybox", tag: "Logistics" },
    { logo: "/assets/brand-discoolver-logo.png", bg: "#f7f7ff", name: "Discoolver", tag: "Digital" },
    { logo: "/assets/brand-taykus-logo.png", bg: "#0D1829", name: "Taykus", tag: "Sport Tech" },
    { logo: "/assets/brand-padel-logo.png", bg: "#f8fff8", name: "The Padel Society", tag: "Sport · Lifestyle" },
  ]
  const track = [...items, ...items]
  return (
    <div className="hero-strip">
      <div className="hero-strip__label">Brands in our network</div>
      <div className="hero-strip__viewport">
        <div className="hero-strip__track">
          {track.map((it, i) => (
            <div className="hero-strip__card" key={i} style={{ background: it.bg }}>
              <img src={it.logo} alt={it.name} />
              <div className="hero-strip__meta">
                <span className="hero-strip__name">{it.name}</span>
                <span className="hero-strip__tag">{it.tag}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Market Stats ───
function MarketStats() {
  const stats = [
    { num: "80M+", label: "Consumers in Southeast Asia's growth corridor" },
    { num: "#1", label: "Bangkok ranked for F&B delivery density in Southeast Asia" },
    { num: "20%+", label: "Annual growth rate in Thailand's consumer market" },
    { num: "4–8", label: "Weeks to your first market test using our infrastructure" },
  ]
  return (
    <section className="market-stats">
      <div className="container">
        <div className="market-stats__header">
          <p className="market-stats__sup">Why Thailand · Why now</p>
          <h2 className="display-lg">The numbers that make <span className="italic gold">Bangkok the move</span></h2>
        </div>
        <div className="market-stats__grid">
          {stats.map((s, i) => (
            <div className="market-stats__card" key={i} data-reveal style={{ transitionDelay: `${i * 80}ms` }}>
              <div className="market-stats__num">{s.num}</div>
              <p className="market-stats__label">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Tape ───
function Tape() {
  const items = ["F&B Market Entry", "Cloud Kitchen Operations", "Brand Activation", "Local Partnerships", "Sales Channel Strategy", "Operating Partner Model"]
  const tape = [...items, ...items]
  return (
    <div className="tape">
      <div className="tape-track">
        {tape.map((t, i) => <span key={i}>{t}<span className="sep" /></span>)}
      </div>
    </div>
  )
}

// ─── Intro ───
function Intro() {
  return (
    <section className="section intro-section">
      <div className="container">
        <div className="intro-grid">
          <div className="intro-img">
            <img src="/assets/gallery-cafe.webp" alt="Modern F&B space Bangkok — Thailand market entry opportunity" loading="lazy" />
            <div className="intro-img__overlay" />
            <div className="intro-img__badge">
              <span className="intro-img__badge-city">Bangkok</span>
              <span className="intro-img__badge-label">Southeast Asia's fastest-growing market</span>
            </div>
          </div>
          <div className="intro-content">
            <Eyebrow>The Opportunity</Eyebrow>
            <p className="display-md" style={{ color: "var(--ink)", marginTop: 20 }}>
              Thailand is one of Southeast Asia's fastest-growing consumer markets — and most international brands never make it past the planning stage. Not because the opportunity isn't there. Because they try to build everything{" "}
              <span className="italic gold">from scratch, alone.</span>
            </p>
            <p className="lede" style={{ marginTop: 28 }}>
              We built the infrastructure so you don't have to. Cloud kitchen. Office. Showroom. Local team. Distribution channels. Everything you need to enter Thailand is already running — waiting for your brand.
            </p>
            <a href={CONFIG.calendlyUrl} target="_blank" rel="noopener" className="btn btn--ghost" style={{ marginTop: 36, alignSelf: "flex-start" }}>
              <Calendar size={14} /> See how it works <Arrow />
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── What We Do ───
function WhatWeDo() {
  const cards = [
    { idx: "01", title: "Test the Market", body: "Validate real demand in Bangkok before committing — pilot your product, collect customer feedback and confirm product-market fit using our infrastructure." },
    { idx: "02", title: "Build the Launch", body: "Adapt your brand for the Thai market, design your go-to-market strategy and activate the right local channels, partners and platforms from day one." },
    { idx: "03", title: "Operate & Scale", body: "Run daily operations from our Bangkok base and grow your footprint across Thailand and Southeast Asia with a local team directly invested in your results." },
  ]
  return (
    <section className="section section--surface" id="what">
      <div className="container">
        <div className="sec-header">
          <div className="lhs">
            <Eyebrow>How It Works</Eyebrow>
            <h2 className="display-lg">From market test to <span className="italic gold">full operation</span></h2>
          </div>
          <div>
            <p className="lede">Three phases. One local partner. From your first product test in Bangkok to a fully operating brand across Southeast Asia — we manage the entire journey with you.</p>
          </div>
        </div>
        <div className="process-steps">
          {cards.map((c, i) => (
            <div className="process-step" key={c.idx} data-reveal style={{ transitionDelay: `${i * 80}ms` }}>
              <div className="process-step__circle">
                <span>{c.idx}</span>
              </div>
              {i < cards.length - 1 && <div className="process-step__line" />}
              <div className="process-step__card numcard">
                <h3 className="display-sm">{c.title}</h3>
                <p className="body-text">{c.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Services Page ───
function ServicesPage() {
  useEffect(() => {
    updatePageMeta({
      title: "Services — Brand Launch, F&B Operations — NC Global Assets",
      description: "Brand representation, go-to-market planning, cloud kitchen operations, local fulfillment and market entry in Bangkok, Thailand.",
      canonical: "https://www.ncglobalassets.com/services",
    })
    window.scrollTo(0, 0)
  }, [])

  const services = [
    {
      num: "01",
      title: "Brand Representation & Action Plan",
      tag: "Strategy · Go-to-Market",
      tagline: "Enter the market with a clear roadmap — not guesswork.",
      body: "We become your official brand representative in Thailand. Before you commit a single baht to local operations, we do the groundwork — market research, competitive mapping, brand adaptation and a full go-to-market roadmap built around your specific product, price point and audience.",
      cardFeatures: [
        "Thai market research & consumer insights",
        "Brand positioning and local adaptation",
        "Go-to-market strategy and launch roadmap",
        "Local partner and channel identification",
        "Dedicated local point of contact",
      ],
      features: [
        { label: "Thai market research & consumer insights", desc: "Deep dive into local behaviour, pricing benchmarks and category dynamics." },
        { label: "Brand positioning and local adaptation", desc: "We adapt your messaging, visual identity and offer for the Thai market without losing your brand DNA." },
        { label: "Go-to-market strategy and launch roadmap", desc: "A structured plan covering channels, milestones and commercial targets for your first 90 days." },
        { label: "Local partner and channel identification", desc: "We map the right distributors, retailers and platforms for your category from day one." },
        { label: "Dedicated local point of contact", desc: "A named person on the ground representing your brand in every meeting and conversation." },
      ],
      img: "/assets/gallery-cafe.webp",
      outcome: "You leave with a validated plan and a local partner — not a deck.",
    },
    {
      num: "02",
      title: "Cloud Kitchen Operations",
      tag: "F&B · Operations · Bangkok",
      tagline: "Your food brand live in Bangkok in under two weeks.",
      body: "Operate your food brand from our fully equipped Bangkok building — cloud kitchen, office and showroom included. No Thai company registration required. No setup from scratch. We manage production, logistics and platform activation so you generate real revenue from week one.",
      cardFeatures: [
        "Fully equipped cloud kitchen in central Bangkok",
        "Office and showroom space available",
        "No Thai company registration required",
        "Live on GrabFood, Foodpanda & Lineman in days",
        "Full operations management and logistics",
        "Real sales data and customer feedback from day one",
      ],
      features: [
        { label: "Fully equipped cloud kitchen in central Bangkok", desc: "Production-ready kitchen with Thai food safety certification, equipment and operating team." },
        { label: "Live on GrabFood, Foodpanda & Lineman in days", desc: "We activate your brand on Thailand's top delivery platforms and manage your store from day one." },
        { label: "No Thai company registration required", desc: "Operate legally under our structure — no legal setup, no bureaucracy, no wasted months." },
        { label: "Office and showroom space available", desc: "Use our Bangkok base for your local team, partner meetings and brand presentations." },
        { label: "Full operations management and logistics", desc: "We handle procurement, production scheduling, quality control and daily ops." },
        { label: "Real sales data and customer feedback from day one", desc: "Weekly reporting with order volume, customer ratings and product performance data." },
      ],
      img: "/assets/ops-kitchen.webp",
      outcome: "From brief to first delivery order in under two weeks.",
      highlight: true,
    },
    {
      num: "03",
      title: "Commercial & Distribution Services",
      tag: "Sales · Distribution · Local Team",
      tagline: "Open doors that would otherwise take years to build.",
      body: "Our local commercial team works your accounts every day — opening channels, building relationships and growing your brand's revenue footprint across Bangkok and Thailand. We activate retail, HORECA and B2B partnerships that take most foreign brands years to develop alone.",
      cardFeatures: [
        "Local commercial team working your accounts",
        "Retail, HORECA and corporate channel development",
        "Supplier and distribution network activation",
        "B2B partnership development",
        "Sales performance tracking and reporting",
      ],
      features: [
        { label: "Local commercial team working your accounts", desc: "Dedicated sales professionals who represent your brand in Thai — not translators, real operators." },
        { label: "Retail, HORECA and corporate channel development", desc: "We open doors to supermarkets, specialty retailers, hotels, restaurants and corporate buyers." },
        { label: "Supplier and distribution network activation", desc: "We plug your brand into existing logistics and cold chain networks across Bangkok and beyond." },
        { label: "B2B partnership development", desc: "Strategic alliances with importers, co-packers and complementary brands for faster scale." },
        { label: "Sales performance tracking and reporting", desc: "Monthly commercial dashboards covering pipeline, conversion, channel mix and revenue." },
      ],
      img: "/assets/freepik_majestic-bangkok-skyline-_2861587919.webp",
      outcome: "Real accounts. Real revenue. A commercial team that grows with you.",
    },
  ]

  return (
    <PageShell>
      {/* ── Hero ── */}
      <section className="svc-hero">
        <div className="container">
          <Eyebrow style={{ color: "var(--accent)" }}>Our Services</Eyebrow>
          <h1 className="svc-hero__headline">
            Three ways we<br/>
            <span className="gold italic">work with you</span>
          </h1>
          <p className="svc-hero__sub">
            Whether you need market clarity, an operational base or a commercial team on the ground — we have the infrastructure and the people to make it happen in Thailand.
          </p>
          <div className="svc-hero__pills">
            {["Strategy & Roadmap", "Cloud Kitchen Operations", "Commercial & Distribution"].map((t, i) => (
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
              <h2 className="display-lg">What's <span className="italic gold">included</span></h2>
            </div>
            <div>
              <p className="lede">Three complementary services — from strategy to full operations. You can engage with one or combine all three depending on your stage and goals.</p>
            </div>
          </div>
          <div className="services-grid">
            {services.map((s, i) => (
              <div
                className={`service-card${s.highlight ? " service-card--highlight" : ""}`}
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
                <a href={`#svc-0${i + 1}`} className={`service-card__cta${s.highlight ? " btn btn--primary" : ""}`}>
                  See full detail <Arrow size={12} />
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Detailed blocks ── */}
      {services.map((s, idx) => (
        <section
          key={s.num}
          id={`svc-0${idx + 1}`}
          className={`svc-block${s.highlight ? " svc-block--accent" : idx % 2 !== 0 ? " svc-block--surface" : ""}`}
        >
          <div className="container">
            <div className={`svc-block__grid${idx % 2 !== 0 ? " svc-block__grid--rev" : ""}`}>
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

      {/* ── Compare ── */}
      <CompareSection />

      {/* ── Final CTA ── */}
      <FinalCTA />
    </PageShell>
  )
}

// ─── CTA Banner ───
function CtaBanner({ text, cta = "Book a Call" }) {
  return (
    <div className="cta-banner">
      <div className="container cta-banner__inner">
        <p className="cta-banner__text">{text}</p>
        <div className="cta-banner__btns">
          <a href={CONFIG.calendlyUrl} target="_blank" rel="noopener" className="cta-banner__btn">
            <Calendar size={14} /> {cta} <Arrow />
          </a>
          <button type="button" onClick={openChat} className="cta-banner__btn cta-banner__btn--ghost">
            <ChatIcon size={14} /> Chat with Us
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Operating Partner ───
function OperatingPartner() {
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
            <img src="/assets/gallery-delivery.webp" alt="NC Global Assets Bangkok operations" loading="lazy" />
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

// ─── Why Thailand ───
function WhyThailand() {
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
          <ImgCard src="/assets/freepik_elegant-bangkok-skyline-a_2861587914.webp" alt="Bangkok skyline — gateway to Southeast Asia expansion" caption="Bangkok Skyline" className="g1" />
          <ImgCard src="/assets/market-bkk.webp" alt="Bangkok night market — F&B Thailand brand opportunity" caption="Night Market" className="g2" />
          <ImgCard src="/assets/rooftop-bkk.webp" alt="Bangkok rooftop scene — brand launch Thailand lifestyle" caption="Rooftop Scene" className="g3" />
          <ImgCard src="/assets/freepik_sleek-bangkok-skyline-at-_2861587897.webp" alt="Bangkok city at night — vibrant consumer market Thailand" caption="City at Night" className="g4" />
          <ImgCard src="/assets/gallery-cafe.webp" alt="Modern café Bangkok — F&B market entry Thailand" caption="Modern Café" className="g5" />
          <ImgCard src="/assets/temple-bkk.webp" alt="Wat Arun Bangkok — cultural landmark Thailand brand market" caption="Wat Arun · BKK" className="g6" />
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

// ─── Infrastructure ───
function Infrastructure() {
  const blocks = [
    { num: "01", title: "Production", body: "Local food preparation, product adaptation and operational setup from day one." },
    { num: "02", title: "Sales Channels", body: "Activation across delivery platforms, retail and selected commercial partners." },
    { num: "03", title: "Market Feedback", body: "Real customer insights, sales performance data and continuous product validation." },
    { num: "04", title: "Daily Operations", body: "On-the-ground management, local coordination and growth execution." },
  ]
  return (
    <section className="section" id="infra">
      <div className="container">
        <div className="sec-header">
          <div className="lhs">
            <Eyebrow>Infrastructure</Eyebrow>
            <h2 className="display-lg">Real infrastructure<br/><span className="italic gold">Real</span> market entry</h2>
          </div>
          <div>
            <p className="lede">Our Bangkok-based operating infrastructure lets brands enter the market efficiently — without building everything from scratch on day one.</p>
          </div>
        </div>
        <div className="infra-grid">
          <div className="infra-img">
            <img src="/assets/freepik_majestic-bangkok-skyline-_2861587919.webp" alt="Bangkok business district" loading="lazy" />
          </div>
          <div>
            {blocks.map(b => (
              <div className="infra-row" key={b.num}>
                <div className="num">{b.num}</div>
                <div>
                  <div className="ttl">{b.title}</div>
                  <p className="body-text">{b.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Who We Work With ───
function WhoWeWorkWith() {
  const items = [
    { idx: "01", ttl: "F&B Thailand", sub: "Concepts with a distinct product and a real story to tell in Thailand." },
    { idx: "02", ttl: "Proven Operators", sub: "Teams with track record ready to scale their model internationally." },
    { idx: "03", ttl: "Ambitious Founders", sub: "Builders committed to a thoughtful, long-term regional expansion." },
    { idx: "04", ttl: "Strategic Projects", sub: "Ventures aligned with Thailand's lifestyle and innovation landscape." },
  ]
  return (
    <section className="section section--surface" id="partners">
      <div className="container">
        <div className="sec-header">
          <div className="lhs">
            <Eyebrow>Who We Work With</Eyebrow>
            <h2 className="display-lg">Selected brands with <span className="italic gold">real potential</span></h2>
          </div>
          <div>
            <p className="lede">We work with a curated number of brands at a time — ensuring each partnership gets real attention, local expertise and hands-on execution.</p>
          </div>
        </div>
        <div className="cards-4">
          {items.map((it, i) => (
            <div className="numcard" key={it.idx} data-reveal style={{ transitionDelay: `${i * 70}ms` }}>
              <div className="index">{it.idx}</div>
              <h3 className="display-sm">{it.ttl}</h3>
              <p className="body-text" style={{ marginTop: "auto" }}>{it.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Compare Section ───
const CHECK = "check"
const PARTIAL = "partial"
const CROSS = "cross"

function CompareSection() {
  const cols = [
    { key: "nc",       label: "NC Global",        sub: "Operating Partner",   highlight: true  },
    { key: "agency",   label: "Local Agency",      sub: "Strategy only"                        },
    { key: "dist",     label: "Import Distributor",sub: "Distribution only"                    },
    { key: "solo",     label: "On Your Own",       sub: "DIY market entry"                     },
  ]
  const rows = [
    { feature: "Operational base ready from day 1",       nc: CHECK,   agency: CROSS,   dist: CROSS,   solo: CROSS   },
    { feature: "Cloud kitchen & showroom included",        nc: CHECK,   agency: CROSS,   dist: CROSS,   solo: CROSS   },
    { feature: "No Thai company registration needed",      nc: CHECK,   agency: CROSS,   dist: PARTIAL, solo: CROSS   },
    { feature: "Live on delivery platforms in weeks",      nc: CHECK,   agency: CROSS,   dist: PARTIAL, solo: CROSS   },
    { feature: "Brand strategy & local adaptation",        nc: CHECK,   agency: CHECK,   dist: CROSS,   solo: PARTIAL },
    { feature: "Local commercial team on the ground",      nc: CHECK,   agency: PARTIAL, dist: PARTIAL, solo: CROSS   },
    { feature: "Shared commercial risk",                   nc: CHECK,   agency: CROSS,   dist: PARTIAL, solo: CROSS   },
    { feature: "Daily operations management",              nc: CHECK,   agency: CROSS,   dist: CROSS,   solo: CHECK   },
    { feature: "Path to SEA expansion",                    nc: CHECK,   agency: PARTIAL, dist: PARTIAL, solo: PARTIAL },
  ]
  const Icon = ({ type }) => {
    if (type === CHECK)   return <span className="compare-check">✓</span>
    if (type === PARTIAL) return <span className="compare-partial">~</span>
    return <span className="compare-cross">✗</span>
  }
  return (
    <section className="compare-section section">
      <div className="container">
        <div className="sec-header">
          <div className="lhs">
            <Eyebrow>How We Compare</Eyebrow>
            <h2 className="display-lg">Four ways to enter<br/><span className="italic gold">Thailand</span></h2>
          </div>
          <div>
            <p className="lede">Most paths to Thailand require years of groundwork, legal setup and local trial-and-error. NC Global is the only model where your brand is operational from week one.</p>
          </div>
        </div>
        <div className="compare-table">
          <div className="compare-head compare-head--4">
            <div className="compare-head__feature" />
            {cols.map(c => (
              <div key={c.key} className={`compare-head__col${c.highlight ? " compare-head__nc" : " compare-head__other"}`}>
                <span className="compare-head__label">{c.label}</span>
                <span className="compare-head__sub">{c.sub}</span>
              </div>
            ))}
          </div>
          {rows.map((r, i) => (
            <div className="compare-row compare-row--4" key={i}>
              <div className="compare-row__feature">{r.feature}</div>
              <div className="compare-row__nc"><Icon type={r.nc} /></div>
              <div className="compare-row__other"><Icon type={r.agency} /></div>
              <div className="compare-row__other"><Icon type={r.dist} /></div>
              <div className="compare-row__other"><Icon type={r.solo} /></div>
            </div>
          ))}
        </div>
        <div className="compare-legend">
          <span><span className="compare-check">✓</span> Included</span>
          <span><span className="compare-partial">~</span> Partial / limited</span>
          <span><span className="compare-cross">✗</span> Not included</span>
        </div>
        <div className="compare-footer">
          <p className="small">We onboard a limited number of brands per quarter.</p>
        </div>
      </div>
    </section>
  )
}

// ─── Our Model ───
function OurModel() {
  const blocks = [
    { ttl: "Operational Setup", body: "Local infrastructure, kitchen capacity and channel activation — ready from day one." },
    { ttl: "Local Execution", body: "Hands-on management of operations, sales, brand and customer experience in Bangkok." },
    { ttl: "Shared Growth", body: "Aligned commercial models — fixed structures, performance-based, revenue share or equity." },
  ]
  return (
    <section className="section" id="model">
      <div className="container">
        <div className="sec-header">
          <div className="lhs">
            <Eyebrow>Our Model</Eyebrow>
            <h2 className="display-lg">A partnership built around <span className="italic gold">shared growth</span></h2>
          </div>
          <div>
            <p className="lede" style={{ marginBottom: 20 }}>
              We combine operational capacity with long-term alignment. Our commercial agreements are structured around the specific needs of each brand and project.
            </p>
            <p style={{ fontFamily: "var(--font-display)", fontSize: "clamp(18px,2vw,24px)", fontStyle: "italic", fontWeight: 600, color: "var(--ink)", borderLeft: "3px solid var(--accent)", paddingLeft: 16, lineHeight: 1.4 }}>
              We aim to be the local partner that makes your brand grow in Thailand.
            </p>
          </div>
        </div>
        <div className="cards-3">
          {blocks.map((b, i) => (
            <div className="numcard" key={i}>
              <div className="index">0{i + 1}</div>
              <h3 className="display-sm">{b.ttl}</h3>
              <p className="body-text" style={{ marginTop: "auto" }}>{b.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Ecosystem ───
function Ecosystem() {
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
            <Eyebrow>Ecosystem</Eyebrow>
            <h2 className="display-lg">A <span className="italic" style={{ color: "var(--accent)" }}>trusted</span> local ecosystem</h2>
          </div>
          <div>
            <p className="lede">We collaborate with selected partners across food innovation, entrepreneurship, marketing, business development and international expansion.</p>
          </div>
        </div>
        <div className="logo-grid">
          {partners.map((p, i) => (
            <div className="logo-cell" key={i}>
              {p.logo
                ? <img src={p.logo} alt={p.name} className={`partner-logo${p.inv ? ' inv' : ''}`} />
                : p.name
              }
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Brands ───
function BrandsProjects() {
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
            <Eyebrow>Brands & Projects</Eyebrow>
            <h2 className="display-lg">Brands in our <span className="italic gold">network</span></h2>
          </div>
          <div>
            <p className="lede">A curated portfolio across F&B, sustainability, sport, lifestyle and digital innovation — each with a real story and a real ambition.</p>
          </div>
        </div>
        <div className="brand-grid">
          {brands.map((b, i) => (
            <div className="brand-card" key={i} data-reveal style={{ transitionDelay: `${(i % 4) * 60}ms` }}>
              <div className="img is-logo" style={{ background: b.bg }}>
                <img src={b.logo} alt={b.name} loading="lazy" />
              </div>
              <div className="meta">
                <div className="name">{b.name}</div>
                <div className="tag">{b.tag}</div>
              </div>
              <div className="desc">{b.desc}</div>
              {b.caseStudy && (
                <Link to={b.caseStudy} className="brand-card__cs-link">
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

// ─── Testimonials ───
function Testimonials() {
  const tms = [
    {
      q: "We went from brief to live on GrabFood in under two weeks. NC Global gave us the kitchen, the team and the delivery activation — we focused entirely on the product. Real orders from day one.",
      name: "Carlos Jacoste",
      a: "Founder · Salsa Burgers",
      img: "/assets/carlos-dark.jpg",
    },
    {
      q: "What sets them apart is that they operate, not just advise. We had a local team representing our brand in Bangkok from the first week — that changes the entire dynamic of entering a new market.",
      name: "Founder",
      a: "The Padel Society · Sport & Lifestyle",
      img: null,
    },
    {
      q: "NC Global already had the infrastructure, the platforms and the relationships in place. We walked into a running system instead of building one from zero. That's months of groundwork we didn't have to do.",
      name: "Founder",
      a: "Souji · Food & Wellness",
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
          {tms.map((t, i) => (
            <div className="tmbox" key={i} data-reveal style={{ transitionDelay: `${i * 100}ms` }}>
              <div>
                <div className="tm-attr">— {t.name}, {t.a}</div>
                {t.img
                  ? <img src={t.img} alt={t.name} style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", marginTop: 16, border: "1.5px solid var(--accent)" }} />
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

// ─── Team ───
function Team() {
  return (
    <section className="section" id="team">
      <div className="container">
        <div className="sec-header">
          <div className="lhs">
            <Eyebrow>The Team</Eyebrow>
            <h2 className="display-lg">Led by operators entrepreneurs and <span className="italic gold">market builders</span></h2>
          </div>
          <div />
        </div>
        <div className="team-grid">
          <div className="team-card">
            <div className="portrait">
              <img src="/assets/carlos-dark.jpg" alt="Carlos Jacoste" onError={e => { e.target.style.display='none' }} />
              <div className="portrait__tint" />
            </div>
            <div className="role">Founder & Operating Partner</div>
            <div className="name">Carlos Jacoste</div>
            <p className="bio">Entrepreneur and founder of Startups Factory — 15+ years in startups, open innovation, digital growth and international expansion. Worked with ICEX, Playtomic and other innovation-driven ventures.</p>
            <a className="team-link" href="https://th.linkedin.com/in/carlosjacoste" target="_blank" rel="noopener">
              <LinkedInIcon /> Connect on LinkedIn <Arrow />
            </a>
          </div>
          <div className="team-card">
            <div className="portrait">
              <img src="/assets/nirada-dark.jpg" alt="Nirada Kritsanaseranee" onError={e => { e.target.style.display='none' }} />
              <div className="portrait__tint" />
            </div>
            <div className="role">Director of Marketing</div>
            <div className="name">Nirada Kritsanaseranee</div>
            <p className="bio">Digital marketing director with 6+ years of experience leading paid media, brand activation and go-to-market strategies for companies entering new markets. Deep understanding of the Thai consumer — connecting strategy, content and local execution.</p>
            <a className="team-link" href="https://th.linkedin.com/in/nirada-k" target="_blank" rel="noopener">
              <LinkedInIcon /> Connect on LinkedIn <Arrow />
            </a>
          </div>
        </div>
        <p className="display-md" style={{ marginTop: 80, maxWidth: 860, color: "var(--ink)" }}>
          Together, the team combines international business vision with <span className="italic gold">local execution capacity</span> in Thailand.
        </p>
      </div>
    </section>
  )
}

// ─── FAQ ───
function FAQ() {
  const [open, setOpen] = useState(null)
  const toggle = i => setOpen(open === i ? null : i)
  const items = [
    { q: "What markets do you focus on?", a: "We focus exclusively on Thailand, with Bangkok as our primary operating base. From Bangkok, brands can build a foundation for a wider Southeast Asian expansion." },
    { q: "Do you only work with F&B brands?", a: "F&B is our strongest vertical, but we work with selected brands across lifestyle, sustainability, sport and digital platforms. The key criterion is whether your brand has a differentiated product and a real ambition to grow in Thailand." },
    { q: "How does the partnership model work?", a: "We work alongside brands as a local operating partner — not an external consultant. Agreements are structured as fixed models, performance-based fees, revenue share or equity participation depending on the project." },
    { q: "Can I test the market before fully committing?", a: "Absolutely. Market validation is one of the first phases we support. We run real sales pilots, gather customer feedback and validate product-market fit in Bangkok before scaling." },
    { q: "How long does it take to launch in Thailand?", a: "A focused market test can be set up in 4–8 weeks using our existing infrastructure. A full market launch typically takes 3–6 months depending on the complexity of your product and model." },
    { q: "How do I get started?", a: "Book a call or send us a brief through the contact form. We will review your brand, understand your goals and come back with a clear view of how we can support your Thailand entry." },
  ]
  return (
    <section className="section" id="faq">
      <div className="container">
        <div className="sec-header">
          <div className="lhs">
            <Eyebrow>FAQ</Eyebrow>
            <h2 className="display-lg">Frequently asked <span className="italic gold">questions</span></h2>
          </div>
          <div>
            <p className="lede">Everything you need to know about working with NC Global Assets and entering the Thai market.</p>
          </div>
        </div>
        <div className="faq-list">
          {items.map((item, i) => (
            <div className="faq-item" key={i}>
              <button className={`faq-trigger${open === i ? " open" : ""}`} onClick={() => toggle(i)} aria-expanded={open === i}>
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

// ─── Lead Magnet / Email Capture ───
function LeadMagnet() {
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [status, setStatus] = useState("idle") // idle | sending | done | error

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !name) return
    setStatus("sending")
    try {
      const res = await fetch("https://formsubmit.co/ajax/contact@ncglobalassets.com", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          name,
          email,
          _subject: `New checklist request — ${name}`,
          _template: "table",
          source: "Bangkok Brand Entry Checklist",
        }),
      })
      const data = await res.json()
      setStatus(data.success === "true" || res.ok ? "done" : "error")
    } catch {
      setStatus("error")
    }
  }

  const points = [
    "Market validation checklist before you commit",
    "The 5 setup mistakes foreign brands make in Bangkok",
    "Platform activation guide: GrabFood, Foodpanda & Lineman",
    "Local partner evaluation framework",
    "90-day launch timeline template",
  ]

  return (
    <section className="lm-section" id="checklist">
      <div className="container">
        <div className="lm-grid">
          <div className="lm-left">
            <Eyebrow style={{ color: "var(--accent)" }}>Free Resource</Eyebrow>
            <h2 className="display-lg" style={{ marginTop: 16 }}>
              The Bangkok<br/>
              <span className="italic gold">Brand Entry</span><br/>
              Checklist.
            </h2>
            <p className="lede" style={{ marginTop: 20 }}>
              Everything you need to validate, plan and launch your brand in Thailand — in a single practical guide. Used internally by every brand we onboard.
            </p>
            <ul className="lm-points">
              {points.map((p, i) => (
                <li key={i}><span className="tick-sm" /><span>{p}</span></li>
              ))}
            </ul>
          </div>
          <div className="lm-right">
            {status === "done" ? (
              <div className="lm-success">
                <div className="lm-success__icon">✓</div>
                <p className="lm-success__title">You're on the list.</p>
                <p className="lm-success__sub">Check your inbox — we'll send the checklist shortly. Or download it directly below.</p>
              <a href="/downloads/bangkok-brand-entry-checklist.pdf" download style={{ display: "inline-block", marginTop: 16, fontSize: 13, color: "var(--accent)", fontFamily: "var(--font-mono)", textDecoration: "underline" }}>↓ Download PDF now</a>
              </div>
            ) : (
              <form className="lm-form" onSubmit={handleSubmit} noValidate>
                <p className="lm-form__label">Get the free checklist</p>
                <input
                  className="lm-input"
                  type="text"
                  placeholder="Your first name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  autoComplete="given-name"
                />
                <input
                  className="lm-input"
                  type="email"
                  placeholder="Work email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
                <button
                  type="submit"
                  className="btn btn--primary lm-btn"
                  disabled={status === "sending"}
                >
                  {status === "sending" ? "Sending…" : <>Send me the checklist <Arrow /></>}
                </button>
                {status === "error" && (
                  <p style={{ fontSize: 12, color: "var(--accent)", marginTop: 8 }}>
                    Something went wrong. Email us directly at contact@ncglobalassets.com
                  </p>
                )}
                <p className="lm-privacy">No spam. Unsubscribe at any time.</p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Dual Final CTA ───
function FinalCTA() {
  return (
    <div className="dual-cta">
      <div className="dual-cta__ready">
        <div className="dual-cta__ready-bg" style={{ backgroundImage: "url(/assets/cta-pool.webp)" }} />
        <div className="dual-cta__ready-content">
          <Eyebrow style={{ color: "rgba(255,255,255,0.5)" }}>Next Step</Eyebrow>
          <h2 className="display-lg" style={{ color: "#fff" }}>
            Your brand<br/>
            Bangkok<br/>
            <span style={{ color: "var(--accent)", fontStyle: "italic" }}>Let's build it</span>
          </h2>
          <p className="lede" style={{ color: "rgba(255,255,255,0.7)", maxWidth: "38ch" }}>
            Book a call with our team. We'll assess your brand and outline exactly how to enter Thailand — infrastructure, timeline and commercial model included.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 16, alignItems: "flex-start" }}>
            <a href={CONFIG.calendlyUrl} target="_blank" rel="noopener" className="btn btn--primary">
              <Calendar size={14} /> Book a Call <Arrow />
            </a>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)" }}>
                Limited spots per quarter
              </p>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)" }}>
                Transparent model · Pricing shared in the first call
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="dual-cta__notready">
        <div className="dual-cta__notready-icon">
          <span style={{ fontSize: 28, opacity: 0.6 }}>→</span>
        </div>
        <Eyebrow>Still exploring?</Eyebrow>
        <h2 className="display-lg">Let's talk<br/><span className="italic gold">before you decide</span></h2>
        <p className="lede">Not sure if Thailand is the right move yet? No pressure. We're happy to have an honest conversation about your brand, your goals and what market entry could realistically look like.</p>
        <div className="dual-cta__btn-row">
          <button type="button" onClick={openChat} className="btn btn--ghost">
            <ChatIcon /> Chat with Us <Arrow />
          </button>
          <a href="#contact" className="btn btn--ghost" style={{ borderColor: "rgba(255,255,255,0.15)" }}>
            Send a Brief <Arrow />
          </a>
        </div>
        <p className="small" style={{ marginTop: 16, color: "var(--muted)" }}>We reply from Bangkok within 24 hours.</p>
      </div>
    </div>
  )
}

// ─── Contact Form ───
function ContactForm({ embedded }) {
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState({ name: "", company: "", email: "", web: "", country: "", sector: "", looking: "" })
  const [touched, setTouched] = useState({})
  const update = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const valid = form.name && form.email.includes("@") && form.company
  const submit = async (e) => {
    e.preventDefault()
    setTouched({ name: true, email: true, company: true })
    if (!valid) return
    await fetch("https://formspree.io/f/xqewnrwl", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(form),
    })
    setSubmitted(true)
  }

  const formContent = submitted ? (
    <div style={{ textAlign: "center", paddingBlock: 60 }}>
      <Eyebrow>Message sent</Eyebrow>
      <h2 className="display-lg" style={{ marginTop: 28, marginBottom: 20 }}>
        Thank you, {form.name.split(" ")[0]}.<br/>
        <span className="italic gold">We'll be in touch shortly.</span>
      </h2>
      <p className="lede">We typically reply within one business day from Bangkok.</p>
      <div style={{ marginTop: 32 }}>
        <button onClick={openChat} className="btn btn--ghost"><ChatIcon /> Continue the conversation <Arrow /></button>
      </div>
    </div>
  ) : (
    <form onSubmit={submit} className="simple-form">
      <div className="simple-form__row">
        <div className="simple-form__field">
          <label className="simple-form__label">Full Name <span className="simple-form__req">*</span></label>
          <input className="simple-form__input" placeholder="e.g. María García" value={form.name}
            onChange={e => update("name", e.target.value)}
            onBlur={() => setTouched(t => ({ ...t, name: true }))} />
          {touched.name && !form.name && <span className="simple-form__error">Please enter your name</span>}
        </div>
        <div className="simple-form__field">
          <label className="simple-form__label">Email <span className="simple-form__req">*</span></label>
          <input className="simple-form__input" type="email" placeholder="you@brand.com" value={form.email}
            onChange={e => update("email", e.target.value)}
            onBlur={() => setTouched(t => ({ ...t, email: true }))} />
          {touched.email && !form.email.includes("@") && <span className="simple-form__error">Please enter a valid email</span>}
        </div>
      </div>
      <div className="simple-form__row">
        <div className="simple-form__field">
          <label className="simple-form__label">Brand / Company <span className="simple-form__req">*</span></label>
          <input className="simple-form__input" placeholder="Your brand or company name" value={form.company}
            onChange={e => update("company", e.target.value)} />
        </div>
        <div className="simple-form__field">
          <label className="simple-form__label">Country</label>
          <input className="simple-form__input" placeholder="Where are you based?" value={form.country}
            onChange={e => update("country", e.target.value)} />
        </div>
      </div>
      <div className="simple-form__field">
        <label className="simple-form__label">What brings you to Thailand?</label>
        <div className="simple-form__options">
          {["Test my brand in Thailand", "Find local partners", "Launch operations", "Explore F&B market entry", "Other"].map(opt => (
            <button type="button" key={opt}
              className={`simple-form__option${form.looking === opt ? " active" : ""}`}
              onClick={() => update("looking", opt)}>
              {opt}
            </button>
          ))}
        </div>
      </div>
      <div className="simple-form__field">
        <label className="simple-form__label">Anything else you'd like to share? <span style={{ color: "var(--muted)", fontWeight: 400 }}>(optional)</span></label>
        <textarea className="simple-form__input simple-form__textarea"
          placeholder="Tell us about your brand, goals or timeline…"
          value={form.web} onChange={e => update("web", e.target.value)} rows={3} />
      </div>
      <div className="simple-form__footer">
        <p className="simple-form__legal">We never share your details. You'll hear from us within 24h.</p>
        <button type="submit" className="btn btn--primary btn--lg" disabled={!valid}
          style={!valid ? { opacity: 0.4, cursor: "not-allowed" } : {}}>
          Send Message <Arrow />
        </button>
      </div>
    </form>
  )

  if (embedded) return formContent
  return (
    <section className="section" id="contact">
      <div className="container">{formContent}</div>
    </section>
  )
}

// ─── Footer ───
function Footer() {
  const [email, setEmail] = useState("")
  const [subDone, setSubDone] = useState(false)
  const handleSub = e => { e.preventDefault(); if (email.includes("@")) setSubDone(true) }
  return (
    <footer className="footer">
      <div className="footer-accent-bar" />
      <div className="container">
        <div className="footer-newsletter">
          <div className="footer-newsletter__copy">
            <h3>Stay up to date</h3>
            <p>Market insights, brand stories and updates from Bangkok.</p>
          </div>
          {subDone ? (
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--accent)" }}>✓ You're on the list.</p>
          ) : (
            <form className="footer-newsletter__form" onSubmit={handleSub}>
              <input className="footer-newsletter__input" type="email" placeholder="your@brand.com" value={email} onChange={e => setEmail(e.target.value)} />
              <button type="submit" className="footer-newsletter__btn">Subscribe <Arrow size={12} /></button>
            </form>
          )}
        </div>
        <div className="footer-grid">
          <div>
            <div className="footer-logo">
              <img src="/assets/logo-gold.jpg" alt="NC Global Assets" onError={e => e.target.style.display='none'} />
            </div>
            <p className="footer-brand__desc">
              A local operating partner helping international brands enter and grow in Thailand.
            </p>
            <div className="footer-social">
              <a href="https://linkedin.com/company/ncglobalassets" target="_blank" rel="noopener" className="footer-social__link" aria-label="LinkedIn">
                <LinkedInIcon size={15} />
              </a>
            </div>
          </div>
          <div>
            <div className="footer-col-label">Contact</div>
            <div className="footer-links">
              <a href={CONFIG.calendlyUrl} target="_blank" rel="noopener">Book a Call</a>
              <Link to="/contact">Contact Us</Link>
            </div>
          </div>
          <div>
            <div className="footer-col-label">Office</div>
            <div className="footer-links">
              <span>507/10 Sathu Pradit Rd</span>
              <span>Chong Nonsi, Yan Nawa</span>
              <span>Bangkok 10120, Thailand</span>
              <a href={`tel:${CONFIG.phone}`} style={{ marginTop: 8, color: "var(--accent)" }}>{CONFIG.phoneDisplay}</a>
              <a href={`mailto:${CONFIG.email}`} style={{ color: "var(--accent)" }}>{CONFIG.email}</a>
              <span style={{ marginTop: 6, fontSize: 12, color: "var(--muted)" }}>Mon–Sat · 10:00–18:00 (ICT)</span>
            </div>
          </div>
          <div>
            <div className="footer-col-label">Navigation</div>
            <div className="footer-links">
              <Link to="/">Home</Link>
              <Link to="/about">About Us</Link>
              <Link to="/services">Services</Link>
              <Link to="/contact">Contact</Link>
            </div>
          </div>
        </div>
        <div className="footer-copy">
          <span>© 2026 NC Global Assets</span>
          <span>Bangkok · 13.7563°N 100.5018°E</span>
        </div>
      </div>
    </footer>
  )
}

// ─── Float Chat ───
function FloatingChat() {
  return (
    <button type="button" className="float-wa" onClick={openChat}>
      <ChatIcon size={16} /> Chat with Us
    </button>
  )
}

// ─── Chat Modal ───
function ChatWithUsModal() {
  const [open, setOpen] = useState(false)
  const links = getContactLinks()
  useEffect(() => {
    const onOpen = () => setOpen(true)
    window.addEventListener("nc:openchat", onOpen)
    return () => window.removeEventListener("nc:openchat", onOpen)
  }, [])
  useEffect(() => {
    const onKey = e => { if (e.key === "Escape") setOpen(false) }
    window.addEventListener("keydown", onKey)
    document.body.style.overflow = open ? "hidden" : ""
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = "" }
  }, [open])
  if (!open) return null
  const channels = [
    { id: "whatsapp", label: "WhatsApp", sub: "Quick reply, usually within an hour", href: links.whatsapp, icon: <WhatsAppIcon size={20} />, accent: "oklch(0.7 0.18 145)" },
    { id: "line", label: "LINE", sub: "Preferred messenger in Thailand", href: links.line, icon: <LineIcon size={20} />, accent: "oklch(0.72 0.18 145)" },
    { id: "form", label: "Send a brief", sub: "Tell us about your brand in detail", href: "#contact", icon: <MailIcon size={20} />, accent: "var(--accent)" },
  ]
  return (
    <div className="chat-modal" onClick={() => setOpen(false)}>
      <div className="chat-modal__sheet" onClick={e => e.stopPropagation()}>
        <div className="chat-modal__head">
          <div>
            <Eyebrow style={{ color: "var(--accent)" }}>Chat with the team</Eyebrow>
            <h3 className="chat-modal__title">How would you like to reach us?</h3>
            <p className="chat-modal__sub">Pick the channel you prefer. We reply in English, Spanish or Thai.</p>
          </div>
          <button className="chat-modal__close" onClick={() => setOpen(false)} aria-label="Close">×</button>
        </div>
        <div className="chat-options">
          {channels.map((c, i) => (
            <a key={c.id} href={c.href} target={c.id === "form" ? "_self" : "_blank"} rel="noopener" className="chat-option"
              onClick={() => setOpen(false)} style={{ animationDelay: `${i * 60}ms` }}>
              <span className="chat-option__icon" style={{ color: c.accent }}>{c.icon}</span>
              <span className="chat-option__body">
                <span className="chat-option__label">{c.label}</span>
                <span className="chat-option__sub">{c.sub}</span>
              </span>
              <Arrow />
            </a>
          ))}
        </div>
        <div className="chat-modal__foot">
          <span>Mon–Fri · Bangkok hours · Replies within 24h</span>
          <a href="#contact" onClick={() => setOpen(false)}>Schedule a call →</a>
        </div>
      </div>
    </div>
  )
}

// ─── Scroll Reveal ───
function useScrollReveal() {
  const location = useLocation()
  useEffect(() => {
    const els = document.querySelectorAll('[data-reveal]')
    const io = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('revealed'); io.unobserve(e.target) } }),
      { threshold: 0.12 }
    )
    els.forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [location.pathname])
}

// ─── Page wrapper ───
function PageShell({ children }) {
  useScrollReveal()
  useEffect(() => { window.scrollTo(0, 0) }, [])
  return <>{children}</>
}

// ─── Home Page ───
function HomePage() {
  return (
    <PageShell>
      <Hero />
      <HeroStrip />
      <Tape />
      <Intro />
      <MarketStats />
      <WhatWeDo />
      <CtaBanner text="Ready to test your brand in Bangkok? Let's talk." />
      <OperatingPartner />
      <WhyThailand />
      <Infrastructure />
      <WhoWeWorkWith />
      <OurModel />
      <Ecosystem />
      <BrandsProjects />
      <CtaBanner text="We work with a limited number of selected brands." cta="Start the conversation" />
      <FAQ />
    </PageShell>
  )
}

// ─── About: Story ───
function AboutStory() {
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

// ─── About: Manifesto ───
function AboutManifesto() {
  const pillars = [
    { num: "01", label: "Real infrastructure", icon: "◈", desc: "We operate from our own building in Bangkok — cloud kitchen, offices and showroom. No setup time. No rental risk. Everything is already running from day one." },
    { num: "02", label: "Local execution", icon: "⬡", desc: "A bilingual team on the ground that speaks Thai, knows the market and executes alongside your brand every single day — not a remote advisor team." },
    { num: "03", label: "Long-term alignment", icon: "◎", desc: "Structured as partners, not service providers. Our commercial agreements are tied to your results — we grow when you grow." },
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
              We don't advise<br/><span className="gold italic">We operate</span>
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

// ─── About: Numbers ───
function AboutNumbers() {
  const stats = [
    { value: "15+", label: "Years of founder & operator experience in startups and international expansion" },
    { value: "6+",  label: "Years of Digital Marketing expertise driving brands in the Thai market" },
    { value: "4–8w", label: "From brief to first revenue using our Bangkok infrastructure" },
    { value: "SEA",  label: "Strategic gateway — Thailand as your launchpad for Southeast Asia" },
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

// ─── About: Values ───
function AboutValues() {
  const values = [
    { label: "Local first", desc: "Every decision starts from a deep understanding of Thailand — its consumers, its culture and its business dynamics." },
    { label: "Execution over advice", desc: "We don't write strategies that gather dust. We implement them, track them and improve them on the ground." },
    { label: "Honest partnership", desc: "We tell you what will work and what won't. No overselling, no generic playbooks — just clear, honest guidance." },
    { label: "Shared accountability", desc: "Our commercial models are tied to your performance. If you don't win, we don't win. That keeps us focused." },
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
            <p className="lede">These aren't wall posters. They are the criteria we use to decide who we work with, how we price our services and whether a partnership is working.</p>
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

// ─── About: Approach ───
function AboutApproach() {
  const phases = [
    { num: "01", label: "Understand", time: "Week 1–2", desc: "We start by learning your brand deeply — product, positioning, goals and real constraints. We do market mapping, competitive research and consumer analysis specific to your category in Thailand. No generic playbooks. No assumptions." },
    { num: "02", label: "Test", time: "Week 3–6", desc: "We run a real market pilot in Bangkok using our existing infrastructure. Your product reaches real customers through our cloud kitchen and delivery channels. We collect data, ratings and feedback before you commit to full scale." },
    { num: "03", label: "Build", time: "Month 2–6", desc: "Once validated, we build the full operational foundation — local team, sales channels, distribution partners and commercial systems. We grow your brand's footprint across Bangkok and into Southeast Asia with clear performance milestones." },
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
            <p className="lede">We don't hand off deliverables and disappear. We work alongside your brand through every step — from first conversation to full commercial operation.</p>
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

// ─── About Page ───
function AboutPage() {
  useEffect(() => {
    updatePageMeta({
      title: "About — NC Global Assets",
      description: "Local operating partner for international brands in Thailand. 15+ years Bangkok experience, hands-on execution and market expertise.",
      canonical: "https://www.ncglobalassets.com/about",
    })
    window.scrollTo(0, 0)
  }, [])

  return (
    <PageShell>
      {/* Hero */}
      <section className="about-hero">
        <div className="about-hero__bg" style={{ backgroundImage: "url(/assets/freepik_elegant-bangkok-skyline-a_2861587914.webp)" }} />
        <div className="container">
          <div className="about-hero__inner--full">
            <Eyebrow style={{ color: "var(--accent)" }}>About NC Global Assets</Eyebrow>
            <h1 className="about-hero__headline">
              A local operating partner<br/>built for <span className="gold italic">international brands</span>
            </h1>
            <p className="about-hero__body">
              We combine deep local knowledge, hands-on execution and long-term commercial alignment to help international brands enter, operate and grow in Thailand.
            </p>
            <div className="about-hero__creds">
              <div className="about-hero__cred">
                <span className="about-hero__cred-val">BKK</span>
                <span className="about-hero__cred-label">Operating base</span>
              </div>
              <div className="about-hero__cred">
                <span className="about-hero__cred-val">15+</span>
                <span className="about-hero__cred-label">Years exp.</span>
              </div>
              <div className="about-hero__cred">
                <span className="about-hero__cred-val">6+</span>
                <span className="about-hero__cred-label">Years digital mktg</span>
              </div>
              <div className="about-hero__cred">
                <span className="about-hero__cred-val">SEA</span>
                <span className="about-hero__cred-label">Reach</span>
              </div>
            </div>
          </div>
        </div>
        <div className="about-hero__sep" />
      </section>

      <AboutStory />
      <AboutManifesto />
      <AboutNumbers />
      <AboutValues />
      <AboutApproach />
      <Team />
      <Testimonials />
      <CtaBanner text="Ready to explore working together?" cta="Book a Call" />
    </PageShell>
  )
}

// ─── Contact Page ───
function ContactPage() {
  useEffect(() => {
    updatePageMeta({
      title: "Contact — NC Global Assets",
      description: "Get in touch to discuss your Thailand expansion. Reach out via phone, email, WhatsApp or LINE. Bangkok-based operating partner.",
      canonical: "https://www.ncglobalassets.com/contact",
    })
    window.scrollTo(0, 0)
  }, [])

  const links = getContactLinks()
  return (
    <PageShell>
      {/* Hero split */}
      <section className="page-hero">
        <div className="container">
          <div className="page-hero__inner">
            {/* Left — headline */}
            <div>
              <Eyebrow style={{ color: "var(--accent)" }}>Get in touch</Eyebrow>
              <h1 className="page-hero__headline">
                Let's build your<br/>
                <span className="italic gold">Thailand growth</span>
              </h1>
              <p className="page-hero__sub">
                Tell us about your brand, goals, and expansion plans. Our team will get back to you shortly with clear next steps.
              </p>
            </div>
            <div className="page-hero__divider" />
            {/* Right — contact info */}
            <div className="page-hero__right">
              <div className="contact-direct">
                <a href={`tel:${CONFIG.phone}`} className="contact-direct__item">
                  <span className="contact-direct__icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.5 10.91 19.79 19.79 0 01.46 2.28 2 2 0 012.44.1h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.18 6.18l.91-.91a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 15.42v1.5z"/></svg>
                  </span>
                  <div>
                    <div className="contact-direct__label">Phone</div>
                    <div className="contact-direct__val">{CONFIG.phoneDisplay}</div>
                  </div>
                </a>
                <a href={`mailto:${CONFIG.email}`} className="contact-direct__item">
                  <span className="contact-direct__icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>
                  </span>
                  <div>
                    <div className="contact-direct__label">Email</div>
                    <div className="contact-direct__val">{CONFIG.email}</div>
                  </div>
                </a>
                <div className="contact-direct__item contact-direct__item--text">
                  <span className="contact-direct__icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                  </span>
                  <div>
                    <div className="contact-direct__label">Office Hours</div>
                    <div className="contact-direct__val">Mon–Sat · 10:00–18:00 (ICT)</div>
                  </div>
                </div>
                <div className="contact-direct__item contact-direct__item--text">
                  <span className="contact-direct__icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  </span>
                  <div>
                    <div className="contact-direct__label">Office</div>
                    <div className="contact-direct__val" style={{ fontSize: 14 }}>507/10 Sathu Pradit Rd, Chong Nonsi, Yan Nawa, Bangkok 10120, Thailand</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Form section with sidebar */}
      <section className="contact-form-section">
        <div className="container">
          <div className="contact-form-grid">
            {/* Aside */}
            <div className="contact-form-aside">
              <p className="contact-form-aside__body">
                Fill in the form and we'll come back with a clear view of how NC Global Assets can support your brand's entry into Thailand — infrastructure, timeline and commercial model included.
              </p>
              <div className="contact-trust-items">
                {[
                  "We reply within one business day from Bangkok",
                  "No commitment required for a first conversation",
                  "We work with a limited number of brands per quarter",
                  "English, Spanish and Thai spoken",
                ].map((t, i) => (
                  <div className="contact-trust-item" key={i}>
                    <span className="contact-trust-dot" />
                    {t}
                  </div>
                ))}
              </div>
              <div className="contact-aside-channels">
                <p className="small" style={{ marginBottom: 12, color: "var(--muted)" }}>Prefer a direct chat?</p>
                <div className="contact-channels-row">
                  <a href={CONFIG.calendlyUrl} target="_blank" rel="noopener" className="contact-channel">
                    <Calendar size={14} /> Book a Call <Arrow size={11} />
                  </a>
                </div>
              </div>
            </div>
            {/* Form */}
            <div>
              <ContactForm embedded />
            </div>
          </div>

          {/* Company info strip */}
          <div className="contact-info-strip">
            <div className="contact-info-item">
              <span className="contact-info-item__label">Address</span>
              <span className="contact-info-item__val">507/10 Sathu Pradit Rd, Chong Nonsi, Yan Nawa, Bangkok 10120, Thailand</span>
            </div>
            <div className="contact-info-item">
              <span className="contact-info-item__label">Phone</span>
              <a href={`tel:${CONFIG.phone}`} className="contact-info-item__val">{CONFIG.phoneDisplay}</a>
            </div>
            <div className="contact-info-item">
              <span className="contact-info-item__label">Email</span>
              <a href={`mailto:${CONFIG.email}`} className="contact-info-item__val">{CONFIG.email}</a>
            </div>
            <div className="contact-info-item">
              <span className="contact-info-item__label">Office Hours</span>
              <span className="contact-info-item__val">Mon–Sat · 10:00–18:00 (ICT)</span>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  )
}

// ─── Blog List ───
function BlogListPage() {
  useEffect(() => {
    updatePageMeta({
      title: 'Blog — NC Global Assets',
      description: 'Insights on brand launch Thailand, Bangkok market entry, F&B operations and Southeast Asia expansion from NC Global Assets.',
      canonical: 'https://www.ncglobalassets.com/blog',
    })
    window.scrollTo(0, 0)
  }, [])

  return (
    <PageShell>
      <section className="section blog-hero">
        <div className="container">
          <Eyebrow>Blog</Eyebrow>
          <h1 className="display-lg">Insights from <span className="italic gold">the ground</span></h1>
          <p className="lede" style={{ maxWidth: '52ch', marginTop: 24 }}>Real experience from Bangkok. Market entry, F&B operations, brand launch and what it actually takes to grow in Thailand.</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {posts.length === 0 ? (
            <p className="lede" style={{ opacity: 0.5 }}>Posts coming soon.</p>
          ) : (
            <div className="blog-grid">
              {posts.map(post => (
                <Link key={post.slug} to={`/blog/${post.slug}`} className="blog-card">
                  {post.coverUrl && <div className="blog-card__cover" style={{ backgroundImage: `url(${post.coverUrl})` }} />}
                  <div className="blog-card__body">
                    {post.category && <span className="blog-card__cat">{post.category}</span>}
                    <h2 className="blog-card__title">{post.title}</h2>
                    {post.excerpt && <p className="blog-card__excerpt">{post.excerpt}</p>}
                    <div className="blog-card__meta">
                      {post.author && <span>{post.author}</span>}
                      {post.date && <span>{new Date(post.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </PageShell>
  )
}

// ─── Blog Post ───
function BlogPostPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const post = posts.find(p => p.slug === slug)

  useEffect(() => {
    if (!post) { navigate('/blog', { replace: true }); return }

    const canonical = `https://www.ncglobalassets.com/blog/${post.slug}`
    updatePageMeta({
      title: `${post.seoTitle || post.title} — NC Global Assets`,
      description: post.seoDescription || post.excerpt,
      canonical,
      ogType: 'article',
      ogTitle: post.seoTitle || post.title,
      ogImage: post.ogImage || post.coverUrl,
      publishedTime: post.date,
      author: post.author || 'NC Global Assets',
    })

    window.scrollTo(0, 0)
    return () => removeArticleSchema()
  }, [post, navigate])

  if (!post) return null

  const html = post.contentHtml || (post.contentMarkdown ? marked.parse(post.contentMarkdown) : '')

  return (
    <PageShell>
      <article className="section blog-post-page">
        <div className="container blog-post-container">
          <header className="blog-post-header">
            {post.category && <Eyebrow>{post.category}</Eyebrow>}
            <h1 className="display-lg" style={{ marginTop: 16, maxWidth: '18ch' }}>{post.title}</h1>
            <div className="blog-meta">
              {post.author && <span>{post.author}</span>}
              {post.date && <span>{new Date(post.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>}
            </div>
          </header>

          {post.coverUrl && (
            <div className="blog-post-cover">
              <img src={post.coverUrl} alt={post.title} loading="lazy" />
            </div>
          )}

          <div className="blog-post-body" dangerouslySetInnerHTML={{ __html: html }} />

          <div className="blog-post-cta">
            <p className="display-sm">Ready to enter Thailand?</p>
            <a href={CONFIG.calendlyUrl} target="_blank" rel="noopener" className="btn btn--primary">
              <Calendar size={14} /> Book a Call <Arrow />
            </a>
          </div>

          <div className="blog-post-back">
            <Link to="/blog" className="btn btn--ghost">← Back to Blog</Link>
          </div>
        </div>
      </article>
    </PageShell>
  )
}

// ─── Case Study: Salsa Burgers ───
function CaseStudySalsaBurgers() {
  const metrics = [
    { num: "12", unit: "days", label: "From brief to first GrabFood order" },
    { num: "3", unit: "platforms", label: "Live on GrabFood, Foodpanda & LINE MAN" },
    { num: "4.8★", unit: "", label: "Average rating after first 30 days" },
    { num: "1", unit: "building", label: "Cloud kitchen + office + showroom, day one" },
  ]
  const timeline = [
    { week: "Week 1", title: "Brief & Market Fit", body: "Defined the Bangkok positioning for Salsa Burgers — a premium smash burger concept targeting delivery-first audiences in central Bangkok. Identified key price point, competitors and initial menu for the Thai market." },
    { week: "Week 1–2", title: "Kitchen Setup & Menu Localisation", body: "Activated the cloud kitchen at NC Global's Bangkok base. Adapted the core menu for Thai supply chain, sourced local ingredients and completed initial recipe testing with production team." },
    { week: "Week 2", title: "Platform Activation", body: "Set up Salsa Burgers store on GrabFood, Foodpanda and LINE MAN. Uploaded menu photography, set pricing and opening promotions, and completed platform compliance checks." },
    { week: "Day 12", title: "First Delivery Order", body: "12 days after the initial brief, Salsa Burgers received its first delivery order on GrabFood. Real revenue. Real customer feedback. The market test had started." },
    { week: "Month 1", title: "Operations & Iteration", body: "NC Global's team managed daily kitchen operations, platform account management and customer review responses. Weekly data reports to the founder on order volume, top SKUs and customer ratings." },
    { week: "Ongoing", title: "Scale & Distribution", body: "Based on Month 1 data, expanded delivery radius, introduced new menu items and began B2B outreach to corporate lunch accounts in the Sathu Pradit corridor." },
  ]
  return (
    <PageShell>
      {/* Hero */}
      <section className="cs-hero">
        <div className="cs-hero__bg" style={{ backgroundImage: "url(/assets/hero-bkk.webp)" }} />
        <div className="container cs-hero__content">
          <div className="cs-hero__eyebrow">
            <Eyebrow style={{ color: "var(--accent)" }}>Case Study · F&B · Bangkok</Eyebrow>
          </div>
          <h1 className="cs-hero__title">
            From brief to Bangkok's<br/>
            delivery apps in <span className="italic gold">12 days.</span>
          </h1>
          <p className="cs-hero__sub">
            How Salsa Burgers entered the Thai market using NC Global Assets' cloud kitchen infrastructure — zero setup from scratch, real revenue from week two.
          </p>
        </div>
      </section>

      {/* Metrics */}
      <section className="section cs-metrics-section">
        <div className="container">
          <div className="cs-metrics">
            {metrics.map((m, i) => (
              <div className="cs-metric" key={i} data-reveal style={{ transitionDelay: `${i * 80}ms` }}>
                <div className="cs-metric__num">{m.num}<span className="cs-metric__unit">{m.unit}</span></div>
                <p className="cs-metric__label">{m.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Context */}
      <section className="section">
        <div className="container">
          <div className="cs-split">
            <div>
              <Eyebrow>The Challenge</Eyebrow>
              <h2 className="display-lg" style={{ marginTop: 16 }}>A premium burger brand<br/><span className="italic gold">Zero Thailand presence</span></h2>
              <p className="lede" style={{ marginTop: 20 }}>
                Salsa Burgers — a smash burger concept focused on premium ingredients and bold flavour — wanted to test the Bangkok market before making a full operational commitment. The question was straightforward: can this concept generate real revenue in Bangkok, and how quickly?
              </p>
              <p className="body-text" style={{ marginTop: 16 }}>
                The conventional path would have taken 4–6 months: find a kitchen space, negotiate a lease, register a Thai company, hire local staff, activate delivery platforms. By the time you have data, you've spent ฿500,000+ and six months of founder time.
              </p>
              <p className="body-text" style={{ marginTop: 16 }}>
                The NC Global path was different. The cloud kitchen was already running. The delivery accounts were already active. The local team was already in place. The only variable was the brand.
              </p>
            </div>
            <div className="cs-split__img">
              <img src="/assets/ops-kitchen.webp" alt="NC Global Assets cloud kitchen Bangkok" loading="lazy" />
              <div className="cs-split__img-badge">
                <span>Bangkok · Sathu Pradit</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="section section--surface">
        <div className="container">
          <div className="sec-header">
            <div className="lhs">
              <Eyebrow>The Timeline</Eyebrow>
              <h2 className="display-lg">12 days<br/><span className="italic gold">Step by step</span></h2>
            </div>
            <div>
              <p className="lede">From the first conversation to the first delivery order — every step in the Salsa Burgers Bangkok launch.</p>
            </div>
          </div>
          <div className="cs-timeline">
            {timeline.map((t, i) => (
              <div className="cs-timeline-item" key={i} data-reveal style={{ transitionDelay: `${i * 60}ms` }}>
                <div className="cs-timeline-item__week">{t.week}</div>
                <div className="cs-timeline-item__dot" />
                <div className="cs-timeline-item__content">
                  <h3 className="cs-timeline-item__title">{t.title}</h3>
                  <p className="cs-timeline-item__body">{t.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quote */}
      <section className="section section--light">
        <div className="container">
          <div className="cs-quote-block">
            <div className="cs-quote-mark">"</div>
            <p className="cs-quote-text">We went from brief to live on GrabFood in under two weeks. NC Global gave us the kitchen, the team and the delivery activation — we focused entirely on the product. Real orders from day one.</p>
            <div className="cs-quote-attr">
              <img src="/assets/carlos-dark.jpg" alt="Carlos Jacoste" style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", border: "1.5px solid var(--accent)" }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>Carlos Jacoste</div>
                <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>Founder · Salsa Burgers · Bangkok</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="section">
        <div className="container">
          <Eyebrow>The Result</Eyebrow>
          <h2 className="display-lg" style={{ marginTop: 16, marginBottom: 32 }}>What happened<br/>in <span className="italic gold">month one</span></h2>
          <div className="cs-results">
            {[
              { icon: "📦", title: "Delivery live in 12 days", body: "Active on GrabFood, Foodpanda and LINE MAN with a full menu and opening promotions before the second week was over." },
              { icon: "⭐", title: "4.8★ average rating", body: "Customer reviews confirmed product-market fit for the Thai market. Positive feedback on portion size, pricing and delivery time." },
              { icon: "📊", title: "Weekly data from day one", body: "Full visibility on order volume, top-performing SKUs, customer ratings and delivery time performance from the first order placed." },
              { icon: "🚀", title: "B2B pipeline by month two", body: "Based on delivery data, NC Global's commercial team began outreach to corporate lunch accounts and co-working spaces in the same corridor." },
            ].map((r, i) => (
              <div className="cs-result-card" key={i} data-reveal style={{ transitionDelay: `${i * 80}ms` }}>
                <div className="cs-result-card__icon">{r.icon}</div>
                <h3 className="cs-result-card__title">{r.title}</h3>
                <p className="cs-result-card__body">{r.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section section--surface">
        <div className="container cs-cta-section">
          <h2 className="display-lg">Your brand could be<br/><span className="italic gold">next</span></h2>
          <p className="lede" style={{ marginTop: 20, maxWidth: "48ch" }}>The same infrastructure that launched Salsa Burgers is available for your brand. Cloud kitchen, local team, delivery platform activation — ready from day one.</p>
          <div style={{ display: "flex", gap: 16, marginTop: 32, flexWrap: "wrap" }}>
            <a href={CONFIG.calendlyUrl} target="_blank" rel="noopener" className="btn btn--primary">
              <Calendar size={14} /> Book a Call <Arrow />
            </a>
            <Link to="/services" className="btn btn--ghost">See how it works <Arrow /></Link>
          </div>
          <p style={{ marginTop: 16, fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.12em" }}>Transparent model · Pricing shared in the first call</p>
        </div>
      </section>
    </PageShell>
  )
}

// ─── App ───
export default function App() {
  return (
    <>
      <Nav />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/blog" element={<BlogListPage />} />
        <Route path="/blog/:slug" element={<BlogPostPage />} />
        <Route path="/case-studies/salsa-burgers" element={<CaseStudySalsaBurgers />} />
      </Routes>
      <Footer />
      <ChatWithUsModal />
    </>
  )
}
