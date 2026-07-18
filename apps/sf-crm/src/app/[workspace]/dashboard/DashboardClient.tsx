'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { Workspace } from '@/types'
import styles from './dashboard.module.css'

interface DashboardClientProps {
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

export default function DashboardClient({ workspaceId, workspace }: DashboardClientProps) {
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadMetrics() {
      try {
        const response = await fetch('/api/metrics')
        if (response.ok) {
          const data = await response.json()
          setMetrics(data)
        }
      } catch (error) {
        console.error('Failed to load metrics:', error)
      } finally {
        setLoading(false)
      }
    }

    loadMetrics()
  }, [])

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Welcome, {workspace.name}</h1>
        <p>Your sales pipeline at a glance</p>
      </div>

      {loading ? (
        <div className={styles.loading}>Loading metrics...</div>
      ) : metrics ? (
        <>
          <div className={styles.metricsGrid}>
            <div className={styles.metricCard}>
              <p className={styles.metricLabel}>Total Leads</p>
              <p className={styles.metricValue}>{metrics.totalLeads}</p>
            </div>
            <div className={styles.metricCard}>
              <p className={styles.metricLabel}>Hot Leads</p>
              <p className={`${styles.metricValue} ${styles.hot}`}>{metrics.hotLeads}</p>
            </div>
            <div className={styles.metricCard}>
              <p className={styles.metricLabel}>Warm Leads</p>
              <p className={`${styles.metricValue} ${styles.warm}`}>{metrics.warmLeads}</p>
            </div>
            <div className={styles.metricCard}>
              <p className={styles.metricLabel}>Cold Leads</p>
              <p className={`${styles.metricValue} ${styles.cold}`}>{metrics.coldLeads}</p>
            </div>
            <div className={styles.metricCard}>
              <p className={styles.metricLabel}>Conversion Rate</p>
              <p className={styles.metricValue}>{metrics.conversionRate.toFixed(1)}%</p>
            </div>
          </div>

          <div className={styles.quickActions}>
            <h2>Quick Actions</h2>
            <div className={styles.actionGrid}>
              <Link href={`/${workspaceId}/pipeline`} className={styles.actionCard}>
                <div className={styles.actionIcon}>📊</div>
                <div className={styles.actionName}>Pipeline</div>
                <div className={styles.actionDesc}>View sales stages</div>
              </Link>
              <Link href={`/${workspaceId}/contacts`} className={styles.actionCard}>
                <div className={styles.actionIcon}>👥</div>
                <div className={styles.actionName}>Contacts</div>
                <div className={styles.actionDesc}>Manage all leads</div>
              </Link>
              <Link href={`/${workspaceId}/prospection`} className={styles.actionCard}>
                <div className={styles.actionIcon}>🔍</div>
                <div className={styles.actionName}>Prospection</div>
                <div className={styles.actionDesc}>Search or import leads</div>
              </Link>
              <Link href={`/${workspaceId}/metrics`} className={styles.actionCard}>
                <div className={styles.actionIcon}>📈</div>
                <div className={styles.actionName}>Analytics</div>
                <div className={styles.actionDesc}>Full metrics dashboard</div>
              </Link>
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}
