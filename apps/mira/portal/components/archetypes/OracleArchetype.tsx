'use client'
import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Copy, Check, Sparkles } from 'lucide-react'
import { clsx } from 'clsx'
import { useLocaleContext } from '@/app/locale-provider'
import { t } from '@/lib/i18n'

export interface OracleVariant {
  id: string
  text: string
  platform?: string
}

interface OracleArchetypeProps {
  agentColor: string
  status?: 'loading' | 'ready' | 'empty' | 'error'
  errorMessage?: string
  variants?: OracleVariant[]
}

export default function OracleArchetype({
  agentColor,
  status = 'ready',
  errorMessage,
  variants = [],
}: OracleArchetypeProps) {
  const { locale } = useLocaleContext()
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState('')
  const [copied, setCopied] = useState(false)

  const selectedVariant = variants[selectedIndex]

  useEffect(() => {
    if (selectedVariant) setEditText(selectedVariant.text)
  }, [selectedIndex, selectedVariant])

  if (status === 'loading') {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-32 rounded-lg bg-surface" />
        <div className="h-24 rounded-lg bg-surface" />
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="card p-6 text-center border border-dashed border-line">
        <div className="text-sm text-ink font-medium">{t('agent.workspace.error-title', locale)}</div>
        <div className="text-xs text-ink-tertiary mt-1">{errorMessage || t('agent.workspace.error-desc', locale)}</div>
      </div>
    )
  }

  if (status === 'empty' || variants.length === 0) {
    return (
      <div className="card p-6 text-center border border-dashed border-line">
        <Sparkles size={24} className="mx-auto text-ink-tertiary mb-2" />
        <div className="text-sm text-ink font-medium">{t('archetype.oracle.empty-title', locale)}</div>
        <div className="text-xs text-ink-tertiary mt-1">{t('archetype.oracle.empty-desc', locale)}</div>
      </div>
    )
  }

  const handlePrevious = () => {
    setSelectedIndex((prev) => (prev === 0 ? variants.length - 1 : prev - 1))
    setIsEditing(false)
  }

  const handleNext = () => {
    setSelectedIndex((prev) => (prev === variants.length - 1 ? 0 : prev + 1))
    setIsEditing(false)
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(editText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="text-xs font-semibold uppercase tracking-wider px-1" style={{ color: agentColor }}>
          ⚡ {t('archetype.oracle.recent', locale)}
        </div>

        <div className="card p-4 sm:p-6 space-y-4 relative overflow-hidden">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-ink">
                {t('archetype.oracle.variant', locale)} {String.fromCharCode(65 + selectedIndex)}
              </div>
              {selectedVariant.platform && (
                <div className="text-xs text-ink-secondary">{selectedVariant.platform}</div>
              )}
            </div>
            <p className="text-base text-ink leading-relaxed italic">&quot;{selectedVariant.text}&quot;</p>
          </div>

          {variants.length > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-line">
              <button
                onClick={handlePrevious}
                aria-label={t('archetype.oracle.prev-variant', locale)}
                className="p-2 hover:bg-surface-hover rounded-lg transition-colors"
              >
                <ChevronLeft size={18} className="text-ink-tertiary" />
              </button>

              <div className="flex items-center gap-2">
                {variants.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedIndex(idx)}
                    aria-label={t('archetype.oracle.go-to-variant', locale).replace('{n}', String(idx + 1))}
                    className={clsx('w-2 h-2 rounded-full transition-all', idx === selectedIndex ? 'w-6' : 'bg-line')}
                    style={idx === selectedIndex ? { backgroundColor: agentColor } : undefined}
                  />
                ))}
              </div>

              <button
                onClick={handleNext}
                aria-label={t('archetype.oracle.next-variant', locale)}
                className="p-2 hover:bg-surface-hover rounded-lg transition-colors"
              >
                <ChevronRight size={18} className="text-ink-tertiary" />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div className="text-xs font-semibold uppercase tracking-wider px-1" style={{ color: agentColor }}>
          🎨 {t('archetype.oracle.editor', locale)}
        </div>

        <div className="card p-4 sm:p-6">
          {isEditing ? (
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full bg-surface text-ink text-sm leading-relaxed p-4 rounded border border-line focus:border-ink-muted focus:outline-none resize-none"
              rows={4}
            />
          ) : (
            <div className="relative group cursor-text" onClick={() => setIsEditing(true)}>
              <p className="text-sm text-ink leading-relaxed">{editText}</p>
              <span className="text-xs text-ink-tertiary absolute bottom-0 right-0 mt-2 group-hover:text-ink-secondary transition-colors">
                {t('archetype.oracle.click-to-edit', locale)}
              </span>
            </div>
          )}

          <div className="flex gap-2 mt-4 pt-4 border-t border-line">
            {isEditing && (
              <button
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 text-xs rounded bg-surface hover:bg-surface-hover text-ink-secondary"
              >
                {t('archetype.oracle.done', locale)}
              </button>
            )}
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 text-xs rounded flex items-center gap-1.5 transition-colors"
              style={{ color: copied ? agentColor : undefined }}
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? t('archetype.oracle.copied', locale) : t('archetype.oracle.copy', locale)}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
