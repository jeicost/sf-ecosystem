'use client'

import { MarketingQuickActions } from '@/components/quick-actions/MarketingQuickActions'

export default function MarketingPage() {
  return (
    <div className="px-8 py-8">
      <div className="mb-8">
        <p className="text-[10px] uppercase tracking-widest font-semibold mb-2" style={{ color: 'rgba(236, 72, 153, 0.8)', letterSpacing: '0.12em' }}>
          Marketing
        </p>
        <h1 className="text-2xl font-semibold text-white tracking-tight">MIRA Marketing</h1>
        <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Generate posts, newsletters, videos, carousels and ad campaigns in seconds.
        </p>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Quick Actions', value: '5' },
          { label: 'Generated Assets', value: '—' },
          { label: 'Posts Scheduled', value: '—' },
          { label: 'Campaigns Active', value: '—' },
        ].map(({ label, value }) => (
          <div key={label} className="card px-4 py-3">
            <p className="text-[11px] text-[#555] uppercase tracking-wider mb-1">{label}</p>
            <p className="text-xl font-semibold text-white">{value}</p>
          </div>
        ))}
      </div>

      <MarketingQuickActions />
    </div>
  )
}
