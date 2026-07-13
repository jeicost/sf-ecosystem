'use client'
import { useState } from 'react'
import { X, ExternalLink, ArrowRight } from 'lucide-react'

interface ToolConnectionModalProps {
  tool: {
    id: string
    name: string
    emoji: string
    setupUrl: string
    description: string
    authType: 'api-key' | 'oauth' | 'native'
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
  const [validating, setValidating] = useState(false)
  const [validationStatus, setValidationStatus] = useState<'valid' | 'invalid' | null>(null)
  const [accountInfo, setAccountInfo] = useState<any>(null)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (tool.authType === 'api-key') {
      if (!authToken.trim()) {
        setError('API Key is required')
        return
      }
      if (validationStatus !== 'valid') {
        setError('Please wait for validation to complete or provide a valid API key')
        return
      }
    }

    try {
      await onConnect({
        accountEmail: accountEmail || undefined,
        accountHandle: accountHandle || undefined,
        authToken: authToken || undefined,
      })
      setAccountEmail('')
      setAccountHandle('')
      setAuthToken('')
      setValidationStatus(null)
      setAccountInfo(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to connect tool'
      setError(message)
    }
  }

  const handleOAuthStart = async () => {
    setError(null)
    try {
      const redirectUrl = `/api/integrations/oauth/${tool.id}/start?clientId=${new URLSearchParams(window.location.search).get('clientId') || ''}`
      window.location.href = redirectUrl
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start OAuth flow'
      setError(message)
    }
  }

  const validateApiKey = async (key: string) => {
    if (!key.trim()) {
      setValidationStatus(null)
      setAccountInfo(null)
      return
    }

    setValidating(true)
    try {
      const response = await fetch('/api/integrations/validate-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolId: tool.id, apiKey: key }),
      })

      const result = await response.json()
      setValidationStatus(result.valid ? 'valid' : 'invalid')
      if (result.valid && result.accountInfo) {
        setAccountInfo(result.accountInfo)
        setError(null)
      } else if (!result.valid) {
        setAccountInfo(null)
        setError(result.error || 'Invalid API key')
      }
    } catch (err) {
      setValidationStatus('invalid')
      setAccountInfo(null)
      setError('Validation error')
    } finally {
      setValidating(false)
    }
  }

  const handleTokenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setAuthToken(value)

    // Debounce validation
    const timer = setTimeout(() => {
      if (tool.authType === 'api-key') {
        validateApiKey(value)
      }
    }, 500)

    return () => clearTimeout(timer)
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
            {tool.authType === 'api-key' && (
              <>
                {/* Auth Token Input */}
                <div>
                  <label htmlFor="token" className="block text-xs font-semibold text-[#666] mb-2 flex items-center justify-between">
                    <span>API Key / Token <span className="text-[#FF6B6B]">*</span></span>
                    {validating && <span className="text-xs text-[#8B5CF6]">Validating...</span>}
                    {validationStatus === 'valid' && <span className="text-xs text-[#10B981]">✓ Valid</span>}
                    {validationStatus === 'invalid' && <span className="text-xs text-[#FF6B6B]">✗ Invalid</span>}
                  </label>
                  <input
                    id="token"
                    type="password"
                    placeholder="sk-xxxxxxxxx or your-api-key"
                    value={authToken}
                    onChange={handleTokenChange}
                    className={`w-full px-3 py-2 rounded bg-[#1E1E1E] border text-sm text-white placeholder-[#666] focus:outline-none transition-colors ${
                      validationStatus === 'valid'
                        ? 'border-[#10B981] focus:border-[#10B981]'
                        : validationStatus === 'invalid'
                          ? 'border-[#FF6B6B] focus:border-[#FF6B6B]'
                          : 'border-[#333] focus:border-[#EC4899]'
                    }`}
                    autoComplete="off"
                  />
                  <p className="text-xs text-[#666] mt-1">
                    Your credentials are encrypted and never shared
                  </p>

                  {/* Account Info Display */}
                  {accountInfo && (
                    <div className="mt-3 p-2 rounded bg-[#10B981]10 border border-[#10B981]30 text-xs text-[#10B981]">
                      {accountInfo.email && <div>Account: {accountInfo.email}</div>}
                      {accountInfo.name && <div>Name: {accountInfo.name}</div>}
                    </div>
                  )}
                </div>

                {/* Optional Email Input */}
                <div>
                  <label htmlFor="email" className="block text-xs font-semibold text-[#666] mb-2">
                    Email / Account (Optional)
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
              </>
            )}

            {tool.authType === 'oauth' && (
              <div className="p-3 rounded bg-[#EC4899]10 border border-[#EC4899]30">
                <p className="text-sm text-white mb-3">
                  Click below to connect via {tool.name}. You'll be redirected to authorize MIRA.
                </p>
                <p className="text-xs text-[#999]">
                  This is a secure OAuth connection. You can disconnect anytime from this page.
                </p>
              </div>
            )}

            {tool.authType === 'native' && (
              <div className="p-3 rounded bg-[#10B981]10 border border-[#10B981]30">
                <p className="text-sm text-white">
                  ✓ {tool.name} is natively integrated and ready to use.
                </p>
                <p className="text-xs text-[#999] mt-2">
                  No additional configuration needed. Your agents can access {tool.name} immediately.
                </p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded bg-[#FF6B6B]20 border border-[#FF6B6B] text-sm text-[#FF6B6B]">
                {error}
              </div>
            )}

            {/* Info Box */}
            {tool.authType !== 'native' && (
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
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isConnecting}
                className="flex-1 px-4 py-2 rounded bg-[#1E1E1E] text-white text-sm font-medium hover:bg-[#333] disabled:opacity-50 transition-all"
              >
                {tool.authType === 'native' ? 'Close' : 'Cancel'}
              </button>
              {tool.authType === 'oauth' && (
                <button
                  type="button"
                  onClick={handleOAuthStart}
                  disabled={isConnecting}
                  className="flex-1 px-4 py-2 rounded bg-[#EC4899] text-white text-sm font-medium hover:bg-[#E00B7F] disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
                >
                  Authorize with {tool.name.split('(')[0].trim()}
                  <ArrowRight size={14} />
                </button>
              )}
              {tool.authType === 'api-key' && (
                <button
                  type="submit"
                  disabled={isConnecting || validating || validationStatus !== 'valid'}
                  className="flex-1 px-4 py-2 rounded bg-[#EC4899] text-white text-sm font-medium hover:bg-[#E00B7F] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
                  title={validationStatus !== 'valid' ? 'Please validate the API key first' : ''}
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
              )}
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
