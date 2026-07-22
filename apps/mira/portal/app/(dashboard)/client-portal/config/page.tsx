'use client'

import { useEffect, useState } from 'react'
import ClientPortalHeader from '@/components/client-portal-header'
import { Save, Loader2 } from 'lucide-react'
import { getClientInfo, getClientTeamMembers } from '@/lib/client-portal-service'
import { createClient } from '@/lib/supabase'

export default function ConfigPage() {
  const [clientInfo, setClientInfo] = useState<any>(null)
  const [teamMembers, setTeamMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    companyName: '',
    email: '',
    phone: '',
  })
  const [notifications, setNotifications] = useState({
    deliverables: true,
    reports: true,
    updates: false,
  })

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
          const info = await getClientInfo(clientId)
          const members = await getClientTeamMembers(clientId)
          setClientInfo(info)
          setTeamMembers(members)
          setFormData({
            companyName: info?.name || '',
            email: user.email || '',
            phone: '',
          })
        }
      } catch (error) {
        console.error('Failed to fetch config data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return (
    <div className="px-8 py-8 max-w-3xl">
      <ClientPortalHeader
        title="Mi Configuración"
        subtitle="Perfil, preferencias, equipo y facturación"
        icon="⚙️"
      />

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 size={16} className="animate-spin text-ink-muted" />
        </div>
      ) : (
        <>
          {/* Profile Section */}
          <div className="mb-10">
            <p className="text-[11px] uppercase tracking-widest font-semibold mb-4" style={{ color: 'var(--text-muted)' }}>
              Perfil
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink mb-2">Nombre de la Empresa</label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg"
                  style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-2">Email Principal</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg"
                  style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-2">Teléfono (Opcional)</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+34 600 123 456"
                  className="w-full px-4 py-2 rounded-lg"
                  style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                />
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="mb-10">
            <p className="text-[11px] uppercase tracking-widest font-semibold mb-4" style={{ color: 'var(--text-muted)' }}>
              Preferencias de Notificaciones
            </p>
            <div className="space-y-3">
              {[
                { key: 'deliverables', label: 'Nuevos Deliverables', desc: 'Recibe alertas cuando se generen nuevos deliverables' },
                { key: 'reports', label: 'Reportes Mensuales', desc: 'Resumen mensual de métricas y usage' },
                { key: 'updates', label: 'Actualizaciones de MIRA', desc: 'Nuevas features, mejoras y webinars' },
              ].map(pref => (
                <div key={pref.key} className="card px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-ink">{pref.label}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{pref.desc}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications[pref.key as keyof typeof notifications]}
                    onChange={e => setNotifications({ ...notifications, [pref.key]: e.target.checked })}
                    className="w-5 h-5 cursor-pointer"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Team Members */}
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] uppercase tracking-widest font-semibold" style={{ color: 'var(--text-muted)' }}>
                Miembros del Equipo
              </p>
              <button className="text-xs px-3 py-1.5 rounded-lg font-medium" style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.2)' }}>
                + Invitar
              </button>
            </div>
            <div className="space-y-2">
              {teamMembers.length > 0 ? (
                teamMembers.map(member => (
                  <div key={member.id} className="card px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-ink">{member.email.split('@')[0]}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{member.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium text-ink capitalize">{member.role}</p>
                      <p className="text-xs" style={{ color: '#4ade80' }}>● {member.status}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4" style={{ color: 'var(--text-muted)' }}>
                  <p className="text-sm">Solo tú tienes acceso a este proyecto</p>
                </div>
              )}
            </div>
          </div>

          {/* Billing */}
          <div className="mb-10">
            <p className="text-[11px] uppercase tracking-widest font-semibold mb-4" style={{ color: 'var(--text-muted)' }}>
              Facturación
            </p>

            {/* Stripe Not Configured Warning */}
            <div className="mb-4 p-4 rounded-lg" style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)' }}>
              <p className="text-sm font-medium" style={{ color: '#FBBF24' }}>
                ⚠️ Sample Data Only — Stripe integration not configured
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                All MRR, clients, and payment data shown are examples. Connect Stripe to see real billing. Contact admin to set up STRIPE_API_KEY.
              </p>
            </div>

            <div className="card px-5 py-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold text-ink">Plan Premium</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>$499/mes • Renovación: 2026-08-10</p>
                </div>
                <span className="text-xl">💳</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p style={{ color: 'var(--text-muted)' }}>Próximo pago</p>
                  <p className="font-medium text-ink">$499.00</p>
                </div>
                <div>
                  <p style={{ color: 'var(--text-muted)' }}>Método de pago</p>
                  <p className="font-medium text-ink">Visa ••••4242</p>
                </div>
              </div>
              <button className="mt-3 text-xs px-4 py-2 rounded-lg font-medium" style={{ background: 'rgba(139,92,246,0.1)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.2)' }}>
                Cambiar Plan
              </button>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex items-center gap-2">
            <button className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold" style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)', color: 'white' }}>
              <Save size={16} />
              Guardar Cambios
            </button>
            <button className="px-6 py-3 rounded-lg font-semibold" style={{ background: 'var(--bg-surface)', color: 'var(--text-tertiary)', border: '1px solid var(--border)' }}>
              Cancelar
            </button>
          </div>
        </>
      )}
    </div>
  )
}
