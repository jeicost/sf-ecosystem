import type Anthropic from '@anthropic-ai/sdk'

// Modelos de MIRA, en un solo sitio y con variable de entorno por delante.
//
// 6-oct-2026: el 5-oct se agotó el saldo de la API con Opus 4.8 en todo el
// módulo de licitaciones; el 7-oct Carlos pidió aplicar las mismas eficiencias
// a TODO MIRA. La generación actual es más barata y mejor:
//   · Opus 5.5 (4 $/20 $ por millón, caché a 0,20 $) frente a Opus 4.8 (5/25, caché 0,50)
//   · Sonnet 5.5 (2 $/10 $) frente a Sonnet 4.6 (3/15)
// Las dos traen pensamiento adaptativo SIEMPRE encendido (no se puede apagar
// en Opus 5.5) y rechazan el tool_choice forzado: por eso la extracción de
// correos pasó a salida estructurada (output_config.format) y la síntesis de
// Drive a tool_choice auto. El pensamiento cuenta en max_tokens, así que
// createMessageForClient (lib/anthropic-client.ts) aplica `prepararParams`:
// duplica el techo en los modelos que piensan, añade el esfuerzo por defecto
// y va en streaming por dentro. Las rutas que llaman al SDK directamente
// (stream) usan `ajustesModelo` y `techoSalida` a mano.
//
// Con pensamiento, el PRIMER bloque de la respuesta ya no es el texto: leer
// `content[0].text` devuelve undefined en silencio. Usar `primerTexto` / `textoDe`.
//
// Si un modelo da problemas en producción, se vuelve al anterior cambiando la
// variable en Vercel, sin desplegar.

/** Generación de calidad (informes, memorias, documentos, chat de licitaciones). */
export const DEFAULT_MODEL = process.env.MIRA_MODEL || 'claude-opus-5-5'
/** Motores de licitaciones: el general salvo que se afine aparte. */
export const TENDER_MODEL = process.env.TENDER_MODEL || DEFAULT_MODEL
/** Esfuerzo del pensamiento por defecto: medium es el punto medio calidad/coste; «high» para memorias finas. */
export const DEFAULT_EFFORT = (process.env.MIRA_EFFORT || 'medium') as Esfuerzo
export const TENDER_EFFORT = (process.env.TENDER_EFFORT || DEFAULT_EFFORT) as Esfuerzo
/** Tareas baratas: chats de agentes y del Cerebro, entrevistas por tool-use, puntuar concursos, clasificar. */
export const CHEAP_MODEL = process.env.CHEAP_MODEL || 'claude-sonnet-5-5'
/** Lo más barato y sin pensamiento: resúmenes de Drive, visión de adjuntos, puntuar leads. El id con fecha es el que ya corre en prod. */
export const FAST_MODEL = process.env.FAST_MODEL || 'claude-haiku-4-5-20251001'

export type Esfuerzo = 'low' | 'medium' | 'high' | 'xhigh' | 'max'

/** Los 5.x piensan siempre: el pensamiento consume parte de max_tokens y hay que dar más techo. */
export function modeloConPensamiento(model: string): boolean {
  return /claude-(opus|sonnet|fable|mythos)-5/.test(model)
}

/** Opus 4.8 y anteriores no admiten output_config.effort si el modelo no piensa; los 5.x sí. */
export function admiteEsfuerzo(model: string): boolean {
  return /claude-(opus|sonnet|fable|mythos)-(5|4-[78])/.test(model)
}

/**
 * Techo de salida según el modelo: en los que piensan, el presupuesto que se
 * pedía para el texto se duplica para que el razonamiento no se coma la
 * respuesta (una memoria cortada «parece» una memoria corta; un JSON cortado
 * «parece» un error del parser). Mínimo 4.000 en los que piensan: con 256 no
 * cabe ni el razonamiento más corto.
 */
export function techoSalida(model: string, textoTokens: number): number {
  if (!modeloConPensamiento(model)) return textoTokens
  return Math.min(Math.max(textoTokens * 2, 4000), 64_000)
}

/**
 * Parámetros extra de la petición según el modelo. El SDK 0.39 no tipa
 * output_config (es de 2026) pero lo manda tal cual al cuerpo: por eso el
 * resultado se fusiona con un cast en el punto de llamada.
 */
export function ajustesModelo(model: string, effort: Esfuerzo = DEFAULT_EFFORT): Record<string, unknown> {
  return admiteEsfuerzo(model) ? { output_config: { effort } } : {}
}

type ConOutputConfig = { output_config?: Record<string, unknown> }

/**
 * Lo que createMessageForClient aplica a TODAS las llamadas: techo de salida
 * para los modelos que piensan y esfuerzo por defecto si la ruta no lo fijó
 * (si ya trae output_config —formato estructurado, otro esfuerzo— se respeta y
 * solo se completa el esfuerzo que falte).
 */
export function prepararParams<T extends { model: string; max_tokens: number }>(params: T, effort: Esfuerzo = DEFAULT_EFFORT): T {
  const p = params as T & ConOutputConfig
  const out: T & ConOutputConfig = { ...p, max_tokens: techoSalida(p.model, p.max_tokens) }
  if (admiteEsfuerzo(p.model)) out.output_config = { effort, ...(p.output_config || {}) }
  return out
}

/** El primer bloque de TEXTO de una respuesta (los 5.x anteponen bloques de pensamiento). */
export function primerTexto(content: ReadonlyArray<Anthropic.ContentBlock>): Anthropic.TextBlock | undefined {
  return content.find((b): b is Anthropic.TextBlock => b.type === 'text')
}

/** Todo el texto de una respuesta, sin bloques de pensamiento ni de herramientas. */
export function textoDe(content: ReadonlyArray<Anthropic.ContentBlock>): string {
  return content.filter((b): b is Anthropic.TextBlock => b.type === 'text').map((b) => b.text).join('')
}
