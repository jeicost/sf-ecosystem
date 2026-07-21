'use client'
import { useEffect, useRef, useState } from 'react'
import { Trash2, Plus, Upload, AlertCircle, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase'

interface VisualAsset {
  name: string
  id: string
  updated_at: string
  metadata: {
    size: number
  }
}

interface Notification {
  id: string
  type: 'success' | 'error'
  message: string
}

interface VisualAssetsProps {
  clientId: string
}

/**
 * SUPABASE STORAGE BUCKET SETUP (Manual in Dashboard)
 *
 * Before this component works, you must create a storage bucket:
 *
 * 1. Go to Supabase Dashboard → Storage
 * 2. Click "Create new bucket"
 * 3. Configure:
 *    - Name: brand-assets
 *    - Privacy: Private (RLS enabled)
 *    - Max upload size: 10MB
 *
 * 4. Create RLS Policies (after bucket creation):
 *    - Click on "brand-assets" bucket
 *    - Go to "Policies" tab
 *    - Create policy for authenticated users:
 *
 *    Policy 1: Allow authenticated users to upload
 *    - Allowed operation: INSERT
 *    - Policy name: "Authenticated users can upload assets"
 *    - Target role: authenticated
 *    - Using expression: auth.role() = 'authenticated'::text
 *    - With check: bucket_id = 'brand-assets'::text
 *
 *    Policy 2: Allow users to read their own assets
 *    - Allowed operation: SELECT
 *    - Policy name: "Users can read own client assets"
 *    - Target role: authenticated
 *    - Using expression: bucket_id = 'brand-assets'::text
 *
 *    Policy 3: Allow users to delete their own assets
 *    - Allowed operation: DELETE
 *    - Policy name: "Users can delete own client assets"
 *    - Target role: authenticated
 *    - Using expression: bucket_id = 'brand-assets'::text
 *
 * Path structure: {client_id}/assets/{filename}
 * Example: 550e8400-e29b-41d4-a716-446655440000/assets/logo-v2.png
 */

export default function VisualAssets({ clientId }: VisualAssetsProps) {
  const [assets, setAssets] = useState<VisualAsset[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const db = createClient()

  // Notification system
  const showNotification = (type: 'success' | 'error', message: string) => {
    const id = Math.random().toString(36).substr(2, 9)
    setNotifications((prev) => [...prev, { id, type, message }])

    // Auto-remove after 4 seconds
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id))
    }, 4000)
  }

  // Fetch assets from storage
  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const { data, error } = await db.storage.from('brand-assets').list(`${clientId}/assets`, {
          limit: 100,
          offset: 0,
          sortBy: { column: 'updated_at', order: 'desc' },
        })

        if (error) {
          console.warn('Storage bucket may not exist yet. Follow setup steps in component comments.')
          setAssets([])
        } else if (data) {
          // Filter out folders, keep only files
          const files = data.filter((item) => !item.name.includes('.'))
          setAssets(files as VisualAsset[])
        }
      } catch (err) {
        console.error('Error fetching assets:', err)
        setAssets([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchAssets()
  }, [clientId, db])

  // Validate file
  const isValidFile = (file: File): boolean => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
    const maxSize = 10 * 1024 * 1024 // 10MB

    if (!validTypes.includes(file.type)) {
      showNotification('error', 'Invalid file type. Only JPEG, PNG, WebP, and SVG allowed.')
      return false
    }

    if (file.size > maxSize) {
      showNotification('error', 'File too large. Maximum size is 10MB.')
      return false
    }

    return true
  }

  // Handle file upload
  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const file = files[0]

    if (!isValidFile(file)) return

    setIsUploading(true)

    try {
      // Generate unique filename
      const timestamp = Date.now()
      const extension = file.name.split('.').pop()
      const filename = `${timestamp}-${Math.random().toString(36).substr(2, 9)}.${extension}`
      const path = `${clientId}/assets/${filename}`

      const { error } = await db.storage.from('brand-assets').upload(path, file, {
        upsert: false,
      })

      if (error) {
        showNotification('error', `Upload failed: ${error.message}`)
        return
      }

      showNotification('success', 'Asset uploaded successfully!')

      // Refresh asset list
      const { data } = await db.storage.from('brand-assets').list(`${clientId}/assets`, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'updated_at', order: 'desc' },
      })

      if (data) {
        const files = data.filter((item) => !item.name.includes('.'))
        setAssets(files as VisualAsset[])
      }

      // Clear input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (err) {
      showNotification('error', 'An unexpected error occurred during upload.')
      console.error('Upload error:', err)
    } finally {
      setIsUploading(false)
    }
  }

  // Handle delete
  const handleDelete = async (assetName: string) => {
    if (!confirm('Delete this asset? This action cannot be undone.')) return

    try {
      const path = `${clientId}/assets/${assetName}`

      const { error } = await db.storage.from('brand-assets').remove([path])

      if (error) {
        showNotification('error', `Delete failed: ${error.message}`)
        return
      }

      showNotification('success', 'Asset deleted successfully.')
      setAssets((prev) => prev.filter((asset) => asset.name !== assetName))
    } catch (err) {
      showNotification('error', 'Failed to delete asset.')
      console.error('Delete error:', err)
    }
  }

  // Get public URL for preview
  const getPublicUrl = (assetName: string): string => {
    const { data } = db.storage.from('brand-assets').getPublicUrl(`${clientId}/assets/${assetName}`)
    return data?.publicUrl || ''
  }

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  // Format date
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-ink-tertiary">Loading assets...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
        {notifications.map((notif) => (
          <div
            key={notif.id}
            className={`pointer-events-auto flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium animate-in fade-in slide-in-from-top-2 duration-300 ${
              notif.type === 'success'
                ? 'bg-[#10B981] text-white'
                : 'bg-[#FF6B6B] text-white'
            }`}
          >
            {notif.type === 'success' ? (
              <CheckCircle size={16} />
            ) : (
              <AlertCircle size={16} />
            )}
            {notif.message}
          </div>
        ))}
      </div>

      {/* Upload Area */}
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setIsDragging(false)
          handleUpload(e.dataTransfer.files)
        }}
        className={`p-8 rounded-lg border-2 border-dashed transition-colors ${
          isDragging
            ? 'border-[#EC4899] bg-[#EC4899]10'
            : 'border-line bg-surface hover:border-[#EC4899]'
        }`}
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <Upload size={32} className="text-ink-tertiary" />
          <div>
            <div className="text-sm font-semibold text-ink">Drop images here or click to select</div>
            <div className="text-xs text-ink-tertiary mt-1">
              Supported: JPG, PNG, WebP, SVG • Max 10MB
            </div>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="mt-2 px-4 py-2 rounded bg-[#EC4899] text-white text-sm font-medium hover:bg-[#E00B7F] disabled:opacity-50 flex items-center gap-2"
          >
            <Plus size={14} />
            {isUploading ? 'Uploading...' : 'Select File'}
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => handleUpload(e.target.files)}
          disabled={isUploading}
          className="hidden"
        />
      </div>

      {/* Assets Grid */}
      {assets.length > 0 ? (
        <div className="space-y-3">
          <div className="text-xs font-semibold text-ink-tertiary uppercase">
            Assets ({assets.length})
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {assets.map((asset) => (
              <div
                key={asset.id}
                className="group relative aspect-square rounded-lg overflow-hidden bg-surface border border-line hover:border-[#EC4899] transition-colors"
              >
                {/* Asset Preview */}
                <img
                  src={getPublicUrl(asset.name)}
                  alt={asset.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback for SVG or if image fails to load
                    (e.target as HTMLImageElement).style.display = 'none'
                  }}
                />

                {/* Delete Overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={() => handleDelete(asset.name)}
                    className="p-2 rounded bg-[#FF6B6B] text-white hover:bg-[#FF5252] transition-colors"
                    title="Delete asset"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Asset Info */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="text-xs text-white truncate">{asset.name}</div>
                  <div className="text-xs text-[#999]">
                    {formatFileSize(asset.metadata?.size || 0)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Assets List Alternative View */}
          <div className="mt-8 space-y-2">
            <div className="text-xs font-semibold text-ink-tertiary uppercase">Details</div>
            <div className="card divide-y divide-line border border-line">
              {assets.map((asset) => (
                <div
                  key={asset.id}
                  className="p-3 flex items-center justify-between hover:bg-surface-hover transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-ink truncate">{asset.name}</div>
                    <div className="text-xs text-ink-tertiary mt-1">
                      {formatFileSize(asset.metadata?.size || 0)} •{' '}
                      {formatDate(asset.updated_at)}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(asset.name)}
                    className="ml-2 p-1 text-ink-tertiary hover:text-[#FF6B6B] transition-colors"
                    title="Delete asset"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-4xl mb-2">🖼️</div>
          <div className="text-sm text-ink-secondary">No assets yet. Upload your brand visuals to get started.</div>
        </div>
      )}
    </div>
  )
}
