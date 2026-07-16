'use client'

import { ClientsGrid } from '@/components/admin/ClientsGrid'

export default function AdminClientsPage() {
  return (
    <div className="px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <p className="text-[10px] uppercase tracking-widest font-semibold mb-2" style={{ color: 'rgba(16,185,129,0.8)' }}>
          Administration
        </p>
        <h1 className="text-2xl font-semibold text-white tracking-tight">
          Clients
        </h1>
        <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Manage all your clients and their Brand Brains
        </p>
      </div>

      {/* Grid */}
      <ClientsGrid />

      {/* Info Box */}
      <div className="mt-8 p-6 rounded-lg border border-gray-700" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
        <h3 className="font-semibold text-white mb-2">💡 How to use</h3>
        <ul className="text-sm text-gray-300 space-y-1">
          <li>✓ Click <strong>Manage</strong> to view client details and statistics</li>
          <li>✓ Click <strong>Brand Brain</strong> to access the client's Brand Brain Chatbot</li>
          <li>✓ Complete Brand Brains to enable AI agents with full context</li>
        </ul>
      </div>
    </div>
  )
}
