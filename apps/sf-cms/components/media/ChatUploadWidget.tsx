'use client'

import { useRef, useState } from 'react'
import { ImagePlus } from 'lucide-react'
import { useMedia } from '@/lib/hooks/useMedia'

interface ChatUploadWidgetProps {
  projectId: string
  /** Called with the public URL after a successful upload */
  onUploaded: (url: string) => void
}

/**
 * Minimal upload button for the conversational page editor.
 * Uploads a file to the project's media library and hands back the URL so
 * the admin can reference it in a chat instruction ("add this image: <url>").
 */
export function ChatUploadWidget({ projectId, onUploaded }: ChatUploadWidgetProps) {
  const { uploadFile } = useMedia(projectId)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const uploaded = await uploadFile(file)
    setUploading(false)
    e.target.value = ''
    if (uploaded) onUploaded(uploaded.url)
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelected}
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading || !projectId}
        title="Upload image — its URL is added to your message"
        className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition"
      >
        <ImagePlus size={18} className={uploading ? 'animate-pulse' : ''} />
      </button>
    </>
  )
}
