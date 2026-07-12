'use client'
import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, Users, Heart, Eye, Share2, Activity, Loader2 } from 'lucide-react'
import { clsx } from 'clsx'
import { createClient } from '@/lib/supabase'
import { useActiveClient } from '@/lib/client-context'
import { CLIENT_ID } from '@/lib/constants'

type Period = '7d' | '30d' | '90d'

const PERIODS: { id: Period; label: string }[] = [
  { id: '7d',  label: 'Last 7 days' },
  { id: '30d', label: 'Last 30 days' },
  { id: '90d', label: 'Last 90 days' },
]

const PLATFORM_COLORS: Record<string, string> = {
  Instagram: '#EC4899', TikTok: '#10B981', LinkedIn: '#3B82F6',
  Facebook: '#3B82F6', Twitter: '#06B6D4', YouTube: '#EF4444',
}

const AGENT_META: Record<string, { emoji: string; color: string; role: string }> = {
  'content-strategist': { emoji: '🔍', color: '#06B6D4', role: 'Content Strategist' },
  copywriter:           { emoji: '✍️', color: '#F59E0B', role: 'Copywriter' },
  orchestrator:         { emoji: '🎬', color: '#8B5CF6', role: 'Creative Director' },
  'social-media-manager':{ emoji: '📅', color: '#3B82F6', role: 'Social Media Manager' },
  'ads-manager':        { emoji: '📣', color: '#EF4444', role: 'Ads Manager' },
  'community-manager':  { emoji: '💬', color: '#F97316', role: 'Community Manager' },
  designer:             { emoji: '🎨', color: '#EC4899', role: 'Graphic Designer' },
  'video-editor':       { emoji: '🎞️', color: '#10B981', role: 'Video Editor' },
}

const AGENT_NAMES: Record<string, string> = {
  'content-strategist': 'Luna', copywriter: 'Alex', orchestrator: 'Marco',
  'social-media-manager': 'Noa', 'ads-manager': 'Riva',
  'community-manager': 'Sam', designer: 'Zoe', 'video-editor': 'Kai',
}

interface PostRow {
  id: string; platform: string; content: string | null
  status: string; created_at: string
}
interface ActivityRow {
  id: string; agent_name: string; agent_role: string; task_type: string
  status: string; output_summary: string | null; started_at: string
}

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'ahora'
  if (m < 60) return `${m}m`
  if (m < 1440) return `${Math.floor(m / 60)}h`
  return `${Math.floor(m / 1440)}d`
}

export default function PerformancePage() {
  const { activeClient } = useActiveClient()
  const clientId = activeClient?.id ?? CLIENT_ID

  const [period, setPeriod] = useState<Period>('7d')
  const [posts, setPosts] = useState<PostRow[]>([])
  const [activity, setActivity] = useState<ActivityRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const db = createClient()
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90
    const since = new Date(Date.now() - days * 86400000).toISOString()

    Promise.all([
      db.from('post_history')
        .select('id, platform, content, status, created_at')
        .eq('client_id', clientId)
        .gte('created_at', since)
        .order('created_at', { ascending: false }),
      db.from('agent_activity')
        .select('id, agent_name, agent_role, task_type, status, output_summary, started_at')
        .eq('client_id', clientId)
        .gte('started_at', since)
        .order('started_at', { ascending: false })
        .limit(50),
    ]).then(([p, a]) => {
      if (p.data) setPosts(p.data as PostRow[])
      if (a.data) setActivity(a.data as ActivityRow[])
      setLoading(false)
    })
  }, [period, clientId])

  const published  = posts.filter(p => p.status === 'published').length
  const draft      = posts.filter(p => p.status === 'draft').length
  const totalTasks = activity.length
  const completed  = activity.filter(a => a.status === 'completed').length

  const byPlatform = Object.entries(
    posts.reduce<Record<string, number>>((acc, p) => {
      acc[p.platform] = (acc[p.platform] ?? 0) + 1
      return acc
    }, {})
  ).sort((a, b) => b[1] - a[1])

  const maxPlatform = Math.max(...byPlatform.map(([, v]) => v), 1)

  const byAgent = Object.entries(
    activity.reduce<Record<string, number>>((acc, a) => {
      acc[a.agent_role] = (acc[a.agent_role] ?? 0) + 1
      return acc
    }, {})
  ).sort((a, b) => b[1] - a[1]).slice(0, 6)

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <Loader2 size={20} className="text-[#444] animate-spin" />
    </div>
  )

  return (
    <div className="px-8 py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">Performance</h1>
          <p className="text-[#555] mt-1 text-sm">Real MIRA team activity.</p>
        </div>
        <div className="flex bg-[#111] border border-[#1E1E1E] rounded-lg p-0.5">
          {PERIODS.map(p => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className={clsx(
                'px-3 py-1.5 rounded-md text-xs transition-all',
                period === p.id ? 'bg-white/10 text-white font-medium' : 'text-[#555] hover:text-white'
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Posts generated', value: posts.length, icon: Share2, color: 'text-violet-400' },
          { label: 'Published', value: published, icon: TrendingUp, color: 'text-emerald-400' },
          { label: 'Agent tasks', value: totalTasks, icon: Activity, color: 'text-amber-400' },
          { label: 'Completed', value: completed, icon: Heart, color: 'text-blue-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card px-5 py-4">
            <Icon size={16} className={clsx('mb-3', color)} />
            <p className="text-2xl font-semibold text-white">{value}</p>
            <p className="text-[11px] text-[#555] mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Posts by platform */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-medium text-white">Posts by platform</h2>
            <span className="text-xs text-[#555]">{posts.length} total</span>
          </div>
          {byPlatform.length === 0 ? (
            <p className="text-xs text-[#444] text-center py-6">No posts in this period.</p>
          ) : (
            <div className="space-y-4">
              {byPlatform.map(([platform, count]) => (
                <div key={platform}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-[#888]">{platform}</span>
                    <span className="text-white font-medium text-sm">{count}</span>
                  </div>
                  <div className="h-1.5 bg-[#1A1A1A] rounded-full">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${(count / maxPlatform) * 100}%`,
                        background: PLATFORM_COLORS[platform] ?? '#8B5CF6',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent posts */}
        <div className="card p-5">
          <h2 className="text-sm font-medium text-white mb-4">Latest generated posts</h2>
          {posts.length === 0 ? (
            <p className="text-xs text-[#444] text-center py-6">No posts in this period.<br />Send a brief to get started.</p>
          ) : (
            <div className="space-y-3">
              {posts.slice(0, 5).map(post => (
                <div key={post.id} className="flex items-start gap-3">
                  <div
                    className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5"
                    style={{ background: PLATFORM_COLORS[post.platform] ?? '#8B5CF6' }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[#ccc] leading-snug line-clamp-2">
                      {post.content?.slice(0, 100) ?? '(no content)'}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-[#555]">{post.platform}</span>
                      <span className={clsx('text-[10px] ml-auto', {
                        'text-emerald-400': post.status === 'published',
                        'text-amber-400':   post.status === 'draft',
                        'text-[#444]':      post.status === 'archived',
                      })}>
                        {post.status}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] text-[#444] shrink-0">{timeAgo(post.created_at)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Actividad de agentes */}
      <div className="card p-5 mb-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-medium text-white">Team activity</h2>
          <span className="text-xs text-[#555]">{completed}/{totalTasks} tasks completed</span>
        </div>

        {byAgent.length === 0 ? (
          <p className="text-xs text-[#444] text-center py-6">No activity in this period. Chat with an agent to get started.</p>
        ) : (
          <div className="grid grid-cols-3 gap-3 mb-5">
            {byAgent.map(([role, count]) => {
              const meta = AGENT_META[role] ?? { emoji: '🤖', color: '#8B5CF6', role }
              const name = AGENT_NAMES[role] ?? role
              return (
                <div key={role} className="bg-[#0A0A0A] rounded-xl p-4 border border-[#1A1A1A]">
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm"
                      style={{ background: `${meta.color}20` }}>
                      {meta.emoji}
                    </div>
                    <div>
                      <p className="text-xs text-white font-medium">{name}</p>
                      <p className="text-[10px] text-[#444]">{count} tareas</p>
                    </div>
                  </div>
                  <div className="h-1.5 bg-[#1A1A1A] rounded-full">
                    <div className="h-full rounded-full"
                      style={{ width: `${Math.min((count / (byAgent[0]?.[1] ?? 1)) * 100, 100)}%`, background: meta.color }} />
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Log de actividad reciente */}
        {activity.length > 0 && (
          <div className="space-y-1.5 border-t border-[#111] pt-4">
            {activity.slice(0, 8).map(a => {
              const meta = AGENT_META[a.agent_role] ?? { emoji: '🤖', color: '#555', role: a.agent_role }
              return (
                <div key={a.id} className="flex items-center gap-3 py-1.5 border-b border-[#0D0D0D] last:border-0">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs shrink-0"
                    style={{ background: `${meta.color}20` }}>
                    {meta.emoji}
                  </div>
                  <span className="text-xs text-[#888] w-10 shrink-0">{AGENT_NAMES[a.agent_role] ?? a.agent_role}</span>
                  <p className="text-[11px] text-[#555] flex-1 truncate">
                    {a.output_summary ?? a.task_type}
                  </p>
                  <span className={clsx('text-[10px] px-1.5 py-0.5 rounded-full shrink-0', {
                    'bg-emerald-500/10 text-emerald-400': a.status === 'completed',
                    'bg-amber-500/10  text-amber-400':   a.status === 'working',
                    'bg-red-500/10    text-red-400':     a.status === 'failed',
                  })}>
                    {a.status}
                  </span>
                  <span className="text-[10px] text-[#444] w-8 text-right shrink-0">{timeAgo(a.started_at)}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ROI card — siempre visible */}
      <div className="card p-5 bg-[#0A0A0A]">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] text-[#555] uppercase tracking-wider mb-1">Agency equivalent value</p>
            <p className="text-3xl font-semibold text-white">
              ${(posts.length * 80 + activity.filter(a => a.status === 'completed').length * 15).toLocaleString()}
            </p>
            <p className="text-xs text-[#555] mt-1">{posts.length} pieces · freelance market rate</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-[#555] uppercase tracking-wider mb-1">Powered by MIRA</p>
            <p className="text-3xl font-semibold text-emerald-400">${(completed * 0.012).toFixed(2)}</p>
            <p className="text-xs text-[#555] mt-1">in AI tokens this period</p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-[#1E1E1E] flex items-center justify-between">
          <p className="text-xs text-[#555]">Implied ROI</p>
          <p className="text-sm font-semibold text-emerald-400">
            {completed > 0
              ? `${Math.round((posts.length * 80) / Math.max(completed * 0.012, 0.01)).toLocaleString()}x`
              : '∞'}
          </p>
        </div>
      </div>
    </div>
  )
}
