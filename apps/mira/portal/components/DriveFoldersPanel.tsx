'use client'

import { useCallback, useEffect, useState } from 'react'

const PURPOSES: Record<string, { label: string; icon: string }> = {
  references: { label: 'Referencias', icon: '📁' },
  brand: { label: 'Marca', icon: '🎨' },
  logos: { label: 'Logos', icon: '🔷' },
  deliverables: { label: 'Entregables', icon: '📦' },
  training: { label: 'Entrenamiento', icon: '🧠' },
  other: { label: 'Otro', icon: '📂' },
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
    } catch { /* silencioso */ }
  }, [clientId])

  useEffect(() => {
    load()
    // Mensaje al volver del OAuth de Google
    const params = new URLSearchParams(window.location.search)
    const drive = params.get('drive')
    if (drive === 'connected') {
      setMessage({ type: 'ok', text: '✅ Google Drive conectado. Ya puedes añadir carpetas por enlace.' })
      window.history.replaceState({}, '', window.location.pathname)
    } else if (drive === 'error') {
      setMessage({ type: 'err', text: `Error conectando Drive: ${params.get('reason') || 'desconocido'}` })
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
      if (!res.ok) throw new Error(json.error || 'No se pudo añadir la carpeta')
      setLink('')
      setMessage({ type: 'ok', text: `Carpeta "${json.folder?.folder_name || 'conectada'}" añadida. Pulsa Sincronizar para ingerir su contenido.` })
      await load()
    } catch (e) {
      setMessage({ type: 'err', text: e instanceof Error ? e.message : 'Error añadiendo carpeta' })
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
      if (!res.ok) throw new Error(json.error || 'Sync falló')
      setMessage({ type: 'ok', text: `✅ ${json.filesSynced ?? 0} documentos sincronizados. El Brain ya tiene el mapa de esta carpeta.` })
      await load()
    } catch (e) {
      setMessage({ type: 'err', text: e instanceof Error ? e.message : 'Error en el sync' })
    } finally {
      setSyncing(null)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Desconectar esta carpeta? Los documentos ya ingeridos se conservan.')) return
    await fetch(`/api/brand-brain/drive/folders?id=${id}`, { method: 'DELETE' })
    await load()
  }

  return (
    <div className="space-y-4 p-5 rounded-xl border border-gray-800 bg-gray-900/60">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-white font-semibold text-sm">📂 Carpetas de Google Drive</p>
          <p className="text-gray-400 text-xs mt-1">
            Pega el enlace de una carpeta de Drive y el Brain la leerá: documentos, referencias y dónde está cada cosa.
          </p>
        </div>
        {connected ? (
          <span className="shrink-0 px-3 py-2 rounded-lg text-xs font-semibold bg-white/5 text-emerald-400 border border-emerald-500/30">
            ✓ Drive conectado
          </span>
        ) : (
          <a
            href="/integrations"
            className="shrink-0 px-3 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition"
          >
            🔗 Conectar en Integraciones
          </a>
        )}
      </div>

      {connected === false && (
        <p className="text-amber-400/80 text-xs">
          La cuenta de Google Drive de este cliente se conecta una sola vez en{' '}
          <a href="/integrations" className="underline">Integraciones</a>. Después, aquí solo pegas enlaces de carpetas.
        </p>
      )}

      <div className="flex flex-col md:flex-row gap-2">
        <input
          value={link}
          onChange={(e) => setLink(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="https://drive.google.com/drive/folders/..."
          className="flex-1 px-3 py-2 rounded-lg bg-black/40 border border-gray-700 text-white text-xs focus:border-emerald-500 outline-none"
        />
        <select
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          className="px-3 py-2 rounded-lg bg-black/40 border border-gray-700 text-white text-xs outline-none"
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
          className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 disabled:text-gray-400 text-white text-xs font-semibold transition"
        >
          {adding ? 'Verificando…' : '+ Conectar carpeta'}
        </button>
      </div>

      {message && (
        <p className={`text-xs ${message.type === 'ok' ? 'text-emerald-400' : 'text-red-400'}`}>
          {message.text}
        </p>
      )}

      {folders.length > 0 && (
        <div className="space-y-2">
          {folders.map((f) => {
            const p = PURPOSES[f.purpose] || PURPOSES.other
            return (
              <div
                key={f.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-black/30 border border-gray-800"
              >
                <span>{p.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs font-medium truncate">
                    {f.folder_name || f.folder_id}
                  </p>
                  <p className="text-gray-500 text-[10px]">
                    {p.label}
                    {f.last_synced_at
                      ? ` · ${f.files_synced} docs · sync ${new Date(f.last_synced_at).toLocaleString('es-ES')}`
                      : ' · sin sincronizar'}
                    {f.sync_status === 'error' && ' · ⚠️ último sync con error'}
                  </p>
                </div>
                <button
                  onClick={() => handleSync(f.id)}
                  disabled={syncing !== null}
                  className="px-3 py-1.5 rounded text-[10px] font-medium bg-white/10 hover:bg-white/20 disabled:opacity-40 text-white transition"
                >
                  {syncing === f.id ? 'Sincronizando…' : '↻ Sincronizar'}
                </button>
                <button
                  onClick={() => handleDelete(f.id)}
                  className="px-2 py-1.5 rounded text-[10px] text-gray-500 hover:text-red-400 transition"
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
