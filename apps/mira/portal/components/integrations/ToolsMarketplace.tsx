'use client'
import { useState } from 'react'
import { ExternalLink, LogIn, CheckCircle, Lock, Clock } from 'lucide-react'
import { MARKETPLACE_TOOLS, MarketplaceTool } from '@/lib/integrations/marketplace-tools'
import { useLocaleContext } from '@/app/locale-provider'
import { t } from '@/lib/i18n'

interface ToolsMarketplaceProps {
  connectedTools: string[]
  userSubscriptionPlan?: 'free' | 'scale' | 'enterprise'
  onToolConnect?: (toolId: string) => Promise<void>
  onToolDisconnect?: (toolId: string) => Promise<void>
}

export default function ToolsMarketplace({
  connectedTools,
  userSubscriptionPlan = 'free',
  onToolConnect,
  onToolDisconnect,
}: ToolsMarketplaceProps) {
  const { locale } = useLocaleContext()
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [connectingTools, setConnectingTools] = useState<Set<string>>(new Set())

  // t() con fallback: si la clave no existe, usa el texto del catálogo de tools
  const tr = (key: string, fallback: string) => {
    const value = t(key, locale)
    return value === key ? fallback : value
  }

  const categories = Array.from(new Set(MARKETPLACE_TOOLS.map((tool) => tool.category)))

  const filteredTools = selectedCategory
    ? MARKETPLACE_TOOLS.filter((tool) => tool.category === selectedCategory)
    : MARKETPLACE_TOOLS

  // Las tools "coming soon" no cuentan en el denominador de operatividad:
  // aún no se pueden conectar, así que no penalizan la métrica.
  const criticalTools = MARKETPLACE_TOOLS.filter(
    (tool) => tool.isCritical && tool.status !== 'coming_soon'
  )
  const connectedCritical = criticalTools.filter((tool) => connectedTools.includes(tool.id)).length
  const criticalPct =
    criticalTools.length > 0 ? Math.round((connectedCritical / criticalTools.length) * 100) : 100

  const canAccessViaSubscription = userSubscriptionPlan !== 'free'

  const handleToolClick = async (tool: MarketplaceTool) => {
    if (tool.status === 'coming_soon') return

    if (!onToolConnect && !onToolDisconnect) {
      // No handlers, open setup URL
      window.open(tool.setupUrl, '_blank')
      return
    }

    setConnectingTools((prev) => new Set(prev).add(tool.id))

    try {
      const isConnected = connectedTools.includes(tool.id)
      if (isConnected && onToolDisconnect) {
        await onToolDisconnect(tool.id)
      } else if (!isConnected && onToolConnect) {
        // In a real implementation, this would open a modal for auth
        // For now, just call the handler which opens the setup URL
        await onToolConnect(tool.id)
      }
    } catch (error) {
      console.error('Tool action failed:', error)
    } finally {
      setConnectingTools((prev) => {
        const next = new Set(prev)
        next.delete(tool.id)
        return next
      })
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-ink">{t('integrations.marketplace.title', locale)}</h2>
        <p className="text-ink-secondary">{t('integrations.marketplace.subtitle', locale)}</p>
      </div>

      {/* Critical Tools Status */}
      <div className="card p-6 border border-[#F59E0B]/40 bg-[#F59E0B]/10 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-ink mb-1">{t('integrations.critical-tools', locale)}</h3>
            <p className="text-sm text-ink-secondary">
              {t('integrations.critical-connected', locale)
                .replace('{connected}', String(connectedCritical))
                .replace('{total}', String(criticalTools.length))}
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-[#F59E0B]">{criticalPct}%</div>
            <div className="text-xs text-ink-secondary">{t('integrations.operational', locale)}</div>
          </div>
        </div>
        <div className="w-full bg-line rounded h-2 overflow-hidden">
          <div
            className="h-full bg-[#F59E0B] transition-all"
            style={{ width: `${criticalPct}%` }}
          />
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-4 py-2 rounded text-sm font-medium transition-all ${
            selectedCategory === null
              ? 'bg-[#EC4899] text-white'
              : 'bg-card border border-line text-ink-secondary hover:text-ink'
          }`}
        >
          {t('integrations.all-tools', locale)}
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded text-sm font-medium transition-all ${
              selectedCategory === cat
                ? 'bg-[#EC4899] text-white'
                : 'bg-card border border-line text-ink-secondary hover:text-ink'
            }`}
          >
            {tr(`integrations.category.${cat}`, cat)}
          </button>
        ))}
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTools.map((tool) => {
          const isConnected = connectedTools.includes(tool.id)
          const isComingSoon = tool.status === 'coming_soon'
          // 'paid' = el cliente paga directamente a la herramienta externa con
          // su propia key (BYO) -- Apollo, Hunter -- MIRA no cobra de más por
          // conectarla, así que nunca debe gatearse por plan. Bug real
          // encontrado 2026-07-30: exigía userSubscriptionPlan === 'enterprise',
          // un plan que no existe en ningún usuario real de MIRA (los planes
          // reales son consulta/starter/growth/scale/admin/super_admin) --
          // Apollo/Hunter aparecían bloqueados tras "Upgrade Plan" para TODOS
          // los clientes, incluida la cuenta admin/super_admin del propio CEO.
          const isAccessible =
            tool.pricing === 'free' ||
            tool.pricing === 'paid' ||
            (tool.pricing === 'via_subscription' && canAccessViaSubscription)

          return (
            <div
              key={tool.id}
              className={`card p-5 border transition-all ${
                isConnected
                  ? 'border-[#10B981] bg-[#10B981]/10'
                  : isComingSoon
                    ? 'border-line opacity-80'
                    : tool.isCritical
                      ? 'border-[#F59E0B]'
                      : 'border-line'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{tool.emoji}</span>
                  <div>
                    <h3 className="font-semibold text-ink">
                      {tr(`integrations.tool.${tool.id}.name`, tool.name)}
                    </h3>
                    <p className="text-xs text-ink-tertiary">
                      {tr(`integrations.category.${tool.category}`, tool.category)}
                    </p>
                  </div>
                </div>
                {isConnected && (
                  <CheckCircle size={20} className="text-[#10B981] flex-shrink-0" />
                )}
                {isComingSoon && (
                  <span className="px-2 py-0.5 text-xs rounded font-semibold bg-[#8B5CF6]/20 text-[#8B5CF6] flex-shrink-0">
                    {t('integrations.coming-soon', locale)}
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="text-sm text-ink-secondary mb-4">
                {tr(`integrations.tool.${tool.id}.desc`, tool.description)}
              </p>

              {/* Agents & Status */}
              <div className="space-y-3 mb-4 pb-4 border-t border-line">
                <div>
                  <div className="text-xs font-semibold text-ink-tertiary mb-2">
                    {t('integrations.unlocks-agents', locale)}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {tool.agentsUnlocked.map((agent) => (
                      <span
                        key={agent}
                        className="px-2 py-0.5 text-xs rounded bg-[#EC4899]/20 text-[#EC4899]"
                      >
                        {agent}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-xs font-semibold text-ink-tertiary mb-2">
                    {t('integrations.departments', locale)}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {tool.departments.map((dept) => (
                      <span
                        key={dept}
                        className="px-2 py-0.5 text-xs rounded bg-card border border-line text-ink-secondary"
                      >
                        {dept}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Pricing & Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {tool.isCritical && (
                    <span className="px-2 py-0.5 text-xs rounded font-semibold bg-[#FF6B6B]/20 text-[#FF6B6B]">
                      {t('integrations.critical-badge', locale)}
                    </span>
                  )}
                  <span className="text-xs text-ink-tertiary">
                    {tool.pricing === 'via_subscription'
                      ? t('integrations.pricing.via-subscription', locale)
                      : tool.pricing === 'free'
                        ? t('integrations.pricing.free', locale)
                        : t('integrations.pricing.paid', locale)}
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <button
                disabled={
                  isComingSoon || (!isAccessible && !isConnected) || connectingTools.has(tool.id)
                }
                onClick={() => handleToolClick(tool)}
                className={`w-full mt-4 px-4 py-2 rounded font-medium text-sm flex items-center justify-center gap-2 transition-all ${
                  isComingSoon
                    ? 'bg-card border border-line text-ink-muted cursor-not-allowed'
                    : isConnected
                      ? 'bg-[#10B981] text-white hover:bg-[#059669]'
                      : isAccessible
                        ? 'bg-[#EC4899] text-white hover:bg-[#E00B7F]'
                        : 'bg-card border border-line text-ink-muted cursor-not-allowed'
                }`}
              >
                {isComingSoon ? (
                  <>
                    <Clock size={16} />
                    {t('integrations.coming-soon', locale)}
                  </>
                ) : connectingTools.has(tool.id) ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    {t('integrations.connecting', locale)}
                  </>
                ) : isConnected ? (
                  <>
                    <CheckCircle size={16} />
                    {t('integrations.connected', locale)}
                  </>
                ) : isAccessible ? (
                  <>
                    <LogIn size={16} />
                    {t('integrations.connect-account', locale)}
                  </>
                ) : (
                  <>
                    <Lock size={16} />
                    {t('integrations.upgrade-plan', locale)}
                  </>
                )}
                {!isComingSoon && !connectingTools.has(tool.id) && <ExternalLink size={14} />}
              </button>
            </div>
          )
        })}
      </div>

      {/* Info Box */}
      <div className="p-4 rounded border border-line bg-card space-y-2">
        <div className="text-sm font-semibold text-ink">{t('integrations.why-connect', locale)}</div>
        <ul className="text-xs text-ink-secondary space-y-1">
          <li>✓ {t('integrations.why-1', locale)}</li>
          <li>✓ {t('integrations.why-2', locale)}</li>
          <li>✓ {t('integrations.why-3', locale)}</li>
          <li>✓ {t('integrations.why-4', locale)}</li>
        </ul>
      </div>
    </div>
  )
}
