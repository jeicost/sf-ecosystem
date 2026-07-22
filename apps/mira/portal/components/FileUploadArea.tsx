'use client'

import { useState, useRef } from 'react'
import { Upload, X, File } from 'lucide-react'

interface FileUploadAreaProps {
  onFilesSelected?: (files: File[]) => void
  agentName?: string
  maxFiles?: number
}

export default function FileUploadArea({ onFilesSelected, maxFiles = 5 }: FileUploadAreaProps) {
  const [files, setFiles] = useState<File[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFiles = Array.from(e.dataTransfer.files).slice(0, maxFiles - files.length)
    addFiles(droppedFiles)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files).slice(0, maxFiles - files.length)
      addFiles(selectedFiles)
    }
  }

  const addFiles = (newFiles: File[]) => {
    const updated = [...files, ...newFiles].slice(0, maxFiles)
    setFiles(updated)
    onFilesSelected?.(updated)
  }

  const removeFile = (index: number) => {
    const updated = files.filter((_, i) => i !== index)
    setFiles(updated)
    onFilesSelected?.(updated)
  }

  return (
    <div className="w-full">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative card px-6 py-8 cursor-pointer transition-all ${
          isDragging
            ? 'bg-blue-500/15 border-blue-400 scale-105'
            : 'hover:bg-surface-hover border-dashed'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          onChange={handleInputChange}
          className="hidden"
          accept=".pdf,.doc,.docx,.txt,.csv,.xlsx,.pptx,.jpg,.png,.svg"
        />
        <div className="flex flex-col items-center gap-3 text-center">
          <Upload size={28} className="text-blue-400" />
          <div>
            <p className="text-sm font-medium text-ink">Drag files here or click to browse</p>
            <p className="text-xs text-ink-tertiary mt-1">
              PDF, Word, Excel, Images, SVG • Max {maxFiles} files
            </p>
          </div>
        </div>
      </div>

      {/* Files preview */}
      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-xs font-medium text-ink-tertiary uppercase">
            {files.length} file{files.length !== 1 ? 's' : ''} selected
          </p>
          {files.map((file, idx) => (
            <div
              key={idx}
              className="card px-3 py-2 flex items-center justify-between hover:bg-surface-hover transition-all"
            >
              <div className="flex items-center gap-2 min-w-0">
                <File size={14} className="text-blue-400 flex-shrink-0" />
                <span className="text-xs text-ink truncate">{file.name}</span>
                <span className="text-[10px] text-ink-tertiary flex-shrink-0">
                  ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  removeFile(idx)
                }}
                className="text-ink-tertiary hover:text-red-400 transition-colors flex-shrink-0"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
