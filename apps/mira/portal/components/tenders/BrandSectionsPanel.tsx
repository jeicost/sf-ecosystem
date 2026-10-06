'use client'

import { useEffect, useRef, useState } from 'react'
import { LayoutTemplate, Loader2, Plus, Trash2, Upload } from 'lucide-react'
import { uploadTenderFile, removeTenderFile } from '@/lib/tenders/upload-client'
import { trackAction } from '@/lib/activity-client'

/**
 * Páginas con diseño propio de la empresa (Carlos, 6-oct-2026): certificaciones,
 * flota, organigrama, red de agencias… maquetadas por su diseñador. Se suben
 * aquí (PDF o imagen), con un título y los temas que tratan; el redactor las
 * coloca donde corresponde ([[DISEÑO:id]]) y el Word las inserta como páginas
 * completas o como figura. Las marcadas «siempre» van como anexo aunque nadie
 * las coloque.
 *
 * Mismo patrón que TeachPanel/TemplateSettings: carga perezosa al abrir; si la
 * carga falla se para y se ofrece Retry; al cambiar de marca se descarta todo.
 */

interface Pagina { path: string; w: number; h: number; type: 'png' | 'jpg' }
interface Seccion {
  id: string; title: string; keywords: string; placement: 'page' | 'figure'; always_include: boolean
  pages: Pagina[]; source_filename: string | null; active: boolean; thumb_url: string | null
}

const MAX_PAGINAS = 30

export default function BrandSectionsPanel({ clientId, brand }: { clientId: string; brand: string }) {
  const [open, setOpen] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadFailed, setLoadFailed] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [items, setItems] = useState<Seccion[]>([])
  const [busy, setBusy] = useState<string | null>(null)

  // Alta
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [keywords, setKeywords] = useState('')
  const [placement, setPlacement] = useState<'page' | 'figure'>('page')
  const [always, setAlways] = useState(false)
  const [progreso, setProgreso] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const clientIdRef = useRef(clientId)
  clientIdRef.current = clientId
  useEffect(() => { setLoaded(false); setLoading(false); setLoadFailed(false); setErr(null); setItems([]); setFile(null); setTitle(''); setKeywords(''); setProgreso(null) }, [clientId])

  useEffect(() => {
    if (!open || loaded || loading || loadFailed) return
    setLoading(true)
    const lanzadaPara = clientId
    const cancelado = () => clientIdRef.current !== lanzadaPara
    ;(async () => {
      try {
        const res = await fetch(`/api/tender/brand-sections?clientId=${clientId}`)
        const data = await res.json()
        if (cancelado()) return
        if (!res.ok) { setErr(data.error || 'Could not load'); setLoadFailed(true); return }
        setItems(data.sections || [])
        setLoaded(true)
      } catch { if (!cancelado()) { setErr('Network error'); setLoadFailed(true) } } finally { if (!cancelado()) setLoading(false) }
    })()
  }, [open, loaded, loading, loadFailed, clientId])

  const elegir = (f: File | null) => {
    setFile(f); setErr(null)
    if (f && !title) setTitle(f.name.replace(/\.[a-z0-9]+$/i, '').replace(/[_-]+/g, ' ').trim())
  }

  const anadir = async () => {
    if (!file || !title.trim()) return
    setBusy('add'); setErr(null); setProgreso(null)
    const subidas: string[] = []
    try {
      // PDF → una imagen por página, en el navegador; imagen → tal cual.
      let blobs: { blob: Blob; nombre: string }[] = []
      if (file.type === 'application/pdf' || /\.pdf$/i.test(file.name)) {
        const { rasterizarPdf } = await import('@/lib/tenders/pdf-rasterize-client')
        setProgreso('Converting PDF pages…')
        const paginas = await rasterizarPdf(file, { maxPaginas: MAX_PAGINAS, onProgress: (n, t) => setProgreso(`Converting page ${n} of ${t}…`) })
        blobs = paginas.map((p) => ({ blob: p.blob, nombre: `${file.name.replace(/\.pdf$/i, '')}-p${String(p.n).padStart(2, '0')}.jpg` }))
      } else if (/^image\/(png|jpe?g)$/.test(file.type) || /\.(png|jpe?g)$/i.test(file.name)) {
        blobs = [{ blob: file, nombre: file.name }]
      } else {
        setErr('Upload a PDF or a PNG/JPG image.'); return
      }
      for (let i = 0; i < blobs.length; i++) {
        setProgreso(`Uploading ${i + 1} of ${blobs.length}…`)
        const f = new File([blobs[i].blob], blobs[i].nombre, { type: blobs[i].blob.type || 'image/jpeg' })
        const up = await uploadTenderFile(clientId, f)
        if ('error' in up) { setErr(up.error); for (const p of subidas) await removeTenderFile(clientId, p); return }
        subidas.push(up.path)
      }
      setProgreso('Saving…')
      const res = await fetch('/api/tender/brand-sections', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, title: title.trim(), keywords: keywords.trim(), placement, always_include: always, pages: subidas.map((path) => ({ path })), source_filename: file.name }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setErr(data.error || 'Could not save'); for (const p of subidas) await removeTenderFile(clientId, p); return }
      setItems((prev) => [...prev, data.section as Seccion])
      setFile(null); setTitle(''); setKeywords(''); setAlways(false); setPlacement('page')
      if (fileRef.current) fileRef.current.value = ''
      trackAction('/licitaciones', 'pagina-disenada-alta', clientId, { pages: subidas.length, placement })
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not process the file')
      for (const p of subidas) await removeTenderFile(clientId, p)
    } finally { setBusy(null); setProgreso(null) }
  }

  const patch = async (id: string, cambios: Partial<Pick<Seccion, 'title' | 'keywords' | 'placement' | 'always_include' | 'active'>>) => {
    setBusy(id); setErr(null)
    try {
      const res = await fetch('/api/tender/brand-sections', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, id, ...cambios }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setErr(data.error || 'Could not save'); return }
      setItems((prev) => prev.map((s) => (s.id === id ? { ...s, ...(data.section as Seccion) } : s)))
    } catch { setErr('Network error') } finally { setBusy(null) }
  }

  const borrar = async (s: Seccion) => {
    if (!confirm(`Remove “${s.title}”? The Word files generated from now on will not include it.`)) return
    setBusy(s.id); setErr(null)
    try {
      const res = await fetch('/api/tender/brand-sections', {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, id: s.id }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setErr(data.error || 'Could not remove'); return }
      setItems((prev) => prev.filter((x) => x.id !== s.id))
      trackAction('/licitaciones', 'pagina-disenada-baja', clientId)
    } catch { setErr('Network error') } finally { setBusy(null) }
  }

  const input = 'w-full rounded-xl border border-line bg-page px-3 py-2 text-[12.5px] text-ink outline-none focus:ring-1 focus:ring-ink-muted'
  const label = 'mb-1 block text-[11px] font-medium text-ink-secondary'

  return (
    <div className="mb-6 rounded-2xl border border-line bg-surface p-5">
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between gap-3 text-left">
        <span>
          <span className="flex items-center gap-2 text-sm font-semibold text-ink"><LayoutTemplate size={15} style={{ color: brand }} /> Designed pages</span>
          <span className="mt-0.5 block text-xs text-ink-tertiary">Pages your designer already laid out (certifications, fleet, organisation chart…). MIRA places them where they belong and the Word file includes them as they are.</span>
        </span>
        <span className="shrink-0 text-ink-muted">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="mt-4">
          {loading ? (
            <div className="flex h-24 items-center justify-center"><Loader2 size={18} className="animate-spin text-ink-muted" /></div>
          ) : loaded ? (
            <>
              {items.length === 0 ? (
                <p className="rounded-xl border border-dashed border-line px-3 py-3 text-[11.5px] text-ink-muted">
                  No designed pages yet. Upload a PDF (one image per page) or a PNG/JPG, give it a title and the topics it covers.
                </p>
              ) : (
                <ul className="divide-y divide-line-subtle rounded-xl border border-line">
                  {items.map((s) => (
                    <li key={s.id} className={`flex items-start gap-3 px-3 py-2.5 ${s.active ? '' : 'opacity-60'}`}>
                      {s.thumb_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={s.thumb_url} alt="" className="h-16 w-12 shrink-0 rounded border border-line object-cover" />
                      ) : <div className="h-16 w-12 shrink-0 rounded border border-line bg-page" />}
                      <div className="min-w-0 flex-1">
                        <input value={s.title} onChange={(e) => setItems((prev) => prev.map((x) => (x.id === s.id ? { ...x, title: e.target.value } : x)))}
                          onBlur={(e) => { const t = e.target.value.trim(); if (t && t !== s.title) patch(s.id, { title: t }) }}
                          className="w-full bg-transparent text-[12.5px] font-semibold text-ink outline-none" maxLength={200} />
                        <input value={s.keywords} placeholder="Topics (comma-separated): quality, ISO, environment…"
                          onChange={(e) => setItems((prev) => prev.map((x) => (x.id === s.id ? { ...x, keywords: e.target.value } : x)))}
                          onBlur={(e) => { if (e.target.value !== s.keywords) patch(s.id, { keywords: e.target.value }) }}
                          className="mt-0.5 w-full bg-transparent text-[11.5px] text-ink-secondary outline-none placeholder:text-ink-muted" maxLength={500} />
                        <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[11px] text-ink-muted">
                          <span>{s.pages.length} page{s.pages.length === 1 ? '' : 's'}{s.source_filename ? ` · ${s.source_filename}` : ''}</span>
                          <select value={s.placement} onChange={(e) => patch(s.id, { placement: e.target.value as 'page' | 'figure' })}
                            className="rounded-md border border-line bg-page px-1.5 py-0.5 text-[11px] text-ink-secondary">
                            <option value="page">Full page</option>
                            <option value="figure">Figure in the text</option>
                          </select>
                          <label className="flex items-center gap-1"><input type="checkbox" checked={s.always_include} onChange={(e) => patch(s.id, { always_include: e.target.checked })} /> Always include (annex)</label>
                          <label className="flex items-center gap-1"><input type="checkbox" checked={s.active} onChange={(e) => patch(s.id, { active: e.target.checked })} /> Active</label>
                          <span className="font-mono text-[10px] text-ink-muted" title="Marker MIRA writes in the text">[[DISEÑO:{s.id.slice(0, 8)}…]]</span>
                        </div>
                      </div>
                      <button onClick={() => borrar(s)} disabled={busy === s.id} title="Remove"
                        className="shrink-0 rounded-lg p-1 text-ink-muted transition-colors hover:text-red-400 disabled:opacity-50">
                        {busy === s.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {/* Alta */}
              <div className="mt-4 rounded-xl border border-line bg-page p-3">
                <p className="mb-2 text-xs font-medium text-ink-secondary">Add a designed page</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <input ref={fileRef} type="file" accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg" className="hidden"
                      onChange={(e) => elegir(e.target.files?.[0] || null)} />
                    <button onClick={() => fileRef.current?.click()} disabled={busy === 'add'}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-line px-3 py-3 text-xs text-ink-secondary transition-colors hover:text-ink disabled:opacity-50">
                      <Upload size={14} /> {file ? file.name : 'Choose a PDF or a PNG/JPG image'}
                    </button>
                  </div>
                  <div>
                    <label className={label}>Title</label>
                    <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} placeholder="Certifications ISO 9001 / 14001 / 45001" className={input} />
                  </div>
                  <div>
                    <label className={label}>Topics it covers</label>
                    <input value={keywords} onChange={(e) => setKeywords(e.target.value)} maxLength={500} placeholder="quality, environment, certifications" className={input} />
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-[11.5px] text-ink-secondary sm:col-span-2">
                    <label className="flex items-center gap-1.5"><input type="radio" checked={placement === 'page'} onChange={() => setPlacement('page')} /> Full page, as designed</label>
                    <label className="flex items-center gap-1.5"><input type="radio" checked={placement === 'figure'} onChange={() => setPlacement('figure')} /> Figure inside the text</label>
                    <label className="flex items-center gap-1.5"><input type="checkbox" checked={always} onChange={(e) => setAlways(e.target.checked)} /> Always include as an annex</label>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <p className="text-[11px] text-ink-muted">{progreso || `PDF pages are converted in your browser (max ${MAX_PAGINAS}). MIRA writes the marker in the text; the Word file replaces it with the page.`}</p>
                  <button onClick={anadir} disabled={busy === 'add' || !file || !title.trim()}
                    className="flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50" style={{ background: brand }}>
                    {busy === 'add' ? <><Loader2 size={13} className="animate-spin" /> Adding</> : <><Plus size={13} /> Add</>}
                  </button>
                </div>
              </div>
            </>
          ) : null}
          {err && (
            <p className="mt-2 flex items-center gap-2 text-xs text-red-400">
              {err}
              {loadFailed && <button onClick={() => { setErr(null); setLoadFailed(false) }} className="rounded-lg bg-page px-2 py-0.5 text-[11px] text-ink-secondary hover:text-ink">Retry</button>}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
