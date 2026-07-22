'use client'

import { useEffect, useState } from 'react'
import { sortProjects } from '@/lib/project-selection'

interface Project { id: string; name: string; slug: string }
interface Editor { id: string; user_id: string; email: string; role: string; created_at: string }

export default function AccessPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [selected, setSelected] = useState<Project | null>(null)
  const [editors, setEditors] = useState<Editor[]>([])
  const [email, setEmail] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const [allowed, setAllowed] = useState<boolean | null>(null)

  useEffect(() => {
    fetch('/api/admin/me')
      .then((r) => r.json())
      .then((me) => {
        setAllowed(me.isGlobalAdmin === true)
        if (me.isGlobalAdmin) loadProjects()
      })
      .catch(() => setAllowed(false))
  }, [])

  async function loadProjects() {
    const r = await fetch('/api/admin/projects')
    const { projects } = await r.json()
    const sorted = sortProjects(projects ?? [])
    setProjects(sorted)
    if (sorted[0]) setSelected(sorted[0])
  }

  useEffect(() => {
    if (selected) loadEditors(selected.id)
  }, [selected])

  async function loadEditors(projectId: string) {
    const r = await fetch(`/api/admin/projects/${projectId}/roles`)
    if (!r.ok) return
    const { editors } = await r.json()
    setEditors(editors ?? [])
  }

  function flash(m: string) {
    setMsg(m)
    setTimeout(() => setMsg(''), 4000)
  }

  async function addEditor(e: React.FormEvent) {
    e.preventDefault()
    if (!selected || !email.trim()) return
    setBusy(true)
    try {
      const r = await fetch(`/api/admin/projects/${selected.id}/roles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      const data = await r.json()
      if (!r.ok) {
        flash(data.error || 'Failed to add editor')
      } else {
        flash(`✓ ${data.email} can now edit ${selected.name}`)
        setEmail('')
        loadEditors(selected.id)
      }
    } finally {
      setBusy(false)
    }
  }

  async function removeEditor(userId: string) {
    if (!selected) return
    const r = await fetch(`/api/admin/projects/${selected.id}/roles?user_id=${userId}`, {
      method: 'DELETE',
    })
    if (r.ok) loadEditors(selected.id)
  }

  if (allowed === false) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-slate-900">Access</h1>
        <p className="mt-2 text-slate-600">Only a global admin can manage project access.</p>
      </div>
    )
  }

  if (allowed === null) {
    return <div className="p-8 text-slate-500">Loading…</div>
  }

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-3xl font-bold text-slate-900">Access</h1>
      <p className="mt-1 text-slate-600">
        Grant editors access to a single client&apos;s content. Editors only see the projects listed
        for them; global admins (you) see everything.
      </p>

      <div className="mt-6">
        <label className="block text-sm font-medium text-slate-700 mb-2">Project</label>
        <select
          value={selected?.id || ''}
          onChange={(e) => setSelected(projects.find((p) => p.id === e.target.value) || null)}
          className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
        >
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {msg && (
        <div className={`mt-4 px-4 py-2 rounded-lg text-sm ${msg.startsWith('✓') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {msg}
        </div>
      )}

      <div className="mt-6 bg-white border border-slate-200 rounded-lg divide-y divide-slate-100">
        {editors.length === 0 && (
          <p className="px-4 py-6 text-center text-slate-500 text-sm">
            No editors yet — only global admins can access this project.
          </p>
        )}
        {editors.map((ed) => (
          <div key={ed.id} className="px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-800">{ed.email}</p>
              <p className="text-xs text-slate-500">editor · added {new Date(ed.created_at).toLocaleDateString()}</p>
            </div>
            <button
              onClick={() => removeEditor(ed.user_id)}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <form onSubmit={addEditor} className="mt-4 flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="editor@client.com"
          className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
        />
        <button
          type="submit"
          disabled={busy || !email.trim()}
          className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 transition"
        >
          {busy ? 'Adding…' : 'Add editor'}
        </button>
      </form>
      <p className="mt-2 text-xs text-slate-400">
        The person must already have an SF-CMS account. Create their user in Supabase Auth first,
        then grant access here.
      </p>
    </div>
  )
}
