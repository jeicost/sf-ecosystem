'use client'

import { useState } from 'react'
import { Check, X, Loader2, AlertCircle } from 'lucide-react'

interface BrandBrainSuggestionsProps {
  documentId: string
  suggestions: Record<string, any>
  onApply: (updates: Record<string, any>) => Promise<void>
  onDismiss: () => void
}

export default function BrandBrainSuggestions({
  documentId,
  suggestions,
  onApply,
  onDismiss,
}: BrandBrainSuggestionsProps) {
  const [applying, setApplying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedFields, setSelectedFields] = useState<Set<string>>(
    new Set(Object.keys(suggestions || {}))
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
        if (suggestions[field]) {
          updates[field] = suggestions[field]
        }
      })
      await onApply(updates)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply suggestions')
    } finally {
      setApplying(false)
    }
  }

  if (!suggestions || Object.keys(suggestions).length === 0) {
    return null
  }

  return (
    <div className="card p-6 border-blue-500/20 bg-blue-500/5 mb-6">
      <div className="mb-4">
        <p className="text-sm font-medium text-blue-400">💡 Suggested Updates from Document</p>
        <p className="text-xs text-gray-400 mt-1">Claude analyzed your document and found these insights</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded flex items-start gap-2">
          <AlertCircle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      <div className="space-y-3 mb-6">
        {Object.entries(suggestions).map(([field, value]) => (
          <div key={field} className="flex items-start gap-3 p-3 bg-white/5 border border-white/10 rounded">
            <input
              type="checkbox"
              checked={selectedFields.has(field)}
              onChange={() => handleToggleField(field)}
              className="mt-1 w-4 h-4 cursor-pointer"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white capitalize">{field.replace(/_/g, ' ')}</p>
              <p className="text-xs text-gray-400 mt-1 break-words">
                {typeof value === 'object' ? JSON.stringify(value) : String(value).substring(0, 200)}
                {typeof value === 'string' && value.length > 200 ? '...' : ''}
              </p>
            </div>
          </div>
        ))}
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
          className="px-4 py-2 rounded text-sm font-medium text-gray-400 hover:text-white transition-colors flex items-center gap-2"
        >
          <X size={14} />
          Dismiss
        </button>
      </div>
    </div>
  )
}
