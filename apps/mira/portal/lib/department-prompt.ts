// Chat por departamento (opción A: una sola voz) — 2026-07-30.
// Reutiliza el mismo endpoint/loop de tool-use que el chat de un solo agente
// (app/api/agent/route.ts) con un "rol virtual" `dept:<slug>` cuyo system
// prompt sintetiza a todo el equipo del departamento en una sola voz, en vez
// de fragmentar la conversación por personaje.

import { DEPARTMENT_METADATA, type DepartmentMetadata } from './department-meta'
import {
  COMERCIAL_DEPT_AGENTS,
  MARKETING_DEPT_AGENTS,
  STRATEGY_DEPT_AGENTS,
  OPERACIONES_DEPT_AGENTS,
  FINANZAS_DEPT_AGENTS,
  type AgentMetadata,
} from './agent-meta'

export const DEPARTMENT_CHAT_PREFIX = 'dept:'

const DEPT_AGENTS: Record<DepartmentMetadata['slug'], AgentMetadata[]> = {
  marketing: MARKETING_DEPT_AGENTS,
  comercial: COMERCIAL_DEPT_AGENTS,
  strategy: STRATEGY_DEPT_AGENTS,
  operations: OPERACIONES_DEPT_AGENTS,
  finanzas: FINANZAS_DEPT_AGENTS,
}

const CREATIVE_IMAGE_AGENT_IDS = ['designer', 'spark']

export function parseDepartmentChatRole(role: unknown): DepartmentMetadata['slug'] | null {
  if (typeof role !== 'string' || !role.startsWith(DEPARTMENT_CHAT_PREFIX)) return null
  const slug = role.slice(DEPARTMENT_CHAT_PREFIX.length)
  // Object.hasOwn, no `in`: DEPARTMENT_METADATA es un objeto plano, así que un
  // slug como 'constructor'/'toString'/'__proto__' resolvería a una propiedad
  // heredada de Object.prototype (truthy) en vez de ser rechazado.
  return Object.hasOwn(DEPARTMENT_METADATA, slug) ? (slug as DepartmentMetadata['slug']) : null
}

export function getDepartmentAgents(slug: DepartmentMetadata['slug']): AgentMetadata[] {
  // Misma guarda que arriba, por si algún caller llama a esto sin pasar antes
  // por parseDepartmentChatRole (defensa en profundidad).
  return Object.hasOwn(DEPT_AGENTS, slug) ? DEPT_AGENTS[slug] : []
}

export function departmentHasCreativeAgents(slug: DepartmentMetadata['slug']): boolean {
  return getDepartmentAgents(slug).some((a) => CREATIVE_IMAGE_AGENT_IDS.includes(a.id))
}

// AgentMetadata.department usa 'operaciones' (ES) para el mismo departamento
// que DepartmentMetadata.slug llama 'operations' (EN) — inconsistencia ya
// conocida (docs/DEBT.md, entrada u) que no se unifica aquí, solo se traduce
// en este único punto para poder marcar project_memory.source_department
// con el valor que el resto de la app ya espera.
export function departmentSlugToAgentDomain(slug: DepartmentMetadata['slug']): AgentMetadata['department'] {
  return slug === 'operations' ? 'operaciones' : (slug as AgentMetadata['department'])
}

export function getDepartmentChatName(slug: DepartmentMetadata['slug'], locale: 'es' | 'en' = 'es'): string {
  const dept = DEPARTMENT_METADATA[slug]
  const name = locale === 'en' ? dept.name : dept.nameEs
  return locale === 'en' ? `${name} team` : `Equipo de ${name}`
}

export function getDepartmentPrompt(slug: DepartmentMetadata['slug'], locale: 'es' | 'en' = 'es'): string {
  const dept = DEPARTMENT_METADATA[slug]
  const agents = getDepartmentAgents(slug)
  const deptName = locale === 'en' ? dept.name : dept.nameEs
  const roster = agents
    .map((a) => `- ${a.name}: ${locale === 'en' ? a.description : a.descriptionEs}`)
    .join('\n')

  if (locale === 'en') {
    return `You are the unified ${deptName} team chat inside MIRA, an AI agency platform. You speak as ONE coherent voice for the whole department — never as separate fragmented characters — drawing on the combined expertise of:\n${roster}\n\nAnswer anything the user asks that falls within ${deptName}'s scope, moving fluidly between these specialties within the same conversation as needed. If a request clearly belongs to another department (Sales, Marketing, Strategy, Operations or Finance), say so plainly and point to that department — never invent the name of a specific colleague who isn't in the roster above. Keep a professional, warm, non-corporate tone consistent across the whole conversation.`
  }
  return `Eres el chat unificado del equipo de ${deptName} dentro de MIRA, una plataforma de agencia con IA. Hablas como UNA sola voz coherente para todo el departamento — nunca como personajes separados y fragmentados — apoyándote en la experiencia combinada de:\n${roster}\n\nResponde a cualquier cosa que el usuario pida dentro del alcance de ${deptName}, moviéndote con fluidez entre estas especialidades dentro de la misma conversación según haga falta. Si una petición pertenece claramente a otro departamento (Comercial, Marketing, Estrategia, Operaciones o Finanzas), dilo con naturalidad y señala ese departamento — nunca inventes el nombre de un colega concreto que no esté en la lista de arriba. Mantén un tono profesional, cercano y sin jerga corporativa a lo largo de toda la conversación.`
}
