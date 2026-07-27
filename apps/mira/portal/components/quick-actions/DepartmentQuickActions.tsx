'use client'

import { useEffect, useState } from 'react'
import { QuickActionButton } from '../QuickActionButton'
import { QuickActionResult } from '../QuickActionResult'
import { t } from '@/lib/i18n'
import { useLocaleContext } from '@/app/locale-provider'
import { getStoredClientId } from '@/lib/client-context'
import { getQuickActionsByDepartment, type QuickActionDef } from '@/lib/quick-actions/registry'
import type { AutofillBundle } from '@/lib/quick-actions/autofill-types'

interface DepartmentQuickActionsProps {
  department: QuickActionDef['department']
}

// Grid genérico de quick actions por departamento, alimentado por el registry.
// Sustituye a los 5 componentes por-departamento que duplicaban esta estructura
// con formularios JSX a mano.
export function DepartmentQuickActions({ department }: DepartmentQuickActionsProps) {
  const [activeActionId, setActiveActionId] = useState<string | null>(null)
  // Acción clicada, guardada en el momento del click (activeActionId es el UUID
  // del servidor y nunca coincide con los ids locales del registry).
  const [activeAction, setActiveAction] = useState<QuickActionDef | null>(null)
  const [activeOutputType, setActiveOutputType] = useState<string | undefined>(undefined)
  const [autofill, setAutofill] = useState<AutofillBundle | null>(null)
  const { locale } = useLocaleContext()

  const actions = getQuickActionsByDepartment(department)
  const clientId = getStoredClientId()

  useEffect(() => {
    if (!clientId) return
    fetch(`/api/quick-actions/autofill?clientId=${clientId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((bundle) => setAutofill(bundle))
      .catch(() => setAutofill(null))
  }, [clientId])

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-ink mb-3">{t('actions.quick-actions', locale)}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {actions.map((action) => (
            <QuickActionButton
              key={action.id}
              action={action}
              autofill={autofill}
              onActionComplete={(actionId, inputData) => {
                setActiveAction(action)
                setActiveOutputType(
                  action.resolveOutputType?.(inputData ?? {}) ?? action.outputType
                )
                setActiveActionId(actionId)
              }}
            />
          ))}
        </div>
      </div>

      {activeActionId && activeAction && (
        <QuickActionResult
          actionId={activeActionId}
          resourceName={t(activeAction.titleKey, locale)}
          outputType={activeOutputType}
          department={department}
          resultActions={activeAction.resultActions}
        />
      )}
    </div>
  )
}
