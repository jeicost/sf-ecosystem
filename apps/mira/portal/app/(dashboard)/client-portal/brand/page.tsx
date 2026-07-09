'use client'

import ClientPortalHeader from '@/components/client-portal-header'
import Link from 'next/link'

export default function BrandPage() {
  return (
    <div className="px-8 py-8 max-w-6xl">
      <ClientPortalHeader
        title="Mi Brand Brain"
        subtitle="Perfil de marca, pillars de contenido y voz"
        icon="🎨"
      />

      <div className="grid grid-cols-2 gap-6">
        {/* Brand Profile Card */}
        <div className="card px-6 py-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-[11px] uppercase tracking-wider font-semibold mb-1" style={{ color: 'rgba(139,92,246,0.8)' }}>
                Perfil de Marca
              </p>
              <p className="text-lg font-semibold text-white">Tu Identidad</p>
            </div>
            <span className="text-2xl">🏢</span>
          </div>
          <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Define la misión, valores, voz y propuesta de valor de tu marca. Los agentes MIRA usan esto para generar contenido alineado.
          </p>
          <Link href="/brain"
            className="inline-flex items-center gap-2 text-xs px-4 py-2 rounded-lg font-medium"
            style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.2)' }}>
            Editar Perfil →
          </Link>
        </div>

        {/* Content Pillars Card */}
        <div className="card px-6 py-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-[11px] uppercase tracking-wider font-semibold mb-1" style={{ color: 'rgba(107,114,128,0.8)' }}>
                Pillars de Contenido
              </p>
              <p className="text-lg font-semibold text-white">Temas Clave</p>
            </div>
            <span className="text-2xl">📚</span>
          </div>
          <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Define los 3-5 pilares temáticos principales. El contenido generado será distribuido en estos ejes.
          </p>
          <Link href="/brain"
            className="inline-flex items-center gap-2 text-xs px-4 py-2 rounded-lg font-medium"
            style={{ background: 'rgba(107,114,128,0.15)', color: '#d1d5db', border: '1px solid rgba(107,114,128,0.2)' }}>
            Configurar Pillars →
          </Link>
        </div>
      </div>

      {/* Current Brand Status */}
      <div className="mt-10">
        <p className="text-[11px] uppercase tracking-widest font-semibold mb-4" style={{ color: 'rgba(255,255,255,0.2)' }}>
          Estado Actual
        </p>
        <div className="space-y-3">
          <div className="card px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">Perfil de Marca</p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Completado el 2026-07-05</p>
            </div>
            <span className="text-lg">✅</span>
          </div>
          <div className="card px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">Content Pillars</p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>4 pillars configurados</p>
            </div>
            <span className="text-lg">✅</span>
          </div>
          <div className="card px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">Tone of Voice</p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Definido y validado</p>
            </div>
            <span className="text-lg">✅</span>
          </div>
        </div>
      </div>
    </div>
  )
}
