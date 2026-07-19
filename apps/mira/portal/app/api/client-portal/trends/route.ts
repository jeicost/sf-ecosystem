import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-admin'
import { resolveRequestClient } from '@/lib/resolve-client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')

    if (!clientId) {
      return NextResponse.json({ error: 'Missing clientId' }, { status: 400 })
    }

    const auth = await resolveRequestClient(clientId)
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const db = createServiceClient()

    // Get last 3 months of generation data
    const { data, error } = await db
      .from('generation_queue')
      .select('created_at')
      .eq('client_id', clientId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching generation_queue:', error)
      return NextResponse.json(
        {
          months: [],
          trend: { percentChange: 0, confidence: 'no_data' },
        },
        { status: 200 }
      )
    }

    // Group by month and count
    const monthCounts: Record<string, number> = {}
    const now = new Date()
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

    if (data && data.length > 0) {
      data.forEach((row) => {
        const date = new Date(row.created_at)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1
      })
    }

    // Build months array (last 2 months: previous and current)
    const monthsToShow: Array<{ monthYear: string; count: number; label: string }> = []

    // Previous month
    const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const prevMonthKey = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`
    const prevCount = monthCounts[prevMonthKey] || 0
    const prevLabel = prevDate.toLocaleDateString('es-ES', { month: 'short' })
    monthsToShow.push({ monthYear: prevMonthKey, count: prevCount, label: prevLabel })

    // Current month
    const currCount = monthCounts[currentMonth] || 0
    const currLabel = now.toLocaleDateString('es-ES', { month: 'short' })
    monthsToShow.push({ monthYear: currentMonth, count: currCount, label: currLabel })

    // Calculate trend
    let percentChange = 0
    let confidence = 'partial' // current month is partial

    if (prevCount > 0) {
      percentChange = Math.round(((currCount - prevCount) / prevCount) * 100)
    } else if (currCount > 0) {
      // If no previous data but has current, show as +100%
      percentChange = 100
    }

    return NextResponse.json({
      months: monthsToShow,
      trend: {
        percentChange,
        confidence,
        message: `${confidence === 'partial' ? 'Mes parcial: ' : ''}${percentChange > 0 ? '+' : ''}${percentChange}% vs mes anterior`,
      },
    })
  } catch (error) {
    console.error('Error in client-portal trends:', error)
    return NextResponse.json(
      {
        months: [],
        trend: { percentChange: 0, confidence: 'error' },
      },
      { status: 200 }
    )
  }
}
