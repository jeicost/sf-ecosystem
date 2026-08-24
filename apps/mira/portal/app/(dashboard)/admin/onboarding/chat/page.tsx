'use client'

import { useRef, useState } from 'react'
import ChatThread from '@/components/chat/ChatThread'
import ChatComposer from '@/components/chat/ChatComposer'
import { useRouter } from 'next/navigation'
import { Paperclip, Loader2, CheckCircle2, UserPlus } from 'lucide-react'

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
  /** Ruta en el bucket privado — sin ella el servidor no puede descargarlo */
  path?: string
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
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([])
  const [uploading, setUploading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendingLogin, setPendingLogin] = useState<{ email: string } | null>(null)
  const [loginResult, setLoginResult] = useState<{ recoveryLink: string | null } | null>(null)
  const [creatingLogin, setCreatingLogin] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // P7-fix (2026-07-29): la sesión (y el cliente borrador) se crean SOLO al
  // enviar el primer mensaje — abrir la página ya no deja huérfanos
  // "Nuevo cliente sin nombre" en la BD.
  //
  // El autoscroll lo gestiona ChatThread.

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    // `clientId` es null hasta que se envía el primer mensaje (la sesión se
    // crea ahí). Antes esto hacía `return` en silencio: adjuntar un logo nada
    // más abrir el chat no hacía absolutamente nada, sin ningún aviso.
    if (!clientId) {
      setError('Send your first message to start the session, then attach the files.')
      e.target.value = ''
      return
    }
    setUploading(true)
    setError(null)
    try {
      const uploaded: PendingAttachment[] = []
      for (const file of files) {
        const type = attachmentType(file)
        if (type === 'image' && /logo/i.test(file.name)) {
          const form = new FormData()
          form.append('clientId', clientId)
          form.append('file', file)
          const res = await fetch('/api/brand-assets/logo', { method: 'POST', body: form })
          const data = await res.json().catch(() => null)
          if (!res.ok || !data?.path) throw new Error(data?.error || `Logo upload failed (${res.status})`)
          // `path` es imprescindible: sin él, buildAttachmentBlocks intenta un
          // fetch server-side a la URL RELATIVA del proxy, revienta, y el
          // catch descarta el adjunto en silencio — el logo que subía el admin
          // en el alta no lo llegaba a ver el modelo NUNCA, pese a que el
          // system prompt le pide expresamente que lo analice.
          uploaded.push({
            type,
            name: file.name,
            url: `/api/brand-assets?path=${encodeURIComponent(data.path)}`,
            mimeType: file.type,
            path: data.path,
          })
        } else {
          const { uploadFilesToBucket } = await import('@/lib/attachments-client')
          const [att] = await uploadFilesToBucket(clientId, [file], 'onboarding')
          uploaded.push(att)
        }
      }
      setPendingAttachments((prev) => [...prev, ...uploaded])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error uploading the attachment')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function sendMessage(text: string) {
    if ((!text.trim() && pendingAttachments.length === 0) || sending) return
    let sid = sessionId
    let cid = clientId
    if (!sid) {
      try {
        const r = await fetch('/api/admin/onboarding', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
        const json = await r.json()
        if (!r.ok) throw new Error(json.error || 'Could not start the session')
        sid = json.sessionId
        cid = json.clientId
        setSessionId(sid)
        setClientId(cid)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error')
        return
      }
    }
    const userMessage = text.trim()
    const attachments = pendingAttachments
    setMessages((prev) => [
      ...prev,
      { role: 'user', text: userMessage || `(${attachments.length} attachment(s))` },
    ])
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
      if (!res.ok) throw new Error(json.error || 'Conversation error')

      setMessages((prev) => [...prev, { role: 'assistant', text: json.botMessage, chips: json.chips }])
      if (json.slug) setSlug(json.slug)
      if (json.pendingLogin) setPendingLogin(json.pendingLogin)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Conversation error')
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
      if (!res.ok) throw new Error(json.error || 'Could not create the login')
      setLoginResult({ recoveryLink: json.recoveryLink })
      setPendingLogin(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create the login')
    } finally {
      setCreatingLogin(false)
    }
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-3xl flex-col px-6 py-8">
      <div className="mb-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-violet-400">Admin</p>
        <h1 className="mt-1 text-2xl font-bold text-ink">Client onboarding by chat</h1>
        <p className="mt-1 text-sm text-ink-tertiary">
          Paste everything you have about the client (free text + attachments) — the system builds the
          client and its Brand Brain, then asks for whatever is missing.
          {slug && <span className="ml-2 text-emerald-400">· {slug}</span>}
        </p>
      </div>

      {error && (
        <div className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400">
          {error}
        </div>
      )}

      <ChatThread
        className="flex-1 min-h-0"
        chatKey="admin-onboarding"
        messages={messages.map((m) => ({ role: m.role, content: m.text, options: m.chips }))}
        isLoading={sending}
        onSelectOption={(chip) => sendMessage(chip)}
      />

      {pendingAttachments.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {pendingAttachments.map((a, i) => (
            <span key={i} className="rounded-full bg-surface px-2 py-1 text-[10px] text-ink-tertiary">
              📎 {a.name}
            </span>
          ))}
        </div>
      )}

      {/* El botón de adjuntar es propio, no el del composer: aquí un fichero
          cuyo nombre contiene "logo" va a /api/brand-assets/logo en vez de al
          bucket de adjuntos, y hace falta el clientId de la sesión. */}
      <div className="mt-3">
        <input ref={fileInputRef} type="file" multiple hidden onChange={handleFileSelect} accept="image/*,.pdf,.txt,.md" />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || !clientId}
          className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1 text-[11px] text-ink-tertiary transition hover:bg-surface-hover hover:text-ink disabled:opacity-50"
          title={clientId ? 'Attach file' : 'Send your first message to start the session'}
        >
          {uploading ? <Loader2 size={12} className="animate-spin" /> : <Paperclip size={12} />}
          Attach file
        </button>
      </div>

      <ChatComposer
        chatKey="admin-onboarding"
        onSend={(text) => sendMessage(text)}
        isLoading={sending}
        allowAttachments={false}
        accent="#7C3AED"
        placeholder="Paste all the client information…"
      />
    </div>
  )
}
