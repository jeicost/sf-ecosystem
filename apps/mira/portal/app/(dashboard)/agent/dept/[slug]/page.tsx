'use client'
import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, MessageSquare, Send, ThumbsUp, ThumbsDown } from 'lucide-react'
import { clsx } from 'clsx'
import { useActiveClient } from '@/lib/client-context'
import { useAgentChat } from '@/lib/hooks/useAgentChat'
import { useLocaleContext } from '@/app/locale-provider'
import { t } from '@/lib/i18n'
import { getDepartmentBySlug } from '@/lib/department-meta'
import { getDepartmentChatName } from '@/lib/department-prompt'

export default function DepartmentChatPage() {
  const router = useRouter()
  const params = useParams()
  const slug = params.slug as string
  const { activeClient } = useActiveClient()
  const clientId = activeClient?.id || ''
  const { locale } = useLocaleContext()
  const [input, setInput] = useState('')

  const dept = getDepartmentBySlug(slug)

  if (!dept) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen" style={{ background: 'var(--bg-page)' }}>
        <p style={{ color: 'var(--text-secondary)' }}>404</p>
      </div>
    )
  }

  const deptName = locale === 'en' ? dept.name : dept.nameEs
  const agentDisplayName = getDepartmentChatName(dept.slug, locale)
  const { messages, isLoading, sendMessage, sendFeedback } = useAgentChat({
    role: `dept:${dept.slug}`,
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
    <div className="min-h-screen" style={{ background: 'var(--bg-page)' }}>
      <div className="px-8 py-8 max-w-4xl mx-auto">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm mb-8 transition-colors"
          style={{ color: 'var(--text-secondary)', opacity: 0.8 }}
        >
          <ArrowLeft size={16} />
          {t('common.back', locale)}
        </button>

        <div className="flex items-center gap-6 mb-8">
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center text-5xl flex-shrink-0"
            style={{
              background: `linear-gradient(135deg, ${dept.color}30, ${dept.color}10)`,
              border: `1px solid ${dept.color}30`,
              boxShadow: `0 12px 32px ${dept.color}25`,
            }}
          >
            {dept.icon}
          </div>
          <div>
            <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {t('department-chat.title', locale)} · {deptName}
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              {t('department-chat.subtitle', locale).replace('{dept}', deptName)}
            </p>
          </div>
        </div>

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
    </div>
  )
}
