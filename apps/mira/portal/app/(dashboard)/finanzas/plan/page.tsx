'use client'

import AgentWorkspace from '@/components/agent-workspace'
import { useLocaleContext } from '@/app/locale-provider'
import { t } from '@/lib/i18n'

export default function Page() {
  const { locale } = useLocaleContext()

  return (
    <div className="px-8 py-8 max-w-4xl">
      <div className="mb-6">
        <p className="text-[10px] uppercase tracking-widest font-semibold mb-2" style={{ color: 'rgba(245,158,11,0.8)' }}>
          {t('finanzas.plan.eyebrow', locale)}
        </p>
        <h1 className="text-2xl font-semibold text-ink tracking-tight">{t('finanzas.plan.title', locale)}</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
          {t('finanzas.plan.subtitle', locale)}
        </p>
      </div>

      <AgentWorkspace
        role="midas"
        agentName="Midas"
        agentEmoji="💎"
        color="#F59E0B"
        gradient="from-amber-400 to-yellow-600"
        title={t('finanzas.plan.agent-title', locale)}
        description={t('finanzas.plan.agent-description', locale)}
        placeholder={t('finanzas.plan.agent-placeholder', locale)}
        quickPrompts={[
          { label: t('finanzas.plan.quick-prompt-1-label', locale), prompt: t('finanzas.plan.quick-prompt-1-text', locale) },
          { label: t('finanzas.plan.quick-prompt-2-label', locale), prompt: t('finanzas.plan.quick-prompt-2-text', locale) },
          { label: t('finanzas.plan.quick-prompt-3-label', locale), prompt: t('finanzas.plan.quick-prompt-3-text', locale) },
          { label: t('finanzas.plan.quick-prompt-4-label', locale), prompt: t('finanzas.plan.quick-prompt-4-text', locale) },
        ]}
      />
    </div>
  )
}
