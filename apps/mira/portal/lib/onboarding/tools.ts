import type Anthropic from '@anthropic-ai/sdk'
import { adminClient } from '@/lib/supabase'

// Tool-use definitions for the client-onboarding chat (see docs/DEBT.md and
// the plan this feature was built from). Each tool's input_schema is the
// primary guardrail on what the model can write — executors additionally
// destructure only the named fields from `input` rather than spreading it,
// so even a malformed tool call can't smuggle an unexpected column through.
//
// A prior, never-wired-up attempt at this (app/api/brand-brain/chatbot/route.ts,
// now removed) used a hand-rolled ALLOWED_COLUMNS map instead of a real
// input_schema, and it was wrong for two of its four target tables
// (project_memory expected columns `content`/`memory_type` that don't exist;
// agent_documents expected `content`/`url` instead of the real
// `extracted_text`/`file_url`, and was missing the NOT NULL `agent_role`)
// — caught by checking every column against the actual migrations before
// writing this file, not by trusting that earlier code.

export const SAVE_BRAND_PROFILE_FIELDS_TOOL: Anthropic.Tool = {
  name: 'save_brand_profile_fields',
  description:
    "Save or update fields on the client's Brand Brain (brand_profiles). Call this as soon as you've extracted any of these from what the admin gave you — don't wait until everything is known. brand_data is deep-merged into whatever is already saved, so only include the sub-keys you actually have new information for.",
  input_schema: {
    type: 'object',
    properties: {
      name: { type: 'string', description: "The brand's own name (may differ from the client/company name)" },
      mission: { type: 'string' },
      description: { type: 'string', description: 'Who they are / what they do, 2-4 sentences' },
      proposition: { type: 'string', description: 'Their value proposition — what they promise and why it matters' },
      values: { type: 'array', items: { type: 'string' }, description: 'Flat list of brand values, e.g. ["Honestidad", "Accesibilidad"]' },
      tone_of_voice: { type: 'string' },
      brand_data: {
        type: 'object',
        description:
          'Partial patch into the structured Brand Brain object. Only include what you have. Recognized keys: identity {name, tagline, one_liner, mission, vision, enemy, signature_ritual}, what_it_is, value_proposition, competitive_positioning, tone_and_voice (Record; special key golden_rule = the one-sentence self-check "If X could publish it, it isn\'t {brand}"), voice_vocabulary {do: [{phrase, why}], dont: [{phrase, why}]} (the WHY is the teaching — capture it), banned_phrases [string], visual_identity {status, colors {primary, secondary, accent, neutral, notes}, typography {heading_font, body_font, accent_font, notes}, logo {primary_url, notes}, imagery_style}, audiences [{name/segment, description, incentive, language_behaviour}], offer {hero_items [{name, price, note}] max 3, full_list_note, promo_mechanics, purchase_channels []}, languages {manual, captions, per_channel {channel: lang}}, channels [{channel, job, owner}], channels_to_avoid [{channel, why}], constraints {legal_ip, category_rules, self_imposed, sequencing_rule}, what_flopped [{format, theory}], open_questions {contradictions [], undecided [], suspected_broken []}, plus any other freeform key that captures something real (e.g. course_curriculum, bonus_items) that has no dedicated column.',
      },
    },
  },
}

export const ADD_BRAND_REFERENCE_TOOL: Anthropic.Tool = {
  name: 'add_brand_reference',
  description: 'Save a reference link mentioned by the admin — past work, portfolio pieces, inspiration, competitor examples.',
  input_schema: {
    type: 'object',
    properties: {
      url: { type: 'string' },
      title: { type: 'string' },
      pillar: { type: 'string', description: 'Optional grouping/category for this reference' },
      why_worked: { type: 'string' },
      what_to_repeat: { type: 'string' },
    },
    required: ['url', 'title'],
  },
}

export const SAVE_CONTENT_PILLAR_TOOL: Anthropic.Tool = {
  name: 'save_content_pillar',
  description: "Save one of the client's content pillars/themes, if they described their content strategy or recurring topics.",
  input_schema: {
    type: 'object',
    properties: {
      pillar_name: { type: 'string' },
      description: { type: 'string' },
      themes: { type: 'array', items: { type: 'string' } },
      examples: { type: 'array', items: { type: 'string' } },
    },
    required: ['pillar_name'],
  },
}

export const SAVE_PROJECT_MEMORY_TOOL: Anthropic.Tool = {
  name: 'save_project_memory',
  description:
    "Write an entry to the client's project memory — use this once, near the end, to leave a real summary of what was captured during onboarding, so it can be reviewed later from the client's own account. Can also be used mid-conversation for a specific important decision or insight worth remembering on its own.",
  input_schema: {
    type: 'object',
    properties: {
      title: { type: 'string' },
      category: { type: 'string', enum: ['insight', 'decision', 'action', 'metric', 'content'] },
      summary: { type: 'string' },
      full_content: { type: 'object', description: 'Optional structured detail behind the summary' },
      tags: { type: 'array', items: { type: 'string' } },
    },
    required: ['title', 'category', 'summary'],
  },
}

export const PROPOSE_NEW_CLIENT_TOOL: Anthropic.Tool = {
  name: 'propose_new_client',
  description:
    "Propose the real name for this new client, as soon as you know it (usually from the very first message). You only propose the name — the system generates and reserves the actual slug/identity, you never decide it.",
  input_schema: {
    type: 'object',
    properties: {
      name: { type: 'string' },
    },
    required: ['name'],
  },
}

export const REQUEST_LOGIN_CREATION_TOOL: Anthropic.Tool = {
  name: 'request_login_creation',
  description:
    "Once the strategically important Brand Brain information is captured (not before), ask the admin for the client's real contact email and call this. This does NOT create the account by itself — it surfaces a confirmation card in the UI that the admin must click to actually create the login. Only call this once per conversation.",
  input_schema: {
    type: 'object',
    properties: {
      email: { type: 'string' },
    },
    required: ['email'],
  },
}

export const ONBOARDING_TOOLS: Anthropic.Tool[] = [
  SAVE_BRAND_PROFILE_FIELDS_TOOL,
  ADD_BRAND_REFERENCE_TOOL,
  SAVE_CONTENT_PILLAR_TOOL,
  SAVE_PROJECT_MEMORY_TOOL,
  PROPOSE_NEW_CLIENT_TOOL,
  REQUEST_LOGIN_CREATION_TOOL,
]

/** Recursive plain-object merge — arrays and primitives from `patch` replace, objects merge key by key. */
function deepMerge(base: Record<string, any>, patch: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = { ...base }
  for (const [key, value] of Object.entries(patch)) {
    if (
      value !== null &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      typeof result[key] === 'object' &&
      result[key] !== null &&
      !Array.isArray(result[key])
    ) {
      result[key] = deepMerge(result[key], value)
    } else {
      result[key] = value
    }
  }
  return result
}

export interface ToolExecutionResult {
  chip: string
  pendingLogin?: { email: string }
  proposedName?: string
}

/** Runs one tool call against the real DB, returns a short human-readable label for the "saved" chip. */
export async function executeOnboardingTool(
  toolName: string,
  input: Record<string, any>,
  clientId: string
): Promise<ToolExecutionResult> {
  const db = adminClient()

  switch (toolName) {
    case 'save_brand_profile_fields': {
      const { name, mission, description, proposition, values, tone_of_voice, brand_data } = input
      const { data: current, error: fetchError } = await db
        .from('brand_profiles')
        .select('brand_data')
        .eq('client_id', clientId)
        .maybeSingle()
      if (fetchError) throw new Error(`Failed to read current brand_data: ${fetchError.message}`)
      if (!current) throw new Error(`No brand_profiles row exists for client ${clientId} -- Tier 0 should have created one`)

      const mergedBrandData = brand_data
        ? deepMerge((current.brand_data as Record<string, any>) || {}, brand_data)
        : current.brand_data

      const update: Record<string, any> = { updated_at: new Date().toISOString() }
      if (name !== undefined) update.name = name
      if (mission !== undefined) update.mission = mission
      if (description !== undefined) update.description = description
      if (proposition !== undefined) update.proposition = proposition
      if (Array.isArray(values)) update.values = values
      if (tone_of_voice !== undefined) update.tone_of_voice = tone_of_voice
      if (mergedBrandData !== undefined) update.brand_data = mergedBrandData

      const { error: updateError } = await db.from('brand_profiles').update(update).eq('client_id', clientId)
      if (updateError) throw new Error(`Failed to save brand profile fields: ${updateError.message}`)

      // Mirror the logo URL onto clients.logo_url too -- clients.logo_url has
      // no upload flow of its own anywhere in the app; this is the same
      // manual pairing done for the Adrian Grooves onboarding this session.
      const logoUrl = mergedBrandData?.visual_identity?.logo?.primary_url
      if (typeof logoUrl === 'string' && logoUrl) {
        await db.from('clients').update({ logo_url: logoUrl }).eq('id', clientId)
      }

      const saved = Object.keys(update).filter((k) => k !== 'updated_at')
      return { chip: `Guardado: ${saved.join(', ')}` }
    }

    case 'add_brand_reference': {
      const { url, title, pillar, why_worked, what_to_repeat } = input
      const { error } = await db
        .from('brand_references')
        .upsert({ client_id: clientId, url, title, pillar, why_worked, what_to_repeat }, { onConflict: 'client_id,url' })
      if (error) throw new Error(`Failed to save brand reference: ${error.message}`)
      return { chip: `Referencia guardada: ${title}` }
    }

    case 'save_content_pillar': {
      const { pillar_name, description, themes, examples } = input
      const row = {
        client_id: clientId,
        pillar_name,
        description,
        themes: Array.isArray(themes) ? themes : [],
        examples: Array.isArray(examples) ? examples : [],
      }
      let { error } = await db.from('content_pillars').upsert(row, { onConflict: 'client_id,pillar_name' })
      // Fallback si la constraint única todavía no existe en producción (ver
      // migración 0062) — degrada a insert en vez de romper el onboarding.
      if (error?.code === '42P10') {
        ;({ error } = await db.from('content_pillars').insert(row))
      }
      if (error) throw new Error(`Failed to save content pillar: ${error.message}`)
      return { chip: `Pilar de contenido guardado: ${pillar_name}` }
    }

    case 'save_project_memory': {
      const { title, category, summary, full_content, tags } = input
      const { error } = await db.from('project_memory').insert({
        client_id: clientId,
        title,
        category,
        summary,
        full_content: full_content ?? null,
        tags: Array.isArray(tags) ? tags : [],
        source_department: 'admin',
      })
      if (error) throw new Error(`Failed to save project memory: ${error.message}`)
      return { chip: `Memoria guardada: ${title}` }
    }

    case 'propose_new_client': {
      const { name } = input
      return { chip: `Nombre propuesto: ${name}`, proposedName: name }
    }

    case 'request_login_creation': {
      const { email } = input
      return { chip: `Acceso solicitado para ${email} — pendiente de confirmación`, pendingLogin: { email } }
    }

    default:
      return { chip: `(herramienta desconocida: ${toolName})` }
  }
}
