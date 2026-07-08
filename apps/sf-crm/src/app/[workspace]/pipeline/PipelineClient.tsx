'use client'

import { useState, useEffect } from 'react'
import type { Workspace, Contact, ContactStage } from '@/types'
import styles from './pipeline.module.css'

interface PipelineClientProps {
  workspaceId: string
  workspace: Workspace
}

const STAGES: ContactStage[] = ['prospect', 'qualified', 'engaged', 'proposal', 'negotiation', 'won', 'lost']

interface StageData {
  stage: ContactStage
  count: number
  value: number
}

export default function PipelineClient({ workspaceId, workspace }: PipelineClientProps) {
  const [stages, setStages] = useState<StageData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadPipeline() {
      try {
        setLoading(true)
        // TODO: Fetch actual pipeline data
        const mockData = STAGES.map((stage, idx) => ({
          stage,
          count: Math.floor(Math.random() * 20) + 1,
          value: Math.floor(Math.random() * 100000) + 10000,
        }))
        setStages(mockData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load pipeline')
      } finally {
        setLoading(false)
      }
    }

    loadPipeline()
  }, [workspaceId])

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading pipeline...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>{error}</div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Pipeline</h1>
        <p>{workspace.name}</p>
      </div>

      <div className={styles.pipeline}>
        {stages.map(({ stage, count, value }) => (
          <div key={stage} className={styles.stage}>
            <div className={styles.stageHeader}>
              <h3>{stage}</h3>
              <span className={styles.count}>{count}</span>
            </div>
            <div className={styles.stageValue}>
              <p>${value.toLocaleString()}</p>
            </div>
            <div className={styles.stageBar}>
              <div
                className={styles.stageBarFill}
                style={{ width: `${(count / 20) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className={styles.summary}>
        <div className={styles.summaryItem}>
          <p>Total Opportunities</p>
          <span>{stages.reduce((sum, s) => sum + s.count, 0)}</span>
        </div>
        <div className={styles.summaryItem}>
          <p>Pipeline Value</p>
          <span>${stages.reduce((sum, s) => sum + s.value, 0).toLocaleString()}</span>
        </div>
        <div className={styles.summaryItem}>
          <p>Average Deal Size</p>
          <span>${Math.round(stages.reduce((sum, s) => sum + s.value, 0) / stages.reduce((sum, s) => sum + s.count, 0)).toLocaleString()}</span>
        </div>
      </div>
    </div>
  )
}
