'use client'

import { useState, useEffect } from 'react'
import { Check, X, Loader2, Download, Heart, Save } from 'lucide-react'
import { t } from '@/lib/i18n'
import { useLocaleContext } from '@/app/locale-provider'
import { getStoredClientId } from '@/lib/client-context'
import { getStoredProjectId } from '@/lib/project-context'
// import Image from 'next/image' // TODO: Image not yet used

interface QuickActionResultProps {
  actionId: string
  resourceName: string
  department: string
  outputType?: string
}

export function QuickActionResult({ actionId, resourceName, department, outputType: propOutputType }: QuickActionResultProps) {
  const [result, setResult] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [liked, setLiked] = useState(false)
  const [isMemorySaved, setIsMemorySaved] = useState(false)
  const { locale } = useLocaleContext()

  useEffect(() => {
    const pollResult = async () => {
      try {
        const response = await fetch(`/api/quick-actions?action_id=${actionId}`)
        const data = await response.json().catch(() => null)

        if (!response.ok || data?.error) {
          throw new Error(data?.error || 'Failed to fetch result')
        }

        if (data?.output_data && Object.keys(data.output_data).length > 0) {
          setResult(data)
          setLiked(!!data.liked_by_user)
          setIsLoading(false)
        } else {
          // Still processing
          setTimeout(pollResult, 2000)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
        setIsLoading(false)
      }
    }

    pollResult()
  }, [actionId])

  const handleLike = async () => {
    const next = !liked
    setLiked(next) // optimistic — a like shouldn't feel like it needs a network round-trip
    try {
      const res = await fetch('/api/quick-actions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action_id: actionId, liked: next }),
      })
      if (!res.ok) throw new Error('Failed to save like')
    } catch (err) {
      console.error('Error saving like:', err)
      setLiked(!next) // revert on failure
    }
  }

  const handleSaveToMemory = async () => {
    setIsSaving(true)
    try {
      // Extract key insight for summary
      const summary = extractSummary(result.output_data, displayOutputType)

      const res = await fetch('/api/project-memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionId,
          clientId: getStoredClientId(),
          projectId: getStoredProjectId(),
          title: resourceName,
          category: determineCategoryFromDepartment(department),
          summary: summary || 'Resultado guardado del toolkit',
          tags: [department, displayOutputType],
          sourceDepartment: department,
          fullContent: result.output_data,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to save to project memory')
      }

      setIsMemorySaved(true)
      setTimeout(() => setIsSaving(false), 1500)
    } catch (err) {
      console.error('Error saving to memory:', err)
      setError(err instanceof Error ? err.message : 'Failed to save to memory')
      setIsSaving(false)
    }
  }

  const handleSaveToGoogleDrive = async () => {
    setIsSaving(true)
    try {
      const res = await fetch('/api/export/google-drive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action_id: actionId }),
      })

      const responseData = await res.json().catch(() => null)

      if (!res.ok || responseData?.error) {
        throw new Error(responseData?.error || 'Failed to export to Google Drive')
      }

      const driveUrl = responseData?.driveUrl || responseData?.url

      // Open Google Drive file in new tab
      if (driveUrl) {
        window.open(driveUrl, '_blank')
      }

      setIsMemorySaved(true)
      setTimeout(() => setIsSaving(false), 1500)
    } catch (err) {
      console.error('Error saving to Google Drive:', err)
      setError(err instanceof Error ? err.message : 'Failed to export to Google Drive')
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="card px-6 py-8 text-center">
        <Loader2 size={32} className="animate-spin text-purple-400 mx-auto mb-2" />
        <p className="text-sm text-ink-secondary">
          {t('actions.generating-item', locale).replace('{item}', resourceName)}
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card px-6 py-4 border-red-500/20" style={{ borderColor: 'rgba(239, 68, 68, 0.2)' }}>
        <div className="flex items-start gap-3">
          <X size={20} style={{ color: '#EF4444' }} />
          <div>
            <p className="font-semibold text-red-400">
              {t('actions.error-generating', locale).replace('{item}', resourceName)}
            </p>
            <p className="text-sm text-ink-secondary mt-1">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!result) return null

  const { output_data, output_type } = result
  const displayOutputType = propOutputType || output_type || 'json'

  return (
    <div className="space-y-4">
      <div className="card px-6 py-4 border-green-500/20" style={{ borderColor: 'rgba(34, 197, 94, 0.2)' }}>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <Check size={20} style={{ color: '#22C55E' }} />
            <div>
              <p className="font-semibold text-green-400">
                {t('actions.ready', locale).replace('{item}', resourceName)}
              </p>
              <p className="text-sm text-ink-secondary mt-1">{t('actions.ai-content-ready', locale)}</p>
            </div>
          </div>
          <button
            onClick={handleLike}
            className="p-2 rounded-lg transition-colors"
            style={{ background: liked ? 'rgba(236, 72, 153, 0.2)' : 'var(--bg-surface)' }}
          >
            <Heart size={18} fill={liked ? 'currentColor' : 'none'} style={{ color: liked ? '#EC4899' : 'var(--text-secondary)' }} />
          </button>
        </div>
      </div>

      {/* Content Preview */}
      <div className="card px-6 py-4">
        <h3 className="font-semibold text-ink mb-3">{t('actions.preview', locale)}</h3>
        <ContentPreview outputType={displayOutputType} outputData={output_data} locale={locale} />
      </div>

      {/* Action Buttons */}
      <div className="card px-6 py-4 space-y-2">
        <h3 className="font-semibold text-ink mb-3">{t('actions.save-options', locale)}</h3>

        <button
          onClick={handleSaveToMemory}
          disabled={isSaving || isMemorySaved}
          className="w-full px-4 py-2 rounded-lg text-sm font-medium text-ink bg-purple-600/20 hover:bg-purple-600/30 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isSaving && <Loader2 size={16} className="animate-spin" />}
          {isMemorySaved ? (
            <>
              <Check size={16} />
              {t('actions.saved-to-memory', locale)}
            </>
          ) : (
            <>
              <Save size={16} />
              {t('actions.save-to-memory', locale)}
            </>
          )}
        </button>

        {['image', 'document', 'video'].includes(displayOutputType) && (
          <button
            onClick={handleSaveToGoogleDrive}
            disabled={isSaving}
            className="w-full px-4 py-2 rounded-lg text-sm font-medium text-ink bg-blue-600/20 hover:bg-blue-600/30 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSaving && <Loader2 size={16} className="animate-spin" />}
            <Download size={16} />
            {t('actions.save-to-drive', locale)}
          </button>
        )}
      </div>

      {/* Raw Data */}
      <details className="card px-6 py-4">
        <summary className="cursor-pointer font-semibold text-ink mb-2">{t('actions.raw-output', locale)}</summary>
        <pre className="text-xs text-ink-secondary bg-surface p-3 rounded mt-2 overflow-x-auto max-h-64">
          {JSON.stringify(output_data, null, 2)}
        </pre>
      </details>
    </div>
  )
}

function extractSummary(outputData: any, _outputType: string): string {
  if (outputData.summary) return outputData.summary.substring(0, 200)
  if (outputData.title) return outputData.title
  if (outputData.copy) return outputData.copy.substring(0, 200)
  if (outputData.script) return outputData.script.substring(0, 200)
  return t('actions.complete', 'es')
}

function determineCategoryFromDepartment(department: string): string {
  const categoryMap: Record<string, string> = {
    comercial: 'action',
    marketing: 'content',
    strategy: 'insight',
    community: 'action',
    admin: 'metric',
  }
  return categoryMap[department] || 'insight'
}

function ContentPreview({ outputType, outputData, locale }: { outputType: string; outputData: any; locale: 'es' | 'en' }) {
  switch (outputType) {
    case 'image': {
      const imageSrc = outputData.image_path
        ? '/api/assets?path=' + encodeURIComponent(outputData.image_path)
        : outputData.image_url
      return (
        <div className="space-y-2">
          {outputData.image_error && (
            <div className="flex items-start gap-2 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">
              <span>{t('quick-result.image-error', locale)}</span>
            </div>
          )}
          {imageSrc && (
            <img src={imageSrc} alt="Generated" className="w-full rounded-lg max-h-96 object-cover" />
          )}
          {outputData.copy && <p className="text-sm text-ink-secondary">{outputData.copy}</p>}
          {outputData.hashtags && (
            <p className="text-xs text-purple-400">{outputData.hashtags.join(' ')}</p>
          )}
        </div>
      )
    }

    case 'document':
      return (
        <div className="space-y-2">
          {outputData.summary && <p className="text-sm text-ink-secondary">{outputData.summary}</p>}
          {outputData.articles && (
            <div className="space-y-2">
              {outputData.articles.slice(0, 3).map((article: any, i: number) => (
                <div key={i} className="text-xs bg-surface p-2 rounded">
                  <p className="font-semibold text-ink">{article.title}</p>
                  <p className="text-ink-secondary">{article.summary}</p>
                </div>
              ))}
            </div>
          )}
          {outputData.file_id && (
            <a href={outputData.google_drive_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400">
              {t('actions.open-in-drive', locale)}
            </a>
          )}
        </div>
      )

    case 'video':
      return (
        <div className="space-y-2">
          {outputData.script && <p className="text-sm text-ink-secondary">{outputData.script.substring(0, 200)}...</p>}
          {outputData.scenes && (
            <div className="text-xs bg-surface p-2 rounded">
              <p className="font-semibold text-ink mb-1">
                {outputData.scenes.length} {t('actions.scenes', locale)}
              </p>
              {outputData.scenes.slice(0, 2).map((scene: any, i: number) => (
                <p key={i} className="text-ink-secondary text-xs">{scene.time}: {scene.action}</p>
              ))}
            </div>
          )}
        </div>
      )

    case 'text':
      return (
        <div className="space-y-2">
          {outputData.subject && <p className="text-sm font-semibold text-ink">{outputData.subject}</p>}
          {(outputData.body || outputData.text) && (
            <p className="text-sm text-ink-secondary whitespace-pre-wrap">{outputData.body || outputData.text}</p>
          )}
          {outputData.suggested_follow_ups?.length > 0 && (
            <div className="text-xs bg-surface p-2 rounded">
              <p className="font-semibold text-ink mb-1">{t('actions.follow-ups', locale)}</p>
              <ul className="list-disc list-inside text-ink-secondary">
                {outputData.suggested_follow_ups.map((f: string, i: number) => <li key={i}>{f}</li>)}
              </ul>
            </div>
          )}
        </div>
      )

    case 'json':
    default:
      return (
        <pre className="text-xs text-ink-secondary bg-surface p-3 rounded overflow-x-auto max-h-64">
          {JSON.stringify(outputData, null, 2)}
        </pre>
      )
  }
}
