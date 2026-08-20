'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ScrollReveal } from '@/components/ScrollReveal'
import { ChatWithUsModal, FloatingChat } from '@/components/ChatWidget'
import { openChat, CALENDLY_URL} from '@/lib/constants'
import { Footer } from '@/components/Footer'

const NAV_LINKS = [
  { to: '/', label: 'Home', exact: true },
  { to: '/about', label: 'About' },
  { to: '/services', label: 'Services' },
  { to: '/contact', label: 'Contact' },
]

const CONFIG = {
  calendlyUrl: CALENDLY_URL,
  whatsappNumber: '66825366653',
  lineId: '@ncglobalassets',
  phone: '+66825366653',
  phoneDisplay: '082 536 6653',
  email: 'contact@ncglobalassets.com',
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
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  const close = () => setMenuOpen(false)

  const isActive = (link: (typeof NAV_LINKS)[0]) => {
    if (link.exact) return pathname === '/'
    return pathname.startsWith(link.to)
  }

  return (
    <nav className={`nav ${scrolled ? 'scrolled' : ''}${menuOpen ? ' menu-open' : ''}`}>
      <div className="container nav-inner">
        <Link href="/" className="logo" onClick={close}>
          <img src="/assets/logo-mark-gold.jpg" alt="NC Global Assets" onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} />
          <span className="logo-word">NC Global Assets</span>
        </Link>
        <div className="nav-links">
          {NAV_LINKS.map((l) => (
            <Link key={l.to} href={l.to} className={`nav-link${isActive(l) ? ' active' : ''}`}>
              {l.label}
            </Link>
          ))}
        </div>
        <div className="nav-right">
          <a href={CONFIG.calendlyUrl} target="_blank" rel="noopener" className="btn btn--primary nav-cta">
            Book a Call →
          </a>
          <button
            className={`nav-burger${menuOpen ? ' open' : ''}`}
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>
      {menuOpen && (
        <div className="nav-mobile-menu">
          <div className="nav-mobile-links">
            {NAV_LINKS.map((l) => (
              <Link key={l.to} href={l.to} onClick={close} className={isActive(l) ? 'active' : ''}>
                {l.label}
              </Link>
            ))}
          </div>
          <div className="nav-mobile-cta">
            <a href={CONFIG.calendlyUrl} target="_blank" rel="noopener" className="btn btn--primary" onClick={close}>
              📅 Book a Call →
            </a>
            <button type="button" onClick={() => { close(); openChat() }} className="btn btn--ghost">
              💬 Chat with Us
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ScrollReveal />
      <Nav />
      <main>{children}</main>
      <Footer />
      <FloatingChat />
      <ChatWithUsModal />
    </>
  )
}

export { CONFIG, NAV_LINKS }
