import { fetchPage, RenderSections } from '@sf/cms-client'
import { HeroBlock } from '@/components/HeroBlock'

const registry = {
  hero: HeroBlock,
}

export default async function HomePage() {
  let page: any = null
  try {
    page = await fetchPage('home', {
      next: { revalidate: 60 },
    })
  } catch (err) {
    console.error('Failed to fetch page:', err)
  }

  if (!page) {
    return (
      <div className="py-20 px-6 text-center">
        <h1 className="text-3xl font-bold mb-2">Page not found</h1>
        <p className="text-slate-600">
          No &quot;home&quot; page published in CMS. Configure CMS_API_URL when deploying.
        </p>
      </div>
    )
  }

  return (
    <main>
      <RenderSections
        sections={page.sections}
        registry={registry as any}
      />
    </main>
  )
}
