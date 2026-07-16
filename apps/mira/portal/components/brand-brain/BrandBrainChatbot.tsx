'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Loader, Check, X } from 'lucide-react'

interface Message {
  role: 'user' | 'bot'
  content: string
  timestamp: number
}

interface BrandBrainChatbotProps {
  clientId: string
  onUpdateComplete?: (updates: any) => void
}

export function BrandBrainChatbot({
  clientId,
  onUpdateComplete,
}: BrandBrainChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [conversationLoading, setConversationLoading] = useState(false)
  const [completed, setCompleted] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Initialize: analyze gaps and start conversation
  useEffect(() => {
    startConversation()
  }, [clientId])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function startConversation() {
    try {
      setLoading(true)
      const response = await fetch('/api/brand-brain/chatbot/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId }),
      })

      const data = await response.json()

      if (data.initialMessage) {
        setMessages([
          {
            role: 'bot',
            content: data.initialMessage,
            timestamp: Date.now(),
          },
        ])
      }
    } catch (error) {
      console.error('Error starting conversation:', error)
      setMessages([
        {
          role: 'bot',
          content: 'Sorry, I encountered an error. Please try again.',
          timestamp: Date.now(),
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault()

    if (!input.trim() || conversationLoading) return

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: Date.now(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setConversationLoading(true)

    try {
      const response = await fetch('/api/brand-brain/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          message: input,
          conversationHistory: messages,
        }),
      })

      const data = await response.json()

      const botMessage: Message = {
        role: 'bot',
        content: data.botMessage,
        timestamp: Date.now(),
      }

      setMessages((prev) => [...prev, botMessage])

      // Check if conversation is complete
      if (data.conversationComplete) {
        setCompleted(true)
        if (onUpdateComplete) {
          onUpdateComplete(data.structuredData)
        }
      }
    } catch (error) {
      console.error('Error sending message:', error)
      setMessages((prev) => [
        ...prev,
        {
          role: 'bot',
          content: 'Sorry, I encountered an error. Please try again.',
          timestamp: Date.now(),
        },
      ])
    } finally {
      setConversationLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            ✨ Complete your Brand Brain with AI
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            I'll ask you a few questions to understand your brand and populate your Brand Brain
          </p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
          {loading && (
            <div className="flex justify-center py-8">
              <Loader className="animate-spin text-gray-400" size={32} />
            </div>
          )}

          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-900 border border-gray-200'
                }`}
              >
                <p className="text-sm leading-relaxed">{msg.content}</p>
              </div>
            </div>
          ))}

          {completed && (
            <div className="flex justify-center py-4">
              <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 flex items-center gap-2">
                <Check className="text-green-600" size={20} />
                <p className="text-sm text-green-800">
                  ✓ Brand Brain updated successfully!
                </p>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        {!completed && !loading && (
          <div className="px-6 py-4 border-t border-gray-200">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Tell me about your brand..."
                disabled={conversationLoading}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
              <button
                type="submit"
                disabled={!input.trim() || conversationLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center gap-2"
              >
                {conversationLoading ? (
                  <Loader size={18} className="animate-spin" />
                ) : (
                  <Send size={18} />
                )}
              </button>
            </form>
          </div>
        )}

        {/* Close Button */}
        {completed && (
          <div className="px-6 py-4 border-t border-gray-200">
            <button
              onClick={() => window.location.reload()}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Done! Refresh to see updates
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
