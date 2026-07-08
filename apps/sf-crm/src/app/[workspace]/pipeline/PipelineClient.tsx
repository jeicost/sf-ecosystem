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
}

export default function PipelineClient({ workspaceId, workspace }: PipelineClientProps) {
  const [stages, setStages] = useState<StageData[]>([])
  const [totalScore, setTotalScore] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadPipeline() {
      try {
        setLoading(true)
        const res = await fetch('/api/contacts')
        if (!res.ok) throw new Error('Failed to load pipeline')
        const json = await res.json()
        const contacts = json.data as Contact[]

        setStages(
          STAGES.map((stage) => ({
            stage,
            count: contacts.filter((c) => c.stage === stage).length,
          }))
        )
        setTotalScore(contacts.reduce((sum, c) => sum + (c.score || 0), 0))
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
        {stages.map(({ stage, count }) => {
          const total = stages.reduce((sum, s) => sum + s.count, 0) || 1
          return (
            <div key={stage} className={styles.stage}>
              <div className={styles.stageHeader}>
                <h3>{stage}</h3>
                <span className={styles.count}>{count}</span>
              </div>
              <div className={styles.stageBar}>
                <div
                  className={styles.stageBarFill}
                  style={{ width: `${(count / total) * 100}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>

      <div className={styles.summary}>
        <div className={styles.summaryItem}>
          <p>Total Contacts</p>
          <span>{stages.reduce((sum, s) => sum + s.count, 0)}</span>
        </div>
        <div className={styles.summaryItem}>
          <p>Combined Score</p>
          <span>{totalScore}</span>
        </div>
      </div>
    </div>
  )
}
