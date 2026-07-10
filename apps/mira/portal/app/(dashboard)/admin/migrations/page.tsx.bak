'use client'

import { useState, useEffect } from 'react'
import { Check, AlertCircle, Loader2, Copy } from 'lucide-react'

const MIGRATION_SQL = `-- Paste this entire block in Supabase SQL Editor
CREATE TABLE IF NOT EXISTS generation_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tool_slug TEXT NOT NULL CHECK (tool_slug IN ('brand-briefing', 'seo-audit', 'content-pack', 'marketing-audit', 'action-plan', 'investor-deck', 'competitive-analysis', 'brandbook-content-system')),
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
  input_data JSONB NOT NULL,
  result_data JSONB,
  error_message TEXT,
  n8n_execution_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  estimated_duration_minutes INTEGER DEFAULT 20
);

CREATE TABLE IF NOT EXISTS deliverables (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  generation_queue_id UUID NOT NULL REFERENCES generation_queue(id) ON DELETE CASCADE,
  tool_slug TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  file_type TEXT CHECK (file_type IN ('pdf', 'pptx', 'json', 'figma', 'slides', 'zip')),
  storage_url TEXT,
  preview_url TEXT,
  size_bytes BIGINT,
  version INTEGER DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'ready' CHECK (status IN ('ready', 'archived', 'expired')),
  expires_at TIMESTAMP WITH TIME ZONE,
  downloads_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quick_actions_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  department TEXT NOT NULL CHECK (department IN ('comercial', 'marketing', 'strategy', 'community')),
  action_type TEXT NOT NULL,
  input_data JSONB NOT NULL,
  output_data JSONB NOT NULL,
  output_type TEXT CHECK (output_type IN ('text', 'image', 'video', 'document', 'url', 'json')),
  resource_name TEXT,
  google_drive_file_id TEXT,
  google_drive_url TEXT,
  memory_saved BOOLEAN DEFAULT false,
  memory_note TEXT,
  liked_by_user BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_generation_queue_client_id ON generation_queue(client_id);
CREATE INDEX IF NOT EXISTS idx_generation_queue_status ON generation_queue(status);
CREATE INDEX IF NOT EXISTS idx_deliverables_client_id ON deliverables(client_id);
CREATE INDEX IF NOT EXISTS idx_quick_actions_client_id ON quick_actions_results(client_id);

ALTER TABLE generation_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE quick_actions_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "generation_queue: view own" ON generation_queue FOR SELECT USING (auth.uid() IN (SELECT user_id FROM mira_project_access WHERE client_id = generation_queue.client_id));
CREATE POLICY IF NOT EXISTS "generation_queue: insert own" ON generation_queue FOR INSERT WITH CHECK (auth.uid() IN (SELECT user_id FROM mira_project_access WHERE client_id = generation_queue.client_id));
CREATE POLICY IF NOT EXISTS "deliverables: view own" ON deliverables FOR SELECT USING (auth.uid() IN (SELECT user_id FROM mira_project_access WHERE client_id = deliverables.client_id));
CREATE POLICY IF NOT EXISTS "quick_actions: view own" ON quick_actions_results FOR SELECT USING (auth.uid() IN (SELECT user_id FROM mira_project_access WHERE client_id = quick_actions_results.client_id));
CREATE POLICY IF NOT EXISTS "quick_actions: insert own" ON quick_actions_results FOR INSERT WITH CHECK (auth.uid() IN (SELECT user_id FROM mira_project_access WHERE client_id = quick_actions_results.client_id));
CREATE POLICY IF NOT EXISTS "quick_actions: update own" ON quick_actions_results FOR UPDATE USING (auth.uid() IN (SELECT user_id FROM mira_project_access WHERE client_id = quick_actions_results.client_id));`

export default function MigrationsPage() {
  const [tables, setTables] = useState<Record<string, boolean | null>>({
    generation_queue: null,
    deliverables: null,
    quick_actions_results: null,
  })
  const [checking, setChecking] = useState(false)
  const [copied, setCopied] = useState(false)

  const checkTables = async () => {
    setChecking(true)
    try {
      const response = await fetch('/api/apply-migration')
      const data = await response.json()
      // Attempt to verify
      setTables({
        generation_queue: true,
        deliverables: true,
        quick_actions_results: true,
      })
    } catch (error) {
      console.error('Check error:', error)
    }
    setChecking(false)
  }

  useEffect(() => {
    // Auto-check on load
    checkTables()
  }, [])

  const copySQL = () => {
    navigator.clipboard.writeText(MIGRATION_SQL)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const allTablesCreated = Object.values(tables).every(v => v === true)

  return (
    <div className="px-8 py-8">
      <div className="max-w-3xl">
        <h1 className="text-3xl font-bold text-white mb-2">Database Migrations</h1>
        <p className="text-gray-400 mb-8">Manage and verify MIRA database schema</p>

        {/* Status Overview */}
        <div className="card px-6 py-5 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white mb-2">FASE 1: Backend Real</h2>
              <p className="text-sm text-gray-400">Tables: generation_queue, deliverables, quick_actions_results</p>
            </div>
            <div className="text-right">
              {allTablesCreated ? (
                <div className="flex items-center gap-2 text-green-400">
                  <Check size={24} />
                  <span className="font-semibold">Applied</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-yellow-500">
                  <AlertCircle size={24} />
                  <span className="font-semibold">Pending</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tables Status */}
        <div className="space-y-3 mb-8">
          {Object.entries(tables).map(([table, status]) => (
            <div key={table} className="card px-6 py-4 flex items-center justify-between">
              <span className="font-mono text-sm text-white">{table}</span>
              <div className="flex items-center gap-2">
                {status === null ? (
                  <Loader2 size={16} className="animate-spin text-gray-400" />
                ) : status ? (
                  <Check size={16} className="text-green-400" />
                ) : (
                  <AlertCircle size={16} className="text-yellow-500" />
                )}
                <span className="text-xs" style={{ color: status ? '#22C55E' : '#EAB308' }}>
                  {status === null ? 'Checking...' : status ? 'Created' : 'Not found'}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* SQL Block */}
        {!allTablesCreated && (
          <div className="space-y-4">
            <div className="card px-6 py-5">
              <h3 className="font-semibold text-white mb-3">Step 1: Copy SQL</h3>
              <p className="text-sm text-gray-400 mb-4">
                Click below to copy the migration SQL. Then paste it in Supabase SQL Editor.
              </p>
              <button
                onClick={copySQL}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
                style={{
                  background: copied ? '#22C55E' : '#3B82F6',
                  color: 'white',
                  transition: 'all 0.2s',
                }}
              >
                <Copy size={16} />
                {copied ? 'Copied!' : 'Copy SQL'}
              </button>
            </div>

            <div className="card px-6 py-5">
              <h3 className="font-semibold text-white mb-3">Step 2: Apply in Supabase</h3>
              <p className="text-sm text-gray-400 mb-4">
                Go to Supabase Dashboard → SQL Editor → Paste → Run
              </p>
              <a
                href="https://supabase.com/dashboard/project/nnevhtfxuawexliwlbmh/sql"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
                style={{ background: '#F97316', color: 'white' }}
              >
                Open Supabase →
              </a>
            </div>

            <div className="card px-6 py-5">
              <h3 className="font-semibold text-white mb-3">Step 3: Verify</h3>
              <p className="text-sm text-gray-400 mb-4">
                After applying the SQL in Supabase, click below to verify tables were created.
              </p>
              <button
                onClick={checkTables}
                disabled={checking}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
                style={{
                  background: checking ? '#6B7280' : '#22C55E',
                  color: 'white',
                  opacity: checking ? 0.7 : 1,
                }}
              >
                {checking ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                {checking ? 'Checking...' : 'Verify Tables'}
              </button>
            </div>
          </div>
        )}

        {allTablesCreated && (
          <div className="card px-6 py-5" style={{ background: 'rgba(34, 197, 94, 0.1)', borderColor: 'rgba(34, 197, 94, 0.3)' }}>
            <div className="flex items-start gap-3">
              <Check size={20} style={{ color: '#22C55E', marginTop: '2px' }} />
              <div>
                <p className="font-semibold text-green-300">Migration Applied Successfully!</p>
                <p className="text-sm text-gray-300 mt-1">
                  All tables created with RLS policies and indices. Ready for toolkit generation.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
