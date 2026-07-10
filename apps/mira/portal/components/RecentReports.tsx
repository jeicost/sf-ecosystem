'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { FileText, Download, Eye, Calendar } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { CLIENT_ID } from '@/lib/constants'

interface Report {
  id: string
  name: string
  type: 'pdf' | 'document' | 'spreadsheet'
  created_at: string
  file_url?: string
}

export default function RecentReports() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchReports = async () => {
      const db = createClient()

      // Get recent deliverables (reports)
      const { data } = await db
        .from('deliverables')
        .select('id, name, output_type, created_at, resource_name')
        .eq('client_id', CLIENT_ID)
        .order('created_at', { ascending: false })
        .limit(5)

      if (data) {
        const formatted = data.map((d: any) => ({
          id: d.id,
          name: d.resource_name || d.name,
          type: d.output_type || 'document',
          created_at: d.created_at,
        }))
        setReports(formatted)
      }

      setLoading(false)
    }

    fetchReports()
  }, [])

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card px-4 py-3 animate-pulse bg-white/3 h-12" />
        ))}
      </div>
    )
  }

  if (reports.length === 0) {
    return (
      <div className="card px-4 py-6 text-center">
        <FileText size={24} className="mx-auto mb-2 text-[#555]" />
        <p className="text-xs text-[#666]">No reports yet</p>
        <p className="text-[10px] text-[#444] mt-1">Generate your first report from a department</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {reports.map((report) => (
        <div
          key={report.id}
          className="card px-4 py-3 flex items-center justify-between hover:bg-white/8 transition-all group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <FileText size={14} className="text-blue-400 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-medium text-white truncate">{report.name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <Calendar size={10} className="text-[#666]" />
                <p className="text-[10px] text-[#666]">
                  {new Date(report.created_at).toLocaleDateString('es-ES', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            <button className="p-1 hover:bg-white/10 rounded transition-colors">
              <Eye size={12} className="text-[#888]" />
            </button>
            <button className="p-1 hover:bg-white/10 rounded transition-colors">
              <Download size={12} className="text-[#888]" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
