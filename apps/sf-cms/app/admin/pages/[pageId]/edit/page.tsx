'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { usePageChat } from '@/lib/hooks/usePageChat'
import { Send, Undo2 } from 'lucide-react'
import { ChatUploadWidget } from '@/components/media/ChatUploadWidget'
import { SectionsPreviewPanel } from '@/components/preview/SectionsPreviewPanel'

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

  // Chat edits are a working draft (the chat endpoint no longer persists);
  // sync them into page state so Save persists exactly what's previewed.
  useEffect(() => {
    if (currentSections && currentSections.length > 0) {
      setPage((p) => (p ? { ...p, sections_json: currentSections } : p))
    }
  }, [currentSections])

  async function fetchPage() {
    try {
      const response = await fetch(`/api/admin/pages/${pageId}`)
      if (!response.ok) throw new Error('Failed to fetch page')
      const { page } = await response.json()
      setPage(page)
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

      const response = await fetch(`/api/admin/pages/${page.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: page.title,
          slug: page.slug,
          seo_title: page.seo_title,
          seo_description: page.seo_description,
          sections_json: page.sections_json,
          status: page.status,
        }),
      })

      if (!response.ok) throw new Error('Failed to save page')

      setError('✓ Page saved successfully!')
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
    if (!page) return

    try {
      setError('')
      const response = await fetch(`/api/admin/pages/${pageId}/versions`)
      if (!response.ok) throw new Error('Failed to fetch versions')

      const { versions } = await response.json()
      if (!versions || versions.length === 0) {
        setError('No previous versions available')
        setTimeout(() => setError(''), 3000)
        return
      }

      const previousVersion = versions[0]
      setPage({
        ...page,
        sections_json: previousVersion.sections_json,
      })

      setError('✓ Restored to previous version. Click Save to persist.')
      setTimeout(() => setError(''), 5000)
    } catch (err) {
      console.error('Error:', err)
      setError('Failed to restore version')
      setTimeout(() => setError(''), 3000)
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

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat panel */}
        <div className="w-1/2 border-r border-slate-200 flex flex-col bg-white">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 && (
              <p className="text-slate-500 text-center py-12">
                Start by describing what you'd like on this page
              </p>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-lg ${
                    msg.role === 'user'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-900'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="text-slate-500 italic">Claude is thinking...</div>
            )}
          </div>

          {error && (
            <div
              className={`mx-4 mb-4 px-4 py-2 rounded-lg text-sm ${
                error.startsWith('✓')
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {error}
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-slate-200">
            <div className="flex gap-2">
              <ChatUploadWidget
                projectId={projectId}
                onUploaded={(url) =>
                  setUserInput((prev) => (prev ? `${prev} ${url}` : `Add this image: ${url}`))
                }
              />
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleChatSend()}
                placeholder="Describe changes..."
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
                disabled={chatLoading}
              />
              <button
                onClick={handleChatSend}
                disabled={chatLoading || !userInput.trim()}
                className="p-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 transition"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Sections panel */}
        <div className="w-1/2 overflow-y-auto p-6 bg-slate-50">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Sections</h2>
          <SectionsPreviewPanel
            sections={currentSections && currentSections.length > 0 ? currentSections : page.sections_json}
          />
        </div>
      </div>
    </div>
  )
}
