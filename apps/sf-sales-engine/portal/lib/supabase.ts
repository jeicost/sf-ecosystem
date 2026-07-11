import { createClient } from '@supabase/supabase-js'

const url  = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(url, anon)

export type Lead = {
  id: string
  company_name: string | null
  company_website: string | null
  email: string | null
  linkedin_url: string | null
  industry: string | null
  geography: string | null
  stage: string
  hot_score: number | null
  linkedin_summary: string | null
  trigger_event: string | null
  source: string | null
  notes: string | null
  icebreaker_used: string | null
  notion_page_id: string | null
  created_at: string
  updated_at: string
}

export type Stats = {
  total: number
  hot: number
  warm: number
  cold: number
  disqualify: number
}

export function getClassification(score: number | null): string {
  if (!score) return 'disqualify'
  if (score >= 75) return 'hot'
  if (score >= 50) return 'warm'
  if (score >= 20) return 'cold'
  return 'disqualify'
}
