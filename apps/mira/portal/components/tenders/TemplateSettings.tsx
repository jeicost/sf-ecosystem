'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Loader2, Save, FileDown, Palette, Upload, Trash2 } from 'lucide-react'
import { trackAction } from '@/lib/activity-client'
import { uploadTenderFile, removeTenderFile } from '@/lib/tenders/upload-client'

/**
 * Plantilla de Word de la marca: lo que viste el .docx que exporta Licitaciones
 * (portada de color, acento de los títulos, razón social, tagline y línea legal
 * del pie). Hasta el 1-oct-2026 el Word salía plano y Usoa lo maquetaba a mano.
 *
 * Mismo patrón que PlaybookPanel (licitaciones/page.tsx): tarjeta plegable,
 * carga perezosa al abrir, y si la carga falla se PARA — nada de reintentos
 * en bucle ni «Save» activo sobre un formulario vacío que machacaría lo
 * guardado. Al cambiar de marca se descarta todo lo anterior.
 *
 * El logo no se edita aquí: viene de los ajustes de marca (clients.logo_url).
 *
 * Desde el 6-oct también la HOJA oficial (.docx con membrete): si está, el Word
 * usa su cabecera, su pie, sus márgenes y su tipografía tal cual.
 */

type Campo = 'company_name' | 'brand_name' | 'tagline' | 'footer_line' | 'cover_color' | 'accent_color' | 'body_font'
type Formulario = Record<Campo, string>

const VACIO: Formulario = { company_name: '', brand_name: '', tagline: '', footer_line: '', cover_color: '', accent_color: '', body_font: '' }
interface Hoja { path: string; name: string }
const HEX = /^#[0-9A-Fa-f]{6}$/

interface Defaults { logo_url: string | null; primary_color: string | null; name: string | null }

export default function TemplateSettings({ clientId, brand }: { clientId: string; brand: string }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<Formulario>(VACIO)
  const [guardado, setGuardado] = useState<Formulario>(VACIO)
  const [defaults, setDefaults] = useState<Defaults | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadFailed, setLoadFailed] = useState(false)
  const [saving, setSaving] = useState(false)
  const [previewing, setPreviewing] = useState(false)
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  // La hoja oficial (.docx): ruta y nombre guardados en la plantilla; se sube aparte.
  const [hoja, setHoja] = useState<Hoja | null>(null)
  const [hojaBusy, setHojaBusy] = useState<string | null>(null)
  const [hojaResumen, setHojaResumen] = useState<string | null>(null)
  const hojaRef = useRef<HTMLInputElement>(null)

  // Marca vigente en cada render: la carga en vuelo la compara con la suya.
  const clientIdRef = useRef(clientId)
  clientIdRef.current = clientId

  // Al cambiar de marca, la plantilla de la anterior no vale: se descarta.
  // También `loading`: con una carga en vuelo, sin esto no se relanzaría para la nueva.
  useEffect(() => { setLoaded(false); setLoading(false); setForm(VACIO); setGuardado(VACIO); setDefaults(null); setSavedAt(null); setErr(null); setLoadFailed(false); setHoja(null); setHojaResumen(null) }, [clientId])

  useEffect(() => {
    if (!open || loaded || loading || loadFailed) return
    setLoading(true)
    // Una respuesta que llega cuando ya se ha cambiado de marca se DESCARTA:
    // si no, el formulario se rellenaría con la razón social y el NIF de la
    // marca anterior y «Save» los escribiría en la nueva. La página además
    // remonta el panel con key={clientId}.
    // No vale un flag en el cleanup: el propio setLoading(true) cambia las
    // dependencias y el cleanup se ejecutaría en la misma tanda, dejando el
    // spinner colgado. Se compara la marca con la que se lanzó con la vigente.
    const lanzadaPara = clientId
    const cancelado = () => clientIdRef.current !== lanzadaPara
    ;(async () => {
      try {
        const res = await fetch(`/api/tender/template?clientId=${clientId}`)
        const data = await res.json()
        if (cancelado()) return
        if (!res.ok) { setErr(data.error || 'Could not load'); setLoadFailed(true); return }
        const t = (data.template || {}) as Partial<Record<Campo | 'letterhead_path' | 'letterhead_name', unknown>>
        const f: Formulario = { ...VACIO }
        for (const k of Object.keys(VACIO) as Campo[]) f[k] = typeof t[k] === 'string' ? (t[k] as string) : ''
        setForm(f); setGuardado(f); setDefaults(data.defaults || null)
        setHoja(typeof t.letterhead_path === 'string' && t.letterhead_path ? { path: t.letterhead_path, name: typeof t.letterhead_name === 'string' ? t.letterhead_name : 'letterhead.docx' } : null)
        setLoaded(true)
      } catch { if (!cancelado()) { setErr('Network error'); setLoadFailed(true) } } finally { if (!cancelado()) setLoading(false) }
    })()
  }, [open, loaded, loading, loadFailed, clientId])

  const dirty = useMemo(() => (Object.keys(VACIO) as Campo[]).some((k) => form[k] !== guardado[k]), [form, guardado])
  const coloresOk = (!form.cover_color || HEX.test(form.cover_color)) && (!form.accent_color || HEX.test(form.accent_color))
  const set = (k: Campo) => (v: string) => setForm((f) => ({ ...f, [k]: v }))
  // Color de reserva que enseña el selector cuando el campo está vacío: el de la marca, o gris neutro.
  const reserva = defaults?.primary_color && HEX.test(defaults.primary_color) ? defaults.primary_color : '#333333'

  const save = async () => {
    if (!loaded || !dirty || !coloresOk) return
    setSaving(true); setErr(null)
    trackAction('/licitaciones', 'plantilla-guardar', clientId)
    try {
      // clientId SIEMPRE en el cuerpo: la ruta resuelve el cliente con él.
      const res = await fetch('/api/tender/template', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, template: form }),
      })
      const data = await res.json()
      if (!res.ok) { setErr(data.error || 'Could not save'); return }
      setGuardado(form)
      setSavedAt(new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }))
    } catch { setErr('Network error') } finally { setSaving(false) }
  }

  const preview = async () => {
    setPreviewing(true); setErr(null)
    trackAction('/licitaciones', 'plantilla-preview', clientId)
    try {
      // La muestra usa lo GUARDADO: si hay cambios sin guardar se avisa en el pie del botón.
      const res = await fetch('/api/tender/export', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, sample: true }),
      })
      if (!res.ok) { const d = await res.json().catch(() => ({})); setErr(d.error || 'Could not build the preview'); return }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = 'Word template preview.docx'
      document.body.appendChild(a); a.click(); a.remove()
      URL.revokeObjectURL(url)
    } catch { setErr('Network error') } finally { setPreviewing(false) }
  }

  const subirHoja = async (file: File) => {
    setHojaBusy('up'); setErr(null); setHojaResumen(null)
    let path: string | null = null
    try {
      if (!/\.docx$/i.test(file.name)) { setErr('The letterhead must be a Word file (.docx).'); return }
      const up = await uploadTenderFile(clientId, file)
      if ('error' in up) { setErr(up.error); return }
      path = up.path
      const res = await fetch('/api/tender/letterhead', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, path, filename: file.name }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setErr(data.error || 'Could not read the letterhead'); return }
      path = null // la ruta ya la gestiona el servidor
      setHoja({ path: data.template.letterhead_path, name: data.template.letterhead_name || file.name })
      const r = data.resumen as { header: boolean; footer: boolean; imagenes: number; bodyFont: string | null }
      setHojaResumen(`Header ${r.header ? 'yes' : 'no'} · footer ${r.footer ? 'yes' : 'no'} · ${r.imagenes} image${r.imagenes === 1 ? '' : 's'}${r.bodyFont ? ` · body font ${r.bodyFont}` : ''}`)
      if (data.template.body_font && !form.body_font) { setForm((f) => ({ ...f, body_font: data.template.body_font })); setGuardado((g) => ({ ...g, body_font: data.template.body_font })) }
      trackAction('/licitaciones', 'hoja-subir', clientId, { header: r.header, footer: r.footer, imagenes: r.imagenes })
    } catch { setErr('Network error') } finally {
      if (path) await removeTenderFile(clientId, path)
      setHojaBusy(null)
      if (hojaRef.current) hojaRef.current.value = ''
    }
  }
  const quitarHoja = async () => {
    if (!hoja || !confirm('Remove the official letterhead? The Word files will go back to the generated header (logo + footer line).')) return
    setHojaBusy('rm'); setErr(null)
    try {
      const res = await fetch('/api/tender/letterhead', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ clientId }) })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setErr(data.error || 'Could not remove'); return }
      setHoja(null); setHojaResumen(null)
      trackAction('/licitaciones', 'hoja-quitar', clientId)
    } catch { setErr('Network error') } finally { setHojaBusy(null) }
  }

  const input = 'w-full rounded-xl border border-line bg-page px-3 py-2 text-[12.5px] text-ink outline-none focus:ring-1 focus:ring-ink-muted'
  const label = 'mb-1 block text-[11px] font-medium text-ink-secondary'

  // Funciones que devuelven JSX, NO componentes: un componente definido dentro
  // del render se remonta en cada tecla y el input pierde el foco.
  const texto = (k: Campo, titulo: string, placeholder?: string) => (
    <div>
      <label className={label}>{titulo}</label>
      <input value={form[k]} onChange={(e) => set(k)(e.target.value)} maxLength={300} placeholder={placeholder} className={input} />
    </div>
  )
  const color = (k: Campo, titulo: string, ayuda: string) => (
    <div>
      <label className={label}>{titulo}</label>
      <div className="flex items-center gap-2">
        <input type="color" value={HEX.test(form[k]) ? form[k] : reserva} onChange={(e) => set(k)(e.target.value.toUpperCase())}
          className="h-9 w-12 shrink-0 cursor-pointer rounded-lg border border-line bg-page p-1" aria-label={`${titulo} picker`} />
        <input value={form[k]} onChange={(e) => set(k)(e.target.value.trim())} placeholder={reserva} maxLength={7} spellCheck={false}
          className={`${input} font-mono uppercase ${form[k] && !HEX.test(form[k]) ? 'border-red-400' : ''}`} />
      </div>
      <p className="mt-1 text-[11px] text-ink-muted">{ayuda}</p>
    </div>
  )

  return (
    <div className="mb-6 rounded-2xl border border-line bg-surface p-5">
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between gap-3 text-left">
        <span>
          <span className="flex items-center gap-2 text-sm font-semibold text-ink"><Palette size={15} style={{ color: brand }} /> Word template</span>
          <span className="mt-0.5 block text-xs text-ink-tertiary">Official letterhead, cover colour, accent, legal name, body font and footer line of the Word files this tool exports (memoria, offer, documents).</span>
        </span>
        <span className="shrink-0 text-ink-muted">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="mt-4">
          {loading ? (
            <div className="flex h-24 items-center justify-center"><Loader2 size={18} className="animate-spin text-ink-muted" /></div>
          ) : loaded ? (
            <>
              {/* Hoja oficial: manda sobre cabecera, pie, márgenes y tipografía. */}
              <div className="mb-4 rounded-xl border border-line bg-page p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-ink-secondary">Official letterhead (.docx)</p>
                    <p className="mt-0.5 text-[11px] text-ink-muted">
                      {hoja ? <>In use: <span className="text-ink">{hoja.name}</span>. Its header (logo, seals), footer, margins and body font are copied as they are into every Word file.{hojaResumen ? ` ${hojaResumen}.` : ''}</> : 'Upload the company’s letter paper as a Word file with the header and footer in place. Without it, MIRA builds a header from the brand logo and the footer line below.'}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <input ref={hojaRef} type="file" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) subirHoja(f) }} />
                    <button onClick={() => hojaRef.current?.click()} disabled={hojaBusy !== null}
                      className="flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink-secondary transition-all hover:text-ink disabled:opacity-50">
                      {hojaBusy === 'up' ? <><Loader2 size={13} className="animate-spin" /> Reading</> : <><Upload size={13} /> {hoja ? 'Replace' : 'Upload letterhead'}</>}
                    </button>
                    {hoja && (
                      <button onClick={quitarHoja} disabled={hojaBusy !== null} title="Remove letterhead" className="rounded-lg p-1.5 text-ink-muted transition-colors hover:text-red-400 disabled:opacity-50">
                        {hojaBusy === 'rm' ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {texto('company_name', 'Company legal name', defaults?.name || 'Legal name, S.L.')}
                {texto('brand_name', 'Brand name', defaults?.name || 'Trade name')}
                <div className="sm:col-span-2">{texto('tagline', 'Tagline', 'One line under the company name on the cover')}</div>
                <div className="sm:col-span-2">{texto('footer_line', 'Footer line (NIF, address, phone, email)', hoja ? 'Not used while a letterhead is in use (its footer wins)' : 'NIF … - C/ … - 28037 Madrid - Tel: … - email')}</div>
                {texto('body_font', 'Body font', 'Arial (or the letterhead’s font, e.g. Aptos)')}
                {color('cover_color', 'Cover colour', 'Full-colour block on the cover page.')}
                {color('accent_color', 'Accent colour', 'Section titles, index band, header rule and table headers.')}
              </div>

              <div className="mt-4 flex items-center gap-3 rounded-xl border border-line bg-page p-3">
                {defaults?.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={defaults.logo_url} alt="Brand logo" className="max-h-12 max-w-[160px] object-contain" />
                ) : (
                  <span className="text-xs text-ink-muted">No logo yet</span>
                )}
                {/* El Word solo puede incrustar PNG/JPG: un SVG o WebP se ve aquí pero no saldría en el fichero. */}
                {defaults?.logo_url && !/\.(png|jpe?g)(\?|$)/i.test(String(defaults.logo_url))
                  ? <p className="text-[11px] text-amber-400">This logo is not a PNG or JPG, so Word cannot embed it: the brand name will be printed instead. Upload a PNG or JPG in Brand settings.</p>
                  : <p className="text-[11px] text-ink-tertiary">Logo comes from Brand settings. It goes on the cover and in the page header; without it the brand name is printed instead.</p>}
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <p className="text-[11px] text-ink-muted">
                  Empty fields fall back to the brand’s name and colour.{dirty && ' · Preview uses the last saved version.'}
                </p>
                <div className="flex items-center gap-2">
                  {savedAt && <span className="text-[11px] text-ink-muted">Saved {savedAt}</span>}
                  <button onClick={preview} disabled={previewing}
                    className="flex items-center gap-1.5 rounded-lg border border-line bg-page px-3 py-1.5 text-xs font-semibold text-ink-secondary transition-all hover:text-ink disabled:opacity-50">
                    {previewing ? <><Loader2 size={13} className="animate-spin" /> Building</> : <><FileDown size={13} /> Preview Word</>}
                  </button>
                  <button onClick={save} disabled={saving || !loaded || !dirty || !coloresOk}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50" style={{ background: brand }}>
                    {saving ? <><Loader2 size={13} className="animate-spin" /> Saving</> : <><Save size={13} /> Save</>}
                  </button>
                </div>
              </div>
            </>
          ) : null}
          {err && (
            <p className="mt-2 flex items-center gap-2 text-xs text-red-400">
              {err}
              {loadFailed && (
                <button onClick={() => { setErr(null); setLoadFailed(false) }} className="rounded-lg bg-page px-2 py-0.5 text-[11px] text-ink-secondary hover:text-ink">Retry</button>
              )}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
