'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Play, Lock, X, Clock, BookOpen } from 'lucide-react'
import { getUser, canAccessSection, type MiraUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase'

// ─── Video library ──────────────────────────────────────────────────────────
// Replace 'placeholder' with real YouTube video IDs when recorded.
// Thumbnail auto-resolves from: img.youtube.com/vi/{id}/hqdefault.jpg

const LIBRARY: Record<string, {
  color: string; icon: string; label: string
  videos: { id: string; title: string; agent: string; emoji: string; duration: string; level: 'Intro' | 'Deep dive' }[]
}> = {
  marketing: {
    color: '#8B5CF6', icon: '🎯', label: 'Marketing',
    videos: [
      { id: 'placeholder', title: 'Welcome to your Marketing team', agent: 'Marco', emoji: '🎬', duration: '3:45', level: 'Intro' },
      { id: 'placeholder', title: 'How to write your first brief', agent: 'Marco', emoji: '🎬', duration: '5:12', level: 'Intro' },
      { id: 'placeholder', title: 'Getting copy in your exact brand voice', agent: 'Alex', emoji: '✍️', duration: '4:30', level: 'Intro' },
      { id: 'placeholder', title: 'Managing your editorial calendar', agent: 'Noa', emoji: '📅', duration: '6:20', level: 'Deep dive' },
      { id: 'placeholder', title: 'Approving and editing content', agent: 'Noa', emoji: '📅', duration: '3:55', level: 'Intro' },
      { id: 'placeholder', title: 'Competitor ad analysis with Riva', agent: 'Riva', emoji: '📣', duration: '7:10', level: 'Deep dive' },
    ],
  },
  comercial: {
    color: '#EF4444', icon: '🚀', label: 'Sales',
    videos: [
      { id: 'placeholder', title: 'Finding your first 20 qualified leads', agent: 'Rex', emoji: '🔍', duration: '5:30', level: 'Intro' },
      { id: 'placeholder', title: 'Setting up your ICP with Vera', agent: 'Vera', emoji: '🎯', duration: '4:15', level: 'Intro' },
      { id: 'placeholder', title: 'Writing icebreakers that get replies', agent: 'Finn', emoji: '✍️', duration: '6:00', level: 'Deep dive' },
      { id: 'placeholder', title: 'Qualifying replies and scoring BANT', agent: 'Quinn', emoji: '💬', duration: '4:50', level: 'Intro' },
      { id: 'placeholder', title: 'Generating your first proposal', agent: 'Nova', emoji: '📄', duration: '5:25', level: 'Deep dive' },
    ],
  },
  estrategia: {
    color: '#6366F1', icon: '🔭', label: 'Strategy',
    videos: [
      { id: 'placeholder', title: 'Your 90-day plan in 10 minutes', agent: 'Strategos', emoji: '🔭', duration: '10:30', level: 'Intro' },
      { id: 'placeholder', title: 'Business diagnosis deep dive', agent: 'Strategos', emoji: '🔭', duration: '8:15', level: 'Deep dive' },
      { id: 'placeholder', title: 'Mapping your competitive landscape', agent: 'Atlas', emoji: '🗺️', duration: '6:45', level: 'Intro' },
      { id: 'placeholder', title: 'Auditing your business model', agent: 'Blueprint', emoji: '📐', duration: '9:00', level: 'Deep dive' },
    ],
  },
  innovacion: {
    color: '#F97316', icon: '💡', label: 'Innovation',
    videos: [
      { id: 'placeholder', title: 'Your weekly trend briefing with Radar', agent: 'Radar', emoji: '📡', duration: '4:00', level: 'Intro' },
      { id: 'placeholder', title: 'Running a Design Sprint with Spark', agent: 'Spark', emoji: '✨', duration: '11:20', level: 'Deep dive' },
      { id: 'placeholder', title: 'Mapping your innovation portfolio H1/H2/H3', agent: 'Venture', emoji: '🚀', duration: '7:30', level: 'Deep dive' },
      { id: 'placeholder', title: 'Building future scenarios with Oracle', agent: 'Oracle', emoji: '🔮', duration: '8:50', level: 'Deep dive' },
    ],
  },
  admin: {
    color: '#10B981', icon: '⚙️', label: 'Admin',
    videos: [
      { id: 'placeholder', title: 'Setting up your daily 08:30 briefing', agent: 'Herald', emoji: '📰', duration: '3:20', level: 'Intro' },
      { id: 'placeholder', title: 'Billing and P&L with Ledger', agent: 'Ledger', emoji: '💳', duration: '6:10', level: 'Intro' },
      { id: 'placeholder', title: 'Monitoring system health with Pulse', agent: 'Pulse', emoji: '💓', duration: '4:45', level: 'Deep dive' },
      { id: 'placeholder', title: 'Client onboarding workflow', agent: 'Onboard', emoji: '🤝', duration: '5:35', level: 'Intro' },
    ],
  },
  finanzas: {
    color: '#F59E0B', icon: '💰', label: 'Finance',
    videos: [
      { id: 'placeholder', title: 'Personal financial diagnosis with Midas', agent: 'Midas', emoji: '💎', duration: '7:00', level: 'Intro' },
      { id: 'placeholder', title: 'Building your ETF portfolio with Quant', agent: 'Quant', emoji: '📈', duration: '8:40', level: 'Deep dive' },
      { id: 'placeholder', title: 'Tax optimization strategies with Fiscal', agent: 'Fiscal', emoji: '📋', duration: '9:15', level: 'Deep dive' },
      { id: 'placeholder', title: 'Calculate your FI number with Harbor', agent: 'Harbor', emoji: '⚓', duration: '6:30', level: 'Intro' },
    ],
  },
}

const DEPT_ORDER = ['marketing', 'comercial', 'estrategia', 'innovacion', 'admin', 'finanzas']

interface Video { id: string; title: string; agent: string; emoji: string; duration: string; level: 'Intro' | 'Deep dive' }

function VideoCard({ video, color, locked, onPlay }: {
  video: Video; color: string; locked: boolean; onPlay: () => void
}) {
  const isPlaceholder = video.id === 'placeholder'

  return (
    <div
      className="group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-200"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
      onClick={locked ? undefined : onPlay}
    >
      {/* Thumbnail */}
      <div className="relative" style={{ paddingBottom: '56.25%', background: locked ? 'var(--bg-surface)' : `${color}10` }}>
        {!isPlaceholder && !locked ? (
          <img
            src={`https://img.youtube.com/vi/${video.id}/hqdefault.jpg`}
            alt={video.title}
            className="absolute inset-0 w-full h-full object-cover"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-4xl opacity-40">{locked ? '🔒' : video.emoji}</span>
          </div>
        )}

        {/* Play overlay */}
        {!locked && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            style={{ background: 'rgba(0,0,0,0.5)' }}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ background: color, boxShadow: `0 0 24px ${color}60` }}>
              <Play size={20} className="text-white ml-1" fill="white" />
            </div>
          </div>
        )}

        {/* Duration badge */}
        <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-semibold"
          style={{ background: 'rgba(0,0,0,0.7)', color: '#fff' }}>
          <div className="flex items-center gap-1">
            <Clock size={9} />
            {video.duration}
          </div>
        </div>

        {/* Level badge */}
        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[9px] font-semibold"
          style={{
            background: video.level === 'Intro' ? 'rgba(34,197,94,0.2)' : 'rgba(99,102,241,0.2)',
            color: video.level === 'Intro' ? '#4ade80' : '#a78bfa',
            border: `1px solid ${video.level === 'Intro' ? 'rgba(34,197,94,0.3)' : 'rgba(99,102,241,0.3)'}`,
          }}>
          {video.level}
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="text-sm leading-none">{video.emoji}</span>
          <span className="text-[10px] font-semibold" style={{ color: `${color}99` }}>{video.agent}</span>
        </div>
        <p className="text-[12px] font-medium leading-snug" style={{ color: locked ? 'var(--text-muted)' : 'var(--text-primary)' }}>
          {video.title}
        </p>
        {locked && (
          <div className="flex items-center gap-1 mt-2">
            <Lock size={9} style={{ color: 'var(--text-muted)' }} />
            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Upgrade to unlock</span>
          </div>
        )}
      </div>
    </div>
  )
}

function VideoModal({ video, color, onClose }: { video: Video; color: string; onClose: () => void }) {
  const isPlaceholder = video.id === 'placeholder'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}
      onClick={onClose}>
      <div className="relative w-full max-w-3xl mx-4" onClick={e => e.stopPropagation()}>
        <button onClick={onClose}
          className="absolute -top-10 right-0 text-white/50 hover:text-white transition-colors">
          <X size={20} />
        </button>

        <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${color}30` }}>
          {isPlaceholder ? (
            <div className="flex flex-col items-center justify-center py-20 px-8 text-center"
              style={{ background: `${color}08` }}>
              <span className="text-5xl mb-4">{video.emoji}</span>
              <p className="text-white font-semibold text-lg mb-2">{video.title}</p>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
                This video hasn&apos;t been recorded yet. Check back soon — or record it now and paste the YouTube ID.
              </p>
              <div className="mt-4 px-4 py-2 rounded-lg text-xs font-mono"
                style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)' }}>
                Replace &apos;placeholder&apos; with your YouTube video ID in resources/page.tsx
              </div>
            </div>
          ) : (
            <div style={{ position: 'relative', paddingBottom: '56.25%', background: '#000' }}>
              <iframe
                src={`https://www.youtube.com/embed/${video.id}?autoplay=1&rel=0&modestbranding=1`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
              />
            </div>
          )}
        </div>

        <div className="mt-3 px-1">
          <p className="text-white font-semibold">{video.title}</p>
          <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {video.agent} · {video.duration} · {video.level}
          </p>
        </div>
      </div>
    </div>
  )
}

export default function ResourcesPage() {
  const router = useRouter()
  const [user, setUser] = useState<MiraUser | null>(null)
  const [activeVideo, setActiveVideo] = useState<{ video: Video; color: string } | null>(null)
  const [filter, setFilter] = useState<'all' | 'intro'>('all')

  useEffect(() => {
    const stored = getUser()
    if (stored) { setUser(stored); return }
    createClient().auth.getUser().then(({ data }) => {
      if (!data.user) { router.replace('/login'); return }
      const meta = data.user.user_metadata ?? {}
      const u: MiraUser = {
        id: data.user.id, name: meta.name ?? data.user.email ?? 'User',
        email: data.user.email ?? '', role: meta.role ?? 'client',
        plan: meta.plan ?? 'starter',
        avatar: meta.avatar ?? (data.user.email?.[0]?.toUpperCase() ?? 'U'),
      }
      import('@/lib/auth').then(m => m.setUser(u))
      setUser(u)
    })
  }, [router])

  if (!user) return null

  const totalUnlocked = DEPT_ORDER.filter(slug => canAccessSection(user.plan, slug))
    .reduce((n, slug) => n + LIBRARY[slug].videos.length, 0)
  const totalVideos = DEPT_ORDER.reduce((n, slug) => n + LIBRARY[slug].videos.length, 0)

  return (
    <div className="px-8 py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-[10px] uppercase tracking-widest font-semibold mb-2"
            style={{ color: 'rgba(99,102,241,0.7)' }}>Training center</p>
          <h1 className="text-2xl font-semibold text-ink tracking-tight">Resources</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
            Video tutorials for every agent in your team.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Filter */}
          <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
            {(['all', 'intro'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: filter === f ? 'var(--bg-surface-hover)' : 'transparent',
                  color: filter === f ? 'var(--text-primary)' : 'var(--text-tertiary)',
                }}>
                {f === 'all' ? 'All videos' : 'Intro only'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Unlocked videos', value: String(totalUnlocked), color: '#4ade80' },
          { label: 'Total library', value: String(totalVideos), color: 'var(--text-primary)' },
          { label: 'Departments', value: `${DEPT_ORDER.filter(s => canAccessSection(user.plan, s)).length}/6`, color: 'var(--text-primary)' },
          { label: 'Format', value: 'YouTube', color: '#EF4444' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card px-4 py-3">
            <p className="text-[11px] text-ink-muted uppercase tracking-wider mb-1">{label}</p>
            <p className="text-xl font-semibold" style={{ color }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Department sections */}
      <div className="space-y-10">
        {DEPT_ORDER.map(slug => {
          const dept = LIBRARY[slug]
          const locked = !canAccessSection(user.plan, slug)
          const videos = filter === 'intro' ? dept.videos.filter(v => v.level === 'Intro') : dept.videos

          return (
            <section key={slug}>
              {/* Dept header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
                  style={{ background: `${dept.color}12`, border: `1px solid ${dept.color}25` }}>
                  <span className="text-base leading-none">{dept.icon}</span>
                  <span className="text-sm font-semibold" style={{ color: dept.color }}>{dept.label}</span>
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                    style={{ background: `${dept.color}20`, color: dept.color }}>
                    {dept.videos.length} videos
                  </span>
                </div>
                {locked && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
                    style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                    <Lock size={10} style={{ color: 'var(--text-muted)' }} />
                    <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                      Upgrade to unlock this department
                    </span>
                  </div>
                )}
                <div className="flex-1" style={{ height: '1px', background: 'var(--border-subtle)' }} />
              </div>

              {/* Video grid */}
              <div className="grid grid-cols-3 gap-4">
                {videos.map((video, i) => (
                  <VideoCard
                    key={i}
                    video={video}
                    color={dept.color}
                    locked={locked}
                    onPlay={() => setActiveVideo({ video, color: dept.color })}
                  />
                ))}
              </div>
            </section>
          )
        })}
      </div>

      {/* Video player modal */}
      {activeVideo && (
        <VideoModal
          video={activeVideo.video}
          color={activeVideo.color}
          onClose={() => setActiveVideo(null)}
        />
      )}
    </div>
  )
}
