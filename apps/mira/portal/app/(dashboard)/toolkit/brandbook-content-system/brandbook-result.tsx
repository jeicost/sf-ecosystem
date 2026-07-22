'use client'

export function BrandbookContentSystemResult({ data }: { data?: any }) {
  if (!data) return <div className="text-ink-secondary">No data</div>

  const identity = data?.brand_identity || {}
  const voice = data?.brand_voice || {}
  const visual = data?.visual_identity || {}
  const pillars = data?.brand_pillars || {}
  const templates = data?.content_templates || {}
  const playbooks = data?.channel_playbooks || {}
  const reconciliation = data?.reconciliation || {}

  return (
    <div className="w-full bg-page">
      {/* Header */}
      <div className="border-b border-line-subtle p-6 md:p-8 md:pb-12">
        <h1 className="text-5xl md:text-6xl font-black text-ink mb-3 tracking-tight">BRANDBOOK</h1>
        <p className="text-ink-secondary max-w-2xl text-sm leading-relaxed">
          Complete brand identity system: visual guidelines, content strategy, voice & tone, and actionable templates
        </p>
        {reconciliation?.verified && <p className="text-green-400 text-xs mt-4">✓ All sources verified and reconciled</p>}
      </div>

      {/* Main Content */}
      <div className="p-6 md:p-8 space-y-12">
        {/* Brand Identity */}
        <section>
          <h2 className="text-2xl font-black text-ink uppercase mb-6 tracking-tight">01. Brand Identity</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-line bg-surface">
              <p className="text-xs text-ink-secondary font-semibold mb-2">MISSION</p>
              <p className="text-ink text-sm leading-relaxed">{identity?.mission || '—'}</p>
            </div>
            <div className="p-4 rounded-xl border border-line bg-surface">
              <p className="text-xs text-ink-secondary font-semibold mb-2">VISION</p>
              <p className="text-ink text-sm leading-relaxed">{identity?.vision || '—'}</p>
            </div>
            {identity?.values && identity.values.length > 0 && (
              <div className="p-4 rounded-xl border border-line bg-surface md:col-span-2">
                <p className="text-xs text-ink-secondary font-semibold mb-3">VALUES</p>
                <div className="flex flex-wrap gap-2">
                  {identity.values.map((v: string, i: number) => (
                    <span key={i} className="px-3 py-1 bg-surface-hover rounded-full text-xs text-ink">{v}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Brand Promise & Positioning */}
        <section>
          <h2 className="text-2xl font-black text-ink uppercase mb-6 tracking-tight">02. Brand Promise & Positioning</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-line bg-surface">
              <p className="text-xs text-ink-secondary font-semibold mb-2">PROMISE</p>
              <p className="text-ink text-sm leading-relaxed">{data?.brand_promise?.covenant || '—'}</p>
            </div>
            <div className="p-4 rounded-xl border border-line bg-surface">
              <p className="text-xs text-ink-secondary font-semibold mb-2">DIFFERENTIATION</p>
              <p className="text-ink text-sm leading-relaxed">{data?.competitive_positioning?.how_differentiate || '—'}</p>
            </div>
          </div>
        </section>

        {/* Brand Voice & Tone */}
        <section>
          <h2 className="text-2xl font-black text-ink uppercase mb-6 tracking-tight">03. Voice & Tone</h2>
          <div className="p-4 rounded-xl border border-line bg-surface">
            <p className="text-xs text-ink-secondary font-semibold mb-3">TONE</p>
            <p className="text-ink text-sm leading-relaxed mb-4">{voice?.tone || '—'}</p>
            {voice?.do_examples && voice.do_examples.length > 0 && (
              <div className="mt-4 pt-4 border-t border-line-subtle">
                <p className="text-xs text-ink-secondary font-semibold mb-2">DO ✓</p>
                <ul className="space-y-1">
                  {voice.do_examples.map((ex: string, i: number) => (
                    <li key={i} className="text-ink text-sm">• {ex}</li>
                  ))}
                </ul>
              </div>
            )}
            {voice?.dont_examples && voice.dont_examples.length > 0 && (
              <div className="mt-4 pt-4 border-t border-line-subtle">
                <p className="text-xs text-ink-secondary font-semibold mb-2">DON'T ✗</p>
                <ul className="space-y-1">
                  {voice.dont_examples.map((ex: string, i: number) => (
                    <li key={i} className="text-ink text-sm">• {ex}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>

        {/* Visual Identity */}
        <section>
          <h2 className="text-2xl font-black text-ink uppercase mb-6 tracking-tight">04. Visual Identity</h2>
          <div className="p-4 rounded-xl border border-line bg-surface">
            <p className="text-xs text-ink-secondary font-semibold mb-3">GUIDELINES</p>
            <p className="text-ink text-sm leading-relaxed">{visual?.imagery_style || 'Standard brand imagery guidelines'}</p>
            {visual?.colors && visual.colors.length > 0 && (
              <div className="mt-4 pt-4 border-t border-line-subtle">
                <p className="text-xs text-ink-secondary font-semibold mb-2">COLORS</p>
                <div className="flex flex-wrap gap-3">
                  {visual.colors.map((color: any, i: number) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded border border-line" style={{ backgroundColor: color.hex || '#666' }}></div>
                      <span className="text-ink text-xs">{color.name || color.hex || 'Color'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Content & Channel Playbooks */}
        <section>
          <h2 className="text-2xl font-black text-ink uppercase mb-6 tracking-tight">05. Channel Playbooks</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {playbooks?.instagram && (
              <div className="p-4 rounded-xl border border-line bg-surface">
                <p className="text-xs text-ink-secondary font-semibold mb-2">INSTAGRAM</p>
                <p className="text-ink text-xs leading-relaxed">{typeof playbooks.instagram === 'object' ? JSON.stringify(playbooks.instagram).substring(0, 150) : playbooks.instagram}</p>
              </div>
            )}
            {playbooks?.tiktok && (
              <div className="p-4 rounded-xl border border-line bg-surface">
                <p className="text-xs text-ink-secondary font-semibold mb-2">TIKTOK</p>
                <p className="text-ink text-xs leading-relaxed">{typeof playbooks.tiktok === 'object' ? JSON.stringify(playbooks.tiktok).substring(0, 150) : playbooks.tiktok}</p>
              </div>
            )}
          </div>
        </section>

        {/* Status */}
        <section className="border-t border-line-subtle pt-8">
          <p className="text-xs text-ink-tertiary">Last generated: {data?.living_document_notes?.last_audit || 'Just now'}</p>
          <p className="text-xs text-ink-tertiary">Review cadence: {data?.living_document_notes?.review_cadence || 'Quarterly'}</p>
        </section>
      </div>
    </div>
  )
}
