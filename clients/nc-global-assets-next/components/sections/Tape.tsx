'use client'

export function Tape() {
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
