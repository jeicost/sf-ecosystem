'use client'

import { useState } from 'react'
import ClientPortalHeader from '@/components/client-portal-header'
import { Save } from 'lucide-react'

export default function ConfigPage() {
  const [email, setEmail] = useState('empresa@example.com')
  const [notifications, setNotifications] = useState({
    deliverables: true,
    reports: true,
    updates: false,
  })

  return (
    <div className="px-8 py-8 max-w-3xl">
      <ClientPortalHeader
        title="Mi Configuración"
        subtitle="Perfil, preferencias, equipo y facturación"
        icon="⚙️"
      />

      {/* Profile Section */}
      <div className="mb-10">
        <p className="text-[11px] uppercase tracking-widest font-semibold mb-4" style={{ color: 'rgba(255,255,255,0.2)' }}>
          Perfil
        </p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">Nombre de la Empresa</label>
            <input type="text" defaultValue="Tu Empresa" className="w-full px-4 py-2 rounded-lg" style={{ background: 'rgba(30,41,59,0.5)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }} />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-2">Email Principal</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-2 rounded-lg" style={{ background: 'rgba(30,41,59,0.5)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }} />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-2">Teléfono (Opcional)</label>
            <input type="tel" placeholder="+34 600 123 456" className="w-full px-4 py-2 rounded-lg" style={{ background: 'rgba(30,41,59,0.5)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }} />
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="mb-10">
        <p className="text-[11px] uppercase tracking-widest font-semibold mb-4" style={{ color: 'rgba(255,255,255,0.2)' }}>
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
                <p className="text-sm font-medium text-white">{pref.label}</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{pref.desc}</p>
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
          <p className="text-[11px] uppercase tracking-widest font-semibold" style={{ color: 'rgba(255,255,255,0.2)' }}>
            Miembros del Equipo
          </p>
          <button className="text-xs px-3 py-1.5 rounded-lg font-medium" style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.2)' }}>
            + Invitar
          </button>
        </div>
        <div className="space-y-2">
          {[
            { name: 'Carlos Jacoste', role: 'Admin', email: 'carlos@example.com', status: 'Activo' },
            { name: 'María García', role: 'Editor', email: 'maria@example.com', status: 'Activo' },
          ].map(member => (
            <div key={member.email} className="card px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">{member.name}</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{member.email}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-medium text-white">{member.role}</p>
                <p className="text-xs" style={{ color: '#4ade80' }}>● {member.status}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Billing */}
      <div className="mb-10">
        <p className="text-[11px] uppercase tracking-widest font-semibold mb-4" style={{ color: 'rgba(255,255,255,0.2)' }}>
          Facturación
        </p>
        <div className="card px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-semibold text-white">Plan Growth</p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>$499/mes • Renovación: 2026-08-05</p>
            </div>
            <span className="text-xl">💳</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <p style={{ color: 'rgba(255,255,255,0.3)' }}>Próximo pago</p>
              <p className="font-medium text-white">$499.00</p>
            </div>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.3)' }}>Método de pago</p>
              <p className="font-medium text-white">Visa ••••4242</p>
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
        <button className="px-6 py-3 rounded-lg font-semibold" style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}>
          Cancelar
        </button>
      </div>
    </div>
  )
}
