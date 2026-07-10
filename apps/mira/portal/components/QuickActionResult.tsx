'use client'

import { useState, useEffect } from 'react'
import { Check, X, Loader2, Download, Heart, Save } from 'lucide-react'
import Image from 'next/image'

interface QuickActionResultProps {
  actionId: string
  resourceName: string
  department: string
  outputType: string
}

export function QuickActionResult({ actionId, resourceName, department, outputType }: QuickActionResultProps) {
  const [result, setResult] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [liked, setLiked] = useState(false)
  const [isMemorySaved, setIsMemorySaved] = useState(false)

  useEffect(() => {
    const pollResult = async () => {
      try {
        const response = await fetch(`/api/quick-actions?action_id=${actionId}`)
        if (!response.ok) throw new Error('Failed to fetch result')

        const data = await response.json()
        if (data.data.output_data && Object.keys(data.data.output_data).length > 0) {
          setResult(data.data)
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

  const handleLike = () => setLiked(!liked)

  const handleSaveToMemory = async () => {
    setIsSaving(true)
    try {
      // TODO: Call API to save to memory/quick_actions_results
      setIsMemorySaved(true)
      setTimeout(() => setIsSaving(false), 1500)
    } catch (err) {
      console.error('Error saving to memory:', err)
      setIsSaving(false)
    }
  }

  const handleSaveToGoogleDrive = async () => {
    setIsSaving(true)
    try {
      // TODO: Call Google Drive MCP integration
      console.log('Saving to Google Drive:', { actionId, resourceName, outputType })
      setIsSaving(false)
    } catch (err) {
      console.error('Error saving to Google Drive:', err)
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="card px-6 py-8 text-center">
        <Loader2 size={32} className="animate-spin text-purple-400 mx-auto mb-2" />
        <p className="text-sm text-gray-400">Generating {resourceName}...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card px-6 py-4 border-red-500/20" style={{ borderColor: 'rgba(239, 68, 68, 0.2)' }}>
        <div className="flex items-start gap-3">
          <X size={20} style={{ color: '#EF4444' }} />
          <div>
            <p className="font-semibold text-red-400">Error generating {resourceName}</p>
            <p className="text-sm text-gray-400 mt-1">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!result) return null

  const { output_data } = result

  return (
    <div className="space-y-4">
      <div className="card px-6 py-4 border-green-500/20" style={{ borderColor: 'rgba(34, 197, 94, 0.2)' }}>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <Check size={20} style={{ color: '#22C55E' }} />
            <div>
              <p className="font-semibold text-green-400">{resourceName} Ready</p>
              <p className="text-sm text-gray-400 mt-1">Your AI generated content is ready to use</p>
            </div>
          </div>
          <button
            onClick={handleLike}
            className="p-2 rounded-lg transition-colors"
            style={{ background: liked ? 'rgba(236, 72, 153, 0.2)' : 'rgba(255, 255, 255, 0.05)' }}
          >
            <Heart size={18} fill={liked ? 'currentColor' : 'none'} style={{ color: liked ? '#EC4899' : '#9CA3AF' }} />
          </button>
        </div>
      </div>

      {/* Content Preview */}
      <div className="card px-6 py-4">
        <h3 className="font-semibold text-white mb-3">Preview</h3>
        <ContentPreview outputType={outputType} outputData={output_data} />
      </div>

      {/* Action Buttons */}
      <div className="card px-6 py-4 space-y-2">
        <h3 className="font-semibold text-white mb-3">Save Options</h3>

        <button
          onClick={handleSaveToMemory}
          disabled={isSaving || isMemorySaved}
          className="w-full px-4 py-2 rounded-lg text-sm font-medium text-white bg-purple-600/20 hover:bg-purple-600/30 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isSaving && <Loader2 size={16} className="animate-spin" />}
          {isMemorySaved ? (
            <>
              <Check size={16} />
              Saved to Memory
            </>
          ) : (
            <>
              <Save size={16} />
              Save to Memory
            </>
          )}
        </button>

        {['image', 'document', 'video'].includes(outputType) && (
          <button
            onClick={handleSaveToGoogleDrive}
            disabled={isSaving}
            className="w-full px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600/20 hover:bg-blue-600/30 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSaving && <Loader2 size={16} className="animate-spin" />}
            <Download size={16} />
            Save to Google Drive
          </button>
        )}
      </div>

      {/* Raw Data */}
      <details className="card px-6 py-4">
        <summary className="cursor-pointer font-semibold text-white mb-2">Raw Output</summary>
        <pre className="text-xs text-gray-400 bg-black/30 p-3 rounded mt-2 overflow-x-auto max-h-64">
          {JSON.stringify(output_data, null, 2)}
        </pre>
      </details>
    </div>
  )
}

function ContentPreview({ outputType, outputData }: { outputType: string; outputData: any }) {
  switch (outputType) {
    case 'image':
      return (
        <div className="space-y-2">
          {outputData.image_url && (
            <img src={outputData.image_url} alt="Generated" className="w-full rounded-lg max-h-96 object-cover" />
          )}
          {outputData.copy && <p className="text-sm text-gray-300">{outputData.copy}</p>}
          {outputData.hashtags && (
            <p className="text-xs text-purple-400">{outputData.hashtags.join(' ')}</p>
          )}
        </div>
      )

    case 'document':
      return (
        <div className="space-y-2">
          {outputData.summary && <p className="text-sm text-gray-300">{outputData.summary}</p>}
          {outputData.articles && (
            <div className="space-y-2">
              {outputData.articles.slice(0, 3).map((article: any, i: number) => (
                <div key={i} className="text-xs bg-white/5 p-2 rounded">
                  <p className="font-semibold text-white">{article.title}</p>
                  <p className="text-gray-400">{article.summary}</p>
                </div>
              ))}
            </div>
          )}
          {outputData.file_id && (
            <a href={outputData.google_drive_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400">
              Open in Google Drive →
            </a>
          )}
        </div>
      )

    case 'video':
      return (
        <div className="space-y-2">
          {outputData.script && <p className="text-sm text-gray-300">{outputData.script.substring(0, 200)}...</p>}
          {outputData.scenes && (
            <div className="text-xs bg-white/5 p-2 rounded">
              <p className="font-semibold text-white mb-1">{outputData.scenes.length} Scenes</p>
              {outputData.scenes.slice(0, 2).map((scene: any, i: number) => (
                <p key={i} className="text-gray-400 text-xs">{scene.time}: {scene.action}</p>
              ))}
            </div>
          )}
        </div>
      )

    case 'json':
    default:
      return (
        <pre className="text-xs text-gray-300 bg-black/30 p-3 rounded overflow-x-auto max-h-64">
          {JSON.stringify(outputData, null, 2)}
        </pre>
      )
  }
}
