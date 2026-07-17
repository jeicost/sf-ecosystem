'use client'

import { useState, useEffect } from 'react'
import type { Workspace } from '@/types'
import styles from './discovery.module.css'

interface DiscoveryClientProps {
  workspaceId: string
  workspace: Workspace
}

export default function DiscoveryClient({ workspaceId, workspace }: DiscoveryClientProps) {
  const [runs, setRuns] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [company, setCompany] = useState('')

  useEffect(() => {
    async function loadRuns() {
      try {
        const response = await fetch('/api/discovery/run')
        if (response.ok) {
          const data = await response.json()
          setRuns(data.data || [])
        }
      } catch (error) {
        console.error('Failed to load discovery runs:', error)
      }
    }

    loadRuns()
  }, [])

  async function handleNewRun(e: React.FormEvent) {
    e.preventDefault()
    if (!company.trim()) return

    try {
      setLoading(true)
      const response = await fetch('/api/discovery/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company, workspaceId }),
      })

      if (response.ok) {
        const data = await response.json()
        setRuns([data.run, ...runs])
        setCompany('')
      }
    } catch (error) {
      console.error('Discovery error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Discovery</h1>
        <p>{workspace.name}</p>
      </div>

      <div className={styles.section}>
        <h2>New Discovery Run</h2>
        <form onSubmit={handleNewRun} className={styles.form}>
          <input
            type="text"
            placeholder="Company name"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className={styles.input}
          />
          <button type="submit" disabled={loading} className={styles.button}>
            {loading ? 'Running...' : 'Start Discovery'}
          </button>
        </form>
      </div>

      <div className={styles.section}>
        <h2>Recent Runs ({runs.length})</h2>
        {runs.length === 0 ? (
          <div className={styles.empty}>
            <p>No discovery runs yet</p>
          </div>
        ) : (
          <div className={styles.runsList}>
            {runs.map((run, idx) => (
              <div key={idx} className={styles.runCard}>
                <div className={styles.runHeader}>
                  <strong>{run.company}</strong>
                  <span className={`${styles.status} ${styles[run.status]}`}>
                    {run.status}
                  </span>
                </div>
                <p className={styles.runDate}>
                  Started: {new Date(run.startedAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
