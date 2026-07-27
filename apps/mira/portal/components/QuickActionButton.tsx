'use client'

import { useState } from 'react'
import { Loader2, Sparkles } from 'lucide-react'
import { t } from '@/lib/i18n'
import { useLocaleContext } from '@/app/locale-provider'
import { getStoredClientId } from '@/lib/client-context'
import { getStoredProjectId } from '@/lib/project-context'
import { AttachmentDropzone } from '@/components/AttachmentDropzone'
import { QuickActionForm } from '@/components/quick-actions/QuickActionForm'
import { GuidedQuickActionChat } from '@/components/quick-actions/GuidedQuickActionChat'
import type { Attachment } from '@/lib/attachments'
import type { QuickActionDef } from '@/lib/quick-actions/registry'
import type { AutofillBundle } from '@/lib/quick-actions/autofill-types'

interface QuickActionButtonProps {
  action: QuickActionDef
  autofill?: AutofillBundle | null
  onActionComplete?: (actionId: string, inputData?: Record<string, unknown>) => void
}

export function QuickActionButton({ action, autofill, onActionComplete }: QuickActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [mode, setMode] = useState<'form' | 'chat'>('form')
  const { locale } = useLocaleContext()

  const title = t(action.titleKey, locale)
  const description = t(action.descriptionKey, locale)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // Acciones cuyo insumo ES el adjunto (editar_imagen_visual): exigirlo
    if (action.requiredAttachment === 'image' && !attachments.some((a) => a.type === 'image')) {
      setSubmitError(t('qa.attachment-required', locale))
      return
    }

    setIsLoading(true)
    setSubmitError(null)

    try {
      const formData = new FormData(e.currentTarget)
      // Object.fromEntries silently keeps only the last value for repeated
      // field names (e.g. multiple checkboxes sharing name="metrics") — collect
      // those as arrays instead of dropping every value but the last one.
      const inputData: Record<string, FormDataEntryValue | FormDataEntryValue[] | boolean> = {}
      for (const key of new Set(formData.keys())) {
        const values = formData.getAll(key)
        inputData[key] = values.length > 1 ? values : values[0]
      }
      // Toggles: un checkbox sin marcar no aparece en FormData — normalizar a
      // boolean explícito para que resolveOutputType y el prompt lo vean.
      for (const field of action.fields) {
        if (field.type === 'toggle') {
          inputData[field.name] = formData.get(field.name) === 'true'
        }
      }

      const response = await fetch('/api/quick-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          department: action.department,
          action_type: action.id,
          input_data: inputData,
          attachments: attachments.length ? attachments : undefined,
          clientId: getStoredClientId(),
          project_id: getStoredProjectId(),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to queue action')
      }

      const result = await response.json()
      onActionComplete?.(result.action_id, inputData as Record<string, unknown>)
      setIsOpen(false)
      setAttachments([])
    } catch (error) {
      console.error('Error queuing action:', error)
      setSubmitError(t('quick-actions.network-error', locale))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => {
          setSubmitError(null)
          setIsOpen(true)
        }}
        className="card px-4 py-3 text-sm font-medium text-ink hover:bg-surface-hover transition-colors flex items-center gap-2 group"
      >
        <Sparkles size={16} className="text-purple-400 group-hover:text-purple-300" />
        {title}
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="card p-6 max-w-md w-full mx-4 max-h-[85vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-ink mb-2">{title}</h3>
            <p className="text-sm text-ink-secondary mb-4">{description}</p>

            {/* Toggle Formulario | Cuéntamelo */}
            <div className="flex rounded-lg bg-surface p-1 mb-4 text-sm font-medium">
              <button
                type="button"
                onClick={() => setMode('form')}
                className={`flex-1 py-1.5 rounded-md transition-colors ${
                  mode === 'form' ? 'bg-purple-600 text-white' : 'text-ink-secondary hover:text-ink'
                }`}
              >
                {t('qa.mode.form', locale)}
              </button>
              <button
                type="button"
                onClick={() => setMode('chat')}
                className={`flex-1 py-1.5 rounded-md transition-colors ${
                  mode === 'chat' ? 'bg-purple-600 text-white' : 'text-ink-secondary hover:text-ink'
                }`}
              >
                {t('qa.mode.chat', locale)}
              </button>
            </div>

            {mode === 'chat' ? (
              <GuidedQuickActionChat
                action={action}
                clientId={getStoredClientId()}
                projectId={getStoredProjectId()}
                onSubmitted={(actionId, fields) => {
                  onActionComplete?.(actionId, fields)
                  setIsOpen(false)
                  setMode('form')
                }}
              />
            ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <QuickActionForm
                fields={action.fields}
                autofill={autofill}
                clientId={getStoredClientId()}
              />

              {action.acceptsAttachments !== false && (
                <AttachmentDropzone
                  clientId={getStoredClientId()}
                  attachments={attachments}
                  onChange={setAttachments}
                  imagesOnly={action.requiredAttachment === 'image'}
                  disabled={isLoading}
                />
              )}

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-ink-secondary bg-surface hover:bg-surface-hover transition-colors"
                  disabled={isLoading}
                >
                  {t('actions.cancel', locale)}
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      {t('actions.processing', locale)}
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      {t('actions.generate', locale)}
                    </>
                  )}
                </button>
              </div>

              {submitError && (
                <p className="text-xs text-red-400 mt-2" role="alert">
                  {submitError}
                </p>
              )}
            </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
