'use client'

import { useState } from 'react'
import { cmsVal, cmsArr } from '@/lib/cms-pages'

type QA = { q: string; a: string }

const DEFAULT_FAQS: QA[] = [
  { q: '¿Me sirve si solo tengo el móvil?', a: 'Sí, y es precisamente el punto. Todo lo que enseño está pensado para aplicarse con lo que ya tienes, empezando por el móvil. La técnica es la misma; solo cambia la herramienta.' },
  { q: '¿Necesito comprar equipo para hacer el curso?', a: 'No. De hecho, uno de los objetivos es que dejes de pensar que la solución es comprar. Te dejo una guía de equipo por presupuesto por si algún día quieres dar el paso, pero no necesitas nada para empezar.' },
  { q: 'Soy principiante total, ¿voy a poder seguirlo?', a: 'Está diseñado para eso. Explico cada concepto de forma sencilla y aplicable desde el primer día, sin tecnicismos innecesarios. Empezamos desde cero.' },
  { q: '¿Cuánto tiempo necesito?', a: 'El que tú quieras. El acceso es de por vida y los módulos son directos al grano. Puedes verlo a tu ritmo y volver a cualquier lección cuando la necesites.' },
  { q: '¿Es un curso de edición o de cámara?', a: 'Es las dos cosas y ninguna. No es un curso de un programa concreto ni de un modelo de cámara: es un curso para que tus vídeos dejen de parecer amateur, uses lo que uses.' },
  { q: '¿Y si no me convence?', a: 'Tienes 14 días de garantía. Si no es para ti, te devuelvo el dinero íntegro. Así de simple.' },
]

export function Faq({ data }: { data: Record<string, unknown> }) {
  const eyebrow = cmsVal(data, 'eyebrow') ?? 'Preguntas frecuentes'
  const faqs = cmsArr<QA>(data, 'items') ?? DEFAULT_FAQS
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section className="bg-bg">
      <div className="mx-auto max-w-3xl px-5 py-24 sm:px-8" data-reveal>
        <span className="timecode">08 · {eyebrow}</span>
        <h2 className="display mt-6 text-3xl sm:text-5xl">FAQ</h2>
        <div className="mt-10 divide-y divide-line border-y border-line">
          {faqs.map((faq, i) => {
            const isOpen = open === i
            return (
              <div key={i}>
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 py-5 text-left"
                >
                  <span className="text-[1.02rem] font-medium text-text">{faq.q}</span>
                  <span className={`font-mono text-accent transition-transform duration-300 ${isOpen ? 'rotate-45' : ''}`}>+</span>
                </button>
                <div
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
