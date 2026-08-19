'use client'
import { useState } from 'react'
import { X } from 'lucide-react'
import { t, type Locale } from '@/lib/i18n'

/**
 * Pedir un módulo. No cobra ni habilita: registra el interés para que la agencia
 * ponga precio caso a caso, que es como se venden los módulos de operativa.
 */
export default function RequestToolModal({
  toolName, toolId, clientId, brand, locale, onClose, onSent,
}: {
  toolName: string
  toolId: string
  clientId: string
  brand: string
  locale: Locale
  onClose: () => void
  onSent: () => void
}) {
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const send = async () => {
    setSending(true)
    setError(null)
    try {
      const res = await fetch('/api/tools/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, toolId, message }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || t('tools.request-failed', locale))
      }
      onSent()
    } catch (e) {
      setError(e instanceof Error ? e.message : t('tools.request-failed', locale))
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
      <div className="w-full max-w-md bg-card border border-line rounded-2xl p-6"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 mb-1">
          <h2 className="text-lg font-semibold text-ink">
            {t('tools.request-modal.title', locale).replace('{tool}', toolName)}
          </h2>
          <button onClick={onClose} className="text-ink-muted hover:text-ink transition-colors">
            <X size={18} />
          </button>
        </div>
        <p className="text-xs text-ink-tertiary mb-4">{t('tools.request-modal.desc', locale)}</p>

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          maxLength={1000}
          placeholder={t('tools.request-modal.placeholder', locale)}
          className="w-full rounded-lg bg-surface border border-line px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-line resize-none"
        />

        {error && <p className="text-xs mt-2" style={{ color: '#f87171' }}>{error}</p>}

        <div className="mt-4 flex items-center justify-end gap-2">
          <button onClick={onClose}
            className="text-xs px-3 py-2 rounded-lg text-ink-tertiary hover:text-ink transition-colors">
            {t('tools.request-modal.cancel', locale)}
          </button>
          <button onClick={send} disabled={sending}
            className="text-xs font-medium px-3 py-2 rounded-lg transition-opacity disabled:opacity-50"
            style={{ background: brand, color: '#fff' }}>
            {t('tools.request-modal.send', locale)}
          </button>
        </div>
      </div>
    </div>
  )
}
