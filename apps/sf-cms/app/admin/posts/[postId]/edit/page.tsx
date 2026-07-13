'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

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
      const client = createClient()
      const { data, error: err } = await client
        .from('posts')
        .select('*')
        .eq('id', postId)
        .eq('project_id', projectId)
        .single()

      if (err) throw err
      setPost(data)
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

      const client = createClient()
      const { error: err } = await client
        .from('posts')
        .update({
          title: post.title,
          slug: post.slug,
          content_html: post.content_html,
          excerpt: post.excerpt,
          category: post.category,
          author_name: post.author_name,
          published_at: post.published_at,
          seo_title: post.seo_title,
          seo_description: post.seo_description,
          status: post.status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', post.id)

      if (err) throw err

      // Trigger revalidation
      await fetch('/api/revalidate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-revalidate-secret': process.env.NEXT_PUBLIC_REVALIDATE_SECRET || '',
        },
        body: JSON.stringify({
          type: 'post',
          slug: post.slug,
        }),
      })

      setError('Post saved successfully!')
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
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900">Edit Post</h1>
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
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Post Title</label>
            <input
              type="text"
              value={post.title}
              onChange={(e) => setPost({ ...post, title: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">URL Slug</label>
            <input
              type="text"
              value={post.slug}
              onChange={(e) => setPost({ ...post, slug: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
              placeholder="e.g., my-first-post"
            />
          </div>

          {/* Meta */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Author</label>
              <input
                type="text"
                value={post.author_name || ''}
                onChange={(e) => setPost({ ...post, author_name: e.target.value })}
                placeholder="Author name"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
              <input
                type="text"
                value={post.category || ''}
                onChange={(e) => setPost({ ...post, category: e.target.value })}
                placeholder="e.g., News, Tutorial"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
              />
            </div>
          </div>

          {/* Excerpt */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Excerpt</label>
            <textarea
              value={post.excerpt || ''}
              onChange={(e) => setPost({ ...post, excerpt: e.target.value })}
              placeholder="Brief summary of the post"
              rows={2}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Content (HTML)</label>
            <textarea
              value={post.content_html}
              onChange={(e) => setPost({ ...post, content_html: e.target.value })}
              rows={12}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 font-mono text-sm"
            />
          </div>

          {/* SEO */}
          <div className="border-t pt-6">
            <h3 className="font-semibold text-slate-900 mb-4">SEO Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  SEO Title (max 60 chars)
                </label>
                <input
                  type="text"
                  value={post.seo_title || ''}
                  onChange={(e) => setPost({ ...post, seo_title: e.target.value })}
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
                  value={post.seo_description || ''}
                  onChange={(e) => setPost({ ...post, seo_description: e.target.value })}
                  placeholder="Enter meta description"
                  maxLength={160}
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
                />
              </div>
            </div>
          </div>

          {/* Status and actions */}
          <div className="border-t pt-6 flex justify-between items-center">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
              <select
                value={post.status}
                onChange={(e) => setPost({ ...post, status: e.target.value })}
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
                {saving ? 'Saving...' : 'Save Post'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
