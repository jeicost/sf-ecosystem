'use client'

import { useRouter } from 'next/navigation'
import { useActiveClient } from '@/lib/client-context'
import { ChevronRight } from 'lucide-react'
import { TOOLKIT_TOOLS } from '@/lib/toolkit-tools'

interface ClientCardProps {
  id: string
  name: string
  slug: string
  logoUrl: string | null
  primaryColor: string | null
  icp?: string | null
  status?: string | null
  onboardingStatus?: string
  createdAt: string
  deliverableCount?: number
  toolsUsed?: string[]
}

export default function ClientCard({
  id,
  name,
  slug,
  logoUrl,
  primaryColor,
  icp,
  status,
  onboardingStatus,
  createdAt,
  deliverableCount = 0,
  toolsUsed = [],
}: ClientCardProps) {
  const router = useRouter()
  const { setActiveClient } = useActiveClient()

  const accentColor = primaryColor || '#8B5CF6'
  const initials = name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const isActive = status === 'active'

  // Map tool slugs to readable names
  const toolNames = toolsUsed
    .slice(0, 2)
    .map(slug => {
      const tool = TOOLKIT_TOOLS.find(t => t.slug === slug)
      return tool?.name || slug.replace(/-/g, ' ')
    })

  const handleClick = () => {
    setActiveClient({
      id,
      name,
      slug,
    })
    router.push('/toolkit')
  }

  return (
    <div
      onClick={handleClick}
      className="card px-5 py-4 cursor-pointer transition hover:border-opacity-100 hover:scale-[1.01]"
      style={{ borderColor: 'var(--border)' }}
    >
      {/* Header: Logo + Name + Status Badge */}
      <div className="flex items-start gap-4 mb-3">
        <div
          className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 font-semibold text-white"
          style={{
            background: logoUrl
              ? 'transparent'
              : `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)`,
          }}
        >
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={name}
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            initials
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-ink text-sm truncate">{name}</h3>
            {isActive && (
              <span className="px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400 flex-shrink-0">
                Active
              </span>
            )}
          </div>
          {icp && (
            <p className="text-xs text-ink-secondary truncate mb-1">{icp}</p>
          )}
        </div>
      </div>

      {/* Tool tags */}
      {toolNames.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {toolNames.map((toolName, i) => (
            <span key={i} className="px-2 py-1 text-xs rounded-full" style={{ background: 'rgba(139,92,246,0.2)', color: '#c4b5fd' }}>
              {toolName}
            </span>
          ))}
        </div>
      )}

      {/* Divider + Footer: Deliverables count + CTA */}
      <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
        <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
          {deliverableCount} {deliverableCount === 1 ? 'deliverable' : 'deliverables'}
        </div>
        <div className="flex items-center gap-1 text-xs text-blue-400">
          Open workspace
          <ChevronRight size={14} style={{ color: 'rgba(59, 130, 246, 0.6)' }} />
        </div>
      </div>
    </div>
  )
}
