'use client'

import { useState } from 'react'
import { Loader2, Sparkles } from 'lucide-react'

interface QuickActionButtonProps {
  title: string
  description: string
  icon?: React.ReactNode
  actionType: string
  department: string
  inputForm: React.ReactNode
  onActionComplete?: (actionId: string) => void
}

export function QuickActionButton({
  title,
  description,
  // icon is not used yet
  actionType,
  department,
  inputForm,
  onActionComplete,
}: QuickActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const formData = new FormData(e.currentTarget)
      const inputData = Object.fromEntries(formData)

      const response = await fetch('/api/quick-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          department,
          action_type: actionType,
          input_data: inputData,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to queue action')
      }

      const result = await response.json()
      onActionComplete?.(result.action_id)
      setIsOpen(false)
    } catch (error) {
      console.error('Error queuing action:', error)
      alert('Error: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="card px-4 py-3 text-sm font-medium text-white hover:bg-white/5 transition-colors flex items-center gap-2 group"
      >
        <Sparkles size={16} className="text-purple-400 group-hover:text-purple-300" />
        {title}
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="card p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
            <p className="text-sm text-gray-400 mb-4">{description}</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {inputForm}

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-gray-300 bg-white/5 hover:bg-white/10 transition-colors"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      Generate
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
