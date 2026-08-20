'use client'

import { MARKET_STATS_DEFAULTS } from '@/lib/section-defaults'

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
