'use client'

import { useState } from 'react'
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
  const [searchQuery, setSearchQuery] = useState('')
  const [results, setResults] = useState<SearchResponse['results']>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [costData, setCostData] = useState<Omit<SearchResponse, 'results' | 'success'> | null>(null)

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

  const budgetPercentage = costData
    ? (costData.monthlySpendUsd / costData.monthlyLimitUsd) * 100
    : 0

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

      {error && (
        <div className={styles.errorBanner}>
          <span>⚠️ {error}</span>
        </div>
      )}

      {costData && (
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

      {results.length > 0 && (
        <div className={styles.results}>
          <div className={styles.resultsHeader}>
            <h2>Results ({results.length})</h2>
          </div>
          <div className={styles.resultsList}>
            {results.map((result, idx) => (
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
                  <button className={styles.addButton}>
                    Add to Pipeline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!results.length && !loading && !error && (
        <div className={styles.empty}>
          <p>🔍 Enter a company domain to search for prospects</p>
        </div>
      )}
    </div>
  )
}
