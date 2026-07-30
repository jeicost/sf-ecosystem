// Helpers de servidor para los cuestionarios a cliente (P5, migración 0054).
// La migración la aplica el CEO a mano en el SQL editor — TODO el código que
// toca estas tablas debe ser resiliente si aún no existen (patrón
// getDocumentFeedbackBlock): detectar "tabla no existe" y responder 503 legible
// o listas vacías, nunca un 500 críptico.

import { adminClient } from '@/lib/supabase'
import { userCanAccessClient } from '@/lib/resolve-client'
import { INTAKE_QUESTION_KINDS, type IntakeQuestionKind } from '@/lib/intake/intake-template'

export type QuestionnaireStatus =
  | 'draft'
  | 'sent'
  | 'in_progress'
  | 'completed'
  | 'ingested'
  | 'archived'

// Sección de texto narrativo (resumen ejecutivo, diagnóstico, benchmark...)
// mostrada antes de las preguntas -- ver migración 0061.
export interface NarrativeSection {
  heading?: string
  body: string
}

// Una opción de 'select'/'multi_select' puede ser un string plano (lo que ya
// generan los cuestionarios de huecos del brain) o un objeto con descripción
// y marca de "recomendación" (los informes de decisión narrativos, ver
// migración 0061 y el ejemplo real de Adrian Grooves que los motivó).
export interface QuestionOption {
  label: string
  description?: string
  recommended?: boolean
}

export interface QuestionnaireRow {
  id: string
  client_id: string
  project_id: string | null
  title: string
  intro: string | null
  narrative: NarrativeSection[] | null
  status: QuestionnaireStatus
  source: 'manual' | 'brain_gaps' | 'intake_template' | 'onboarding'
  created_by: string | null
  created_at: string
  completed_at: string | null
  ingested_at: string | null
}

export interface QuestionRow {
  id: string
  questionnaire_id: string
  position: number
  section: string | null
  prompt: string
  help: string | null
  kind: IntakeQuestionKind
  options: (string | QuestionOption)[] | null
  required: boolean
  maps_to: string | null
}

export interface AnswerRow {
  id: string
  question_id: string
  client_id: string
  value: unknown
  status: 'draft' | 'final'
  answered_by: string | null
  updated_at: string
}

export const QUESTIONNAIRES_UNAVAILABLE =
  'Los cuestionarios aún no están disponibles: falta aplicar la migración 0054 en Supabase.'

/**
 * True cuando el error de Supabase/PostgREST indica que las tablas 0054 no
 * existen todavía (42P01 = undefined_table; PGRST205 = tabla fuera del schema
 * cache de PostgREST).
 */
export function isMissingTableError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false
  if (error.code === '42P01' || error.code === 'PGRST205') return true
  const msg = (error.message || '').toLowerCase()
  return (
    (msg.includes('does not exist') || msg.includes('schema cache')) &&
    (msg.includes('questionnaire') || msg.includes('client_questionnaires'))
  )
}

/** Planes de agencia — los únicos que generan, envían e ingestan cuestionarios. */
export function isAgencyPlan(plan: unknown): boolean {
  return plan === 'super_admin' || plan === 'admin'
}

/** Normaliza un kind cualquiera (del modelo o del body) a uno válido del CHECK. */
export function normalizeKind(kind: unknown): IntakeQuestionKind {
  return typeof kind === 'string' && (INTAKE_QUESTION_KINDS as string[]).includes(kind)
    ? (kind as IntakeQuestionKind)
    : 'long_text'
}

/**
 * Normaliza options del body de creación -- admite tanto strings planos
 * (cuestionarios generados de huecos del brain) como objetos {label,
 * description?, recommended?} (informes de decisión narrativos, migración
 * 0061). Descarta cualquier entrada sin label utilizable.
 */
export function normalizeOptions(raw: unknown): (string | QuestionOption)[] | null {
  if (!Array.isArray(raw)) return null
  const out: (string | QuestionOption)[] = []
  for (const o of raw) {
    if (typeof o === 'string') {
      const trimmed = o.trim()
      if (trimmed) out.push(trimmed)
      continue
    }
    if (o && typeof o === 'object') {
      const label = typeof (o as Record<string, unknown>).label === 'string'
        ? ((o as Record<string, unknown>).label as string).trim()
        : ''
      if (!label) continue
      const description = typeof (o as Record<string, unknown>).description === 'string'
        ? ((o as Record<string, unknown>).description as string).trim() || undefined
        : undefined
      const recommended = (o as Record<string, unknown>).recommended === true ? true : undefined
      out.push({ label, description, recommended })
    }
  }
  return out.length > 0 ? out : null
}

/** Normaliza narrative del body de creación -- array de {heading?, body}, descarta secciones sin body. */
export function normalizeNarrative(raw: unknown): NarrativeSection[] | null {
  if (!Array.isArray(raw)) return null
  const out: NarrativeSection[] = []
  for (const s of raw) {
    if (!s || typeof s !== 'object') continue
    const body = typeof (s as Record<string, unknown>).body === 'string'
      ? ((s as Record<string, unknown>).body as string).trim()
      : ''
    if (!body) continue
    const heading = typeof (s as Record<string, unknown>).heading === 'string'
      ? ((s as Record<string, unknown>).heading as string).trim() || undefined
      : undefined
    out.push({ heading, body })
  }
  return out.length > 0 ? out : null
}

export type QuestionnaireAccessResult =
  | { ok: true; questionnaire: QuestionnaireRow }
  | { ok: false; status: 403 | 404 | 503; error: string }

/**
 * Carga un cuestionario por id y comprueba que el usuario puede acceder a su
 * cliente (super_admin o grant en mira_project_access). No filtra por status:
 * eso lo decide cada ruta según el caso.
 */
export async function getQuestionnaireForUser(
  id: string,
  user: { id: string; user_metadata?: Record<string, unknown> }
): Promise<QuestionnaireAccessResult> {
  const admin = adminClient()
  const { data, error } = await admin
    .from('client_questionnaires')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    if (isMissingTableError(error)) {
      return { ok: false, status: 503, error: QUESTIONNAIRES_UNAVAILABLE }
    }
    return { ok: false, status: 404, error: 'Cuestionario no encontrado' }
  }
  if (!data) return { ok: false, status: 404, error: 'Cuestionario no encontrado' }

  const questionnaire = data as QuestionnaireRow
  if (!(await userCanAccessClient(user, questionnaire.client_id))) {
    return { ok: false, status: 403, error: 'Sin acceso a este cuestionario' }
  }
  return { ok: true, questionnaire }
}

/** Preguntas del cuestionario ordenadas por posición (lista vacía si la tabla no existe). */
export async function fetchQuestions(questionnaireId: string): Promise<QuestionRow[]> {
  try {
    const admin = adminClient()
    const { data, error } = await admin
      .from('questionnaire_questions')
      .select('*')
      .eq('questionnaire_id', questionnaireId)
      .order('position', { ascending: true })
    if (error || !data) return []
    return data as QuestionRow[]
  } catch {
    return []
  }
}

/** Respuestas de un set de preguntas (lista vacía si la tabla no existe). */
export async function fetchAnswers(questionIds: string[]): Promise<AnswerRow[]> {
  if (!questionIds.length) return []
  try {
    const admin = adminClient()
    const { data, error } = await admin
      .from('questionnaire_answers')
      .select('*')
      .in('question_id', questionIds)
    if (error || !data) return []
    return data as AnswerRow[]
  } catch {
    return []
  }
}

/** Convierte un value jsonb de respuesta (string | string[] | number) a texto plano. */
export function answerValueToText(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (Array.isArray(value)) {
    return value
      .map((v) => String(v).trim())
      .filter(Boolean)
      .join('\n')
  }
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value).trim()
}
