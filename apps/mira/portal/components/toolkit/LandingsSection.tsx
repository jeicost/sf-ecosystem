'use client'

export interface ClientLanding {
  title: string
  url: string
  meta?: string
}

interface LandingsSectionProps {
  landings: ClientLanding[]
  brandColor: string
  titleFontClass?: string
}

export default function LandingsSection({ landings, brandColor, titleFontClass = '' }: LandingsSectionProps) {
  if (!landings || landings.length === 0) return null

  return (
    <div className="mt-12">
      {/* Folder header */}
      <div className="flex items-center gap-2.5 rounded-t-xl border border-b-0 border-line bg-card px-4 py-3">
        <span className="text-sm opacity-70">📁</span>
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-tertiary">
          Landings activas
        </span>
        <span className="rounded-full bg-surface-hover px-2 py-0.5 font-mono text-[9px] text-ink-tertiary">
          {landings.length}
        </span>
      </div>

      {/* Folder body */}
      <div className="grid gap-3 rounded-b-xl border border-line bg-card p-4 sm:grid-cols-1">
        {landings.map((landing) => (
          <a
            key={landing.url}
            href={landing.url}
            target="_blank"
            rel="noopener noreferrer"
            className="card group flex items-center gap-4 rounded-xl p-4 transition-all duration-200 hover:translate-x-1"
            style={{ ['--card-color' as any]: brandColor }}
          >
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg border border-line bg-surface text-xl">
              🌐
            </div>
            <div className="min-w-0 flex-1">
              <p className={`mb-0.5 truncate text-sm font-bold text-ink ${titleFontClass}`}>
                {landing.title}
              </p>
              {landing.meta && (
                <p className="truncate font-mono text-[10px] text-ink-tertiary">{landing.meta}</p>
              )}
            </div>
            <span
              className="flex-shrink-0 text-base opacity-60 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-100"
              style={{ color: brandColor }}
            >
              ↗
            </span>
          </a>
        ))}
      </div>
    </div>
  )
}
