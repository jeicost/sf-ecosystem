'use client'
import { useActiveClient } from '@/lib/client-context'
import { useToolConnections } from '@/lib/hooks/useToolConnections'
import ToolsMarketplace from '@/components/integrations/ToolsMarketplace'
import ToolConnectionModal from '@/components/integrations/ToolConnectionModal'
import { MARKETPLACE_TOOLS } from '@/lib/integrations/marketplace-tools'
import { CLIENT_ID } from '@/lib/constants'
import { useEffect, useState } from 'react'

export default function IntegrationsPage() {
  const { activeClient } = useActiveClient()
  const clientId = activeClient?.id ?? CLIENT_ID
  const { connectedTools, userSubscriptionPlan, isLoading, connectTool, disconnectTool } =
    useToolConnections(clientId)
  const [mounted, setMounted] = useState(false)
  const [selectedToolId, setSelectedToolId] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const selectedTool = MARKETPLACE_TOOLS.find((t) => t.id === selectedToolId)

  const handleToolConnect = async (toolId: string) => {
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
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Integrations</h1>
          <p className="text-[#999]">
            Connect your favorite tools and services to power your MIRA agents.
          </p>
        </div>

        <ToolsMarketplace
          connectedTools={connectedTools}
          userSubscriptionPlan={userSubscriptionPlan}
          onToolConnect={handleToolConnect}
          onToolDisconnect={handleToolDisconnect}
        />
      </div>

      {selectedTool && (
        <ToolConnectionModal
          tool={selectedTool}
          isOpen={selectedToolId !== null}
          isConnecting={isConnecting}
          onClose={() => setSelectedToolId(null)}
          onConnect={handleModalConnect}
        />
      )}
    </>
  )
}
