'use client'
import { useEffect, useState } from 'react'
import { Loader2, Plug, Save, CheckCircle2, AlertTriangle, FileCode2, Server } from 'lucide-react'
import { t, type Locale } from '@/lib/i18n'
import type { DireclineConfig } from '@/lib/tms/direcline'

// Conexión con el programa operativo (Direcline / DL-Nexus) y sus códigos.
// La contraseña se escribe una vez, se prueba y se guarda cifrada. Los códigos
// del programa (cliente, tipos de servicio, contenido de bulto…) los pone la
// persona: sin ellos, el botón «Grabar en Direcline» avisa de lo que falta.

interface Conn { base_url: string; username: string; culture: string; namespace: string | null; config: DireclineConfig; active: boolean; last_test_at: string | null; last_test_ok: boolean | null; last_error: string | null }
type Status = { kind: 'ok' | 'error'; text: string } | null

const VACIA: DireclineConfig = { codigo_cliente: '', departamento_cliente: '', tipo_servicio: { local: '', nacional: '', internacional: '' }, contenido_bulto: '', pais: 'ESPAÑA', codigo_mensajero_recogida: '', codigo_mensajero_entrega: '', metodo: 'solicitud', forzar_pendiente_validar: true, no_transmitir_via: false, hora_inicio_defecto: '09:00', hora_fin_defecto: '18:00', entrega_aviso_email: 0 }

export default function TmsSettingsPanel({ clientId, locale, brand }: { clientId: string; locale: Locale; brand: string }) {
  const [conn, setConn] = useState<Conn | null>(null)
  const [canManage, setCanManage] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [baseUrl, setBaseUrl] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [config, setConfig] = useState<DireclineConfig>(VACIA)
  const [tsExtra, setTsExtra] = useState('')
  const [busy, setBusy] = useState<'test' | 'save' | 'structure' | null>(null)
  const [status, setStatus] = useState<Status>(null)
  const [estructura, setEstructura] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/email-ops/tms?clientId=${clientId}`).then((r) => r.json()).then((d) => {
      setCanManage(!!d.canManage)
      if (d.connection) {
        setConn(d.connection); setBaseUrl(d.connection.base_url); setUsername(d.connection.username); setConfig({ ...VACIA, ...d.connection.config })
        const extra = Object.entries(d.connection.config?.tipo_servicio || {}).filter(([k]) => !['local', 'nacional', 'internacional'].includes(k)).map(([k, v]) => `${k}=${v}`).join('\n')
        setTsExtra(extra)
      }
      setLoaded(true)
    }).catch(() => setLoaded(true))
  }, [clientId])

  const configCompleta = (): DireclineConfig => {
    const ts: Record<string, string> = { ...config.tipo_servicio }
    for (const line of tsExtra.split('\n')) { const m = /^\s*([^=]+?)\s*=\s*(.+?)\s*$/.exec(line); if (m) ts[m[1].toLowerCase()] = m[2] }
    return { ...config, tipo_servicio: ts }
  }

  const call = async (action: 'test' | 'save' | 'structure') => {
    setBusy(action); setStatus(null); if (action === 'structure') setEstructura(null)
    try {
      const res = await fetch('/api/email-ops/tms', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, action, base_url: baseUrl, username, password: password || undefined, culture: 'es-ES', config: configCompleta(), metodo: config.metodo === 'expedicion' ? 'GuardarExpedicion' : 'GrabarExpedicionSolicitud' }),
      })
      const d = await res.json()
      if (!res.ok) { setStatus({ kind: 'error', text: d.error || 'Error' }); return }
      if (action === 'structure') { setEstructura(d.estructura || d.error || '—'); setStatus(d.ok ? null : { kind: 'error', text: d.error }); return }
      if (d.connection) { setConn(d.connection); setPassword('') }
      setStatus(d.ok ? { kind: 'ok', text: t(action === 'test' ? 'emailops.tms.test-ok' : 'emailops.tms.saved', locale) } : { kind: 'error', text: `${t('emailops.tms.test-fail', locale)} ${d.error || ''}` })
    } catch { setStatus({ kind: 'error', text: 'Network error' }) } finally { setBusy(null) }
  }

  const input = (v: string, set: (x: string) => void, ph = '', type = 'text') => (
    <input value={v} onChange={(e) => set(e.target.value)} placeholder={ph} type={type} autoComplete={type === 'password' ? 'new-password' : 'off'} className="rounded-lg border border-line bg-page px-2.5 py-1.5 text-sm text-ink outline-none" />
  )
  const ts = (k: 'local' | 'nacional' | 'internacional') => input(config.tipo_servicio[k] || '', (x) => setConfig({ ...config, tipo_servicio: { ...config.tipo_servicio, [k]: x } }), 'código')

  if (!loaded) return <div className="rounded-2xl border border-line bg-card p-5"><Loader2 size={14} className="animate-spin text-ink-muted" /></div>
  if (!canManage && !conn) return null

  return (
    <div className="rounded-2xl border border-line bg-card p-5">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-ink"><Server size={15} style={{ color: brand }} /> {t('emailops.tms.title', locale)}</h2>
      <p className="mt-1 mb-4 text-xs text-ink-tertiary">{t('emailops.tms.desc', locale)}</p>

      {conn && (
        <p className={`mb-3 flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs ${conn.last_test_ok ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
          {conn.last_test_ok ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
          {conn.last_test_ok ? t('emailops.tms.connected', locale) : t('emailops.tms.not-ok', locale)}{conn.last_error ? ` · ${conn.last_error}` : ''}
        </p>
      )}

      {canManage && (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-[11px] text-ink-tertiary sm:col-span-2">{t('emailops.tms.url', locale)}{input(baseUrl, setBaseUrl, 'https://…/WsUtilidades/ControladorUtilidades.asmx')}</label>
            <label className="flex flex-col gap-1 text-[11px] text-ink-tertiary">{t('emailops.tms.user', locale)}{input(username, setUsername)}</label>
            <label className="flex flex-col gap-1 text-[11px] text-ink-tertiary">{t('emailops.tms.password', locale)}{input(password, setPassword, conn ? '••••••••' : '', 'password')}</label>
          </div>

          <p className="mt-4 mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-tertiary">{t('emailops.tms.codes', locale)}</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="flex flex-col gap-1 text-[11px] text-ink-tertiary">{t('emailops.tms.codigo-cliente', locale)}{input(config.codigo_cliente, (x) => setConfig({ ...config, codigo_cliente: x }))}</label>
            <label className="flex flex-col gap-1 text-[11px] text-ink-tertiary">{t('emailops.tms.departamento', locale)}{input(config.departamento_cliente || '', (x) => setConfig({ ...config, departamento_cliente: x }))}</label>
            <label className="flex flex-col gap-1 text-[11px] text-ink-tertiary">{t('emailops.tms.contenido', locale)}{input(config.contenido_bulto, (x) => setConfig({ ...config, contenido_bulto: x }), 'paq')}</label>
            <label className="flex flex-col gap-1 text-[11px] text-ink-tertiary">{t('emailops.tms.ts-local', locale)}{ts('local')}</label>
            <label className="flex flex-col gap-1 text-[11px] text-ink-tertiary">{t('emailops.tms.ts-nacional', locale)}{ts('nacional')}</label>
            <label className="flex flex-col gap-1 text-[11px] text-ink-tertiary">{t('emailops.tms.ts-internacional', locale)}{ts('internacional')}</label>
            <label className="flex flex-col gap-1 text-[11px] text-ink-tertiary sm:col-span-3">{t('emailops.tms.ts-extra', locale)}
              <textarea value={tsExtra} onChange={(e) => setTsExtra(e.target.value)} rows={3} placeholder={'moto=0010\nfurgoneta=0030\nurgente=URG'} className="rounded-lg border border-line bg-page px-2.5 py-1.5 font-mono text-xs text-ink outline-none" />
            </label>
            <label className="flex flex-col gap-1 text-[11px] text-ink-tertiary">{t('emailops.tms.mensajero-rec', locale)}{input(config.codigo_mensajero_recogida || '', (x) => setConfig({ ...config, codigo_mensajero_recogida: x }))}</label>
            <label className="flex flex-col gap-1 text-[11px] text-ink-tertiary">{t('emailops.tms.mensajero-ent', locale)}{input(config.codigo_mensajero_entrega || '', (x) => setConfig({ ...config, codigo_mensajero_entrega: x }))}</label>
            <label className="flex flex-col gap-1 text-[11px] text-ink-tertiary">{t('emailops.tms.metodo', locale)}
              <select value={config.metodo} onChange={(e) => setConfig({ ...config, metodo: e.target.value as DireclineConfig['metodo'] })} className="rounded-lg border border-line bg-page px-2.5 py-1.5 text-sm text-ink outline-none">
                <option value="solicitud">GrabarExpedicionSolicitud</option>
                <option value="expedicion">GuardarExpedicion</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-[11px] text-ink-tertiary">{t('emailops.tms.hora-ini', locale)}{input(config.hora_inicio_defecto, (x) => setConfig({ ...config, hora_inicio_defecto: x }), '09:00')}</label>
            <label className="flex flex-col gap-1 text-[11px] text-ink-tertiary">{t('emailops.tms.hora-fin', locale)}{input(config.hora_fin_defecto, (x) => setConfig({ ...config, hora_fin_defecto: x }), '18:00')}</label>
            <label className="flex items-center gap-2 text-[11px] text-ink-secondary sm:col-span-3"><input type="checkbox" checked={config.forzar_pendiente_validar} onChange={(e) => setConfig({ ...config, forzar_pendiente_validar: e.target.checked })} /> {t('emailops.tms.pendiente-validar', locale)}</label>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button onClick={() => call('test')} disabled={busy !== null || !baseUrl || !username || (!password && !conn)} className="inline-flex items-center gap-1.5 rounded-lg bg-surface px-3 py-2 text-xs font-medium text-ink hover:bg-line disabled:opacity-50">
              {busy === 'test' ? <Loader2 size={12} className="animate-spin" /> : <Plug size={12} />} {t('emailops.tms.test', locale)}
            </button>
            <button onClick={() => call('save')} disabled={busy !== null || !baseUrl || !username || (!password && !conn)} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-white disabled:opacity-50" style={{ background: brand }}>
              {busy === 'save' ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} {t('emailops.tms.save', locale)}
            </button>
            {conn && (
              <button onClick={() => call('structure')} disabled={busy !== null} className="inline-flex items-center gap-1.5 rounded-lg bg-surface px-3 py-2 text-xs text-ink-secondary hover:text-ink disabled:opacity-50">
                {busy === 'structure' ? <Loader2 size={12} className="animate-spin" /> : <FileCode2 size={12} />} {t('emailops.tms.structure', locale)}
              </button>
            )}
          </div>
          {status && <p className={`mt-3 rounded-lg px-3 py-2 text-xs ${status.kind === 'ok' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>{status.text}</p>}
          {estructura && <pre className="mt-3 max-h-72 overflow-auto rounded-lg bg-surface p-3 text-[10px] leading-snug text-ink-secondary">{estructura}</pre>}
          <p className="mt-3 text-[11px] text-ink-muted">{t('emailops.tms.privacy', locale)}</p>
        </>
      )}
    </div>
  )
}
