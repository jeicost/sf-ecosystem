import { CALENDLY_URL } from '@/lib/constants'
import type { Metadata } from 'next'
import { getPostBySlug, getPostSlugs } from '@/lib/posts'

const DOMAIN = 'https://www.ncglobalassets.com'

export const revalidate = 3600

export async function generateStaticParams() {
  const slugs = await getPostSlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = await getPostBySlug(slug)

  if (!post) {
    return { title: 'Post not found' }
  }

  const canonical = `${DOMAIN}/blog/${slug}`

  return {
    title: `${post.seoTitle || post.title} — NC Global Assets`,
    description: post.seoDescription || post.excerpt,
    keywords: post.category,
    alternates: { canonical },
    openGraph: {
      type: 'article',
      url: canonical,
      title: post.seoTitle || post.title,
      description: post.seoDescription || post.excerpt,
      images: post.ogImage || post.coverUrl ? [{ url: post.ogImage || post.coverUrl }] : [],
      publishedTime: post.date,
      authors: [post.author],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.seoTitle || post.title,
      description: post.seoDescription || post.excerpt,
      images: post.ogImage || post.coverUrl ? [post.ogImage || post.coverUrl] : [],
    },
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getPostBySlug(slug)

  if (!post) {
    return <div>Post not found</div>
  }

  return (
    <article className="blog-post-page">
        <header className="blog-post-header">
          {post.category && <div className="blog-category">{post.category}</div>}
          <h1>{post.title}</h1>
          <div className="blog-meta">
            {post.author && <span>{post.author}</span>}
            {post.date && <span>{new Date(post.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>}
          </div>
        </header>

        {post.coverUrl && (
          <figure className="blog-post-cover">
            <img src={post.coverUrl} alt={post.title} />
          </figure>
        )}

        <div className="blog-post-body">
          {post.contentHtml ? (
            <div dangerouslySetInnerHTML={{ __html: post.contentHtml }} />
          ) : (
            <p>{post.excerpt}</p>
          )}
        </div>

        <div className="blog-post-cta">
          <p>Ready to enter Thailand?</p>
          <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
            Book a Call
          </a>
        </div>

        <nav className="blog-post-nav">
          <a href="/blog" className="btn btn-secondary">← Back to Blog</a>
        </nav>
      </article>
  )
}
