'use client'

import { useState, useEffect } from 'react'
import {
  X,
  Cloud,
  Loader2,
  CheckCircle,
  AlertCircle,
  Folder,
  File,
  ToggleRight,
  Unlink,
  RefreshCw,
  ChevronRight,
  ExternalLink,
} from 'lucide-react'

/**
 * ─── TYPE DEFINITIONS ─────────────────────────────────────
 */

export interface DriveFolder {
  id: string
  name: string
  mimeType: string
  parents?: string[]
  webViewLink?: string
}

export interface SyncedDocument {
  id: string
  fileName: string
  mimeType: string
  size: number
  createdTime: string
  modifiedTime: string
  syncedAt: string
  status: 'pending' | 'syncing' | 'completed' | 'error'
  error?: string
}

export interface DriveConnectionState {
  isAuthorized: boolean
  isAuthorizing: boolean
  selectedFolderId: string | null
  selectedFolderName: string | null
  autoSyncEnabled: boolean
  isSyncing: boolean
  lastSyncTime: string | null
  documents: SyncedDocument[]
  error: string | null
}

interface DriveConnectionModalProps {
  isOpen: boolean
  onClose: () => void
  clientId: string
  onSyncStateChange?: (state: DriveConnectionState) => void
}

/**
 * ─── COMPONENT ────────────────────────────────────────────
 */

export default function DriveConnectionModal({
  isOpen,
  onClose,
  clientId,
  onSyncStateChange,
}: DriveConnectionModalProps) {
  // Connection state
  const [state, setState] = useState<DriveConnectionState>({
    isAuthorized: false,
    isAuthorizing: false,
    selectedFolderId: null,
    selectedFolderName: null,
    autoSyncEnabled: false,
    isSyncing: false,
    lastSyncTime: null,
    documents: [],
    error: null,
  })

  // UI state
  const [showFolderBrowser, setShowFolderBrowser] = useState(false)
  const [folders, setFolders] = useState<DriveFolder[]>([])
  const [loadingFolders, setLoadingFolders] = useState(false)
  const [breadcrumbs, setBreadcrumbs] = useState<{ id: string; name: string }[]>([])

  // Notify parent on state changes
  useEffect(() => {
    onSyncStateChange?.(state)
  }, [state, onSyncStateChange])

  /**
   * Initialize: Check if already authorized
   */
  useEffect(() => {
    if (isOpen) {
      checkAuthStatus()
    }
  }, [isOpen])

  /**
   * Check authorization status from backend
   */
  const checkAuthStatus = async () => {
    try {
      const res = await fetch(
        `/api/drive/auth-status?clientId=${clientId}`
      )
      if (res.ok) {
        const data = await res.json()
        setState((prev) => ({
          ...prev,
          isAuthorized: data.authorized,
          selectedFolderId: data.selectedFolderId || null,
          selectedFolderName: data.selectedFolderName || null,
          autoSyncEnabled: data.autoSyncEnabled || false,
          lastSyncTime: data.lastSyncTime || null,
          documents: data.documents || [],
        }))
      }
    } catch (err) {
      console.error('Failed to check auth status:', err)
    }
  }

  /**
   * Initiate OAuth2 authorization flow
   */
  const handleAuthorize = async () => {
    setState((prev) => ({ ...prev, isAuthorizing: true, error: null }))
    try {
      const res = await fetch('/api/drive/authorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, redirectUrl: window.location.href }),
      })

      if (res.ok) {
        const { authUrl } = await res.json()
        // Redirect to Google OAuth
        window.location.href = authUrl
      } else {
        const error = await res.json()
        setState((prev) => ({
          ...prev,
          isAuthorizing: false,
          error: error.message || 'Authorization failed',
        }))
      }
    } catch (err) {
      setState((prev) => ({
        ...prev,
        isAuthorizing: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      }))
    }
  }

  /**
   * Load folders from Google Drive
   */
  const loadFolders = async (parentId: string = 'root') => {
    setLoadingFolders(true)
    try {
      const res = await fetch(
        `/api/drive/folders?clientId=${clientId}&parentId=${parentId}`
      )
      if (res.ok) {
        const data = await res.json()
        setFolders(data.folders || [])
      }
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Failed to load folders',
      }))
    } finally {
      setLoadingFolders(false)
    }
  }

  /**
   * Navigate into a folder
   */
  const navigateToFolder = (folder: DriveFolder) => {
    setBreadcrumbs((prev) => [...prev, { id: folder.id, name: folder.name }])
    loadFolders(folder.id)
  }

  /**
   * Navigate back in breadcrumb
   */
  const navigateToBreadcrumb = (index: number) => {
    const newBreadcrumbs = breadcrumbs.slice(0, index)
    setBreadcrumbs(newBreadcrumbs)

    const folderId = index === 0 ? 'root' : newBreadcrumbs[index - 1].id
    loadFolders(folderId)
  }

  /**
   * Select a folder for syncing
   */
  const selectFolder = async (folder: DriveFolder) => {
    try {
      const res = await fetch('/api/drive/select-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          folderId: folder.id,
          folderName: folder.name,
        }),
      })

      if (res.ok) {
        setState((prev) => ({
          ...prev,
          selectedFolderId: folder.id,
          selectedFolderName: folder.name,
          error: null,
        }))
        setShowFolderBrowser(false)
      } else {
        const error = await res.json()
        setState((prev) => ({
          ...prev,
          error: error.message || 'Failed to select folder',
        }))
      }
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Unknown error',
      }))
    }
  }

  /**
   * Toggle auto-sync
   */
  const toggleAutoSync = async () => {
    const newState = !state.autoSyncEnabled
    setState((prev) => ({ ...prev, autoSyncEnabled: newState }))

    try {
      const res = await fetch('/api/drive/auto-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          enabled: newState,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        setState((prev) => ({
          ...prev,
          autoSyncEnabled: !newState,
          error: error.message || 'Failed to update auto-sync',
        }))
      }
    } catch (err) {
      setState((prev) => ({
        ...prev,
        autoSyncEnabled: !newState,
        error: err instanceof Error ? err.message : 'Unknown error',
      }))
    }
  }

  /**
   * Trigger manual sync
   */
  const handleManualSync = async () => {
    setState((prev) => ({ ...prev, isSyncing: true, error: null }))

    try {
      const res = await fetch('/api/drive/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId }),
      })

      if (res.ok) {
        const data = await res.json()
        setState((prev) => ({
          ...prev,
          isSyncing: false,
          documents: data.documents || [],
          lastSyncTime: new Date().toISOString(),
          error: null,
        }))
      } else {
        const error = await res.json()
        setState((prev) => ({
          ...prev,
          isSyncing: false,
          error: error.message || 'Sync failed',
        }))
      }
    } catch (err) {
      setState((prev) => ({
        ...prev,
        isSyncing: false,
        error: err instanceof Error ? err.message : 'Sync failed',
      }))
    }
  }

  /**
   * Disconnect Google Drive
   */
  const handleDisconnect = async () => {
    if (!confirm('Disconnect Google Drive? Synced documents will remain, but auto-sync will stop.'))
      return

    try {
      const res = await fetch('/api/drive/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId }),
      })

      if (res.ok) {
        setState({
          isAuthorized: false,
          isAuthorizing: false,
          selectedFolderId: null,
          selectedFolderName: null,
          autoSyncEnabled: false,
          isSyncing: false,
          lastSyncTime: null,
          documents: [],
          error: null,
        })
        setShowFolderBrowser(false)
        setBreadcrumbs([])
        setFolders([])
      } else {
        const error = await res.json()
        setState((prev) => ({
          ...prev,
          error: error.message || 'Disconnect failed',
        }))
      }
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Disconnect failed',
      }))
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div
        className="card w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        style={{ background: 'var(--bg-card)' }}
      >
        {/* ─── HEADER ─────────────────────────────────────────────────── */}
        <div
          className="px-6 py-5 border-b flex items-center justify-between"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ background: 'rgba(99,102,241,0.1)' }}>
              <Cloud size={20} style={{ color: '#4F46E5' }} />
            </div>
            <div>
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                Google Drive Sync
              </h2>
              <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                Connect and auto-sync documents to Brand Brain
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X size={20} style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>

        {/* ─── CONTENT ────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Error Alert */}
          {state.error && (
            <div
              className="p-4 rounded-lg border flex items-start gap-3"
              style={{
                background: 'rgba(239,68,68,0.05)',
                borderColor: 'rgba(239,68,68,0.2)',
              }}
            >
              <AlertCircle size={18} style={{ color: '#EF4444', flexShrink: 0 }} />
              <div>
                <p className="text-sm font-medium" style={{ color: '#FCA5A5' }}>
                  Error
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                  {state.error}
                </p>
              </div>
            </div>
          )}

          {/* Connection State Section */}
          <section>
            <p
              className="text-xs uppercase tracking-widest font-semibold mb-4"
              style={{ color: 'rgba(99,102,241,0.7)' }}
            >
              Connection
            </p>

            {!state.isAuthorized ? (
              <div
                className="p-6 rounded-lg border border-dashed text-center"
                style={{
                  background: 'rgba(99,102,241,0.05)',
                  borderColor: 'rgba(99,102,241,0.2)',
                }}
              >
                <Cloud
                  size={32}
                  style={{ color: '#6366F1', margin: '0 auto 16px' }}
                />
                <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                  Connect Google Drive
                </h3>
                <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                  Authorize MIRA to access your Google Drive and select a folder to sync documents
                </p>
                <button
                  onClick={handleAuthorize}
                  disabled={state.isAuthorizing}
                  className="px-6 py-2.5 rounded-lg font-medium text-white transition-colors flex items-center justify-center gap-2 mx-auto"
                  style={{
                    background: state.isAuthorizing ? 'rgba(99,102,241,0.5)' : '#6366F1',
                    cursor: state.isAuthorizing ? 'not-allowed' : 'pointer',
                  }}
                >
                  {state.isAuthorizing ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Authorizing...
                    </>
                  ) : (
                    <>
                      <Cloud size={16} />
                      Sign in with Google
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Connected Status */}
                <div
                  className="p-4 rounded-lg border flex items-center justify-between"
                  style={{
                    background: 'rgba(34,197,94,0.05)',
                    borderColor: 'rgba(34,197,94,0.2)',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle size={20} style={{ color: '#22C55E' }} />
                    <div>
                      <p className="font-medium text-sm" style={{ color: '#86EFAC' }}>
                        Connected to Google Drive
                      </p>
                      {state.selectedFolderName && (
                        <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                          Syncing folder: <strong>{state.selectedFolderName}</strong>
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={handleDisconnect}
                    className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-red-400"
                    aria-label="Disconnect"
                    title="Disconnect Google Drive"
                  >
                    <Unlink size={18} />
                  </button>
                </div>

                {/* Folder Selection */}
                <div>
                  <label
                    className="text-xs uppercase tracking-widest font-semibold mb-2 block"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Sync Folder
                  </label>
                  <button
                    onClick={() => {
                      setShowFolderBrowser(!showFolderBrowser)
                      if (!showFolderBrowser) {
                        setBreadcrumbs([])
                        loadFolders()
                      }
                    }}
                    className="w-full p-3 rounded-lg border flex items-center justify-between transition-colors card-hover"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    <div className="flex items-center gap-3 text-left flex-1">
                      <Folder size={18} style={{ color: '#FBBF24' }} />
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-sm font-medium truncate"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {state.selectedFolderName || 'Choose a folder...'}
                        </p>
                        <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                          {state.selectedFolderName ? 'Click to change' : 'Select a folder to sync'}
                        </p>
                      </div>
                    </div>
                    <ChevronRight
                      size={18}
                      style={{
                        color: 'var(--text-secondary)',
                        transform: showFolderBrowser ? 'rotate(90deg)' : 'none',
                        transition: 'transform 0.2s',
                      }}
                    />
                  </button>

                  {/* Folder Browser */}
                  {showFolderBrowser && (
                    <div className="mt-3 p-4 rounded-lg" style={{ background: 'var(--bg-surface)' }}>
                      {/* Breadcrumbs */}
                      {breadcrumbs.length > 0 && (
                        <div className="flex items-center gap-2 mb-4 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
                          <button
                            onClick={() => navigateToBreadcrumb(0)}
                            className="text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                          >
                            Root
                          </button>
                          {breadcrumbs.map((crumb, idx) => (
                            <div key={crumb.id} className="flex items-center gap-2">
                              <ChevronRight size={16} style={{ color: 'var(--text-tertiary)' }} />
                              <button
                                onClick={() => navigateToBreadcrumb(idx + 1)}
                                className="text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                              >
                                {crumb.name}
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Folder List */}
                      {loadingFolders ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 size={20} className="animate-spin" style={{ color: '#6366F1' }} />
                        </div>
                      ) : folders.length === 0 ? (
                        <p className="text-sm py-8 text-center" style={{ color: 'var(--text-tertiary)' }}>
                          No folders found
                        </p>
                      ) : (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {folders.map((folder) => (
                            <button
                              key={folder.id}
                              onClick={() => navigateToFolder(folder)}
                              onDoubleClick={() => selectFolder(folder)}
                              className="w-full px-3 py-2 rounded-lg text-left text-sm hover:bg-white/5 transition-colors flex items-center justify-between group"
                            >
                              <span className="flex items-center gap-2 flex-1 min-w-0">
                                <Folder size={16} style={{ color: '#FBBF24', flexShrink: 0 }} />
                                <span
                                  className="truncate"
                                  style={{ color: 'var(--text-primary)' }}
                                >
                                  {folder.name}
                                </span>
                              </span>
                              <ChevronRight
                                size={16}
                                style={{
                                  color: 'var(--text-tertiary)',
                                  opacity: 0,
                                  transition: 'opacity 0.2s',
                                }}
                                className="group-hover:opacity-100"
                              />
                            </button>
                          ))}
                        </div>
                      )}

                      <p className="text-xs mt-4 pt-4" style={{ borderTop: '1px solid var(--border)', color: 'var(--text-tertiary)' }}>
                        Double-click a folder to select it
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* Auto-Sync Section */}
          {state.isAuthorized && (
            <section>
              <p
                className="text-xs uppercase tracking-widest font-semibold mb-4"
                style={{ color: 'rgba(99,102,241,0.7)' }}
              >
                Sync Settings
              </p>

              <div
                className="p-4 rounded-lg border flex items-center justify-between"
                style={{
                  background: 'var(--bg-surface)',
                  borderColor: 'var(--border)',
                }}
              >
                <div>
                  <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                    Auto-sync documents
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                    New files in the folder will automatically be ingested into Brand Brain
                  </p>
                </div>
                <button
                  onClick={toggleAutoSync}
                  className={`p-2 rounded-lg transition-colors ${
                    state.autoSyncEnabled ? 'bg-indigo-500/20' : 'hover:bg-white/5'
                  }`}
                  style={{
                    color: state.autoSyncEnabled ? '#6366F1' : 'var(--text-secondary)',
                  }}
                  aria-label={`${state.autoSyncEnabled ? 'Disable' : 'Enable'} auto-sync`}
                >
                  <ToggleRight size={20} />
                </button>
              </div>
            </section>
          )}

          {/* Synced Documents Section */}
          {state.isAuthorized && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <p
                  className="text-xs uppercase tracking-widest font-semibold"
                  style={{ color: 'rgba(99,102,241,0.7)' }}
                >
                  Synced Documents
                </p>
                <button
                  onClick={handleManualSync}
                  disabled={state.isSyncing}
                  className="p-2 rounded-lg hover:bg-white/5 transition-colors disabled:opacity-50"
                  aria-label="Sync now"
                  title="Sync documents now"
                >
                  <RefreshCw
                    size={16}
                    style={{
                      color: '#6366F1',
                      animation: state.isSyncing ? 'spin 1s linear infinite' : 'none',
                    }}
                  />
                </button>
              </div>

              {state.lastSyncTime && (
                <p className="text-xs mb-3" style={{ color: 'var(--text-tertiary)' }}>
                  Last synced: {new Date(state.lastSyncTime).toLocaleString()}
                </p>
              )}

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {state.documents.length === 0 ? (
                  <div className="p-6 rounded-lg text-center" style={{ background: 'var(--bg-surface)' }}>
                    <File size={32} style={{ color: 'var(--text-tertiary)', margin: '0 auto 12px' }} />
                    <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                      No synced documents yet
                    </p>
                    <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                      Click the sync button or enable auto-sync to start ingesting documents
                    </p>
                  </div>
                ) : (
                  state.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-3 rounded-lg border flex items-start justify-between gap-3 card-hover"
                      style={{
                        borderColor: 'var(--border)',
                        background: 'var(--bg-surface)',
                      }}
                    >
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <File
                          size={18}
                          style={{
                            color: doc.status === 'completed' ? '#22C55E' :
                                   doc.status === 'error' ? '#EF4444' :
                                   doc.status === 'syncing' ? '#FBBF24' : '#9CA3AF',
                            flexShrink: 0,
                            marginTop: '2px',
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <p
                            className="text-sm font-medium truncate"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {doc.fileName}
                          </p>
                          <div
                            className="flex gap-2 text-xs mt-1"
                            style={{ color: 'var(--text-tertiary)' }}
                          >
                            <span>{Math.round(doc.size / 1024)} KB</span>
                            <span>•</span>
                            <span
                              className="font-medium"
                              style={{
                                color: doc.status === 'completed' ? '#22C55E' :
                                       doc.status === 'error' ? '#EF4444' :
                                       doc.status === 'syncing' ? '#FBBF24' : 'inherit',
                              }}
                            >
                              {doc.status === 'completed' ? 'Synced' :
                               doc.status === 'syncing' ? 'Syncing...' :
                               doc.status === 'error' ? 'Failed' : 'Pending'}
                            </span>
                          </div>
                          {doc.error && (
                            <p className="text-xs mt-1" style={{ color: '#FCA5A5' }}>
                              {doc.error}
                            </p>
                          )}
                        </div>
                      </div>
                      <span
                        className="text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap"
                        style={{
                          background: doc.status === 'completed' ? 'rgba(34,197,94,0.15)' :
                                     doc.status === 'error' ? 'rgba(239,68,68,0.15)' :
                                     doc.status === 'syncing' ? 'rgba(251,191,36,0.15)' : 'rgba(107,114,128,0.15)',
                          color: doc.status === 'completed' ? '#22C55E' :
                                 doc.status === 'error' ? '#EF4444' :
                                 doc.status === 'syncing' ? '#F59E0B' : '#9CA3AF',
                        }}
                      >
                        {doc.status === 'completed' ? '✓' :
                         doc.status === 'syncing' ? '◐' :
                         doc.status === 'error' ? '⚠' : '–'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </section>
          )}
        </div>

        {/* ─── FOOTER ─────────────────────────────────────────────────── */}
        <div
          className="px-6 py-4 border-t flex items-center justify-between"
          style={{ borderColor: 'var(--border)' }}
        >
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            {state.isAuthorized && state.selectedFolderId ? (
              <>🔄 Auto-sync is <strong>{state.autoSyncEnabled ? 'enabled' : 'disabled'}</strong></>
            ) : !state.isAuthorized ? (
              <>Authorize to start syncing documents</>
            ) : (
              <>Select a folder to enable syncing</>
            )}
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg font-medium text-sm transition-colors"
            style={{
              background: 'var(--bg-surface)',
              color: 'var(--text-primary)',
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
