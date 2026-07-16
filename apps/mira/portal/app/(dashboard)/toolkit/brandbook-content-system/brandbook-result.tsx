'use client'

export function BrandbookContentSystemResult({ data }: { data?: any }) {
  if (!data) return <div className="text-gray-400">No data</div>

  return (
    <div className="w-full bg-gradient-to-b from-gray-950 via-black to-gray-950">
      {/* Header */}
      <div className="border-b border-white/5 p-6 md:p-8 md:pb-12">
        <h1 className="text-5xl md:text-6xl font-black text-white mb-3 tracking-tight">BRANDBOOK</h1>
        <p className="text-gray-400 max-w-2xl text-sm leading-relaxed mb-8">
          Complete brand identity system: visual guidelines, content strategy, voice & tone, and actionable templates
        </p>
      </div>

      {/* Main Content */}
      <div className="p-6 md:p-8 space-y-12">
        {/* Brand Identity */}
        <section>
          <h2 className="text-2xl font-black text-white uppercase mb-6 tracking-tight">01. Brand Identity</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-white/10 bg-white/5">
              <p className="text-xs text-gray-400 font-semibold mb-2">MISSION</p>
              <p className="text-white text-sm leading-relaxed">{data?.mission || 'Loading...'}</p>
            </div>
            <div className="p-4 rounded-xl border border-white/10 bg-white/5">
              <p className="text-xs text-gray-400 font-semibold mb-2">VISION</p>
              <p className="text-white text-sm leading-relaxed">{data?.vision || 'Loading...'}</p>
            </div>
          </div>
        </section>

        {/* Visual Guidelines */}
        <section>
          <h2 className="text-2xl font-black text-white uppercase mb-6 tracking-tight">02. Visual Guidelines</h2>
          <div className="border border-white/10 rounded-xl p-4 bg-white/5">
            <p className="text-white text-sm leading-relaxed">{data?.visual_guidelines || 'Generating guidelines...'}</p>
          </div>
        </section>

        {/* Content Strategy */}
        <section>
          <h2 className="text-2xl font-black text-white uppercase mb-6 tracking-tight">03. Content Strategy</h2>
          <div className="border border-white/10 rounded-xl p-4 bg-white/5">
            <p className="text-white text-sm leading-relaxed">{data?.content_strategy || 'Generating strategy...'}</p>
          </div>
        </section>

        {/* Voice & Tone */}
        <section>
          <h2 className="text-2xl font-black text-white uppercase mb-6 tracking-tight">04. Voice & Tone</h2>
          <div className="border border-white/10 rounded-xl p-4 bg-white/5">
            <p className="text-white text-sm leading-relaxed">{data?.voice_tone || 'Generating voice guidelines...'}</p>
          </div>
        </section>
      </div>
    </div>
  )
}
