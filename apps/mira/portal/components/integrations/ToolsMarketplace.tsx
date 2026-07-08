'use client'
import { useState } from 'react'
import { ExternalLink, LogIn, CheckCircle, Lock } from 'lucide-react'

interface Tool {
  id: string
  name: string
  emoji: string
  category: string
  description: string
  pricing: 'free' | 'paid' | 'via_subscription'
  setupUrl: string
  agentsUnlocked: string[]
  departments: string[]
  isCritical: boolean
  affiliateUrl?: string
  status: 'connected' | 'disconnected' | 'locked'
}

interface ToolsMarketplaceProps {
  connectedTools: string[]
  userSubscriptionPlan?: 'free' | 'scale' | 'enterprise'
  onToolConnect?: (toolId: string) => Promise<void>
  onToolDisconnect?: (toolId: string) => Promise<void>
}

const MARKETPLACE_TOOLS: Tool[] = [
  {
    id: 'canva',
    name: 'Canva',
    emoji: '🎨',
    category: 'Design',
    description: 'Design & visual content creation for all marketing assets, posts, and graphics',
    pricing: 'via_subscription',
    setupUrl: 'https://www.canva.com',
    agentsUnlocked: ['zoe', 'nova', 'luna'],
    departments: ['marketing', 'innovation'],
    isCritical: true,
    affiliateUrl: 'https://canva.com/affiliate',
    status: 'disconnected',
  },
  {
    id: 'figma',
    name: 'Figma',
    emoji: '🖌️',
    category: 'Design',
    description: 'UI/UX design & prototyping for digital products and interfaces',
    pricing: 'via_subscription',
    setupUrl: 'https://www.figma.com',
    agentsUnlocked: ['zoe', 'spark'],
    departments: ['marketing', 'innovation'],
    isCritical: false,
    status: 'disconnected',
  },
  {
    id: 'buffer',
    name: 'Buffer',
    emoji: '📅',
    category: 'Social Media',
    description: 'Social media scheduling and content calendar management',
    pricing: 'via_subscription',
    setupUrl: 'https://buffer.com',
    agentsUnlocked: ['noa', 'herald'],
    departments: ['marketing', 'admin'],
    isCritical: true,
    status: 'disconnected',
  },
  {
    id: 'hootsuite',
    name: 'Hootsuite',
    emoji: '🚀',
    category: 'Social Media',
    description: 'Multi-platform social management and analytics',
    pricing: 'via_subscription',
    setupUrl: 'https://hootsuite.com',
    agentsUnlocked: ['noa', 'herald', 'luna'],
    departments: ['marketing'],
    isCritical: false,
    status: 'disconnected',
  },
  {
    id: 'linkedin-navigator',
    name: 'LinkedIn Sales Navigator',
    emoji: '🔍',
    category: 'Sales',
    description: 'Advanced lead discovery and B2B prospect research',
    pricing: 'via_subscription',
    setupUrl: 'https://business.linkedin.com/sales-solutions',
    agentsUnlocked: ['rex', 'vera', 'finn'],
    departments: ['sales', 'strategy'],
    isCritical: true,
    status: 'disconnected',
  },
  {
    id: 'salesforce',
    name: 'Salesforce',
    emoji: '💼',
    category: 'CRM',
    description: 'CRM and sales pipeline management for deal tracking',
    pricing: 'paid',
    setupUrl: 'https://salesforce.com',
    agentsUnlocked: ['quinn', 'nova', 'ledger'],
    departments: ['sales', 'finance'],
    isCritical: true,
    status: 'disconnected',
  },
  {
    id: 'slack',
    name: 'Slack',
    emoji: '💬',
    category: 'Communication',
    description: 'Team communication and real-time notifications',
    pricing: 'via_subscription',
    setupUrl: 'https://slack.com',
    agentsUnlocked: ['herald', 'pulse', 'compliance'],
    departments: ['admin', 'marketing', 'sales'],
    isCritical: false,
    status: 'disconnected',
  },
  {
    id: 'google-workspace',
    name: 'Google Workspace',
    emoji: '📊',
    category: 'Productivity',
    description: 'Docs, Sheets, and Gmail integration for document collaboration',
    pricing: 'via_subscription',
    setupUrl: 'https://workspace.google.com',
    agentsUnlocked: ['onboard', 'midas', 'quant'],
    departments: ['admin', 'finance', 'strategy'],
    isCritical: false,
    status: 'disconnected',
  },
]

export default function ToolsMarketplace({
  connectedTools,
  userSubscriptionPlan = 'free',
  onToolConnect,
  onToolDisconnect,
}: ToolsMarketplaceProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [connectingTools, setConnectingTools] = useState<Set<string>>(new Set())

  const categories = Array.from(new Set(MARKETPLACE_TOOLS.map((t) => t.category)))

  const filteredTools = selectedCategory
    ? MARKETPLACE_TOOLS.filter((t) => t.category === selectedCategory)
    : MARKETPLACE_TOOLS

  const criticalTools = MARKETPLACE_TOOLS.filter((t) => t.isCritical)
  const connectedCritical = criticalTools.filter((t) => connectedTools.includes(t.id)).length

  const canAccessViaSubscription = userSubscriptionPlan !== 'free'

  const handleToolClick = async (tool: Tool) => {
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
        <h1 className="text-3xl font-bold text-white">Tools Marketplace</h1>
        <p className="text-[#999]">
          Connect your favorite tools to unlock agent capabilities. Critical tools must be connected
          for full system functionality.
        </p>
      </div>

      {/* Critical Tools Status */}
      <div className="card p-6 border border-[#F59E0B]40 bg-[#F59E0B]10 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-white mb-1">Critical Tools</h3>
            <p className="text-sm text-[#999]">
              {connectedCritical} of {criticalTools.length} connected
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-[#F59E0B]">
              {Math.round((connectedCritical / criticalTools.length) * 100)}%
            </div>
            <div className="text-xs text-[#999]">Operational</div>
          </div>
        </div>
        <div className="w-full bg-[#1E1E1E] rounded h-2 overflow-hidden">
          <div
            className="h-full bg-[#F59E0B] transition-all"
            style={{ width: `${(connectedCritical / criticalTools.length) * 100}%` }}
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
              : 'bg-[#1E1E1E] text-[#999] hover:text-white'
          }`}
        >
          All Tools
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded text-sm font-medium transition-all ${
              selectedCategory === cat
                ? 'bg-[#EC4899] text-white'
                : 'bg-[#1E1E1E] text-[#999] hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTools.map((tool) => {
          const isConnected = connectedTools.includes(tool.id)
          const isAccessible =
            tool.pricing === 'free' ||
            (tool.pricing === 'via_subscription' && canAccessViaSubscription) ||
            userSubscriptionPlan === 'enterprise'

          return (
            <div
              key={tool.id}
              className={`card p-5 border transition-all ${
                isConnected
                  ? 'border-[#10B981] bg-[#10B981]10'
                  : tool.isCritical
                    ? 'border-[#F59E0B] hover:bg-[#1E1E1E]'
                    : 'border-[#1E1E1E] hover:border-[#333]'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{tool.emoji}</span>
                  <div>
                    <h3 className="font-semibold text-white">{tool.name}</h3>
                    <p className="text-xs text-[#666]">{tool.category}</p>
                  </div>
                </div>
                {isConnected && (
                  <CheckCircle size={20} className="text-[#10B981] flex-shrink-0" />
                )}
              </div>

              {/* Description */}
              <p className="text-sm text-[#999] mb-4">{tool.description}</p>

              {/* Agents & Status */}
              <div className="space-y-3 mb-4 pb-4 border-t border-[#1E1E1E]">
                <div>
                  <div className="text-xs font-semibold text-[#666] mb-2">Unlocks Agents</div>
                  <div className="flex flex-wrap gap-1">
                    {tool.agentsUnlocked.map((agent) => (
                      <span
                        key={agent}
                        className="px-2 py-0.5 text-xs rounded bg-[#EC4899]20 text-[#EC4899]"
                      >
                        {agent}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-xs font-semibold text-[#666] mb-2">Departments</div>
                  <div className="flex flex-wrap gap-1">
                    {tool.departments.map((dept) => (
                      <span key={dept} className="px-2 py-0.5 text-xs rounded bg-[#333] text-[#999]">
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
                    <span className="px-2 py-0.5 text-xs rounded font-semibold bg-[#FF6B6B]20 text-[#FF6B6B]">
                      Critical
                    </span>
                  )}
                  <span className="text-xs text-[#666]">
                    {tool.pricing === 'via_subscription'
                      ? 'Via Subscription'
                      : tool.pricing === 'free'
                        ? 'Free'
                        : 'Paid'}
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <button
                disabled={(!isAccessible && !isConnected) || connectingTools.has(tool.id)}
                onClick={() => handleToolClick(tool)}
                className={`w-full mt-4 px-4 py-2 rounded font-medium text-sm flex items-center justify-center gap-2 transition-all ${
                  isConnected
                    ? 'bg-[#10B981] text-white hover:bg-[#059669]'
                    : isAccessible
                      ? 'bg-[#EC4899] text-white hover:bg-[#E00B7F]'
                      : 'bg-[#333] text-[#666] cursor-not-allowed'
                }`}
              >
                {connectingTools.has(tool.id) ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Connecting...
                  </>
                ) : isConnected ? (
                  <>
                    <CheckCircle size={16} />
                    Connected
                  </>
                ) : isAccessible ? (
                  <>
                    <LogIn size={16} />
                    Connect Account
                  </>
                ) : (
                  <>
                    <Lock size={16} />
                    Upgrade Plan
                  </>
                )}
                {!connectingTools.has(tool.id) && <ExternalLink size={14} />}
              </button>
            </div>
          )
        })}
      </div>

      {/* Info Box */}
      <div className="p-4 rounded border border-[#1E1E1E] bg-[#0D0D0D] space-y-2">
        <div className="text-sm font-semibold text-white">Why connect tools?</div>
        <ul className="text-xs text-[#999] space-y-1">
          <li>✓ Unlock specialized agents for each tool</li>
          <li>✓ Automate content creation, scheduling, and analytics</li>
          <li>✓ All critical tools must be connected for 100% operational status</li>
          <li>✓ Subscriptions include tool access — no extra costs with MIRA Premium</li>
        </ul>
      </div>
    </div>
  )
}
