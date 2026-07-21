'use client'

import { Arrow, Calendar, ChatIcon, CONFIG, openChat } from '@/lib/constants'

export function CtaBanner({ text, cta = 'Book a Call' }: { text: string; cta?: string }) {
  return (
    <div className="cta-banner">
      <div className="container cta-banner__inner">
        <p className="cta-banner__text">{text}</p>
        <div className="cta-banner__btns">
          <a href={CONFIG.calendlyUrl} target="_blank" rel="noopener" className="cta-banner__btn">
            <Calendar size={14} /> {cta} <Arrow />
          </a>
          <button type="button" onClick={openChat} className="cta-banner__btn cta-banner__btn--ghost">
            <ChatIcon size={14} /> Chat with Us
          </button>
        </div>
      </div>
    </div>
  )
}
