'use client'

import { useState, useEffect } from 'react'
import type { Workspace } from '@/types'
import styles from './metrics.module.css'

interface MetricsClientProps {
  workspaceId: string
  workspace: Workspace
}

interface Metrics {
  totalLeads: number
  hotLeads: number
  warmLeads: number
  coldLeads: number
  conversionRate: number
}

export default function MetricsClient({ workspace }: MetricsClientProps) {
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadMetrics() {
      try {
        const response = await fetch('/api/metrics')
        if (!response.ok) throw new Error('Failed to load metrics')
        const data = await response.json()
        setMetrics(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load metrics')
      } finally {
        setLoading(false)
      }
    }

    loadMetrics()
  }, [])

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading metrics...</div>
      </div>
    )
  }

  if (error || !metrics) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>{error || 'Failed to load metrics'}</div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Métricas</h1>
        <p>{workspace.name}</p>
      </div>

      <div className={styles.grid}>
        <div className={styles.card}>
          <p className={styles.label}>Total Leads</p>
          <span className={styles.value}>{metrics.totalLeads}</span>
        </div>

        <div className={styles.card}>
          <p className={styles.label}>Hot Leads</p>
          <span className={`${styles.value} ${styles.hot}`}>{metrics.hotLeads}</span>
        </div>

        <div className={styles.card}>
          <p className={styles.label}>Warm Leads</p>
          <span className={`${styles.value} ${styles.warm}`}>{metrics.warmLeads}</span>
        </div>

        <div className={styles.card}>
          <p className={styles.label}>Cold Leads</p>
          <span className={`${styles.value} ${styles.cold}`}>{metrics.coldLeads}</span>
        </div>

        <div className={styles.card}>
          <p className={styles.label}>Conversion Rate</p>
          <span className={styles.value}>{metrics.conversionRate.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  )
}
