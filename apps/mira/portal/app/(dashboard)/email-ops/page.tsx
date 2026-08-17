'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { clsx } from 'clsx'
import { Mail, Loader2, Download, Settings2, Search, Filter } from 'lucide-react'
import { useActiveClient } from '@/lib/client-context'
import { useLocaleContext } from '@/app/locale-provider'
import { t } from '@/lib/i18n'
import { createClient } from '@/lib/supabase'
import { getUser, isSuperAdmin } from '@/lib/auth'
import { hasEmailOpsTool } from '@/lib/entitlements'
import type { TicketRow } from '@/lib/email-ops/types'
import TicketTable from '@/components/email-ops/TicketTable'
import InboxSetupPanel from '@/components/email-ops/InboxSetupPanel'

// Bandeja de Email Ops: tickets del cliente activo con pestañas, filtros y
// orden por prioridad. Se refresca sola (realtime sobre email_tickets).

type Tab = 'open' | 'closed' | 'other' | 'all'
const TABS: Tab[] = ['open', 'closed', 'other', 'all']

interface Counts { open: number; closed: number; other: number; incomplete: number }

export default function EmailOpsPage() {
  const { locale } = useLocaleContext()
  const { activeClient } = useActiveClient()
  const clientId = activeClient?.id
  const brand = activeClient?.primaryColor || '#6366F1'
  const isAgency = isSuperAdmin(getUser())

  const [tab, setTab] = useState<Tab>('open')
  const [incomplete, setIncomplete] = useState(false)
  const [department, setDepartment] = useState('')
  const [delivery, setDelivery] = useState('')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<'priority' | 'recent'>('priority')
  const [tickets, setTickets] = useState<TicketRow[]>([])
  const [counts, setCounts] = useState<Counts>({ open: 0, closed: 0, other: 0, incomplete: 0 })
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!clientId) return
    setLoading(true)
    const params = new URLSearchParams({ clientId, status: tab, sort, limit: '100' })
    if (incomplete) params.set('incomplete', '1')
    if (department) params.set('department', department)
    if (delivery) params.set('delivery_type', delivery)
    if (search.trim()) params.set('q', search.trim())
    const res = await fetch(`/api/email-ops/tickets?${params}`)
    const data = await res.json()
    if (!res.ok) { setError(data.error || 'Error'); setLoading(false); return }
    setError(null)
    setTickets(data.tickets || [])
    setCounts(data.counts || counts)
    setTotal(data.total || 0)
    setLoading(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, tab, sort, incomplete, department, delivery, search])

  useEffect(() => { load() }, [load])

  // Realtime: cualquier cambio en los tickets del cliente → recargar (barato: es una lista corta).
  useEffect(() => {
    if (!clientId) return
    const db = createClient()
    const channel = db
      .channel(`email-ops-${clientId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'email_tickets', filter: `client_id=eq.${clientId}` }, () => { load() })
      .subscribe()
    return () => { db.removeChannel(channel) }
  }, [clientId, load])

  const departments = useMemo(() => Array.from(new Set(tickets.map((x) => x.department).filter((d): d is string => !!d))).sort(), [tickets])
  const todayIso = new Date().toISOString().slice(0, 10)
  const todayCount = tickets.filter((x) => x.service_date === todayIso && x.status === 'open').length

  if (activeClient && !hasEmailOpsTool(activeClient.id, isAgency)) {
    return (
      <div className="mx-auto max-w-2xl px-8 py-16 text-center">
        <Mail size={28} className="mx-auto mb-3 text-ink-muted" />
        <h1 className="text-lg font-semibold text-ink">{t('emailops.not-enabled.title', locale).replace('{name}', activeClient.name)}</h1>
        <p className="mt-2 text-sm text-ink-tertiary">{t('emailops.not-enabled.desc', locale).replace(/\{name\}/g, activeClient.name)}</p>
      </div>
    )
  }

  const exportUrl = (format: 'xlsx' | 'csv') => {
    const p = new URLSearchParams({ clientId: clientId || '', status: tab, format, locale })
    if (department) p.set('department', department)
    if (delivery) p.set('delivery_type', delivery)
    return `/api/email-ops/export?${p}`
  }

  const countFor = (x: Tab) => (x === 'open' ? counts.open : x === 'closed' ? counts.closed : x === 'other' ? counts.other : counts.open + counts.closed + counts.other)
  const nothingYet = !loading && counts.open + counts.closed + counts.other === 0

  return (
    <div className="mx-auto max-w-7xl px-8 py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1 flex items-center gap-2 text-[10px] uppercase tracking-widest font-semibold" style={{ color: brand }}>
            <Mail size={13} /> {t('emailops.eyebrow', locale)}
          </p>
          <h1 className="text-2xl font-semibold text-ink">{t('emailops.title', locale)}</h1>
          <p className="mt-1 max-w-2xl text-sm text-ink-tertiary">{t('emailops.subtitle', locale)}</p>
        </div>
        <div className="flex items-center gap-2">
          <a href={exportUrl('xlsx')} className="inline-flex items-center gap-1.5 rounded-lg bg-surface px-3 py-2 text-xs text-ink-secondary transition-colors hover:text-ink">
            <Download size={13} /> {t('emailops.action.export', locale)}
          </a>
          <a href={exportUrl('csv')} className="rounded-lg bg-surface px-3 py-2 text-xs text-ink-secondary transition-colors hover:text-ink">{t('emailops.action.export-csv', locale)}</a>
          <Link href="/email-ops/settings" className="inline-flex items-center gap-1.5 rounded-lg bg-surface px-3 py-2 text-xs text-ink-secondary transition-colors hover:text-ink">
            <Settings2 size={13} /> {t('emailops.action.settings', locale)}
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: t('emailops.stat.open', locale), value: counts.open, color: '#F59E0B' },
          { label: t('emailops.stat.incomplete', locale), value: counts.incomplete, color: '#EF4444' },
          { label: t('emailops.stat.today', locale), value: todayCount, color: brand },
          { label: t('emailops.stat.closed', locale), value: counts.closed, color: '#10B981' },
        ].map((s) => (
          <div key={s.label} className="card px-4 py-3">
            <p className="text-[11px] uppercase tracking-wider text-ink-muted">{s.label}</p>
            <p className="text-2xl font-semibold" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs + filtros */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex gap-1">
          {TABS.map((x) => (
            <button key={x} onClick={() => setTab(x)}
              className={clsx('flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs transition-all', tab === x ? 'bg-surface-hover font-medium text-ink' : 'text-ink-tertiary hover:text-ink')}>
              {t(`emailops.tab.${x}`, locale)}
              <span className={clsx('rounded-full px-1.5 py-0.5 text-[10px]', tab === x ? 'bg-surface-hover text-ink' : 'bg-surface text-ink-tertiary')}>{countFor(x)}</span>
            </button>
          ))}
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <label className={clsx('inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs', incomplete ? 'bg-amber-500/15 text-amber-400' : 'bg-surface text-ink-tertiary')}>
            <input type="checkbox" className="hidden" checked={incomplete} onChange={(e) => setIncomplete(e.target.checked)} />
            <Filter size={12} /> {t('emailops.filter.incomplete', locale)}
          </label>
          {departments.length > 1 && (
            <select value={department} onChange={(e) => setDepartment(e.target.value)} className="rounded-lg border border-line bg-page px-2 py-1.5 text-xs text-ink-secondary">
              <option value="">{t('emailops.filter.department', locale)}: {t('emailops.filter.all', locale)}</option>
              {departments.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          )}
          <select value={delivery} onChange={(e) => setDelivery(e.target.value)} className="rounded-lg border border-line bg-page px-2 py-1.5 text-xs text-ink-secondary">
            <option value="">{t('emailops.filter.delivery', locale)}: {t('emailops.filter.all', locale)}</option>
            {['local', 'nacional', 'internacional'].map((d) => <option key={d} value={d}>{t(`emailops.delivery.${d}`, locale)}</option>)}
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value as 'priority' | 'recent')} className="rounded-lg border border-line bg-page px-2 py-1.5 text-xs text-ink-secondary">
            <option value="priority">{t('emailops.filter.sort.priority', locale)}</option>
            <option value="recent">{t('emailops.filter.sort.recent', locale)}</option>
          </select>
          <div className="relative">
            <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-ink-muted" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('emailops.filter.search', locale)}
              className="w-48 rounded-lg border border-line bg-page py-1.5 pl-7 pr-2 text-xs text-ink outline-none" />
          </div>
        </div>
      </div>

      {error && <p className="mb-4 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</p>}

      {loading && tickets.length === 0 ? (
        <div className="flex h-40 items-center justify-center"><Loader2 size={20} className="animate-spin text-ink-muted" /></div>
      ) : nothingYet && clientId ? (
        <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
          <div className="card flex flex-col items-center justify-center px-8 py-14 text-center">
            <Mail size={26} className="mb-3 text-ink-muted" />
            <h2 className="text-base font-semibold text-ink">{t('emailops.empty.title', locale)}</h2>
            <p className="mt-2 max-w-md text-sm text-ink-tertiary">{t('emailops.empty.desc', locale)}</p>
          </div>
          <InboxSetupPanel clientId={clientId} locale={locale} brand={brand} />
        </div>
      ) : tickets.length === 0 ? (
        <div className="card py-14 text-center text-sm text-ink-tertiary">{t('emailops.empty.category', locale)}</div>
      ) : (
        <>
          <TicketTable tickets={tickets} locale={locale} brand={brand} showStatus={tab === 'all' || tab === 'other'} />
          <p className="mt-2 text-right text-[11px] text-ink-muted">{tickets.length}/{total}</p>
        </>
      )}
    </div>
  )
}
