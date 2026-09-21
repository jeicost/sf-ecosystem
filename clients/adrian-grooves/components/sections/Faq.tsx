'use client'

import { useState } from 'react'
import type { QA } from '@/lib/faq'

/**
 * Las preguntas llegan ya resueltas desde la página (`faqItems` en lib/faq.ts),
 * que es la MISMA lista que alimenta el JSON-LD de FAQPage. Aquí no hay
 * respaldo propio a propósito: una segunda copia fue lo que dejó a Google
 * indexando un FAQ distinto del que veía el usuario.
 *
 * Recibe textos sueltos y no la sección entera del CMS: es un componente de
 * cliente, y todo lo que se le pasa se serializa en el HTML — con `data` iban
 * también las respuestas del OTRO estado (las de venta abierta, en presente).
 */
export function Faq({ eyebrow = 'Preguntas frecuentes', headline = 'Lo que te estarás preguntando', items }: { eyebrow?: string; headline?: string; items: QA[] }) {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section className="bg-bg">
      <div className="mx-auto max-w-3xl px-5 py-24 sm:px-8" data-reveal>
        <span className="timecode">10 · {eyebrow}</span>
        <h2 className="display mt-6 text-3xl sm:text-5xl">{headline}</h2>
        <div className="mt-10 divide-y divide-line border-y border-line">
          {items.map((faq, i) => {
            const isOpen = open === i
            const panelId = `faq-panel-${i}`
            return (
              <div key={i}>
                <h3>
                  <button
                    onClick={() => setOpen(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    className="flex w-full items-center justify-between gap-4 py-5 text-left"
                  >
                    <span className="text-[1.02rem] font-medium text-text">{faq.q}</span>
                    <span aria-hidden className={`font-mono text-accent transition-transform duration-300 ${isOpen ? 'rotate-45' : ''}`}>+</span>
                  </button>
                </h3>
                {/*
                  Cerrada, la respuesta sale del árbol de accesibilidad (`hidden`
                  vía `inert` + aria-hidden). Antes las nueve respuestas se leían
                  enteras con el botón diciendo «contraído»: el acordeón mentía.
                */}
                <div
                  id={panelId}
                  role="region"
                  aria-hidden={!isOpen}
                  inert={!isOpen}
                  className="grid transition-all duration-300"
                  style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
                >
                  <div className="overflow-hidden">
                    <p className="pb-5 text-[0.96rem] leading-relaxed text-muted">{faq.a}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
