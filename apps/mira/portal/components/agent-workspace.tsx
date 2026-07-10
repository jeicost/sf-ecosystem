'use client'
import { useState, useRef, useEffect } from 'react'
import { Send, Loader2, Copy, Check, RefreshCw } from 'lucide-react'
import { clsx } from 'clsx'
import { useActiveClient } from '@/lib/client-context'
import { CLIENT_ID } from '@/lib/constants'

interface QuickPrompt {
  label: string
  prompt: string
}

interface Props {
  role: string
  agentName: string
  agentEmoji: string
  color: string
  gradient: string
  title: string
  description: string
  placeholder: string
  quickPrompts?: QuickPrompt[]
  formSlot?: React.ReactNode
}

export default function AgentWorkspace({
  role, agentName, agentEmoji, color, gradient,
  title, description, placeholder, quickPrompts = [], formSlot,
}: Props) {
  const { activeClient } = useActiveClient()
  const clientId = activeClient?.id ?? CLIENT_ID

  const [message, setMessage] = useState('')
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const outputRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight
    }
  }, [output])

  const run = async (msg?: string) => {
    const text = msg ?? message
    if (!text.trim() || loading) return
    setOutput('')
    setLoading(true)

    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, message: text, clientId }),
      })

      if (!res.ok || !res.body) throw new Error('Error del agente')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        setOutput(prev => prev + decoder.decode(value, { stream: true }))
      }
    } catch (e) {
      setOutput(`Error al conectar con ${agentName}: ${e instanceof Error ? e.message : 'Error desconocido'}`)
    } finally {
      setLoading(false)
    }
  }

  const copy = async () => {
    if (!output) return
    await navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="px-8 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div
          className={clsx('w-14 h-14 rounded-2xl flex items-center justify-center text-2xl bg-gradient-to-br shrink-0', gradient)}
          style={{ boxShadow: `0 8px 24px ${color}30` }}
        >
          {agentEmoji}
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-white">{title}</h1>
          <p className="text-[#555] mt-0.5 text-sm">{description}</p>
        </div>
        <div className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
          style={{ background: `${color}12`, border: `1px solid ${color}25`, color }}>
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
          {agentName} activo
        </div>
      </div>

      <div className="grid grid-cols-5 gap-5">
        {/* Input panel */}
        <div className="col-span-2 space-y-4">
          {quickPrompts.length > 0 && (
            <div className="card p-4">
              <p className="text-[11px] text-[#555] uppercase tracking-wider mb-3">Preguntas frecuentes</p>
              <div className="space-y-2">
                {quickPrompts.map((qp, i) => (
                  <button
                    key={i}
                    onClick={() => { setMessage(qp.prompt); run(qp.prompt) }}
                    disabled={loading}
                    className="w-full text-left text-xs text-[#888] hover:text-white py-2 px-3 rounded-lg hover:bg-white/5 transition-all border border-transparent hover:border-white/8 disabled:opacity-40"
                  >
                    {qp.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {formSlot && (
            <div className="card p-4">{formSlot}</div>
          )}

          <div className="card p-4">
            <p className="text-[11px] text-[#555] uppercase tracking-wider mb-3">Tu solicitud</p>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder={placeholder}
              rows={5}
              disabled={loading}
              className="w-full bg-transparent text-sm text-white placeholder-[#333] outline-none resize-none leading-relaxed"
              onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) run() }}
            />
            <button
              onClick={() => run()}
              disabled={!message.trim() || loading}
              className="mt-3 w-full py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-30"
              style={{ background: color, color: '#000' }}
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              {loading ? `${agentName} trabajando...` : `Activar ${agentName}`}
            </button>
            <p className="text-[10px] text-[#333] text-center mt-2">⌘ + Enter para enviar</p>
          </div>
        </div>

        {/* Output panel */}
        <div className="col-span-3">
          <div className="card h-full min-h-[500px] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#141414]">
              <div className="flex items-center gap-2">
                <span className="text-base">{agentEmoji}</span>
                <span className="text-sm text-white font-medium">{agentName}</span>
                {loading && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full animate-pulse"
                    style={{ background: `${color}15`, color }}>
                    Escribiendo...
                  </span>
                )}
              </div>
              {output && (
                <div className="flex gap-2">
                  <button onClick={() => { setOutput(''); setMessage('') }}
                    className="text-[#444] hover:text-white transition-colors p-1" title="Nueva consulta">
                    <RefreshCw size={13} />
                  </button>
                  <button onClick={copy}
                    className="text-[#444] hover:text-white transition-colors p-1" title="Copiar">
                    {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                  </button>
                </div>
              )}
            </div>

            <div ref={outputRef} className="flex-1 overflow-y-auto px-5 py-4">
              {!output && !loading && (
                <div className="flex flex-col items-center justify-center h-full text-center py-16">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-4"
                    style={{ background: `${color}12` }}>
                    {agentEmoji}
                  </div>
                  <p className="text-sm text-[#444]">{agentName} está listo.</p>
                  <p className="text-xs text-[#333] mt-1">Escribe tu solicitud o elige una pregunta frecuente.</p>
                </div>
              )}
              {output && (
                <pre className="whitespace-pre-wrap font-sans text-sm text-[#ccc] leading-relaxed">{output}</pre>
              )}
              {loading && !output && (
                <div className="flex items-center gap-2 text-[#555] text-sm py-4">
                  <Loader2 size={14} className="animate-spin" style={{ color }} />
                  <span>{agentName} consultando Brand Brain y procesando...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
