'use client'

import type { Workspace } from '@/types'
import styles from './metrics.module.css'

interface MetricsClientProps {
  workspaceId: string
  workspace: Workspace
}

export default function MetricsClient({ workspace }: MetricsClientProps) {
  const mockMetrics = {
    totalLeads: 248,
    hotLeads: 45,
    warmLeads: 87,
    coldLeads: 116,
    conversionRate: 12.5,
    avgDealSize: 45000,
    pipelineValue: 11160000,
    closureRate: 8.3,
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
          <span className={styles.value}>{mockMetrics.totalLeads}</span>
        </div>

        <div className={styles.card}>
          <p className={styles.label}>Hot Leads</p>
          <span className={`${styles.value} ${styles.hot}`}>{mockMetrics.hotLeads}</span>
        </div>

        <div className={styles.card}>
          <p className={styles.label}>Warm Leads</p>
          <span className={`${styles.value} ${styles.warm}`}>{mockMetrics.warmLeads}</span>
        </div>

        <div className={styles.card}>
          <p className={styles.label}>Cold Leads</p>
          <span className={`${styles.value} ${styles.cold}`}>{mockMetrics.coldLeads}</span>
        </div>

        <div className={styles.card}>
          <p className={styles.label}>Conversion Rate</p>
          <span className={styles.value}>{mockMetrics.conversionRate}%</span>
        </div>

        <div className={styles.card}>
          <p className={styles.label}>Average Deal Size</p>
          <span className={styles.value}>${(mockMetrics.avgDealSize / 1000).toFixed(0)}k</span>
        </div>

        <div className={styles.card}>
          <p className={styles.label}>Pipeline Value</p>
          <span className={styles.value}>${(mockMetrics.pipelineValue / 1000000).toFixed(1)}M</span>
        </div>

        <div className={styles.card}>
          <p className={styles.label}>Closure Rate</p>
          <span className={styles.value}>{mockMetrics.closureRate}%</span>
        </div>
      </div>
    </div>
  )
}
