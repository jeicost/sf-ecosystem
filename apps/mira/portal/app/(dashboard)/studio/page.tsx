'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2, Sparkles, Image as ImageIcon, Download, Library } from 'lucide-react'
import { useActiveClient } from '@/lib/client-context'
import { STUDIO_FORMATS } from '@/lib/generation/image-studio'

// Estudio Visual v1 — generación de imagen guiada por la marca (identidad visual
// del Brand Brain aplicada automáticamente: escala a cualquier cliente). El
// motor y el almacenamiento son los que ya existían; esto es la UI dedicada.
const FORMAT_KEYS = Object.keys(STUDIO_FORMATS) as Array<keyof typeof STUDIO_FORMATS>

interface Result { imageUrl: string; format: string; usedBrandIdentity: boolean; referencesUsed: number; usedPillar: string | null }

export default function StudioPage() {
  const { activeClient } = useActiveClient()
  const clientId = activeClient?.id
  const brand = activeClient?.primaryColor || '#8B5CF6'

  const [prompt, setPrompt] = useState('')
  const [format, setFormat] = useState<string>('post')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<Result | null>(null)
  // Referencias que se suben en el momento: mandan sobre las del corpus, porque
  // si alguien se molesta en dar un ejemplo es que quiere ESE look.
  const [refs, setRefs] = useState<{ name: string; dataUrl: string }[]>([])
  // Pilares del Cerebro del cliente activo. La imagen puede (y suele deber)
  // colgar de una línea editorial concreta — era la queja literal del CEO:
  // pidió "la imagen del pilar cool pics" y el pilar nunca llegaba al prompt.
  const [pillars, setPillars] = useState<string[]>([])
  const [pillar, setPillar] = useState<string>('')

  useEffect(() => {
    setPillar('')
    if (!clientId) { setPillars([]); return }
    fetch(`/api/brand-brain?clientId=${clientId}`)
      .then((r) => r.json())
      .then((d) => setPillars(
        (d.pillars ?? [])
          .map((p: any) => p.pillar_name ?? p.name)
          .filter((n: unknown): n is string => typeof n === 'string' && n.trim() !== '')
      ))
      .catch(() => setPillars([]))
  }, [clientId])

  const addRefs = (files: FileList | null) => {
    if (!files) return
    const room = 3 - refs.length
    Array.from(files).slice(0, Math.max(0, room)).forEach((file) => {
      if (!file.type.startsWith('image/')) return
      if (file.size > 4 * 1024 * 1024) { setError(`${file.name} is over 4 MB`); return }
      const reader = new FileReader()
      reader.onload = () => setRefs((prev) => prev.length >= 3 ? prev : [...prev, { name: file.name, dataUrl: String(reader.result) }])
      reader.readAsDataURL(file)
    })
  }

  const generate = async () => {
    if (!prompt.trim() || !clientId || loading) return
    setLoading(true); setError(null); setResult(null)
    try {
      const res = await fetch('/api/studio/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, format, clientId, pillar: pillar || null, referenceImages: refs.map(r => r.dataUrl) }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Could not generate the image'); return }
      setResult(data)
    } catch {
      setError('Network error while generating')
    } finally {
      setLoading(false)
    }
  }

  const aspect = format === 'story' ? '2 / 3' : format === 'wide' ? '3 / 2' : '1 / 1'

  return (
    <div className="mx-auto max-w-5xl px-8 py-10">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <p className="mb-1 flex items-center gap-2 text-[10px] uppercase tracking-widest font-semibold" style={{ color: brand }}>
            <ImageIcon size={13} /> Visual Studio
          </p>
          <h1 className="text-2xl font-semibold text-ink">Generate images with your brand identity</h1>
          <p className="mt-1 text-sm text-ink-tertiary">
            Colors, typography and style come from your Brand Brain automatically.
          </p>
        </div>
        <Link href="/gallery" className="inline-flex items-center gap-1.5 rounded-lg bg-surface px-3 py-2 text-xs text-ink-secondary hover:text-ink transition-colors">
          <Library size={14} /> Gallery
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Panel de generación */}
        <div className="rounded-2xl border border-line bg-surface p-5">
          <label className="mb-2 block text-xs font-medium text-ink-secondary">What image do you need?</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={5}
            placeholder="E.g. a gourmet burger on a dark background, soft smoke, editorial product style…"
            className="w-full resize-y rounded-xl border border-line bg-page p-3 text-sm text-ink outline-none focus:ring-1 focus:ring-ink-muted"
          />

          {pillars.length > 0 && (
            <>
              <label className="mb-2 mt-4 block text-xs font-medium text-ink-secondary">Content pillar</label>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setPillar('')}
                  className={`rounded-lg px-3 py-1.5 text-xs transition-all ${pillar === '' ? 'text-white' : 'bg-page text-ink-secondary hover:text-ink'}`}
                  style={pillar === '' ? { background: brand } : {}}>
                  None
                </button>
                {pillars.map((name) => (
                  <button key={name} onClick={() => setPillar(name)}
                    className={`rounded-lg px-3 py-1.5 text-xs transition-all ${pillar === name ? 'text-white' : 'bg-page text-ink-secondary hover:text-ink'}`}
                    style={pillar === name ? { background: brand } : {}}>
                    {name}
                  </button>
                ))}
              </div>
            </>
          )}

          <label className="mb-2 mt-4 block text-xs font-medium text-ink-secondary">Format</label>
          <div className="flex flex-wrap gap-2">
            {FORMAT_KEYS.map((k) => (
              <button key={k} onClick={() => setFormat(k)}
                className={`rounded-lg px-3 py-1.5 text-xs transition-all ${format === k ? 'text-white' : 'bg-page text-ink-secondary hover:text-ink'}`}
                style={format === k ? { background: brand } : {}}>
                {STUDIO_FORMATS[k].label}
              </button>
            ))}
          </div>

          {/* Referencias visuales subidas al vuelo */}
          <label className="mb-2 mt-4 block text-xs font-medium text-ink-secondary">
            References <span className="font-normal text-ink-muted">— optional, up to 3</span>
          </label>
          <div className="flex flex-wrap items-center gap-2">
            {refs.map((r, i) => (
              <div key={i} className="group relative h-16 w-16 overflow-hidden rounded-lg border border-line">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={r.dataUrl} alt={r.name} className="h-full w-full object-cover" />
                <button onClick={() => setRefs(refs.filter((_, j) => j !== i))}
                  className="absolute inset-0 flex items-center justify-center bg-black/70 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100">
                  Remove
                </button>
              </div>
            ))}
            {refs.length < 3 && (
              <label className="flex h-16 w-16 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-line text-ink-muted transition-colors hover:border-ink-muted hover:text-ink-secondary">
                <span className="text-lg leading-none">+</span>
                <span className="text-[9px]">Add</span>
                <input type="file" accept="image/*" multiple className="hidden"
                  onChange={(e) => { addRefs(e.target.files); e.target.value = '' }} />
              </label>
            )}
          </div>
          <p className="mt-1.5 text-[11px] text-ink-muted">
            A reference you upload wins over the brand photos already in the corpus.
          </p>

          <button
            onClick={generate}
            disabled={!prompt.trim() || loading || !clientId}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
            style={{ background: brand }}>
            {loading ? <><Loader2 size={16} className="animate-spin" /> Generating…</> : <><Sparkles size={16} /> Generate image</>}
          </button>

          {error && <p className="mt-3 text-xs text-red-400">{error}</p>}
          <p className="mt-3 text-[11px] text-ink-tertiary">
            Uses the OpenAI key from your account (Integrations) or the platform key. Every image is saved to your gallery.
          </p>
        </div>

        {/* Resultado */}
        <div className="rounded-2xl border border-dashed border-line bg-surface p-5 flex flex-col items-center justify-center min-h-[320px]">
          {result ? (
            <div className="w-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={result.imageUrl} alt="Generated image" className="w-full rounded-xl border border-line object-contain" style={{ aspectRatio: aspect }} />
              <div className="mt-3 flex items-center justify-between">
                <span className="text-[11px] text-ink-tertiary">
                  {result.usedBrandIdentity ? '✓ Brand identity' : '⚠ No visual identity in the Brain'}
                  {result.usedPillar && ` · ✓ Pillar: ${result.usedPillar}`}
                  {result.referencesUsed > 0 && ` · ✓ ${result.referencesUsed} real references`}
                </span>
                <a href={result.imageUrl} download className="inline-flex items-center gap-1.5 text-xs text-ink-secondary hover:text-ink transition-colors">
                  <Download size={14} /> Download
                </a>
              </div>
            </div>
          ) : loading ? (
            <div className="text-center text-ink-tertiary">
              <Loader2 size={22} className="mx-auto mb-2 animate-spin" />
              <p className="text-xs">Composing with your brand…</p>
            </div>
          ) : (
            <div className="text-center text-ink-muted">
              <ImageIcon size={28} className="mx-auto mb-2 opacity-40" />
              <p className="text-xs">Your image will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
