import Link from 'next/link'
import { fetchPosts } from '@sf/cms-client'

export default async function BlogListPage() {
  let posts: typeof undefined | any[] = undefined
  try {
    posts = await fetchPosts({
      next: { revalidate: 60 },
    })
  } catch (err) {
    console.error('Failed to fetch posts:', err)
  }

  return (
    <main className="py-12 px-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">Blog</h1>
        <p className="text-slate-600 mb-12">
          Latest posts from CMS QA Harness
        </p>

        {!posts ? (
          <div className="text-center py-12">
            <p className="text-slate-600">
              CMS API not available. Configure CMS_API_URL when deploying.
            </p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-600">
              No posts published yet.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <article
                key={post.id}
                className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition"
              >
                <Link href={`/blog/${post.slug}`}>
                  <h2 className="text-2xl font-bold text-slate-900 hover:text-slate-700 mb-2">
                    {post.title}
                  </h2>
                </Link>
                <p className="text-slate-600">
                  {post.published_at
                    ? new Date(post.published_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : 'Not published'}
                </p>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
