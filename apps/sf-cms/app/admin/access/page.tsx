'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { sortProjects } from '@/lib/project-selection'
import { Button, Card, Input, Select, Label, InlineMessage } from '@/components/ui'

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
      <div className="mx-auto max-w-2xl px-8 py-8">
        <h1 className="text-2xl font-semibold text-slate-900">Access</h1>
        <p className="mt-2 text-sm text-slate-500">Only a global admin can manage project access.</p>
      </div>
    )
  }

  if (allowed === null) {
    return <p className="py-12 text-center text-sm text-slate-500">Loading…</p>
  }

  return (
    <div className="mx-auto max-w-2xl px-8 py-8">
      <h1 className="text-2xl font-semibold text-slate-900">Access</h1>
      <p className="mt-1 text-sm text-slate-500">
        Grant editors access to a single client&apos;s content. Editors only see the projects listed
        for them; global admins (you) see everything.
      </p>

      <div className="mt-6 max-w-xs">
        <Label htmlFor="project-select">Project</Label>
        <Select
          id="project-select"
          value={selected?.id || ''}
          onChange={(e) => setSelected(projects.find((p) => p.id === e.target.value) || null)}
        >
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </Select>
      </div>

      {msg && (
        <div className="mt-4">
          <InlineMessage kind={msg.startsWith('✓') ? 'success' : 'error'}>{msg}</InlineMessage>
        </div>
      )}

      <Card className="mt-6 divide-y divide-slate-100">
        {editors.length === 0 && (
          <p className="px-4 py-6 text-center text-sm text-slate-500">
            No editors yet — only global admins can access this project.
          </p>
        )}
        {editors.map((ed) => (
          <div key={ed.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-sm font-medium text-slate-800">{ed.email}</p>
              <p className="text-xs text-slate-500">editor · added {new Date(ed.created_at).toLocaleDateString()}</p>
            </div>
            <button
              onClick={() => removeEditor(ed.user_id)}
              className="flex items-center gap-1 text-sm font-medium text-red-600 hover:text-red-700"
            >
              <X className="h-3.5 w-3.5" />
              Remove
            </button>
          </div>
        ))}
      </Card>

      <form onSubmit={addEditor} className="mt-4 flex gap-2">
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="editor@client.com"
          className="flex-1"
        />
        <Button type="submit" disabled={busy || !email.trim()}>
          {busy ? 'Adding…' : 'Add editor'}
        </Button>
      </form>
      <p className="mt-2 text-xs text-slate-400">
        The person must already have an SF-CMS account. Create their user in Supabase Auth first,
        then grant access here.
      </p>
    </div>
  )
}
