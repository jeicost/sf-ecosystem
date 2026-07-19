'use client'

import Link from 'next/link'
import { useActiveClient } from '@/lib/client-context'

export default function ToolkitOverviewPage() {
  const { activeClient } = useActiveClient()

  if (!activeClient?.id) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#1A1A1A]">
        <p className="text-white/50 text-sm">Selecciona un cliente para ver su Toolkit completo.</p>
      </div>
    )
  }

  const src = `/api/toolkit/export?overview=1&clientId=${activeClient.id}&inline=1`

  return (
    <div className="flex flex-col h-screen bg-[#1A1A1A]">
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 shrink-0">
        <Link href="/toolkit" className="text-sm text-white/60 hover:text-white transition-colors">
          ← Volver al Toolkit
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-xs text-white/40">
            Toolkit completo · {activeClient.name}
          </span>
          <a
            href={`/api/toolkit/export?overview=1&clientId=${activeClient.id}`}
            className="text-sm px-4 py-1.5 rounded bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            📥 Descargar HTML
          </a>
        </div>
      </div>
      <iframe src={src} className="flex-1 w-full border-0" title="Toolkit completo" />
    </div>
  )
}
