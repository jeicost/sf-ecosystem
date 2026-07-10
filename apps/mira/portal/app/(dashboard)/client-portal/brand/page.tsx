'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import ClientPortalHeader from '@/components/client-portal-header'
import Link from 'next/link'
import { getClientBrandProfile, getContentPillars } from '@/lib/client-portal-service'
import { createClient } from '@/lib/supabase'

export default function BrandPage() {
  const [brandProfile, setBrandProfile] = useState<any>(null)
  const [pillars, setPillars] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const db = createClient()
        const { data: { user } } = await db.auth.getUser()
        if (!user) return

        const meta = user.user_metadata || {}
        let clientId = meta.client_id

        if (!clientId) {
          const { data: access } = await db
            .from('mira_project_access')
            .select('project_id')
            .eq('user_id', user.id)
            .limit(1)
            .single()
          clientId = access?.project_id
        }

        if (clientId) {
          const profile = await getClientBrandProfile(clientId)
          const pillarsData = await getContentPillars(clientId)
          setBrandProfile(profile)
          setPillars(pillarsData)
        }
      } catch (error) {
        console.error('Failed to fetch brand data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return (
    <div className="px-8 py-8 max-w-6xl">
      <ClientPortalHeader
        title="Mi Brand Brain"
        subtitle="Perfil de marca, pillars de contenido y voz"
        icon="🎨"
      />

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 size={16} className="animate-spin text-[#444]" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-6">
            {/* Brand Profile Card */}
            <div className="card px-6 py-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-[11px] uppercase tracking-wider font-semibold mb-1" style={{ color: 'rgba(139,92,246,0.8)' }}>
                    Perfil de Marca
                  </p>
                  <p className="text-lg font-semibold text-white">
                    {brandProfile?.brand_name || 'Tu Identidad'}
                  </p>
                </div>
                <span className="text-2xl">🏢</span>
              </div>
              <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>
                {brandProfile?.mission || 'Define la misión, valores, voz y propuesta de valor de tu marca.'}
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
                  <p className="text-lg font-semibold text-white">{pillars.length} Temas Clave</p>
                </div>
                <span className="text-2xl">📚</span>
              </div>
              <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>
                {pillars.length > 0
                  ? pillars.slice(0, 2).map(p => p.name).join(', ') + (pillars.length > 2 ? '...' : '')
                  : 'Define los 3-5 pilares temáticos principales'}
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
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    {brandProfile ? `Completado el ${new Date(brandProfile.created_at).toLocaleDateString('es-ES')}` : 'No configurado'}
                  </p>
                </div>
                <span className="text-lg">{brandProfile ? '✅' : '⏳'}</span>
              </div>
              <div className="card px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">Content Pillars</p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    {pillars.length > 0 ? `${pillars.length} pillars configurados` : 'No configurados'}
                  </p>
                </div>
                <span className="text-lg">{pillars.length > 0 ? '✅' : '⏳'}</span>
              </div>
              <div className="card px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">Tone of Voice</p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    {brandProfile?.tone_of_voice ? 'Definido y validado' : 'No configurado'}
                  </p>
                </div>
                <span className="text-lg">{brandProfile?.tone_of_voice ? '✅' : '⏳'}</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
