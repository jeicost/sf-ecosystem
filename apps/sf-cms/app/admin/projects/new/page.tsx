'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createProject } from '../actions'

export default function NewProjectPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [revealedKey, setRevealedKey] = useState<string | null>(null)
  const [newProjectId, setNewProjectId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    domain: '',
  })

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const fd = new FormData()
    fd.append('name', formData.name)
    fd.append('slug', formData.slug)
    fd.append('domain', formData.domain)

    const result = await createProject(fd)

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    // Reveal-once: this is the only moment the raw key is ever shown again.
    setRevealedKey(result.apiKey ?? null)
    setNewProjectId(result.project?.id ?? null)
    setLoading(false)
  }

  if (revealedKey) {
    return (
      <div style={{ maxWidth: '600px', margin: '2rem auto' }}>
        <h1>Proyecto creado</h1>
        <div style={{
          padding: '1rem',
          backgroundColor: '#fff8e1',
          border: '1px solid #f0d060',
          borderRadius: '4px',
          marginBottom: '1.5rem',
        }}>
          <p style={{ margin: '0 0 0.75rem', fontWeight: 600 }}>
            Copia esta API key ahora — no se volverá a mostrar nunca más.
          </p>
          <code style={{
            display: 'block',
            padding: '0.75rem',
            backgroundColor: '#fff',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '0.85rem',
            wordBreak: 'break-all',
            marginBottom: '0.75rem',
          }}>
            {revealedKey}
          </code>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(revealedKey)
              setCopied(true)
            }}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: copied ? '#2e7d32' : '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '0.875rem',
              cursor: 'pointer',
            }}
          >
            {copied ? 'Copiada ✓' : 'Copiar'}
          </button>
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', fontSize: '0.9rem' }}>
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
          />
          Ya la copié y la guardé (ej. en las env vars de Vercel del sitio)
        </label>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            type="button"
            disabled={!confirmed}
            onClick={() => router.push('/admin/projects')}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: confirmed ? '#0070f3' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: confirmed ? 'pointer' : 'not-allowed',
            }}
          >
            Continuar
          </button>
          {newProjectId && (
            <button
              type="button"
              disabled={!confirmed}
              onClick={() => router.push(`/admin/projects/${newProjectId}/brief`)}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: confirmed ? '#fff' : '#f5f5f5',
                color: confirmed ? '#0070f3' : '#aaa',
                border: `1px solid ${confirmed ? '#0070f3' : '#ccc'}`,
                borderRadius: '4px',
                fontSize: '1rem',
                fontWeight: '500',
                cursor: confirmed ? 'pointer' : 'not-allowed',
              }}
            >
              Empezar el brief de esta landing
            </button>
          )}
        </div>
        <p style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: '#666' }}>
          El brief es una conversación por chat que recoge todo lo necesario para que el
          equipo técnico construya la web — no la crea por sí solo.
        </p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '600px', margin: '2rem auto' }}>
      <h1>Create New Project</h1>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
            Project Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            required
            disabled={loading}
            placeholder="e.g., My Client Site"
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '1rem',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
            Slug *
          </label>
          <input
            type="text"
            value={formData.slug}
            onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
            required
            disabled={loading}
            placeholder="e.g., my-client-site"
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '1rem',
              boxSizing: 'border-box',
            }}
          />
          <small style={{ color: '#666', marginTop: '0.25rem', display: 'block' }}>
            URL-friendly identifier, must be unique
          </small>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
            Domain (optional)
          </label>
          <input
            type="text"
            value={formData.domain}
            onChange={(e) => setFormData(prev => ({ ...prev, domain: e.target.value }))}
            disabled={loading}
            placeholder="e.g., example.com"
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '1rem',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {error && (
          <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#fee', borderRadius: '4px', color: '#c00', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: loading ? '#ccc' : '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Creating...' : 'Create Project'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            disabled={loading}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#f0f0f0',
              color: '#333',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '1rem',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
