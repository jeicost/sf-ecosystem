'use client'
import { useEffect, useRef, useState } from 'react'
import { Send, X, Check } from 'lucide-react'
import { useBrainChat } from '@/lib/hooks/useBrainChat'

interface BrainChatProps {
  clientId: string
  onProposalSave?: (section: string, value: string) => Promise<void>
}

export default function BrainChat({ clientId, onProposalSave }: BrainChatProps) {
  const [input, setInput] = useState('')
  const [proposal, setProposal] = useState<{ section: string; value: string; reason: string } | null>(null)
  const [savingProposal, setSavingProposal] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { messages, isLoading, sendMessage, cancel } = useBrainChat({
    clientId,
    onProposalDetected: (p) => setProposal(p),
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
    await sendMessage(message, 'chat')
  }

  const handleSaveProposal = async () => {
    if (!proposal || !onProposalSave) return

    setSavingProposal(true)
    try {
      await onProposalSave(proposal.section, proposal.value)
      setProposal(null)
    } finally {
      setSavingProposal(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#0A0A0A] border border-[#1E1E1E] rounded-lg overflow-hidden">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-center">
            <div className="space-y-3">
              <div className="text-4xl">🧠</div>
              <div className="text-sm text-[#999]">
                Ask your Brand Brain questions about your identity, <br />
                audience, or content strategy
              </div>
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-xs px-4 py-2 rounded-lg text-sm ${
                msg.role === 'user'
                  ? 'bg-[#EC4899] text-white'
                  : 'bg-[#1E1E1E] text-[#CCC] border border-[#333]'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-[#1E1E1E] border border-[#333] px-4 py-2 rounded-lg">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-[#666] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-[#666] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-[#666] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Proposal Card */}
      {proposal && (
        <div className="p-4 border-t border-[#1E1E1E] bg-[#0D0D0D] space-y-3">
          <div className="p-3 rounded bg-[#1E1E1E] border border-[#F59E0B]40 space-y-2">
            <div className="text-xs font-semibold text-[#F59E0B] flex items-center gap-1">
              💡 Brain Proposal
            </div>
            <div className="text-sm">
              <span className="text-[#666]">{proposal.section} →</span>
              <span className="text-white ml-2">{proposal.value}</span>
            </div>
            <div className="text-xs text-[#999]">{proposal.reason}</div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSaveProposal}
              disabled={savingProposal || !onProposalSave}
              className="flex-1 px-3 py-2 rounded text-xs font-medium bg-[#10B981] text-white hover:bg-[#059669] disabled:opacity-50 flex items-center justify-center gap-1"
            >
              <Check size={14} />
              Save to Brain
            </button>
            <button
              onClick={() => setProposal(null)}
              className="px-3 py-2 rounded text-xs font-medium bg-[#333] text-[#999] hover:bg-[#444]"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-[#1E1E1E] flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isLoading}
          placeholder="Ask about your brand..."
          className="flex-1 px-3 py-2 rounded bg-[#1E1E1E] border border-[#333] text-sm text-white placeholder-[#666] focus:outline-none focus:border-[#EC4899] disabled:opacity-50"
        />
        {isLoading ? (
          <button
            onClick={cancel}
            type="button"
            className="px-4 py-2 rounded bg-[#FF6B6B] text-white text-sm font-medium hover:bg-[#FF5252]"
          >
            Stop
          </button>
        ) : (
          <button
            type="submit"
            disabled={!input.trim()}
            className="px-4 py-2 rounded bg-[#EC4899] text-white text-sm font-medium hover:bg-[#E00B7F] disabled:opacity-50 flex items-center gap-1"
          >
            <Send size={14} />
          </button>
        )}
      </form>
    </div>
  )
}
