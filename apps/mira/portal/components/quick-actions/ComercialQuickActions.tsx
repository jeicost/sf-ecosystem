'use client'

import { useState } from 'react'
import { QuickActionButton } from '../QuickActionButton'
import { QuickActionResult } from '../QuickActionResult'

export function ComercialQuickActions() {
  const [activeActionId, setActiveActionId] = useState<string | null>(null)

  const actions = [
    {
      id: 'crear_campaña',
      title: 'Crear Campaña',
      description: 'Generate outreach campaign with personalized icebreakers',
      actionType: 'crear_campaña',
      form: (
        <div className="space-y-3">
          <input
            type="text"
            name="client_name"
            placeholder="Company name"
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 text-sm"
            required
          />
          <input
            type="text"
            name="industry"
            placeholder="Industry"
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 text-sm"
            required
          />
          <input
            type="number"
            name="target_count"
            placeholder="Number of leads"
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 text-sm"
            defaultValue="10"
            required
          />
        </div>
      ),
    },
    {
      id: 'generar_icp',
      title: 'Generar ICP',
      description: 'Score leads against your ideal customer profile',
      actionType: 'generar_icp',
      form: (
        <div className="space-y-3">
          <textarea
            name="lead_data"
            placeholder="Lead information (JSON or text)"
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 text-sm h-20"
            required
          />
          <textarea
            name="company_info"
            placeholder="Your company info"
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 text-sm"
            required
          />
        </div>
      ),
    },
    {
      id: 'crear_propuesta',
      title: 'Crear Propuesta',
      description: 'Generate a professional sales proposal PDF',
      actionType: 'crear_propuesta',
      form: (
        <div className="space-y-3">
          <input
            type="text"
            name="prospect_name"
            placeholder="Prospect name"
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 text-sm"
            required
          />
          <textarea
            name="call_brief"
            placeholder="Call notes or discovery brief"
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 text-sm h-16"
            required
          />
          <input
            type="number"
            name="budget_estimate"
            placeholder="Budget estimate"
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 text-sm"
            required
          />
        </div>
      ),
    },
    {
      id: 'calificar_reply',
      title: 'Calificar Reply',
      description: 'Analyze prospect response and score BANT',
      actionType: 'calificar_reply',
      form: (
        <div className="space-y-3">
          <textarea
            name="prospect_reply"
            placeholder="Prospect's email reply"
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 text-sm h-20"
            required
          />
          <input
            type="text"
            name="context"
            placeholder="Context (what you sent)"
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 text-sm"
            required
          />
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-3">⚡ Quick Actions</h3>
        <div className="grid grid-cols-2 gap-2">
          {actions.map((action) => (
            <QuickActionButton
              key={action.id}
              title={action.title}
              description={action.description}
              actionType={action.actionType}
              department="comercial"
              inputForm={action.form}
              onActionComplete={(actionId) => setActiveActionId(actionId)}
            />
          ))}
        </div>
      </div>

      {activeActionId && (
        <QuickActionResult
          actionId={activeActionId}
          resourceName={actions.find((a) => a.id === activeActionId)?.title || 'Resource'}
          department="comercial"
          outputType="json"
        />
      )}
    </div>
  )
}
