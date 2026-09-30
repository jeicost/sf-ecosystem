'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Loader2, Upload, Download, FileText, Trash2, ChevronDown, ChevronRight, Save, AlertTriangle } from 'lucide-react'
import SectionRewriter from './SectionRewriter'
import { uploadTenderFile } from '@/lib/tenders/upload-client'
import { trackAction } from '@/lib/activity-client'

// Los documentos de la licitación que NO son la memoria del expediente.
//
// Dos usos, el mismo sitio:
//  · subir un documento que ya existe (la memoria del año pasado, un borrador,
//    un anexo a medias) para trabajarlo aquí y bajarlo en Word;
//  · guardar los anexos y declaraciones que acompañan a la oferta.
//
// Todo documento tiene la misma forma —título y secciones—, así que se edita a
// mano, se puede pedir que MIRA mejore una sección, y se exporta igual.

export interface DocSection { titulo: string; contenido: string; nota?: string }
export interface TenderDoc {
  id: string; tender_id: string | null; kind: string; title: string
  sections: DocSection[]; source_filename: string | null; status: string; updated_at: string
}

const KIND_LABEL: Record<string, string> = {
  subido: 'Uploaded', anexo: 'Annex', memoria: 'Proposal', oferta: 'Bid',
}

export default function DocumentsPanel({ clientId, tenderId, brand, fileToUpload, onFileConsumed }: {
  clientId: string; tenderId: string | null; brand: string
  /** Un fichero que llega de fuera (p. ej. una memoria subida por error como pliego). */
  fileToUpload?: File | null
  onFileConsumed?: () => void
}) {
  const [docs, setDocs] = useState<TenderDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [abierto, setAbierto] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [sucio, setSucio] = useState<Record<string, boolean>>({})
  const fileRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const url = tenderId
      ? `/api/tender/documents?clientId=${clientId}&tenderId=${tenderId}`
      : `/api/tender/documents?clientId=${clientId}`
    const res = await fetch(url)
    const data = await res.json()
    if (res.ok) setDocs(data.documents || [])
    setLoading(false)
  }, [clientId, tenderId])
  useEffect(() => { load() }, [load])

  // Fichero que llega desde el paso del pliego: se sube aquí y se baja hasta
  // el panel para que se vea dónde ha ido.
  useEffect(() => {
    if (!fileToUpload) return
    onFileConsumed?.()
    void subir(fileToUpload)
    document.getElementById('documentos')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileToUpload])

  const subir = async (file: File) => {
    setBusy('upload'); setError(null)
    trackAction('/licitaciones', 'subir-documento', clientId, { bytes: file.size, tipo: file.type })
    try {
      const up = await uploadTenderFile(clientId, file)
      if ('error' in up) { setError(up.error); return }
      const res = await fetch('/api/tender/documents/upload', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, tenderId, path: up.path, filename: file.name, mime: file.type }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'No se ha podido leer el documento'); return }
      await load()
      setAbierto(data.document.id)
    } finally {
      setBusy(null)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const guardar = async (doc: TenderDoc) => {
    setBusy(doc.id); setError(null)
    const res = await fetch('/api/tender/documents', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, id: doc.id, title: doc.title, sections: doc.sections }),
    })
    const data = await res.json()
    if (!res.ok) setError(data.error || 'Error')
    else setSucio((s) => ({ ...s, [doc.id]: false }))
    setBusy(null)
  }

  const exportar = async (doc: TenderDoc) => {
    trackAction('/licitaciones', 'exportar-word', clientId, { kind: doc.kind })
    // Se exporta lo GUARDADO: si hay cambios sin guardar, primero se guardan,
    // porque si no se bajaría una versión anterior sin que nadie lo note.
    if (sucio[doc.id]) await guardar(doc)
    setBusy(doc.id + ':export')
    try {
      const res = await fetch('/api/tender/export', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, documentId: doc.id }),
      })
      if (!res.ok) { const d = await res.json().catch(() => ({})); setError(d.error || 'No se ha podido exportar'); return }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${doc.title.replace(/[^\p{L}\p{N}\-_ ]/gu, '').trim() || 'documento'}.docx`
      document.body.appendChild(a); a.click(); a.remove()
      URL.revokeObjectURL(url)
    } finally { setBusy(null) }
  }

  const borrar = async (doc: TenderDoc) => {
    if (!confirm(`Delete “${doc.title}”? This cannot be undone.`)) return
    setBusy(doc.id)
    await fetch(`/api/tender/documents?clientId=${clientId}&id=${doc.id}`, { method: 'DELETE' })
    setBusy(null)
    await load()
  }

  const editar = (docId: string, i: number, contenido: string) => {
    setDocs((prev) => prev.map((d) => d.id !== docId ? d
      : { ...d, sections: d.sections.map((s, idx) => (idx === i ? { ...s, contenido } : s)) }))
    setSucio((s) => ({ ...s, [docId]: true }))
  }

  const pedirMejora = (docId: string, i: number) => async (instruccion: string) => {
    trackAction('/licitaciones', 'mejorar-seccion-documento', clientId, { seccion: i })
    const res = await fetch('/api/tender/rewrite', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, target: 'documento', documentId: docId, sectionIndex: i, instruction: instruccion }),
    })
    const data = await res.json()
    if (!res.ok) return { error: data.error || 'Error' }
    return { propuesta: data.propuesta as string, avisos: (data.avisos || []) as string[] }
  }

  return (
    <div id="documentos" className="mt-6 scroll-mt-6 rounded-2xl border border-line bg-surface p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
          <FileText size={15} style={{ color: brand }} /> Documents
        </h2>
        <div className="flex items-center gap-2">
          {loading && <Loader2 size={13} className="animate-spin text-ink-muted" />}
          <button onClick={() => fileRef.current?.click()} disabled={busy === 'upload'}
            className="flex items-center gap-1.5 rounded-lg bg-page px-3 py-1.5 text-xs text-ink-secondary transition-colors hover:text-ink disabled:opacity-50">
            {busy === 'upload' ? <><Loader2 size={13} className="animate-spin" /> Reading…</> : <><Upload size={13} /> Upload a document</>}
          </button>
          <input ref={fileRef} type="file" accept=".pdf,.docx,.txt,.md,application/pdf" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) subir(f) }} />
        </div>
      </div>
      <p className="mb-3 text-[11px] text-ink-tertiary">
        Upload last year’s proposal or a half-finished draft: it comes back split into editable sections. Ask MIRA to improve any of them, then download it as Word to finish it off.
      </p>

      {error && (
        <p className="mb-3 flex items-start gap-1.5 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">
          <AlertTriangle size={13} className="mt-0.5 shrink-0" /> {error}
        </p>
      )}

      {!loading && docs.length === 0 ? (
        <p className="rounded-xl border border-line-subtle bg-page p-6 text-center text-xs text-ink-muted">No documents yet.</p>
      ) : (
        <div className="space-y-2">
          {docs.map((doc) => {
            const open = abierto === doc.id
            return (
              <div key={doc.id} className="rounded-xl border border-line-subtle bg-page">
                {/* En móvil el título va en su propia línea y las etiquetas y
                    botones debajo: apretados en una sola, el título desaparecía
                    y los botones se montaban sobre "unsaved". */}
                <div className="flex flex-wrap items-center gap-2 px-3 py-2">
                  <button onClick={() => setAbierto(open ? null : doc.id)} className="flex w-full min-w-0 items-center gap-1.5 text-left sm:w-auto sm:flex-1">
                    {open ? <ChevronDown size={13} className="shrink-0 text-ink-muted" /> : <ChevronRight size={13} className="shrink-0 text-ink-muted" />}
                    <span className="truncate text-xs font-medium text-ink">{doc.title}</span>
                  </button>
                  <span className="shrink-0 rounded-full bg-surface px-2 py-0.5 text-[10px] text-ink-tertiary">{KIND_LABEL[doc.kind] || doc.kind}</span>
                  <span className="shrink-0 text-[10px] text-ink-muted">{doc.sections?.length || 0} sections</span>
                  {sucio[doc.id] && <span className="shrink-0 text-[10px] text-amber-400">unsaved</span>}
                  <span className="flex-1 sm:hidden" />
                  {sucio[doc.id] && (
                    <button onClick={() => guardar(doc)} disabled={busy === doc.id}
                      className="flex items-center gap-1.5 rounded-lg bg-surface px-2.5 py-1 text-[11px] text-ink-secondary hover:text-ink disabled:opacity-50">
                      {busy === doc.id ? <Loader2 size={11} className="animate-spin" /> : <Save size={11} />} Save
                    </button>
                  )}
                  <button onClick={() => exportar(doc)} disabled={busy === doc.id + ':export'}
                    className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-medium text-white disabled:opacity-50" style={{ background: brand }}>
                    {busy === doc.id + ':export' ? <Loader2 size={11} className="animate-spin" /> : <Download size={11} />} Word
                  </button>
                  <button onClick={() => borrar(doc)} className="rounded-lg p-1 text-ink-muted transition-colors hover:text-red-400"><Trash2 size={12} /></button>
                </div>

                {open && (
                  <div className="space-y-3 border-t border-line-subtle p-3">
                    {(doc.sections || []).map((s, i) => (
                      <div key={i}>
                        <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                          <h4 className="text-xs font-semibold text-ink">{s.titulo}</h4>
                          <SectionRewriter titulo={s.titulo} brand={brand}
                            onRewrite={pedirMejora(doc.id, i)}
                            onAccept={(contenido) => editar(doc.id, i, contenido)} />
                        </div>
                        <textarea value={s.contenido} onChange={(e) => editar(doc.id, i, e.target.value)}
                          rows={Math.min(20, Math.max(4, Math.ceil((s.contenido || '').length / 95)))}
                          className="w-full resize-y rounded-lg border border-line bg-surface p-2.5 text-xs leading-relaxed text-ink-secondary outline-none focus:ring-1 focus:ring-ink-muted" />
                      </div>
                    ))}
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
