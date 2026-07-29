'use client'

// P7 (2026-07-29) — wizard de alta con pasos, ATRÁS y revisión editable.
// Sustituye al chat-libre que creaba un cliente-borrador nada más abrir la
// página. Nada se escribe en BD hasta pulsar "Crear cliente" en el paso 5.
// El asistente (AssistantPanel) solo rellena el formulario — nunca guarda.

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import AssistantPanel from './AssistantPanel'

const DRAFT_KEY = 'mira_onboarding_draft'
const PLAN_OPTIONS = ['starter', 'growth', 'scale', 'consulta'] as const

interface Basics {
  company_name: string
  sector: string
  website_url: string
  slug: string
}
interface Brand {
  mission: string
  proposition: string
  tone_of_voice: string
  values: string // textarea, una por línea — se parte al enviar
  tagline: string
  one_liner: string
  primary_color: string
  secondary_color: string
  logo_url: string
}
interface ProjectDraft {
  name: string
  description: string
  create_drive_structure: boolean
}
interface LoginDraft {
  email: string
  plan: (typeof PLAN_OPTIONS)[number]
}

interface WizardState {
  basics: Basics
  brand: Brand
  project: ProjectDraft
  login: LoginDraft
}

const EMPTY_STATE: WizardState = {
  basics: { company_name: '', sector: '', website_url: '', slug: '' },
  brand: { mission: '', proposition: '', tone_of_voice: '', values: '', tagline: '', one_liner: '', primary_color: '', secondary_color: '', logo_url: '' },
  project: { name: '', description: '', create_drive_structure: true },
  login: { email: '', plan: 'starter' },
}

const STEPS = [
  { n: 1, label: 'Datos básicos' },
  { n: 2, label: 'Marca' },
  { n: 3, label: 'Proyecto' },
  { n: 4, label: 'Acceso' },
  { n: 5, label: 'Revisión' },
] as const

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-ink-secondary">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-ink-tertiary">{hint}</p>}
    </div>
  )
}

const inputCls = 'w-full rounded-lg border border-line bg-page px-3 py-2 text-sm text-ink placeholder-ink-tertiary outline-none focus:border-purple-500'

interface OrphanRow { id: string; name: string; slug: string; created_at: string }

function OrphansPanel() {
  const [open, setOpen] = useState(false)
  const [rows, setRows] = useState<OrphanRow[] | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = async () => {
    const res = await fetch('/api/admin/onboarding/create?list=orphans').catch(() => null)
    const data = await res?.json().catch(() => null)
    setRows(data?.orphans ?? [])
  }

  const remove = async (id: string) => {
    if (!window.confirm('¿Borrar este borrador huérfano? Esta acción no se puede deshacer.')) return
    setBusyId(id)
    const res = await fetch('/api/admin/onboarding/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ delete_orphan_id: id }),
    }).catch(() => null)
    if (res?.ok) setRows((r) => (r || []).filter((x) => x.id !== id))
    setBusyId(null)
  }

  return (
    <div className="mt-8 rounded-xl border border-line bg-surface">
      <button
        type="button"
        onClick={() => { setOpen((v) => !v); if (!rows) load() }}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <span className="text-xs font-medium text-ink-secondary">🗑️ Borradores huérfanos del alta anterior</span>
        <span className="text-[11px] text-ink-tertiary">{open ? 'Ocultar' : 'Ver'}</span>
      </button>
      {open && (
        <div className="border-t border-line p-4 space-y-2">
          {rows === null && <p className="text-xs text-ink-tertiary">Cargando…</p>}
          {rows?.length === 0 && <p className="text-xs text-ink-tertiary">Ninguno — todo limpio.</p>}
          {rows?.map((r) => (
            <div key={r.id} className="flex items-center justify-between gap-3 rounded-lg bg-page px-3 py-2">
              <span className="text-xs text-ink-tertiary font-mono">{r.slug} · {new Date(r.created_at).toLocaleDateString()}</span>
              <button
                type="button"
                onClick={() => remove(r.id)}
                disabled={busyId === r.id}
                className="text-[11px] px-2.5 py-1 rounded-md text-red-400/80 hover:bg-red-500/10 transition-colors disabled:opacity-50"
              >
                {busyId === r.id ? '…' : 'Borrar'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function WizardShell() {
  const [step, setStep] = useState(1)
  const [maxVisited, setMaxVisited] = useState(1)
  const [state, setState] = useState<WizardState>(EMPTY_STATE)
  const [draftRestored, setDraftRestored] = useState(false)
  const [creating, setCreating] = useState(false)
  const [result, setResult] = useState<{ success: boolean; client_id?: string; result?: any; errors?: Record<string, string> } | null>(null)
  const [retryingLogin, setRetryingLogin] = useState(false)

  // Restaurar borrador local (nada de BD hasta el paso 5)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed?.state) {
          setState({ ...EMPTY_STATE, ...parsed.state })
          setDraftRestored(true)
        }
      }
    } catch { /* localStorage puede fallar en privado — no bloquea el wizard */ }
  }, [])

  useEffect(() => {
    if (result?.success) return // ya creado, no seguir guardando el borrador
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ state, savedAt: Date.now() }))
    } catch { /* idem */ }
  }, [state, result])

  const discardDraft = () => {
    localStorage.removeItem(DRAFT_KEY)
    setState(EMPTY_STATE)
    setDraftRestored(false)
    setStep(1)
    setMaxVisited(1)
  }

  const goTo = (n: number) => {
    if (n <= maxVisited) setStep(n)
  }
  const next = () => {
    const n = Math.min(step + 1, 5)
    setStep(n)
    setMaxVisited((m) => Math.max(m, n))
  }
  const back = () => setStep((s) => Math.max(1, s - 1))

  const effectiveSlug = useMemo(
    () => slugify(state.basics.slug || state.basics.company_name),
    [state.basics.slug, state.basics.company_name]
  )

  const canNextFrom1 = state.basics.company_name.trim().length > 0

  const create = async () => {
    setCreating(true)
    setResult(null)
    const payload = {
      basics: { ...state.basics, slug: effectiveSlug },
      brand: {
        ...state.brand,
        values: state.brand.values.split('\n').map((v) => v.trim()).filter(Boolean),
      },
      project: state.project.name.trim() ? state.project : null,
      login: state.login.email.trim() ? state.login : null,
    }
    const res = await fetch('/api/admin/onboarding/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(() => null)
    const data = await res?.json().catch(() => null)
    if (res?.ok) {
      setResult(data)
      if (data.success || !data.errors?.login) localStorage.removeItem(DRAFT_KEY)
      // Estructura de Drive del proyecto, si se pidió y el proyecto se creó
      if (state.project.create_drive_structure && data?.result?.project?.id) {
        fetch(`/api/projects/${data.result.project.id}/drive-structure`, { method: 'POST' }).catch(() => {})
      }
    } else {
      setResult({ success: false, errors: { general: data?.error || 'Error creando el cliente' } })
    }
    setCreating(false)
  }

  const retryLogin = async () => {
    if (!result?.client_id || !state.login.email.trim()) return
    setRetryingLogin(true)
    const res = await fetch('/api/admin/onboarding/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'login_only', clientId: result.client_id, email: state.login.email, plan: state.login.plan }),
    }).catch(() => null)
    const data = await res?.json().catch(() => null)
    if (res?.ok) {
      setResult((r) => r ? { ...r, result: { ...r.result, login: data.login }, errors: { ...(r.errors || {}), login: undefined as any } } : r)
      localStorage.removeItem(DRAFT_KEY)
    }
    setRetryingLogin(false)
  }

  // ── Pantalla de éxito ──
  if (result?.success) {
    return (
      <div className="max-w-2xl mx-auto px-8 py-12">
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6 space-y-4">
          <p className="text-lg font-semibold text-ink">✅ Cliente creado</p>
          <div className="space-y-1.5 text-sm text-ink-secondary">
            <p><strong className="text-ink">{state.basics.company_name}</strong> · slug <code className="text-xs">{result.result?.client?.slug}</code></p>
            {result.result?.project && <p>Proyecto: {result.result.project.name}</p>}
            {result.result?.login?.recoveryLink && (
              <p>
                Link de acceso:{' '}
                <a href={result.result.login.recoveryLink} target="_blank" rel="noopener noreferrer" className="text-purple-400 underline break-all">
                  {result.result.login.recoveryLink}
                </a>
              </p>
            )}
          </div>
          <div className="flex gap-2 pt-2">
            <Link href="/admin" className="text-xs px-4 py-2 rounded-lg bg-surface-hover text-ink hover:opacity-80 transition-colors">Volver al panel</Link>
            <button
              type="button"
              onClick={() => { setResult(null); setState(EMPTY_STATE); setStep(1); setMaxVisited(1) }}
              className="text-xs px-4 py-2 rounded-lg bg-purple-600/20 text-purple-300 hover:bg-purple-600/30 transition-colors"
            >
              Dar de alta otro cliente
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-8 py-10">
      <div className="mb-6">
        <p className="text-[10px] uppercase tracking-widest font-semibold text-ink-tertiary mb-1">Admin · Alta de clientes</p>
        <h1 className="text-xl font-bold text-ink">Dar de alta un cliente</h1>
        {draftRestored && !result && (
          <p className="text-[11px] text-amber-400/90 mt-1">
            Borrador restaurado de una sesión anterior — {' '}
            <button type="button" onClick={discardDraft} className="underline">descartar y empezar de cero</button>
          </p>
        )}
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-1 mb-6">
        {STEPS.map((s, i) => (
          <div key={s.n} className="flex items-center flex-1">
            <button
              type="button"
              onClick={() => goTo(s.n)}
              disabled={s.n > maxVisited}
              className={`flex-1 text-[11px] font-medium py-2 rounded-lg transition-colors ${
                s.n === step ? 'bg-purple-600/20 text-purple-300' : s.n <= maxVisited ? 'text-ink-secondary hover:bg-surface-hover' : 'text-ink-tertiary/50 cursor-not-allowed'
              }`}
            >
              {s.n}. {s.label}
            </button>
            {i < STEPS.length - 1 && <div className="w-2 h-px bg-line shrink-0" />}
          </div>
        ))}
      </div>

      {result && !result.success && (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/5 p-4 space-y-2">
          <p className="text-sm font-medium text-red-300">Algo falló al crear</p>
          {result.errors && Object.entries(result.errors).map(([k, v]) => (
            <p key={k} className="text-xs text-ink-secondary">· {k}: {v}</p>
          ))}
          {result.client_id && result.errors?.login && (
            <button
              type="button"
              onClick={retryLogin}
              disabled={retryingLogin}
              className="text-xs px-3 py-1.5 rounded-lg bg-surface-hover text-ink hover:opacity-80 transition-colors"
            >
              {retryingLogin ? 'Reintentando…' : 'Reintentar solo el acceso'}
            </button>
          )}
        </div>
      )}

      <div className="card p-6 space-y-5">
        {step === 1 && (
          <>
            <AssistantPanel step="basics" onExtracted={(f) => setState((s) => ({ ...s, basics: { ...s.basics, ...f as Partial<Basics> } }))} />
            <Field label="Nombre de la empresa *">
              <input className={inputCls} value={state.basics.company_name} onChange={(e) => setState((s) => ({ ...s, basics: { ...s.basics, company_name: e.target.value } }))} placeholder="Ej. Salsa Burgers" />
            </Field>
            <Field label="Slug (URL interna)" hint={`Se usará: ${effectiveSlug || '—'}`}>
              <input className={inputCls} value={state.basics.slug} onChange={(e) => setState((s) => ({ ...s, basics: { ...s.basics, slug: e.target.value } }))} placeholder={slugify(state.basics.company_name) || 'auto'} />
            </Field>
            <Field label="Sector / industria">
              <input className={inputCls} value={state.basics.sector} onChange={(e) => setState((s) => ({ ...s, basics: { ...s.basics, sector: e.target.value } }))} placeholder="Ej. F&B Delivery" />
            </Field>
            <Field label="Sitio web" hint="Los informes de SEO/Marketing la usan automáticamente si el cliente no la repite.">
              <input className={inputCls} value={state.basics.website_url} onChange={(e) => setState((s) => ({ ...s, basics: { ...s.basics, website_url: e.target.value } }))} placeholder="https://www.tumarca.com" />
            </Field>
          </>
        )}

        {step === 2 && (
          <>
            <AssistantPanel step="brand" onExtracted={(f) => setState((s) => ({ ...s, brand: { ...s.brand, ...f as Partial<Brand> } }))} />
            <Field label="Misión">
              <textarea className={inputCls} rows={2} value={state.brand.mission} onChange={(e) => setState((s) => ({ ...s, brand: { ...s.brand, mission: e.target.value } }))} />
            </Field>
            <Field label="Propuesta de valor">
              <textarea className={inputCls} rows={2} value={state.brand.proposition} onChange={(e) => setState((s) => ({ ...s, brand: { ...s.brand, proposition: e.target.value } }))} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Tagline">
                <input className={inputCls} value={state.brand.tagline} onChange={(e) => setState((s) => ({ ...s, brand: { ...s.brand, tagline: e.target.value } }))} />
              </Field>
              <Field label="Tono de voz">
                <input className={inputCls} value={state.brand.tone_of_voice} onChange={(e) => setState((s) => ({ ...s, brand: { ...s.brand, tone_of_voice: e.target.value } }))} />
              </Field>
            </div>
            <Field label="Valores (uno por línea)">
              <textarea className={inputCls} rows={2} value={state.brand.values} onChange={(e) => setState((s) => ({ ...s, brand: { ...s.brand, values: e.target.value } }))} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Color primario">
                <input className={inputCls} value={state.brand.primary_color} onChange={(e) => setState((s) => ({ ...s, brand: { ...s.brand, primary_color: e.target.value } }))} placeholder="#8B5CF6" />
              </Field>
              <Field label="Color secundario">
                <input className={inputCls} value={state.brand.secondary_color} onChange={(e) => setState((s) => ({ ...s, brand: { ...s.brand, secondary_color: e.target.value } }))} placeholder="#22D3EE" />
              </Field>
            </div>
            <Field label="URL del logo">
              <input className={inputCls} value={state.brand.logo_url} onChange={(e) => setState((s) => ({ ...s, brand: { ...s.brand, logo_url: e.target.value } }))} placeholder="https://…/logo.png" />
            </Field>
          </>
        )}

        {step === 3 && (
          <>
            <AssistantPanel step="project" onExtracted={(f) => setState((s) => ({ ...s, project: { ...s.project, ...f as Partial<ProjectDraft> } }))} />
            <p className="text-xs text-ink-tertiary">Opcional — puedes crear el primer proyecto ahora o más tarde desde el cliente.</p>
            <Field label="Nombre del proyecto">
              <input className={inputCls} value={state.project.name} onChange={(e) => setState((s) => ({ ...s, project: { ...s.project, name: e.target.value } }))} placeholder="Ej. Lanzamiento Q3" />
            </Field>
            <Field label="Descripción">
              <textarea className={inputCls} rows={2} value={state.project.description} onChange={(e) => setState((s) => ({ ...s, project: { ...s.project, description: e.target.value } }))} />
            </Field>
            <label className="flex items-center gap-2 text-xs text-ink-secondary">
              <input type="checkbox" checked={state.project.create_drive_structure} onChange={(e) => setState((s) => ({ ...s, project: { ...s.project, create_drive_structure: e.target.checked } }))} />
              Crear estructura de Drive (Conocimiento + Entregables) si el cliente ya tiene Drive conectado
            </label>
          </>
        )}

        {step === 4 && (
          <>
            <AssistantPanel step="login" onExtracted={(f) => setState((s) => ({ ...s, login: { ...s.login, ...f as Partial<LoginDraft> } }))} />
            <p className="text-xs text-ink-tertiary">Opcional — puedes dar acceso ahora o más tarde desde Usuarios.</p>
            <Field label="Email del cliente">
              <input className={inputCls} type="email" value={state.login.email} onChange={(e) => setState((s) => ({ ...s, login: { ...s.login, email: e.target.value } }))} placeholder="contacto@sumarca.com" />
            </Field>
            <Field label="Plan">
              <select className={inputCls} value={state.login.plan} onChange={(e) => setState((s) => ({ ...s, login: { ...s.login, plan: e.target.value as LoginDraft['plan'] } }))}>
                {PLAN_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </Field>
          </>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <p className="text-xs text-ink-tertiary">Revisa antes de crear — nada se ha guardado todavía.</p>
            {[
              { n: 1, title: 'Datos básicos', lines: [state.basics.company_name, state.basics.sector, state.basics.website_url].filter(Boolean) },
              { n: 2, title: 'Marca', lines: [state.brand.mission, state.brand.tagline, state.brand.tone_of_voice].filter(Boolean) },
              { n: 3, title: 'Proyecto', lines: state.project.name ? [state.project.name, state.project.description].filter(Boolean) : ['— (sin proyecto inicial)'] },
              { n: 4, title: 'Acceso', lines: state.login.email ? [`${state.login.email} · plan ${state.login.plan}`] : ['— (sin acceso todavía)'] },
            ].map((sec) => (
              <div key={sec.n} className="rounded-xl border border-line bg-surface p-3.5">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs font-semibold text-ink">{sec.title}</p>
                  <button type="button" onClick={() => goTo(sec.n)} className="text-[11px] text-purple-400 hover:text-purple-300">Editar →</button>
                </div>
                {sec.lines.map((l, i) => <p key={i} className="text-xs text-ink-tertiary">{l}</p>)}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-5">
        <button
          type="button"
          onClick={back}
          disabled={step === 1}
          className="text-sm px-4 py-2 rounded-lg bg-surface-hover text-ink hover:opacity-80 transition-colors disabled:opacity-30"
        >
          ← Atrás
        </button>
        {step < 5 ? (
          <button
            type="button"
            onClick={next}
            disabled={step === 1 && !canNextFrom1}
            className="text-sm px-5 py-2 rounded-lg bg-purple-600 text-white hover:opacity-90 transition-colors disabled:opacity-40"
          >
            Siguiente →
          </button>
        ) : (
          <button
            type="button"
            onClick={create}
            disabled={creating || !canNextFrom1}
            className="text-sm px-5 py-2 rounded-lg bg-purple-600 text-white hover:opacity-90 transition-colors disabled:opacity-50"
          >
            {creating ? '⏳ Creando…' : '✓ Crear cliente'}
          </button>
        )}
      </div>

      <OrphansPanel />
    </div>
  )
}
