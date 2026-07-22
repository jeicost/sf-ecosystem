'use client'

import { useState } from 'react'
import { QuickActionButton } from './QuickActionButton'
import { QuickActionResult } from './QuickActionResult'

interface QuickAction {
  id: string
  title: string
  description: string
  actionType: string
  form: React.ReactNode
}

interface DepartmentQuickActionsProps {
  department: string
  actions: QuickAction[]
}

export function DepartmentQuickActions({ department, actions }: DepartmentQuickActionsProps) {
  const [activeActionId, setActiveActionId] = useState<string | null>(null)

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-ink mb-3">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-2">
          {actions.map((action) => (
            <QuickActionButton
              key={action.id}
              title={action.title}
              description={action.description}
              actionType={action.actionType}
              department={department}
              inputForm={action.form}
              onActionComplete={(actionId) => setActiveActionId(actionId)}
            />
          ))}
        </div>
      </div>

      {activeActionId && (
        <QuickActionResult
          actionId={activeActionId}
          resourceName={actions.find((a) => a.actionType === activeActionId)?.title || 'Resource'}
          department={department}
        />
      )}
    </div>
  )
}
