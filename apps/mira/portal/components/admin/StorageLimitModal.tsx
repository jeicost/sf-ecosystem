'use client'

import { useState } from 'react'

interface StorageLimitModalProps {
  isOpen: boolean
  currentLimit: number
  onClose: () => void
  onSave: (newLimit: number) => void
}

export default function StorageLimitModal({
  isOpen,
  currentLimit,
  onClose,
  onSave,
}: StorageLimitModalProps) {
  const [newLimit, setNewLimit] = useState(currentLimit)
  const [saving, setSaving] = useState(false)

  if (!isOpen) return null

  async function handleSave() {
    setSaving(true)
    try {
      onSave(newLimit)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-96 shadow-xl">
        <h2 className="text-xl font-semibold mb-4">Editar Límite de Storage</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Límite actual: {currentLimit} GB
            </label>
            <input
              type="number"
              min="1"
              max="1000"
              step="1"
              value={newLimit}
              onChange={(e) => setNewLimit(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ingresa nuevo límite en GB"
            />
            <p className="text-xs text-gray-500 mt-1">
              Rango: 1 - 1000 GB
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={saving}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving || newLimit === currentLimit}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
