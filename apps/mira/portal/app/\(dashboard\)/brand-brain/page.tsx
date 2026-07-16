'use client'

import { useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { BrandBrainChatbot } from '@/components/brand-brain/BrandBrainChatbot'

export default function BrandBrainPage() {
  const searchParams = useSearchParams()
  const clientId = searchParams.get('client')
  const [showChatbot, setShowChatbot] = useState(!!clientId)

  if (!clientId) {
    return (
      <div className="px-8 py-8">
        <div className="mb-8">
          <p
            className="text-[10px] uppercase tracking-widest font-semibold mb-2"
            style={{ color: 'rgba(16,185,129,0.8)' }}
          >
            Brand Brain
          </p>
          <h1 className="text-2xl font-semibold text-white tracking-tight">
            Complete Your Brand Brain
          </h1>
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Get started building your Brand Brain to empower your AI agents
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Info Card */}
          <div
            className="p-6 rounded-lg border border-gray-700"
            style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
          >
            <h3 className="font-semibold text-white mb-3">✨ What is Brand Brain?</h3>
            <p className="text-sm text-gray-300 leading-relaxed mb-4">
              Your Brand Brain is a comprehensive knowledge base that helps your AI agents understand your business,
              positioning, and strategy. With a complete Brand Brain, your agents can provide smarter, more relevant
              suggestions.
            </p>
            <ul className="text-sm text-gray-300 space-y-2">
              <li>✓ Brand identity & positioning</li>
              <li>✓ Content pillars & strategy</li>
              <li>✓ Sales & market context</li>
              <li>✓ Key documents & resources</li>
            </ul>
          </div>

          {/* Benefits Card */}
          <div
            className="p-6 rounded-lg border border-gray-700"
            style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
          >
            <h3 className="font-semibold text-white mb-3">🚀 Benefits</h3>
            <ul className="text-sm text-gray-300 space-y-3">
              <li>
                <strong>Better Insights</strong>
                <p className="text-gray-400 text-xs mt-1">Agents give recommendations aligned with your brand</p>
              </li>
              <li>
                <strong>Faster Workflows</strong>
                <p className="text-gray-400 text-xs mt-1">Less back-and-forth refinement needed</p>
              </li>
              <li>
                <strong>Consistent Voice</strong>
                <p className="text-gray-400 text-xs mt-1">All agents speak with your brand voice</p>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 p-6 rounded-lg border border-gray-700" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
          <p className="text-sm text-gray-300">
            💡 <strong>Tip:</strong> Access this page from the Admin Clients panel by clicking "Brand Brain" on any client card.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="px-8 py-8">
      <div className="mb-8">
        <p
          className="text-[10px] uppercase tracking-widest font-semibold mb-2"
          style={{ color: 'rgba(16,185,129,0.8)' }}
        >
          Brand Brain
        </p>
        <h1 className="text-2xl font-semibold text-white tracking-tight">
          Complete Your Brand Brain
        </h1>
      </div>

      {showChatbot && <BrandBrainChatbot clientId={clientId} onUpdateComplete={() => setShowChatbot(false)} />}
    </div>
  )
}
