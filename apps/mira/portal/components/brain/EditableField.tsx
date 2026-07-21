'use client'
import { useState, useRef, useEffect } from 'react'
import { Edit2, Check, X, AlertCircle } from 'lucide-react'
import { clsx } from 'clsx'

interface EditableFieldProps {
  label: string
  value: string
  onSave: (newValue: string) => Promise<void>
  placeholder?: string
  multiline?: boolean
}

export default function EditableField({ label, value, onSave, placeholder, multiline = false }: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select?.()
    }
  }, [isEditing])

  const handleSave = async () => {
    if (editValue.trim() === value.trim()) {
      setIsEditing(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      await onSave(editValue)
      setIsEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
      // Show alert as fallback since sonner is not available
      alert(`Error: ${err instanceof Error ? err.message : 'Error al guardar'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setEditValue(value)
    setIsEditing(false)
    setError(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault()
      handleSave()
    }
    if (e.key === 'Escape') {
      handleCancel()
    }
  }

  if (isEditing) {
    return (
      <div className="space-y-3">
        <label className="block text-xs font-medium text-ink-secondary">{label}</label>
        {multiline ? (
          <textarea
            ref={inputRef as React.Ref<HTMLTextAreaElement>}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isLoading}
            className="w-full bg-surface border border-line rounded-lg px-3 py-2 text-ink text-sm focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 disabled:opacity-50 resize-none h-24"
          />
        ) : (
          <input
            ref={inputRef as React.Ref<HTMLInputElement>}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isLoading}
            className="w-full bg-surface border border-line rounded-lg px-3 py-2 text-ink text-sm focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 disabled:opacity-50"
          />
        )}

        {error && (
          <div className="flex items-center gap-2 px-3 py-2 rounded bg-red-500/10 border border-red-500/30">
            <AlertCircle size={14} className="text-red-400 shrink-0" />
            <p className="text-xs text-red-400">{error}</p>
          </div>
        )}

        <div className="flex gap-2 justify-end pt-2">
          <button
            onClick={handleCancel}
            disabled={isLoading}
            className="px-3 py-1.5 rounded text-xs font-medium bg-surface text-ink-secondary hover:bg-surface-hover disabled:opacity-50 transition-colors"
          >
            <X size={14} />
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="px-3 py-1.5 rounded text-xs font-medium bg-violet-500 text-white hover:bg-violet-600 disabled:opacity-50 transition-colors flex items-center gap-1"
          >
            {isLoading ? (
              <>
                <span className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Check size={14} />
                Guardar
              </>
            )}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="group">
      <label className="block text-xs font-medium text-ink-secondary mb-2">{label}</label>
      <div className="flex items-start justify-between gap-3 p-3 rounded-lg bg-surface border border-line-subtle hover:border-line transition-colors">
        <p className={clsx('text-sm flex-1 break-words', value ? 'text-ink' : 'text-ink-muted italic')}>
          {value || placeholder || '—'}
        </p>
        <button
          onClick={() => setIsEditing(true)}
          className="shrink-0 p-1.5 rounded hover:bg-surface-hover text-ink-tertiary hover:text-ink-secondary transition-colors opacity-0 group-hover:opacity-100"
          title="Editar"
        >
          <Edit2 size={14} />
        </button>
      </div>
    </div>
  )
}
