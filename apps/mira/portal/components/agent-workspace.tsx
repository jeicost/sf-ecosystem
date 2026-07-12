'use client'

import { useEffect, useRef, useState } from 'react'
import { Send } from 'lucide-react'
import { useAgentChat } from '@/lib/hooks/useAgentChat'
import { useActiveClient } from '@/lib/client-context'

interface AgentWorkspaceProps {
  role: string
  agentName: string
  agentEmoji: string
  color: string
  gradient: string
  title: string
  description: string
  placeholder: string
  quickPrompts: Array<{ label: string; prompt: string }>
}

export default function AgentWorkspace({
  role,
  agentName,
  agentEmoji,
  color,
  gradient,
  title,
  description,
  placeholder,
  quickPrompts,
}: AgentWorkspaceProps) {
  const [input, setInput] = useState('')
  const [showQuickPrompts, setShowQuickPrompts] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { activeClient } = useActiveClient()

  const { messages, isLoading, sendMessage } = useAgentChat({
    role,
    clientId: activeClient?.id || '',
  })

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const message = input
    setInput('')
    setShowQuickPrompts(false)
    await sendMessage(message)
  }

  const handleQuickPrompt = async (prompt: string) => {
    setShowQuickPrompts(false)
    setInput('')
    await sendMessage(prompt)
  }

  return (
    <div className="flex flex-col h-full bg-[#0A0A0A] border border-[#1E1E1E] rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[#1E1E1E]" style={{ background: 'rgba(255,255,255,0.02)' }}>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">{agentEmoji}</span>
          <div>
            <h3 className="font-semibold text-white">{agentName}</h3>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {title}
            </p>
          </div>
        </div>
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
          {description}
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && showQuickPrompts && (
          <div className="flex flex-col h-full items-center justify-center text-center space-y-4">
            <div className="text-4xl">{agentEmoji}</div>
            <div>
              <p className="text-sm text-white font-medium mb-1">{title}</p>
              <p className="text-xs text-[#999]">{placeholder}</p>
            </div>

            {quickPrompts.length > 0 && (
              <div className="mt-6 grid gap-2 w-full max-w-sm">
                <p className="text-[10px] uppercase tracking-widest font-semibold text-[#666] mb-2">
                  Sugerencias rápidas
                </p>
                {quickPrompts.map((qp, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleQuickPrompt(qp.prompt)}
                    disabled={isLoading}
                    className="text-left px-3 py-2 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
                    style={{
                      background: `${color}15`,
                      color: color,
                      border: `1px solid ${color}30`,
                    }}
                  >
                    {qp.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-xs px-4 py-2 rounded-lg text-sm ${
                msg.role === 'user'
                  ? 'text-white'
                  : 'bg-[#1E1E1E] text-[#CCC] border border-[#333]'
              }`}
              style={
                msg.role === 'user'
                  ? { background: color }
                  : undefined
              }
            >
              {msg.content}
            </div>
          </div>
        ))}

        {isLoading && messages[messages.length - 1]?.role === 'user' && (
          <div className="flex justify-start">
            <div className="bg-[#1E1E1E] text-[#999] px-4 py-2 rounded-lg text-sm border border-[#333]">
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-[#666] animate-pulse" />
                <div className="w-2 h-2 rounded-full bg-[#666] animate-pulse" style={{ animationDelay: '0.2s' }} />
                <div className="w-2 h-2 rounded-full bg-[#666] animate-pulse" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-4 border-t border-[#1E1E1E]" style={{ background: 'rgba(255,255,255,0.02)' }}>
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder}
            disabled={isLoading}
            className="flex-1 px-3 py-2 bg-[#1E1E1E] border border-[#333] rounded-lg text-sm text-white placeholder-[#666] focus:border-[#555] focus:outline-none transition-colors disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-3 py-2 rounded-lg font-medium transition-all disabled:opacity-50"
            style={{ background: color, color: 'white' }}
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  )
}
