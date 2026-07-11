'use client'

import { useState } from 'react'
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react'

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
  resultComponent?: React.ReactNode
  isLoading?: boolean
}

export default function ToolRunnerPage({
  config,
  onGenerate,
  resultComponent,
  isLoading: externalLoading = false,
}: ToolRunnerPageProps) {
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
  const [result, setResult] = useState<any>(null)
  const [outputFormat, setOutputFormat] = useState<'web' | 'slides'>('web')

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const result = await onGenerate({
        ...formData,
        output_format: outputFormat,
      })
      setResult(result)
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
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

          {/* Output Format Selector */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <p className="text-sm font-semibold text-white mb-3">Output format</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setOutputFormat('web')}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  outputFormat === 'web'
                    ? 'bg-purple-600 text-white'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                🌐 Web Report
              </button>
              <button
                type="button"
                onClick={() => setOutputFormat('slides')}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  outputFormat === 'slides'
                    ? 'bg-purple-600 text-white'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                📊 Google Slides
              </button>
            </div>
          </div>

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
      ) : (
        resultComponent
      )}
    </div>
  )
}
