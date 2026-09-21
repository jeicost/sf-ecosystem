import { cmsArrState } from './cms-pages'

export type QA = { q: string; a: string }

/**
 * UNA sola fuente para el FAQ visible y para el JSON-LD de FAQPage.
 *
 * Hasta el 21-sep-2026 había tres copias distintas: la del CMS (la que ve el
 * usuario, 9 preguntas), la de respaldo de `Faq.tsx` y otra escrita a mano en
 * `app/page.tsx` para los datos estructurados (5 preguntas con respuestas
 * reescritas). Google indexaba un FAQ que no era el de la página y que el CMS
 * no podía corregir — incluida una frase en presente, «hoy hay 3 módulos
 * publicados», que era falsa antes del 15 de octubre.
 *
 * Vive en un módulo normal y no en `Faq.tsx` a propósito: `Faq.tsx` es
 * `'use client'`, y un valor exportado de un módulo de cliente llega a un
 * componente de servidor como referencia, no como el array.
 *
 * El respaldo solo se usa si el CMS no responde en build, y está escrito para
 * ser cierto en los dos estados de la página (antes y después de abrir).
 */
export const FAQ_FALLBACK: QA[] = [
  { q: '¿El curso está completo?', a: 'Todavía no, y prefiero decírtelo antes de que pagues. Se entrega por fases: 3 de los 9 módulos al abrir y uno nuevo cada semana hasta tenerlo completo el 30 de noviembre. Pagas una vez y lo recibes todo.' },
  { q: '¿Me sirve si solo tengo el móvil?', a: 'Sí, y es precisamente el punto. Todo lo que enseño está pensado para aplicarse con lo que ya tienes, empezando por el móvil. La técnica es la misma; solo cambia la herramienta.' },
  { q: '¿Necesito comprar equipo para hacer el curso?', a: 'No. De hecho, uno de los objetivos es que dejes de pensar que la solución es comprar. Te dejo una guía de equipo por presupuesto por si algún día quieres dar el paso, pero no necesitas nada para empezar.' },
  { q: 'Soy principiante total, ¿voy a poder seguirlo?', a: 'Está diseñado para eso. Explico cada concepto de forma sencilla y aplicable desde el primer día, sin tecnicismos innecesarios. Empezamos desde cero.' },
  { q: '¿Es un curso de edición o de cámara?', a: 'Es las dos cosas y ninguna. No es un curso de un programa concreto ni de un modelo de cámara: es un curso para que tus vídeos dejen de parecer amateur, uses lo que uses.' },
]

export function faqItems(data: Record<string, unknown>, abierta: boolean): QA[] {
  return cmsArrState<QA>(data, 'items', abierta) ?? FAQ_FALLBACK
}
