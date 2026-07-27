'use client'

import { useState, useEffect } from 'react'
import { Check, X, Loader2, Download, Heart, Save, ArrowRight, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
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
  // `error` is for generation/poll failures only -- there's no result to show,
  // so replacing the whole view with an error card is correct here.
  const [error, setError] = useState<string | null>(null)
  // `saveError`/`saveNote` are for the save buttons only -- shown inline next
  // to them, never replace the already-generated result (that was the actual
  // bug behind "no funciona nada": a save failure used to hide everything).
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveNote, setSaveNote] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [liked, setLiked] = useState(false)
  const [isMemorySaved, setIsMemorySaved] = useState(false)
  const [isDriveSaved, setIsDriveSaved] = useState(false)
  const [isSentToApprovals, setIsSentToApprovals] = useState(false)
  const { locale } = useLocaleContext()

  const handleSendToApprovals = async () => {
    setIsSaving(true)
    setSaveError(null)
    try {
      const res = await fetch('/api/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action_id: actionId }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || data?.error) {
        throw new Error(data?.error || 'Failed to send to approvals')
      }
      setIsSentToApprovals(true)
      setTimeout(() => setIsSaving(false), 1500)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to send to approvals')
      setIsSaving(false)
    }
  }

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
    setSaveError(null)
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
      setSaveError(err instanceof Error ? err.message : 'Failed to save to memory')
      setIsSaving(false)
    }
  }

  const handleSaveToGoogleDrive = async () => {
    setIsSaving(true)
    setSaveError(null)
    setSaveNote(null)
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

      // Uploaded successfully, but maybe to the shared platform folder
      // instead of the client's own Drive -- tell them why, don't stay silent.
      if (responseData?.reason && responseData?.message) {
        setSaveNote(responseData.message)
      }

      setIsDriveSaved(true)
      setTimeout(() => setIsSaving(false), 1500)
    } catch (err) {
      console.error('Error saving to Google Drive:', err)
      setSaveError(err instanceof Error ? err.message : 'Failed to export to Google Drive')
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
  const displayOutputType = propOutputType || output_type || 'structured'

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

        {/* Marketing content can go straight into the approval pipeline --
            the same approval_queue New Brief feeds. Without this, quick-action
            content lived only in quick_actions_results and never reached the
            review flow the client actually works in. */}
        {['social_post', 'newsletter', 'text'].includes(displayOutputType) && (
          <>
            <button
              onClick={handleSendToApprovals}
              disabled={isSaving || isSentToApprovals}
              className="w-full px-4 py-2 rounded-lg text-sm font-medium text-ink bg-emerald-600/20 hover:bg-emerald-600/30 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSaving && <Loader2 size={16} className="animate-spin" />}
              {isSentToApprovals ? (
                <>
                  <Check size={16} />
                  {t('actions.sent-to-approvals', locale)}
                </>
              ) : (
                <>
                  <Check size={16} />
                  {t('actions.send-to-approvals', locale)}
                </>
              )}
            </button>
            {isSentToApprovals && (
              <Link
                href="/approvals"
                className="flex items-center justify-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 transition-colors pb-1"
              >
                {t('actions.view-in-approvals', locale)} <ArrowRight size={12} />
              </Link>
            )}
          </>
        )}

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

        {isMemorySaved && (
          <Link
            href="/project-memory"
            className="flex items-center justify-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 transition-colors pb-1"
          >
            {t('actions.view-in-memory', locale)} <ArrowRight size={12} />
          </Link>
        )}

        <button
          onClick={handleSaveToGoogleDrive}
          disabled={isSaving}
          className="w-full px-4 py-2 rounded-lg text-sm font-medium text-ink bg-blue-600/20 hover:bg-blue-600/30 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isSaving && <Loader2 size={16} className="animate-spin" />}
          {isDriveSaved ? (
            <>
              <Check size={16} />
              {t('actions.saved-to-drive', locale)}
            </>
          ) : (
            <>
              <Download size={16} />
              {t('actions.save-to-drive', locale)}
            </>
          )}
        </button>

        {saveError && (
          <div className="flex items-start gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/25 rounded-lg px-3 py-2 mt-2">
            <AlertTriangle size={13} className="mt-0.5 shrink-0" />
            <span>{saveError}</span>
          </div>
        )}
        {saveNote && !saveError && (
          <div className="flex items-start gap-2 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/25 rounded-lg px-3 py-2 mt-2">
            <AlertTriangle size={13} className="mt-0.5 shrink-0" />
            <span>{saveNote}</span>
          </div>
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
  if (outputData.executive_summary) return outputData.executive_summary.substring(0, 200)
  if (outputData.title) return outputData.title
  if (outputData.subject) return outputData.subject
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

// ─── Content Preview ─────────────────────────────────────────────────────

/** snake_case / camelCase key -> readable label, e.g. "implementation_roadmap" -> "Implementation Roadmap". */
function labelFromKey(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

/** Fields already shown as the "headline" of a structured result -- skipped when rendering the rest. */
const STRUCTURED_HEADLINE_KEYS = ['title', 'subject', 'campaign_name', 'summary', 'executive_summary']

function StructuredValue({ value }: { value: any }) {
  if (value === null || value === undefined || value === '') return null

  if (Array.isArray(value)) {
    if (value.length === 0) return null
    // Array of primitives -> bullet list
    if (typeof value[0] !== 'object') {
      return (
        <ul className="list-disc list-inside space-y-0.5">
          {value.map((v, i) => (
            <li key={i} className="text-sm text-ink-secondary">{String(v)}</li>
          ))}
        </ul>
      )
    }
    // Array of objects -> a card per item, its own fields as label: value
    return (
      <div className="space-y-2">
        {value.map((item, i) => (
          <div key={i} className="bg-surface rounded-lg p-3 space-y-1">
            {Object.entries(item).map(([k, v]) => {
              if (v === null || v === undefined || v === '') return null
              return (
                <div key={k} className="text-xs">
                  <span className="text-ink-tertiary">{labelFromKey(k)}: </span>
                  <span className="text-ink-secondary">
                    {Array.isArray(v) ? v.join(', ') : typeof v === 'object' ? JSON.stringify(v) : String(v)}
                  </span>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    )
  }

  if (typeof value === 'object') {
    return (
      <div className="bg-surface rounded-lg p-3 space-y-1">
        {Object.entries(value).map(([k, v]) => {
          if (v === null || v === undefined || v === '') return null
          return (
            <div key={k} className="text-xs">
              <span className="text-ink-tertiary">{labelFromKey(k)}: </span>
              <span className="text-ink-secondary">{Array.isArray(v) ? v.join(', ') : String(v)}</span>
            </div>
          )
        })}
      </div>
    )
  }

  if (typeof value === 'number') {
    return <span className="inline-block text-sm font-semibold text-ink bg-surface rounded px-2 py-0.5">{value}</span>
  }

  return <p className="text-sm text-ink-secondary whitespace-pre-wrap">{String(value)}</p>
}

/**
 * Generic renderer for any well-formed quick-action JSON payload that isn't
 * one of the bespoke types below. Replaces a raw JSON.stringify dump with a
 * headline (title/subject/summary/executive_summary, whichever exists) plus
 * every remaining field formatted by its own shape -- covers every quick
 * action whose outputType used to be mistagged 'json' or a non-matching
 * 'document' (see docs/DEBT.md and this session's Quick Actions bug fixes).
 */
function StructuredResult({ outputData }: { outputData: any }) {
  const headlineTitle = outputData.title || outputData.subject || outputData.campaign_name
  const headlineSummary = outputData.summary || outputData.executive_summary
  const restKeys = Object.keys(outputData).filter((k) => !STRUCTURED_HEADLINE_KEYS.includes(k))

  return (
    <div className="space-y-3">
      {headlineTitle && <p className="text-base font-semibold text-ink">{headlineTitle}</p>}
      {headlineSummary && <p className="text-sm text-ink-secondary">{headlineSummary}</p>}
      {restKeys.map((key) => {
        const value = outputData[key]
        if (value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) return null
        return (
          <div key={key}>
            <p className="text-[10px] uppercase tracking-wide font-semibold text-ink-tertiary mb-1">{labelFromKey(key)}</p>
            <StructuredValue value={value} />
          </div>
        )
      })}
    </div>
  )
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

    case 'social_post':
      return (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            {outputData.platform && (
              <span className="text-[10px] uppercase tracking-wide font-semibold text-purple-400 bg-purple-500/10 border border-purple-500/25 rounded-full px-2.5 py-1">
                {outputData.platform}
              </span>
            )}
          </div>
          {outputData.copy && (
            <p className="text-sm text-ink whitespace-pre-wrap leading-relaxed">{outputData.copy}</p>
          )}
          {outputData.hashtags?.length > 0 && (
            <p className="text-xs text-purple-400">
              {outputData.hashtags.map((h: string) => (h.startsWith('#') ? h : `#${h}`)).join(' ')}
            </p>
          )}
          {outputData.call_to_action && (
            <div className="bg-surface rounded-lg px-3 py-2">
              <p className="text-[10px] uppercase tracking-wide font-semibold text-ink-tertiary mb-0.5">
                {t('quick-result.cta', locale)}
              </p>
              <p className="text-sm text-ink-secondary">{outputData.call_to_action}</p>
            </div>
          )}
          {outputData.media_brief && (
            <p className="text-xs text-ink-tertiary italic">{t('quick-result.media-brief', locale)}: {outputData.media_brief}</p>
          )}
        </div>
      )

    case 'newsletter':
      return (
        <div className="space-y-3">
          {outputData.subject && <p className="text-base font-semibold text-ink">{outputData.subject}</p>}
          {outputData.preview_text && (
            <p className="text-xs text-ink-tertiary italic">{outputData.preview_text}</p>
          )}
          {outputData.sections?.length > 0 && (
            <div className="space-y-2">
              {outputData.sections.map((section: any, i: number) => (
                <div key={i} className="bg-surface rounded-lg p-3 space-y-1">
                  {section.title && <p className="text-sm font-semibold text-ink">{section.title}</p>}
                  {section.content && <p className="text-sm text-ink-secondary whitespace-pre-wrap">{section.content}</p>}
                  {section.cta && <p className="text-xs text-purple-400 font-medium">{section.cta}</p>}
                </div>
              ))}
            </div>
          )}
          {outputData.footer && <p className="text-xs text-ink-tertiary border-t border-line-subtle pt-2">{outputData.footer}</p>}
        </div>
      )

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

    case 'structured':
    default:
      return <StructuredResult outputData={outputData} />
  }
}
