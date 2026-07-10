'use client'

import { CommunityQuickActions } from '@/components/quick-actions/CommunityQuickActions'

export default function CommunityPage() {
  return (
    <div className="px-8 py-8">
      <div className="mb-8">
        <p className="text-[10px] uppercase tracking-widest font-semibold mb-2" style={{ color: 'rgba(34, 197, 94, 0.8)', letterSpacing: '0.12em' }}>
          Community
        </p>
        <h1 className="text-2xl font-semibold text-white tracking-tight">MIRA Community</h1>
        <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Respond to tickets, create FAQs and build tutorials with AI assistance.
        </p>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Quick Actions', value: '3' },
          { label: 'Tickets Resolved', value: '—' },
          { label: 'FAQs Created', value: '—' },
          { label: 'Tutorials Published', value: '—' },
        ].map(({ label, value }) => (
          <div key={label} className="card px-4 py-3">
            <p className="text-[11px] text-[#555] uppercase tracking-wider mb-1">{label}</p>
            <p className="text-xl font-semibold text-white">{value}</p>
          </div>
        ))}
      </div>

      <CommunityQuickActions />
    </div>
  )
}
