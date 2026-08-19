'use client'

import { useMemo, useState } from 'react'
import { Loader2, Sparkles, CheckCircle2, Wrench } from 'lucide-react'
import { useActiveClient } from '@/lib/client-context'
import { useLocaleContext } from '@/app/locale-provider'
import { useClientTools } from '@/lib/hooks/useClientTools'
import { MIRA_TOOLS, CUSTOM_TOOL_ID, type MiraTool } from '@/lib/tools/catalog'
import PageHeader from '@/components/ui/PageHeader'
import EmptyState from '@/components/ui/EmptyState'
import ToolCard from '@/components/tools/ToolCard'
import RequestToolModal from '@/components/tools/RequestToolModal'
import { t } from '@/lib/i18n'

const FALLBACK_BRAND = '#8B5CF6'

/**
 * Tools — el escaparate de módulos de la marca (antes «Library», que era solo
 * una etiqueta de menú sin página).
 *
 * Dos zonas y un cierre:
 *   · Your tools  → lo que esta marca tiene abierto, con su contador si gasta cuota.
 *   · Marketplace → el resto del catálogo, visible y pedible. Que una herramienta
 *                   que no tienes contratada se VEA es el cambio de fondo: antes
 *                   el menú la ocultaba y nadie podía pedir lo que no sabía que existía.
 *   · Módulos a medida → la parte del negocio que ninguna tarjeta puede representar,
 *                   porque todavía no existe: se construye para cada cliente.
 */
export default function ToolsPage() {
  const { activeClient, loading: clientLoading } = useActiveClient()
  const { locale } = useLocaleContext()
  const { tools, quota, customRequested, isLoading, error, reload } = useClientTools(activeClient?.id)
  const [requesting, setRequesting] = useState<{ id: string; name: string } | null>(null)
  const [sent, setSent] = useState(false)

  const brand = activeClient?.primaryColor || FALLBACK_BRAND
  const stateById = useMemo(
    () => new Map(tools.map((s) => [s.id, s])),
    [tools]
  )

  const mine = MIRA_TOOLS.filter((tool) => stateById.get(tool.id)?.enabled)
  const rest = MIRA_TOOLS.filter((tool) => !stateById.get(tool.id)?.enabled)

  const onRequest = (tool: MiraTool) => setRequesting({ id: tool.id, name: tool.name })

  const card = (tool: MiraTool) => (
    <ToolCard
      key={tool.id}
      tool={tool}
      enabled={!!stateById.get(tool.id)?.enabled}
      requested={!!stateById.get(tool.id)?.requested}
      quota={quota}
      brand={brand}
      locale={locale}
      onRequest={onRequest}
    />
  )

  if (isLoading || clientLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-ink-tertiary py-16 justify-center">
        <Loader2 size={16} className="animate-spin" /> {t('tools.loading', locale)}
      </div>
    )
  }

  // Sin marca resuelta no se puede decir qué tiene contratada: pintar el catálogo
  // entero con candado sería MENTIR (diría "no lo tienes" de cosas que sí tiene).
  if (error || tools.length === 0) {
    return (
      <div className="max-w-6xl">
        <PageHeader
          eyebrow={activeClient?.name || ''}
          title={t('tools.title', locale)}
          subtitle={t('tools.subtitle', locale)}
          eyebrowColor={brand}
        />
        <EmptyState
          icon={<Wrench size={24} />}
          title={t('tools.no-client.title', locale)}
          description={t('tools.no-client.desc', locale)}
          action={{ label: t('tools.no-client.cta', locale), href: '/home' }}
        />
      </div>
    )
  }

  return (
    <div className="max-w-6xl">
      <PageHeader
        eyebrow={activeClient?.name || ''}
        title={t('tools.title', locale)}
        subtitle={t('tools.subtitle', locale)}
        eyebrowColor={brand}
      />

      {sent && (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-line bg-surface px-4 py-3 text-xs text-ink-secondary">
          <CheckCircle2 size={14} style={{ color: brand }} />
          {t('tools.request-sent', locale)}
        </div>
      )}

      {mine.length > 0 && (
        <section className="mb-10">
          <h2 className="text-sm font-semibold text-ink">{t('tools.yours.title', locale)}</h2>
          <p className="text-xs text-ink-tertiary mt-0.5 mb-4">{t('tools.yours.subtitle', locale)}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{mine.map(card)}</div>
        </section>
      )}

      {rest.length > 0 && (
        <section className="mb-10">
          <h2 className="text-sm font-semibold text-ink">{t('tools.marketplace.title', locale)}</h2>
          <p className="text-xs text-ink-tertiary mt-0.5 mb-4">{t('tools.marketplace.subtitle', locale)}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{rest.map(card)}</div>
        </section>
      )}

      {/* Módulos a medida: no es un producto de catálogo, es la propuesta de la
          agencia. Por eso es un panel y no una tarjeta más — prometer un módulo
          inexistente como si fuera comprable sería vender humo. */}
      <section
        className="rounded-2xl border border-line p-6"
        style={{ background: `linear-gradient(135deg, ${brand}0d, transparent 60%)` }}
      >
        <div className="flex items-start gap-3">
          <Sparkles size={18} style={{ color: brand }} className="mt-0.5 shrink-0" />
          <div className="flex-1">
            <h2 className="text-sm font-semibold text-ink">{t('tools.custom.title', locale)}</h2>
            <p className="text-xs text-ink-tertiary mt-1.5 max-w-2xl leading-relaxed">
              {t('tools.custom.desc', locale)}
            </p>
            {customRequested ? (
              <p className="mt-4 text-[11px] text-ink-tertiary flex items-center gap-1.5">
                <CheckCircle2 size={12} /> {t('tools.request-pending', locale)}
              </p>
            ) : (
              <button
                onClick={() => setRequesting({ id: CUSTOM_TOOL_ID, name: t('tools.custom.title', locale) })}
                className="mt-4 text-xs font-medium px-3 py-2 rounded-lg transition-opacity hover:opacity-90"
                style={{ background: brand, color: '#fff' }}
              >
                {t('tools.custom.cta', locale)}
              </button>
            )}
          </div>
        </div>
      </section>

      {requesting && activeClient && (
        <RequestToolModal
          toolId={requesting.id}
          toolName={requesting.name}
          clientId={activeClient.id}
          brand={brand}
          locale={locale}
          onClose={() => setRequesting(null)}
          onSent={() => { setRequesting(null); setSent(true); reload() }}
        />
      )}
    </div>
  )
}
