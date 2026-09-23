'use client'

import { useId, useRef, useState } from 'react'
import { site } from '@/lib/site'
import { track } from '@/lib/track'

type Estado = 'idle' | 'enviando' | 'ok' | 'invalido' | 'fallo'

/** Parámetros de campaña que se guardan con el lead: sin ellos no hay CAC por anuncio. */
const UTM = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const

/** Textos de la sección, ya resueltos para el estado actual (ver `cmsState`). */
export type ListaTextos = Partial<
  Record<
    | 'eyebrow' | 'headline' | 'intro' | 'cta' | 'success' | 'label' | 'placeholder'
    | 'error_invalido' | 'error_fallo' | 'consent' | 'bonus_note' | 'recurso_url' | 'recurso_label',
    string
  >
>

/**
 * Captación de correos. Antes de abrir la venta es el destino de todos los CTA;
 * con la venta abierta se queda como red para quien no compra.
 *
 * Lo que NO promete, a propósito: ni «precio de la primera tanda» ni
 * «plazas» — el precio es único y el curso es digital, así que las dos cosas
 * serían inventadas. Tampoco promete un descargable: el gancho (la checklist de
 * rodaje) se añade por CMS en `bonus_note` el día que exista de verdad.
 *
 * Accesibilidad, porque la revisión lo encontró todo roto en la primera versión:
 * etiqueta visible (el placeholder desaparecía al escribir), 16 px en el campo
 * (por debajo iOS hace zoom al enfocar), el campo NO se deshabilita al enviar
 * (deshabilitarlo tiraba el foco a <body>), y el error se asocia al campo con
 * aria-invalid + aria-describedby y distingue «tu correo está mal» de «ha
 * fallado el servidor» — antes culpaba al usuario de los fallos propios.
 */
export function Lista({ textos, abierta }: { textos: ListaTextos; abierta: boolean }) {
  // Componente de cliente: recibe SOLO los textos del estado actual. Con la
  // sección entera del CMS, el HTML llevaba también los del otro estado.
  const t = (k: keyof ListaTextos, fb: string) => textos[k] ?? fb
  const bonus = textos.bonus_note
  // Entrega inmediata del gancho: el enlace se enseña al guardar el correo, sin
  // depender de un envío por correo que hoy nadie puede hacer.
  const recurso = textos.recurso_url ?? '/recursos/checklist'
  const [estado, setEstado] = useState<Estado>('idle')
  const inputRef = useRef<HTMLInputElement>(null)
  const id = useId()
  const errorId = `${id}-error`
  const avisoId = `${id}-aviso`

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (estado === 'enviando') return
    const form = e.currentTarget
    const fd = new FormData(form)
    const email = (fd.get('email') as string | null)?.trim() ?? ''
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEstado('invalido')
      inputRef.current?.focus()
      return
    }
    // Trampa para bots: campo invisible que una persona nunca rellena.
    if (fd.get('web')) {
      setEstado('ok')
      return
    }

    const qs = new URLSearchParams(window.location.search)
    const campaña: Record<string, string> = {}
    for (const k of UTM) {
      const v = qs.get(k)
      if (v) campaña[k] = v
    }
    if (document.referrer) campaña.referrer = document.referrer

    setEstado('enviando')
    try {
      const res = await fetch('/api/lista', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: abierta ? 'lista-abierta' : 'lista-prelanzamiento', ...campaña }),
      })
      if (res.ok) {
        setEstado('ok')
        form.reset()
        track('Lead', { content_name: abierta ? 'lista-abierta' : 'lista-prelanzamiento' })
      } else {
        setEstado(res.status === 400 ? 'invalido' : 'fallo')
      }
    } catch {
      setEstado('fallo')
    }
  }

  const invalido = estado === 'invalido'
  return (
    <section id="lista" className="bg-bg-deep">
      <div className="mx-auto max-w-3xl px-5 py-24 sm:px-8" data-reveal>
        <span className="timecode justify-center">{t('eyebrow', 'Aviso de apertura')}</span>
        <h2 className="display mt-6 text-center text-3xl sm:text-5xl">
          {t('headline', `El curso abre el ${site.launch.presaleOpens}`)}
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-center text-lg leading-relaxed text-muted">
          {t('intro', 'Déjame tu correo y te escribo el día que abra. Solo ese aviso y lo importante del lanzamiento: nada de correos a diario.')}
        </p>

        <form onSubmit={enviar} noValidate className="mx-auto mt-10 max-w-xl">
          <label htmlFor={`${id}-email`} className="mb-2 block font-mono text-[0.72rem] uppercase tracking-[0.12em] text-muted">
            {t('label', 'Tu correo')}
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              ref={inputRef}
              id={`${id}-email`}
              name="email"
              type="email"
              inputMode="email"
              required
              autoComplete="email"
              placeholder={t('placeholder', 'tu@correo.com')}
              readOnly={estado === 'enviando'}
              aria-invalid={invalido}
              aria-describedby={`${invalido || estado === 'fallo' ? errorId + ' ' : ''}${avisoId}`}
              className={`flex-1 rounded-sm border bg-surface px-4 py-3.5 text-base text-text placeholder:text-muted focus:border-accent focus:outline-none ${
                invalido ? 'border-accent' : 'border-line-bright'
              }`}
            />
            <button
              type="submit"
              aria-disabled={estado === 'enviando'}
              className="btn-primary px-7 py-3.5 text-sm uppercase aria-disabled:opacity-60"
            >
              {estado === 'enviando' ? 'Enviando…' : t('cta', 'Avísame')}
            </button>
          </div>

          {/* Trampa para bots: fuera de la vista y del orden de tabulación. */}
          <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
            <label>
              Web
              <input name="web" type="text" tabIndex={-1} autoComplete="off" />
            </label>
          </div>

          <div className="mt-4 min-h-[3rem] text-center">
            {estado === 'ok' && (
              <p role="status" className="text-[0.95rem] text-accent">
                {t('success', 'Apuntado. Te escribo el día que abra.')}{' '}
                {recurso && (
                  <a href={recurso} className="underline underline-offset-4">
                    {t('recurso_label', 'Y aquí tienes la checklist de rodaje →')}
                  </a>
                )}
              </p>
            )}
            {invalido && (
              <p id={errorId} role="alert" className="text-[0.95rem] text-text">
                {t('error_invalido', 'Ese correo no parece completo. Revísalo y prueba otra vez.')}
              </p>
            )}
            {estado === 'fallo' && (
              <p id={errorId} role="alert" className="text-[0.95rem] text-text">
                {t('error_fallo', 'No se ha podido guardar por un fallo nuestro, no tuyo. Prueba otra vez en un momento.')}
              </p>
            )}
          </div>

          {/*
            Consentimiento: se recogen correos y el formulario no decía para qué
            ni enlazaba ninguna política. RGPD/LSSI, y Meta lo exige además para
            anunciar con píxel. La política vive en /privacidad.
          */}
          <p id={avisoId} className="mx-auto max-w-md text-center text-[0.8rem] leading-relaxed text-muted">
            {t('consent', 'Al apuntarte aceptas que Startups Factory LLC, responsable de esta web, use tu correo para avisarte de la apertura del curso de Adrian Groves y enviarte novedades sobre él. Puedes darte de baja en cualquier momento.')}{' '}
            <a href="/privacidad" className="underline decoration-line-bright underline-offset-2 hover:text-text">
              Política de privacidad
            </a>
            .
          </p>
        </form>

        {bonus && <p className="mt-6 text-center text-[0.9rem] leading-relaxed text-muted">{bonus}</p>}
      </div>
    </section>
  )
}
