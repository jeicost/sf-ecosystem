'use client'

import { useEffect, useState } from 'react'
import { Logo } from './Logo'
import { site } from '@/lib/site'

export function Nav({ ctaUrl }: { ctaUrl: string }) {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 12)
    fn()
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled ? 'border-b border-line bg-bg/85 backdrop-blur-md' : 'border-b border-transparent'
      }`}
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5 sm:px-8">
        <a href="#top" aria-label={site.name}>
          <Logo />
        </a>
        <div className="flex items-center gap-3">
          <span className="hidden items-center gap-2 font-mono text-[0.68rem] uppercase tracking-[0.18em] text-dim sm:inline-flex">
            <span className="rec-dot" aria-hidden /> Filmmaker · Rodajes reales
          </span>
          <a href={ctaUrl} className="btn-primary px-4 py-2 text-[0.72rem] uppercase">
            Empezar
          </a>
        </div>
      </nav>
    </header>
  )
}
