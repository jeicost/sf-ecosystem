import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const NOTION_API_KEY  = process.env.NOTION_API_KEY!
const NOTION_DB_ID    = process.env.NOTION_VBS_DB_ID!
const NOTION_VERSION  = '2022-06-28'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
  )
}

async function notionHeaders() {
  return {
    'Authorization': `Bearer ${NOTION_API_KEY}`,
    'Notion-Version': NOTION_VERSION,
    'Content-Type': 'application/json',
  }
}

const STAGE_LABELS: Record<string, string> = {
  prospected:  'Prospectado',
  contacted:   'Contactado',
  replied:     'Respondió',
  qualified:   'Calificado',
  proposal:    'Propuesta enviada',
  negotiation: 'Negociación',
  won:         'Cerrado ✓',
  lost:        'Perdido',
}

async function findNotionPageByCompany(company: string): Promise<string | null> {
  const res = await fetch(`https://api.notion.com/v1/databases/${NOTION_DB_ID}/query`, {
    method: 'POST',
    headers: await notionHeaders(),
    body: JSON.stringify({
      filter: { property: 'Nombre', title: { equals: company } },
      page_size: 1,
    }),
  })
  if (!res.ok) return null
  const data = await res.json()
  return data.results?.[0]?.id ?? null
}

async function updateNotionStage(pageId: string, stage: string): Promise<boolean> {
  const label = STAGE_LABELS[stage] ?? stage
  const res = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
    method: 'PATCH',
    headers: await notionHeaders(),
    body: JSON.stringify({
      properties: {
        Stage: { select: { name: stage } },
      },
    }),
  })
  return res.ok
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { stage } = await req.json()

  if (!stage) return NextResponse.json({ error: 'stage required' }, { status: 400 })

  const db = adminClient()

  // 1. Actualizar Supabase
  const { data: lead, error } = await db
    .from('leads')
    .update({ stage, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('company_name, notion_page_id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // 2. Sincronizar con Notion
  let notionUpdated = false
  if (NOTION_API_KEY && NOTION_DB_ID) {
    try {
      let pageId = lead.notion_page_id

      // Si no tenemos el page_id guardado, buscar por nombre
      if (!pageId) {
        pageId = await findNotionPageByCompany(lead.company_name)
        // Guardarlo para la próxima vez
        if (pageId) {
          await db.from('leads').update({ notion_page_id: pageId }).eq('id', id)
        }
      }

      if (pageId) {
        notionUpdated = await updateNotionStage(pageId, stage)
      }
    } catch (e) {
      console.error('Notion sync error:', e)
    }
  }

  return NextResponse.json({ success: true, stage, notion_updated: notionUpdated })
}
