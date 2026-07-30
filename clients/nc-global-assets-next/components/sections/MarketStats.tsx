'use client'

export const MARKET_STATS_DEFAULTS = {
  sup: 'Why Thailand · Why now',
  headline_top: 'The numbers that make ',
  headline_gold: 'Bangkok the move',
  stats: [
    { num: "80M+", label: "Consumers in Southeast Asia's growth corridor" },
    { num: "#1", label: "Bangkok ranked for F&B delivery density in Southeast Asia" },
    { num: "20%+", label: "Annual growth rate in Thailand's consumer market" },
    { num: "4–8", label: "Weeks to your first market test using our infrastructure" },
  ],
}

export function MarketStats({ data = MARKET_STATS_DEFAULTS }: { data?: typeof MARKET_STATS_DEFAULTS }) {
  const stats = data.stats

  return (
    <section className="market-stats">
      <div className="container">
        <div className="market-stats__header">
          <p className="market-stats__sup">{data.sup}</p>
          <h2 className="display-lg">{data.headline_top}<span className="italic gold">{data.headline_gold}</span></h2>
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
