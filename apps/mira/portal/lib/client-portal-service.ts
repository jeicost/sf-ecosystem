import { createClient } from '@/lib/supabase'

export async function getClientInfo(clientId: string) {
  const db = createClient()
  const { data, error } = await db
    .from('clients')
    .select('id, name, slug, icp, onboarding_status, logo_url, primary_color, created_at')
    .eq('id', clientId)
    .single()

  if (error) throw new Error(`Failed to fetch client info: ${error.message}`)
  return data
}

export async function getClientDeliveries(clientId: string) {
  const db = createClient()
  const { data, error } = await db
    .from('post_history')
    .select('id, created_at, platform, content, status, approved_by')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) throw new Error(`Failed to fetch deliveries: ${error.message}`)

  // Map to delivery format with tool inference
  return data?.map(post => ({
    id: post.id,
    date: post.created_at,
    tool: inferToolFromPlatform(post.platform),
    status: post.status === 'posted' ? 'delivered' : post.approved_by ? 'delivered' : 'generated',
    size: '2.4 MB', // Mock for now
    platform: post.platform,
  })) || []
}

export async function getClientStats(clientId: string) {
  const db = createClient()

  // Fetch agent activity
  const { data: activities, error: activitiesError } = await db
    .from('agent_activity')
    .select('task_type')
    .eq('client_id', clientId)
    .gte('started_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

  // Fetch posts
  const { data: posts, error: postsError } = await db
    .from('post_history')
    .select('platform')
    .eq('client_id', clientId)
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

  if (activitiesError || postsError) {
    throw new Error('Failed to fetch stats')
  }

  const toolsUsed = new Set(activities?.map(a => a.task_type) || [])
  const contentGenerated = posts?.length || 0

  return {
    contentGenerated,
    reachEstimated: contentGenerated * 6125, // Mock: ~6k per piece
    timeSavedHours: contentGenerated * 1.5, // Mock: 1.5h per piece
    roiProjected: Math.round(contentGenerated * 70), // Mock: 70% per piece
    toolsUsed: toolsUsed.size,
  }
}

export async function getClientBrandProfile(clientId: string) {
  const db = createClient()
  const { data, error } = await db
    .from('brand_profiles')
    .select('brand_name, mission, tone_of_voice, brand_personality, created_at, updated_at')
    .eq('client_id', clientId)
    .single()

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to fetch brand profile: ${error.message}`)
  }

  return data || null
}

export async function getContentPillars(clientId: string) {
  const db = createClient()
  const { data, error } = await db
    .from('content_pillars')
    .select('id, name, description, weight, is_active')
    .eq('client_id', clientId)
    .eq('is_active', true)
    .order('weight', { ascending: false })

  if (error) throw new Error(`Failed to fetch content pillars: ${error.message}`)
  return data || []
}

export async function getClientTeamMembers(clientId: string) {
  const db = createClient()
  const { data, error } = await db
    .from('mira_project_access')
    .select('user_id, role, mira_users!inner(email)')
    .eq('project_id', clientId)

  if (error) throw new Error(`Failed to fetch team members: ${error.message}`)

  return (data as any)?.map((member: any) => ({
    id: member.user_id,
    email: member.mira_users?.[0]?.email || member.mira_users?.email || 'unknown@example.com',
    role: member.role,
    status: 'Activo',
  })) || []
}

function inferToolFromPlatform(platform: string): string {
  const toolMap: Record<string, string> = {
    'instagram': 'Content Pack',
    'twitter': 'Content Pack',
    'linkedin': 'Brand Briefing',
    'email': 'Email Campaign',
    'blog': 'SEO Audit',
  }
  return toolMap[platform.toLowerCase()] || 'Toolkit'
}
