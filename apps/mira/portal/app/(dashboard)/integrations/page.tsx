'use client'
import { useActiveClient } from '@/lib/client-context'
import { useToolConnections } from '@/lib/hooks/useToolConnections'
import ToolsMarketplace from '@/components/integrations/ToolsMarketplace'
import ToolConnectionModal from '@/components/integrations/ToolConnectionModal'
import UsageCard from '@/components/UsageCard'
import { MARKETPLACE_TOOLS } from '@/lib/integrations/marketplace-tools'
import { useEffect, useState } from 'react'

export default function IntegrationsPage() {
  const { activeClient } = useActiveClient()
  const clientId = activeClient?.id
  const { connectedTools, userSubscriptionPlan, isLoading, connectTool, disconnectTool } =
    useToolConnections(clientId || '')
  const [mounted, setMounted] = useState(false)
  const [selectedToolId, setSelectedToolId] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [driveConnected, setDriveConnected] = useState(false)

  useEffect(() => {
    setMounted(true)

    // Check for OAuth callback messages
    const params = new URLSearchParams(window.location.search)
    const success = params.get('success')
    const error = params.get('error')
    const drive = params.get('drive')

    if (success) {
      setSuccessMessage(`${success} connected successfully!`)
      // Clear URL
      window.history.replaceState({}, '', '/integrations')
      setTimeout(() => setSuccessMessage(null), 5000)
    }
    if (error) {
      setErrorMessage(`Connection failed: ${error}`)
      window.history.replaceState({}, '', '/integrations')
      setTimeout(() => setErrorMessage(null), 5000)
    }
    if (drive === 'connected') {
      setSuccessMessage('Google Drive conectado. Ya puedes añadir carpetas en Brand Brain → Documents.')
      window.history.replaceState({}, '', '/integrations')
      setTimeout(() => setSuccessMessage(null), 8000)
    } else if (drive === 'error') {
      setErrorMessage(`Google Drive: ${params.get('reason') || 'error de conexión'}`)
      window.history.replaceState({}, '', '/integrations')
      setTimeout(() => setErrorMessage(null), 8000)
    }
  }, [])

  // Estado real de la conexión Drive del cliente activo
  useEffect(() => {
    if (!clientId) return
    fetch(`/api/brand-brain/drive/folders?clientId=${clientId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => setDriveConnected(!!j?.connected))
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
        if (!res.ok || !json.authUrl) throw new Error(json.error || 'No se pudo iniciar OAuth')
        window.location.href = json.authUrl
      } catch (e) {
        setErrorMessage(e instanceof Error ? e.message : 'Error iniciando Google Drive')
      }
      return
    }
    const tool = MARKETPLACE_TOOLS.find((t) => t.id === toolId)
    if (tool) {
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
        <div className="text-[#666]">Loading integrations...</div>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-8">
        {successMessage && (
          <div className="p-4 rounded bg-[#10B981]20 border border-[#10B981] text-[#10B981]">
            ✓ {successMessage}
          </div>
        )}
        {errorMessage && (
          <div className="p-4 rounded bg-[#FF6B6B]20 border border-[#FF6B6B] text-[#FF6B6B]">
            ✕ {errorMessage}
          </div>
        )}

        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Integrations</h1>
          <p className="text-[#999]">
            Connect your favorite tools and services to power your MIRA agents.
          </p>
        </div>

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
