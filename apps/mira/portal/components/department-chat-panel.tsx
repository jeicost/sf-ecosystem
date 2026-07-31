'use client'
import { useState } from 'react'
import { MessageSquare, Send, ThumbsUp, ThumbsDown } from 'lucide-react'
import { clsx } from 'clsx'
import { useActiveClient } from '@/lib/client-context'
import { useAgentChat } from '@/lib/hooks/useAgentChat'
import { useLocaleContext } from '@/app/locale-provider'
import { t } from '@/lib/i18n'
import { DEPARTMENT_METADATA, type DepartmentMetadata } from '@/lib/department-meta'
import { getDepartmentChatName } from '@/lib/department-prompt'
import { DepartmentQuickActions } from '@/components/quick-actions/DepartmentQuickActions'
import type { QuickActionDef } from '@/lib/quick-actions/registry'

interface DepartmentChatPanelProps {
  slug: DepartmentMetadata['slug']
  quickActionsDepartment: QuickActionDef['department']
}

// Chat de equipo embebido directamente en la página del departamento (antes
// vivía en /agent/dept/[slug], reachable solo vía el botón "Talk to the whole
// team" en el header) con las Quick Actions del departamento debajo, dentro
// de la misma sección — sustituye a DepartmentQuickActions en su posición.
export default function DepartmentChatPanel({ slug, quickActionsDepartment }: DepartmentChatPanelProps) {
  const { activeClient } = useActiveClient()
  const clientId = activeClient?.id || ''
  const { locale } = useLocaleContext()
  const [input, setInput] = useState('')

  const dept = DEPARTMENT_METADATA[slug]
  const deptName = locale === 'en' ? dept.name : dept.nameEs
  const agentDisplayName = getDepartmentChatName(slug, locale)
  const { messages, isLoading, sendMessage, sendFeedback } = useAgentChat({
    role: `dept:${slug}`,
    clientId,
    locale,
    agentDisplayName,
  })

  const handleSend = () => {
    const text = input.trim()
    if (!text) return
    sendMessage(text)
    setInput('')
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-ink mb-3">
          {t('department-chat.heading', locale).replace('{dept}', deptName)}
        </h3>

        <div
          className="flex flex-col h-[600px] rounded-xl overflow-hidden"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
        >
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full">
                <MessageSquare size={40} className="mb-3" style={{ opacity: 0.5, color: 'var(--text-secondary)' }} />
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {t('department-chat.empty', locale).replace('{dept}', deptName)}
                </p>
              </div>
            ) : (
              messages.map((msg, idx) => {
                const isStreamingThisMessage = isLoading && idx === messages.length - 1 && msg.role === 'assistant'
                return (
                  <div key={idx} className={clsx('flex flex-col', msg.role === 'user' ? 'items-end' : 'items-start')}>
                    <div
                      className="max-w-md px-4 py-2 rounded-lg text-sm whitespace-pre-wrap"
                      style={{
                        background: msg.role === 'user' ? `${dept.color}20` : `${dept.color}15`,
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
                <div
                  className="px-4 py-2 rounded-lg rounded-bl-none animate-pulse text-sm"
                  style={{ background: `${dept.color}15`, color: 'var(--text-primary)' }}
                >
                  {t('department-chat.thinking', locale)}
                </div>
              </div>
            )}
          </div>

          <div className="p-4" style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-card)' }}>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder={t('department-chat.placeholder', locale)}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                className="flex-1 px-4 py-2 rounded-lg text-sm focus:outline-none transition-all"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              />
              <button
                onClick={handleSend}
                className="px-4 py-2 rounded-lg transition flex items-center gap-2 text-sm hover:opacity-90"
                style={{ background: dept.color, color: '#ffffff' }}
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <DepartmentQuickActions department={quickActionsDepartment} />
    </div>
  )
}
