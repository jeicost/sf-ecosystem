'use client'

import { Eyebrow } from '@/lib/constants'

const CHECK = "check"
const PARTIAL = "partial"
const CROSS = "cross"

function Icon({ type }: { type: string }) {
  if (type === CHECK) return <span className="compare-check">✓</span>
  if (type === PARTIAL) return <span className="compare-partial">~</span>
  return <span className="compare-cross">✗</span>
}

export function CompareSection() {
  const cols = [
    { key: "nc", label: "NC Global", sub: "Operating Partner", highlight: true },
    { key: "agency", label: "Local Agency", sub: "Strategy only" },
    { key: "dist", label: "Import Distributor", sub: "Distribution only" },
    { key: "solo", label: "On Your Own", sub: "DIY market entry" },
  ]

  const rows = [
    { feature: "Operational base ready from day 1", nc: CHECK, agency: CROSS, dist: CROSS, solo: CROSS },
    { feature: "Cloud kitchen & showroom included", nc: CHECK, agency: CROSS, dist: CROSS, solo: CROSS },
    { feature: "No Thai company registration needed", nc: CHECK, agency: CROSS, dist: PARTIAL, solo: CROSS },
    { feature: "Live on delivery platforms in weeks", nc: CHECK, agency: CROSS, dist: PARTIAL, solo: CROSS },
    { feature: "Brand strategy & local adaptation", nc: CHECK, agency: CHECK, dist: CROSS, solo: PARTIAL },
    { feature: "Local commercial team on the ground", nc: CHECK, agency: PARTIAL, dist: PARTIAL, solo: CROSS },
    { feature: "Shared commercial risk", nc: CHECK, agency: CROSS, dist: PARTIAL, solo: CROSS },
    { feature: "Daily operations management", nc: CHECK, agency: CROSS, dist: CROSS, solo: CHECK },
    { feature: "Path to SEA expansion", nc: CHECK, agency: PARTIAL, dist: PARTIAL, solo: PARTIAL },
  ]

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
