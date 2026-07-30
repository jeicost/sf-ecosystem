'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { RichTextEditor } from '@/components/editor/RichTextEditor'
import { Button, Card, CardBody, Input, Textarea, Select, Label, HelpText, InlineMessage } from '@/components/ui'

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
    return <p className="py-12 text-center text-sm text-slate-500">Loading…</p>
  }

  if (!post) {
    return <p className="py-12 text-center text-sm text-red-600">Post not found</p>
  }

  return (
    <div className="mx-auto max-w-4xl px-8 py-8">
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Posts
        </button>
        <h1 className="text-2xl font-semibold text-slate-900">{post.title}</h1>
        <p className="mt-1 text-sm text-slate-500">Slug: {post.slug}</p>
      </div>

      {error && (
        <div className="mb-6">
          <InlineMessage kind={error.startsWith('✓') ? 'success' : 'error'}>{error}</InlineMessage>
        </div>
      )}

      <form onSubmit={(e) => { e.preventDefault(); handleSave() }} className="space-y-6">
        <Card>
          <CardBody className="space-y-4">
            <h2 className="text-base font-semibold text-slate-900">Basic Info</h2>

            <div>
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={post.title} onChange={(e) => setPost({ ...post, title: e.target.value })} />
            </div>

            <div>
              <Label htmlFor="slug">Slug</Label>
              <Input id="slug" value={post.slug} onChange={(e) => setPost({ ...post, slug: e.target.value })} />
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select id="status" value={post.status} onChange={(e) => setPost({ ...post, status: e.target.value })}>
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="published">Published</option>
              </Select>
              {post.status === 'scheduled' && (
                <HelpText tone="warning">
                  Se publicará automáticamente cuando llegue la fecha de &ldquo;Published date&rdquo; (revisado cada 15 min).
                </HelpText>
              )}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="space-y-4">
            <h2 className="text-base font-semibold text-slate-900">Content</h2>

            <div>
              <Label>Content</Label>
              <RichTextEditor
                value={post.content_html}
                onChange={(html) => setPost({ ...post, content_html: html })}
                placeholder="Write your content here..."
                projectId={projectId}
              />
            </div>

            <div>
              <Label htmlFor="excerpt">Excerpt</Label>
              <Textarea
                id="excerpt"
                value={post.excerpt || ''}
                onChange={(e) => setPost({ ...post, excerpt: e.target.value })}
                rows={3}
                placeholder="Short summary..."
              />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="space-y-4">
            <h2 className="text-base font-semibold text-slate-900">Metadata</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={post.category || ''}
                  onChange={(e) => setPost({ ...post, category: e.target.value })}
                  placeholder="e.g., Tech"
                />
              </div>

              <div>
                <Label htmlFor="author">Author</Label>
                <Input
                  id="author"
                  value={post.author_name || ''}
                  onChange={(e) => setPost({ ...post, author_name: e.target.value })}
                  placeholder="Author name"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="published-at">Published Date</Label>
              <Input
                id="published-at"
                type="datetime-local"
                value={post.published_at ? new Date(post.published_at).toISOString().slice(0, 16) : ''}
                onChange={(e) =>
                  setPost({ ...post, published_at: e.target.value ? new Date(e.target.value).toISOString() : undefined })
                }
              />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="space-y-4">
            <h2 className="text-base font-semibold text-slate-900">SEO</h2>

            <div>
              <Label htmlFor="seo-title">SEO Title</Label>
              <Input
                id="seo-title"
                value={post.seo_title || ''}
                onChange={(e) => setPost({ ...post, seo_title: e.target.value })}
                maxLength={60}
                placeholder="Page title (max 60 chars)"
              />
            </div>

            <div>
              <Label htmlFor="seo-description">SEO Description</Label>
              <Textarea
                id="seo-description"
                value={post.seo_description || ''}
                onChange={(e) => setPost({ ...post, seo_description: e.target.value })}
                maxLength={160}
                rows={2}
                placeholder="Meta description (max 160 chars)"
              />
            </div>

            <div>
              <Label htmlFor="canonical">Canonical URL</Label>
              <Input
                id="canonical"
                value={post.canonical_url || ''}
                onChange={(e) => setPost({ ...post, canonical_url: e.target.value })}
                placeholder="https://example.com/blog/post-slug (leave empty to self-canonicalize)"
              />
            </div>
          </CardBody>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" disabled={saving} className="flex-1">
            {saving ? 'Saving…' : 'Save Post'}
          </Button>
          <Button type="button" variant="secondary" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
