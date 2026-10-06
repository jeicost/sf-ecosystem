'use client'
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import Link from 'next/link'
import { clsx } from 'clsx'
import {
  FileText, Loader2, Plus, Settings, X, Paperclip, Send, Square, MessageSquare, FolderOpen,
  Download, Pencil, Trash2, Check, AlertTriangle, RotateCcw, Link2, Wrench, Radar, Upload,
} from 'lucide-react'
import TenderRadar, { type RadarItem } from '@/components/tenders/TenderRadar'
import { useActiveClient } from '@/lib/client-context'
import { useClientTools } from '@/lib/hooks/useClientTools'
import BrandName from '@/components/ui/BrandName'
import ChatMarkdown from '@/components/chat/ChatMarkdown'
import DocumentsPanel from '@/components/tenders/DocumentsPanel'
import TeachPanel from '@/components/tenders/TeachPanel'
import TemplateSettings from '@/components/tenders/TemplateSettings'
import BrandSectionsPanel from '@/components/tenders/BrandSectionsPanel'
import TenderBrandSwitch from '@/components/tenders/TenderBrandSwitch'
import { uploadTenderFile, removeTenderFile } from '@/lib/tenders/upload-client'
import { trackPage, trackAction } from '@/lib/activity-client'

// Licitaciones como ASISTENTE (Carlos, 05-oct): «que sea solamente un chatbot
// donde se le empieza a decir lo que queremos y nos va ayudando a conseguirlo».
// Usoa trabajaba así con ChatGPT: pega un apartado de la memoria del año
// pasado y el punto del PPT, pide «adáptalo», corrige términos, adjunta
// pliegos y pide el Word. Arriba queda todo lo trabajado (conversaciones,
// documentos, expedientes) para retomarlo; el resto es la conversación.
// La pantalla de pasos sigue entera en /licitaciones/clasico.

// ─── Contrato con /api/tender/chat (lo construye otro módulo) ──────────────
interface ChatSummary { id: string; title: string; tender_id: string | null; updated_at: string; messages_count: number }
interface SavedMessage {
  id: string; role: 'user' | 'assistant'; content: string; at: string
  tools?: { name: string; summary?: string }[]
  documents?: { id: string; title: string }[]
  documentos?: { id: string; titulo: string }[]
  adjuntos?: { filename: string; chars?: number }[]
  attachments?: { filename: string; chars?: number }[]
}
interface DocSummary { id: string; tender_id: string | null; kind: string; title: string; sections?: unknown[]; updated_at: string }
interface SavedTender { id: string; title: string; expediente: string | null; deadline: string | null; status: string; updated_at: string }

// ─── Estado de pantalla ─────────────────────────────────────────────────────
interface ToolRun { key: string; name: string; summary?: string; status: 'start' | 'done' }
interface UIMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  tools: ToolRun[]
  documents: { id: string; title: string }[]
  downloads: string[]
  attachments: { filename: string; chars?: number }[]
  /** El flujo se cortó (red o «Stop»): se deja lo recibido y se ofrece reintentar. */
  interrupted?: 'network' | 'stopped'
  error?: string
  streaming?: boolean
}
interface PendingFile { key: string; file: File; status: 'uploading' | 'ready' | 'error'; path?: string; error?: string }
interface SentAttachment { path: string; filename: string; mime: string }
/** Lo necesario para repetir un envío que se cortó a mitad. */
interface LastSend { message: string; attachments: SentAttachment[]; tenderId: string | null; userMsgId: string; assistantMsgId: string }

const STATUS_COLOR: Record<string, string> = { borrador: '#94A3B8', preparando: '#F59E0B', presentada: '#6366F1', ganada: '#10B981', perdida: '#EF4444' }
const KIND_LABEL: Record<string, string> = { subido: 'Uploaded', anexo: 'Annex', memoria: 'Proposal', oferta: 'Bid' }
const ACCEPT = '.pdf,.docx,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown'

// Sacadas de cómo trabaja Usoa hoy con ChatGPT: son las seis cosas que hace.
const SUGGESTIONS = [
  'Here is the tender: tell me what it asks for and the scoring',
  "Adapt this section of last year's proposal to this year's PPT",
  'Write a new section the PPT asks for',
  'Review my whole proposal against the tender',
  'Translate this tender section from English',
  'Turn this into a Word document',
]

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36)

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  if (Number.isNaN(diff)) return ''
  const m = Math.round(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m} min ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h} h ago`
  const d = Math.round(h / 24)
  if (d < 7) return `${d} d ago`
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

/**
 * Texto del chip de una herramienta en curso. El backend manda `summary` cuando
 * sabe decir algo concreto («Writing section 3…»); si no, se traduce el nombre
 * por palabras clave, porque un nombre interno tipo `read_pliego` no le dice
 * nada a quien está esperando.
 */
function toolLabel(t: { name: string; summary?: string }, brandName: string): string {
  if (t.summary) return t.summary
  // Nombres reales de las herramientas de lib/tenders/chat-core.ts (en español):
  // sin este mapa el chip enseñaba «Leer adjunto…» en una UI en inglés.
  const exact: Record<string, string> = {
    leer_adjunto: 'Reading the attachment…',
    buscar_en_material: `Searching ${brandName} material…`,
    listar_memorias_pasadas: 'Looking at past proposals…',
    listar_expedientes: 'Looking at saved tenders…',
    leer_memoria_pasada: 'Reading a past proposal…',
    extraer_criterios: 'Reading the tender…',
    crear_documento: 'Writing the document…',
    leer_documento: 'Reading the document…',
    editar_seccion: 'Writing the section…',
    generar_memoria_completa: 'Writing the full proposal…',
    exportar_word: 'Preparing the Word document…',
    recordar_leccion: 'Saving the lesson…',
    asociar_expediente: 'Linking the tender…',
    guardar_version_final: 'Saving the final version so MIRA learns from it…',
  }
  if (exact[t.name]) return exact[t.name]
  const n = t.name.toLowerCase()
  if (/pliego|tender|ppt|pcap|read/.test(n)) return 'Reading the tender…'
  if (/search|corpus|knowledge|buscar|memoria_pasada|past/.test(n)) return `Searching ${brandName} material…`
  if (/word|export|docx/.test(n)) return 'Preparing the Word document…'
  if (/section|seccion|write|redact|draft/.test(n)) return 'Writing…'
  if (/review|revis|check/.test(n)) return 'Reviewing…'
  if (/translat|traduc/.test(n)) return 'Translating…'
  if (/document|save|guardar/.test(n)) return 'Saving the document…'
  return n.replace(/[_-]+/g, ' ').replace(/^\w/, (c) => c.toUpperCase()) + '…'
}

/** Descarga el Word de un documento (mismo camino que DocumentsPanel). */
async function downloadWord(clientId: string, documentId: string, title?: string): Promise<string | null> {
  try {
    const res = await fetch('/api/tender/export', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, documentId }),
    })
    if (!res.ok) { const d = await res.json().catch(() => ({})); return d.error || 'Could not export the document' }
    const blob = await res.blob()
    // El nombre lo pone el servidor si lo manda; si no, el título del documento.
    const cd = res.headers.get('Content-Disposition') || ''
    const fromHeader = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(cd)?.[1]
    const name = fromHeader ? decodeURIComponent(fromHeader)
      : `${(title || 'document').replace(/[^\p{L}\p{N}\-_ ]/gu, '').trim() || 'document'}.docx`
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = name
    document.body.appendChild(a); a.click(); a.remove()
    URL.revokeObjectURL(url)
    return null
  } catch { return 'Network error while exporting: try again.' }
}

/** Convierte un mensaje guardado a la forma de pantalla. */
function fromSaved(m: SavedMessage): UIMessage {
  return {
    id: m.id, role: m.role, content: m.content || '',
    tools: (m.tools || []).map((t, i) => ({ key: `${m.id}-${i}`, name: t.name, summary: t.summary, status: 'done' as const })),
    // El motor guarda «documentos» {id,titulo} y «adjuntos»; se aceptan también los nombres en inglés.
    documents: (m.documentos || []).map((d) => ({ id: d.id, title: d.titulo })).concat(m.documents || []),
    downloads: [], attachments: m.adjuntos || m.attachments || [],
  }
}

export default function LicitacionesAssistantPage() {
  const { activeClient, setActiveClient } = useActiveClient()
  const { tools: clientTools, isLoading: toolsLoading } = useClientTools(activeClient?.id)
  const clientId = activeClient?.id
  const brand = activeClient?.primaryColor || '#6366F1'
  const brandName = activeClient?.name || 'your company'

  // La marca activa en un ref: las respuestas que llegan tarde comparan contra
  // ella y se descartan si la marca ha cambiado entretanto (no se pinta el chat
  // de A con B ya activa).
  const clientRef = useRef(clientId)
  useLayoutEffect(() => { clientRef.current = clientId }, [clientId])

  // ── Tira «Your work» ──
  const [chats, setChats] = useState<ChatSummary[]>([])
  const [docs, setDocs] = useState<DocSummary[]>([])
  const [tenders, setTenders] = useState<SavedTender[]>([])
  const [listsLoading, setListsLoading] = useState(false)
  const [tab, setTab] = useState<'chats' | 'docs' | 'tenders'>('chats')
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameText, setRenameText] = useState('')

  // ── Conversación abierta ──
  const [chatId, setChatId] = useState<string | null>(null)
  const [chatTitle, setChatTitle] = useState<string | null>(null)
  const [chatTenderId, setChatTenderId] = useState<string | null>(null)
  const [messages, setMessages] = useState<UIMessage[]>([])
  const [streaming, setStreaming] = useState(false)
  const [openingChat, setOpeningChat] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const lastSendRef = useRef<LastSend | null>(null)
  const autoDownloaded = useRef<Set<string>>(new Set())

  // ── Composer ──
  const [input, setInput] = useState('')
  const [files, setFiles] = useState<PendingFile[]>([])
  const fileRef = useRef<HTMLInputElement>(null)
  const taRef = useRef<HTMLTextAreaElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const stickBottom = useRef(true)

  // ── Cajones ──
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [radarOpen, setRadarOpen] = useState(false)
  const [docOpenId, setDocOpenId] = useState<string | null>(null)
  const [docsRefresh, setDocsRefresh] = useState(0)
  // Subir un Word/PDF ya trabajado fuera para seguir con él (Carlos, 5-oct: «no sé dónde se subiría el documento»).
  const docUploadRef = useRef<HTMLInputElement>(null)
  const [docUploading, setDocUploading] = useState(false)
  const [docUploadError, setDocUploadError] = useState<string | null>(null)
  const [busyDoc, setBusyDoc] = useState<string | null>(null)

  // ─── Listas ──────────────────────────────────────────────────────────────
  const loadChats = useCallback(async () => {
    if (!clientId) return
    try {
      const res = await fetch(`/api/tender/chat?clientId=${clientId}`)
      if (!res.ok || clientRef.current !== clientId) return
      const data = await res.json()
      if (clientRef.current === clientId) setChats((data.chats || []).map((c: ChatSummary & { messages?: number }) => ({ ...c, messages_count: c.messages_count ?? c.messages ?? 0 })))
    } catch { /* la tira es accesoria: el chat sigue usable sin ella */ }
  }, [clientId])

  const loadDocs = useCallback(async () => {
    if (!clientId) return
    try {
      const res = await fetch(`/api/tender/documents?clientId=${clientId}`)
      if (!res.ok || clientRef.current !== clientId) return
      const data = await res.json()
      if (clientRef.current === clientId) setDocs(data.documents || [])
    } catch { /* accesoria */ }
  }, [clientId])

  const loadTenders = useCallback(async () => {
    if (!clientId) return
    try {
      const res = await fetch(`/api/tender/saved?clientId=${clientId}`)
      if (!res.ok || clientRef.current !== clientId) return
      const data = await res.json()
      if (clientRef.current === clientId) setTenders(data.tenders || [])
    } catch { /* accesoria */ }
  }, [clientId])

  // Cambio de marca: se corta lo que esté en vuelo, se vacía el chat abierto
  // y se recargan las listas de la marca nueva.
  useEffect(() => {
    abortRef.current?.abort()
    abortRef.current = null
    lastSendRef.current = null
    autoDownloaded.current = new Set()
    setChatId(null); setChatTitle(null); setChatTenderId(null)
    setMessages([]); setStreaming(false); setError(null)
    setInput(''); setFiles([])
    setChats([]); setDocs([]); setTenders([])
    setDocOpenId(null); setSettingsOpen(false); setRadarOpen(false); setRenamingId(null)
    if (!clientId) return
    trackPage('/licitaciones', clientId)
    setListsLoading(true)
    Promise.allSettled([loadChats(), loadDocs(), loadTenders()]).finally(() => {
      if (clientRef.current === clientId) setListsLoading(false)
    })
  }, [clientId, loadChats, loadDocs, loadTenders])

  // El asistente puede ligar la conversación a un expediente a mitad
  // (herramienta asociar_expediente): la lista recargada tras cada respuesta
  // trae el tender_id vigente y se sincroniza aquí.
  useEffect(() => {
    if (!chatId) return
    const c = chats.find((x) => x.id === chatId)
    if (c) setChatTenderId(c.tender_id)
  }, [chats, chatId])

  // Al salir de la página, se corta el flujo: si no, seguiría leyendo en vano.
  useEffect(() => () => abortRef.current?.abort(), [])

  // ─── Scroll: pegado abajo mientras la persona no suba a leer ────────────
  const onScroll = () => {
    const el = scrollRef.current
    if (!el) return
    stickBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120
  }
  useEffect(() => {
    const el = scrollRef.current
    if (el && stickBottom.current) el.scrollTop = el.scrollHeight
  }, [messages])

  // ─── Textarea que crece ─────────────────────────────────────────────────
  useEffect(() => {
    const ta = taRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = `${Math.min(ta.scrollHeight, 240)}px`
  }, [input])

  const patchMsg = (id: string, fn: (m: UIMessage) => UIMessage) =>
    setMessages((prev) => prev.map((m) => (m.id === id ? fn(m) : m)))

  // ─── Conversaciones ─────────────────────────────────────────────────────
  const newChat = (tender?: SavedTender) => {
    if (streaming) abortRef.current?.abort()
    setChatId(null); setChatTitle(null)
    setChatTenderId(tender?.id ?? null)
    setMessages([]); setError(null)
    lastSendRef.current = null
    stickBottom.current = true
    if (clientId) trackAction('/licitaciones', 'chat-nuevo', clientId, tender ? { tenderId: tender.id } : undefined)
    setTimeout(() => taRef.current?.focus(), 0)
  }

  const openChat = async (id: string) => {
    if (!clientId || id === chatId) return
    if (streaming) abortRef.current?.abort()
    setOpeningChat(id); setError(null)
    trackAction('/licitaciones', 'chat-abrir', clientId)
    try {
      const res = await fetch(`/api/tender/chat?clientId=${clientId}&id=${id}`)
      const data = await res.json().catch(() => ({}))
      if (clientRef.current !== clientId) return
      if (!res.ok || !data.chat) { setError(data.error || 'Could not open the conversation'); return }
      const c = data.chat as { id: string; title: string; tender_id: string | null; messages: SavedMessage[] }
      setChatId(c.id); setChatTitle(c.title); setChatTenderId(c.tender_id)
      setMessages((c.messages || []).map(fromSaved))
      lastSendRef.current = null
      stickBottom.current = true
    } catch {
      setError('Network error while opening the conversation: try again.')
    } finally { setOpeningChat(null) }
  }

  const renameChat = async (id: string, title: string) => {
    const t = title.trim()
    setRenamingId(null)
    if (!clientId || !t) return
    setChats((prev) => prev.map((c) => (c.id === id ? { ...c, title: t } : c)))
    if (id === chatId) setChatTitle(t)
    try {
      const res = await fetch('/api/tender/chat', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, id, title: t }),
      })
      // Se relee la lista pase lo que pase: si no guardó, vuelve el título real
      // en vez de quedarse uno que solo existe en pantalla.
      if (!res.ok) setError('Could not rename the conversation')
    } catch { setError('Network error while renaming') } finally { void loadChats() }
  }

  const deleteChat = async (c: ChatSummary) => {
    if (!clientId) return
    if (!window.confirm(`Delete the conversation “${c.title}”? The documents it created are kept.`)) return
    try {
      const res = await fetch('/api/tender/chat', {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, id: c.id }),
      })
      if (!res.ok) { setError('Could not delete the conversation'); return }
      if (c.id === chatId) newChat()
      void loadChats()
    } catch { setError('Network error while deleting') }
  }

  // ─── Adjuntos: se suben al elegirlos, viaja solo la ruta ────────────────
  const addFiles = (list: FileList | null) => {
    if (!list || !clientId) return
    const cid = clientId
    const nuevos: PendingFile[] = Array.from(list).map((file) => ({ key: uid(), file, status: 'uploading' }))
    setFiles((prev) => [...prev, ...nuevos])
    trackAction('/licitaciones', 'chat-adjuntar', cid, { n: nuevos.length, bytes: nuevos.reduce((s, f) => s + f.file.size, 0) })
    for (const pf of nuevos) {
      void uploadTenderFile(cid, pf.file).then((up) => {
        if (clientRef.current !== cid) return
        setFiles((prev) => {
          const sigue = prev.some((f) => f.key === pf.key)
          // Quitado mientras subía: se borra del almacenamiento para no dejar huérfanos.
          if (!sigue) { if ('path' in up) void removeTenderFile(cid, up.path); return prev }
          return prev.map((f) => f.key !== pf.key ? f
            : 'error' in up ? { ...f, status: 'error', error: up.error } : { ...f, status: 'ready', path: up.path })
        })
      })
    }
    if (fileRef.current) fileRef.current.value = ''
  }

  const removeFile = (pf: PendingFile) => {
    setFiles((prev) => prev.filter((f) => f.key !== pf.key))
    if (pf.path && clientId) void removeTenderFile(clientId, pf.path)
  }

  // ─── Envío y lectura del flujo ──────────────────────────────────────────
  const stream = async (payload: { message: string; attachments: SentAttachment[]; tenderId: string | null }, userMsgId: string, assistantMsgId: string) => {
    if (!clientId) return
    const cid = clientId
    const ctrl = new AbortController()
    abortRef.current = ctrl
    setStreaming(true); setError(null)
    lastSendRef.current = { ...payload, userMsgId, assistantMsgId }
    let gotAnything = false
    let finished = false

    try {
      const res = await fetch('/api/tender/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: cid,
          ...(chatId ? { chatId } : {}),
          message: payload.message,
          ...(payload.attachments.length ? { attachments: payload.attachments } : {}),
          // Solo en el primer mensaje: después la conversación ya está ligada.
          ...(!chatId && payload.tenderId ? { tenderId: payload.tenderId } : {}),
        }),
        signal: ctrl.signal,
      })
      if (!res.ok || !res.body) {
        const d = await res.json().catch(() => ({}))
        // Antes de que empiece el flujo no se ha perdido nada: el texto y los
        // adjuntos vuelven a la caja para reintentar sin reescribir.
        setMessages((prev) => prev.filter((m) => m.id !== userMsgId && m.id !== assistantMsgId))
        setInput(payload.message)
        setFiles(payload.attachments.map((a) => ({ key: uid(), file: new File([], a.filename, { type: a.mime }), status: 'ready', path: a.path })))
        setError(d.error || `The assistant could not answer (${res.status}).`)
        finished = true
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buf = ''
      const handle = (event: string, raw: string) => {
        let data: Record<string, unknown> = {}
        try { data = raw ? JSON.parse(raw) : {} } catch { return }
        if (clientRef.current !== cid) return
        gotAnything = true
        switch (event) {
          case 'chat': {
            if (typeof data.chatId === 'string') setChatId(data.chatId)
            if (typeof data.title === 'string') setChatTitle(data.title)
            break
          }
          case 'delta': {
            const text = typeof data.text === 'string' ? data.text : ''
            if (text) patchMsg(assistantMsgId, (m) => ({ ...m, content: m.content + text }))
            break
          }
          case 'tool': {
            const name = String(data.name || 'tool')
            const summary = typeof data.summary === 'string' && data.summary ? data.summary : undefined
            const status = data.status === 'done' ? 'done' : 'start'
            patchMsg(assistantMsgId, (m) => {
              // «done» cierra la última ejecución abierta con ese nombre; si no
              // la hay (llegó solo el done), se añade ya cerrada.
              const idx = status === 'done' ? m.tools.map((t) => t.name === name && t.status === 'start').lastIndexOf(true) : -1
              if (idx >= 0) {
                const tools = m.tools.slice()
                tools[idx] = { ...tools[idx], status: 'done', summary: summary ?? tools[idx].summary }
                return { ...m, tools }
              }
              return { ...m, tools: [...m.tools, { key: uid(), name, summary, status }] }
            })
            break
          }
          case 'document': {
            const id = String(data.id || '')
            if (!id) break
            const title = String(data.title || 'Document')
            patchMsg(assistantMsgId, (m) => m.documents.some((d) => d.id === id) ? m : { ...m, documents: [...m.documents, { id, title }] })
            void loadDocs()
            setDocsRefresh((n) => n + 1)
            break
          }
          case 'download': {
            const documentId = String(data.documentId || '')
            if (!documentId) break
            patchMsg(assistantMsgId, (m) => m.downloads.includes(documentId) ? m : { ...m, downloads: [...m.downloads, documentId] })
            // Se intenta bajar solo una vez; el botón de la tarjeta queda por si
            // el navegador lo bloquea por no venir de un clic.
            if (!autoDownloaded.current.has(documentId)) {
              autoDownloaded.current.add(documentId)
              void downloadWord(cid, documentId).then((err) => { if (err) patchMsg(assistantMsgId, (m) => ({ ...m, error: err })) })
            }
            break
          }
          case 'error': {
            // Un error del servidor (p. ej. sin saldo) cierra el stream a propósito: no es un
            // corte de red, así que no se pinta además «The connection dropped».
            finished = true
            patchMsg(assistantMsgId, (m) => ({ ...m, error: String(data.message || 'Something went wrong'), streaming: false }))
            break
          }
          case 'done': {
            finished = true
            if (typeof data.messageId === 'string') {
              const realId = data.messageId
              setMessages((prev) => prev.map((m) => (m.id === assistantMsgId ? { ...m, id: realId, streaming: false } : m)))
            } else {
              patchMsg(assistantMsgId, (m) => ({ ...m, streaming: false }))
            }
            break
          }
        }
      }

      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        buf += decoder.decode(value, { stream: true })
        // Los eventos SSE van separados por una línea en blanco.
        let sep: number
        while ((sep = buf.search(/\r?\n\r?\n/)) >= 0) {
          const block = buf.slice(0, sep)
          buf = buf.slice(sep).replace(/^\r?\n\r?\n/, '')
          let event = 'message'
          const dataLines: string[] = []
          for (const line of block.split(/\r?\n/)) {
            if (line.startsWith('event:')) event = line.slice(6).trim()
            else if (line.startsWith('data:')) dataLines.push(line.slice(5).replace(/^ /, ''))
          }
          handle(event, dataLines.join('\n'))
        }
      }
      if (!finished && clientRef.current === cid) {
        // El servidor cerró sin «done»: se trata como corte de red.
        patchMsg(assistantMsgId, (m) => ({ ...m, streaming: false, interrupted: 'network' }))
      }
    } catch (e) {
      if (clientRef.current !== cid) return
      const aborted = e instanceof DOMException && e.name === 'AbortError'
      if (!gotAnything && !aborted) {
        // No llegó ni un byte: mismo trato que un error HTTP, nada se pierde.
        setMessages((prev) => prev.filter((m) => m.id !== userMsgId && m.id !== assistantMsgId))
        setInput(payload.message)
        setFiles(payload.attachments.map((a) => ({ key: uid(), file: new File([], a.filename, { type: a.mime }), status: 'ready', path: a.path })))
        setError('Network error: the message was not sent. Check your connection and try again.')
      } else {
        patchMsg(assistantMsgId, (m) => ({ ...m, streaming: false, interrupted: aborted ? 'stopped' : 'network' }))
      }
    } finally {
      if (abortRef.current === ctrl) abortRef.current = null
      if (clientRef.current === cid) {
        setStreaming(false)
        void loadChats()
      }
    }
  }

  const send = async (text?: string) => {
    if (!clientId || streaming) return
    const message = (text ?? input).trim()
    if (!message) return
    if (files.some((f) => f.status === 'uploading')) { setError('Wait until the attachments finish uploading.'); return }
    const ready = files.filter((f) => f.status === 'ready' && f.path)
    const attachments: SentAttachment[] = ready.map((f) => ({ path: f.path!, filename: f.file.name, mime: f.file.type || 'application/octet-stream' }))
    trackAction('/licitaciones', 'chat-enviar', clientId, { chars: message.length, adjuntos: attachments.length, nuevo: !chatId })

    const userMsgId = uid(), assistantMsgId = uid()
    setMessages((prev) => [
      ...prev,
      { id: userMsgId, role: 'user', content: message, tools: [], documents: [], downloads: [], attachments: attachments.map((a) => ({ filename: a.filename })) },
      { id: assistantMsgId, role: 'assistant', content: '', tools: [], documents: [], downloads: [], attachments: [], streaming: true },
    ])
    setInput(''); setFiles(files.filter((f) => f.status === 'error'))
    stickBottom.current = true
    await stream({ message, attachments, tenderId: chatTenderId }, userMsgId, assistantMsgId)
  }

  // Reintento tras un corte: se quita el intento fallido y se repite el mismo
  // mensaje con los mismos adjuntos.
  const retry = async () => {
    const last = lastSendRef.current
    if (!last || streaming) return
    const userMsgId = uid(), assistantMsgId = uid()
    setMessages((prev) => [
      ...prev.filter((m) => m.id !== last.userMsgId && m.id !== last.assistantMsgId),
      { id: userMsgId, role: 'user', content: last.message, tools: [], documents: [], downloads: [], attachments: last.attachments.map((a) => ({ filename: a.filename })) },
      { id: assistantMsgId, role: 'assistant', content: '', tools: [], documents: [], downloads: [], attachments: [], streaming: true },
    ])
    stickBottom.current = true
    // Si la conversación ya existe, el servidor guardó el mensaje y consumió los adjuntos al abrir
    // el stream: repetirlo duplicaría el mensaje y apuntaría a ficheros borrados. Se pide que siga.
    const yaGuardado = !!chatId
    await stream(yaGuardado
      ? { message: 'The previous reply was cut off. Continue from where you left off.', attachments: [], tenderId: last.tenderId }
      : { message: last.message, attachments: last.attachments, tenderId: last.tenderId }, userMsgId, assistantMsgId)
  }

  const stop = () => abortRef.current?.abort()

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      void send()
    }
  }

  const exportDoc = async (id: string, title?: string) => {
    if (!clientId) return
    setBusyDoc(id)
    trackAction('/licitaciones', 'exportar-word', clientId, { origen: 'chat' })
    const err = await downloadWord(clientId, id, title)
    setBusyDoc(null)
    if (err) setError(err)
  }

  const openDoc = (id: string) => { setDocOpenId(id); setDocsRefresh((n) => n + 1) }

  // El fichero se sube directo a Storage (Vercel corta cuerpos de más de 4,5 MB) y el
  // servidor lo lee, lo trocea en secciones editables y lo borra. Si falla, no queda huérfano.
  const uploadDoc = async (file: File) => {
    if (!clientId) return
    setDocUploading(true); setDocUploadError(null)
    trackAction('/licitaciones', 'subir-documento', clientId, { bytes: file.size, tipo: file.type, origen: 'tira' })
    let subido: string | null = null
    try {
      const up = await uploadTenderFile(clientId, file)
      if ('error' in up) { setDocUploadError(up.error); return }
      subido = up.path
      const res = await fetch('/api/tender/documents/upload', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, tenderId: chatTenderId, path: up.path, filename: file.name, mime: file.type }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { if (res.status >= 500) void removeTenderFile(clientId, subido); setDocUploadError(data.error || 'Could not read the document'); return }
      await loadDocs(); setTab('docs')
      if (data.document?.id) openDoc(data.document.id)
    } catch {
      if (subido) void removeTenderFile(clientId, subido)
      setDocUploadError('Network error while uploading: check your connection and try again.')
    } finally { setDocUploading(false); if (docUploadRef.current) docUploadRef.current.value = '' }
  }

  // Selector móvil: un solo <select> con los tres grupos.
  const onMobilePick = (v: string) => {
    const [kind, id] = v.split(':')
    if (kind === 'chat') void openChat(id)
    else if (kind === 'doc') openDoc(id)
    else if (kind === 'tender') { const t = tenders.find((x) => x.id === id); if (t) newChat(t) }
  }

  // ─── Pantallas sin herramienta ──────────────────────────────────────────
  const notEnabled = !!activeClient && !toolsLoading && !clientTools.some((t) => t.id === 'tenders' && t.enabled)
  if (notEnabled && activeClient) {
    return (
      <div className="mx-auto max-w-2xl px-8 py-16 text-center">
        <FileText size={28} className="mx-auto mb-3 text-ink-muted" />
        <h1 className="text-lg font-semibold text-ink">Tenders is not enabled for <BrandName>{activeClient.name}</BrandName></h1>
        <p className="mt-2 text-sm text-ink-tertiary">This tool is for clients that bid on public tenders. If <BrandName>{activeClient.name}</BrandName> needs it, let us know and we will enable it.</p>
        <TenderBrandSwitch activeClientId={activeClient.id} onSwitch={setActiveClient} />
      </div>
    )
  }

  const linkedTender = chatTenderId ? tenders.find((t) => t.id === chatTenderId) : null
  const empty = messages.length === 0
  const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant')
  const uploading = files.some((f) => f.status === 'uploading')

  return (
    // Alto completo de la zona principal (en móvil, menos su barra superior):
    // la conversación se desplaza por dentro y la caja de entrada queda fija.
    <div className="flex h-[calc(100dvh-57px)] flex-col md:h-[100dvh]">
      {/* ── Cabecera ── */}
      <div className="shrink-0 border-b border-line-subtle px-4 pt-5 pb-3 md:px-8">
        <div className="mx-auto flex max-w-5xl items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="mb-1 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest" style={{ color: brand }}>
              <FileText size={13} /> Tenders
            </p>
            <h1 className="text-xl font-semibold text-ink">Tenders assistant</h1>
            <p className="mt-0.5 text-sm text-ink-tertiary">Tell it what you need — read a tender, adapt last year’s proposal, write a section, get the Word. It works with everything {brandName} has submitted before.</p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button onClick={() => setRadarOpen(true)} className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-surface-hover" style={{ color: brand }}>
              <Radar size={14} /> Find tenders
            </button>
            <Link href="/licitaciones/clasico" className="rounded-lg px-2 py-1.5 text-xs text-ink-tertiary transition-colors hover:text-ink">Classic view</Link>
            <button onClick={() => setSettingsOpen(true)} aria-label="Settings: Teach MIRA and Word template" title="Teach MIRA · Word template"
              className="rounded-lg p-2 text-ink-tertiary transition-colors hover:bg-surface-hover hover:text-ink">
              <Settings size={16} />
            </button>
          </div>
        </div>

        {/* ── Tira «Your work» ── */}
        <div className="mx-auto mt-3 max-w-5xl">
          {/* Escritorio: pestañas + fila desplazable */}
          <div className="hidden md:block">
            <div className="mb-2 flex items-center gap-1">
              <span className="mr-2 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">Your work</span>
              {([['chats', 'Conversations', chats.length], ['docs', 'Documents', docs.length], ['tenders', 'Tenders', tenders.length]] as const).map(([k, label, n]) => (
                <button key={k} onClick={() => setTab(k)}
                  className={clsx('rounded-lg px-2.5 py-1 text-xs transition-colors', tab === k ? 'bg-surface font-medium text-ink' : 'text-ink-tertiary hover:text-ink')}>
                  {label} <span className="text-ink-muted">{n}</span>
                </button>
              ))}
              {listsLoading && <Loader2 size={12} className="ml-1 animate-spin text-ink-muted" />}
              <span className="flex-1" />
              <button onClick={() => newChat()} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90" style={{ background: brand }}>
                <Plus size={13} /> New conversation
              </button>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {tab === 'chats' && (chats.length === 0
                ? <p className="py-2 text-xs text-ink-muted">{listsLoading ? 'Loading…' : 'No conversations yet. Start one below.'}</p>
                : chats.map((c) => (
                  <div key={c.id} className={clsx('group relative w-56 shrink-0 rounded-xl border px-3 py-2 transition-colors',
                    c.id === chatId ? 'border-line bg-surface' : 'border-line-subtle hover:bg-surface')}>
                    {renamingId === c.id ? (
                      <form onSubmit={(e) => { e.preventDefault(); void renameChat(c.id, renameText) }} className="flex items-center gap-1">
                        <input autoFocus value={renameText} onChange={(e) => setRenameText(e.target.value)} onBlur={() => setRenamingId(null)}
                          onKeyDown={(e) => { if (e.key === 'Escape') setRenamingId(null) }}
                          className="min-w-0 flex-1 rounded border border-line bg-page px-1.5 py-0.5 text-xs text-ink outline-none" />
                        <button type="submit" onMouseDown={(e) => e.preventDefault()} className="text-ink-tertiary hover:text-ink"><Check size={12} /></button>
                      </form>
                    ) : (
                      <button onClick={() => openChat(c.id)} className="block w-full text-left">
                        <span className="flex items-center gap-1.5">
                          {openingChat === c.id ? <Loader2 size={11} className="shrink-0 animate-spin text-ink-muted" /> : <MessageSquare size={11} className="shrink-0 text-ink-muted" />}
                          <span className="truncate pr-8 text-xs font-medium text-ink">{c.title || 'Untitled'}</span>
                        </span>
                        <span className="mt-0.5 block text-[10px] text-ink-muted">
                          {relTime(c.updated_at)} · {c.messages_count} msg{c.tender_id ? ' · linked' : ''}
                        </span>
                      </button>
                    )}
                    {renamingId !== c.id && (
                      <span className="absolute top-1.5 right-1.5 hidden items-center gap-0.5 group-hover:flex">
                        <button onClick={() => { setRenamingId(c.id); setRenameText(c.title) }} aria-label="Rename" className="rounded p-1 text-ink-muted hover:text-ink"><Pencil size={11} /></button>
                        <button onClick={() => deleteChat(c)} aria-label="Delete" className="rounded p-1 text-ink-muted hover:text-red-400"><Trash2 size={11} /></button>
                      </span>
                    )}
                  </div>
                )))}
              {tab === 'docs' && (
                <div className="w-56 shrink-0">
                  <input ref={docUploadRef} type="file" accept={ACCEPT} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void uploadDoc(f) }} />
                  <button onClick={() => docUploadRef.current?.click()} disabled={docUploading || !clientId}
                    className="flex h-full w-full flex-col justify-center rounded-xl border border-dashed px-3 py-2 text-left transition-colors hover:bg-surface disabled:opacity-60"
                    style={{ borderColor: brand }}>
                    <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: brand }}>
                      {docUploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                      {docUploading ? 'Reading the document…' : 'Upload Word or PDF'}
                    </span>
                    <span className="mt-0.5 block text-[10px] text-ink-muted">{docUploadError || 'Your final version or a draft, to keep working on it'}</span>
                  </button>
                </div>
              )}
              {tab === 'docs' && (docs.length === 0
                ? <p className="py-2 text-xs text-ink-muted">{listsLoading ? 'Loading…' : 'No documents yet. The ones the assistant writes are saved here.'}</p>
                : docs.map((d) => (
                  <div key={d.id} className="group relative w-56 shrink-0 rounded-xl border border-line-subtle px-3 py-2 transition-colors hover:bg-surface">
                    <button onClick={() => openDoc(d.id)} className="block w-full text-left">
                      <span className="flex items-center gap-1.5">
                        <FileText size={11} className="shrink-0" style={{ color: brand }} />
                        <span className="truncate pr-6 text-xs font-medium text-ink">{d.title}</span>
                      </span>
                      <span className="mt-0.5 block text-[10px] text-ink-muted">
                        {KIND_LABEL[d.kind] || d.kind}{Array.isArray(d.sections) ? ` · ${d.sections.length} sections` : ''} · {relTime(d.updated_at)}
                      </span>
                    </button>
                    <button onClick={() => exportDoc(d.id, d.title)} aria-label="Download Word" title="Download Word"
                      className="absolute top-1.5 right-1.5 hidden rounded p-1 text-ink-muted hover:text-ink group-hover:block">
                      {busyDoc === d.id ? <Loader2 size={11} className="animate-spin" /> : <Download size={11} />}
                    </button>
                  </div>
                )))}
              {tab === 'tenders' && (tenders.length === 0
                ? <p className="py-2 text-xs text-ink-muted">{listsLoading ? 'Loading…' : 'No saved tenders.'}</p>
                : tenders.map((t) => (
                  <button key={t.id} onClick={() => newChat(t)} title="Start a conversation about this tender"
                    className="w-56 shrink-0 rounded-xl border border-line-subtle px-3 py-2 text-left transition-colors hover:bg-surface">
                    <span className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: STATUS_COLOR[t.status] || '#94A3B8' }} />
                      <span className="truncate text-xs font-medium text-ink">{t.title}</span>
                    </span>
                    <span className="mt-0.5 block truncate text-[10px] text-ink-muted">
                      {t.expediente ? `Exp. ${t.expediente} · ` : ''}{relTime(t.updated_at)}
                    </span>
                  </button>
                )))}
            </div>
          </div>

          {/* Móvil: la tira se pliega en un selector */}
          <div className="flex items-center gap-2 md:hidden">
            <select value="" onChange={(e) => { if (e.target.value) onMobilePick(e.target.value) }} aria-label="Your work"
              className="min-w-0 flex-1 rounded-lg border border-line bg-surface px-2 py-1.5 text-xs text-ink-secondary outline-none">
              <option value="">{listsLoading ? 'Loading your work…' : `Your work (${chats.length + docs.length + tenders.length})`}</option>
              {chats.length > 0 && <optgroup label="Conversations">{chats.map((c) => <option key={c.id} value={`chat:${c.id}`}>{c.title || 'Untitled'}</option>)}</optgroup>}
              {docs.length > 0 && <optgroup label="Documents">{docs.map((d) => <option key={d.id} value={`doc:${d.id}`}>{d.title}</option>)}</optgroup>}
              {tenders.length > 0 && <optgroup label="Tenders (new conversation)">{tenders.map((t) => <option key={t.id} value={`tender:${t.id}`}>{t.title}</option>)}</optgroup>}
            </select>
            <button onClick={() => newChat()} aria-label="New conversation" className="flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-white" style={{ background: brand }}>
              <Plus size={13} /> New
            </button>
          </div>
        </div>
      </div>

      {/* ── Conversación ── */}
      <div ref={scrollRef} onScroll={onScroll} className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-4 py-5 md:px-8">
          {(chatTitle || linkedTender) && (
            <div className="mb-4 flex flex-wrap items-center gap-2 border-b border-line-subtle pb-3">
              {chatTitle && <h2 className="min-w-0 truncate text-sm font-semibold text-ink">{chatTitle}</h2>}
              {/* Renombrar y borrar también aquí: en móvil la tira es un selector y no tiene botones. */}
              {chatId && chatTitle && (
                <span className="flex items-center gap-0.5">
                  <button onClick={() => { const t = window.prompt('Rename conversation', chatTitle); if (t) void renameChat(chatId, t) }} aria-label="Rename" className="rounded p-1 text-ink-muted hover:text-ink"><Pencil size={12} /></button>
                  <button onClick={() => { const c = chats.find((x) => x.id === chatId); if (c) void deleteChat(c) }} aria-label="Delete" className="rounded p-1 text-ink-muted hover:text-red-400"><Trash2 size={12} /></button>
                </span>
              )}
              {linkedTender && (
                <span className="flex items-center gap-1 rounded-full border border-line-subtle px-2 py-0.5 text-[11px] text-ink-tertiary">
                  <Link2 size={11} /> {linkedTender.title.slice(0, 60)}
                </span>
              )}
            </div>
          )}

          {empty ? (
            <div className="pt-6 md:pt-12">
              <p className="text-center text-base font-medium text-ink">What are we working on?</p>
              <p className="mt-1 text-center text-xs text-ink-tertiary">
                {linkedTender ? <>This conversation will be linked to <span className="text-ink-secondary">{linkedTender.title}</span>. </> : null}
                Attach the tender, last year’s proposal or a draft, and say what you need.
              </p>
              <div className="mt-6 grid gap-2 sm:grid-cols-2">
                {SUGGESTIONS.map((s) => (
                  <button key={s} onClick={() => { setInput(s); taRef.current?.focus() }}
                    className="rounded-xl border border-line-subtle bg-surface px-3.5 py-2.5 text-left text-xs text-ink-secondary transition-colors hover:border-line hover:text-ink">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {messages.map((m) => m.role === 'user' ? (
                <div key={m.id} className="flex justify-end">
                  <div className="max-w-[85%] rounded-2xl rounded-br-md border border-line-subtle bg-surface px-3.5 py-2.5">
                    {m.attachments.length > 0 && (
                      <div className="mb-1.5 flex flex-wrap gap-1">
                        {m.attachments.map((a, i) => (
                          <span key={i} className="flex items-center gap-1 rounded-md bg-page px-1.5 py-0.5 text-[10px] text-ink-tertiary">
                            <Paperclip size={10} /> {a.filename}
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="whitespace-pre-wrap break-words text-sm text-ink">{m.content}</p>
                  </div>
                </div>
              ) : (
                <div key={m.id} className="min-w-0">
                  {m.tools.length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-1.5">
                      {m.tools.map((t) => (
                        <span key={t.key} className={clsx('flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px]',
                          t.status === 'start' ? 'border-line text-ink-secondary' : 'border-line-subtle text-ink-muted')}>
                          {t.status === 'start' ? <Loader2 size={10} className="animate-spin" /> : <Check size={10} />}
                          {toolLabel(t, brandName)}
                        </span>
                      ))}
                    </div>
                  )}
                  {m.content
                    ? <div className="text-ink-secondary"><ChatMarkdown content={m.content} /></div>
                    : m.streaming && m.tools.every((t) => t.status === 'done') && (
                      <p className="flex items-center gap-2 text-xs text-ink-muted"><Loader2 size={12} className="animate-spin" /> Thinking…</p>
                    )}
                  {m.documents.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {m.documents.map((d) => (
                        <div key={d.id} className="flex items-center gap-3 rounded-xl border border-line bg-surface px-3 py-2.5">
                          <FileText size={16} className="shrink-0" style={{ color: brand }} />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium text-ink">{d.title}</span>
                            <span className="block text-[11px] text-ink-muted">Saved in your documents</span>
                          </span>
                          <button onClick={() => openDoc(d.id)} className="rounded-lg bg-page px-2.5 py-1 text-xs text-ink-secondary hover:text-ink">Open</button>
                          <button onClick={() => exportDoc(d.id, d.title)} disabled={busyDoc === d.id}
                            className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium text-white disabled:opacity-50" style={{ background: brand }}>
                            {busyDoc === d.id ? <Loader2 size={11} className="animate-spin" /> : <Download size={11} />} Word
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Descargas pedidas por el asistente para documentos que no
                      tienen tarjeta en este mensaje: botón por si la automática
                      la bloqueó el navegador. */}
                  {m.downloads.filter((id) => !m.documents.some((d) => d.id === id)).map((id) => (
                    <button key={id} onClick={() => exportDoc(id, docs.find((d) => d.id === id)?.title)} disabled={busyDoc === id}
                      className="mt-2 flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1 text-xs text-ink-secondary hover:text-ink disabled:opacity-50">
                      {busyDoc === id ? <Loader2 size={11} className="animate-spin" /> : <Download size={11} />}
                      Download {docs.find((d) => d.id === id)?.title || 'the Word document'}
                    </button>
                  ))}
                  {m.error && (
                    <p className="mt-2 flex items-start gap-1.5 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">
                      <AlertTriangle size={13} className="mt-0.5 shrink-0" /> {m.error}
                    </p>
                  )}
                  {m.interrupted && (
                    <p className="mt-2 flex flex-wrap items-center gap-2 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-500">
                      <AlertTriangle size={13} className="shrink-0" />
                      {m.interrupted === 'stopped' ? 'Stopped. What arrived is kept above.' : 'The connection dropped. What arrived is kept above.'}
                      {m.id === lastAssistant?.id && lastSendRef.current && !streaming && (
                        <button onClick={retry} className="flex items-center gap-1 rounded-md bg-page px-2 py-0.5 text-[11px] text-ink-secondary hover:text-ink">
                          <RotateCcw size={11} /> Retry
                        </button>
                      )}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Caja de entrada ── */}
      <div className="shrink-0 border-t border-line-subtle bg-page px-4 pt-3 pb-4 md:px-8">
        <div className="mx-auto max-w-3xl">
          {error && (
            <p className="mb-2 flex items-start gap-1.5 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">
              <AlertTriangle size={13} className="mt-0.5 shrink-0" /> <span className="flex-1">{error}</span>
              <button onClick={() => setError(null)} aria-label="Dismiss" className="shrink-0 hover:text-red-300"><X size={12} /></button>
            </p>
          )}
          <div className="rounded-2xl border border-line bg-surface p-2 focus-within:ring-1 focus-within:ring-ink-muted">
            {files.length > 0 && (
              <div className="mb-1.5 flex flex-wrap gap-1.5 px-1 pt-1">
                {files.map((f) => (
                  <span key={f.key} title={f.error || f.file.name}
                    className={clsx('flex max-w-[260px] items-center gap-1 rounded-lg border px-2 py-1 text-[11px]',
                      f.status === 'error' ? 'border-red-500/40 text-red-400' : 'border-line-subtle text-ink-secondary')}>
                    {f.status === 'uploading' ? <Loader2 size={11} className="shrink-0 animate-spin" /> : f.status === 'error' ? <AlertTriangle size={11} className="shrink-0" /> : <Paperclip size={11} className="shrink-0" />}
                    <span className="truncate">{f.file.name}</span>
                    <button onClick={() => removeFile(f)} aria-label={`Remove ${f.file.name}`} className="shrink-0 text-ink-muted hover:text-ink"><X size={11} /></button>
                  </span>
                ))}
              </div>
            )}
            <textarea ref={taRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={onKeyDown} rows={1}
              placeholder={empty ? 'Paste a section, attach the tender, or tell MIRA what you need…' : 'Reply…'}
              className="block max-h-60 w-full resize-none bg-transparent px-2 py-1.5 text-sm text-ink outline-none placeholder:text-ink-muted" />
            <div className="mt-1 flex items-center justify-between gap-2">
              <button onClick={() => fileRef.current?.click()} disabled={!clientId}
                className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-ink-tertiary transition-colors hover:bg-surface-hover hover:text-ink disabled:opacity-50">
                <Paperclip size={14} /> Attach
              </button>
              <input ref={fileRef} type="file" accept={ACCEPT} multiple className="hidden" onChange={(e) => addFiles(e.target.files)} />
              <span className="hidden flex-1 text-right text-[10px] text-ink-muted sm:block">Enter to send · Shift+Enter for a new line</span>
              {streaming ? (
                <button onClick={stop} className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-ink-secondary hover:text-ink">
                  <Square size={11} className="fill-current" /> Stop
                </button>
              ) : (
                <button onClick={() => send()} disabled={!input.trim() || uploading || !clientId}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40" style={{ background: brand }}>
                  {uploading ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />} Send
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Cajón: documento ── */}
      {docOpenId && clientId && (
        <Drawer onClose={() => { setDocOpenId(null); void loadDocs() }} title="Documents" icon={<FolderOpen size={15} style={{ color: brand }} />}>
          {/* Se reutiliza el panel de documentos entero: editar secciones, pedir
              mejoras, guardar y Word ya están resueltos ahí. openId deja abierto
              el que se ha pulsado. */}
          <DocumentsPanel key={`docs-${clientId}`} clientId={clientId} tenderId={null} brand={brand} openId={docOpenId} refreshKey={docsRefresh} />
        </Drawer>
      )}

      {/* ── Cajón: buscador de licitaciones (PLACSP) ── */}
      {radarOpen && clientId && (
        <Drawer onClose={() => setRadarOpen(false)} title="Find tenders" icon={<Radar size={15} style={{ color: brand }} />}>
          <TenderRadar key={`radar-${clientId}`} clientId={clientId} brand={brand} onWorkOn={(it: RadarItem) => {
            // Conversación nueva con los datos del concurso ya escritos; la persona
            // adjunta los pliegos de PLACSP y envía.
            newChat(); setRadarOpen(false)
            setInput([
              `Quiero preparar esta licitación: «${it.title}».`,
              it.org ? `Órgano: ${it.org}.` : '', it.expediente ? `Expediente: ${it.expediente}.` : '',
              it.amount != null ? `Importe: ${new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(it.amount)}.` : '',
              it.deadline ? `Plazo: ${new Date(it.deadline).toLocaleDateString('es-ES')}.` : '', it.link ? `PLACSP: ${it.link}` : '',
              'Te adjunto los pliegos. Dime qué pide, cómo se puntúa y por dónde empezamos.',
            ].filter(Boolean).join('\n'))
            setTimeout(() => taRef.current?.focus(), 50)
          }} />
        </Drawer>
      )}

      {/* ── Cajón: ajustes ── */}
      {settingsOpen && clientId && (
        <Drawer onClose={() => setSettingsOpen(false)} title="Settings" icon={<Wrench size={15} style={{ color: brand }} />}>
          {/* key por marca y DISTINTA en cada hermano: con keys iguales React dejó
              nodos zombis en producción (dos «Teach MIRA», 1-oct). */}
          <TeachPanel key={`teach-${clientId}`} clientId={clientId} brand={brand} tenderId={chatTenderId} />
          <TemplateSettings key={`template-${clientId}`} clientId={clientId} brand={brand} />
          <BrandSectionsPanel key={`pages-${clientId}`} clientId={clientId} brand={brand} />
        </Drawer>
      )}
    </div>
  )
}

/** Cajón lateral a la derecha; en móvil ocupa toda la pantalla. */
function Drawer({ title, icon, onClose, children }: { title: string; icon?: ReactNode; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const h = (e: globalThis.KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/40" />
      <div role="dialog" aria-label={title} className="relative flex h-full w-full max-w-2xl flex-col border-l border-line bg-page shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-line-subtle px-5 py-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">{icon} {title}</h2>
          <button onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-ink-tertiary hover:bg-surface-hover hover:text-ink"><X size={16} /></button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-8">{children}</div>
      </div>
    </div>
  )
}
