'use client'

// "Open in Google Slides" — un solo botón para el informe del toolkit y el
// editor de decks del Centro de Documentos.
//
// Nace de una queja del CEO ("no funciona ni aparece"): el botón anterior
// vivía dentro de la página del informe, se pintaba solo para dos slugs, y
// si el fetch del slug fallaba desaparecía sin decir nada; los 409 de Drive
// llegaban como texto suelto sin forma de arreglarlo. Aquí cada fallo tiene
// su mensaje y su salida:
//   (a) Drive no conectado / caducado → texto + enlace a Integraciones.
//   (b) Todavía no sabemos si la fila tiene PPTX → botón deshabilitado con
//       tooltip "checking…"; si la sonda falla, el botón sigue activo y el
//       clic vuelve a intentarlo contra el servidor (que es la verdad).
//   (c) Error real → el error tal cual.
// Sonda + export: GET/POST /api/toolkit/export-slides.

import { useCallback, useEffect, useState } from 'react'
import { t } from '@/lib/i18n'
import { useLocaleContext } from '@/app/locale-provider'

export type SlidesArtifact = 'monthly-deck' | 'voice-guide' | 'deck'

interface Props {
  queueId: string
  /** Fuerza el artefacto (p.ej. 'deck' cuando el usuario está en la vista Presentación). */
  artifact?: SlidesArtifact
  /** Tema del deck (light/dark). Si no llega, manda el `_theme` con el que se generó. */
  theme?: 'light' | 'dark'
  /** Clases del botón — cada barra de herramientas tiene las suyas. */
  className?: string
}

type DriveIssue = 'not_connected' | 'needs_reauth'

type Probe =
  | { state: 'loading' }
  | { state: 'error' }
  | {
      state: 'ready'
      available: boolean
      reason?: string
      label?: string
      drive: 'connected' | DriveIssue
      driveMessage?: string
    }

type Export =
  | { state: 'idle' }
  | { state: 'creating' }
  | { state: 'done'; url?: string }
  | { state: 'error'; message: string; drive?: DriveIssue }

function asDriveIssue(v: unknown): DriveIssue | undefined {
  return v === 'not_connected' || v === 'needs_reauth' ? v : undefined
}

const DEFAULT_BUTTON_CLASS =
  'text-sm px-4 py-1.5 rounded bg-surface-hover text-ink hover:opacity-80 transition-colors disabled:opacity-60 disabled:cursor-not-allowed'

// Textos nuevos aún sin clave en lib/i18n.ts: se intenta la clave y, si no
// existe, cae al inglés de aquí. Cuando alguien añada las claves, el botón se
// traduce solo sin tocar este fichero.
function useLabel() {
  const { locale } = useLocaleContext()
  return (key: string, fallback: string) => {
    const v = t(key, locale)
    return v === key ? fallback : v
  }
}

export default function OpenInSlidesButton({ queueId, artifact, theme, className }: Props) {
  const L = useLabel()
  const [probe, setProbe] = useState<Probe>({ state: 'loading' })
  const [exp, setExp] = useState<Export>({ state: 'idle' })
  const [panelOpen, setPanelOpen] = useState(false)

  const runProbe = useCallback(async () => {
    setProbe({ state: 'loading' })
    const qs = new URLSearchParams({ queue_id: queueId })
    if (artifact) qs.set('artifact', artifact)
    const res = await fetch(`/api/toolkit/export-slides?${qs}`, { cache: 'no-store' }).catch(() => null)
    const data = await res?.json().catch(() => null)
    if (!res?.ok || !data || typeof data.available !== 'boolean') {
      setProbe({ state: 'error' })
      return
    }
    setProbe({
      state: 'ready',
      available: data.available,
      reason: data.reason,
      label: data.label,
      drive: asDriveIssue(data.drive) ?? 'connected',
      driveMessage: data.driveMessage,
    })
  }, [queueId, artifact])

  useEffect(() => {
    runProbe()
  }, [runProbe])

  const createSlides = async () => {
    setExp({ state: 'creating' })
    setPanelOpen(false)
    const res = await fetch('/api/toolkit/export-slides', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ queue_id: queueId, ...(artifact ? { artifact } : {}), ...(theme ? { theme } : {}) }),
    }).catch(() => null)
    const data = await res?.json().catch(() => null)
    if (res?.ok && data?.success) {
      setExp({ state: 'done', url: data.driveUrl })
      // window.open tras un await no cuenta como gesto del usuario y algunos
      // navegadores lo bloquean: el panel deja el enlace a mano por si acaso.
      if (data.driveUrl) {
        window.open(data.driveUrl, '_blank', 'noopener')
        setPanelOpen(true)
      }
      return
    }
    // El 409 de Drive trae `reason` tipado; el resto es error de verdad.
    const drive = res?.status === 409 ? asDriveIssue(data?.reason) : undefined
    setExp({
      state: 'error',
      message:
        data?.error ||
        (res ? L('toolkit.report.slides-error-default', "Couldn't create the presentation") : L('toolkit.report.connection-error', 'Connection error')),
      drive,
    })
    setPanelOpen(true)
    // Si el servidor dice que Drive no está, la sonda ya está desfasada.
    if (drive) runProbe()
  }

  // Sin PPTX para esta fila (playbook, one-pager, informe sin terminar): no hay
  // botón. La razón está en `probe.reason` por si alguien quiere mostrarla.
  if (probe.state === 'ready' && !probe.available) return null

  const checking = probe.state === 'loading'
  const driveIssue =
    exp.state === 'error' && exp.drive
      ? exp.drive
      : probe.state === 'ready' && probe.drive !== 'connected'
        ? probe.drive
        : null

  const label =
    exp.state === 'creating'
      ? L('toolkit.report.slides-creating', '⏳ Creating Slides…')
      : exp.state === 'done'
        ? L('toolkit.report.slides-done', '✓ Slides in Drive')
        : L('toolkit.report.slides-create', '📊 Open in Google Slides')

  const title = checking
    ? L('toolkit.report.slides-checking', 'Checking whether this report can be opened in Google Slides…')
    : probe.state === 'error'
      ? L('toolkit.report.slides-probe-failed', "Couldn't check this report — click to try anyway")
      : driveIssue
        ? L('toolkit.report.slides-drive-warning', 'Google Drive is not connected — click to see how to fix it')
        : `${L('toolkit.report.slides-tooltip', "Creates an editable Google Slides presentation in the client's Drive")}${
            probe.state === 'ready' && probe.label ? ` · ${probe.label}` : ''
          }`

  const showPanel = panelOpen && (exp.state === 'error' || (exp.state === 'done' && exp.url))

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        onClick={() => {
          if (exp.state === 'done' && exp.url) {
            window.open(exp.url, '_blank', 'noopener')
            return
          }
          // Drive KO conocido de antemano: mostrar el arreglo sin gastar una
          // generación; el clic dentro del panel reintenta de verdad.
          if (driveIssue && exp.state !== 'error') {
            setExp({
              state: 'error',
              drive: driveIssue,
              message:
                (probe.state === 'ready' && probe.driveMessage) ||
                L('toolkit.report.slides-drive-not-connected', 'Your Google Drive is not connected.'),
            })
            setPanelOpen(true)
            return
          }
          createSlides()
        }}
        disabled={checking || exp.state === 'creating'}
        className={className || DEFAULT_BUTTON_CLASS}
        title={title}
        aria-busy={checking || exp.state === 'creating'}
      >
        {label}
        {driveIssue && exp.state !== 'done' ? ' ⚠️' : ''}
      </button>

      {showPanel && (
        <div
          role={exp.state === 'error' ? 'alert' : 'status'}
          className="absolute right-0 top-full mt-1.5 z-30 w-80 rounded-lg border border-line bg-page shadow-lg p-3 text-xs text-ink space-y-2"
        >
          {exp.state === 'error' && (
            <>
              <p className={exp.drive ? 'text-amber-400' : 'text-red-400'}>{exp.message}</p>
              {exp.drive && (
                <p className="text-ink-secondary">
                  {exp.drive === 'needs_reauth'
                    ? L(
                        'toolkit.report.slides-drive-reauth-hint',
                        'The connection expired or predates the write permission. Reconnect once and every export lands in the client’s Drive.'
                      )
                    : L(
                        'toolkit.report.slides-drive-connect-hint',
                        'Slides are created in the client’s own Google Drive, so it has to be connected once.'
                      )}
                </p>
              )}
              <div className="flex items-center gap-3">
                {exp.drive && (
                  <a
                    href="/integrations"
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition"
                  >
                    {exp.drive === 'needs_reauth'
                      ? L('integrations.drive-reauth-cta', 'Reconnect Google Drive')
                      : L('toolkit.report.slides-drive-connect-cta', '🔗 Connect in Integrations')}
                  </a>
                )}
                <button
                  type="button"
                  onClick={createSlides}
                  className="text-xs underline text-ink-secondary hover:text-ink"
                >
                  {L('toolkit.report.retry', 'Retry')}
                </button>
                <button
                  type="button"
                  onClick={() => setPanelOpen(false)}
                  className="ml-auto text-xs text-ink-tertiary hover:text-ink"
                  aria-label="Dismiss"
                >
                  ✕
                </button>
              </div>
            </>
          )}
          {exp.state === 'done' && exp.url && (
            <p>
              <a href={exp.url} target="_blank" rel="noopener noreferrer" className="underline">
                {L('toolkit.report.slides-open-link', 'Open the presentation in Google Slides →')}
              </a>
            </p>
          )}
        </div>
      )}
    </span>
  )
}
