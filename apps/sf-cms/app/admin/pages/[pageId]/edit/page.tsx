'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { usePageChat } from '@/lib/hooks/usePageChat'
import { Send, History, ArrowLeft, Eye } from 'lucide-react'
import { ChatUploadWidget } from '@/components/media/ChatUploadWidget'
import { SectionsEditor } from '@/components/editor/SectionsEditor'
import { PIXEL_FIELDS, cleanPixels, type PagePixels } from '@/lib/pixels'
import { Button, Badge, Tabs, Input, Textarea, Select, Label, HelpText, InlineMessage } from '@/components/ui'
import { cn } from '@/lib/cn'

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
  const [projectPreview, setProjectPreview] = useState<{
    preview_secret: string | null
    preview_base_url: string | null
  } | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)

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

  const fetchProjectPreview = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/projects/${projectId}`)
      if (!response.ok) return
      const { project } = await response.json()
      setProjectPreview({
        preview_secret: project.preview_secret ?? null,
        preview_base_url: project.preview_base_url ?? null,
      })
    } catch {
      // preview is a nice-to-have; leave the button disabled-ish if this fails
    }
  }, [projectId])

  async function handlePreview() {
    if (!page || !projectPreview) return
    setPreviewLoading(true)
    try {
      let baseUrl = projectPreview.preview_base_url
      if (!baseUrl) {
        const entered = window.prompt(
          'Todavía no hay una URL guardada para previsualizar este sitio.\n\nPega la URL del sitio (ej. https://mi-sitio.vercel.app):'
        )
        if (!entered) return
        baseUrl = entered.replace(/\/$/, '')
        await fetch(`/api/admin/projects/${projectId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ preview_base_url: baseUrl }),
        })
        setProjectPreview((p) => (p ? { ...p, preview_base_url: baseUrl } : p))
      }
      const url = `${baseUrl}/api/draft?secret=${encodeURIComponent(projectPreview.preview_secret ?? '')}&slug=${encodeURIComponent(page.slug)}`
      window.open(url, '_blank', 'noopener,noreferrer')
    } finally {
      setPreviewLoading(false)
    }
  }

  useEffect(() => {
    if (pageId && projectId) {
      fetchPage()
      fetchVersions()
      fetchProjectPreview()
    }
  }, [pageId, projectId, fetchVersions, fetchProjectPreview])

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
    return <p className="py-12 text-center text-sm text-slate-500">Loading…</p>
  }

  if (!page) {
    return <p className="py-12 text-center text-sm text-red-600">Page not found</p>
  }

  const seoTitleLen = (page.seo_title ?? '').length
  const seoDescLen = (page.seo_description ?? '').length
  const flashIsSuccess = error.startsWith('✓')

  return (
    <div className="flex h-screen max-w-full flex-col bg-slate-50">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">{page.title}</h1>
          <p className="mt-0.5 flex items-center gap-2 text-sm text-slate-500">
            /{page.slug}
            <Badge tone={page.status === 'published' ? 'success' : 'warning'}>{page.status}</Badge>
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Button
            variant="secondary"
            onClick={handlePreview}
            disabled={previewLoading}
            title={
              projectPreview && !projectPreview.preview_base_url
                ? 'Configura la URL del sitio en Ajustes del proyecto para poder previsualizar'
                : 'Ver esta página real, incluyendo cambios sin publicar'
            }
          >
            <Eye className="h-4 w-4" />
            {previewLoading ? 'Cargando…' : 'Vista previa'}
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Chat panel */}
        <div className="flex w-[36%] flex-col border-r border-slate-200 bg-white">
          <div className="flex-1 space-y-4 overflow-y-auto p-6">
            {messages.length === 0 && (
              <p className="py-12 text-center text-sm text-slate-500">
                Start by describing what you&apos;d like on this page
              </p>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                <div
                  className={cn(
                    'max-w-[85%] rounded-2xl px-4 py-2 text-sm',
                    msg.role === 'user'
                      ? 'rounded-br-sm bg-accent-600 text-white'
                      : 'rounded-bl-sm bg-slate-100 text-slate-900'
                  )}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {chatLoading && <p className="text-sm italic text-slate-500">Claude is thinking…</p>}
          </div>

          {error && (
            <div className="mx-4 mb-4">
              <InlineMessage kind={flashIsSuccess ? 'success' : 'error'}>{error}</InlineMessage>
            </div>
          )}

          {/* Input */}
          <div className="border-t border-slate-200 p-4">
            <div className="flex gap-2">
              <ChatUploadWidget
                projectId={projectId}
                onUploaded={(url) =>
                  setUserInput((prev) => (prev ? `${prev} ${url}` : `Add this image: ${url}`))
                }
              />
              <Input
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleChatSend()}
                placeholder="Describe changes..."
                disabled={chatLoading}
                className="flex-1"
              />
              <Button
                onClick={handleChatSend}
                disabled={chatLoading || !userInput.trim()}
                aria-label="Send instruction"
                className="px-3"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Sections panel — editable by field */}
        <div className="flex-1 overflow-y-auto bg-slate-50 p-6">
          <SectionsEditor
            sections={page.sections_json ?? []}
            onChange={(next) => setPage({ ...page, sections_json: next as Section[] })}
          />
        </div>

        {/* Settings / Pixels / History sidebar */}
        <div className="flex w-80 flex-col overflow-hidden border-l border-slate-200 bg-white">
          <Tabs
            value={sidebarTab}
            onChange={setSidebarTab}
            items={[
              { value: 'settings', label: 'Settings' },
              { value: 'pixels', label: 'Pixels' },
              { value: 'history', label: 'History' },
            ]}
          />

          {sidebarTab === 'settings' ? (
            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              <div>
                <Label htmlFor="pg-title">Title</Label>
                <Input id="pg-title" value={page.title} onChange={(e) => setPage({ ...page, title: e.target.value })} />
              </div>

              <div>
                <Label htmlFor="pg-slug">Slug</Label>
                <Input
                  id="pg-slug"
                  value={page.slug}
                  onChange={(e) => setPage({ ...page, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                  className="font-mono"
                />
                <HelpText tone="warning">
                  Changing the slug of a published page breaks its old URL (no redirects yet).
                </HelpText>
              </div>

              <div>
                <Label htmlFor="pg-status">Status</Label>
                <Select id="pg-status" value={page.status} onChange={(e) => setPage({ ...page, status: e.target.value })}>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </Select>
                <HelpText>Saving as Published triggers the project&apos;s deploy hook.</HelpText>
              </div>

              <hr className="border-slate-200" />

              <div>
                <Label htmlFor="pg-seo-title">
                  SEO title{' '}
                  <span className={cn('font-normal normal-case tracking-normal', seoTitleLen > 60 ? 'text-red-600' : 'text-slate-400')}>
                    {seoTitleLen}/60
                  </span>
                </Label>
                <Input
                  id="pg-seo-title"
                  value={page.seo_title ?? ''}
                  onChange={(e) => setPage({ ...page, seo_title: e.target.value })}
                  placeholder={page.title}
                />
              </div>

              <div>
                <Label htmlFor="pg-seo-desc">
                  SEO description{' '}
                  <span className={cn('font-normal normal-case tracking-normal', seoDescLen > 160 ? 'text-red-600' : 'text-slate-400')}>
                    {seoDescLen}/160
                  </span>
                </Label>
                <Textarea
                  id="pg-seo-desc"
                  value={page.seo_description ?? ''}
                  onChange={(e) => setPage({ ...page, seo_description: e.target.value })}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="pg-canonical">Canonical URL</Label>
                <Input
                  id="pg-canonical"
                  type="url"
                  value={page.canonical_url ?? ''}
                  onChange={(e) => setPage({ ...page, canonical_url: e.target.value })}
                  placeholder="https://…"
                  className="font-mono"
                />
              </div>

              <p className="text-xs text-slate-400">Changes here are applied when you click Save.</p>
            </div>
          ) : sidebarTab === 'pixels' ? (
            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              <p className="text-xs leading-relaxed text-slate-500">
                Tracking tags for <span className="font-semibold">this page only</span>, layered on top of
                the site-wide GA/GTM. Leave blank to inherit just the site defaults.
              </p>
              {PIXEL_FIELDS.map((field) => (
                <div key={field.key}>
                  <Label htmlFor={`px-${field.key}`}>{field.label}</Label>
                  {field.multiline ? (
                    <Textarea
                      id={`px-${field.key}`}
                      value={page.pixels?.[field.key] ?? ''}
                      onChange={(e) => setPage({ ...page, pixels: { ...page.pixels, [field.key]: e.target.value } })}
                      placeholder={field.placeholder}
                      rows={3}
                      className="font-mono"
                    />
                  ) : (
                    <Input
                      id={`px-${field.key}`}
                      value={page.pixels?.[field.key] ?? ''}
                      onChange={(e) => setPage({ ...page, pixels: { ...page.pixels, [field.key]: e.target.value } })}
                      placeholder={field.placeholder}
                      className="font-mono"
                    />
                  )}
                  {field.help && <HelpText>{field.help}</HelpText>}
                </div>
              ))}
              <HelpText tone="warning">
                Pixels take effect on the next deploy of the site (build-time bake), not instantly.
              </HelpText>
            </div>
          ) : (
            <div className="flex-1 space-y-2 overflow-y-auto p-4">
              {versions.length === 0 && (
                <p className="py-8 text-center text-sm text-slate-500">
                  No versions yet. A snapshot is taken every time sections change on Save.
                </p>
              )}
              {versions.map((v, i) => (
                <div
                  key={v.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 p-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800">
                      v{v.version_number ?? versions.length - i}
                      {i === 0 && <span className="ml-1.5 text-xs font-normal text-slate-400">latest</span>}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {v.created_by ?? 'unknown'} · {new Date(v.created_at).toLocaleString()}
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleRestore(v.id)}
                    disabled={restoringId !== null}
                    className="shrink-0"
                  >
                    {restoringId === v.id ? 'Restoring…' : 'Restore'}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
