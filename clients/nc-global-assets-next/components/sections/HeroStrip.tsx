'use client'

export function HeroStrip() {
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
