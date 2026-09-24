'use client'
import { useEffect, useRef, useState } from 'react'
import { ExternalLink, Loader2, RefreshCw, AlertTriangle } from 'lucide-react'
import { t, type Locale } from '@/lib/i18n'

// El marco de MIRA alrededor de un informe de Power BI.
//
// Dos cosas que parecen detalles y no lo son:
//
// 1. El enlace «Abrir en Power BI» va ANTES del iframe en el orden del
//    documento. Si la autenticación de Microsoft falla dentro del marco —y
//    puede fallar por mil motivos que MIRA no ve—, la salida tiene que estar
//    al alcance del teclado sin atravesar el informe.
// 2. Nunca se dice «última actualización». MIRA no conoce el refresco del
//    conjunto de datos de Power BI; enseñar una fecha inventada haría que
//    alguien decidiera sobre datos viejos creyéndolos frescos.
//
// El iframe es de otro origen: no se puede saber desde aquí si dentro hay un
// informe, una pantalla de login o un «no tienes permiso». Por eso el aviso de
// ayuda aparece por TIEMPO, no por certeza, y está redactado como pista, no
// como diagnóstico.

const SLOW_MS = 12_000

export default function PowerBIReportEmbed({ title, embedUrl, externalUrl, locale }: {
  title: string; embedUrl: string; externalUrl?: string | null; locale: Locale
}) {
  const [ready, setReady] = useState(false)
  const [slow, setSlow] = useState(false)
  const [nonce, setNonce] = useState(0)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setReady(false); setSlow(false)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setSlow(true), SLOW_MS)
    return () => { if (timer.current) clearTimeout(timer.current) }
  }, [nonce, embedUrl])

  const onLoad = () => {
    setReady(true); setSlow(false)
    if (timer.current) clearTimeout(timer.current)
  }

  return (
    <section>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {externalUrl && (
          <a href={externalUrl} target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-surface px-3 py-1.5 text-xs text-ink-secondary transition-colors hover:text-ink">
            <ExternalLink size={12} /> {t('bi.open-external', locale)}
          </a>
        )}
        <button onClick={() => setNonce((n) => n + 1)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-surface px-3 py-1.5 text-xs text-ink-tertiary transition-colors hover:text-ink">
          <RefreshCw size={12} /> {t('bi.reload', locale)}
        </button>
      </div>

      {slow && !ready && (
        <p className="mb-3 flex items-start gap-1.5 rounded-xl bg-amber-500/10 px-3 py-2 text-[11px] text-amber-400">
          <AlertTriangle size={12} className="mt-0.5 shrink-0" /> {t('bi.slow-hint', locale)}
        </p>
      )}

      <div className="relative w-full overflow-hidden rounded-2xl border border-line bg-card"
        style={{ height: 'calc(100vh - 260px)', minHeight: 640 }}>
        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center gap-2 text-xs text-ink-tertiary">
            <Loader2 size={14} className="animate-spin" /> {t('bi.loading', locale)}
          </div>
        )}
        <iframe
          key={nonce}
          src={embedUrl}
          title={`${title} — Microsoft Power BI`}
          onLoad={onLoad}
          className="h-full w-full"
          style={{ border: 0, display: 'block' }}
          allowFullScreen
        />
      </div>
    </section>
  )
}
