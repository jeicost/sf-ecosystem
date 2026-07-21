'use client'
import { useEffect, useState, useRef } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { useActiveClient } from '@/lib/client-context'
import { clsx } from 'clsx'

interface ClientRow {
  id: string
  name: string
  slug: string
  logo_url?: string | null
  primary_color?: string | null
}

function hexWithAlpha(hex: string | null | undefined, alpha: string, fallback: string): string {
  if (!hex || !/^#[0-9a-fA-F]{6}$/.test(hex)) return fallback
  return `${hex}${alpha}`
}

function ClientAvatar({
  name,
  logoUrl,
  color,
  size,
  active,
}: {
  name: string
  logoUrl?: string | null
  color?: string | null
  size: 'md' | 'sm'
  active: boolean
}) {
  const dim = size === 'md' ? 'w-6 h-6 rounded-lg text-[10px]' : 'w-5 h-5 rounded-md text-[9px]'
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={name}
        className={clsx(dim, 'object-contain shrink-0 bg-white/5 p-0.5')}
      />
    )
  }
  const bg = active
    ? hexWithAlpha(color, '26', 'rgba(239,68,68,0.15)')
    : 'rgba(255,255,255,0.05)'
  const border = active
    ? `1px solid ${hexWithAlpha(color, '40', 'rgba(239,68,68,0.25)')}`
    : '1px solid rgba(255,255,255,0.08)'
  const fg = active ? color || '#f87171' : '#555'
  return (
    <div
      className={clsx(dim, 'flex items-center justify-center font-bold shrink-0')}
      style={{ background: bg, border, color: fg }}
    >
      {name[0]?.toUpperCase() ?? '?'}
    </div>
  )
}

export default function ClientSwitcher() {
  const { activeClient, setActiveClient } = useActiveClient()
  const [clients, setClients] = useState<ClientRow[]>([])
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Solo los clientes CON grant del usuario (o todos si super_admin).
    // Nunca listar la tabla clients desde el navegador.
    fetch('/api/me/clients')
      .then((r) => r.json())
      .then((json) => {
        if (Array.isArray(json?.clients) && json.clients.length) setClients(json.clients)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const display = activeClient?.name ?? 'Select client'

  return (
    <div ref={ref} className="relative px-3 pt-3 pb-2">
      <button
        onClick={() => clients.length > 1 && setOpen(o => !o)}
        className={clsx(
          'w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all duration-150',
          'border text-left',
          clients.length > 1
            ? 'hover:bg-white/5 cursor-pointer border-[#1c1c1c] hover:border-[#2a2a2a]'
            : 'cursor-default border-[#141414]',
        )}
      >
        <ClientAvatar
          name={display}
          logoUrl={activeClient?.logoUrl}
          color={activeClient?.primaryColor}
          size="md"
          active
        />
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-medium text-white truncate leading-tight">{display}</p>
          <p className="text-[9px] text-[#333] leading-none mt-0.5">Active workspace</p>
        </div>
        {clients.length > 1 && (
          <ChevronDown size={12} className={clsx('text-[#444] transition-transform shrink-0', open && 'rotate-180')} />
        )}
      </button>

      {open && clients.length > 1 && (
        <div className="absolute left-3 right-3 top-full mt-1 z-50 rounded-xl border border-[#1c1c1c] bg-[#0d0d0d] shadow-2xl overflow-hidden">
          {clients.map(c => {
            const isActive = c.id === activeClient?.id
            return (
              <button
                key={c.id}
                onClick={() => {
                  setActiveClient({
                    id: c.id,
                    name: c.name,
                    slug: c.slug,
                    logoUrl: c.logo_url,
                    primaryColor: c.primary_color,
                  })
                  setOpen(false)
                }}
                className={clsx(
                  'w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors',
                  isActive ? 'bg-white/5' : 'hover:bg-white/3',
                )}
              >
                <ClientAvatar
                  name={c.name}
                  logoUrl={c.logo_url}
                  color={c.primary_color}
                  size="sm"
                  active={isActive}
                />
                <span className={clsx('text-[11px] flex-1 truncate', isActive ? 'text-white font-medium' : 'text-[#666]')}>
                  {c.name}
                </span>
                {isActive && (
                  <Check
                    size={10}
                    className="shrink-0"
                    style={{ color: c.primary_color || '#f87171' }}
                  />
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
