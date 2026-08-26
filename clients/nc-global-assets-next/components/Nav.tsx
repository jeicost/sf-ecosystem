'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Arrow, Calendar, ChatIcon, CALENDLY_URL} from '@/lib/constants'
import { LangSwitch } from '@/components/LangSwitch'

const NAV_LINKS = [
  { to: '/', label: 'Home', exact: true },
  { to: '/services', label: 'Services' },
  { to: '/about', label: 'About' },
  { to: '#checklist', label: 'Resources', anchor: true },
  { to: '/contact', label: 'Contact' },
]

const CONFIG = {
  calendlyUrl: CALENDLY_URL,
}

export function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  const close = () => setMenuOpen(false)

  const isActive = (link: typeof NAV_LINKS[0]) => {
    if (link.anchor) return false
    if (link.exact) return pathname === '/'
    return pathname.startsWith(link.to)
  }

  return (
    <nav className={`nav ${scrolled ? 'scrolled' : ''}${menuOpen ? ' menu-open' : ''}`}>
      <div className="container nav-inner">
        <Link href="/" className="logo" onClick={close}>
          <img src="/assets/logo-mark-gold.jpg" alt="NC Global Assets" onError={e => (e.target as HTMLImageElement).style.display='none'} />
          <span className="logo-word">NC Global Assets</span>
        </Link>
        <div className="nav-links">
          {NAV_LINKS.map(l =>
            l.anchor
              ? <a key={l.to} href={l.to} className="nav-link">{l.label}</a>
              : <Link key={l.to} href={l.to} className={`nav-link${isActive(l) ? ' active' : ''}`}>{l.label}</Link>
          )}
        </div>
        <div className="nav-right">
          <LangSwitch className="nav-link" />
          <a href={CONFIG.calendlyUrl} target="_blank" rel="noopener" className="btn btn--primary nav-cta">
            Book a Call <Arrow />
          </a>
          <button
            className={`nav-burger${menuOpen ? ' open' : ''}`}
            onClick={() => setMenuOpen(o => !o)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            <span /><span /><span />
          </button>
        </div>
      </div>
      {menuOpen && (
        <div className="nav-mobile-menu">
          <div className="nav-mobile-links">
            {NAV_LINKS.map(l =>
              l.anchor
                ? <a key={l.to} href={l.to} onClick={close}>{l.label}</a>
                : <Link key={l.to} href={l.to} onClick={close} className={isActive(l) ? 'active' : ''}>{l.label}</Link>
            )}
            {/* El idioma, con el resto de enlaces del menú móvil. */}
            <LangSwitch onNavigate={close} />
          </div>
          <div className="nav-mobile-cta">
            <a href={CONFIG.calendlyUrl} target="_blank" rel="noopener" className="btn btn--primary" onClick={close}>
              <Calendar /> Book a Call <Arrow />
            </a>
            <button type="button" onClick={() => { window.dispatchEvent(new Event('nc:openchat')); close() }} className="btn btn--ghost">
              <ChatIcon /> Chat with Us
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}
