'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Send, ChevronDown, ChevronRight } from 'lucide-react'
import { Button, Badge, Input, InlineMessage } from '@/components/ui'
import { cn } from '@/lib/cn'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  created_at?: string
}

interface BriefJson {
  brand?: { name?: string; description?: string; industry?: string }
  goal?: { primary_action?: string; details?: string }
  audience?: { description?: string }
  sections?: { requested?: string[]; notes?: string }
  design?: {
    has_logo?: boolean
    has_brand_guide?: boolean
    colors?: string
    fonts?: string
    references?: string[]
    notes?: string
  }
  tone?: { description?: string }
  content?: { copy_ready?: boolean; notes?: string }
  redesign?: { is_redesign?: boolean; existing_url?: string | null }
  domain?: { has_domain?: boolean; domain_name?: string; currently_in_use?: boolean; notes?: string }
  notes?: { priority?: string; deadline?: string; other?: string }
  [key: string]: unknown
}

type BriefStatus = 'not_started' | 'in_progress' | 'ready' | 'built'

const STATUS_LABEL: Record<BriefStatus, string> = {
  not_started: 'Sin empezar',
  in_progress: 'En curso',
  ready: 'Listo',
  built: 'Construido',
}

const STATUS_TONE: Record<BriefStatus, 'neutral' | 'info' | 'success' | 'special'> = {
  not_started: 'neutral',
  in_progress: 'info',
  ready: 'success',
  built: 'special',
}

function yesNo(v: boolean | undefined): string {
  if (v === true) return 'Sí'
  if (v === false) return 'No'
  return 'TBD'
}

export default function ProjectBriefPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string

  const [projectName, setProjectName] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [briefStatus, setBriefStatus] = useState<BriefStatus>('not_started')
  const [briefJson, setBriefJson] = useState<BriefJson | null>(null)
  const [input, setInput] = useState('')
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [showRawJson, setShowRawJson] = useState(false)

  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!projectId) return
    fetchHistory()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

  async function fetchHistory() {
    try {
      setLoadingHistory(true)
      const response = await fetch(`/api/admin/projects/${projectId}/brief-chat`)
      if (!response.ok) throw new Error('Failed to load brief chat')
      const data = await response.json()
      setProjectName(data.project?.name ?? '')
      setMessages(data.messages ?? [])
      setBriefStatus((data.brief_status as BriefStatus) ?? 'not_started')
      setBriefJson(data.brief_json ?? null)
    } catch (err) {
      console.error('Error:', err)
      setError('No se pudo cargar la conversación del brief')
    } finally {
      setLoadingHistory(false)
    }
  }

  async function handleSend() {
    const message = input.trim()
    if (!message || sending) return
    setInput('')
    setError('')
    setMessages((prev) => [...prev, { role: 'user', content: message }])
    setSending(true)

    try {
      const response = await fetch(`/api/admin/projects/${projectId}/brief-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      })

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}))
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: `Error: ${errBody.error || 'No se pudo procesar el mensaje'}` },
        ])
        return
      }

      const data = await response.json()
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }])
      if (data.ready) {
        setBriefStatus('ready')
        setBriefJson(data.brief ?? null)
      } else if (briefStatus === 'not_started') {
        setBriefStatus('in_progress')
      }
    } catch (err) {
      console.error('Error:', err)
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Error: ${err instanceof Error ? err.message : 'Error desconocido'}` },
      ])
    } finally {
      setSending(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-5xl flex-col px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between rounded-t-xl border-b border-slate-200 bg-white px-6 py-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            Brief de landing{projectName ? ` — ${projectName}` : ''}
          </h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-slate-500">
            <Badge tone={STATUS_TONE[briefStatus]}>{STATUS_LABEL[briefStatus]}</Badge>
            Este chat solo conversa y guarda el brief — no construye la web.
          </p>
        </div>
        <Button variant="secondary" onClick={() => router.push('/admin/projects')}>
          Volver a Projects
        </Button>
      </div>

      <div className="flex flex-1 overflow-hidden border-x border-slate-200 bg-white">
        {/* Chat panel */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto p-6">
            {loadingHistory ? (
              <p className="py-12 text-center text-sm text-slate-500">Cargando conversación...</p>
            ) : messages.length === 0 ? (
              <p className="py-12 text-center text-sm text-slate-500">
                Escribe tu primer mensaje para empezar a construir el brief de esta landing.
                Por ejemplo: &quot;Quiero una landing para mi marca de café&quot;.
              </p>
            ) : (
              messages.map((msg, i) => (
                <div key={i} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                  <div
                    className={cn(
                      'max-w-[75%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm',
                      msg.role === 'user'
                        ? 'rounded-br-sm bg-accent-600 text-white'
                        : 'rounded-bl-sm bg-slate-100 text-slate-900'
                    )}
                  >
                    {msg.content}
                  </div>
                </div>
              ))
            )}
            {sending && <p className="text-sm italic text-slate-500">Claude está escribiendo...</p>}
            <div ref={bottomRef} />
          </div>

          {error && (
            <div className="mx-6 mb-3">
              <InlineMessage kind="error">{error}</InlineMessage>
            </div>
          )}

          <div className="border-t border-slate-200 p-4">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribe tu respuesta..."
                disabled={sending || loadingHistory}
                className="flex-1"
              />
              <Button
                onClick={handleSend}
                disabled={sending || loadingHistory || !input.trim()}
                aria-label="Enviar mensaje"
                className="px-3"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            {briefStatus === 'ready' && (
              <p className="mt-2 text-xs text-slate-400">
                El brief ya está listo, pero puedes seguir escribiendo para afinar detalles
                — se seguirá guardando la conversación.
              </p>
            )}
          </div>
        </div>

        {/* Brief summary panel — only once ready */}
        {briefStatus === 'ready' && briefJson && (
          <div className="w-96 overflow-y-auto border-l border-slate-200 bg-slate-50 p-5">
            <div className="mb-4">
              <InlineMessage kind="success">
                Brief listo. Pásaselo al equipo técnico para que construya la web.
              </InlineMessage>
            </div>

            <BriefSummary brief={briefJson} />

            <button
              onClick={() => setShowRawJson((v) => !v)}
              className="mt-4 flex w-full items-center justify-between rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100"
            >
              Ver JSON completo
              {showRawJson ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
            {showRawJson && (
              <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-words rounded-lg bg-slate-900 p-3 text-[0.65rem] text-slate-100">
                {JSON.stringify(briefJson, null, 2)}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function BriefSummary({ brief }: { brief: BriefJson }) {
  return (
    <div className="space-y-4 text-sm">
      <SummarySection title="Marca">
        <p className="font-semibold text-slate-800">{brief.brand?.name || 'TBD'}</p>
        <p className="text-slate-600">{brief.brand?.description || 'TBD'}</p>
        <p className="mt-1 text-xs text-slate-500">Industria: {brief.brand?.industry || 'TBD'}</p>
      </SummarySection>

      <SummarySection title="Objetivo">
        <p className="text-slate-700">{brief.goal?.primary_action || 'TBD'}</p>
        {brief.goal?.details && <p className="mt-1 text-xs text-slate-500">{brief.goal.details}</p>}
      </SummarySection>

      <SummarySection title="Público objetivo">
        <p className="text-slate-700">{brief.audience?.description || 'TBD'}</p>
      </SummarySection>

      <SummarySection title="Secciones">
        <div className="flex flex-wrap gap-1">
          {(brief.sections?.requested ?? []).length > 0 ? (
            brief.sections?.requested?.map((s) => (
              <span key={s} className="rounded bg-slate-200 px-2 py-0.5 text-xs text-slate-700">
                {s}
              </span>
            ))
          ) : (
            <span className="text-slate-500">TBD</span>
          )}
        </div>
        {brief.sections?.notes && <p className="mt-1 text-xs text-slate-500">{brief.sections.notes}</p>}
      </SummarySection>

      <SummarySection title="Diseño">
        <p className="text-slate-700">Logo: {yesNo(brief.design?.has_logo)}</p>
        <p className="text-slate-700">Guía de marca: {yesNo(brief.design?.has_brand_guide)}</p>
        <p className="text-slate-700">Colores: {brief.design?.colors || 'TBD'}</p>
        <p className="text-slate-700">Fuentes: {brief.design?.fonts || 'TBD'}</p>
        {(brief.design?.references ?? []).length > 0 && (
          <ul className="mt-1 list-inside list-disc text-xs text-accent-600">
            {brief.design?.references?.map((ref) => (
              <li key={ref} className="truncate">
                {ref}
              </li>
            ))}
          </ul>
        )}
      </SummarySection>

      <SummarySection title="Tono">
        <p className="text-slate-700">{brief.tone?.description || 'TBD'}</p>
      </SummarySection>

      <SummarySection title="Contenido">
        <p className="text-slate-700">Copy listo: {yesNo(brief.content?.copy_ready)}</p>
        {brief.content?.notes && <p className="mt-1 text-xs text-slate-500">{brief.content.notes}</p>}
      </SummarySection>

      <SummarySection title="Rediseño">
        <p className="text-slate-700">
          {brief.redesign?.is_redesign ? 'Sí, es un rediseño' : 'No, es un proyecto nuevo'}
        </p>
        {brief.redesign?.existing_url && (
          <p className="mt-1 text-xs text-slate-500">{brief.redesign.existing_url}</p>
        )}
      </SummarySection>

      <SummarySection title="Dominio">
        <p className="text-slate-700">Tiene dominio: {yesNo(brief.domain?.has_domain)}</p>
        <p className="text-slate-700">Dominio: {brief.domain?.domain_name || 'TBD'}</p>
        <p className="text-slate-700">En uso actualmente: {yesNo(brief.domain?.currently_in_use)}</p>
      </SummarySection>

      {(brief.notes?.priority || brief.notes?.deadline || brief.notes?.other) && (
        <SummarySection title="Notas">
          {brief.notes?.priority && <p className="text-slate-700">Prioridad: {brief.notes.priority}</p>}
          {brief.notes?.deadline && <p className="text-slate-700">Fecha límite: {brief.notes.deadline}</p>}
          {brief.notes?.other && <p className="mt-1 text-xs text-slate-500">{brief.notes.other}</p>}
        </SummarySection>
      )}
    </div>
  )
}

function SummarySection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      {children}
    </div>
  )
}
