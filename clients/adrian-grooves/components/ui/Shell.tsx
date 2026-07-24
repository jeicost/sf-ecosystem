export function Shell({
  id,
  tc,
  surface = false,
  children,
}: {
  id?: string
  tc: string
  surface?: boolean
  children: React.ReactNode
}) {
  return (
    <section id={id} className={surface ? 'bg-surface' : ''}>
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28" data-reveal>
        <span className="timecode">{tc}</span>
        <div className="mt-6">{children}</div>
      </div>
    </section>
  )
}

export function Check() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden className="mt-1 shrink-0">
      <path d="M3 8.5L6.5 12L13 4.5" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function Cross() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden className="mt-1 shrink-0">
      <path d="M4 4L12 12M12 4L4 12" stroke="var(--color-dim)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
