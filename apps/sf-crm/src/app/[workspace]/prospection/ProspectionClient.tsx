'use client'

import { useState } from 'react'
import type { Workspace } from '@/types'
import styles from './prospection.module.css'

interface ProspectionClientProps {
  workspaceId: string
  workspace: Workspace
}

export default function ProspectionClient({ workspaceId, workspace }: ProspectionClientProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!searchQuery.trim()) return

    try {
      setLoading(true)
      const response = await fetch('/api/prospection/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery, workspaceId }),
      })

      if (response.ok) {
        const data = await response.json()
        setResults(data.results || [])
      }
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Prospection</h1>
        <p>{workspace.name}</p>
      </div>

      <div className={styles.searchSection}>
        <form onSubmit={handleSearch} className={styles.searchForm}>
          <input
            type="text"
            placeholder="Search prospects (company, title, location...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
          <button type="submit" disabled={loading} className={styles.searchButton}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>
      </div>

      {results.length > 0 && (
        <div className={styles.results}>
          <h2>Results ({results.length})</h2>
          <div className={styles.resultsList}>
            {results.map((result, idx) => (
              <div key={idx} className={styles.resultCard}>
                <div className={styles.resultHeader}>
                  <strong>{result.firstName} {result.lastName}</strong>
                  <span className={styles.resultCompany}>{result.company}</span>
                </div>
                <p className={styles.resultTitle}>{result.title}</p>
                <p className={styles.resultEmail}>{result.email}</p>
                <button className={styles.addButton}>
                  Add to Contacts
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {!results.length && !loading && (
        <div className={styles.empty}>
          <p>Search for prospects to get started</p>
        </div>
      )}
    </div>
  )
}
