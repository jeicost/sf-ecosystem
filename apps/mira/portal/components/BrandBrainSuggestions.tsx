'use client'

import { useState } from 'react'
import { Check, X, Loader2, AlertCircle, AlertTriangle } from 'lucide-react'
import { useLocaleContext } from '@/app/locale-provider'
import { t } from '@/lib/i18n'

interface DocumentContradiction {
  field_path: string
  existing_value_excerpt?: string
  proposed_value_excerpt?: string
  note: string
}

interface BrandBrainSuggestionsProps {
  documentId: string
  suggestions: Record<string, any>
  onApply: (updates: Record<string, any>) => Promise<void>
  onDismiss: () => void
}

export default function BrandBrainSuggestions({
  suggestions,
  onApply,
  onDismiss,
}: BrandBrainSuggestionsProps) {
  const { locale } = useLocaleContext()
  const [applying, setApplying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 'contradictions' es metadata (Fase 2), no un campo de brand_data -- se
  // muestra aparte, con su propio tratamiento visual, y nunca se ofrece como
  // checkbox normal de "aplicar" (ya queda registrada server-side en
  // brain_contradictions al analizar el documento).
  const contradictions: DocumentContradiction[] = Array.isArray(suggestions?.contradictions)
    ? suggestions.contradictions
    : []
  const fieldSuggestions = Object.fromEntries(
    Object.entries(suggestions || {}).filter(([key]) => key !== 'contradictions')
  )
  const contradictedRoots = new Set(contradictions.map((c) => c.field_path?.split('.')[0]).filter(Boolean))

  const [selectedFields, setSelectedFields] = useState<Set<string>>(
    new Set(Object.keys(fieldSuggestions))
  )

  const handleToggleField = (field: string) => {
    const newSelected = new Set(selectedFields)
    if (newSelected.has(field)) {
      newSelected.delete(field)
    } else {
      newSelected.add(field)
    }
    setSelectedFields(newSelected)
  }

  const handleApply = async () => {
    setApplying(true)
    setError(null)

    try {
      const updates: Record<string, any> = {}
      selectedFields.forEach((field) => {
        if (fieldSuggestions[field]) {
          updates[field] = fieldSuggestions[field]
        }
      })
      await onApply(updates)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply suggestions')
    } finally {
      setApplying(false)
    }
  }

  if (!suggestions || (Object.keys(fieldSuggestions).length === 0 && contradictions.length === 0)) {
    return null
  }

  return (
    <div className="card p-6 border-blue-500/20 bg-blue-500/5 mb-6">
      <div className="mb-4">
        <p className="text-sm font-medium text-blue-400">💡 Suggested Updates from Document</p>
        <p className="text-xs text-ink-secondary mt-1">Claude analyzed your document and found these insights</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded flex items-start gap-2">
          <AlertCircle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {contradictions.length > 0 && (
        <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/25 rounded space-y-2">
          <p className="text-sm font-medium text-amber-400 flex items-center gap-1.5">
            <AlertTriangle size={14} /> {t('bb.suggestions-contradictions-title', locale)}
          </p>
          {contradictions.map((c, i) => (
            <div key={`${c.field_path}-${i}`} className="text-xs text-ink-secondary pl-1">
              <span className="font-medium text-ink">{c.field_path}</span>: {c.note}
              {c.existing_value_excerpt && c.proposed_value_excerpt && (
                <span className="block mt-0.5">
                  {t('bb.suggestions-contradiction-values', locale)
                    .replace('{existing}', c.existing_value_excerpt)
                    .replace('{proposed}', c.proposed_value_excerpt)}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="space-y-3 mb-6">
        {Object.entries(fieldSuggestions).map(([field, value]) => {
          const hasContradiction = contradictedRoots.has(field)
          return (
            <div
              key={field}
              className={
                hasContradiction
                  ? 'flex items-start gap-3 p-3 bg-amber-500/5 border border-amber-500/30 rounded'
                  : 'flex items-start gap-3 p-3 bg-surface border border-line rounded'
              }
            >
              <input
                type="checkbox"
                checked={selectedFields.has(field)}
                onChange={() => handleToggleField(field)}
                className="mt-1 w-4 h-4 cursor-pointer"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink capitalize flex items-center gap-1.5">
                  {field.replace(/_/g, ' ')}
                  {hasContradiction && <AlertTriangle size={12} className="text-amber-400" />}
                </p>
                <p className="text-xs text-ink-secondary mt-1 break-words">
                  {typeof value === 'object' ? JSON.stringify(value) : String(value).substring(0, 200)}
                  {typeof value === 'string' && value.length > 200 ? '...' : ''}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleApply}
          disabled={applying || selectedFields.size === 0}
          className="flex-1 px-4 py-2 rounded text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {applying ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Applying...
            </>
          ) : (
            <>
              <Check size={14} />
              Apply {selectedFields.size} Update{selectedFields.size !== 1 ? 's' : ''}
            </>
          )}
        </button>
        <button
          onClick={onDismiss}
          className="px-4 py-2 rounded text-sm font-medium text-ink-secondary hover:text-ink transition-colors flex items-center gap-2"
        >
          <X size={14} />
          Dismiss
        </button>
      </div>
    </div>
  )
}
