'use client'

import { useState } from 'react'
import { Upload, AlertCircle, CheckCircle2 } from 'lucide-react'

interface DocumentUploaderProps {
  onUploadComplete: (file: File) => Promise<void>
  acceptedTypes?: string[]
  maxSizeMB?: number
}

export default function DocumentUploader({
  onUploadComplete,
  acceptedTypes = ['.pdf', '.docx', '.txt'],
  maxSizeMB = 50,
}: DocumentUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const validateFile = (file: File): string | null => {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!acceptedTypes.includes(ext)) {
      return `Solo se aceptan: ${acceptedTypes.join(', ')}`
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      return `Archivo debe ser menor a ${maxSizeMB}MB (tu archivo: ${(file.size / 1024 / 1024).toFixed(1)}MB)`
    }
    return null
  }

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    setError(null)
    setSuccess(false)
    const file = files[0]

    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    setIsUploading(true)
    try {
      await onUploadComplete(file)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error en upload')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  return (
    <div>
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className="relative rounded-lg border-2 border-dashed transition-all p-8"
        style={{
          borderColor: isDragging ? '#8B5CF6' : 'rgba(255,255,255,0.1)',
          backgroundColor: isDragging ? 'rgba(139,92,246,0.05)' : 'transparent',
        }}
      >
        <input
          type="file"
          onChange={(e) => handleFiles(e.target.files)}
          accept={acceptedTypes.join(',')}
          disabled={isUploading}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />

        <div className="text-center pointer-events-none">
          <Upload size={32} className="mx-auto mb-3" style={{ color: '#8B5CF6' }} />
          <p className="text-sm font-medium text-white mb-1">
            {isUploading ? 'Subiendo...' : 'Arrastra archivo aquí o clickea para seleccionar'}
          </p>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
            {acceptedTypes.join(', ')} • Máx {maxSizeMB}MB
          </p>
        </div>
      </div>

      {error && (
        <div className="mt-3 p-3 rounded-lg flex items-start gap-2" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
          <AlertCircle size={16} className="mt-0.5" style={{ color: '#EF4444' }} />
          <p className="text-xs text-white">{error}</p>
        </div>
      )}

      {success && (
        <div className="mt-3 p-3 rounded-lg flex items-start gap-2" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)' }}>
          <CheckCircle2 size={16} className="mt-0.5" style={{ color: '#22C55E' }} />
          <p className="text-xs text-white">Archivo subido exitosamente</p>
        </div>
      )}
    </div>
  )
}
