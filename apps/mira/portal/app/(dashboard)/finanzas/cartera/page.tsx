'use client'

import AgentWorkspace from '@/components/agent-workspace'
import { useLocaleContext } from '@/app/locale-provider'
import { t } from '@/lib/i18n'

export default function Page() {
  const { locale } = useLocaleContext()

  return (
    <div className="px-8 py-8 max-w-4xl">
      <div className="mb-6">
        <p className="text-[10px] uppercase tracking-widest font-semibold mb-2" style={{ color: 'rgba(99,102,241,0.8)' }}>
          {t('finanzas.cartera.eyebrow', locale)}
        </p>
        <h1 className="text-2xl font-semibold text-ink tracking-tight">{t('finanzas.cartera.title', locale)}</h1>
        <p className="text-sm mt-1 text-ink-tertiary">
          {t('finanzas.cartera.subtitle', locale)}
        </p>
      </div>

      <AgentWorkspace
        role="quant"
        agentName="Quant"
        agentEmoji="📈"
        color="#6366F1"
        gradient="from-indigo-500 to-violet-700"
        title={t('finanzas.cartera.agent-title', locale)}
        description={t('finanzas.cartera.agent-description', locale)}
        placeholder={t('finanzas.cartera.agent-placeholder', locale)}
        quickPrompts={[
          { label: t('finanzas.cartera.quick-prompt-1-label', locale), prompt: t('finanzas.cartera.quick-prompt-1-text', locale) },
          { label: t('finanzas.cartera.quick-prompt-2-label', locale), prompt: t('finanzas.cartera.quick-prompt-2-text', locale) },
          { label: t('finanzas.cartera.quick-prompt-3-label', locale), prompt: t('finanzas.cartera.quick-prompt-3-text', locale) },
          { label: t('finanzas.cartera.quick-prompt-4-label', locale), prompt: t('finanzas.cartera.quick-prompt-4-text', locale) },
        ]}
      />
    </div>
  )
}
