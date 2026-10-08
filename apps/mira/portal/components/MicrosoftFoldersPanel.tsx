'use client'

import { useCallback, useEffect, useState } from 'react'
import { Loader2, RefreshCw, Trash2, FolderOpen, ChevronRight, ArrowLeft, Plug, AlertTriangle, BarChart3, Link2 } from 'lucide-react'
import { useLocaleContext } from '@/app/locale-provider'
import { t } from '@/lib/i18n'
import type { PublicConnection } from '@/lib/microsoft/connections'

// Carpetas de OneDrive / SharePoint conectadas a la marca (conector Microsoft
// 365, 8-oct-2026). Hermano de DriveFoldersPanel: cuentas conectadas, alta de
// carpeta por enlace o navegando, sincronización por tandas con avance e
// inventario de lo que hay dentro sin haberlo leído.

interface Inventory {
  files: number; folders: number; readable: number; legacy: number; total_bytes: number
  by_extension: Record<string, number>; by_year: Record<string, number>
  top_folders: Array<{ name: string; files: number }>; oldest: string | null; newest: string | null
}

interface FolderRow {
  id: string
  connection_id: string
  folder_name: string | null
  web_url: string | null
  purpose: string
  sync_status: string
  last_synced_at: string | null
  last_error: string | null
  files_total: number
  files_synced: number
  pending: number
  inventory: Inventory | null
  microsoft_connections?: { account_email: string; is_authorized: boolean } | null
}

interface BrowseRoot { kind: string; driveId: string; itemId: string; name: string; webUrl?: string }
interface BrowseFolder { driveId: string; itemId: string; name: string; childCount: number | null }

const PURPOSES = ['commercial', 'references', 'brand', 'training', 'other']

function formatBytes(n: number): string {
  if (n > 1e9) return `${(n / 1e9).toFixed(1)} GB`
  if (n > 1e6) return `${(n / 1e6).toFixed(0)} MB`
  return `${Math.max(1, Math.round(n / 1e3))} KB`
}

export default function MicrosoftFoldersPanel({ clientId, returnTo = '/brand-brain' }: { clientId: string; returnTo?: string }) {
  const { locale } = useLocaleContext()
  const tr = (k: string, vars: Record<string, string | number> = {}) => Object.entries(vars).reduce((s, [a, b]) => s.replace(`{${a}}`, String(b)), t(k, locale))

  const [configured, setConfigured] = useState(true)
  const [connections, setConnections] = useState<PublicConnection[]>([])
  const [folders, setFolders] = useState<FolderRow[]>([])
  const [loading, setLoading] = useState(true)
  const [link, setLink] = useState('')
  const [connectionId, setConnectionId] = useState('')
  const [purpose, setPurpose] = useState('commercial')
  const [adding, setAdding] = useState(false)
  const [syncing, setSyncing] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [showInventory, setShowInventory] = useState<string | null>(null)
  // Navegador de carpetas
  const [browsing, setBrowsing] = useState(false)
  const [roots, setRoots] = useState<BrowseRoot[] | null>(null)
  const [stack, setStack] = useState<Array<{ driveId: string; itemId: string; name: string }>>([])
  const [children, setChildren] = useState<BrowseFolder[] | null>(null)
  const [childFiles, setChildFiles] = useState(0)
  const [browseBusy, setBrowseBusy] = useState(false)

  const load = useCallback(async () => {
    if (!clientId) return
    try {
      const [c, f] = await Promise.all([
        fetch(`/api/integrations/microsoft/connections?clientId=${clientId}`).then((r) => (r.ok ? r.json() : null)),
        fetch(`/api/integrations/microsoft/folders?clientId=${clientId}`).then((r) => (r.ok ? r.json() : null)),
      ])
      if (c) { setConfigured(c.configured !== false); setConnections(c.connections || []) }
      if (f) setFolders(f.folders || [])
      const usable = (c?.connections || []).filter((x: PublicConnection) => x.is_authorized && x.can_files)
      setConnectionId((prev) => prev || usable[0]?.id || '')
    } catch { /* silencioso */ } finally {
      setLoading(false)
    }
  }, [clientId])

  useEffect(() => {
    load()
    const params = new URLSearchParams(window.location.search)
    const ms = params.get('microsoft')
    if (ms === 'connected') {
      setMessage({ type: 'ok', text: t('integrations.microsoft-connected', locale) })
      window.history.replaceState({}, '', window.location.pathname)
    } else if (ms === 'admin_consent') {
      setMessage({ type: 'ok', text: t('integrations.microsoft-admin-consent', locale) })
      window.history.replaceState({}, '', window.location.pathname)
    } else if (ms === 'error') {
      setMessage({ type: 'err', text: `Microsoft 365: ${params.get('reason') || t('integrations.microsoft-error-reason', locale)}` })
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [load, locale])

  async function connectAccount(loginHint?: string) {
    setMessage(null)
    try {
      const res = await fetch('/api/integrations/microsoft/authorize', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, purpose: 'files', returnTo, loginHint }),
      })
      const json = await res.json()
      if (res.status === 503) { setConfigured(false); setMessage({ type: 'err', text: t('integrations.microsoft-not-configured', locale) }); return }
      if (!res.ok || !json.authUrl) throw new Error(json.error || t('integrations.microsoft-start-error', locale))
      window.location.href = json.authUrl
    } catch (e) {
      setMessage({ type: 'err', text: e instanceof Error ? e.message : t('integrations.microsoft-start-error', locale) })
    }
  }

  async function disconnectAccount(id: string) {
    if (!confirm(t('ms.folders.disconnect-confirm', locale))) return
    await fetch(`/api/integrations/microsoft/connections?clientId=${clientId}&id=${id}`, { method: 'DELETE' })
    await load()
  }

  async function addFolder(body: Record<string, string>) {
    if (adding) return
    setAdding(true); setMessage(null)
    try {
      const res = await fetch('/api/integrations/microsoft/folders', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, connectionId, purpose, ...body }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Could not add the folder')
      setLink(''); setBrowsing(false)
      setMessage({ type: 'ok', text: tr('ms.folders.added', { name: json.folder?.folder_name || '' }) })
      await load()
    } catch (e) {
      setMessage({ type: 'err', text: e instanceof Error ? e.message : 'Error' })
    } finally {
      setAdding(false)
    }
  }

  async function handleSync(id: string) {
    setSyncing(id); setMessage(null)
    try {
      const res = await fetch('/api/integrations/microsoft/folders/sync', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Sync failed')
      setMessage({ type: 'ok', text: tr('ms.folders.sync-result', { ingested: json.ingested ?? 0, total: json.filesTotal ?? 0, remaining: json.remaining ?? 0, more: t(json.remaining > 0 ? 'ms.folders.sync-more' : 'ms.folders.sync-done', locale) }) })
      await load()
    } catch (e) {
      setMessage({ type: 'err', text: e instanceof Error ? e.message : 'Sync error' })
      await load()
    } finally {
      setSyncing(null)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(t('ms.folders.remove-confirm', locale))) return
    await fetch(`/api/integrations/microsoft/folders?clientId=${clientId}&id=${id}`, { method: 'DELETE' })
    await load()
  }

  // ── navegador ──
  async function openBrowser() {
    setBrowsing(true); setRoots(null); setStack([]); setChildren(null); setBrowseBusy(true)
    try {
      const res = await fetch(`/api/integrations/microsoft/browse?clientId=${clientId}&connectionId=${connectionId}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Error')
      setRoots(json.roots || [])
    } catch (e) {
      setMessage({ type: 'err', text: e instanceof Error ? e.message : 'Error' }); setBrowsing(false)
    } finally { setBrowseBusy(false) }
  }
  async function openFolder(f: { driveId: string; itemId: string; name: string }) {
    setBrowseBusy(true)
    try {
      const res = await fetch(`/api/integrations/microsoft/browse?clientId=${clientId}&connectionId=${connectionId}&driveId=${encodeURIComponent(f.driveId)}&itemId=${encodeURIComponent(f.itemId)}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Error')
      setStack((s) => [...s, f]); setChildren(json.folders || []); setChildFiles(json.files || 0)
    } catch (e) {
      setMessage({ type: 'err', text: e instanceof Error ? e.message : 'Error' })
    } finally { setBrowseBusy(false) }
  }
  async function goBack() {
    const next = stack.slice(0, -1)
    setStack(next)
    if (next.length === 0) { setChildren(null); return }
    const parent = next[next.length - 1]
    setBrowseBusy(true)
    try {
      const res = await fetch(`/api/integrations/microsoft/browse?clientId=${clientId}&connectionId=${connectionId}&driveId=${encodeURIComponent(parent.driveId)}&itemId=${encodeURIComponent(parent.itemId)}`)
      const json = await res.json()
      setChildren(json.folders || []); setChildFiles(json.files || 0)
    } finally { setBrowseBusy(false) }
  }

  const usable = connections.filter((c) => c.is_authorized && c.can_files)
  const current = stack[stack.length - 1]

  return (
    <div className="space-y-4 p-5 rounded-xl border border-line bg-card">
      <div className="rounded-xl border border-line bg-surface p-3.5 text-[11px] text-ink-tertiary space-y-1">
        <p className="font-medium text-ink-secondary">🪟 {t('ms.folders.how', locale)}</p>
        <p>· {t('ms.folders.how-1', locale)}</p>
        <p>· {t('ms.folders.how-2', locale)}</p>
        <p>· {t('ms.folders.how-3', locale)}</p>
      </div>

      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-ink font-semibold text-sm">📂 {t('ms.folders.title', locale)}</p>
          <p className="text-ink-secondary text-xs mt-1">{t('ms.folders.desc', locale)}</p>
        </div>
        <button onClick={() => connectAccount()} className="shrink-0 px-3 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition inline-flex items-center gap-1.5">
          <Plug size={12} /> {t(connections.length ? 'ms.folders.connect-account' : 'ms.folders.connect-account', locale)}
        </button>
      </div>

      {!configured && (
        <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-400">{t('integrations.microsoft-not-configured', locale)}</p>
      )}
      {message && (
        <p className={`rounded-lg px-3 py-2 text-xs ${message.type === 'ok' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>{message.text}</p>
      )}

      {/* Cuentas */}
      <div>
        <p className="text-[11px] uppercase tracking-wide text-ink-tertiary mb-1.5">{t('ms.folders.accounts', locale)}</p>
        {connections.length === 0 ? (
          <p className="text-xs text-ink-muted">{t('ms.folders.no-accounts', locale)}</p>
        ) : (
          <div className="space-y-1">
            {connections.map((c) => (
              <div key={c.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-line-subtle px-3 py-1.5 text-xs">
                <span className="font-medium text-ink">{c.account_email}</span>
                {c.account_name && <span className="text-ink-tertiary">· {c.account_name}</span>}
                <span className="rounded-full bg-surface px-2 py-px text-[10px] text-ink-tertiary">{[c.can_files ? 'files' : null, c.can_mail ? 'mail' : null].filter(Boolean).join(' + ') || '—'}</span>
                {!c.is_authorized && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-amber-400"><AlertTriangle size={10} /> {t('emailops.ms.needs-reauth', locale)}</span>
                )}
                <span className="ml-auto flex items-center gap-1">
                  {!c.is_authorized && <button onClick={() => connectAccount(c.account_email)} className="rounded-lg px-2 py-1 text-[11px] text-ink-secondary hover:bg-surface hover:text-ink">{t('ms.folders.reconnect', locale)}</button>}
                  <button onClick={() => disconnectAccount(c.id)} className="rounded-lg px-2 py-1 text-[11px] text-ink-muted hover:bg-surface hover:text-red-400">{t('ms.folders.disconnect-account', locale)}</button>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Alta de carpeta */}
      {usable.length > 0 && (
        <div className="space-y-2 rounded-xl border border-line-subtle p-3">
          <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
            <label className="flex flex-col gap-1 text-[11px] text-ink-tertiary">
              {t('ms.folders.link', locale)}
              <input value={link} onChange={(e) => setLink(e.target.value)} placeholder={t('ms.folders.link-placeholder', locale)}
                className="rounded-lg border border-line bg-page px-2.5 py-1.5 text-sm text-ink outline-none" />
            </label>
            <label className="flex flex-col gap-1 text-[11px] text-ink-tertiary">
              {t('ms.folders.account', locale)}
              <select value={connectionId} onChange={(e) => setConnectionId(e.target.value)} className="rounded-lg border border-line bg-page px-2.5 py-1.5 text-sm text-ink outline-none">
                {usable.map((c) => <option key={c.id} value={c.id}>{c.account_email}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-[11px] text-ink-tertiary">
              {t('ms.folders.purpose', locale)}
              <select value={purpose} onChange={(e) => setPurpose(e.target.value)} className="rounded-lg border border-line bg-page px-2.5 py-1.5 text-sm text-ink outline-none">
                {PURPOSES.map((p) => <option key={p} value={p}>{t(`ms.folders.purpose.${p}`, locale)}</option>)}
              </select>
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => addFolder({ link: link.trim() })} disabled={!link.trim() || adding || !connectionId}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500 disabled:opacity-50">
              {adding ? <Loader2 size={12} className="animate-spin" /> : <Link2 size={12} />} {t('ms.folders.add', locale)}
            </button>
            <button onClick={openBrowser} disabled={!connectionId || browseBusy}
              className="inline-flex items-center gap-1.5 rounded-lg bg-surface px-3 py-1.5 text-xs text-ink-secondary hover:text-ink disabled:opacity-50">
              <FolderOpen size={12} /> {t('ms.folders.browse', locale)}
            </button>
          </div>

          {browsing && (
            <div className="rounded-xl border border-line bg-surface p-3 text-xs">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="font-medium text-ink">{t('ms.folders.browse-title', locale)}{current ? ` · ${stack.map((s) => s.name).join(' / ')}` : ''}</p>
                <button onClick={() => setBrowsing(false)} className="text-ink-muted hover:text-ink">✕</button>
              </div>
              {browseBusy && <p className="inline-flex items-center gap-1.5 text-ink-tertiary"><Loader2 size={12} className="animate-spin" /> {t('ms.folders.browse-loading', locale)}</p>}
              {!browseBusy && children === null && roots && (
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-wide text-ink-tertiary">{t('ms.folders.browse-roots', locale)}</p>
                  {roots.map((r) => (
                    <button key={`${r.driveId}:${r.itemId}`} onClick={() => openFolder(r)} className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left hover:bg-card">
                      <span className="truncate">{r.kind === 'onedrive' ? '☁️' : r.kind === 'site' ? '🏢' : '🔗'} {r.name}</span><ChevronRight size={12} />
                    </button>
                  ))}
                </div>
              )}
              {!browseBusy && children !== null && current && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <button onClick={goBack} className="inline-flex items-center gap-1 text-ink-secondary hover:text-ink"><ArrowLeft size={12} /> {t('ms.folders.browse-back', locale)}</button>
                    <button onClick={() => addFolder({ driveId: current.driveId, itemId: current.itemId })} disabled={adding}
                      className="rounded-lg bg-blue-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-blue-500 disabled:opacity-50">{t('ms.folders.browse-use', locale)}</button>
                  </div>
                  <p className="text-[10px] text-ink-tertiary">{tr('ms.folders.browse-files', { n: childFiles })}</p>
                  {children.length === 0 && <p className="text-ink-muted">{t('ms.folders.browse-empty', locale)}</p>}
                  {children.map((f) => (
                    <button key={f.itemId} onClick={() => openFolder(f)} className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left hover:bg-card">
                      <span className="truncate">📁 {f.name}{f.childCount !== null ? <span className="text-ink-muted"> · {f.childCount}</span> : null}</span><ChevronRight size={12} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Carpetas */}
      {loading ? (
        <p className="text-xs text-ink-muted inline-flex items-center gap-1.5"><Loader2 size={12} className="animate-spin" /></p>
      ) : folders.length === 0 ? (
        <p className="text-xs text-ink-muted">{t('ms.folders.empty', locale)}</p>
      ) : (
        <div className="space-y-2">
          {folders.map((f) => {
            const inv = f.inventory
            const statusColor = f.sync_status === 'completed' ? 'text-emerald-400 bg-emerald-500/10' : f.sync_status === 'error' ? 'text-red-400 bg-red-500/10' : f.sync_status === 'pending' ? 'text-ink-tertiary bg-surface' : 'text-blue-400 bg-blue-500/10'
            return (
              <div key={f.id} className="rounded-xl border border-line-subtle px-3 py-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-ink">📁 {f.folder_name || '—'}</span>
                  <span className="rounded-full bg-surface px-2 py-px text-[10px] text-ink-tertiary">{t(`ms.folders.purpose.${f.purpose}`, locale)}</span>
                  <span className={`rounded-full px-2 py-px text-[10px] ${statusColor}`}>{t(`ms.folders.status.${f.sync_status}`, locale)}</span>
                  {f.microsoft_connections?.account_email && <span className="text-[10px] text-ink-muted">{f.microsoft_connections.account_email}</span>}
                  <span className="ml-auto flex items-center gap-1">
                    {inv && (
                      <button onClick={() => setShowInventory(showInventory === f.id ? null : f.id)} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-ink-secondary hover:bg-surface hover:text-ink"><BarChart3 size={12} /> {t('ms.folders.inventory', locale)}</button>
                    )}
                    <button onClick={() => handleSync(f.id)} disabled={syncing !== null} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-ink-secondary hover:bg-surface hover:text-ink disabled:opacity-50">
                      {syncing === f.id ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />} {t(syncing === f.id ? 'ms.folders.syncing' : 'ms.folders.sync', locale)}
                    </button>
                    <button onClick={() => handleDelete(f.id)} className="rounded-lg p-1 text-ink-muted hover:bg-surface hover:text-red-400" title={t('ms.folders.remove', locale)}><Trash2 size={12} /></button>
                  </span>
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink-tertiary">
                  <span>{tr('ms.folders.progress', { synced: f.files_synced, total: f.files_total })}</span>
                  {f.pending > 0 && <span>· {tr('ms.folders.progress-pending', { n: f.pending })}</span>}
                  <span>· {f.last_synced_at ? tr('ms.folders.last-sync', { when: new Date(f.last_synced_at).toLocaleString(locale === 'es' ? 'es-ES' : 'en-GB') }) : t('ms.folders.never', locale)}</span>
                  {f.web_url && <a href={f.web_url} target="_blank" rel="noopener noreferrer" className="underline hover:text-ink">SharePoint ↗</a>}
                </div>
                {f.files_total > 0 && (
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface">
                    <div className="h-full rounded-full bg-blue-500" style={{ width: `${Math.min(100, Math.round((f.files_synced / Math.max(1, inv?.readable || f.files_total)) * 100))}%` }} />
                  </div>
                )}
                {f.last_error && (
                  <p className="mt-1.5 flex items-start gap-1.5 rounded-lg bg-red-500/10 px-2.5 py-1.5 text-[11px] text-red-400"><AlertTriangle size={12} className="mt-0.5 shrink-0" /> {f.last_error}</p>
                )}
                {showInventory === f.id && inv && (
                  <div className="mt-2 grid gap-3 rounded-lg bg-surface p-3 text-[11px] text-ink-secondary sm:grid-cols-3">
                    <div>
                      <p className="text-ink font-medium">{inv.files} {t('ms.folders.inventory.files', locale)}</p>
                      <p>{inv.readable} {t('ms.folders.inventory.readable', locale)} · {inv.legacy} {t('ms.folders.inventory.legacy', locale)}</p>
                      <p>{t('ms.folders.inventory.size', locale)}: {formatBytes(inv.total_bytes)}</p>
                      {inv.oldest && inv.newest && <p>{tr('ms.folders.inventory.range', { from: inv.oldest.slice(0, 10), to: inv.newest.slice(0, 10) })}</p>}
                    </div>
                    <div>
                      <p className="text-ink font-medium">{t('ms.folders.inventory.types', locale)}</p>
                      {Object.entries(inv.by_extension).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([ext, n]) => <p key={ext}>.{ext}: {n}</p>)}
                      <p className="mt-1 text-ink font-medium">{t('ms.folders.inventory.years', locale)}</p>
                      <p>{Object.entries(inv.by_year).sort().map(([y, n]) => `${y}: ${n}`).join(' · ')}</p>
                    </div>
                    <div>
                      <p className="text-ink font-medium">{t('ms.folders.inventory.top', locale)}</p>
                      {inv.top_folders.slice(0, 10).map((tf) => <p key={tf.name} className="truncate">{tf.name}: {tf.files}</p>)}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
