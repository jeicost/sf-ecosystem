'use client'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { clsx } from 'clsx'
import { SECTIONS, MiraSection } from '@/lib/sections'
import { canAccessSection, type UserPlan } from '@/lib/plans'

interface SectionSwitcherProps {
  activeSlug: string
  userPlan?: UserPlan
}

export default function SectionSwitcher({ activeSlug, userPlan = 'admin' }: SectionSwitcherProps) {
  const router = useRouter()
  const [tooltip, setTooltip] = useState<string | null>(null)

  useEffect(() => {
    if (!tooltip) return
    const id = setTimeout(() => setTooltip(null), 1800)
    return () => clearTimeout(id)
  }, [tooltip])

  const handleClick = (section: MiraSection) => {
    const accessible = canAccessSection(userPlan, section.slug)
    if (!accessible) { setTooltip(section.slug); return }
    const first = section.navItems[0]
    if (first) router.push(first.href)
  }

  // 'operations' se oculta por completo sin acceso; el resto de secciones
  // inaccesibles se muestran con candado (upsell de upgrade).
  const visibleSections = SECTIONS.filter(
    (s) => s.slug !== 'operations' || canAccessSection(userPlan, s.slug)
  )

  return (
    <div className="px-2 py-2 border-b border-line-subtle">
      <div className="flex gap-0.5">
        {visibleSections.map((section) => {
          const isActive = section.slug === activeSlug
          const accessible = canAccessSection(userPlan, section.slug)
          const showTip = tooltip === section.slug

          return (
            <div key={section.slug} className="relative flex-1">
              <button
                onClick={() => handleClick(section)}
                title={section.name}
                className={clsx(
                  'w-full py-2 rounded-lg text-[9px] font-medium flex flex-col items-center gap-0.5 transition-all duration-200',
                  isActive
                    ? 'text-ink'
                    : accessible
                      ? 'text-ink-muted hover:text-ink-secondary hover:bg-surface-hover'
                      : 'text-ink-muted cursor-not-allowed'
                )}
                style={isActive ? {
                  background: `${section.color}18`,
                  boxShadow: `inset 0 0 0 1px ${section.color}30`,
                } : {}}
              >
                <span className="text-xs leading-none">
                  {accessible ? section.icon : '🔒'}
                </span>
                <span className="leading-none truncate w-full text-center px-0.5 text-[8px]"
                  style={isActive ? { color: section.color } : {}}>
                  {section.shortName}
                </span>
              </button>

              {/* Active bottom bar */}
              {isActive && (
                <div
                  className="absolute bottom-0 left-2 right-2 h-[2px] rounded-t-full"
                  style={{ background: section.color, boxShadow: `0 0 6px ${section.color}80` }}
                />
              )}

              {/* Lock tooltip */}
              {showTip && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-card border border-line-subtle rounded-lg text-[10px] text-ink-tertiary whitespace-nowrap z-50 shadow-xl">
                  <span className="block text-ink text-[10px] font-medium mb-0.5">Locked</span>
                  Upgrade your plan to unlock
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
