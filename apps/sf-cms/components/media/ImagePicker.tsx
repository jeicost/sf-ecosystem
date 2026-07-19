'use client'

import { useEffect, useRef, useState } from 'react'
import { useMedia } from '@/lib/hooks/useMedia'

interface ImagePickerProps {
  projectId: string
  open: boolean
  onClose: () => void
  onSelect: (url: string, alt?: string) => void
}

export function ImagePicker({ projectId, open, onClose, onSelect }: ImagePickerProps) {
  const { media, loading, error, uploadFile, fetchMedia } = useMedia(projectId)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (open && projectId) fetchMedia()
  }, [open, projectId, fetchMedia])

  if (!open) return null

  const images = media.filter((m) => m.mime_type?.startsWith('image/'))

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const uploaded = await uploadFile(file)
    setUploading(false)
    e.target.value = ''
    if (uploaded) {
      onSelect(uploaded.url, uploaded.filename)
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col m-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900">Select Image</h2>
          <div className="flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelected}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="px-3 py-1.5 text-sm bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition disabled:opacity-50"
            >
              {uploading ? 'Uploading…' : 'Upload New'}
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 text-xl leading-none"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {loading && images.length === 0 ? (
            <p className="text-slate-500 text-center py-8">Loading…</p>
          ) : images.length === 0 ? (
            <p className="text-slate-500 text-center py-8">
              No images yet — upload the first one
            </p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {images.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelect(item.url, item.alt_text || item.filename)
                    onClose()
                  }}
                  className="aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-slate-900 transition bg-slate-100"
                  title={item.filename}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.url}
                    alt={item.alt_text || item.filename}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
