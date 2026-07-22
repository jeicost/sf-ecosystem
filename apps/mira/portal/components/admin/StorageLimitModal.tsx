'use client'

import { useState } from 'react'
import { useLocaleContext } from '@/app/locale-provider'
import { t } from '@/lib/i18n'

interface StorageLimitModalProps {
  isOpen: boolean
  currentLimit: number
  onClose: () => void
  onSave: (newLimit: number) => void
}

export default function StorageLimitModal({
  isOpen,
  currentLimit,
  onClose,
  onSave,
}: StorageLimitModalProps) {
  const [newLimit, setNewLimit] = useState(currentLimit)
  const [saving, setSaving] = useState(false)
  const { locale } = useLocaleContext()

  if (!isOpen) return null

  async function handleSave() {
    setSaving(true)
    try {
      onSave(newLimit)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div
        className="rounded-2xl p-6 w-96 shadow-xl"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
        }}
      >
        <h2 className="text-xl font-semibold mb-4 text-ink">{t('admin.users.edit-limit-title', locale)}</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              {t('admin.users.current-limit', locale).replace('{limit}', currentLimit.toString())}
            </label>
            <input
              type="number"
              min="1"
              max="1000"
              step="1"
              value={newLimit}
              onChange={(e) => setNewLimit(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg font-medium focus:outline-none transition-all"
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
              placeholder={t('admin.users.new-limit-placeholder', locale)}
            />
            <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
              {t('admin.users.range', locale)}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={saving}
              className="flex-1 px-4 py-2 rounded-lg font-semibold transition-all disabled:opacity-50"
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
              }}
            >
              {t('common.cancel', locale)}
            </button>
            <button
              onClick={handleSave}
              disabled={saving || newLimit === currentLimit}
              className="flex-1 px-4 py-2 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: newLimit === currentLimit ? 'rgba(99,102,241,0.2)' : '#6366F1',
                color: newLimit === currentLimit ? '#6366F166' : '#ffffff',
              }}
            >
              {saving ? t('admin.users.saving', locale) : t('common.save', locale)}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
