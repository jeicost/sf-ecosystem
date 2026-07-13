// FASE B: Agent page with full settings persistence + quick prompts + real activity fallback
'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { clsx } from 'clsx'
import {
  ArrowLeft, CheckCircle, Clock, AlertCircle, Zap, Hand, Shield,
  Copy, Check, Eye, EyeOff, TrendingUp, MessageSquare, Send, Sparkles,
} from 'lucide-react'
import { useActiveClient } from '@/lib/client-context'
import { getAgentPrompt } from '@/lib/agent-prompts'
import { AGENT_METADATA } from '@/lib/agent-meta'
import { AGENT_DETAILS } from '@/lib/agent-details'
import { getQuickPrompts } from '@/lib/agent-quick-prompts'
import { useAgentChat } from '@/lib/hooks/useAgentChat'
import { getAgentActivityTasks, getAgentStats } from '@/lib/agent-activity-stats'
import { useLocaleContext } from '@/app/locale-provider'
import DocumentUploader from '@/components/document-uploader'
import type { AgentPackage } from '@/lib/types'
import type { AgentTask, AgentStats } from '@/lib/agent-activity-stats'

type AutonomyLevel = 'always_ask' | 'full_auto'
type TabId = 'about' | 'history' | 'chat' | 'performance'

const TABS: { id: TabId; label: string; icon: any }[] = [
  { id: 'about', label: 'About', icon: EyeOff },
  { id: 'history', label: 'Activity', icon: Clock },
  { id: 'chat', label: 'Chat', icon: MessageSquare },
  { id: 'performance', label: 'Performance', icon: TrendingUp },
]

const AUTONOMY_OPTIONS: { id: AutonomyLevel; label: string; description: string; icon: any }[] = [
  { id: 'always_ask', label: 'Always ask', description: 'Nothing goes out without your explicit ok.', icon: Hand },
  { id: 'full_auto', label: 'Full autonomy', description: 'Executes and notifies. No interruptions.', icon: Zap },
]

const TASK_STATUS_CONFIG: Record<string, { icon: any; color: string }> = {
  completed: { icon: CheckCircle, color: 'text-green-500' },
  working: { icon: Zap, color: 'text-blue-500' },
  waiting: { icon: Clock, color: 'text-yellow-500' },
}

export default function AgentPage() {
  const router = useRouter()
  const params = useParams()
  const role = params.role as string
  const { activeClient } = useActiveClient()
  const clientId = activeClient?.id || ''
  const [activeTab, setActiveTab] = useState<TabId>('chat')
  const [autonomy, setAutonomy] = useState<AutonomyLevel>('always_ask')
  const [toneLevel, setToneLevel] = useState(0.5)
  const [settingsLoading, setSettingsLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [showUploader, setShowUploader] = useState(false)
  const [uploadingDoc, setUploadingDoc] = useState(false)
  const [recentTasks, setRecentTasks] = useState<AgentTask[]>([])
  const [agentStats, setAgentStats] = useState<AgentStats>({
    totalInteractions: 0,
    completionRate: 0,
    averageResponseTime: '—',
    lastActive: '—',
  })

  const agent = AGENT_METADATA[role]
  const agentDetails = AGENT_DETAILS[role]
  const quickPrompts = getQuickPrompts(role)

  // Load settings and activity data from API on mount
  useEffect(() => {
    if (!clientId) return
    loadSettings()
    loadActivityData()
  }, [clientId, role])

  async function loadSettings() {
    try {
      const res = await fetch(
        `/api/agent-settings?clientId=${clientId}&agentRole=${role}`
      )
      if (!res.ok) throw new Error('Failed to load settings')
      const data = await res.json()
      setAutonomy(data.autonomy)
      setToneLevel(data.toneLevel)
    } catch (err) {
      console.error('Error loading settings:', err)
    } finally {
      setSettingsLoading(false)
    }
  }

  async function loadActivityData() {
    try {
      const tasks = await getAgentActivityTasks(clientId, role)
      const stats = await getAgentStats(clientId, role)
      setRecentTasks(tasks)
      setAgentStats(stats)
    } catch (err) {
      console.error('Error loading activity data:', err)
    }
  }

  // Save settings to API when changed
  async function saveSettings(newAutonomy: AutonomyLevel, newTone: number) {
    if (!clientId) return
    try {
      await fetch('/api/agent-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          agentRole: role,
          autonomy: newAutonomy,
          toneLevel: newTone,
        }),
      })
    } catch (err) {
      console.error('Error saving settings:', err)
    }
  }

  if (!agent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-black">
        <h1 className="text-3xl font-bold text-white mb-2">Agente no encontrado</h1>
        <p className="text-gray-400 mb-6">El agente "{role}" no existe</p>
        <Link href="/comercial" className="text-blue-400 hover:text-blue-300 transition">
          Volver a agentes
        </Link>
      </div>
    )
  }

  const { locale } = useLocaleContext()
  const { messages, isLoading, sendMessage } = useAgentChat({ role, clientId, autonomy, locale })
  const systemPrompt = getAgentPrompt(role, locale)

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(systemPrompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSendMessage = (msg?: string) => {
    const text = msg || inputValue
    if (!text.trim()) return
    sendMessage(text)
    setInputValue('')
  }

  const handleDocumentUpload = async (file: File) => {
    if (!clientId) throw new Error('No client context')
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch(`/api/agent/${role}/upload-document?clientId=${clientId}`, {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')
      setShowUploader(false)
      sendMessage(`I've uploaded a document: ${file.name}. Please analyze it and provide insights.`)
    } catch (err) {
      throw err
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="px-8 py-8 max-w-4xl mx-auto">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-8 transition-colors"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        {/* Header */}
        <div className="flex items-center gap-6 mb-8">
          <div
            className={clsx(
              'w-20 h-20 rounded-3xl flex items-center justify-center text-5xl flex-shrink-0',
              agent.gradient
            )}
            style={{ boxShadow: `0 12px 32px ${agent.color}40` }}
          >
            {agent.emoji}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">{agent.name}</h1>
            <p className="text-slate-400 text-sm mt-1">{agent.description}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-700 flex gap-0 mb-8">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={clsx(
                'flex items-center gap-2 px-4 py-3 text-sm border-b-2 transition-colors',
                activeTab === id
                  ? 'border-blue-500 text-white'
                  : 'border-transparent text-slate-400 hover:text-white'
              )}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>

        {/* Tab: About */}
        {activeTab === 'about' && (
          <div className="space-y-6">
            {/* Tone level */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <h3 className="text-sm font-semibold text-white mb-1">Communication Tone</h3>
              <p className="text-xs text-slate-400 mb-4">How formal or casual is {agent.name}?</p>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400">Casual</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={toneLevel}
                  onChange={(e) => {
                    const newTone = parseFloat(e.target.value)
                    setToneLevel(newTone)
                    saveSettings(autonomy, newTone)
                  }}
                  className="flex-1 h-2 bg-slate-700 rounded-full cursor-pointer accent-blue-500"
                />
                <span className="text-xs text-slate-400">Formal</span>
              </div>
            </div>

            {/* Autonomy */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <h3 className="text-sm font-semibold text-white mb-1">Autonomy Level</h3>
              <p className="text-xs text-slate-400 mb-4">When does {agent.name} need your approval?</p>
              <div className="grid grid-cols-2 gap-3">
                {AUTONOMY_OPTIONS.map(opt => {
                  const Icon = opt.icon
                  const selected = autonomy === opt.id
                  return (
                    <button
                      key={opt.id}
                      onClick={() => {
                        setAutonomy(opt.id)
                        saveSettings(opt.id, toneLevel)
                      }}
                      className={clsx(
                        'p-4 rounded-lg border-2 text-left transition-all',
                        selected
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                      )}
                    >
                      <Icon size={16} className="mb-2" style={{ color: selected ? agent.color : '#94a3b8' }} />
                      <p className="text-xs font-semibold text-white">{opt.label}</p>
                      <p className="text-xs text-slate-400 mt-1 leading-tight">{opt.description}</p>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* System Prompt */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-white">System Prompt</h3>
                <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ background: `${agent.color}25`, color: agent.color }}>
                  v3.1 · active
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-4">Active instructions that define how {agent.name} thinks.</p>
              <div className="bg-black/50 rounded-lg p-4 font-mono text-xs text-slate-400 max-h-48 overflow-y-auto border border-slate-700 whitespace-pre-wrap mb-3">
                {systemPrompt.substring(0, 800)}
                {systemPrompt.length > 800 && '...'}
              </div>
              <button
                onClick={handleCopyPrompt}
                className="flex items-center justify-center gap-2 text-xs px-4 py-2 rounded-lg border transition-all w-full hover:opacity-80"
                style={{ borderColor: `${agent.color}40`, color: copied ? '#22c55e' : agent.color }}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copied!' : 'Copy system prompt'}
              </button>
            </div>
          </div>
        )}

        {/* Tab: Activity */}
        {activeTab === 'history' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-400 mb-4">Latest tasks executed by {agent.name}.</p>
            {recentTasks.length === 0 ? (
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-8 text-center">
                <p className="text-sm text-slate-400">No activity yet</p>
              </div>
            ) : (
              recentTasks.map((task) => {
                const cfg = TASK_STATUS_CONFIG[task.status]
                const StatusIcon = cfg.icon
                return (
                  <div key={task.id} className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 flex items-start gap-3">
                    <StatusIcon size={16} className={clsx('mt-0.5 shrink-0', cfg.color)} />
                    <div className="flex-1">
                      <p className="text-sm text-slate-200">{task.task}</p>
                      <p className="text-xs text-slate-500 mt-1">{task.timeAgo}</p>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* Tab: Chat */}
        {activeTab === 'chat' && (
          <div className="flex flex-col h-[600px] bg-slate-800/30 border border-slate-700 rounded-xl overflow-hidden">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <MessageSquare size={40} className="mb-3 opacity-50 text-slate-400" />
                  <p className="text-sm text-slate-400 mb-6">Start a conversation with {agent.name}</p>
                  <div className="grid grid-cols-1 gap-2 w-full max-w-xs">
                    {quickPrompts.map((prompt, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(prompt)}
                        className="text-left p-3 rounded-lg bg-slate-700/50 hover:bg-slate-700 border border-slate-600 text-xs text-slate-300 hover:text-white transition-all flex items-start gap-2"
                      >
                        <Sparkles size={14} className="mt-0.5 flex-shrink-0" />
                        <span>{prompt}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <div key={idx} className={clsx('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                    <div
                      className={clsx(
                        'max-w-xs px-4 py-2 rounded-lg text-sm',
                        msg.role === 'user'
                          ? 'bg-blue-600 text-white rounded-br-none'
                          : 'bg-slate-700 text-slate-100 rounded-bl-none'
                      )}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))
              )}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-700 text-slate-100 px-4 py-2 rounded-lg rounded-bl-none animate-pulse text-sm">
                    {agent.name} is thinking...
                  </div>
                </div>
              )}
            </div>

            {/* Document Upload Area */}
            {showUploader && (
              <div className="border-t border-slate-700 p-4 bg-slate-800/50">
                <DocumentUploader
                  onUploadComplete={handleDocumentUpload}
                  acceptedTypes={['.pdf', '.docx', '.txt', '.md']}
                  maxSizeMB={50}
                />
              </div>
            )}

            {/* Input */}
            <div className="border-t border-slate-700 p-4 bg-slate-800/50">
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Ask something..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 text-sm"
                />
                <button
                  onClick={() => handleSendMessage()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition flex items-center gap-2 text-sm"
                >
                  <Send size={16} />
                </button>
              </div>
              <button
                onClick={() => setShowUploader(!showUploader)}
                className="text-xs text-slate-400 hover:text-slate-300 transition"
              >
                {uploadingDoc ? 'Uploading...' : showUploader ? 'Hide upload' : '+ Upload document'}
              </button>
            </div>
          </div>
        )}

        {/* Tab: Performance */}
        {activeTab === 'performance' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                <p className="text-xs text-slate-400 mb-1">Total Interactions</p>
                <p className="text-2xl font-bold text-white">{agentStats.totalInteractions}</p>
              </div>
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                <p className="text-xs text-slate-400 mb-1">Completion Rate</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold text-white">{agentStats.completionRate}%</p>
                  <div className="flex-1 h-1 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full transition-all"
                      style={{ width: `${agentStats.completionRate}%`, background: agent.color }}
                    />
                  </div>
                </div>
              </div>
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                <p className="text-xs text-slate-400 mb-1">Avg Response Time</p>
                <p className="text-2xl font-bold text-white">{agentStats.averageResponseTime}</p>
              </div>
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                <p className="text-xs text-slate-400 mb-1">Last Active</p>
                <p className="text-2xl font-bold text-white">{agentStats.lastActive}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
