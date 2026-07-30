import Link from 'next/link'
import { FolderKanban, FileText, Newspaper, ArrowUpRight } from 'lucide-react'
import { requireSession } from '@/lib/auth/require-session'
import { resolveAccess } from '@/lib/auth/access'
import { createAdminClient } from '@/lib/supabase/admin'
import { Card, CardBody, Badge } from '@/components/ui'
import { cn } from '@/lib/cn'

export const metadata = {
  title: 'Dashboard — SF-CMS',
}

const ACTION_LABEL: Record<string, string> = {
  create: 'creó',
  update: 'actualizó',
  delete: 'borró',
  publish: 'publicó',
}

const RESOURCE_LABEL: Record<string, string> = {
  page: 'la página',
  post: 'el post',
  project: 'el proyecto',
}

async function getStats(projectIds: string[], isGlobalAdmin: boolean) {
  const client = createAdminClient()

  let pagesQuery = client.from('pages').select('id, status')
  let postsQuery = client.from('posts').select('id, status')
  let projectCount = projectIds.length
  if (isGlobalAdmin) {
    pagesQuery = pagesQuery as typeof pagesQuery
    postsQuery = postsQuery as typeof postsQuery
    const { count } = await client.from('projects').select('id', { count: 'exact', head: true })
    projectCount = count ?? 0
  } else {
    pagesQuery = pagesQuery.in('project_id', projectIds)
    postsQuery = postsQuery.in('project_id', projectIds)
  }

  const [pages, posts, activity] = await Promise.all([
    pagesQuery,
    postsQuery,
    client
      .from('audit_log')
      .select('action, resource_type, resource_id, new_values, created_at')
      .order('created_at', { ascending: false })
      .limit(8),
  ])

  const pagesRows = pages.data ?? []
  const postsRows = posts.data ?? []

  return {
    projectCount,
    pageCount: pagesRows.length,
    pagePublished: pagesRows.filter((p) => p.status === 'published').length,
    postCount: postsRows.length,
    postPublished: postsRows.filter((p) => p.status === 'published').length,
    activity: (activity.data ?? []) as {
      action: string
      resource_type: string
      resource_id: string
      new_values: { _actor?: string } | null
      created_at: string
    }[],
  }
}

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.round(diffMs / 60000)
  if (mins < 1) return 'ahora mismo'
  if (mins < 60) return `hace ${mins} min`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `hace ${hours} h`
  return `hace ${Math.round(hours / 24)} d`
}

export default async function AdminDashboard() {
  const user = await requireSession()
  const access = user ? await resolveAccess(user) : { isGlobalAdmin: false, projectIds: [] }
  const stats = await getStats(access.projectIds, access.isGlobalAdmin)

  const cards = [
    { href: '/admin/projects', label: 'Projects', value: stats.projectCount, sub: 'proyectos de cliente', icon: FolderKanban },
    { href: '/admin/pages', label: 'Pages', value: stats.pageCount, sub: `${stats.pagePublished} publicadas`, icon: FileText },
    { href: '/admin/posts', label: 'Posts', value: stats.postCount, sub: `${stats.postPublished} publicados`, icon: Newspaper },
  ]

  return (
    <div className="mx-auto max-w-6xl px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">Resumen del contenido que administras en SF-CMS.</p>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        {cards.map(({ href, label, value, sub, icon: Icon }) => (
          <Link key={href} href={href}>
            <Card className="group h-full transition-shadow hover:shadow-panel">
              <CardBody className="flex items-start justify-between">
                <div>
                  <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-accent-50 text-accent-600">
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="text-2xl font-semibold text-slate-900">{value}</p>
                  <p className="text-sm font-medium text-slate-700">{label}</p>
                  <p className="text-xs text-slate-500">{sub}</p>
                </div>
                <ArrowUpRight className="h-4 w-4 text-slate-300 transition-colors group-hover:text-accent-500" />
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-slate-900">Actividad reciente</h2>
        </div>
        <CardBody className="p-0">
          {stats.activity.length === 0 ? (
            <p className="px-5 py-6 text-sm text-slate-500">Sin actividad registrada todavía.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {stats.activity.map((entry, i) => (
                <li key={i} className="flex items-center justify-between px-5 py-3 text-sm">
                  <span className="text-slate-700">
                    <span className="font-medium text-slate-900">
                      {entry.new_values?._actor ?? 'Alguien'}
                    </span>{' '}
                    {ACTION_LABEL[entry.action] ?? entry.action}{' '}
                    {RESOURCE_LABEL[entry.resource_type] ?? entry.resource_type}
                    <Badge
                      tone={entry.action === 'publish' ? 'success' : entry.action === 'delete' ? 'danger' : 'neutral'}
                      className={cn('ml-2 align-middle')}
                    >
                      {entry.action}
                    </Badge>
                  </span>
                  <span className="shrink-0 text-xs text-slate-400">{timeAgo(entry.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  )
}
