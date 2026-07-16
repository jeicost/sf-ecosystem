import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { clientId } = await request.json()

    if (!clientId) {
      return NextResponse.json(
        { error: 'clientId is required' },
        { status: 400 }
      )
    }

    // Get client name for personalization
    const db = createClient()
    const { data: client } = await db
      .from('clients')
      .select('name')
      .eq('id', clientId)
      .maybeSingle()

    const clientName = client?.name || 'Friend'

    const initialMessage = `Hey ${clientName}! 👋

I'm here to help you build out your Brand Brain, which will give your AI agents full context about your brand, positioning, and strategy.

Let's start by understanding your brand. **What's your biggest differentiator — what makes you unique compared to competitors?**

(Take your time — the more detail you give me, the better your Brand Brain will be.)`

    return NextResponse.json({
      initialMessage,
    })
  } catch (error) {
    console.error('Error initializing chatbot:', error)
    return NextResponse.json(
      { error: 'Failed to initialize chatbot' },
      { status: 500 }
    )
  }
}
