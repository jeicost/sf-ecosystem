'use client'
import { useEffect, useState } from 'react'
import { Loader2, Send, X, AlertTriangle, Server, FileCode2 } from 'lucide-react'
import { t, type Locale } from '@/lib/i18n'
import type { Expedicion } from '@/lib/tms/direcline'

// Grabar un parte en el programa operativo (Direcline): la persona ve la
// expedición tal como va a enviarse, corrige lo que haga falta (códigos,
// direcciones partidas, bultos) y pulsa «Grabar». Nada sale sin ese clic.

interface Falta { campo: string; etiqueta: string }

export default function TmsSendDialog({ ticketId, clientId, locale, brand, onClose, onSent }: {
  ticketId: string; clientId: string; locale: Locale; brand: string
  onClose: () => void
  onSent: (ref: { expedicion: string | null; via: string | null; ordenServicio: string | null }) => void
}) {
  const [exp, setExp] = useState<Expedicion | null>(null)
  const [faltan, setFaltan] = useState<Falta[]>([])
  const [metodo, setMetodo] = useState('')
  const [xml, setXml] = useState('')
  const [showXml, setShowXml] = useState(false)
  const [busy, setBusy] = useState<'preview' | 'send' | null>('preview')
  const [error, setError] = useState<string | null>(null)

  const preview = async (overrides?: Partial<Expedicion>) => {
    setBusy('preview'); setError(null)
    try {
      const res = await fetch(`/api/email-ops/tickets/${ticketId}/tms`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ clientId, action: 'preview', overrides }) })
      const d = await res.json()
      if (!res.ok) { setError(d.reason === 'no-connection' ? t('emailops.tms.no-connection', locale) : d.error || 'Error'); return }
      setExp(d.expedicion); setFaltan(d.faltan || []); setMetodo(d.metodo); setXml(d.xml)
      if (d.ya_grabado?.expedicion) setError(t('emailops.tms.already', locale).replace('{n}', d.ya_grabado.expedicion))
    } catch { setError('Network error') } finally { setBusy(null) }
  }
  useEffect(() => { preview() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const send = async () => {
    if (!exp) return
    setBusy('send'); setError(null)
    try {
      const res = await fetch(`/api/email-ops/tickets/${ticketId}/tms`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ clientId, action: 'send', overrides: exp }) })
      const d = await res.json()
      if (!res.ok) { setError(d.error || 'Error'); if (d.faltan) setFaltan(d.faltan); return }
      onSent({ expedicion: d.resultado?.expedicion ?? null, via: d.resultado?.via ?? null, ordenServicio: d.resultado?.ordenServicio ?? null })
    } catch { setError('Network error') } finally { setBusy(null) }
  }

  const set = (patch: Partial<Expedicion>) => setExp((e) => (e ? { ...e, ...patch } : e))
  const setRec = (patch: Partial<Expedicion['recogida']>) => setExp((e) => (e ? { ...e, recogida: { ...e.recogida, ...patch } } : e))
  const setEnt = (patch: Partial<Expedicion['entrega']>) => setExp((e) => (e ? { ...e, entrega: { ...e.entrega, ...patch } } : e))
  const falta = (campo: string) => faltan.some((f) => f.campo === campo)
  const field = (label: string, value: string | number, onChange: (v: string) => void, campo?: string, cls = '') => (
    <label className={`flex flex-col gap-0.5 text-[10px] uppercase tracking-wide ${campo && falta(campo) ? 'text-amber-400' : 'text-ink-muted'} ${cls}`}>
      {label}
      <input value={value} onChange={(e) => onChange(e.target.value)} className={`rounded-lg border bg-page px-2 py-1 text-xs normal-case tracking-normal text-ink outline-none ${campo && falta(campo) ? 'border-amber-500/60' : 'border-line'}`} />
    </label>
  )

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 p-4 sm:items-center" onClick={onClose}>
      <div className="max-h-[92vh] w-full max-w-3xl overflow-auto rounded-2xl border border-line bg-card p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-semibold text-ink"><Server size={14} style={{ color: brand }} /> {t('emailops.tms.send-title', locale)}</h2>
            <p className="mt-0.5 text-xs text-ink-tertiary">{t('emailops.tms.send-desc', locale)}{metodo ? ` · ${metodo}` : ''}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-ink-muted hover:bg-surface hover:text-ink" aria-label="close"><X size={14} /></button>
        </div>

        {busy === 'preview' && !exp && <Loader2 size={16} className="animate-spin text-ink-muted" />}
        {error && <p className="mb-3 flex items-start gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400"><AlertTriangle size={14} className="mt-0.5 shrink-0" /> <span>{error}</span></p>}
        {faltan.length > 0 && (
          <p className="mb-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">{t('emailops.tms.missing', locale)}: {faltan.map((f) => f.etiqueta).join(', ')}</p>
        )}

        {exp && (
          <div className="space-y-4">
            <div className="grid gap-2 sm:grid-cols-4">
              {field(t('emailops.tms.f.codigo-cliente', locale), exp.codigoCliente, (v) => set({ codigoCliente: v }), 'codigoCliente')}
              {field(t('emailops.tms.f.tipo-servicio', locale), exp.tipoServicio, (v) => set({ tipoServicio: v }), 'tipoServicio')}
              {field(t('emailops.tms.f.contenido', locale), exp.contenido, (v) => set({ contenido: v }), 'contenido')}
              {field(t('emailops.tms.f.referencia', locale), exp.recogidaReferencia, (v) => set({ recogidaReferencia: v }))}
              {field(t('emailops.tms.f.fecha', locale), exp.fecha, (v) => set({ fecha: v }), 'fecha')}
              {field(t('emailops.tms.f.hora-ini', locale), exp.horaInicial, (v) => set({ horaInicial: v }))}
              {field(t('emailops.tms.f.hora-fin', locale), exp.horaFinal, (v) => set({ horaFinal: v }))}
              {field(t('emailops.tms.f.bultos', locale), exp.bultos, (v) => set({ bultos: Number(v) || 1 }), 'bultos')}
              {field(t('emailops.tms.f.peso', locale), exp.pesoKg, (v) => set({ pesoKg: Number(v.replace(',', '.')) || 0 }))}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <section className="rounded-xl border border-line-subtle p-3">
                <p className="mb-2 text-[11px] font-semibold text-ink">{t('emailops.tms.recogida', locale)}</p>
                <div className="grid gap-2 sm:grid-cols-3">
                  {field(t('emailops.tms.f.nombre', locale), exp.remitente, (v) => set({ remitente: v }), 'remitente', 'sm:col-span-3')}
                  {field(t('emailops.tms.f.tipo-via', locale), exp.recogida.tipo, (v) => setRec({ tipo: v }))}
                  {field(t('emailops.tms.f.direccion', locale), exp.recogida.direccion, (v) => setRec({ direccion: v }), 'recogida.direccion', 'sm:col-span-2')}
                  {field(t('emailops.tms.f.numero', locale), exp.recogida.numero, (v) => setRec({ numero: v }))}
                  {field(t('emailops.tms.f.piso', locale), exp.recogida.piso, (v) => setRec({ piso: v }), undefined, 'sm:col-span-2')}
                  {field(t('emailops.tms.f.cp', locale), exp.recogida.cp, (v) => setRec({ cp: v }), 'recogida.cp')}
                  {field(t('emailops.tms.f.poblacion', locale), exp.recogida.poblacion, (v) => setRec({ poblacion: v }), 'recogida.poblacion', 'sm:col-span-2')}
                  {field(t('emailops.tms.f.mas-datos', locale), exp.recogida.resto, (v) => setRec({ resto: v }), undefined, 'sm:col-span-3')}
                  {field(t('emailops.tms.f.telefono', locale), exp.recogida.telefono, (v) => setRec({ telefono: v }))}
                  {field(t('emailops.tms.f.email', locale), exp.recogida.email, (v) => setRec({ email: v }), undefined, 'sm:col-span-2')}
                </div>
              </section>
              <section className="rounded-xl border border-line-subtle p-3">
                <p className="mb-2 text-[11px] font-semibold text-ink">{t('emailops.tms.entrega', locale)}</p>
                <div className="grid gap-2 sm:grid-cols-3">
                  {field(t('emailops.tms.f.nombre', locale), exp.destinatario, (v) => set({ destinatario: v }), 'destinatario', 'sm:col-span-3')}
                  {field(t('emailops.tms.f.tipo-via', locale), exp.entrega.tipo, (v) => setEnt({ tipo: v }))}
                  {field(t('emailops.tms.f.direccion', locale), exp.entrega.direccion, (v) => setEnt({ direccion: v }), 'entrega.direccion', 'sm:col-span-2')}
                  {field(t('emailops.tms.f.numero', locale), exp.entrega.numero, (v) => setEnt({ numero: v }))}
                  {field(t('emailops.tms.f.piso', locale), exp.entrega.piso, (v) => setEnt({ piso: v }), undefined, 'sm:col-span-2')}
                  {field(t('emailops.tms.f.cp', locale), exp.entrega.cp, (v) => setEnt({ cp: v }), 'entrega.cp')}
                  {field(t('emailops.tms.f.poblacion', locale), exp.entrega.poblacion, (v) => setEnt({ poblacion: v }), 'entrega.poblacion', 'sm:col-span-2')}
                  {field(t('emailops.tms.f.mas-datos', locale), exp.entrega.resto, (v) => setEnt({ resto: v }), undefined, 'sm:col-span-3')}
                  {field(t('emailops.tms.f.telefono', locale), exp.entrega.telefono, (v) => setEnt({ telefono: v }))}
                  {field(t('emailops.tms.f.email', locale), exp.entrega.email, (v) => setEnt({ email: v }), undefined, 'sm:col-span-2')}
                </div>
              </section>
            </div>

            <label className="flex flex-col gap-0.5 text-[10px] uppercase tracking-wide text-ink-muted">{t('emailops.tms.f.observaciones', locale)}
              <textarea value={exp.observaciones} onChange={(e) => set({ observaciones: e.target.value.slice(0, 180) })} rows={2} className="rounded-lg border border-line bg-page px-2 py-1 text-xs normal-case tracking-normal text-ink outline-none" />
            </label>
            <label className="flex items-center gap-2 text-[11px] text-ink-secondary"><input type="checkbox" checked={exp.forzarPendienteValidar} onChange={(e) => set({ forzarPendienteValidar: e.target.checked })} /> {t('emailops.tms.pendiente-validar', locale)}</label>

            <div className="flex flex-wrap items-center gap-2">
              <button onClick={send} disabled={busy !== null || faltan.length > 0} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-white disabled:opacity-50" style={{ background: brand }}>
                {busy === 'send' ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />} {t('emailops.tms.send', locale)}
              </button>
              <button onClick={() => preview(exp)} disabled={busy !== null} className="rounded-lg bg-surface px-3 py-2 text-xs text-ink-secondary hover:text-ink disabled:opacity-50">{t('emailops.tms.recheck', locale)}</button>
              <button onClick={() => setShowXml((v) => !v)} className="ml-auto inline-flex items-center gap-1 text-[11px] text-ink-tertiary hover:text-ink"><FileCode2 size={11} /> XML</button>
            </div>
            {showXml && <pre className="max-h-64 overflow-auto rounded-lg bg-surface p-3 text-[10px] leading-snug text-ink-secondary">{xml.replace(/></g, '>\n<')}</pre>}
          </div>
        )}
      </div>
    </div>
  )
}
