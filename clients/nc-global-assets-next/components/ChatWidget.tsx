'use client'

import { useEffect, useState } from 'react'
import { Arrow, ChatIcon, Eyebrow, LineIcon, MailIcon, WhatsAppIcon, getContactLinks, openChat } from '@/lib/constants'

export function FloatingChat() {
  return (
    <button type="button" className="float-wa" onClick={openChat}>
      <ChatIcon size={16} /> Chat with Us
    </button>
  )
}

export function ChatWithUsModal() {
  const [open, setOpen] = useState(false)
  const links = getContactLinks()

  useEffect(() => {
    const onOpen = () => setOpen(true)
    window.addEventListener('nc:openchat', onOpen)
    return () => window.removeEventListener('nc:openchat', onOpen)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open])

  if (!open) return null

  const channels = [
    { id: 'whatsapp', label: 'WhatsApp', sub: 'Quick reply, usually within an hour', href: links.whatsapp, icon: <WhatsAppIcon size={20} />, accent: 'oklch(0.7 0.18 145)' },
    { id: 'line', label: 'LINE', sub: 'Preferred messenger in Thailand', href: links.line, icon: <LineIcon size={20} />, accent: 'oklch(0.72 0.18 145)' },
    { id: 'form', label: 'Send a brief', sub: 'Tell us about your brand in detail', href: '/contact', icon: <MailIcon size={20} />, accent: 'var(--accent)' },
  ]

  return (
    <div className="chat-modal" onClick={() => setOpen(false)}>
      <div className="chat-modal__sheet" onClick={(e) => e.stopPropagation()}>
        <div className="chat-modal__head">
          <div>
            <Eyebrow style={{ color: 'var(--accent)' }}>Chat with the team</Eyebrow>
            <h3 className="chat-modal__title">How would you like to reach us?</h3>
            <p className="chat-modal__sub">Pick the channel you prefer. We reply in English, Spanish or Thai.</p>
          </div>
          <button className="chat-modal__close" onClick={() => setOpen(false)} aria-label="Close">×</button>
        </div>
        <div className="chat-options">
          {channels.map((c, i) => (
            <a
              key={c.id}
              href={c.href}
              target={c.id === 'form' ? '_self' : '_blank'}
              rel="noopener"
              className="chat-option"
              onClick={() => setOpen(false)}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <span className="chat-option__icon" style={{ color: c.accent }}>{c.icon}</span>
              <span className="chat-option__body">
                <span className="chat-option__label">{c.label}</span>
                <span className="chat-option__sub">{c.sub}</span>
              </span>
              <Arrow />
            </a>
          ))}
        </div>
        <div className="chat-modal__foot">
          <span>Mon–Fri · Bangkok hours · Replies within 24h</span>
          <a href="/contact" onClick={() => setOpen(false)}>Schedule a call →</a>
        </div>
      </div>
    </div>
  )
}
