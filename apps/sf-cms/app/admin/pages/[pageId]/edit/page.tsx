'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

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

      // Trigger revalidation
      await fetch('/api/revalidate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-revalidate-secret': process.env.NEXT_PUBLIC_REVALIDATE_SECRET || '',
        },
        body: JSON.stringify({
          type: 'page',
          slug: page.slug,
        }),
      })

      setError('Page saved successfully!')
      setTimeout(() => setError(''), 3000)
    } catch (err) {
      console.error('Error:', err)
      setError('Failed to save page')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  if (!page) {
    return <div className="text-center py-12 text-red-600">Page not found</div>
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900">Edit Page</h1>
      </div>

      {error && (
        <div
          className={`rounded-lg p-4 mb-6 ${
            error.includes('successfully')
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}
        >
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <div className="space-y-6">
          {/* Page title */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Page Title</label>
            <input
              type="text"
              value={page.title}
              onChange={(e) => setPage({ ...page, title: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">URL Slug</label>
            <input
              type="text"
              value={page.slug}
              onChange={(e) => setPage({ ...page, slug: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
              placeholder="e.g., homepage, about-us"
            />
          </div>

          {/* SEO fields */}
          <div className="border-t pt-6">
            <h3 className="font-semibold text-slate-900 mb-4">SEO Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  SEO Title (max 60 chars)
                </label>
                <input
                  type="text"
                  value={page.seo_title || ''}
                  onChange={(e) => setPage({ ...page, seo_title: e.target.value })}
                  placeholder="Enter SEO title"
                  maxLength={60}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Meta Description (120-160 chars)
                </label>
                <textarea
                  value={page.seo_description || ''}
                  onChange={(e) => setPage({ ...page, seo_description: e.target.value })}
                  placeholder="Enter meta description"
                  maxLength={160}
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
                />
              </div>
            </div>
          </div>

          {/* Sections (JSON editor) */}
          <div className="border-t pt-6">
            <h3 className="font-semibold text-slate-900 mb-4">Sections (JSON)</h3>
            <textarea
              value={JSON.stringify(page.sections_json, null, 2)}
              onChange={(e) => {
                try {
                  const sections = JSON.parse(e.target.value)
                  setPage({ ...page, sections_json: sections })
                } catch {
                  // Ignore parse errors while typing
                }
              }}
              rows={12}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 font-mono text-sm"
            />
            <p className="text-xs text-slate-500 mt-2">
              Edit section data in JSON format. Each section must have an id, type, and data object.
            </p>
          </div>

          {/* Status and actions */}
          <div className="border-t pt-6 flex justify-between items-center">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
              <select
                value={page.status}
                onChange={(e) => setPage({ ...page, status: e.target.value })}
                className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => router.back()}
                className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 transition"
              >
                {saving ? 'Saving...' : 'Save Page'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
