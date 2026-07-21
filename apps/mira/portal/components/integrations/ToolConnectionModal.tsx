'use client'
import { useState } from 'react'
import { X, ExternalLink, ArrowRight, Clock } from 'lucide-react'
import { useLocaleContext } from '@/app/locale-provider'
import { t } from '@/lib/i18n'

interface ToolConnectionModalProps {
  tool: {
    id: string
    name: string
    emoji: string
    setupUrl: string
    description: string
    authType: 'api-key' | 'oauth' | 'native'
    status?: 'connected' | 'disconnected' | 'locked' | 'coming_soon'
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
  const { locale } = useLocaleContext()
  const [accountEmail, setAccountEmail] = useState('')
  const [accountHandle, setAccountHandle] = useState('')
  const [authToken, setAuthToken] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [validating, setValidating] = useState(false)
  const [validationStatus, setValidationStatus] = useState<'valid' | 'invalid' | null>(null)
  const [accountInfo, setAccountInfo] = useState<any>(null)

  if (!isOpen) return null

  // t() con fallback: si la clave no existe, usa el texto del catálogo de tools
  const tr = (key: string, fallback: string) => {
    const value = t(key, locale)
    return value === key ? fallback : value
  }

  const toolName = tr(`integrations.tool.${tool.id}.name`, tool.name)
  const isComingSoon = tool.status === 'coming_soon'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (tool.authType === 'api-key') {
      if (!authToken.trim()) {
        setError(t('integrations.modal.key-required', locale))
        return
      }
      if (validationStatus !== 'valid') {
        setError(t('integrations.modal.wait-validation', locale))
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
      const message =
        err instanceof Error ? err.message : t('integrations.modal.connect-error', locale)
      setError(message)
    }
  }

  const handleOAuthStart = async () => {
    // Coming soon: no llamamos al endpoint OAuth (responde 503)
    if (isComingSoon) return
    setError(null)
    try {
      const redirectUrl = `/api/integrations/oauth/${tool.id}/start?clientId=${new URLSearchParams(window.location.search).get('clientId') || ''}`
      window.location.href = redirectUrl
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t('integrations.modal.oauth-error', locale)
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
        setError(result.error || t('integrations.modal.invalid-key', locale))
      }
    } catch (err) {
      setValidationStatus('invalid')
      setAccountInfo(null)
      setError(t('integrations.modal.validation-error', locale))
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
        <div className="bg-card rounded-lg border border-line shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-line">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{tool.emoji}</span>
              <div>
                <h2 className="font-semibold text-ink">{toolName}</h2>
                <p className="text-xs text-ink-tertiary">
                  {t('integrations.modal.configure', locale)}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-ink-tertiary hover:text-ink transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {isComingSoon && (
              <div className="p-3 rounded bg-[#8B5CF6]10 border border-[#8B5CF6]30 flex items-center gap-2">
                <Clock size={16} className="text-[#8B5CF6] flex-shrink-0" />
                <p className="text-sm text-ink">
                  {t('integrations.coming-soon', locale)} — {t('integrations.coming-soon-desc', locale)}
                </p>
              </div>
            )}

            {!isComingSoon && tool.authType === 'api-key' && (
              <>
                {/* Auth Token Input */}
                <div>
                  <label htmlFor="token" className="block text-xs font-semibold text-ink-tertiary mb-2 flex items-center justify-between">
                    <span>
                      {t('integrations.modal.api-key-label', locale)}{' '}
                      <span className="text-[#FF6B6B]">*</span>
                    </span>
                    {validating && (
                      <span className="text-xs text-[#8B5CF6]">
                        {t('integrations.modal.validating', locale)}
                      </span>
                    )}
                    {validationStatus === 'valid' && (
                      <span className="text-xs text-[#10B981]">
                        {t('integrations.modal.valid', locale)}
                      </span>
                    )}
                    {validationStatus === 'invalid' && (
                      <span className="text-xs text-[#FF6B6B]">
                        {t('integrations.modal.invalid', locale)}
                      </span>
                    )}
                  </label>
                  <input
                    id="token"
                    type="password"
                    placeholder="sk-xxxxxxxxx or your-api-key"
                    value={authToken}
                    onChange={handleTokenChange}
                    className={`w-full px-3 py-2 rounded bg-page border text-sm text-ink placeholder-ink-muted focus:outline-none transition-colors ${
                      validationStatus === 'valid'
                        ? 'border-[#10B981] focus:border-[#10B981]'
                        : validationStatus === 'invalid'
                          ? 'border-[#FF6B6B] focus:border-[#FF6B6B]'
                          : 'border-line focus:border-[#EC4899]'
                    }`}
                    autoComplete="off"
                  />
                  <p className="text-xs text-ink-tertiary mt-1">
                    {t('integrations.modal.privacy', locale)}
                  </p>

                  {/* Account Info Display */}
                  {accountInfo && (
                    <div className="mt-3 p-2 rounded bg-[#10B981]10 border border-[#10B981]30 text-xs text-[#10B981]">
                      {accountInfo.email && (
                        <div>
                          {t('integrations.modal.account', locale)}: {accountInfo.email}
                        </div>
                      )}
                      {accountInfo.name && (
                        <div>
                          {t('integrations.modal.name', locale)}: {accountInfo.name}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Optional Email Input */}
                <div>
                  <label htmlFor="email" className="block text-xs font-semibold text-ink-tertiary mb-2">
                    {t('integrations.modal.email-label', locale)}
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={accountEmail}
                    onChange={(e) => setAccountEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded bg-page border border-line text-sm text-ink placeholder-ink-muted focus:outline-none focus:border-[#EC4899]"
                  />
                </div>
              </>
            )}

            {!isComingSoon && tool.authType === 'oauth' && (
              <div className="p-3 rounded bg-[#EC4899]10 border border-[#EC4899]30">
                <p className="text-sm text-ink mb-3">
                  {t('integrations.modal.oauth-info', locale).replace('{name}', toolName)}
                </p>
                <p className="text-xs text-ink-secondary">
                  {t('integrations.modal.oauth-secure', locale)}
                </p>
              </div>
            )}

            {tool.authType === 'native' && (
              <div className="p-3 rounded bg-[#10B981]10 border border-[#10B981]30">
                <p className="text-sm text-ink">
                  {t('integrations.modal.native-ready', locale).replace('{name}', toolName)}
                </p>
                <p className="text-xs text-ink-secondary mt-2">
                  {t('integrations.modal.native-desc', locale).replace('{name}', toolName)}
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
              <div className="p-3 rounded bg-[#EC4899]10 border border-[#EC4899]30 text-xs text-ink-secondary">
                <p className="font-semibold text-[#EC4899] mb-1">
                  {t('integrations.modal.no-account', locale)}
                </p>
                <p>{tr(`integrations.tool.${tool.id}.desc`, tool.description)}</p>
                <a
                  href={tool.setupUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-2 text-[#EC4899] hover:text-[#FF1493]"
                >
                  {t('integrations.modal.create-account', locale)}
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
                className="flex-1 px-4 py-2 rounded bg-card border border-line text-ink text-sm font-medium hover:border-line-subtle disabled:opacity-50 transition-all"
              >
                {tool.authType === 'native' || isComingSoon
                  ? t('common.close', locale)
                  : t('common.cancel', locale)}
              </button>
              {tool.authType === 'oauth' && (
                <button
                  type="button"
                  onClick={handleOAuthStart}
                  disabled={isConnecting || isComingSoon}
                  className="flex-1 px-4 py-2 rounded bg-[#EC4899] text-white text-sm font-medium hover:bg-[#E00B7F] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
                >
                  {isComingSoon ? (
                    <>
                      <Clock size={14} />
                      {t('integrations.coming-soon', locale)}
                    </>
                  ) : (
                    <>
                      {t('integrations.modal.authorize', locale).replace(
                        '{name}',
                        toolName.split('(')[0].trim()
                      )}
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              )}
              {!isComingSoon && tool.authType === 'api-key' && (
                <button
                  type="submit"
                  disabled={isConnecting || validating || validationStatus !== 'valid'}
                  className="flex-1 px-4 py-2 rounded bg-[#EC4899] text-white text-sm font-medium hover:bg-[#E00B7F] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
                  title={
                    validationStatus !== 'valid'
                      ? t('integrations.modal.wait-validation', locale)
                      : ''
                  }
                >
                  {isConnecting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      {t('integrations.connecting', locale)}
                    </>
                  ) : (
                    t('integrations.connect-account', locale)
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
