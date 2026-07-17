import { createClient } from '@/lib/supabase'

export interface BrandBrainData {
  brand_name?: string
  industry?: string
  target_audience?: string
  primary_color?: string
  content_pillars?: string[]
  tone_of_voice?: string
  mission?: string
  core_values?: string[]
}

/**
 * Fetch Brand Brain data for pre-filling toolkit forms
 */
export async function fetchBrandBrainData(clientId: string): Promise<BrandBrainData> {
  try {
    const client = createClient()
    const { data, error } = await client
      .from('brand_profiles')
      .select('*')
      .eq('client_id', clientId)
      .single()

    if (error || !data) {
      return {}
    }

    // Map brand_profiles fields to form field names
    return {
      brand_name: data.brand_name,
      industry: data.industry_sector,
      target_audience: data.target_audience_description,
      primary_color: data.primary_color,
      content_pillars: data.content_pillars || [],
      tone_of_voice: data.tone_of_voice,
      mission: data.mission,
      core_values: data.core_values || [],
    }
  } catch (error) {
    console.error('Error loading Brand Brain data:', error)
    return {}
  }
}
