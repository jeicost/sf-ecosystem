'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { useActiveClient } from '@/lib/client-context'
import { AttachmentDropzone } from '@/components/AttachmentDropzone'
import ReportReadiness from '@/components/ReportReadiness'
import type { Attachment } from '@/lib/attachments'

export interface ToolField {
  name: string
  label: string
  type: 'text' | 'textarea' | 'select' | 'color' | 'month' | 'multicheck'
  placeholder?: string
  hint?: string
  options?: Array<{ value: string; label: string }>
  required?: boolean
  defaultValue?: string | string[]
  example?: string
}

export interface ToolConfig {
  slug: string
  icon: string
  title: string
  subtitle?: string
  timing: string
  brandBrainNote?: string
  fields: ToolField[]
  submitButtonText: string
  submitButtonColor?: string
  /** Oculta contexto adicional + adjuntos (raro; por defecto todos los reportes los tienen) */
  hideExtras?: boolean
}

interface ToolRunnerPageProps {
  config: ToolConfig
  onGenerate: (formData: Record<string, any>, attachments?: Attachment[]) => Promise<any>
  resultComponent?: React.ComponentType<{ data?: any }>
  isLoading?: boolean
}

export default function ToolRunnerPage({
  config,
  onGenerate,
  resultComponent: ResultComponent,
  isLoading: externalLoading = false,
}: ToolRunnerPageProps) {
  const { activeClient } = useActiveClient()
  const clientId = activeClient?.id
  const searchParams = useSearchParams()
  const resultQueueId = searchParams.get('result')

  const [formData, setFormData] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = {}
    config.fields.forEach((field) => {
      initial[field.name] = field.defaultValue || ''
    })
    return initial
  })

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [resultData, setResultData] = useState<any>(null)
  const [pollingQueueId, setPollingQueueId] = useState<string | null>(null)
  const [attachments, setAttachments] = useState<Attachment[]>([])

  // El prefill del Brand Brain se eliminó (F1 Business Reports): sus claves
  // nunca coincidieron con los names de los forms, y el brain entra completo
  // server-side en cada prompt — los formularios ya solo piden lo que el
  // brain NO puede saber.

  // Load saved result if ?result=id is in URL
  useEffect(() => {
    if (!resultQueueId) return

    const loadSavedResult = async () => {
      try {
        const res = await fetch(`/api/toolkit/status?queue_id=${resultQueueId}`)
        if (!res.ok) {
          setError('Could not load saved result')
          return
        }

        const data = await res.json()
        if (data.status === 'completed' && data.result_data) {
          // Parse if it's a string (Supabase might return as text)
          const parsed = typeof data.result_data === 'string' ? JSON.parse(data.result_data) : data.result_data
          setResultData(parsed)
          setSuccess(true)
        } else if (data.status === 'failed') {
          setError(data.error_message || 'Generation failed')
        } else {
          setError('Result not ready yet')
        }
      } catch (err) {
        console.error('Error loading saved result:', err)
        setError('Failed to load result')
      }
    }

    loadSavedResult()
  }, [resultQueueId])

  // Poll for generation result every 2 seconds
  useEffect(() => {
    if (!pollingQueueId) return

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/toolkit/status?queue_id=${pollingQueueId}`)
        if (!res.ok) return

        const data = await res.json()
        if (data.status === 'completed' && data.result_data) {
          // Parse if it's a string (Supabase might return as text)
          const parsed = typeof data.result_data === 'string' ? JSON.parse(data.result_data) : data.result_data
          setResultData(parsed)
          setSuccess(true)
          setIsLoading(false)
          setPollingQueueId(null)
          clearInterval(interval)
        } else if (data.status === 'failed') {
          setError(data.error_message || 'Generation failed')
          setIsLoading(false)
          setPollingQueueId(null)
          clearInterval(interval)
        }
      } catch (err) {
        console.error('Polling error:', err)
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [pollingQueueId])

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(false)
    setResultData(null)
    setPollingQueueId(null)

    try {
      const data = await onGenerate(formData, attachments)
      if (data?.queue_id) {
        // Start polling for result
        setPollingQueueId(data.queue_id)
        // If result is already available, use it immediately
        if (data?.result) {
          const parsed = typeof data.result === 'string' ? JSON.parse(data.result) : data.result
          setResultData(parsed)
          setSuccess(true)
          setIsLoading(false)
        }
      } else {
        setError('No queue ID returned')
        setIsLoading(false)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setIsLoading(false)
    }
  }

  return (
    <div className="px-8 py-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs uppercase tracking-widest font-semibold mb-2 text-ink-tertiary">
          Business Reports
        </p>
        <div className="flex items-start gap-4">
          <span className="text-4xl">{config.icon}</span>
          <div>
            <h1 className="text-3xl font-semibold text-ink">{config.title}</h1>
            <p className="text-sm text-ink-secondary mt-1">
              {config.timing} • {config.subtitle || activeClient?.name || ''}
            </p>
          </div>
        </div>
      </div>

      {/* Brand Brain Indicator */}
      {config.brandBrainNote && (
        <div className="mb-6 px-4 py-3 rounded-lg" style={{ background: 'rgba(34,197,94,0.1)', borderLeft: '3px solid #22C55E' }}>
          <p className="text-sm text-green-400">
            ✓ {config.brandBrainNote}
          </p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="card p-4 border-red-500/20 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} style={{ color: '#EF4444' }} />
            <div>
              <p className="font-semibold text-red-400">Error</p>
              <p className="text-sm text-ink-secondary mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Loading State - Waiting for Result */}
      {pollingQueueId && isLoading && (
        <div className="card p-4 border-blue-500/20 mb-6">
          <div className="flex items-start gap-3">
            <Loader2 size={20} className="animate-spin" style={{ color: '#3B82F6' }} />
            <div>
              <p className="font-semibold text-blue-400">Generando...</p>
              <p className="text-sm text-ink-secondary mt-1">Claude está analizando tu solicitud (puede tomar 30-60 segundos)</p>
            </div>
          </div>
        </div>
      )}

      {/* Success State */}
      {success && !isLoading && (
        <div className="card p-4 border-green-500/20 mb-6">
          <div className="flex items-start gap-3">
            <CheckCircle size={20} style={{ color: '#22C55E' }} />
            <div>
              <p className="font-semibold text-green-400">Generated successfully</p>
              <p className="text-sm text-ink-secondary mt-1">Your {config.title} is ready below</p>
            </div>
          </div>
        </div>
      )}

      {/* Semáforo de completitud del Brand Brain — informa, NUNCA bloquea */}
      {!success && <ReportReadiness toolSlug={config.slug} />}

      {/* Form or Result */}
      {!success || isLoading ? (
        <form onSubmit={handleSubmit} className="space-y-6 mb-8">
          {config.fields.map((field) => (
            <div key={field.name}>
              <label className="block text-sm font-semibold text-ink mb-2">
                {field.label}
                {field.required && <span className="text-red-400"> *</span>}
              </label>

              {field.hint && (
                <p className="text-xs text-ink-tertiary mb-2">{field.hint}</p>
              )}

              {field.type === 'text' && (
                <input
                  type="text"
                  name={field.name}
                  value={formData[field.name] || ''}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  placeholder={field.placeholder}
                  className="w-full px-4 py-3 bg-surface border border-line rounded-lg text-ink placeholder-ink-tertiary focus:border-purple-500 focus:outline-none transition-colors"
                  required={field.required}
                />
              )}

              {field.type === 'textarea' && (
                <textarea
                  name={field.name}
                  value={formData[field.name] || ''}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  placeholder={field.placeholder}
                  className="w-full px-4 py-3 bg-surface border border-line rounded-lg text-ink placeholder-ink-tertiary focus:border-purple-500 focus:outline-none transition-colors resize-none h-24"
                  required={field.required}
                />
              )}

              {field.type === 'select' && (
                <select
                  name={field.name}
                  value={formData[field.name] || ''}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  className="w-full px-4 py-3 bg-surface border border-line rounded-lg text-ink focus:border-purple-500 focus:outline-none transition-colors"
                  required={field.required}
                >
                  <option value="">Selecciona...</option>
                  {field.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              )}

              {field.type === 'color' && (
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    name={field.name}
                    value={formData[field.name] || '#000000'}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    className="w-16 h-10 rounded-lg cursor-pointer"
                    required={field.required}
                  />
                  <input
                    type="text"
                    value={formData[field.name] || ''}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    placeholder="#FF4500"
                    className="flex-1 px-4 py-2 bg-surface border border-line rounded-lg text-ink placeholder-ink-tertiary text-sm"
                    required={field.required}
                  />
                </div>
              )}

              {field.type === 'month' && (
                <input
                  type="month"
                  name={field.name}
                  value={formData[field.name] || ''}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  className="w-full px-4 py-3 bg-surface border border-line rounded-lg text-ink focus:border-purple-500 focus:outline-none transition-colors"
                  required={field.required}
                />
              )}

              {field.type === 'multicheck' && (
                <div className="flex flex-wrap gap-3">
                  {field.options?.map((opt) => {
                    const selected: string[] = Array.isArray(formData[field.name]) ? formData[field.name] : []
                    const checked = selected.includes(opt.value)
                    return (
                      <label key={opt.value} className="flex items-center gap-1.5 text-sm text-ink cursor-pointer bg-surface border border-line rounded-lg px-3 py-2">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            handleChange(
                              field.name,
                              checked ? selected.filter((v) => v !== opt.value) : [...selected, opt.value]
                            )
                          }
                          className="accent-purple-500"
                        />
                        {opt.label}
                      </label>
                    )
                  })}
                </div>
              )}

              {field.example && (
                <p className="text-xs text-ink-tertiary mt-1">Ej: {field.example}</p>
              )}
            </div>
          ))}

          {!config.hideExtras && (
            <>
              <div>
                <label className="block text-sm font-semibold text-ink mb-2">Contexto adicional (opcional)</label>
                <p className="text-xs text-ink-tertiary mb-2">Pega aquí cualquier información extra que el informe deba tener en cuenta.</p>
                <textarea
                  value={formData.contexto_adicional || ''}
                  onChange={(e) => handleChange('contexto_adicional', e.target.value)}
                  placeholder="Notas, datos, contexto del momento..."
                  className="w-full px-4 py-3 bg-surface border border-line rounded-lg text-ink placeholder-ink-tertiary focus:border-purple-500 focus:outline-none transition-colors resize-none h-24"
                />
              </div>
              <AttachmentDropzone
                clientId={clientId ?? null}
                attachments={attachments}
                onChange={setAttachments}
                disabled={isLoading}
              />
            </>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || externalLoading}
            className="w-full px-6 py-3 rounded-lg text-base font-semibold text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            style={{
              background: config.submitButtonColor || '#FF6B35',
            }}
          >
            {isLoading || externalLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Generando...
              </>
            ) : (
              <>
                ⚡ {config.submitButtonText}
              </>
            )}
          </button>
        </form>
      ) : ResultComponent ? (
        <div className="space-y-6">
          <ResultComponent data={resultData} />
          {pollingQueueId && (
            <div className="flex gap-3 pt-6 border-t border-line-subtle">
              <button
                onClick={() => {
                  if (pollingQueueId) {
                    window.location.href = `/api/toolkit/export?queue_id=${pollingQueueId}`
                  }
                }}
                className="flex-1 px-6 py-3 rounded-lg font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors text-sm"
              >
                📥 Descargar HTML
              </button>
              <button
                onClick={() => setResultData(null)}
                className="px-6 py-3 rounded-lg font-semibold text-ink bg-surface hover:bg-surface-hover transition-colors text-sm"
              >
                ↻ Nuevamente
              </button>
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}
