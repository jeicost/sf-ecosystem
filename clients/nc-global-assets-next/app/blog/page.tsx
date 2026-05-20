import type { Metadata } from 'next'
import Link from 'next/link'
import { getAllPosts } from '@/lib/posts'

const DOMAIN = 'https://www.ncglobalassets.com'

export const metadata: Metadata = {
  title: 'Blog — NC Global Assets',
  description: 'Read insights about brand launching in Thailand, market entry strategies, F&B operations, and Southeast Asia expansion from NC Global Assets.',
  alternates: { canonical: '/blog' },
  openGraph: {
    type: 'website',
    url: `${DOMAIN}/blog`,
    title: 'Blog — NC Global Assets',
    description: 'Insights about launching brands in Thailand and Southeast Asia',
  },
}

export default async function BlogPage() {
  const posts = await getAllPosts()

  return (
    <div className="blog-page">
      <header className="blog-header">
        <h1>Blog</h1>
        <p>Insights and strategies for launching your brand in Thailand.</p>
      </header>

      {posts.length === 0 ? (
        <p className="no-posts">No blog posts yet.</p>
      ) : (
        <div className="blog-grid">
          {posts.map((post) => (
            <article key={post.slug} className="blog-card">
              {post.coverUrl && (
                <figure className="blog-card-image">
                  <img src={post.coverUrl} alt={post.title} loading="lazy" />
                </figure>
              )}
              <div className="blog-card-content">
                {post.category && <span className="blog-category">{post.category}</span>}
                <h2>
                  <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                </h2>
                <p className="blog-excerpt">{post.excerpt}</p>
                <div className="blog-card-meta">
                  {post.author && <span>{post.author}</span>}
                  {post.date && <span>{new Date(post.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
                </div>
                <Link href={`/blog/${post.slug}`} className="read-more">
                  Read more →
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
