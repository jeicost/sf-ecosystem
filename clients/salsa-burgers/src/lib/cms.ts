import postsData from "../../content/posts.json";

export interface CmsPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  cover_url: string;
  content_html: string;
  category: string;
  author_name: string;
  published_at: string;
  seo_title: string;
  seo_description: string;
}

type RawPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverUrl: string;
  contentHtml: string;
  category: string;
  author: string;
  date: string;
  seoTitle: string;
  seoDescription: string;
};

function normalize(p: RawPost): CmsPost {
  return {
    id: p.id,
    title: p.title,
    slug: p.slug,
    excerpt: p.excerpt ?? "",
    cover_url: p.coverUrl ?? "",
    content_html: p.contentHtml ?? "",
    category: p.category ?? "",
    author_name: p.author ?? "Salsa Burgers",
    published_at: p.date ? `${p.date}T00:00:00Z` : "",
    seo_title: p.seoTitle || p.title,
    seo_description: p.seoDescription ?? "",
  };
}

export async function getAllPosts(): Promise<CmsPost[]> {
  return (postsData as RawPost[]).map(normalize);
}

export async function getPostBySlug(slug: string): Promise<CmsPost | null> {
  const post = (postsData as RawPost[]).find((p) => p.slug === slug);
  return post ? normalize(post) : null;
}
