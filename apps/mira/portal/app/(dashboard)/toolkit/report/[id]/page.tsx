'use client'

import { use } from 'react'
import Link from 'next/link'

export default function ToolkitReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  return (
    <div className="flex flex-col h-[calc(100vh-0px)] bg-[#1A1A1A]">
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-[#1A1A1A] shrink-0">
        <Link
          href="/toolkit"
          className="text-sm text-white/60 hover:text-white transition-colors"
        >
          ← Volver al Toolkit
        </Link>
        <a
          href={`/api/toolkit/export?queue_id=${id}`}
          className="text-sm px-4 py-1.5 rounded bg-white/10 text-white hover:bg-white/20 transition-colors"
        >
          📥 Descargar HTML
        </a>
      </div>
      <iframe
        src={`/api/toolkit/export?queue_id=${id}&inline=1`}
        className="flex-1 w-full border-0"
        title="Reporte"
      />
    </div>
  )
}
