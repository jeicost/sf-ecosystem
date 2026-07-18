'use client'

import { useState } from 'react'
import Papa from 'papaparse'
import type { Workspace } from '@/types'
import styles from './prospection.module.css'

interface ProspectionClientProps {
  workspaceId: string
  workspace: Workspace
}

interface SearchResponse {
  success: boolean
  results: Array<{
    firstName: string
    lastName: string
    company: string
    title: string
    email: string
    emailVerified: boolean
    linkedinUrl?: string
    industry?: string
    geography?: string
  }>
  totalCount: number
  costUsd: number
  monthlySpendUsd: number
  monthlyLimitUsd: number
  hitsLimit: boolean
}

export default function ProspectionClient({ workspaceId, workspace }: ProspectionClientProps) {
  const [tab, setTab] = useState<'search' | 'import'>('search')
  const [searchQuery, setSearchQuery] = useState('')
  const [results, setResults] = useState<SearchResponse['results']>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [costData, setCostData] = useState<Omit<SearchResponse, 'results' | 'success'> | null>(null)
  const [addingIds, setAddingIds] = useState(new Set<number>())
  const [addedIds, setAddedIds] = useState(new Set<number>())
  const [csvResults, setCsvResults] = useState<{ imported: number; failed: number; errors: string[] } | null>(null)
  const [csvLoading, setCsvLoading] = useState(false)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!searchQuery.trim()) return

    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/prospection/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery, workspaceId }),
      })

      if (response.status === 402) {
        const data = await response.json()
        setError(`Monthly budget exceeded: ${data.detail}`)
        setResults([])
        setCostData(null)
        return
      }

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Search failed')
        setResults([])
        setCostData(null)
        return
      }

      const data: SearchResponse = await response.json()
      setResults(data.results || [])
      setCostData({
        totalCount: data.totalCount,
        costUsd: data.costUsd,
        monthlySpendUsd: data.monthlySpendUsd,
        monthlyLimitUsd: data.monthlyLimitUsd,
        hitsLimit: data.hitsLimit,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      console.error('Search error:', err)
      setError(message)
      setResults([])
      setCostData(null)
    } finally {
      setLoading(false)
    }
  }

  async function handleAddToPipeline(idx: number, result: SearchResponse['results'][0]) {
    try {
      setAddingIds((prev) => new Set(prev).add(idx))
      const response = await fetch('/api/leads/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leads: [result],
          workspaceId,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        console.error('Failed to add to pipeline:', data)
        setAddingIds((prev) => {
          const next = new Set(prev)
          next.delete(idx)
          return next
        })
        setError(data.error || 'Failed to add prospect to pipeline')
        return
      }

      setAddingIds((prev) => {
        const next = new Set(prev)
        next.delete(idx)
        return next
      })
      setAddedIds((prev) => new Set(prev).add(idx))

      // Reset "Added" state after 2 seconds
      setTimeout(() => {
        setAddedIds((prev) => {
          const next = new Set(prev)
          next.delete(idx)
          return next
        })
      }, 2000)
    } catch (err) {
      setAddingIds((prev) => {
        const next = new Set(prev)
        next.delete(idx)
        return next
      })
      const message = err instanceof Error ? err.message : 'Unknown error'
      console.error('Add to pipeline error:', err)
      setError(message)
    }
  }

  async function handleCsvImport(file: File) {
    setCsvLoading(true)
    setCsvResults(null)
    try {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          const rows = results.data as Record<string, any>[]
          const leads = rows.map(row => ({
            firstName: row.first_name || row.firstName || '',
            lastName: row.last_name || row.lastName || '',
            email: row.email || '',
            company: row.company || row.company_name || '',
            title: row.title || '',
            phone: row.phone || '',
            linkedinUrl: row.linkedin || row.linkedin_url || '',
            geography: row.geography || row.location || '',
            industry: row.industry || '',
          }))

          const response = await fetch('/api/leads/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ leads, workspaceId }),
          })

          const data = await response.json()
          setCsvResults({
            imported: data.imported || 0,
            failed: data.failed || 0,
            errors: data.errors || [],
          })
          setCsvLoading(false)
        },
        error: (error) => {
          setError(`CSV parse error: ${error.message}`)
          setCsvLoading(false)
        },
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'CSV import failed')
      setCsvLoading(false)
    }
  }

  const budgetPercentage = costData
    ? (costData.monthlySpendUsd / costData.monthlyLimitUsd) * 100
    : 0

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Prospection</h1>
        <p>{workspace.name}</p>
      </div>

      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <button
          onClick={() => setTab('search')}
          style={{
            padding: '10px 15px',
            background: tab === 'search' ? 'var(--color-primary)' : 'var(--bg-secondary)',
            color: tab === 'search' ? 'white' : 'var(--text-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            fontWeight: tab === 'search' ? '600' : '400',
          }}
        >
          Search Apollo
        </button>
        <button
          onClick={() => setTab('import')}
          style={{
            padding: '10px 15px',
            background: tab === 'import' ? 'var(--color-primary)' : 'var(--bg-secondary)',
            color: tab === 'import' ? 'white' : 'var(--text-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            fontWeight: tab === 'import' ? '600' : '400',
          }}
        >
          Import CSV
        </button>
      </div>

      {tab === 'search' && (
        <div className={styles.searchSection}>
          <form onSubmit={handleSearch} className={styles.searchForm}>
            <input
              type="text"
              placeholder="Enter company domain (e.g., acme.com)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
            <button type="submit" disabled={loading} className={styles.searchButton}>
              {loading ? 'Searching...' : 'Search'}
            </button>
          </form>
        </div>
      )}

      {tab === 'import' && (
        <div className={styles.searchSection}>
          <div style={{ padding: '20px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '2px dashed var(--border-color)' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '10px', cursor: 'pointer' }}>
              <span style={{ fontWeight: '600' }}>📁 Upload CSV file</span>
              <input
                type="file"
                accept=".csv"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleCsvImport(e.target.files[0])
                  }
                }}
                disabled={csvLoading}
                style={{ fontSize: '14px' }}
              />
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Expected columns: email, first_name, last_name, company, title, phone, linkedin, geography, industry
              </span>
            </label>
          </div>
          {csvResults && (
            <div style={{ marginTop: '15px', padding: '15px', background: 'rgba(34, 197, 94, 0.1)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-success)' }}>
              <div>✓ Imported: <strong>{csvResults.imported}</strong></div>
              <div>✗ Failed: <strong>{csvResults.failed}</strong></div>
              {csvResults.errors.length > 0 && (
                <div style={{ marginTop: '10px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  <p>Errors:</p>
                  <ul style={{ margin: '5px 0 0 20px' }}>
                    {csvResults.errors.map((err, i) => <li key={i}>{err}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {error && tab === 'search' && (
        <div className={styles.errorBanner}>
          <span>⚠️ {error}</span>
        </div>
      )}

      {tab === 'search' && costData && (
        <div className={styles.costIndicator}>
          <div className={styles.costRow}>
            <span className={styles.costLabel}>Monthly Budget:</span>
            <span className={styles.costValue}>
              ${costData.monthlySpendUsd.toFixed(2)} / ${costData.monthlyLimitUsd.toFixed(2)}
            </span>
          </div>
          <div className={styles.budgetBar}>
            <div
              className={`${styles.budgetFill} ${costData.hitsLimit ? styles.budgetWarning : ''}`}
              style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
            />
          </div>
          <div className={styles.costRow}>
            <span className={styles.costLabel}>Cost this search:</span>
            <span className={styles.costValue}>${costData.costUsd.toFixed(4)}</span>
          </div>
          {costData.hitsLimit && (
            <div className={styles.budgetAlert}>
              ⚠️ Approaching monthly limit (90%+)
            </div>
          )}
        </div>
      )}

      {tab === 'search' && results.length > 0 && (
        <div className={styles.results}>
          <div className={styles.resultsHeader}>
            <h2>Results ({results.length})</h2>
          </div>
          <div className={styles.resultsList}>
            {results.map((result, idx) => {
              const isAdding = addingIds.has(idx)
              const isAdded = addedIds.has(idx)
              return (
                <div key={idx} className={styles.resultCard}>
                <div className={styles.resultHeader}>
                  <div className={styles.resultName}>
                    <strong>{result.firstName} {result.lastName}</strong>
                    {result.emailVerified && (
                      <span className={styles.verifiedBadge} title="Email verified">✓</span>
                    )}
                  </div>
                  <span className={styles.resultCompany}>{result.company}</span>
                </div>

                <div className={styles.resultMeta}>
                  <p className={styles.resultTitle}>{result.title}</p>
                  {result.geography && (
                    <p className={styles.resultLocation}>📍 {result.geography}</p>
                  )}
                  {result.industry && (
                    <p className={styles.resultIndustry}>🏢 {result.industry}</p>
                  )}
                </div>

                <div className={styles.resultContact}>
                  {result.email && (
                    <a href={`mailto:${result.email}`} className={styles.emailLink}>
                      {result.email}
                    </a>
                  )}
                </div>

                <div className={styles.resultActions}>
                  {result.linkedinUrl && (
                    <a
                      href={result.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.linkedinLink}
                    >
                      LinkedIn →
                    </a>
                  )}
                  <button
                    className={styles.addButton}
                    onClick={() => handleAddToPipeline(idx, result)}
                    disabled={isAdding || isAdded}
                  >
                    {isAdding ? 'Adding...' : isAdded ? 'Added ✓' : 'Add to Pipeline'}
                  </button>
                </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {tab === 'search' && !results.length && !loading && !error && (
        <div className={styles.empty}>
          <p>🔍 Enter a company domain to search for prospects</p>
        </div>
      )}
    </div>
  )
}
