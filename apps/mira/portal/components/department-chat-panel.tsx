'use client'
import { MessageSquare } from 'lucide-react'
import { useActiveClient } from '@/lib/client-context'
import { useAgentChat } from '@/lib/hooks/useAgentChat'
import { useLocaleContext } from '@/app/locale-provider'
import { t } from '@/lib/i18n'
import { DEPARTMENT_METADATA, type DepartmentMetadata } from '@/lib/department-meta'
import { getDepartmentChatName } from '@/lib/department-prompt'
import { DepartmentQuickActions } from '@/components/quick-actions/DepartmentQuickActions'
import ChatThread from '@/components/chat/ChatThread'
import ChatComposer from '@/components/chat/ChatComposer'
import type { QuickActionDef } from '@/lib/quick-actions/registry'

interface DepartmentChatPanelProps {
  slug: DepartmentMetadata['slug']
  quickActionsDepartment: QuickActionDef['department']
}

// Chat de equipo embebido en la página del departamento. Las Quick Actions
// viven dentro de esta misma tarjeta, como chips encima del composer.
//
// Reescrito el 2026-08-06 sobre los componentes compartidos de components/chat.
// Antes: pintaba `{msg.content}` en crudo (markdown sin renderizar), NO tenía
// autoscroll de ningún tipo en un contenedor de 320px fijos (a partir del
// segundo mensaje ya no veías la respuesta), el input era de una sola línea,
// no se podía adjuntar nada, no se podía cancelar y no había guarda de envío.
export default function DepartmentChatPanel({ slug, quickActionsDepartment }: DepartmentChatPanelProps) {
  const { activeClient } = useActiveClient()
  const clientId = activeClient?.id || ''
  const { locale } = useLocaleContext()

  const dept = DEPARTMENT_METADATA[slug]
  const deptName = locale === 'en' ? dept.name : dept.nameEs
  const agentDisplayName = getDepartmentChatName(slug, locale)
  const { messages, isLoading, error, sendMessage, sendFeedback, cancel } = useAgentChat({
    role: `dept:${slug}`,
    clientId,
    locale,
    agentDisplayName,
  })

  return (
    <div
      className="flex flex-col rounded-xl overflow-hidden"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
    >
      <div
        className="flex items-center gap-2 px-5 py-3.5"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <MessageSquare size={15} style={{ color: dept.color }} />
        <h3 className="text-sm font-semibold text-ink">
          {t('department-chat.heading', locale).replace('{dept}', deptName)}
        </h3>
      </div>

      <ChatThread
        chatKey={`dept:${slug}`}
        className="h-[420px]"
        messages={messages}
        isLoading={isLoading}
        error={error}
        thinkingLabel={t('department-chat.thinking', locale)}
        onSelectOption={(opt) => sendMessage(opt)}
        onFeedback={(idx, value) => sendFeedback(idx, value)}
        emptyState={
          <div className="flex h-full flex-col items-center justify-center">
            <MessageSquare size={32} className="mb-2" style={{ opacity: 0.4, color: 'var(--text-secondary)' }} />
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {t('department-chat.empty', locale).replace('{dept}', deptName)}
            </p>
          </div>
        }
      />

      <div className="px-4 pt-3" style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-card)' }}>
        <DepartmentQuickActions department={quickActionsDepartment} />
      </div>

      <ChatComposer
        chatKey={`dept:${slug}`}
        onSend={sendMessage}
        onCancel={cancel}
        isLoading={isLoading}
        clientId={clientId}
        accent={dept.color}
        placeholder={t('department-chat.placeholder', locale)}
      />
    </div>
  )
}
