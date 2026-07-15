import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getPosts, getPostBySlug } from "@/lib/cms";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";

export const revalidate = 3600

export async function generateStaticParams() {
  const posts = await getPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return {};
  return {
    title: post.seo_title || post.title,
    description: post.seo_description || post.excerpt,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: post.seo_title || post.title,
      description: post.seo_description || post.excerpt,
      type: "article",
      ...(post.published_at ? { publishedTime: post.published_at } : {}),
      ...(post.author_name ? { authors: [post.author_name] } : {}),
    },
  };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const base = "https://www.salsaburgers.com";
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    url: `${base}/blog/${post.slug}`,
    datePublished: post.published_at,
    dateModified: post.published_at,
    author: { "@type": "Organization", name: post.author_name, url: base },
    publisher: {
      "@type": "Organization",
      name: "Salsa Burgers",
      logo: { "@type": "ImageObject", url: `${base}/images/salsa-logo.png` },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": `${base}/blog/${post.slug}` },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: base },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${base}/blog` },
      { "@type": "ListItem", position: 3, name: post.title, item: `${base}/blog/${post.slug}` },
    ],
  };

  return (
    <main className="bg-[#0a0a0a] min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <Nav />

      <article className="max-w-[760px] mx-auto px-6 sm:px-8 pt-32 pb-24">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-white/30 mb-10 font-medium">
          <Link href="/" className="hover:text-white/60 transition-colors">Home</Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-white/60 transition-colors">Blog</Link>
          <span>/</span>
          <span className="text-white/50 truncate max-w-[200px]">{post.title}</span>
        </nav>

        {/* Category */}
        {post.category && (
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#ff0000] border border-[#ff0000]/30 px-3 py-1 rounded-full bg-[#ff0000]/8 inline-block mb-6">
            {post.category}
          </span>
        )}

        {/* Title */}
        <h1
          className="font-black text-white uppercase tracking-tighter leading-[0.9] mb-6"
          style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
        >
          {post.title}
        </h1>

        {/* Meta */}
        <div className="flex items-center gap-4 text-white/30 text-sm border-b border-white/8 pb-8 mb-10">
          <span>{post.author_name}</span>
          <span>·</span>
          <span>{post.published_at ? formatDate(post.published_at) : ""}</span>
        </div>

        {/* Excerpt */}
        {post.excerpt && (
          <p className="text-white/60 text-lg leading-relaxed font-medium mb-10 border-l-2 border-[#ff0000] pl-5">
            {post.excerpt}
          </p>
        )}

        {/* Content */}
        <div
          className="prose-salsa"
          dangerouslySetInnerHTML={{ __html: post.content_html || "" }}
        />

        {/* Back */}
        <div className="mt-16 pt-8 border-t border-white/8">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-[#ff0000] font-black uppercase tracking-wider text-sm hover:-translate-x-1 transition-transform duration-200"
          >
            ← Back to blog
          </Link>
        </div>
      </article>

      <Footer />
    </main>
  );
}
