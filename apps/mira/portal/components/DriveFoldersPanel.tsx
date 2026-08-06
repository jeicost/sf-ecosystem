'use client'

import { useCallback, useEffect, useState } from 'react'

const PURPOSES: Record<string, { label: string; icon: string }> = {
  references: { label: 'References', icon: '📁' },
  brand: { label: 'Brand', icon: '🎨' },
  logos: { label: 'Logos', icon: '🔷' },
  deliverables: { label: 'Deliverables', icon: '📦' },
  training: { label: 'Training', icon: '🧠' },
  other: { label: 'Other', icon: '📂' },
}

interface FolderRow {
  id: string
  folder_id: string
  folder_name: string | null
  purpose: string
  sync_status: string
  last_synced_at: string | null
  files_synced: number
}

export default function DriveFoldersPanel({ clientId }: { clientId: string }) {
  const [folders, setFolders] = useState<FolderRow[]>([])
  const [loading, setLoading] = useState(true)
  const [connected, setConnected] = useState<boolean | null>(null)
  const [link, setLink] = useState('')
  const [purpose, setPurpose] = useState('references')
  const [adding, setAdding] = useState(false)
  const [syncing, setSyncing] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const load = useCallback(async () => {
    if (!clientId) return
    try {
      const res = await fetch(`/api/brand-brain/drive/folders?clientId=${clientId}`)
      if (res.ok) {
        const json = await res.json()
        setFolders(json.folders || json.data || [])
        if (typeof json.connected === 'boolean') setConnected(json.connected)
      }
    } catch { /* silencioso */ } finally {
      setLoading(false)
    }
  }, [clientId])

  useEffect(() => {
    load()
    // Mensaje al volver del OAuth de Google
    const params = new URLSearchParams(window.location.search)
    const drive = params.get('drive')
    if (drive === 'connected') {
      setMessage({ type: 'ok', text: '✅ Google Drive connected. You can now add folders by link.' })
      window.history.replaceState({}, '', window.location.pathname)
    } else if (drive === 'error') {
      setMessage({ type: 'err', text: `Error connecting Drive: ${params.get('reason') || 'unknown'}` })
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [load])


  async function handleAdd() {
    if (!link.trim() || adding) return
    setAdding(true)
    setMessage(null)
    try {
      const res = await fetch('/api/brand-brain/drive/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, link: link.trim(), purpose }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Could not add the folder')
      setLink('')
      setMessage({ type: 'ok', text: `Folder "${json.folder?.folder_name || 'conectada'}" added. Hit Sync now to ingest its contents.` })
      await load()
    } catch (e) {
      setMessage({ type: 'err', text: e instanceof Error ? e.message : 'Error adding the folder' })
    } finally {
      setAdding(false)
    }
  }

  async function handleSync(id: string) {
    setSyncing(id)
    setMessage(null)
    try {
      const res = await fetch('/api/brand-brain/drive/folders/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Sync failed')
      setMessage({ type: 'ok', text: `✅ ${json.filesSynced ?? 0} documents synced. The Brain now has the map of this folder.` })
      await load()
    } catch (e) {
      setMessage({ type: 'err', text: e instanceof Error ? e.message : 'Sync error' })
    } finally {
      setSyncing(null)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Disconnect this folder? Documents already ingested are kept.')) return
    await fetch(`/api/brand-brain/drive/folders?id=${id}`, { method: 'DELETE' })
    await load()
  }

  return (
    <div className="space-y-4 p-5 rounded-xl border border-line bg-card">
      {/* P8: el esquema de carpetas por fin visible — cómo alimenta el cerebro */}
      <div className="rounded-xl border border-line bg-surface p-3.5 text-[11px] text-ink-tertiary space-y-1">
        <p className="font-medium text-ink-secondary">📁 How Drive knowledge works</p>
        <p>· <strong>One knowledge folder per client</strong> — free structure (suggested: <em>01 Brand/ · 02 Product/ · 03 References/</em>), max 3 levels deep. Synced automatically every day.</p>
        <p>· Reads <strong>PDF, TXT, MD, CSV, Google Docs, Google Sheets, DOCX and XLSX</strong> (up to 100 files / 20 docs per sync); images are counted but not read.</p>
        <p>· Everything synced is visible to <strong>every agent and report</strong> (unified knowledge index).</p>
        <p>· Each <strong>project</strong> can have its own Knowledge/Deliverables folders too — created from the project page.</p>
      </div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-ink font-semibold text-sm">📂 Google Drive folders</p>
          <p className="text-ink-secondary text-xs mt-1">
            Paste a Drive folder link and the Brain will read it: documents, references, and where everything lives.
          </p>
        </div>
        {connected ? (
          <span className="shrink-0 px-3 py-2 rounded-lg text-xs font-semibold bg-surface text-emerald-400 border border-emerald-500/30">
            ✓ Drive connected
          </span>
        ) : (
          <a
            href="/integrations"
            className="shrink-0 px-3 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition"
          >
            🔗 Connect in Integrations
          </a>
        )}
      </div>

      {connected === false && (
        <p className="text-amber-400/80 text-xs">
          This client&apos;s Google Drive account is connected once, in{' '}
          <a href="/integrations" className="underline">Integrations</a>. After that, you only paste folder links here.
        </p>
      )}

      <div className="flex flex-col md:flex-row gap-2">
        <input
          value={link}
          onChange={(e) => setLink(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="https://drive.google.com/drive/folders/..."
          className="flex-1 px-3 py-2 rounded-lg bg-surface border border-line text-ink text-xs focus:border-emerald-500 outline-none"
        />
        <select
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          className="px-3 py-2 rounded-lg bg-surface border border-line text-ink text-xs outline-none"
        >
          {Object.entries(PURPOSES).map(([value, p]) => (
            <option key={value} value={value}>
              {p.icon} {p.label}
            </option>
          ))}
        </select>
        <button
          onClick={handleAdd}
          disabled={adding || !link.trim()}
          className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-surface-hover disabled:text-ink-secondary text-white text-xs font-semibold transition"
        >
          {adding ? 'Checking…' : '+ Connect folder'}
        </button>
      </div>

      {message && (
        <p className={`text-xs ${message.type === 'ok' ? 'text-emerald-400' : 'text-red-400'}`}>
          {message.text}
        </p>
      )}

      {loading && folders.length === 0 && (
        <div className="flex items-center gap-2 px-3 py-4 text-ink-tertiary text-xs">
          <span className="w-3 h-3 border border-line border-t-ink-secondary rounded-full animate-spin inline-block" />
          Loading folders…
        </div>
      )}

      {!loading && connected && folders.length === 0 && (
        <div className="px-3 py-5 rounded-lg bg-surface border border-dashed border-line text-center">
          <p className="text-ink-secondary text-xs font-medium">No folders connected yet</p>
          <p className="text-ink-tertiary text-[11px] mt-1">
            Paste a Drive folder link above and the Brain will read its contents on the first sync.
          </p>
        </div>
      )}

      {folders.length > 0 && (
        <div className="space-y-2">
          {folders.map((f) => {
            const p = PURPOSES[f.purpose] || PURPOSES.other
            return (
              <div
                key={f.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-surface border border-line"
              >
                <span>{p.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-ink text-xs font-medium truncate">
                    {f.folder_name || f.folder_id}
                  </p>
                  <p className="text-ink-tertiary text-[10px]">
                    {p.label}
                    {f.last_synced_at
                      ? ` · ${f.files_synced} docs · synced ${new Date(f.last_synced_at).toLocaleString('en-US')}`
                      : ' · never synced'}
                    {f.sync_status === 'error' && ' · ⚠️ last sync failed'}
                  </p>
                </div>
                <button
                  onClick={() => handleSync(f.id)}
                  disabled={syncing !== null}
                  className="px-3 py-1.5 rounded text-[10px] font-medium bg-surface hover:bg-surface-hover disabled:opacity-40 text-ink transition"
                >
                  {syncing === f.id ? 'Syncing…' : '↻ Sync now'}
                </button>
                <button
                  onClick={() => handleDelete(f.id)}
                  className="px-2 py-1.5 rounded text-[10px] text-ink-tertiary hover:text-red-400 transition"
                >
                  ✕
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
