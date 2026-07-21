'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { usePageChat } from '@/lib/hooks/usePageChat'
import { Send, History } from 'lucide-react'
import { ChatUploadWidget } from '@/components/media/ChatUploadWidget'
import { SectionsPreviewPanel } from '@/components/preview/SectionsPreviewPanel'
import { PIXEL_FIELDS, cleanPixels, type PagePixels } from '@/lib/pixels'

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
  canonical_url?: string
  sections_json: Section[]
  status: string
  pixels?: PagePixels
}

interface PageVersion {
  id: string
  version_number: number | null
  created_by: string | null
  created_at: string
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
  const [versions, setVersions] = useState<PageVersion[]>([])
  const [sidebarTab, setSidebarTab] = useState<'settings' | 'pixels' | 'history'>('settings')
  const [restoringId, setRestoringId] = useState<string | null>(null)

  const { messages, isLoading: chatLoading, sendMessage, currentSections } = usePageChat({
    pageId,
    isNew: false,
  })

  const fetchVersions = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/pages/${pageId}/versions`)
      if (!response.ok) return
      const { versions } = await response.json()
      setVersions(versions ?? [])
    } catch {
      // history is non-critical; leave the previous list
    }
  }, [pageId])

  useEffect(() => {
    if (pageId && projectId) {
      fetchPage()
      fetchVersions()
    }
  }, [pageId, projectId, fetchVersions])

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

  function flash(msg: string, ms = 3000) {
    setError(msg)
    setTimeout(() => setError(''), ms)
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
          canonical_url: page.canonical_url,
          sections_json: page.sections_json,
          status: page.status,
          pixels: cleanPixels(page.pixels ?? {}),
        }),
      })

      if (!response.ok) throw new Error('Failed to save page')

      flash('✓ Page saved successfully!')
      fetchVersions()
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

  async function handleRestore(versionId: string) {
    if (!page) return
    try {
      setRestoringId(versionId)
      setError('')
      const response = await fetch(
        `/api/admin/pages/${pageId}/versions/${versionId}/restore`,
        { method: 'POST' }
      )
      if (!response.ok) throw new Error('Failed to restore version')
      const { page: restored } = await response.json()
      setPage(restored)
      fetchVersions()
      flash('✓ Version restored (previous state was snapshotted).', 5000)
    } catch (err) {
      console.error('Error:', err)
      flash('Failed to restore version')
    } finally {
      setRestoringId(null)
    }
  }

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  if (!page) {
    return <div className="text-center py-12 text-red-600">Page not found</div>
  }

  const seoTitleLen = (page.seo_title ?? '').length
  const seoDescLen = (page.seo_description ?? '').length

  return (
    <div className="max-w-full h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <div className="px-6 py-4 bg-white border-b border-slate-200 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{page.title}</h1>
          <p className="text-sm text-slate-500">
            /{page.slug}
            <span
              className={`ml-2 inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                page.status === 'published'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-amber-100 text-amber-700'
              }`}
            >
              {page.status}
            </span>
          </p>
        </div>
        <div className="flex gap-2">
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
        <div className="w-[36%] border-r border-slate-200 flex flex-col bg-white">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 && (
              <p className="text-slate-500 text-center py-12">
                Start by describing what you&apos;d like on this page
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
                aria-label="Send instruction"
                className="p-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 transition"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Sections panel */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Sections</h2>
          <SectionsPreviewPanel
            sections={currentSections && currentSections.length > 0 ? currentSections : page.sections_json}
          />
        </div>

        {/* Settings / History sidebar */}
        <div className="w-80 border-l border-slate-200 bg-white flex flex-col overflow-hidden">
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setSidebarTab('settings')}
              className={`flex-1 px-3 py-3 text-sm font-semibold transition ${
                sidebarTab === 'settings'
                  ? 'text-slate-900 border-b-2 border-slate-900'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Settings
            </button>
            <button
              onClick={() => setSidebarTab('pixels')}
              className={`flex-1 px-3 py-3 text-sm font-semibold transition ${
                sidebarTab === 'pixels'
                  ? 'text-slate-900 border-b-2 border-slate-900'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Pixels
            </button>
            <button
              onClick={() => setSidebarTab('history')}
              className={`flex-1 px-3 py-3 text-sm font-semibold transition flex items-center justify-center gap-1 ${
                sidebarTab === 'history'
                  ? 'text-slate-900 border-b-2 border-slate-900'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <History size={14} /> History
            </button>
          </div>

          {sidebarTab === 'settings' ? (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div>
                <label htmlFor="pg-title" className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
                  Title
                </label>
                <input
                  id="pg-title"
                  type="text"
                  value={page.title}
                  onChange={(e) => setPage({ ...page, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                />
              </div>

              <div>
                <label htmlFor="pg-slug" className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
                  Slug
                </label>
                <input
                  id="pg-slug"
                  type="text"
                  value={page.slug}
                  onChange={(e) =>
                    setPage({ ...page, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-slate-500"
                />
                <p className="mt-1 text-xs text-amber-600">
                  Changing the slug of a published page breaks its old URL (no redirects yet).
                </p>
              </div>

              <div>
                <label htmlFor="pg-status" className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
                  Status
                </label>
                <select
                  id="pg-status"
                  value={page.status}
                  onChange={(e) => setPage({ ...page, status: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-500"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
                <p className="mt-1 text-xs text-slate-500">
                  Saving as Published triggers the project&apos;s deploy hook.
                </p>
              </div>

              <hr className="border-slate-200" />

              <div>
                <label htmlFor="pg-seo-title" className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
                  SEO title
                  <span className={`ml-2 font-normal ${seoTitleLen > 60 ? 'text-red-600' : 'text-slate-400'}`}>
                    {seoTitleLen}/60
                  </span>
                </label>
                <input
                  id="pg-seo-title"
                  type="text"
                  value={page.seo_title ?? ''}
                  onChange={(e) => setPage({ ...page, seo_title: e.target.value })}
                  placeholder={page.title}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                />
              </div>

              <div>
                <label htmlFor="pg-seo-desc" className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
                  SEO description
                  <span className={`ml-2 font-normal ${seoDescLen > 160 ? 'text-red-600' : 'text-slate-400'}`}>
                    {seoDescLen}/160
                  </span>
                </label>
                <textarea
                  id="pg-seo-desc"
                  value={page.seo_description ?? ''}
                  onChange={(e) => setPage({ ...page, seo_description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                />
              </div>

              <div>
                <label htmlFor="pg-canonical" className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
                  Canonical URL
                </label>
                <input
                  id="pg-canonical"
                  type="url"
                  value={page.canonical_url ?? ''}
                  onChange={(e) => setPage({ ...page, canonical_url: e.target.value })}
                  placeholder="https://…"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-slate-500"
                />
              </div>

              <p className="text-xs text-slate-400">
                Changes here are applied when you click Save.
              </p>
            </div>
          ) : sidebarTab === 'pixels' ? (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <p className="text-xs text-slate-500 leading-relaxed">
                Tracking tags for <span className="font-semibold">this page only</span>, layered on
                top of the site-wide GA/GTM. Leave blank to inherit just the site defaults.
              </p>
              {PIXEL_FIELDS.map((field) => (
                <div key={field.key}>
                  <label
                    htmlFor={`px-${field.key}`}
                    className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1"
                  >
                    {field.label}
                  </label>
                  {field.multiline ? (
                    <textarea
                      id={`px-${field.key}`}
                      value={page.pixels?.[field.key] ?? ''}
                      onChange={(e) =>
                        setPage({ ...page, pixels: { ...page.pixels, [field.key]: e.target.value } })
                      }
                      placeholder={field.placeholder}
                      rows={3}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-slate-500"
                    />
                  ) : (
                    <input
                      id={`px-${field.key}`}
                      type="text"
                      value={page.pixels?.[field.key] ?? ''}
                      onChange={(e) =>
                        setPage({ ...page, pixels: { ...page.pixels, [field.key]: e.target.value } })
                      }
                      placeholder={field.placeholder}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-slate-500"
                    />
                  )}
                  {field.help && <p className="mt-1 text-xs text-slate-400">{field.help}</p>}
                </div>
              ))}
              <p className="text-xs text-amber-600">
                Pixels take effect on the next deploy of the site (build-time bake), not instantly.
              </p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {versions.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-8">
                  No versions yet. A snapshot is taken every time sections change on Save.
                </p>
              )}
              {versions.map((v, i) => (
                <div
                  key={v.id}
                  className="border border-slate-200 rounded-lg p-3 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800">
                      v{v.version_number ?? versions.length - i}
                      {i === 0 && <span className="ml-1.5 text-xs font-normal text-slate-400">latest</span>}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {v.created_by ?? 'unknown'} · {new Date(v.created_at).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRestore(v.id)}
                    disabled={restoringId !== null}
                    className="shrink-0 px-3 py-1.5 text-xs font-semibold border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition"
                  >
                    {restoringId === v.id ? 'Restoring…' : 'Restore'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
