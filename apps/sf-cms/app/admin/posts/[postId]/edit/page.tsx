'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { RichTextEditor } from '@/components/editor/RichTextEditor'

interface Post {
  id: string
  title: string
  slug: string
  content_html: string
  excerpt?: string
  category?: string
  author_name?: string
  published_at?: string
  seo_title?: string
  seo_description?: string
  canonical_url?: string
  status: string
}

export default function PostEditorPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const postId = params.postId as string
  const projectId = searchParams.get('project') || ''

  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (postId && projectId) {
      fetchPost()
    }
  }, [postId, projectId])

  async function fetchPost() {
    try {
      const response = await fetch(`/api/admin/posts/${postId}`)
      if (!response.ok) throw new Error('Failed to fetch post')
      const { post } = await response.json()
      setPost(post)
    } catch (err) {
      console.error('Error:', err)
      setError('Failed to load post')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!post) return

    try {
      setSaving(true)
      setError('')

      const response = await fetch(`/api/admin/posts/${post.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: post.title,
          slug: post.slug,
          content_html: post.content_html,
          excerpt: post.excerpt,
          category: post.category,
          author_name: post.author_name,
          published_at: post.published_at,
          seo_title: post.seo_title,
          seo_description: post.seo_description,
          canonical_url: post.canonical_url,
          status: post.status,
        }),
      })

      if (!response.ok) throw new Error('Failed to save post')

      setError('✓ Post saved successfully!')
      setTimeout(() => setError(''), 3000)
    } catch (err) {
      console.error('Error:', err)
      setError('Failed to save post')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  if (!post) {
    return <div className="text-center py-12 text-red-600">Post not found</div>
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="text-slate-600 hover:text-slate-900 mb-4"
        >
          ← Back to Posts
        </button>
        <h1 className="text-4xl font-bold text-slate-900">{post.title}</h1>
        <p className="text-slate-600 mt-2">Slug: {post.slug}</p>
      </div>

      {error && (
        <div
          className={`mb-6 px-4 py-3 rounded-lg ${
            error.startsWith('✓')
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}
        >
          {error}
        </div>
      )}

      <form onSubmit={(e) => { e.preventDefault(); handleSave() }} className="space-y-8">
        {/* Basic fields */}
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-lg font-bold text-slate-900">Basic Info</h2>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Title</label>
            <input
              type="text"
              value={post.title}
              onChange={(e) => setPost({ ...post, title: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Slug</label>
            <input
              type="text"
              value={post.slug}
              onChange={(e) => setPost({ ...post, slug: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
            <select
              value={post.status}
              onChange={(e) => setPost({ ...post, status: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
            >
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="published">Published</option>
            </select>
            {post.status === 'scheduled' && (
              <p className="mt-1.5 text-xs text-amber-600">
                Se publicará automáticamente cuando llegue la fecha de &ldquo;Published date&rdquo; (revisado cada 15 min).
              </p>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-lg font-bold text-slate-900">Content</h2>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Content</label>
            <RichTextEditor
              value={post.content_html}
              onChange={(html) => setPost({ ...post, content_html: html })}
              placeholder="Write your content here..."
              projectId={projectId}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Excerpt</label>
            <textarea
              value={post.excerpt || ''}
              onChange={(e) => setPost({ ...post, excerpt: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
              placeholder="Short summary..."
            />
          </div>
        </div>

        {/* Metadata */}
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-lg font-bold text-slate-900">Metadata</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
              <input
                type="text"
                value={post.category || ''}
                onChange={(e) => setPost({ ...post, category: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
                placeholder="e.g., Tech"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Author</label>
              <input
                type="text"
                value={post.author_name || ''}
                onChange={(e) => setPost({ ...post, author_name: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
                placeholder="Author name"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Published Date</label>
            <input
              type="datetime-local"
              value={post.published_at ? new Date(post.published_at).toISOString().slice(0, 16) : ''}
              onChange={(e) => setPost({ ...post, published_at: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
            />
          </div>
        </div>

        {/* SEO */}
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-lg font-bold text-slate-900">SEO</h2>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">SEO Title</label>
            <input
              type="text"
              value={post.seo_title || ''}
              onChange={(e) => setPost({ ...post, seo_title: e.target.value })}
              maxLength={60}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
              placeholder="Page title (max 60 chars)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">SEO Description</label>
            <textarea
              value={post.seo_description || ''}
              onChange={(e) => setPost({ ...post, seo_description: e.target.value })}
              maxLength={160}
              rows={2}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
              placeholder="Meta description (max 160 chars)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Canonical URL</label>
            <input
              type="text"
              value={post.canonical_url || ''}
              onChange={(e) => setPost({ ...post, canonical_url: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
              placeholder="https://example.com/blog/post-slug (leave empty to self-canonicalize)"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 transition"
          >
            {saving ? 'Saving...' : 'Save Post'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 border border-slate-300 text-slate-900 rounded-lg hover:bg-slate-50 transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
