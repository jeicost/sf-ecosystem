'use client'

import { useEffect, useState } from 'react'

/**
 * CTA fijo de móvil. Aparece al salir del hero y se ESCONDE cuando la oferta,
 * el formulario o el final de la página están en pantalla.
 *
 * Por qué se esconde: medía 69 px pegado al borde inferior y no había nada que
 * lo compensara. Con el teclado abierto se plantaba encima del propio campo de
 * correo, y en la oferta competía con su propio botón diciendo otra cosa.
 *
 * Su texto sale del CMS (`hero.sticky_cta` / `sticky_cta_prelanzamiento`): hasta
 * el 21-sep estaba escrito en el código y ofrecía «quiero mis vídeos a otro
 * nivel · 99 €» mientras el resto de la página decía «abre el 15 de octubre».
 */
export function StickyCta({
  ctaUrl,
  price,
  label,
}: {
  ctaUrl: string
  price: string
  label: string
}) {
  const [pasadoHero, setPasadoHero] = useState(false)
  const [tapa, setTapa] = useState(false)

  useEffect(() => {
    const fn = () => setPasadoHero(window.scrollY > window.innerHeight * 0.9)
    fn()
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  useEffect(() => {
    const zonas = ['#checkout', '#lista', 'footer']
      .map((sel) => document.querySelector(sel))
      .filter((el): el is Element => Boolean(el))
    const visibles = new Set<Element>()
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) visibles.add(e.target)
        else visibles.delete(e.target)
      }
      setTapa(visibles.size > 0)
    })
    zonas.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  const show = pasadoHero && !tapa
  return (
    <div
      // Oculto también para teclado y lector de pantalla, no solo a la vista.
      aria-hidden={!show}
      inert={!show}
      className={`fixed inset-x-0 bottom-0 z-50 border-t border-line bg-bg/95 px-4 py-3 backdrop-blur-md transition-transform duration-300 sm:hidden ${
        show ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <a href={ctaUrl} data-cta="sticky" className="btn-primary flex w-full items-center justify-center gap-2 py-3 text-sm uppercase">
        {label} · {price}&nbsp;€
      </a>
    </div>
  )
}
