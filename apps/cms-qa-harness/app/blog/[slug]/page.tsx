import Link from 'next/link'
import { fetchPost, fetchPosts } from '@sf/cms-client'
import { notFound } from 'next/navigation'

export async function generateStaticParams() {
  // Only generate params if API is available
  try {
    const posts = await fetchPosts()
    return posts?.map((post) => ({ slug: post.slug })) || []
  } catch {
    // If API unavailable at build time, generate empty (will ISR later)
    return []
  }
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const post = await fetchPost(slug, {
    next: { revalidate: 60 },
  })

  if (!post) {
    notFound()
  }

  return (
    <main className="py-12 px-6">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/blog"
          className="text-slate-600 hover:text-slate-900 flex items-center gap-1 mb-8"
        >
          ← Back to Blog
        </Link>

        <article>
          <h1 className="text-4xl font-bold mb-2">{post.title}</h1>
          <p className="text-slate-600 mb-8">
            {post.published_at
              ? new Date(post.published_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })
              : 'Not published'}
          </p>

          {post.content_html ? (
            <div
              className="prose prose-slate max-w-none"
              dangerouslySetInnerHTML={{ __html: post.content_html }}
            />
          ) : (
            <p className="text-slate-600">No content available.</p>
          )}
        </article>
      </div>
    </main>
  )
}
