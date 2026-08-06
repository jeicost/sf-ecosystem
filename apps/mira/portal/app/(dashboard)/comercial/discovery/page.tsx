'use client'
import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Search, Loader2, Plus, CheckCircle2, ChevronDown, Lock, ArrowRight, Mail, ShieldCheck } from 'lucide-react'
import { useActiveClient } from '@/lib/client-context'
import { useLocaleContext } from '@/app/locale-provider'
import { useToolConnections } from '@/lib/hooks/useToolConnections'
import { t, type Locale } from '@/lib/i18n'
import { clsx } from 'clsx'
import IcpCriteriaPanel from '@/components/comercial/IcpCriteriaPanel'
import PageHeader from '@/components/ui/PageHeader'
import { DEPARTMENT_METADATA } from '@/lib/department-meta'

interface DiscoveredLead {
  company_name: string
  company_website: string | null
  linkedin_url: string | null
  industry: string
  geography: string
  key_person_name: string | null
  key_person_title: string | null
  description: string
  trigger_signals: string[]
  score: number
  classification: 'hot' | 'warm' | 'cold' | 'disqualify'
  reason: string
}

interface DeepLead {
  first_name: string | null
  last_name: string | null
  email: string | null
  email_verified: boolean
  title: string | null
  company_name: string | null
  company_website: string | null
  industry: string | null
  geography: string | null
}

interface DeepEnrichedResult {
  id: string
  company_name: string
  crm_ready: boolean
  apollo_data?: { persons?: DeepLead[] }
}

type DeepStep = 'idle' | 'searching' | 'results' | 'enriching' | 'enriched' | 'syncing' | 'synced'
type DeepErrorKind = 'not_connected' | 'limit' | 'other' | null

const CLASS_STYLE: Record<string, { text: string; label: string }> = {
  hot:        { text: 'text-red-400',    label: 'HOT' },
  warm:       { text: 'text-amber-400',  label: 'WARM' },
  cold:       { text: 'text-blue-400',   label: 'COLD' },
  disqualify: { text: 'text-ink-muted',  label: 'DESC' },
}

export default function DiscoveryPage() {
  const { activeClient } = useActiveClient()
  const clientId = activeClient?.id
  const { locale } = useLocaleContext()

  const [mode, setMode] = useState<'light' | 'deep' | 'criteria'>('light')

  // Semillas por URL: el CTA "Abrir en Prospección" de la quick action
  // crear_campaña precarga aquí la búsqueda del discovery_search generado.
  const searchParams = useSearchParams()
  const [keywords, setKeywords]   = useState(searchParams.get('keywords') ?? '')
  const [industry, setIndustry]   = useState(searchParams.get('industry') ?? '')
  const [geography, setGeography] = useState(searchParams.get('geography') ?? '')
  const [limit, setLimit]         = useState(() => {
    const l = Number(searchParams.get('limit'))
    return Number.isFinite(l) && l > 0 ? Math.min(l, 50) : 20
  })

  const [running, setRunning]     = useState(false)
  const [status, setStatus]       = useState('')
  const [leads, setLeads]         = useState<DiscoveredLead[]>([])
  const [savedCount, setSavedCount] = useState<number | null>(null)
  const [added, setAdded]         = useState<Set<string>>(new Set())

  // Modo profundo (Apollo + Hunter, claves por cliente)
  const { connectedTools, isLoading: toolsLoading } = useToolConnections(clientId || '')
  const deepConnected = connectedTools.includes('apollo') && connectedTools.includes('hunter')

  const [deepStep, setDeepStep]         = useState<DeepStep>('idle')
  const [deepDiscoveryId, setDeepDiscoveryId] = useState<string | null>(null)
  const [deepCompanies, setDeepCompanies] = useState<DeepLead[]>([])
  const [deepEnriched, setDeepEnriched] = useState<DeepEnrichedResult[]>([])
  const [deepSyncedCount, setDeepSyncedCount] = useState<number | null>(null)
  const [deepError, setDeepError]       = useState<DeepErrorKind>(null)
  const deepRunning = deepStep === 'searching' || deepStep === 'enriching' || deepStep === 'syncing'

  async function runDeepSearch() {
    if (!industry.trim() || !clientId || deepRunning) return
    setDeepError(null)
    setDeepStep('searching')
    setDeepCompanies([])
    setDeepEnriched([])
    setDeepSyncedCount(null)

    try {
      const res = await fetch('/api/sales-engine/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: clientId, sector: industry, geo: geography || undefined, limit }),
      })
      const json = await res.json()
      if (!res.ok) {
        setDeepError(json.error === 'apollo_hunter_not_connected' ? 'not_connected' : res.status === 402 ? 'limit' : 'other')
        setDeepStep('idle')
        return
      }
      setDeepDiscoveryId(json.discovery_id)
      setDeepCompanies(json.leads ?? [])
      setDeepStep('results')
    } catch {
      setDeepError('other')
      setDeepStep('idle')
    }
  }

  async function runDeepEnrich() {
    if (!deepDiscoveryId || !clientId || deepRunning) return
    setDeepError(null)
    setDeepStep('enriching')

    try {
      const res = await fetch('/api/sales-engine/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: clientId, discovery_result_id: deepDiscoveryId }),
      })
      const json = await res.json()
      if (!res.ok) {
        setDeepError(json.error === 'apollo_hunter_not_connected' ? 'not_connected' : res.status === 402 ? 'limit' : 'other')
        setDeepStep('results')
        return
      }
      setDeepEnriched(json.leads ?? [])
      setDeepStep('enriched')
    } catch {
      setDeepError('other')
      setDeepStep('results')
    }
  }

  async function runDeepSync() {
    if (deepEnriched.length === 0 || !clientId || deepRunning) return
    setDeepError(null)
    setDeepStep('syncing')

    try {
      const res = await fetch('/api/sales-engine/sync-crm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: clientId, enrichment_result_ids: deepEnriched.map(e => e.id) }),
      })
      const json = await res.json()
      if (!res.ok) {
        setDeepError('other')
        setDeepStep('enriched')
        return
      }
      setDeepSyncedCount(json.synced_count ?? 0)
      setDeepStep('synced')
    } catch {
      setDeepError('other')
      setDeepStep('enriched')
    }
  }

  async function runDiscovery() {
    if (!keywords.trim() || running) return
    setRunning(true)
    setLeads([])
    setSavedCount(null)
    setStatus(t('comercial.discovery.starting-search', locale))

    try {
      const res = await fetch('/api/comercial/discovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keywords, industry, geography, limit, clientId }),
      })

      if (!res.body) throw new Error('No stream')
      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const lines = decoder.decode(value).split('\n').filter(Boolean)
        for (const line of lines) {
          try {
            const msg = JSON.parse(line)
            if (msg.type === 'status') setStatus(msg.message)
            if (msg.type === 'done') {
              setLeads(msg.leads ?? [])
              setSavedCount(msg.saved ?? 0)
              setStatus('')
            }
            if (msg.type === 'error') setStatus(`Error: ${msg.message}`)
          } catch {}
        }
      }
    } catch (e) {
      setStatus(`Error: ${String(e)}`)
    } finally {
      setRunning(false)
    }
  }

  async function addToPipeline(lead: DiscoveredLead) {
    const key = lead.company_name
    setAdded(prev => new Set([...prev, key]))
    await fetch('/api/comercial/discovery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        keywords: lead.company_name,
        industry: lead.industry,
        geography: lead.geography,
        limit: 1,
        clientId,
      }),
    }).catch(() => {})
  }

  const hotLeads  = leads.filter(l => l.classification === 'hot')
  const warmLeads = leads.filter(l => l.classification === 'warm')
  const rest      = leads.filter(l => l.classification !== 'hot' && l.classification !== 'warm')

  return (
    <div className="px-8 py-8 max-w-5xl">
      {/* Header */}
      <PageHeader
        eyebrow={t('section.comercial', locale)}
        title="🔍 Rex — Lead Discovery"
        subtitle={mode === 'light' ? t('comercial.discovery.find-companies', locale) : t('comercial.discovery.deep-desc', locale)}
        eyebrowColor={DEPARTMENT_METADATA.comercial.color}
      />

      {/* Mode toggle — search modes + the ICP criteria that drive their scoring */}
      <div className="flex items-center gap-2 mb-6">
        {(['light', 'deep', 'criteria'] as const).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={clsx(
              'px-3.5 py-2 rounded-lg text-[12px] font-medium transition-all border',
              mode === m
                ? 'bg-red-400/15 border-red-400/30 text-red-400'
                : 'border-transparent hover:text-ink'
            )}
            style={mode !== m ? { color: 'var(--text-tertiary)' } : undefined}
          >
            {m === 'light' ? t('comercial.discovery.mode-light', locale)
              : m === 'deep' ? t('comercial.discovery.mode-deep', locale)
              : t('comercial.discovery.mode-criteria', locale)}
          </button>
        ))}
      </div>

      {mode === 'criteria' && <IcpCriteriaPanel />}

      {mode === 'light' && (
      <>
      {/* Search form */}
      <div className="card p-5 mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div className="col-span-2">
            <label className="text-[11px] uppercase tracking-wider block mb-1.5" style={{ color: 'var(--text-tertiary)' }}>
              Keywords <span className="text-red-400">*</span>
            </label>
            <input
              value={keywords}
              onChange={e => setKeywords(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && runDiscovery()}
              placeholder='e.g. "venture builder Spain" or "startup studio LATAM"'
              className="w-full rounded-lg px-3 py-2.5 text-sm text-ink focus:outline-none transition-colors"
              style={{
                background: 'var(--bg-page)',
                borderColor: 'var(--border-subtle)',
                borderWidth: '1px',
                color: 'var(--text-primary)',
              }}
            />
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-wider block mb-1.5" style={{ color: 'var(--text-tertiary)' }}>Industry</label>
            <input
              value={industry}
              onChange={e => setIndustry(e.target.value)}
              placeholder='e.g. "Venture Capital" or "SaaS B2B"'
              className="w-full rounded-lg px-3 py-2.5 text-sm text-ink focus:outline-none transition-colors"
              style={{
                background: 'var(--bg-page)',
                borderColor: 'var(--border-subtle)',
                borderWidth: '1px',
                color: 'var(--text-primary)',
              }}
            />
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-wider block mb-1.5" style={{ color: 'var(--text-tertiary)' }}>{t('comercial.discovery.geography', locale)}</label>
            <input
              value={geography}
              onChange={e => setGeography(e.target.value)}
              placeholder='e.g. "Spain" or "LATAM"'
              className="w-full rounded-lg px-3 py-2.5 text-sm text-ink focus:outline-none transition-colors"
              style={{
                background: 'var(--bg-page)',
                borderColor: 'var(--border-subtle)',
                borderWidth: '1px',
                color: 'var(--text-primary)',
              }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>{t('comercial.discovery.limit', locale)}</span>
            {[10, 20, 30, 50].map(n => (
              <button key={n} onClick={() => setLimit(n)}
                className={clsx(
                  'px-2.5 py-1 rounded text-[11px] transition-all border',
                  limit === n
                    ? 'bg-red-400/15 border-red-400/30 text-red-400'
                    : 'hover:text-ink border-transparent'
                )}
                style={limit !== n ? { color: 'var(--text-tertiary)' } : undefined}>
                {n}
              </button>
            ))}
          </div>
          <button
            onClick={runDiscovery}
            disabled={!keywords.trim() || running}
            className={clsx(
              'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all',
              keywords.trim() && !running
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-surface text-ink-muted cursor-not-allowed'
            )}
          >
            {running ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
            {running ? t('comercial.discovery.searching', locale) : t('comercial.discovery.search-btn', locale)}
          </button>
        </div>

        {status && (
          <div className="mt-4 flex items-center gap-2 text-[12px] text-red-400/70">
            <Loader2 size={12} className="animate-spin" />
            {status}
          </div>
        )}
      </div>

      {/* Results */}
      {leads.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-5">
            <p className="text-sm text-ink font-medium">{leads.length} empresas encontradas</p>
            {savedCount !== null && (
              <span className="flex items-center gap-1 text-[11px] text-green-400">
                <CheckCircle2 size={11} /> {savedCount} {t('comercial.discovery.added-to-pipeline', locale)}
              </span>
            )}
          </div>

          {hotLeads.length > 0 && (
            <LeadGroup locale={locale} title={t('comercial.discovery.group-hot', locale)} colorClass="text-red-400" leads={hotLeads} added={added} onAdd={addToPipeline} />
          )}
          {warmLeads.length > 0 && (
            <LeadGroup locale={locale} title={t('comercial.discovery.group-warm', locale)} colorClass="text-amber-400" leads={warmLeads} added={added} onAdd={addToPipeline} />
          )}
          {rest.length > 0 && (
            <LeadGroup locale={locale} title={t('comercial.discovery.group-cold', locale)} colorClass="text-ink-muted" leads={rest} added={added} onAdd={addToPipeline} collapsed />
          )}
        </div>
      )}
      </>
      )}

      {mode === 'deep' && (
        <DeepDiscovery
          locale={locale}
          toolsLoading={toolsLoading}
          deepConnected={deepConnected}
          industry={industry}
          setIndustry={setIndustry}
          geography={geography}
          setGeography={setGeography}
          limit={limit}
          setLimit={setLimit}
          deepStep={deepStep}
          deepRunning={deepRunning}
          deepCompanies={deepCompanies}
          deepEnriched={deepEnriched}
          deepSyncedCount={deepSyncedCount}
          deepError={deepError}
          onSearch={runDeepSearch}
          onEnrich={runDeepEnrich}
          onSync={runDeepSync}
        />
      )}
    </div>
  )
}

function DeepDiscovery({
  locale, toolsLoading, deepConnected,
  industry, setIndustry, geography, setGeography, limit, setLimit,
  deepStep, deepRunning, deepCompanies, deepEnriched, deepSyncedCount, deepError,
  onSearch, onEnrich, onSync,
}: {
  locale: Locale
  toolsLoading: boolean
  deepConnected: boolean
  industry: string
  setIndustry: (v: string) => void
  geography: string
  setGeography: (v: string) => void
  limit: number
  setLimit: (v: number) => void
  deepStep: DeepStep
  deepRunning: boolean
  deepCompanies: DeepLead[]
  deepEnriched: DeepEnrichedResult[]
  deepSyncedCount: number | null
  deepError: DeepErrorKind
  onSearch: () => void
  onEnrich: () => void
  onSync: () => void
}) {
  if (toolsLoading) {
    return <div className="card p-5 mb-8 text-sm" style={{ color: 'var(--text-tertiary)' }}>...</div>
  }

  if (!deepConnected) {
    return (
      <div className="card p-8 mb-8 flex flex-col items-center text-center gap-3">
        <Lock size={22} style={{ color: 'var(--text-tertiary)' }} />
        <p className="text-sm max-w-md" style={{ color: 'var(--text-secondary)' }}>
          {t('comercial.discovery.deep-not-connected', locale)}
        </p>
        <Link
          href="/integrations"
          className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-red-500 text-white hover:bg-red-600 transition-all"
        >
          {t('comercial.discovery.deep-connect-cta', locale)} <ArrowRight size={14} />
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="card p-5 mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-[11px] uppercase tracking-wider block mb-1.5" style={{ color: 'var(--text-tertiary)' }}>
              Industry / sector <span className="text-red-400">*</span>
            </label>
            <input
              value={industry}
              onChange={e => setIndustry(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && onSearch()}
              placeholder='e.g. "Venture Capital" or "SaaS B2B"'
              className="w-full rounded-lg px-3 py-2.5 text-sm text-ink focus:outline-none transition-colors"
              style={{ background: 'var(--bg-page)', borderColor: 'var(--border-subtle)', borderWidth: '1px', color: 'var(--text-primary)' }}
            />
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-wider block mb-1.5" style={{ color: 'var(--text-tertiary)' }}>{t('comercial.discovery.geography', locale)}</label>
            <input
              value={geography}
              onChange={e => setGeography(e.target.value)}
              placeholder='e.g. "Spain" or "LATAM"'
              className="w-full rounded-lg px-3 py-2.5 text-sm text-ink focus:outline-none transition-colors"
              style={{ background: 'var(--bg-page)', borderColor: 'var(--border-subtle)', borderWidth: '1px', color: 'var(--text-primary)' }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>{t('comercial.discovery.limit', locale)}</span>
            {[10, 20, 30, 50].map(n => (
              <button key={n} onClick={() => setLimit(n)}
                className={clsx(
                  'px-2.5 py-1 rounded text-[11px] transition-all border',
                  limit === n ? 'bg-red-400/15 border-red-400/30 text-red-400' : 'hover:text-ink border-transparent'
                )}
                style={limit !== n ? { color: 'var(--text-tertiary)' } : undefined}>
                {n}
              </button>
            ))}
          </div>
          <button
            onClick={onSearch}
            disabled={!industry.trim() || deepRunning}
            className={clsx(
              'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all',
              industry.trim() && !deepRunning ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-surface text-ink-muted cursor-not-allowed'
            )}
          >
            {deepStep === 'searching' ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
            {t('comercial.discovery.deep-search-btn', locale)}
          </button>
        </div>

        {deepStep === 'searching' && (
          <div className="mt-4 flex items-center gap-2 text-[12px] text-red-400/70">
            <Loader2 size={12} className="animate-spin" /> {t('comercial.discovery.deep-searching', locale)}
          </div>
        )}
        {deepError && (
          <div className="mt-4 text-[12px] text-red-400">
            {deepError === 'not_connected' && t('comercial.discovery.deep-not-connected', locale)}
            {deepError === 'limit' && t('comercial.discovery.deep-limit-hit', locale)}
            {deepError === 'other' && 'Error — please try again.'}
          </div>
        )}
      </div>

      {deepCompanies.length > 0 && deepStep !== 'searching' && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-ink font-medium">{deepCompanies.length} results from Apollo</p>
            {(deepStep === 'results' || deepStep === 'enriching') && (
              <button
                onClick={onEnrich}
                disabled={deepRunning}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-semibold bg-red-400/10 border border-red-400/25 text-red-400 hover:bg-red-400/15 transition-all disabled:opacity-50"
              >
                {deepStep === 'enriching' ? <Loader2 size={13} className="animate-spin" /> : <ShieldCheck size={13} />}
                {t('comercial.discovery.deep-enrich-btn', locale)}
              </button>
            )}
          </div>
          {deepStep === 'enriching' && (
            <div className="mb-3 flex items-center gap-2 text-[12px] text-red-400/70">
              <Loader2 size={12} className="animate-spin" /> {t('comercial.discovery.deep-enriching', locale)}
            </div>
          )}
          <div className="space-y-2">
            {deepCompanies.map((lead, i) => (
              <div key={i} className="card p-4 flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink">{lead.company_name ?? '—'}</p>
                  {(lead.first_name || lead.title) && (
                    <p className="text-[11px] mb-1" style={{ color: 'var(--text-secondary)' }}>
                      {[lead.first_name, lead.last_name].filter(Boolean).join(' ')}{lead.title ? ` · ${lead.title}` : ''}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-1 mt-1">
                    {lead.industry && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)' }}>{lead.industry}</span>}
                    {lead.geography && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-surface)', color: 'var(--text-tertiary)' }}>📍 {lead.geography}</span>}
                    {lead.email && (
                      <span className={clsx(
                        'text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1',
                        lead.email_verified ? 'bg-green-400/10 text-green-400 border border-green-400/20' : 'bg-red-400/10 text-red-400 border border-red-400/20'
                      )}>
                        <Mail size={9} /> {lead.email} {lead.email_verified && `· ${t('comercial.discovery.deep-verified-email', locale)}`}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {deepEnriched.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-ink font-medium">{deepEnriched.length} enriched with real data</p>
            {deepStep !== 'synced' && (
              <button
                onClick={onSync}
                disabled={deepRunning}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-red-500 text-white hover:bg-red-600 transition-all disabled:opacity-50"
              >
                {deepStep === 'syncing' ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
                {t('comercial.discovery.deep-sync-btn', locale)}
              </button>
            )}
            {deepStep === 'synced' && (
              <span className="flex items-center gap-1 text-[12px] text-green-400">
                <CheckCircle2 size={13} /> {deepSyncedCount} {t('comercial.discovery.deep-synced', locale)}
              </span>
            )}
          </div>
          {deepStep === 'syncing' && (
            <div className="mb-3 flex items-center gap-2 text-[12px] text-red-400/70">
              <Loader2 size={12} className="animate-spin" /> {t('comercial.discovery.deep-syncing', locale)}
            </div>
          )}
          <div className="space-y-2">
            {deepEnriched.map(e => {
              const person = e.apollo_data?.persons?.[0]
              return (
                <div key={e.id} className="card p-4 flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink">{e.company_name}</p>
                    {person && (
                      <p className="text-[11px] mt-1 flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                        {[person.first_name, person.last_name].filter(Boolean).join(' ')}
                        {person.title ? ` · ${person.title}` : ''}
                        {person.email && (
                          <span className={clsx('flex items-center gap-1', person.email_verified ? 'text-green-400' : 'text-ink-tertiary')}>
                            <Mail size={10} /> {person.email}
                          </span>
                        )}
                      </p>
                    )}
                    {!e.crm_ready && (
                      <p className="text-[10px] mt-1 italic" style={{ color: 'var(--text-tertiary)' }}>No verified contact for this company</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function LeadGroup({ locale, title, colorClass, leads, added, onAdd, collapsed = false }: {
  locale: Locale
  title: string
  colorClass: string
  leads: DiscoveredLead[]
  added: Set<string>
  onAdd: (l: DiscoveredLead) => void
  collapsed?: boolean
}) {
  const [open, setOpen] = useState(!collapsed)

  return (
    <div className="mb-6">
      <button
        onClick={() => setOpen(o => !o)}
        className={clsx('flex items-center gap-2 mb-3 group', colorClass)}
      >
        <div className="w-1.5 h-1.5 rounded-full bg-current" />
        <span className="text-[11px] font-semibold uppercase tracking-widest">{title}</span>
        <span className="text-[10px] ml-1" style={{ color: 'var(--text-tertiary)' }}>({leads.length})</span>
        <ChevronDown size={12} className={clsx('transition-transform ml-1', !open && '-rotate-90')} style={{ color: 'var(--text-tertiary)' }} />
      </button>

      {open && (
        <div className="space-y-2">
          {leads.map(lead => (
            <DiscoveryLeadRow key={lead.company_name} locale={locale} lead={lead} added={added.has(lead.company_name)} onAdd={onAdd} />
          ))}
        </div>
      )}
    </div>
  )
}

function DiscoveryLeadRow({ locale, lead, added, onAdd }: {
  locale: Locale
  lead: DiscoveredLead
  added: boolean
  onAdd: (l: DiscoveredLead) => void
}) {
  const cls = CLASS_STYLE[lead.classification] ?? CLASS_STYLE.cold

  return (
    <div className="card p-4 flex items-start gap-4">
      {/* Score */}
      <div className="shrink-0 text-center w-12">
        <div className={clsx('text-lg font-bold', cls.text)}>{lead.score}</div>
        <div className={clsx('text-[9px] font-semibold uppercase', cls.text)}>{cls.label}</div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-sm font-medium text-ink">{lead.company_name}</p>
          {lead.company_website && (
            <a href={lead.company_website} target="_blank" rel="noreferrer"
              className="text-[10px] transition-colors" style={{ color: 'var(--text-tertiary)' }}>↗</a>
          )}
        </div>
        {lead.key_person_name && (
          <p className="text-[11px] mb-1" style={{ color: 'var(--text-secondary)' }}>
            {lead.key_person_name}{lead.key_person_title ? ` · ${lead.key_person_title}` : ''}
          </p>
        )}
        <p className="text-[11px] mb-2" style={{ color: 'var(--text-tertiary)' }}>{lead.description}</p>
        <div className="flex flex-wrap gap-1">
          <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)' }}>{lead.industry}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-surface)', color: 'var(--text-tertiary)' }}>📍 {lead.geography}</span>
          {lead.trigger_signals.slice(0, 2).map(s => (
            <span key={s} className="text-[10px] px-1.5 py-0.5 rounded bg-red-400/10 text-red-400 border border-red-400/20">
              ⚡ {s}
            </span>
          ))}
        </div>
        <p className="text-[10px] mt-1.5 italic" style={{ color: 'var(--text-tertiary)' }}>{lead.reason}</p>
      </div>

      {/* Add button */}
      <button
        onClick={() => !added && onAdd(lead)}
        disabled={added}
        className={clsx(
          'shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] transition-all',
          added
            ? 'text-green-400 border border-green-400/20 bg-green-400/8 cursor-default'
            : 'text-red-400 border border-red-400/25 bg-red-400/10 hover:bg-red-400/15'
        )}
      >
        {added ? <><CheckCircle2 size={11} /> {t('comercial.discovery.in-pipeline', locale)}</> : <><Plus size={11} /> {t('comercial.discovery.add', locale)}</>}
      </button>
    </div>
  )
}
