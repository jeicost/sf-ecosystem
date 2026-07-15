'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { usePageChat } from '@/lib/hooks/usePageChat'
import { Send, Undo2 } from 'lucide-react'

interface Section {
  id: string
  type: string
  data: Record<string, unknown>
}

interface Page {
  id: string
  title: string
  slug: string
  seo_title?: string
  seo_description?: string
  sections_json: Section[]
  status: string
}

export default function PageEditorPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const pageId = params.pageId as string
  const projectId = searchParams.get('project') || ''

  const [page, setPage] = useState<Page | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [userInput, setUserInput] = useState('')

  const { messages, isLoading: chatLoading, sendMessage, currentSections } = usePageChat({
    pageId,
    isNew: false,
  })

  useEffect(() => {
    if (pageId && projectId) {
      fetchPage()
    }
  }, [pageId, projectId])

  async function fetchPage() {
    try {
      const client = createClient()
      const { data, error: err } = await client
        .from('pages')
        .select('*')
        .eq('id', pageId)
        .eq('project_id', projectId)
        .single()

      if (err) throw err
      setPage(data)
    } catch (err) {
      console.error('Error:', err)
      setError('Failed to load page')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!page) return

    try {
      setSaving(true)
      setError('')

      const client = createClient()
      const { error: err } = await client
        .from('pages')
        .update({
          title: page.title,
          slug: page.slug,
          seo_title: page.seo_title,
          seo_description: page.seo_description,
          sections_json: page.sections_json,
          status: page.status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', page.id)

      if (err) throw err

      setError('Page saved successfully!')
      setTimeout(() => setError(''), 3000)
    } catch (err) {
      console.error('Error:', err)
      setError('Failed to save page')
    } finally {
      setSaving(false)
    }
  }

  async function handleChatSend() {
    if (!userInput.trim()) return
    setUserInput('')
    await sendMessage(userInput)
  }

  async function handleUndo() {
    // Restore from last page_version snapshot
    try {
      const client = createClient()
      const { data: versions } = await client
        .from('page_versions')
        .select('sections_json')
        .eq('page_id', pageId)
        .order('created_at', { ascending: false })
        .limit(1)

      if (versions && versions.length > 0) {
        const restoredSections = versions[0].sections_json
        setPage((p) => p ? { ...p, sections_json: restoredSections } : null)
        setError('Restored to previous version')
        setTimeout(() => setError(''), 3000)
      }
    } catch (err) {
      setError('Failed to restore version')
    }
  }

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  if (!page) {
    return <div className="text-center py-12 text-red-600">Page not found</div>
  }

  return (
    <div className="max-w-full h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <div className="px-6 py-4 bg-white border-b border-slate-200 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{page.title}</h1>
          <p className="text-sm text-slate-500">{page.slug}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleUndo}
            title="Restore to previous version"
            className="p-2 hover:bg-slate-100 rounded-lg transition"
          >
            <Undo2 size={18} />
          </button>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition"
          >
            Back
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 transition"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {error && (
        <div
          className={`mx-6 mt-4 rounded-lg p-3 text-sm ${
            error.includes('success') || error.includes('Restored')
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}
        >
          {error}
        </div>
      )}

      {/* Main content: Chat + Sections */}
      <div className="flex-1 flex overflow-hidden gap-6 p-6">
        {/* Left: Chat interface */}
        <div className="w-96 flex flex-col bg-white rounded-lg shadow overflow-hidden border border-slate-200">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
            <h2 className="font-semibold text-slate-900">Edit with Chat</h2>
            <p className="text-xs text-slate-600 mt-1">
              Describe what you want to change, add, or remove from the page
            </p>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="text-center text-slate-400 text-sm mt-8">
                <p>No messages yet</p>
                <p className="text-xs mt-1">Start by describing your changes...</p>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`text-sm ${
                    msg.role === 'user'
                      ? 'text-right'
                      : 'text-left'
                  }`}
                >
                  <div
                    className={`inline-block max-w-xs px-3 py-2 rounded-lg ${
                      msg.role === 'user'
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-900'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))
            )}
            {chatLoading && (
              <div className="text-sm text-slate-600 animate-pulse">
                ✨ Processing...
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-slate-200 bg-slate-50">
            <div className="flex gap-2">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !chatLoading) {
                    handleChatSend()
                  }
                }}
                placeholder="Add a hero section..."
                disabled={chatLoading}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 disabled:opacity-50"
              />
              <button
                onClick={handleChatSend}
                disabled={chatLoading || !userInput.trim()}
                className="p-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 transition"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Right: Sections Preview + Advanced */}
        <div className="flex-1 flex flex-col bg-white rounded-lg shadow overflow-hidden border border-slate-200">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
            <h2 className="font-semibold text-slate-900">
              Page Structure ({(currentSections.length || page.sections_json.length)} sections)
            </h2>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs px-2 py-1 border border-slate-300 rounded hover:bg-slate-100 transition"
            >
              {showAdvanced ? 'Hide' : 'Show'} Advanced
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {showAdvanced ? (
              // JSON editor
              <textarea
                value={JSON.stringify(currentSections.length > 0 ? currentSections : page.sections_json, null, 2)}
                onChange={(e) => {
                  try {
                    const sections = JSON.parse(e.target.value)
                    setPage((p) => p ? { ...p, sections_json: sections } : null)
                  } catch {
                    // Ignore parse errors while typing
                  }
                }}
                className="w-full h-full px-3 py-2 border border-slate-300 rounded font-mono text-xs focus:outline-none focus:ring-2 focus:ring-slate-500 resize-none"
              />
            ) : (
              // Section cards
              <div className="space-y-3">
                {(currentSections.length > 0 ? currentSections : page.sections_json).map((section) => (
                  <div key={section.id} className="border border-slate-300 rounded-lg p-3 bg-slate-50">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-slate-900 text-sm">{section.id}</p>
                        <p className="text-xs text-slate-600">{section.type}</p>
                      </div>
                    </div>
                    <div className="text-xs text-slate-700 space-y-1">
                      {Object.entries(section.data).slice(0, 3).map(([key, value]) => (
                        <div key={key}>
                          <span className="font-semibold">{key}:</span> {String(value).substring(0, 40)}
                          {String(value).length > 40 ? '...' : ''}
                        </div>
                      ))}
                      {Object.keys(section.data).length > 3 && (
                        <div className="text-slate-500">+{Object.keys(section.data).length - 3} more fields</div>
                      )}
                    </div>
                  </div>
                ))}
                {(currentSections.length === 0 && page.sections_json.length === 0) && (
                  <div className="text-center text-slate-400 py-8">
                    <p className="text-sm">No sections yet</p>
                    <p className="text-xs mt-1">Add sections using the chat</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
