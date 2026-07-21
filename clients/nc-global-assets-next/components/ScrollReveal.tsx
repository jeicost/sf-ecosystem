'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Adds .revealed to [data-reveal] elements as they enter the viewport.
 * Without this, globals.css leaves those sections at opacity: 0 forever.
 */
export function ScrollReveal() {
  const pathname = usePathname()

  useEffect(() => {
    const els = document.querySelectorAll('[data-reveal]:not(.revealed)')
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('revealed')
            io.unobserve(e.target)
          }
        }),
      { threshold: 0.12 },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [pathname])

  return null
}
