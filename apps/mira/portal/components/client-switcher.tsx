'use client'
import { useEffect, useState, useRef } from 'react'
import { ChevronDown, Check, Building2 } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { useActiveClient, type ActiveClient } from '@/lib/client-context'
import { clsx } from 'clsx'

interface ClientRow {
  id: string
  name: string
  slug: string
}

export default function ClientSwitcher() {
  const { activeClient, setActiveClient } = useActiveClient()
  const [clients, setClients] = useState<ClientRow[]>([])
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    createClient()
      .from('clients')
      .select('id,name,slug')
      .order('name')
      .then(({ data }) => {
        if (!data?.length) return
        setClients(data)
      })
  }, [])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const display = activeClient?.name ?? 'Select client'
  const initial = display[0]?.toUpperCase() ?? '?'

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
        <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0"
          style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171' }}>
          {initial}
        </div>
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
                onClick={() => { setActiveClient(c); setOpen(false) }}
                className={clsx(
                  'w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors',
                  isActive ? 'bg-white/5' : 'hover:bg-white/3',
                )}
              >
                <div className="w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-bold shrink-0"
                  style={{
                    background: isActive ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.05)',
                    border: isActive ? '1px solid rgba(239,68,68,0.25)' : '1px solid rgba(255,255,255,0.08)',
                    color: isActive ? '#f87171' : '#555',
                  }}>
                  {c.name[0]?.toUpperCase()}
                </div>
                <span className={clsx('text-[11px] flex-1 truncate', isActive ? 'text-white font-medium' : 'text-[#666]')}>
                  {c.name}
                </span>
                {isActive && <Check size={10} className="text-[#f87171] shrink-0" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
