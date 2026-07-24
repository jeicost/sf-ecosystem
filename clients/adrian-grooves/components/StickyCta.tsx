'use client'

import { useEffect, useState } from 'react'
import { site } from '@/lib/site'

/** Mobile-only sticky CTA that appears after the hero scrolls out. */
export function StickyCta({ ctaUrl, price }: { ctaUrl: string; price: string }) {
  const [show, setShow] = useState(false)
  useEffect(() => {
    const fn = () => setShow(window.scrollY > window.innerHeight * 0.9)
    fn()
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-50 border-t border-line bg-bg/95 px-4 py-3 backdrop-blur-md transition-transform duration-300 sm:hidden ${
        show ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <a href={ctaUrl} className="btn-primary flex w-full items-center justify-center gap-2 py-3 text-sm uppercase">
        Quiero mis vídeos a otro nivel · {price}&nbsp;€
      </a>
    </div>
  )
}
