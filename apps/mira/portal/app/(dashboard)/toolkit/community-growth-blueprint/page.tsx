'use client'

import { useState } from 'react'
import { Play } from 'lucide-react'
import ToolkitToolPage from '@/components/toolkit-tool-page'

export default function CommunityGrowthBlueprintPage() {
  const [isGenerating, setIsGenerating] = useState(false)

  return (
    <ToolkitToolPage
      icon="👥"
      name="Community Growth Blueprint"
      description="Estrategia completa de crecimiento de comunidad: análisis de audiencia actual, playbooks de engagement, tácticas de retención, influencer sourcing y roadmap de 90 días."
      color="#8B5CF6"
      estimatedTime="20-30 minutos"
      outputFormat="Growth Blueprint PDF + Influencer sourcing guide + Engagement playbook + Community calendar"
      isGenerating={isGenerating}
    >
      <div className="space-y-4">
        <div className="card px-6 py-5">
          <p className="text-sm font-semibold text-white mb-4">Generar Estrategia de Comunidad</p>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-white mb-2">
                Tamaño Actual de Comunidad
              </label>
              <input
                type="number"
                placeholder="Ej: 500"
                min="10"
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{ background: 'rgba(30,41,59,0.5)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-white mb-2">
                Objetivo de Crecimiento (3 meses)
              </label>
              <input
                type="text"
                placeholder="Ej: 2,000 miembros activos, 10% engagement"
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{ background: 'rgba(30,41,59,0.5)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-white mb-2">
                Canales de Comunidad Principales
              </label>
              <input
                type="text"
                placeholder="Ej: Slack, Discord, LinkedIn, Telegram, Private community"
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{ background: 'rgba(30,41,59,0.5)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-white mb-2">
                Pilares de Contenido de Comunidad
              </label>
              <input
                type="text"
                placeholder="Ej: Education, Networking, Product updates, Behind-the-scenes"
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{ background: 'rgba(30,41,59,0.5)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}
              />
            </div>
          </div>
          <button
            onClick={() => setIsGenerating(true)}
            disabled={isGenerating}
            className="w-full mt-6 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all"
            style={{
              background: isGenerating ? 'rgba(139,92,246,0.4)' : 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
              color: 'white',
            }}
          >
            <Play size={16} />
            {isGenerating ? 'Generando estrategia...' : 'Generar Blueprint'}
          </button>
        </div>

        {isGenerating && (
          <div className="space-y-4">
            <div className="card px-6 py-5">
              <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#8B5CF6' }}>
                Roadmap de 90 Días
              </p>
              <div className="space-y-2 text-sm text-white">
                <p>🚀 <strong>Mes 1:</strong> Foundation & Activation — Optimizar infraestructura</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Reglas, canales, primer programa de incentivos, welcome sequence</p>
                <p className="mt-3">📢 <strong>Mes 2:</strong> Growth & Engagement — Experiencias activas</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>AMA sessions, workshops, ambassador program, referral mechanics</p>
                <p className="mt-3">🎯 <strong>Mes 3:</strong> Retention & Monetization — Crear valor duradero</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Tier-based access, exclusive content, partner integrations, events</p>
              </div>
            </div>

            <div className="card px-6 py-5">
              <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#8B5CF6' }}>
                Engagement Playbook
              </p>
              <div className="space-y-2 text-sm text-white">
                <div className="flex items-center justify-between pb-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <span>Daily check-ins</span>
                  <span style={{ color: '#C4B5FD' }}>5-10 min, moderators</span>
                </div>
                <div className="flex items-center justify-between pb-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <span>Weekly AMA / Q&A</span>
                  <span style={{ color: '#C4B5FD' }}>60 min, founder/expert</span>
                </div>
                <div className="flex items-center justify-between pb-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <span>Monthly workshop</span>
                  <span style={{ color: '#C4B5FD' }}>Skill-share or guest speaker</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Quarterly event</span>
                  <span style={{ color: '#C4B5FD' }}>Networking or celebration</span>
                </div>
              </div>
            </div>

            <div className="card px-6 py-5">
              <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#8B5CF6' }}>
                Influencer & Ambassador Sourcing
              </p>
              <div className="space-y-2 text-sm text-white">
                <p>⭐ <strong>Tier 1:</strong> Micro-influencers (5k-50k followers) — authenticity over reach</p>
                <p>🌟 <strong>Tier 2:</strong> Power users (most active in your community) — early advocates</p>
                <p>🎯 <strong>Tier 3:</strong> Industry experts — credibility and cross-pollination</p>
                <p className="mt-2 text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Incentive structure: Early access → featured posts → financial partnership</p>
              </div>
            </div>

            <div className="card px-6 py-5">
              <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#8B5CF6' }}>
                Success Metrics
              </p>
              <div className="space-y-2 text-sm text-white">
                <p>👥 Members: 500 → 2,000 (4x growth)</p>
                <p>💬 Monthly active: 50%+ engagement rate</p>
                <p>📈 Content interactions: 100+ comments/reactions weekly</p>
                <p>🔗 Referral rate: 30%+ of new members from existing</p>
                <p>⏱️ Retention: 80%+ month-over-month stay</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </ToolkitToolPage>
  )
}
