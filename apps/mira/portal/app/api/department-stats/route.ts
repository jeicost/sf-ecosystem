import { NextRequest, NextResponse } from 'next/server'
import { getDepartmentStats } from '@/lib/department-stats'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')
    const dept = searchParams.get('dept')

    if (!clientId) {
      return NextResponse.json({ error: 'Missing clientId' }, { status: 400 })
    }

    const allStats = await getDepartmentStats(clientId)
    const deptStats = dept ? allStats[dept] : allStats

    return NextResponse.json(deptStats || {})
  } catch (error) {
    console.error('Error in department-stats:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
