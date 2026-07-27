'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { t } from '@/lib/i18n'
import { useLocaleContext } from '@/app/locale-provider'

interface LeadOption {
  id: string
  company_name: string | null
  first_name: string | null
  last_name: string | null
  hot_score: number | null
  stage: string | null
}

interface LeadPickerProps {
  name: string
  clientId: string | null
}

// Selector opcional de lead real del pipeline (patrón de comercial/qualify).
// Emite el lead_id elegido como <select name=...> para que el FormData del
// modal lo recoja sin prop drilling.
export function LeadPicker({ name, clientId }: LeadPickerProps) {
  const [leads, setLeads] = useState<LeadOption[]>([])
  const { locale } = useLocaleContext()

  useEffect(() => {
    if (!clientId) return
    const supabase = createClient()
    supabase
      .from('leads')
      .select('id, company_name, first_name, last_name, hot_score, stage')
      .eq('client_id', clientId)
      .not('stage', 'in', '("won","lost")')
      .order('hot_score', { ascending: false })
      .limit(50)
      .then(({ data }) => setLeads(data ?? []))
  }, [clientId])

  return (
    <div className="space-y-1">
      <p className="text-xs text-ink-secondary">{t('qa.lead.label', locale)}</p>
      <select name={name} className="w-full px-3 py-2 bg-surface border border-line rounded-lg text-ink text-sm" defaultValue="">
        <option value="">{t('qa.lead.none', locale)}</option>
        {leads.map((l) => {
          const contact = [l.first_name, l.last_name].filter(Boolean).join(' ')
          return (
            <option key={l.id} value={l.id}>
              {l.company_name ?? '—'}
              {contact ? ` · ${contact}` : ''}
              {l.hot_score != null ? ` · ${l.hot_score}` : ''}
            </option>
          )
        })}
      </select>
    </div>
  )
}
