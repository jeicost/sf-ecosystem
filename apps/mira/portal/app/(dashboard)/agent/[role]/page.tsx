// FASE B: Agent page with full settings persistence + quick prompts + real activity fallback
'use client'
import { useState, useRef, useEffect } from 'react'
import AgentArchetypeWrapper from '@/components/archetypes/AgentArchetypeWrapper'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { clsx } from 'clsx'
import {
  ArrowLeft, CheckCircle, Clock, AlertCircle, Zap, Hand, Shield,
  Copy, Check, Eye, EyeOff, TrendingUp, MessageSquare, Send, Sparkles,
  ThumbsUp, ThumbsDown, LayoutGrid,
} from 'lucide-react'
import { useActiveClient } from '@/lib/client-context'
import { getAgentPrompt } from '@/lib/agent-prompts'
import { AGENT_METADATA } from '@/lib/agent-meta'
import { AGENT_DETAILS } from '@/lib/agent-details'
import { getQuickPrompts } from '@/lib/agent-quick-prompts'
import { useAgentChat } from '@/lib/hooks/useAgentChat'
import { getAgentActivityTasks, getAgentStats } from '@/lib/agent-activity-stats'
import { useLocaleContext } from '@/app/locale-provider'
import { t } from '@/lib/i18n'
import DocumentUploader from '@/components/document-uploader'
import Card from '@/components/ui/Card'
import type { AgentPackage } from '@/lib/types'
import type { AgentTask, AgentStats } from '@/lib/agent-activity-stats'

type AutonomyLevel = 'always_ask' | 'full_auto'
type TabId = 'about' | 'history' | 'chat' | 'workspace' | 'performance'

const TABS: { id: TabId; label: string; icon: any }[] = [
  { id: 'about', label: 'About', icon: EyeOff },
  { id: 'history', label: 'Activity', icon: Clock },
  { id: 'chat', label: 'Chat', icon: MessageSquare },
  { id: 'workspace', label: 'Workspace', icon: LayoutGrid },
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
  const searchParams = useSearchParams()
  const projectId = searchParams.get('project')
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

  const { locale } = useLocaleContext()

  if (!agent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen" style={{ background: 'var(--bg-page)' }}>
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          {t('agent.not-found.title', locale)}
        </h1>
        <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
          {t('agent.not-found.description', locale).replace('{role}', role)}
        </p>
        <Link href="/comercial" style={{ color: 'var(--text-tertiary)' }} className="hover:opacity-80 transition">
          {t('common.back-to-home', locale)}
        </Link>
      </div>
    )
  }

  const { messages, isLoading, sendMessage, sendFeedback } = useAgentChat({ role, clientId, projectId, autonomy, locale })
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
    <div className="min-h-screen" style={{ background: 'var(--bg-page)' }}>
      <div className="px-8 py-8 max-w-4xl mx-auto">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm mb-8 transition-colors"
          style={{ color: 'var(--text-secondary)', opacity: 0.8 }}
        >
          <ArrowLeft size={16} />
          {t('common.back', locale)}
        </button>

        {/* Header */}
        <div className="flex items-center gap-6 mb-8">
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center text-5xl flex-shrink-0"
            style={{
              background: `linear-gradient(135deg, ${agent.color}30, ${agent.color}10)`,
              border: `1px solid ${agent.color}30`,
              boxShadow: `0 12px 32px ${agent.color}25`,
            }}
          >
            {agent.emoji}
          </div>
          <div>
            <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {agent.name}
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              {agent.description}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 mb-8" style={{ borderBottom: '1px solid var(--border)' }}>
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className="flex items-center gap-2 px-4 py-3 text-sm transition-colors"
              style={{
                borderBottomWidth: '2px',
                borderBottomColor: activeTab === id ? agent.color : 'transparent',
                color: activeTab === id ? 'var(--text-primary)' : 'var(--text-secondary)',
              }}
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
            <Card radius="card" padding="lg">
              <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Communication Tone</h3>
              <p className="text-xs mb-4" style={{ color: 'var(--text-secondary)' }}>How formal or casual is {agent.name}?</p>
              <div className="flex items-center gap-3">
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Casual</span>
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
                  className="flex-1 h-2 rounded-full cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, var(--bg-surface) 0%, ${agent.color} ${toneLevel * 100}%, var(--bg-surface) ${toneLevel * 100}%, var(--bg-surface) 100%)`,
                    accentColor: agent.color,
                  }}
                />
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Formal</span>
              </div>
            </Card>

            {/* Autonomy */}
            <Card radius="card" padding="lg">
              <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Autonomy Level</h3>
              <p className="text-xs mb-4" style={{ color: 'var(--text-secondary)' }}>When does {agent.name} need your approval?</p>
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
                      className="p-4 rounded-lg text-left transition-all"
                      style={{
                        background: selected ? `${agent.color}15` : 'var(--bg-surface)',
                        border: `2px solid ${selected ? agent.color : 'var(--border)'}`,
                      }}
                    >
                      <Icon size={16} className="mb-2" style={{ color: selected ? agent.color : 'var(--text-secondary)' }} />
                      <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{opt.label}</p>
                      <p className="text-xs mt-1 leading-tight" style={{ color: 'var(--text-secondary)' }}>{opt.description}</p>
                    </button>
                  )
                })}
              </div>
            </Card>

            {/* System Prompt */}
            <Card radius="card" padding="lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>System Prompt</h3>
                <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ background: `${agent.color}25`, color: agent.color }}>
                  v3.1 · active
                </span>
              </div>
              <p className="text-xs mb-4" style={{ color: 'var(--text-secondary)' }}>Active instructions that define how {agent.name} thinks.</p>
              <div className="rounded-lg p-4 font-mono text-xs max-h-48 overflow-y-auto whitespace-pre-wrap mb-3" style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                color: 'var(--text-secondary)',
              }}>
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
            </Card>
          </div>
        )}

        {/* Tab: Activity */}
        {activeTab === 'history' && (
          <div className="space-y-3">
            <p className="text-xs mb-4" style={{ color: 'var(--text-secondary)' }}>Latest tasks executed by {agent.name}.</p>
            {recentTasks.length === 0 ? (
              <Card radius="card" padding="lg" className="text-center">
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No activity yet</p>
              </Card>
            ) : (
              recentTasks.map((task) => {
                const cfg = TASK_STATUS_CONFIG[task.status]
                const StatusIcon = cfg.icon
                return (
                  <Card key={task.id} radius="card" padding="lg" className="flex items-start gap-3">
                    <StatusIcon size={16} className={clsx('mt-0.5 shrink-0', cfg.color)} />
                    <div className="flex-1">
                      <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{task.task}</p>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>{task.timeAgo}</p>
                    </div>
                  </Card>
                )
              })
            )}
          </div>
        )}

        {/* Tab: Chat */}
        {activeTab === 'workspace' && (
          // P4: la interfaz por ARQUETIPO (Oracle/Analyst/Explorer/Architect/
          // Sentinel/Studio) por fin conectada a la página real del agente.
          <AgentArchetypeWrapper
            agentId={role}
            agentName={agent.name}
            agentColor={agent.color}
            agentEmoji={agent.emoji}
          />
        )}

        {activeTab === 'chat' && (
          <div className="flex flex-col h-[600px] rounded-xl overflow-hidden" style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
          }}>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <MessageSquare size={40} className="mb-3" style={{ opacity: 0.5, color: 'var(--text-secondary)' }} />
                  <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>Start a conversation with {agent.name}</p>
                  <div className="grid grid-cols-1 gap-2 w-full max-w-xs">
                    {quickPrompts.map((prompt, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(prompt)}
                        className="text-left p-3 rounded-lg text-xs transition-all flex items-start gap-2 hover:opacity-80"
                        style={{
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border-subtle)',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        <Sparkles size={14} className="mt-0.5 flex-shrink-0" />
                        <span>{prompt}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isStreamingThisMessage = isLoading && idx === messages.length - 1 && msg.role === 'assistant'
                  return (
                    <div key={idx} className={clsx('flex flex-col', msg.role === 'user' ? 'items-end' : 'items-start')}>
                      <div
                        className="max-w-xs px-4 py-2 rounded-lg text-sm"
                        style={{
                          background: msg.role === 'user' ? `${agent.color}20` : `${agent.color}15`,
                          color: 'var(--text-primary)',
                          borderBottomRightRadius: msg.role === 'user' ? 0 : undefined,
                          borderBottomLeftRadius: msg.role === 'user' ? undefined : 0,
                        }}
                      >
                        {msg.content}
                      </div>
                      {msg.role === 'assistant' && msg.content && !isStreamingThisMessage && (
                        <div className="flex items-center gap-1 mt-1 px-1">
                          <button
                            type="button"
                            aria-label={t('agent-chat.feedback-helpful', locale)}
                            onClick={() => sendFeedback(idx, 'helpful')}
                            className="p-1 rounded hover:opacity-100"
                            style={{ opacity: msg.feedback === 'helpful' ? 1 : 0.35, color: msg.feedback === 'helpful' ? '#22C55E' : 'var(--text-secondary)' }}
                          >
                            <ThumbsUp size={13} />
                          </button>
                          <button
                            type="button"
                            aria-label={t('agent-chat.feedback-not-helpful', locale)}
                            onClick={() => sendFeedback(idx, 'not_helpful')}
                            className="p-1 rounded hover:opacity-100"
                            style={{ opacity: msg.feedback === 'not_helpful' ? 1 : 0.35, color: msg.feedback === 'not_helpful' ? '#EF4444' : 'var(--text-secondary)' }}
                          >
                            <ThumbsDown size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="px-4 py-2 rounded-lg rounded-bl-none animate-pulse text-sm" style={{
                    background: `${agent.color}15`,
                    color: 'var(--text-primary)',
                  }}>
                    {agent.name} is thinking...
                  </div>
                </div>
              )}
            </div>

            {/* Document Upload Area */}
            {showUploader && (
              <div className="p-4" style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-card)' }}>
                <DocumentUploader
                  onUploadComplete={handleDocumentUpload}
                  acceptedTypes={['.pdf', '.docx', '.txt', '.md']}
                  maxSizeMB={50}
                />
              </div>
            )}

            {/* Input */}
            <div className="p-4" style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-card)' }}>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Ask something..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1 px-4 py-2 rounded-lg text-sm focus:outline-none transition-all"
                  style={{
                    background: 'var(--bg-surface)',
                    border: `1px solid var(--border)`,
                    color: 'var(--text-primary)',
                  }}
                />
                <button
                  onClick={() => handleSendMessage()}
                  className="px-4 py-2 rounded-lg transition flex items-center gap-2 text-sm hover:opacity-90"
                  style={{
                    background: agent.color,
                    color: '#ffffff',
                  }}
                >
                  <Send size={16} />
                </button>
              </div>
              <button
                onClick={() => setShowUploader(!showUploader)}
                className="text-xs transition hover:opacity-80"
                style={{ color: 'var(--text-secondary)' }}
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
              <Card radius="card" padding="lg">
                <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Total Interactions</p>
                <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{agentStats.totalInteractions}</p>
              </Card>
              <Card radius="card" padding="lg">
                <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Completion Rate</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{agentStats.completionRate}%</p>
                  <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'var(--bg-surface)' }}>
                    <div
                      className="h-full transition-all"
                      style={{ width: `${agentStats.completionRate}%`, background: agent.color }}
                    />
                  </div>
                </div>
              </Card>
              <Card radius="card" padding="lg">
                <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Avg Response Time</p>
                <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{agentStats.averageResponseTime}</p>
              </Card>
              <Card radius="card" padding="lg">
                <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Last Active</p>
                <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{agentStats.lastActive}</p>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
