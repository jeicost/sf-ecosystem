export async function getClientStats(clientId: string) {
  try {
    const res = await fetch(`/api/client-portal/stats?clientId=${clientId}`)
    if (!res.ok) throw new Error('Failed to fetch stats')
    return await res.json()
  } catch (error) {
    console.error('Error fetching client stats:', error)
    return {
      contentGenerated: 0,
      toolsUsed: 0,
      timeSavedHours: 0,
      toolkitGenerations: 0,
      quickActionsExecuted: 0,
    }
  }
}

export async function getClientDeliveries(clientId: string, limit: number = 10) {
  try {
    const res = await fetch(`/api/client-portal/deliveries?clientId=${clientId}&limit=${limit}`)
    if (!res.ok) throw new Error('Failed to fetch deliveries')
    return await res.json()
  } catch (error) {
    console.error('Error fetching client deliveries:', error)
    return []
  }
}

export async function getClientBrandProfile(clientId: string) {
  try {
    const res = await fetch(`/api/client-portal/brand?clientId=${clientId}`)
    if (!res.ok) throw new Error('Failed to fetch brand profile')
    return await res.json()
  } catch (error) {
    console.error('Error fetching brand profile:', error)
    return null
  }
}

export async function getContentPillars(clientId: string) {
  try {
    const res = await fetch(`/api/client-portal/pillars?clientId=${clientId}`)
    if (!res.ok) throw new Error('Failed to fetch content pillars')
    return await res.json()
  } catch (error) {
    console.error('Error fetching content pillars:', error)
    return []
  }
}

export async function getClientInfo(clientId: string) {
  try {
    const res = await fetch(`/api/client-portal/info?clientId=${clientId}`)
    if (!res.ok) throw new Error('Failed to fetch client info')
    return await res.json()
  } catch (error) {
    console.error('Error fetching client info:', error)
    return null
  }
}

export async function getClientTeamMembers(clientId: string) {
  try {
    const res = await fetch(`/api/client-portal/team?clientId=${clientId}`)
    if (!res.ok) throw new Error('Failed to fetch team members')
    return await res.json()
  } catch (error) {
    console.error('Error fetching team members:', error)
    return []
  }
}
