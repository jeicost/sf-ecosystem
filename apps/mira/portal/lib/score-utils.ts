import { HOT_SCORE_THRESHOLD, WARM_SCORE_THRESHOLD } from './constants'

export interface ScoreLabel {
  emoji: string
  color: string
}

export function scoreLabel(score: number | null): ScoreLabel {
  if (score === null)                      return { emoji: '⬜', color: '#555' }
  if (score >= HOT_SCORE_THRESHOLD)        return { emoji: '🔥', color: '#EF4444' }
  if (score >= WARM_SCORE_THRESHOLD)       return { emoji: '🟡', color: '#F59E0B' }
  return                                          { emoji: '🔵', color: '#3B82F6' }
}
