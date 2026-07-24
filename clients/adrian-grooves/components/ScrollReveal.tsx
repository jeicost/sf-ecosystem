'use client'

import { useEffect } from 'react'

/** Adds .in to [data-reveal] elements as they enter the viewport. */
export function ScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('[data-reveal]:not(.in)')
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in')
            io.unobserve(e.target)
          }
        }),
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    )
    els.forEach((el) => el.classList.add('reveal'))
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])
  return null
}
