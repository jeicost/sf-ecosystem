/**
 * ─── USAGE EXAMPLES ────────────────────────────────────────────────
 *
 * Import and use DriveConnectionModal in your pages or components.
 * This file demonstrates the most common integration patterns.
 */

'use client'

import { useState } from 'react'
import { useActiveClient } from '@/lib/client-context'
import DriveConnectionModal, { type DriveConnectionState } from './DriveConnectionModal'

/**
 * ─── EXAMPLE 1: Basic Integration in a Settings Page ─────────────
 */
export function BrandBrainSettingsPage() {
  const { activeClient } = useActiveClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [syncState, setSyncState] = useState<DriveConnectionState | null>(null)

  return (
    <div className="space-y-6">
      {/* Existing settings sections... */}

      {/* Google Drive Section */}
      <section className="card p-6">
        <h3 className="text-lg font-semibold mb-2">Document Sync</h3>
        <p className="text-sm text-gray-400 mb-4">
          Connect your Google Drive to automatically sync documents to Brand Brain
        </p>

        {syncState?.isAuthorized ? (
          <div className="space-y-3">
            <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-lg">
              <p className="text-sm text-green-300">✓ Connected to Google Drive</p>
              <p className="text-xs text-green-200 mt-1">
                {syncState.selectedFolderName && (
                  <>Syncing folder: <strong>{syncState.selectedFolderName}</strong></>
                )}
              </p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium"
            >
              Manage Sync Settings
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium"
          >
            Connect Google Drive
          </button>
        )}
      </section>

      {/* Modal */}
      <DriveConnectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        clientId={activeClient?.id || ''}
        onSyncStateChange={setSyncState}
      />
    </div>
  )
}

/**
 * ─── EXAMPLE 2: Quick Access Button in Header ──────────────────────
 */
export function DriveQuickAccessButton() {
  const { activeClient } = useActiveClient()
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="p-2 rounded-lg hover:bg-white/5 transition-colors"
        title="Manage Google Drive sync"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          {/* Google Drive icon */}
        </svg>
      </button>

      <DriveConnectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        clientId={activeClient?.id || ''}
      />
    </>
  )
}

/**
 * ─── EXAMPLE 3: Modal with Parent State Management ──────────────────
 *
 * Use this pattern when you need to react to sync state changes
 * in a parent component (e.g., refresh a documents list).
 */
export function BrandBrainEditorWithDrive() {
  const { activeClient } = useActiveClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [syncState, setSyncState] = useState<DriveConnectionState | null>(null)

  const handleSyncStateChange = (newState: DriveConnectionState) => {
    setSyncState(newState)

    // Refresh documents list when sync completes
    if (newState.documents.length > 0 && newState.lastSyncTime) {
      // Trigger document list refresh
      console.log('Documents synced:', newState.documents.length)
      // Example: fetch('/api/brand-brain/documents?clientId=...')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2>Brand Brain Documents</h2>
        <button onClick={() => setIsModalOpen(true)} className="text-sm font-medium text-indigo-400">
          + Connect Drive
        </button>
      </div>

      {/* Sync status indicator */}
      {syncState?.isAuthorized && (
        <div className="px-3 py-1 bg-green-500/10 border border-green-500/20 rounded text-xs text-green-300 inline-block">
          {syncState.autoSyncEnabled ? '🔄 Auto-syncing' : '✓ Connected (manual sync)'}
        </div>
      )}

      {/* Documents list */}
      {/* ... existing documents list component ... */}

      <DriveConnectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        clientId={activeClient?.id || ''}
        onSyncStateChange={handleSyncStateChange}
      />
    </div>
  )
}

/**
 * ─── EXAMPLE 4: Nested in Tabs Component ──────────────────────────
 *
 * Common pattern in settings pages with multiple tabs.
 */
export function DocumentSettingsTabs() {
  const [activeTab, setActiveTab] = useState<'upload' | 'drive'>('upload')
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <div className="flex gap-4 border-b mb-6">
        <button
          onClick={() => setActiveTab('upload')}
          className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'upload'
              ? 'border-indigo-500 text-white'
              : 'border-transparent text-gray-400'
          }`}
        >
          Manual Upload
        </button>
        <button
          onClick={() => setActiveTab('drive')}
          className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'drive'
              ? 'border-indigo-500 text-white'
              : 'border-transparent text-gray-400'
          }`}
        >
          Google Drive
        </button>
      </div>

      {activeTab === 'upload' && (
        <div>
          {/* Upload component */}
        </div>
      )}

      {activeTab === 'drive' && (
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full py-8 border-2 border-dashed border-indigo-500/30 rounded-lg text-center"
        >
          <p className="text-lg font-semibold mb-2">Connect Google Drive</p>
          <p className="text-sm text-gray-400">Set up automatic document syncing</p>
        </button>
      )}

      <DriveConnectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        clientId="client-123"
      />
    </>
  )
}
