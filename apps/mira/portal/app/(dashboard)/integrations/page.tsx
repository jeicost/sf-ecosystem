'use client'
import { useActiveClient } from '@/lib/client-context'
import { useToolConnections } from '@/lib/hooks/useToolConnections'
import ToolsMarketplace from '@/components/integrations/ToolsMarketplace'
import ToolConnectionModal from '@/components/integrations/ToolConnectionModal'
import UsageCard from '@/components/UsageCard'
import { MARKETPLACE_TOOLS } from '@/lib/integrations/marketplace-tools'
import { useLocaleContext } from '@/app/locale-provider'
import { t } from '@/lib/i18n'
import { useEffect, useState } from 'react'

export default function IntegrationsPage() {
  const { activeClient } = useActiveClient()
  const { locale } = useLocaleContext()
  const clientId = activeClient?.id
  const { connectedTools, userSubscriptionPlan, isLoading, connectTool, disconnectTool } =
    useToolConnections(clientId || '')
  const [mounted, setMounted] = useState(false)
  const [selectedToolId, setSelectedToolId] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [driveConnected, setDriveConnected] = useState(false)
  const [driveNeedsReauth, setDriveNeedsReauth] = useState(false)

  useEffect(() => {
    setMounted(true)

    // Check for OAuth callback messages
    const params = new URLSearchParams(window.location.search)
    const success = params.get('success')
    const error = params.get('error')
    const drive = params.get('drive')

    if (success) {
      setSuccessMessage(t('integrations.connected-success', locale).replace('{name}', success))
      // Clear URL
      window.history.replaceState({}, '', '/integrations')
      setTimeout(() => setSuccessMessage(null), 5000)
    }
    if (error) {
      setErrorMessage(t('integrations.connection-failed', locale).replace('{error}', error))
      window.history.replaceState({}, '', '/integrations')
      setTimeout(() => setErrorMessage(null), 5000)
    }
    if (drive === 'connected') {
      setSuccessMessage(t('integrations.drive-connected', locale))
      window.history.replaceState({}, '', '/integrations')
      setTimeout(() => setSuccessMessage(null), 8000)
    } else if (drive === 'error') {
      setErrorMessage(
        `Google Drive: ${params.get('reason') || t('integrations.drive-error-reason', locale)}`
      )
      window.history.replaceState({}, '', '/integrations')
      setTimeout(() => setErrorMessage(null), 8000)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Estado real de la conexión Drive del cliente activo
  useEffect(() => {
    if (!clientId) return
    fetch(`/api/brand-brain/drive/folders?clientId=${clientId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        setDriveConnected(!!j?.connected)
        setDriveNeedsReauth(!!j?.needsReauth)
      })
      .catch(() => {})
  }, [clientId])

  const selectedTool = MARKETPLACE_TOOLS.find((t) => t.id === selectedToolId)

  const handleToolConnect = async (toolId: string) => {
    // Google Drive: OAuth propio por cliente (la conexión que consumen Brand Brain y agentes)
    if (toolId === 'google-drive') {
      if (!clientId) return
      try {
        const res = await fetch('/api/brand-brain/drive/authorize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientId,
            redirectUrl: `${window.location.origin}/api/brand-brain/drive/callback`,
            returnTo: '/integrations',
          }),
        })
        const json = await res.json()
        if (!res.ok || !json.authUrl)
          throw new Error(json.error || t('integrations.oauth-start-error', locale))
        window.location.href = json.authUrl
      } catch (e) {
        setErrorMessage(
          e instanceof Error ? e.message : t('integrations.drive-start-error', locale)
        )
      }
      return
    }
    const tool = MARKETPLACE_TOOLS.find((t) => t.id === toolId)
    // Coming soon: tarjeta visible pero sin flujo de conexión (el endpoint OAuth responde 503)
    if (tool && tool.status !== 'coming_soon') {
      setSelectedToolId(toolId)
    }
  }

  const handleModalConnect = async (data: {
    accountEmail?: string
    accountHandle?: string
    authToken?: string
  }) => {
    if (!selectedToolId) return

    setIsConnecting(true)
    try {
      // Track affiliate click
      await fetch('/api/integrations/affiliate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          toolId: selectedToolId,
          utmSource: 'mira',
          utmMedium: 'integrations_modal',
        }),
      })

      // Connect the tool
      await connectTool({
        toolId: selectedToolId,
        ...data,
      })

      setSelectedToolId(null)
    } catch (error) {
      console.error('Failed to connect tool:', error)
      throw error
    } finally {
      setIsConnecting(false)
    }
  }

  const handleToolDisconnect = async (toolId: string) => {
    try {
      await disconnectTool(toolId)
    } catch (error) {
      console.error('Failed to disconnect tool:', error)
    }
  }

  if (!mounted || isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-ink-tertiary">{t('integrations.loading', locale)}</div>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-8">
        {successMessage && (
          <div className="p-4 rounded bg-emerald-400/10 border border-emerald-400/30 text-emerald-400">
            ✓ {successMessage}
          </div>
        )}
        {errorMessage && (
          <div className="p-4 rounded bg-red-400/10 border border-red-400/30 text-red-400">
            ✕ {errorMessage}
          </div>
        )}

        <div>
          <h1 className="text-4xl font-bold text-ink mb-2">{t('integrations.title', locale)}</h1>
          <p className="text-ink-secondary">{t('integrations.subtitle', locale)}</p>
        </div>

        {driveConnected && driveNeedsReauth && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between rounded-xl border border-amber-500/30 bg-amber-500/10 px-5 py-4">
            <div>
              <p className="text-sm font-semibold text-amber-400">
                {t('integrations.drive-reauth-title', locale)}
              </p>
              <p className="text-sm text-ink-secondary mt-1">
                {t('integrations.drive-reauth-desc', locale)}
              </p>
            </div>
            <button
              onClick={() => handleToolConnect('google-drive')}
              className="shrink-0 px-4 py-2 rounded-lg bg-amber-500 text-black text-sm font-semibold hover:bg-amber-400 transition-colors"
            >
              {t('integrations.drive-reauth-cta', locale)}
            </button>
          </div>
        )}

        {clientId && <UsageCard clientId={clientId} />}

        <ToolsMarketplace
          connectedTools={driveConnected ? [...connectedTools, 'google-drive'] : connectedTools}
          userSubscriptionPlan={userSubscriptionPlan}
          onToolConnect={handleToolConnect}
          onToolDisconnect={handleToolDisconnect}
        />
      </div>

      {selectedTool && (
        <ToolConnectionModal
          tool={{
            id: selectedTool.id,
            name: selectedTool.name,
            emoji: selectedTool.emoji,
            setupUrl: selectedTool.setupUrl,
            description: selectedTool.description,
            authType: selectedTool.authType,
            status: selectedTool.status,
          }}
          isOpen={selectedToolId !== null}
          isConnecting={isConnecting}
          onClose={() => setSelectedToolId(null)}
          onConnect={handleModalConnect}
        />
      )}
    </>
  )
}
