'use client'
import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { clsx } from 'clsx'
import {
  ArrowLeft, BarChart2, MessageSquare,
  Send, TrendingUp, Shield, Zap, Hand, Eye, EyeOff,
} from 'lucide-react'
import { useActiveClient } from '@/lib/client-context'
import { getAgentPrompt } from '@/lib/agent-prompts'
import { AGENT_METADATA } from '@/lib/agent-meta'
import { useAgentChat } from '@/lib/hooks/useAgentChat'
import type { AgentPackage } from '@/lib/types'

type AutonomyLevel = 'always_ask' | 'full_auto'

const AUTONOMY_OPTIONS: { id: AutonomyLevel; label: string; description: string; icon: any }[] = [
  { id: 'always_ask', label: 'Always ask', description: 'Nothing goes out without your explicit ok.', icon: Hand },
  { id: 'full_auto', label: 'Autonomous mode', description: 'Executes and notifies. No interruptions.', icon: Zap },
]

const DEFAULT_AUTONOMY: Record<string, AutonomyLevel> = {
  orchestrator: 'always_ask',
  'content-strategist': 'full_auto',
  copywriter: 'always_ask',
  designer: 'always_ask',
  'content-repurposer': 'always_ask',
  'video-editor': 'always_ask',
  'social-media-manager': 'always_ask',
  'ads-manager': 'full_auto',
  'community-manager': 'always_ask',
}

const IMPROVEMENT_AREAS: Record<AgentPackage | 'default', { label: string; pct: number }[]> = {
  marketing: [
    { label: 'Brand voice accuracy', pct: 94 },
    { label: 'Direct approval rate', pct: 84 },
    { label: 'Execution speed', pct: 78 },
  ],
  comercial: [
    { label: 'ICP match accuracy', pct: 87 },
    { label: 'Pipeline conversion', pct: 72 },
    { label: 'Personalization score', pct: 91 },
  ],
  estrategia: [
    { label: 'Analysis depth', pct: 88 },
    { label: 'Actionability', pct: 82 },
    { label: 'Framework accuracy', pct: 90 },
  ],
  innovacion: [
    { label: 'Trend accuracy', pct: 73 },
    { label: 'Framework application', pct: 85 },
    { label: 'Signal detection', pct: 79 },
  ],
  admin: [
    { label: 'Alert accuracy', pct: 96 },
    { label: 'System coverage', pct: 88 },
    { label: 'Response time', pct: 92 },
  ],
  finanzas: [
    { label: 'Calculation accuracy', pct: 97 },
    { label: 'Plan personalization', pct: 83 },
    { label: 'Risk assessment', pct: 89 },
  ],
  default: [
    { label: 'Response accuracy', pct: 92 },
    { label: 'Task completion rate', pct: 88 },
    { label: 'User satisfaction', pct: 85 },
  ],
}

export default function AgentPage() {
  const router = useRouter()
  const params = useParams()
  const role = params.role as string
  const { activeClient } = useActiveClient()
  const clientId = activeClient?.id || ''
  const [autonomy, setAutonomy] = useState<AutonomyLevel>(DEFAULT_AUTONOMY[role] || 'always_ask')
  const [showSystemPrompt, setShowSystemPrompt] = useState(false)

  const agent = AGENT_METADATA[role]

  const { messages, isLoading, sendMessage } = useAgentChat({
    role,
    clientId,
    autonomy,
  })

  if (!agent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-3xl font-bold mb-2">Agente no encontrado</h1>
        <p className="text-gray-500 mb-4">El agente "{role}" no existe</p>
        <Link href="/comercial" className="text-blue-600 hover:underline">
          Volver a agentes
        </Link>
      </div>
    )
  }

  const improveAreas = IMPROVEMENT_AREAS[agent.department as AgentPackage] || IMPROVEMENT_AREAS.default
  const systemPrompt = getAgentPrompt(role)

  return (
    <div className="flex h-screen bg-white">
      {/* Left Sidebar - Agent Info */}
      <div className="w-80 border-r border-gray-200 overflow-y-auto p-6 bg-gray-50">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition"
        >
          <ArrowLeft size={20} className="mr-2" />
          <span>Back</span>
        </button>

        {/* Agent Header */}
        <div className="mb-8">
          <div
            className={clsx(
              'w-16 h-16 rounded-lg flex items-center justify-center text-4xl mb-4',
              agent.gradient
            )}
          >
            {agent.emoji}
          </div>
          <h1 className="text-2xl font-bold mb-2">{agent.name}</h1>
          <p className="text-sm text-gray-600">{agent.description}</p>
        </div>

        {/* Autonomy Selector */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Autonomy Level</h3>
          <div className="space-y-2">
            {AUTONOMY_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setAutonomy(opt.id)}
                className={clsx(
                  'w-full p-3 rounded-lg border-2 text-left transition',
                  autonomy === opt.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                )}
              >
                <div className="flex items-center gap-2">
                  <opt.icon size={16} className="text-gray-600" />
                  <div>
                    <div className="font-medium text-sm">{opt.label}</div>
                    <div className="text-xs text-gray-500">{opt.description}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Improvement Areas */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <TrendingUp size={16} />
            Performance Metrics
          </h3>
          <div className="space-y-3">
            {improveAreas.map((area) => (
              <div key={area.label} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">{area.label}</span>
                  <span className="font-semibold text-gray-900">{area.pct}%</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 transition-all"
                    style={{ width: `${area.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Prompt Preview */}
        <div>
          <button
            onClick={() => setShowSystemPrompt(!showSystemPrompt)}
            className="w-full p-3 rounded-lg bg-gray-100 hover:bg-gray-200 transition flex items-center justify-between"
          >
            <span className="text-sm font-medium text-gray-900">System Prompt</span>
            {showSystemPrompt ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
          {showSystemPrompt && (
            <div className="mt-3 p-3 bg-gray-100 rounded-lg text-xs text-gray-700 max-h-40 overflow-y-auto whitespace-pre-wrap">
              {systemPrompt.substring(0, 500)}
              {systemPrompt.length > 500 && '...'}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 p-6 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Chat with {agent.name}</h2>
              <p className="text-sm text-gray-500 mt-1">
                Autonomy: <span className="font-medium">{autonomy === 'always_ask' ? 'Always Ask' : 'Autonomous'}</span>
              </p>
            </div>
            <BarChart2 size={24} className="text-gray-400" />
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <MessageSquare size={48} className="mb-4 opacity-50" />
              <p>Start a conversation with {agent.name}</p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div key={idx} className={clsx('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                <div
                  className={clsx(
                    'max-w-md px-4 py-2 rounded-lg',
                    msg.role === 'user'
                      ? 'bg-blue-500 text-white rounded-br-none'
                      : 'bg-gray-100 text-gray-900 rounded-bl-none'
                  )}
                >
                  {msg.content}
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg animate-pulse">
                {agent.name} is thinking...
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-gray-200 p-6 bg-white">
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Ask something..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value) {
                  sendMessage(e.currentTarget.value)
                  e.currentTarget.value = ''
                }
              }}
            />
            <button
              onClick={() => {
                const input = document.querySelector('input[placeholder="Ask something..."]') as HTMLInputElement
                if (input?.value) {
                  sendMessage(input.value)
                  input.value = ''
                }
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex items-center gap-2"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
