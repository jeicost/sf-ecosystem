'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { useMedia } from '@/lib/hooks/useMedia'

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

  const { media, loading, error, uploadFile, fetchMedia } = useMedia(
    selectedProject?.id || ''
  )

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
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900">Media</h1>
        <p className="text-slate-600 mt-2">Upload and manage images and files per project</p>
      </div>

      {(loadError || error) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700">
          {loadError || error}
        </div>
      )}

      {projects.length > 0 && (
        <div className="mb-6 flex items-end justify-between gap-4 flex-wrap">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Select Project
            </label>
            <select
              value={selectedProject?.id || ''}
              onChange={(e) => {
                const project = projects.find((p) => p.id === e.target.value)
                if (project) setSelectedProject(project)
              }}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf,.svg"
              className="hidden"
              onChange={handleFileSelected}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={!selectedProject || loading}
              className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition disabled:opacity-50"
            >
              {loading ? 'Working…' : 'Upload File'}
            </button>
          </div>
        </div>
      )}

      {selectedProject && media.length === 0 && !loading && (
        <div className="bg-slate-50 rounded-lg border border-slate-200 p-12 text-center">
          <p className="text-slate-600">No media yet for this project</p>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {media.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-lg shadow border border-slate-200 overflow-hidden hover:shadow-lg transition"
          >
            <div className="aspect-square bg-slate-100 flex items-center justify-center overflow-hidden">
              {isImage(item.mime_type) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.url} alt={item.alt_text || item.filename} className="w-full h-full object-cover" />
              ) : (
                <span className="text-slate-400 text-4xl">📄</span>
              )}
            </div>
            <div className="p-3">
              <p className="text-xs font-medium text-slate-900 truncate" title={item.filename}>
                {item.filename}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">{formatSize(item.size_bytes)}</p>
              <button
                onClick={() => copyUrl(item.id, item.url)}
                className="mt-2 w-full text-xs px-2 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
              >
                {copiedId === item.id ? '✓ Copied' : 'Copy URL'}
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
    <Suspense fallback={<div className="text-center py-12">Loading...</div>}>
      <MediaContent />
    </Suspense>
  )
}
