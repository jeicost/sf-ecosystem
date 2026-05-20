import fs from 'fs'
import path from 'path'

export interface Post {
  id: string
  title: string
  slug: string
  excerpt: string
  coverUrl: string
  contentHtml: string
  category: string
  author: string
  date: string
  seoTitle: string
  seoDescription: string
  ogImage: string
}

const postsPath = path.join(process.cwd(), 'src/content/posts.json')

let postsCache: Post[] | null = null

function loadPosts(): Post[] {
  if (postsCache) return postsCache

  try {
    const fileContent = fs.readFileSync(postsPath, 'utf-8')
    postsCache = JSON.parse(fileContent)
  } catch (error) {
    console.error('Failed to load posts.json:', error)
    postsCache = []
  }

  return postsCache || []
}

export async function getAllPosts(): Promise<Post[]> {
  return loadPosts().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export async function getPostBySlug(slug: string): Promise<Post | undefined> {
  const posts = loadPosts()
  return posts.find((post) => post.slug === slug)
}

export async function getPostSlugs(): Promise<string[]> {
  const posts = loadPosts()
  return posts.map((post) => post.slug)
}
