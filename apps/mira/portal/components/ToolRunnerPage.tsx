'use client'

import { useState, useEffect } from 'react'
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { fetchBrandBrainData } from '@/lib/brand-brain-loader'
import { useActiveClient } from '@/lib/client-context'
import { CLIENT_ID } from '@/lib/constants'

export interface ToolField {
  name: string
  label: string
  type: 'text' | 'textarea' | 'select' | 'color'
  placeholder?: string
  hint?: string
  options?: Array<{ value: string; label: string }>
  required?: boolean
  defaultValue?: string
  example?: string
}

export interface ToolConfig {
  slug: string
  icon: string
  title: string
  subtitle: string
  timing: string
  brandBrainNote?: string
  fields: ToolField[]
  submitButtonText: string
  submitButtonColor?: string
}

interface ToolRunnerPageProps {
  config: ToolConfig
  onGenerate: (formData: Record<string, any>) => Promise<any>
  resultComponent?: any
  isLoading?: boolean
}

export default function ToolRunnerPage({
  config,
  onGenerate,
  resultComponent,
  isLoading: externalLoading = false,
}: ToolRunnerPageProps) {
  const { activeClient } = useActiveClient()
  const clientId = activeClient?.id ?? CLIENT_ID

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

  // Load Brand Brain data on mount
  useEffect(() => {
    const loadBrandData = async () => {
      if (!clientId) return
      const brandData = await fetchBrandBrainData(clientId)
      if (Object.keys(brandData).length > 0) {
        setFormData((prev) => ({ ...prev, ...brandData }))
      }
    }
    loadBrandData()
  }, [clientId])

  // Poll for generation result every 2 seconds
  useEffect(() => {
    if (!pollingQueueId) return

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/toolkit/status?queue_id=${pollingQueueId}`)
        if (!res.ok) return

        const data = await res.json()
        if (data.status === 'completed' && data.result_data) {
          setResultData(data.result_data)
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
      const data = await onGenerate(formData)
      if (data?.queue_id) {
        // Start polling for result
        setPollingQueueId(data.queue_id)
        // If result is already available, use it immediately
        if (data?.result) {
          setResultData(data.result)
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
        <p className="text-xs uppercase tracking-widest font-semibold mb-2 text-gray-500">
          Toolkit
        </p>
        <div className="flex items-start gap-4">
          <span className="text-4xl">{config.icon}</span>
          <div>
            <h1 className="text-3xl font-semibold text-white">{config.title}</h1>
            <p className="text-sm text-gray-400 mt-1">
              {config.timing} • {config.subtitle}
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
              <p className="text-sm text-gray-400 mt-1">{error}</p>
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
              <p className="text-sm text-gray-400 mt-1">Claude está analizando tu solicitud (puede tomar 30-60 segundos)</p>
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
              <p className="text-sm text-gray-400 mt-1">Your {config.title} is ready below</p>
            </div>
          </div>
        </div>
      )}

      {/* Form or Result */}
      {!success || isLoading ? (
        <form onSubmit={handleSubmit} className="space-y-6 mb-8">
          {config.fields.map((field) => (
            <div key={field.name}>
              <label className="block text-sm font-semibold text-white mb-2">
                {field.label}
                {field.required && <span className="text-red-400"> *</span>}
              </label>

              {field.hint && (
                <p className="text-xs text-gray-500 mb-2">{field.hint}</p>
              )}

              {field.type === 'text' && (
                <input
                  type="text"
                  name={field.name}
                  value={formData[field.name] || ''}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  placeholder={field.placeholder}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none transition-colors"
                  required={field.required}
                />
              )}

              {field.type === 'textarea' && (
                <textarea
                  name={field.name}
                  value={formData[field.name] || ''}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  placeholder={field.placeholder}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none transition-colors resize-none h-24"
                  required={field.required}
                />
              )}

              {field.type === 'select' && (
                <select
                  name={field.name}
                  value={formData[field.name] || ''}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-purple-500 focus:outline-none transition-colors"
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
                    className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 text-sm"
                    required={field.required}
                  />
                </div>
              )}

              {field.example && (
                <p className="text-xs text-gray-600 mt-1">Ej: {field.example}</p>
              )}
            </div>
          ))}

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
      ) : resultComponent ? (
        typeof resultComponent === 'function' ? (
          (resultComponent as any)({ data: resultData?.result })
        ) : (
          resultComponent
        )
      ) : null}
    </div>
  )
}
