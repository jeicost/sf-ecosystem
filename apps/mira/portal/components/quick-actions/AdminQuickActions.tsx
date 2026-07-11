'use client'

import { useState } from 'react'
import { QuickActionButton } from '../QuickActionButton'
import { QuickActionResult } from '../QuickActionResult'

export function AdminQuickActions() {
  const [activeActionId, setActiveActionId] = useState<string | null>(null)

  const actions = [
    {
      id: 'responder_ticket',
      title: 'Responder Ticket',
      description: 'Generate professional support response',
      actionType: 'responder_ticket',
      form: (
        <div className="space-y-3">
          <textarea
            name="issue"
            placeholder="Customer issue or question"
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 text-sm h-16"
            required
          />
          <select
            name="customer_type"
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
            required
          >
            <option value="enterprise">Enterprise</option>
            <option value="startup">Startup</option>
            <option value="individual">Individual</option>
          </select>
        </div>
      ),
    },
    {
      id: 'crear_faq',
      title: 'Crear FAQ',
      description: 'Generate FAQ document for knowledge base',
      actionType: 'crear_faq',
      form: (
        <div className="space-y-3">
          <input
            type="text"
            name="topic"
            placeholder="FAQ topic"
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 text-sm"
            required
          />
          <input
            type="text"
            name="product_area"
            placeholder="Product area or feature"
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 text-sm"
            required
          />
        </div>
      ),
    },
    {
      id: 'crear_tutorial',
      title: 'Crear Tutorial',
      description: 'Generate step-by-step tutorial with script',
      actionType: 'crear_tutorial',
      form: (
        <div className="space-y-3">
          <input
            type="text"
            name="feature"
            placeholder="Feature to explain"
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 text-sm"
            required
          />
          <select
            name="skill_level"
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
            required
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
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
              department="admin"
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
          department="admin"
        />
      )}
    </div>
  )
}
