// FASE B: Agent page with full settings persistence + quick prompts + real activity fallback
'use client'
import { useState, useRef, useEffect } from 'react'
import AgentArchetypeWrapper from '@/components/archetypes/AgentArchetypeWrapper'
import { getArchetype } from '@/lib/agent-archetypes'
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
import { safeLookup } from '@/lib/safe-lookup'
import { getQuickPrompts } from '@/lib/agent-quick-prompts'
import { useAgentChat } from '@/lib/hooks/useAgentChat'
import { getAgentActivityTasks, getAgentStats } from '@/lib/agent-activity-stats'
import { useLocaleContext } from '@/app/locale-provider'
import { t } from '@/lib/i18n'
import type { Attachment } from '@/lib/attachments'
import ChatThread from '@/components/chat/ChatThread'
import ChatComposer from '@/components/chat/ChatComposer'
import Card from '@/components/ui/Card'
import type { AgentPackage } from '@/lib/types'
import type { AgentTask, AgentStats } from '@/lib/agent-activity-stats'

type AutonomyLevel = 'always_ask' | 'full_auto'
type TabId = 'about' | 'history' | 'chat' | 'workspace' | 'performance'
type WorkspaceStatusState = 'loading' | 'ready' | 'empty' | 'error'

const TABS: { id: TabId; labelKey: string; icon: any }[] = [
  { id: 'about', labelKey: 'agent.tab.about', icon: EyeOff },
  { id: 'history', labelKey: 'agent.tab.activity', icon: Clock },
  { id: 'chat', labelKey: 'agent.tab.chat', icon: MessageSquare },
  { id: 'workspace', labelKey: 'agent.tab.workspace', icon: LayoutGrid },
  { id: 'performance', labelKey: 'agent.tab.performance', icon: TrendingUp },
]

const AUTONOMY_OPTIONS: { id: AutonomyLevel; labelKey: string; descKey: string; icon: any }[] = [
  { id: 'always_ask', labelKey: 'agent.autonomy.always-ask', descKey: 'agent.autonomy.always-ask-desc', icon: Hand },
  { id: 'full_auto', labelKey: 'agent.autonomy.full-auto', descKey: 'agent.autonomy.full-auto-desc', icon: Zap },
]

// Endpoint per archetype (lib/{oracle,analyst,explorer,architect,sentinel}-data.ts
// + the pre-existing app/api/studio/approved-visuals). Adding a new agent to
// an EXISTING archetype needs zero changes here -- only its lib/*-data.ts
// internal role map grows by one line.
function workspaceEndpoint(role: string, clientId: string): string {
  const archetype = getArchetype(role)
  const qs = `clientId=${clientId}&role=${role}`
  switch (archetype) {
    case 'ORACLE':
      return `/api/archetypes/oracle-data?${qs}`
    case 'ANALYST':
      return `/api/archetypes/analyst-data?${qs}`
    case 'EXPLORER':
      return `/api/archetypes/explorer-data?clientId=${clientId}`
    case 'ARCHITECT':
      return `/api/archetypes/architect-data?${qs}`
    case 'SENTINEL':
      return `/api/archetypes/sentinel-data?clientId=${clientId}`
    case 'STUDIO':
    default:
      return `/api/studio/approved-visuals?clientId=${clientId}`
  }
}

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
  const [workspaceStatus, setWorkspaceStatus] = useState<WorkspaceStatusState>('loading')
  const [workspaceData, setWorkspaceData] = useState<any>(undefined)
  const [workspaceErrorMessage, setWorkspaceErrorMessage] = useState<string | undefined>(undefined)
  const [agentStats, setAgentStats] = useState<AgentStats>({
    totalInteractions: 0,
    completionRate: 0,
    averageResponseTime: '—',
    lastActive: '—',
  })

  const agent = safeLookup(AGENT_METADATA, role)
  const agentDetails = safeLookup(AGENT_DETAILS, role)
  const quickPrompts = getQuickPrompts(role)

  // Load settings and activity data from API on mount
  useEffect(() => {
    if (!clientId) return
    loadSettings()
    loadActivityData()
    loadWorkspaceData()
  }, [clientId, role])

  async function loadWorkspaceData() {
    setWorkspaceStatus('loading')
    try {
      const res = await fetch(workspaceEndpoint(role, clientId))
      if (!res.ok) throw new Error('Failed to load workspace data')
      const json = await res.json()
      setWorkspaceStatus(json.status)
      setWorkspaceData(json.status === 'ready' ? json.data : undefined)
      setWorkspaceErrorMessage(json.status === 'error' ? json.message : undefined)
    } catch (err) {
      console.error('Error loading workspace data:', err)
      setWorkspaceStatus('error')
      setWorkspaceErrorMessage(err instanceof Error ? err.message : 'Unknown error')
    }
  }

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

  const { messages, isLoading, error, sendMessage, sendFeedback, cancel } = useAgentChat({ role, clientId, projectId, autonomy, toneLevel, locale })
  const systemPrompt = getAgentPrompt(role, locale)

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(systemPrompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSendMessage = (msg?: string, attachments?: Attachment[]) => {
    const text = (msg ?? inputValue).trim()
    if (!text && !attachments?.length) return
    sendMessage(text, attachments)
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
          {TABS.map(({ id, labelKey, icon: Icon }) => (
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
              {t(labelKey, locale)}
            </button>
          ))}
        </div>

        {/* Tab: About */}
        {activeTab === 'about' && (
          <div className="space-y-6">
            {/* Tone level */}
            <Card radius="card" padding="lg">
              <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{t('agent.about.tone', locale)}</h3>
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
              <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{t('agent.about.autonomy', locale)}</h3>
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
                      <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{t(opt.labelKey, locale)}</p>
                      <p className="text-xs mt-1 leading-tight" style={{ color: 'var(--text-secondary)' }}>{t(opt.descKey, locale)}</p>
                    </button>
                  )
                })}
              </div>
            </Card>

            {/* System Prompt */}
            <Card radius="card" padding="lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{t('agent.about.system-prompt', locale)}</h3>
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
                {copied ? t('agent.about.copied', locale) : t('agent.about.copy-prompt', locale)}
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
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t('agent.activity.none', locale)}</p>
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

        {/* Tab: Workspace */}
        {activeTab === 'workspace' && (
          // P4/2026-07-30: la interfaz por ARQUETIPO (Oracle/Analyst/Explorer/
          // Architect/Sentinel/Studio) con datos reales por rol -- ver
          // lib/{oracle,analyst,explorer,architect,sentinel}-data.ts.
          <AgentArchetypeWrapper
            agentId={role}
            agentName={agent.name}
            agentColor={agent.color}
            agentEmoji={agent.emoji}
            clientId={clientId}
            status={workspaceStatus}
            errorMessage={workspaceErrorMessage}
            variants={workspaceData}
            data={workspaceData}
            projects={workspaceData}
          />
        )}

        {activeTab === 'chat' && (
          <div className="flex flex-col h-[600px] rounded-xl overflow-hidden" style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
          }}>
            {/* Reescrito el 2026-08-06 sobre components/chat: antes pintaba
                `{msg.content}` en crudo (sin markdown, sin siquiera pre-wrap),
                con burbujas `max-w-xs` de 320px para respuestas que los
                prompts piden en forma de tabla, y SIN autoscroll de ningún
                tipo dentro de un contenedor de 600px. */}
            <ChatThread
              messages={messages}
              isLoading={isLoading}
              error={error}
              chatKey={`agent:${role}`}
              thinkingLabel={`${agent.name} is thinking…`}
              onSelectOption={(opt) => handleSendMessage(opt)}
              onFeedback={(idx, value) => sendFeedback(idx, value)}
              emptyState={
                <div className="flex flex-col items-center justify-center h-full">
                  <MessageSquare size={40} className="mb-3" style={{ opacity: 0.5, color: 'var(--text-secondary)' }} />
                  <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                    Start a conversation with {agent.name}
                  </p>
                  <div className="grid grid-cols-1 gap-2 w-full max-w-sm">
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
              }
            />

            <ChatComposer
              onSend={(text, attachments) => handleSendMessage(text, attachments)}
              onCancel={cancel}
              isLoading={isLoading}
              clientId={activeClient?.id}
              accent={agent.color}
              chatKey={`agent:${role}`}
              placeholder="Ask something…"
            />
          </div>
        )}

        {/* Tab: Performance */}
        {activeTab === 'performance' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card radius="card" padding="lg">
                <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>{t('agent.performance.total-interactions', locale)}</p>
                <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{agentStats.totalInteractions}</p>
              </Card>
              <Card radius="card" padding="lg">
                <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>{t('agent.performance.completion-rate', locale)}</p>
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
                <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>{t('agent.performance.avg-response', locale)}</p>
                <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{agentStats.averageResponseTime}</p>
              </Card>
              <Card radius="card" padding="lg">
                <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>{t('agent.performance.last-active', locale)}</p>
                <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{agentStats.lastActive}</p>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
