'use client'
import { useState } from 'react'
import { X, ExternalLink } from 'lucide-react'

interface ToolConnectionModalProps {
  tool: {
    id: string
    name: string
    emoji: string
    setupUrl: string
    description: string
  }
  isOpen: boolean
  isConnecting: boolean
  onClose: () => void
  onConnect: (data: {
    accountEmail?: string
    accountHandle?: string
    authToken?: string
  }) => Promise<void>
}

export default function ToolConnectionModal({
  tool,
  isOpen,
  isConnecting,
  onClose,
  onConnect,
}: ToolConnectionModalProps) {
  const [accountEmail, setAccountEmail] = useState('')
  const [accountHandle, setAccountHandle] = useState('')
  const [authToken, setAuthToken] = useState('')
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    try {
      await onConnect({
        accountEmail: accountEmail || undefined,
        accountHandle: accountHandle || undefined,
        authToken: authToken || undefined,
      })
      setAccountEmail('')
      setAccountHandle('')
      setAuthToken('')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to connect tool'
      setError(message)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50">
        <div className="bg-[#0D0D0D] rounded-lg border border-[#1E1E1E] shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[#1E1E1E]">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{tool.emoji}</span>
              <div>
                <h2 className="font-semibold text-white">{tool.name}</h2>
                <p className="text-xs text-[#666]">Configure connection</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-[#666] hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-[#666] mb-2">
                Email / Account
              </label>
              <input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={accountEmail}
                onChange={(e) => setAccountEmail(e.target.value)}
                className="w-full px-3 py-2 rounded bg-[#1E1E1E] border border-[#333] text-sm text-white placeholder-[#666] focus:outline-none focus:border-[#EC4899]"
              />
            </div>

            {/* Handle Input */}
            <div>
              <label htmlFor="handle" className="block text-xs font-semibold text-[#666] mb-2">
                Handle / Username (Optional)
              </label>
              <input
                id="handle"
                type="text"
                placeholder="@yourhandle"
                value={accountHandle}
                onChange={(e) => setAccountHandle(e.target.value)}
                className="w-full px-3 py-2 rounded bg-[#1E1E1E] border border-[#333] text-sm text-white placeholder-[#666] focus:outline-none focus:border-[#EC4899]"
              />
            </div>

            {/* Auth Token Input */}
            <div>
              <label htmlFor="token" className="block text-xs font-semibold text-[#666] mb-2">
                API Key / Token (Optional)
              </label>
              <input
                id="token"
                type="password"
                placeholder="sk-xxxxxxxxx"
                value={authToken}
                onChange={(e) => setAuthToken(e.target.value)}
                className="w-full px-3 py-2 rounded bg-[#1E1E1E] border border-[#333] text-sm text-white placeholder-[#666] focus:outline-none focus:border-[#EC4899]"
              />
              <p className="text-xs text-[#666] mt-1">
                Your credentials are encrypted and never shared
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded bg-[#FF6B6B]20 border border-[#FF6B6B] text-sm text-[#FF6B6B]">
                {error}
              </div>
            )}

            {/* Info Box */}
            <div className="p-3 rounded bg-[#EC4899]10 border border-[#EC4899]30 text-xs text-[#999]">
              <p className="font-semibold text-[#EC4899] mb-1">Don't have an account yet?</p>
              <p>{tool.description}</p>
              <a
                href={tool.setupUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-2 text-[#EC4899] hover:text-[#FF1493]"
              >
                Create account
                <ExternalLink size={12} />
              </a>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isConnecting}
                className="flex-1 px-4 py-2 rounded bg-[#1E1E1E] text-white text-sm font-medium hover:bg-[#333] disabled:opacity-50 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isConnecting}
                className="flex-1 px-4 py-2 rounded bg-[#EC4899] text-white text-sm font-medium hover:bg-[#E00B7F] disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
              >
                {isConnecting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Connecting...
                  </>
                ) : (
                  'Connect Account'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
