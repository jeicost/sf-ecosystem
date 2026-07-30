'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { ImageIcon, FileText, Check, Upload } from 'lucide-react'
import { useMedia } from '@/lib/hooks/useMedia'
import { Button, Select, Label, EmptyState, InlineMessage } from '@/components/ui'
import { cn } from '@/lib/cn'

interface Project {
  id: string
  name: string
  slug: string
}

function isImage(mime: string | null) {
  return mime?.startsWith('image/') ?? false
}

function formatSize(bytes: number | null) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function MediaContent() {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [loadError, setLoadError] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { media, loading, error, uploadFile, fetchMedia } = useMedia(selectedProject?.id || '')

  useEffect(() => {
    fetch('/api/admin/projects')
      .then((r) => {
        if (!r.ok) throw new Error('Failed to fetch projects')
        return r.json()
      })
      .then(({ projects }: { projects: Project[] }) => {
        setProjects(projects)
        if (projects.length > 0) setSelectedProject(projects[0])
      })
      .catch(() => setLoadError('Failed to load projects'))
  }, [])

  useEffect(() => {
    if (selectedProject) fetchMedia()
  }, [selectedProject, fetchMedia])

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    await uploadFile(file)
    e.target.value = ''
  }

  function copyUrl(id: string, url: string) {
    navigator.clipboard.writeText(url)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 1500)
  }

  return (
    <div className="mx-auto max-w-6xl px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900">Media</h1>
        <p className="mt-1 text-sm text-slate-500">Sube y gestiona imágenes y archivos por proyecto.</p>
      </div>

      {(loadError || error) && (
        <div className="mb-6">
          <InlineMessage kind="error">{loadError || error}</InlineMessage>
        </div>
      )}

      {projects.length > 0 && (
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-xs">
            <Label htmlFor="project-select">Select Project</Label>
            <Select
              id="project-select"
              value={selectedProject?.id || ''}
              onChange={(e) => {
                const project = projects.find((p) => p.id === e.target.value)
                if (project) setSelectedProject(project)
              }}
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf,.svg"
              className="hidden"
              onChange={handleFileSelected}
            />
            <Button onClick={() => fileInputRef.current?.click()} disabled={!selectedProject || loading}>
              <Upload className="h-4 w-4" />
              {loading ? 'Working…' : 'Upload File'}
            </Button>
          </div>
        </div>
      )}

      {selectedProject && media.length === 0 && !loading && (
        <EmptyState icon={<ImageIcon className="h-8 w-8" />} title="No media yet for this project" />
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {media.map((item) => (
          <div
            key={item.id}
            className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card transition-shadow hover:shadow-panel"
          >
            <div className="flex aspect-square items-center justify-center overflow-hidden bg-slate-100">
              {isImage(item.mime_type) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.url} alt={item.alt_text || item.filename} className="h-full w-full object-cover" />
              ) : (
                <FileText className="h-10 w-10 text-slate-300" />
              )}
            </div>
            <div className="p-3">
              <p className="truncate text-xs font-medium text-slate-900" title={item.filename}>
                {item.filename}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">{formatSize(item.size_bytes)}</p>
              <button
                onClick={() => copyUrl(item.id, item.url)}
                className={cn(
                  'mt-2 flex w-full items-center justify-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors',
                  copiedId === item.id ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                )}
              >
                {copiedId === item.id ? (
                  <>
                    <Check className="h-3 w-3" /> Copied
                  </>
                ) : (
                  'Copy URL'
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function MediaPage() {
  return (
    <Suspense fallback={<p className="py-12 text-center text-sm text-slate-500">Loading…</p>}>
      <MediaContent />
    </Suspense>
  )
}
