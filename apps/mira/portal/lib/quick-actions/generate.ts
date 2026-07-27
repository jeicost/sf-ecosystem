import { adminClient } from '@/lib/supabase'
import { getQuickActionPrompt } from '@/lib/generation/quick-action-prompts'
import { generateAndStoreImage } from '@/lib/generation/openai-image'
import { createMessageForClient } from '@/lib/anthropic-client'

const VISUAL_ACTIONS = ['crear_post_visual', 'crear_carrusel_visual', 'editar_imagen_visual']

// Tipos reales que la UI renderiza. La columna de BD tenía un CHECK que no los
// admitía (migración 0048 lo ensancha); hasta que esa migración esté aplicada
// el update de output_type falla en silencio y todo lo demás sigue funcionando.
const OUTPUT_TYPES: Record<string, string> = {
  crear_post: 'social_post',
  crear_newsletter: 'newsletter',
  crear_video_brief: 'video',
  crear_carousel: 'structured',
  crear_campaña_ads: 'structured',
  crear_post_visual: 'image',
  crear_carrusel_visual: 'image',
  editar_imagen_visual: 'image',
  responder_ticket: 'text',
}

export class QuickActionError extends Error {
  constructor(message: string, public status = 500) {
    super(message)
    this.name = 'QuickActionError'
  }
}

export interface GenerateQuickActionParams {
  clientId: string
  userId: string
  department: string
  actionType: string
  inputData: Record<string, unknown>
  projectId?: string | null
  /** Retry: reutiliza una fila failed existente en vez de insertar una nueva */
  existingActionId?: string
}

export interface GenerateQuickActionResult {
  actionId: string
  outputData: Record<string, unknown>
  processingTimeMs: number
}

function extractJson(text: string): Record<string, unknown> {
  let output: Record<string, unknown> = {}

  const codeBlockMatch = text.match(/```(?:json)?\s*\n([\s\S]*?)\n```/)
  if (codeBlockMatch) {
    try {
      output = JSON.parse(codeBlockMatch[1].trim())
    } catch {
      // bloque encontrado pero JSON inválido — probar con el texto crudo abajo
    }
  }

  if (!Object.keys(output).length) {
    let braceCount = 0
    let jsonStart = -1
    let jsonEnd = -1
    for (let i = 0; i < text.length; i++) {
      if (text[i] === '{') {
        if (braceCount === 0) jsonStart = i
        braceCount++
      } else if (text[i] === '}') {
        braceCount--
        if (braceCount === 0 && jsonStart !== -1) {
          jsonEnd = i + 1
          break
        }
      }
    }
    if (jsonStart !== -1 && jsonEnd !== -1) {
      const potentialJson = text.substring(jsonStart, jsonEnd)
      try {
        output = JSON.parse(potentialJson)
      } catch {
        try {
          const cleaned = potentialJson.replace(/\n\s+/g, ' ').replace(/:\s+/g, ': ')
          output = JSON.parse(cleaned)
        } catch {
          // extracción fallida — el caller trata el objeto vacío como error
        }
      }
    }
  }

  return output
}

/**
 * Núcleo compartido de generación de quick actions. Lo usan el POST de
 * /api/quick-actions (modo formulario), /api/quick-actions/retry, y el
 * submit_action del modo guiado. El caller es responsable de haber validado
 * el acceso del usuario al cliente ANTES de llamar aquí.
 *
 * Garantía central: la fila NUNCA queda en 'processing' — cualquier error
 * la marca 'failed' con error_message antes de relanzar.
 */
export async function generateQuickAction(
  params: GenerateQuickActionParams
): Promise<GenerateQuickActionResult> {
  const { clientId, userId, department, actionType, inputData, projectId, existingActionId } = params
  const startTime = Date.now()
  const admin = adminClient()

  let actionId: string
  if (existingActionId) {
    let { error } = await admin
      .from('quick_actions_results')
      .update({ status: 'processing', error_message: null, output_data: {} })
      .eq('id', existingActionId)
    if (error?.message.includes('error_message')) {
      // Columna ausente hasta aplicar 0048 — reintentar sin ella
      ;({ error } = await admin
        .from('quick_actions_results')
        .update({ status: 'processing', output_data: {} })
        .eq('id', existingActionId))
    }
    if (error) throw new QuickActionError(error.message)
    actionId = existingActionId
  } else {
    const { data, error } = await admin
      .from('quick_actions_results')
      .insert({
        client_id: clientId,
        user_id: userId,
        department,
        action_type: actionType,
        input_data: inputData,
        output_data: {},
        status: 'processing',
      })
      .select('id')
      .single()
    if (error || !data) {
      throw new QuickActionError(error?.message || 'Insert failed')
    }
    actionId = data.id
  }

  // output_type real, en update separado no-fatal: el CHECK viejo de la columna
  // lo rechaza hasta que se aplique la migración 0048 — no debe romper nada.
  const outputType = OUTPUT_TYPES[actionType] ?? 'structured'
  admin
    .from('quick_actions_results')
    .update({ output_type: outputType })
    .eq('id', actionId)
    .then(({ error }) => {
      if (error && !error.message.includes('check constraint')) {
        console.error('output_type update failed:', error.message)
      }
    })

  const markFailed = async (message: string) => {
    const { error } = await admin
      .from('quick_actions_results')
      .update({ status: 'failed', error_message: message.slice(0, 500) })
      .eq('id', actionId)
    if (error?.message.includes('error_message')) {
      // Columna ausente hasta aplicar 0048 — al menos dejar la fila en failed
      await admin
        .from('quick_actions_results')
        .update({ status: 'failed' })
        .eq('id', actionId)
    }
  }

  try {
    const prompt = await getQuickActionPrompt(actionType, {
      clientId,
      inputData,
    })

    if (!prompt) {
      await markFailed('Unknown action type')
      throw new QuickActionError('Unknown action type', 400)
    }

    const message = await createMessageForClient(clientId, 'quick-actions', {
      model: 'claude-opus-4-8',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    })

    if (message.stop_reason === 'max_tokens') {
      await markFailed('Output truncated at max_tokens')
      throw new QuickActionError('Output truncated — try a shorter input')
    }

    const textContent = message.content[0]
    let output_data: Record<string, unknown> = {}
    if (textContent && 'text' in textContent) {
      output_data = extractJson(textContent.text)
    }

    // Acciones visuales: generar la imagen real desde el spec vía OpenAI
    if (VISUAL_ACTIONS.includes(actionType) && Object.keys(output_data).length > 0) {
      const spec = output_data as Record<string, any>
      const imagePrompt: string | undefined =
        spec.image_generation_prompt ||
        spec.refinement_prompt ||
        spec.slides?.[0]?.image_generation_prompt ||
        spec.visual_direction
      if (imagePrompt) {
        const image = await generateAndStoreImage(imagePrompt, clientId, actionId)
        if (image) {
          output_data = { ...spec, image_url: image.signedUrl, image_path: image.path }
        } else {
          // La acción sigue siendo success (el copy/spec es válido); solo falló la imagen
          output_data = { ...spec, image_error: true }
        }
      }
    }

    if (Object.keys(output_data).length === 0) {
      await markFailed('Empty result after JSON parse')
      throw new QuickActionError('Empty result after JSON parse')
    }

    const processingTime = Date.now() - startTime

    const { error: updateError } = await admin
      .from('quick_actions_results')
      .update({
        status: 'success',
        output_data,
        processing_time_ms: processingTime,
      })
      .eq('id', actionId)
    if (updateError) {
      console.error('Update error:', updateError)
    }

    // Auto-log a project memory (fire and forget, no bloquea)
    const outputSummary = JSON.stringify(output_data).slice(0, 200)
    // OJO: el builder de supabase es lazy — sin then() no se dispara la petición.
    admin
      .from('project_memory')
      .insert({
        client_id: clientId,
        project_id: projectId || null,
        title: `Quick Action: ${actionType}`,
        category: 'action',
        summary: outputSummary,
        full_content: output_data,
        tags: [actionType, department],
        source_department: department,
      })
      .then(({ error }) => {
        if (error) console.error('project_memory auto-log failed:', error)
      })

    return { actionId, outputData: output_data, processingTimeMs: processingTime }
  } catch (error) {
    // Garantía anti-zombi: si el error no vino de un markFailed explícito
    // (QuickActionError ya marca), marcar aquí antes de relanzar.
    if (!(error instanceof QuickActionError)) {
      await markFailed(error instanceof Error ? error.message : 'Generation failed')
    }
    throw error
  }
}
