'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Paperclip, Send, Loader2, CheckCircle2, UserPlus } from 'lucide-react'
import { createClient } from '@/lib/supabase'

interface ChatMessage {
  role: 'user' | 'assistant'
  text: string
  chips?: string[]
}

interface PendingAttachment {
  type: 'image' | 'pdf' | 'text'
  name: string
  url: string
  mimeType?: string
}

function attachmentType(file: File): 'image' | 'pdf' | 'text' {
  if (file.type.startsWith('image/')) return 'image'
  if (file.type === 'application/pdf') return 'pdf'
  return 'text'
}

export default function AdminOnboardingPage() {
  const router = useRouter()
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [clientId, setClientId] = useState<string | null>(null)
  const [slug, setSlug] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([])
  const [uploading, setUploading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendingLogin, setPendingLogin] = useState<{ email: string } | null>(null)
  const [loginResult, setLoginResult] = useState<{ recoveryLink: string | null } | null>(null)
  const [creatingLogin, setCreatingLogin] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // P7-fix (2026-07-29): la sesión (y el cliente borrador) se crean SOLO al
  // enviar el primer mensaje — abrir la página ya no deja huérfanos
  // "Nuevo cliente sin nombre" en la BD.

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, sending])

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    if (files.length === 0 || !clientId) return
    setUploading(true)
    setError(null)
    try {
      const supabase = createClient()
      const uploaded: PendingAttachment[] = []
      for (const file of files) {
        const type = attachmentType(file)
        const path =
          type === 'image' && /logo/i.test(file.name)
            ? `logos/${clientId}.${file.name.split('.').pop()}`
            : `${clientId}/assets/${Date.now()}-${file.name}`
        const { error: uploadError } = await supabase.storage.from('brand-assets').upload(path, file, { upsert: true })
        if (uploadError) throw uploadError
        const { data: publicUrlData } = supabase.storage.from('brand-assets').getPublicUrl(path)
        uploaded.push({ type, name: file.name, url: publicUrlData.publicUrl, mimeType: file.type })
      }
      setPendingAttachments((prev) => [...prev, ...uploaded])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error subiendo el adjunto')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function sendMessage() {
    if ((!input.trim() && pendingAttachments.length === 0) || sending) return
    let sid = sessionId
    let cid = clientId
    if (!sid) {
      try {
        const r = await fetch('/api/admin/onboarding', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
        const json = await r.json()
        if (!r.ok) throw new Error(json.error || 'No se pudo iniciar la sesión')
        sid = json.sessionId
        cid = json.clientId
        setSessionId(sid)
        setClientId(cid)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error')
        return
      }
    }
    const userMessage = input.trim()
    const attachments = pendingAttachments
    setMessages((prev) => [
      ...prev,
      { role: 'user', text: userMessage || `(${attachments.length} adjunto(s))` },
    ])
    setInput('')
    setPendingAttachments([])
    setSending(true)
    setError(null)

    try {
      const res = await fetch('/api/admin/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sid, message: userMessage, attachments }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Error en la conversación')

      setMessages((prev) => [...prev, { role: 'assistant', text: json.botMessage, chips: json.chips }])
      if (json.slug) setSlug(json.slug)
      if (json.pendingLogin) setPendingLogin(json.pendingLogin)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error en la conversación')
    } finally {
      setSending(false)
    }
  }

  async function confirmLoginCreation() {
    if (!pendingLogin || !clientId) return
    setCreatingLogin(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/onboarding/confirm-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, email: pendingLogin.email, sessionId }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'No se pudo crear el acceso')
      setLoginResult({ recoveryLink: json.recoveryLink })
      setPendingLogin(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo crear el acceso')
    } finally {
      setCreatingLogin(false)
    }
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-3xl flex-col px-6 py-8">
      <div className="mb-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-violet-400">Admin</p>
        <h1 className="mt-1 text-2xl font-bold text-ink">Alta de cliente por chat</h1>
        <p className="mt-1 text-sm text-ink-tertiary">
          Pega toda la información que tengas del cliente (texto libre + adjuntos) — el sistema construye el
          cliente y su Brand Brain, y pregunta después por lo que falte.
          {slug && <span className="ml-2 text-emerald-400">· {slug}</span>}
        </p>
      </div>

      {error && (
        <div className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400">
          {error}
        </div>
      )}

      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto rounded-xl border border-line bg-card p-4">
        {messages.length === 0 && !sending && (
          <p className="text-sm text-ink-tertiary">Escribe o pega la información del cliente para empezar…</p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
                m.role === 'user' ? 'bg-violet-600 text-white' : 'bg-surface text-ink'
              }`}
            >
              {m.text}
              {m.chips && m.chips.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {m.chips.map((chip, ci) => (
                    <span
                      key={ci}
                      className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] text-emerald-400"
                    >
                      <CheckCircle2 size={10} /> {chip}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-2xl bg-surface px-4 py-2.5 text-sm text-ink-tertiary">
              <Loader2 size={14} className="animate-spin" /> Pensando…
            </div>
          </div>
        )}

        {pendingLogin && !loginResult && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
            <p className="mb-2 flex items-center gap-2 text-sm font-medium text-amber-400">
              <UserPlus size={14} /> Crear acceso real para {pendingLogin.email}
            </p>
            <p className="mb-3 text-xs text-ink-tertiary">
              Esto crea de verdad la cuenta del cliente y le da acceso al proyecto — confírmalo explícitamente.
            </p>
            <button
              onClick={confirmLoginCreation}
              disabled={creatingLogin}
              className="rounded-lg bg-amber-500 px-4 py-2 text-xs font-semibold text-black transition hover:bg-amber-400 disabled:opacity-50"
            >
              {creatingLogin ? 'Creando…' : 'Crear acceso'}
            </button>
          </div>
        )}

        {loginResult && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
            <p className="mb-2 flex items-center gap-2 text-sm font-medium text-emerald-400">
              <CheckCircle2 size={14} /> Acceso creado
            </p>
            {loginResult.recoveryLink ? (
              <a
                href={loginResult.recoveryLink}
                target="_blank"
                rel="noreferrer"
                className="break-all text-xs text-violet-400 underline"
              >
                {loginResult.recoveryLink}
              </a>
            ) : (
              <p className="text-xs text-ink-tertiary">
                No se pudo generar el link de recuperación — revisa manualmente en Supabase Auth.
              </p>
            )}
            {clientId && (
              <button
                onClick={() => router.push('/admin')}
                className="mt-3 block text-xs text-ink-tertiary underline hover:text-ink"
              >
                Volver al panel de admin
              </button>
            )}
          </div>
        )}
      </div>

      {pendingAttachments.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {pendingAttachments.map((a, i) => (
            <span key={i} className="rounded-full bg-surface px-2 py-1 text-[10px] text-ink-tertiary">
              📎 {a.name}
            </span>
          ))}
        </div>
      )}

      <div className="mt-3 flex items-end gap-2">
        <input ref={fileInputRef} type="file" multiple hidden onChange={handleFileSelect} accept="image/*,.pdf,.txt,.md" />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || !clientId}
          className="rounded-lg border border-line p-2.5 text-ink-tertiary transition hover:bg-surface-hover disabled:opacity-50"
          title="Adjuntar archivo"
        >
          {uploading ? <Loader2 size={16} className="animate-spin" /> : <Paperclip size={16} />}
        </button>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              sendMessage()
            }
          }}
          placeholder="Pega toda la información del cliente…"
          rows={2}
          className="flex-1 resize-none rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink placeholder-ink-tertiary focus:border-violet-500 focus:outline-none"
        />
        <button
          onClick={sendMessage}
          disabled={sending || (!input.trim() && pendingAttachments.length === 0)}
          aria-label="Enviar mensaje"
          className="rounded-lg bg-violet-600 p-2.5 text-white transition hover:bg-violet-500 disabled:opacity-50"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  )
}
