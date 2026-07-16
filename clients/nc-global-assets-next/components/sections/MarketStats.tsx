'use client'

export function MarketStats() {
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
