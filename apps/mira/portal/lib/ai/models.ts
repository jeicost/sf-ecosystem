// Modelos de MIRA, en un solo sitio y con variable de entorno por delante.
//
// 6-oct-2026: el 5-oct se agotó el saldo de la API con Opus 4.8 en todo el
// módulo de licitaciones. La generación actual es más barata y mejor:
//   · Opus 5.5 (4 $/20 $ por millón, caché a 0,20 $) frente a Opus 4.8 (5/25, caché 0,50)
//   · Sonnet 5.5 (2 $/10 $) frente a Sonnet 4.6 (3/15)
// Las dos traen pensamiento adaptativo SIEMPRE encendido (no se puede apagar
// en Opus 5.5) y rechazan el tool_choice forzado: por eso la extracción de
// correos pasó a salida estructurada (output_config.format). El pensamiento
// cuenta en max_tokens, así que las llamadas que piden JSON largo llevan más
// techo y van en streaming (createMessageForClient lo hace por dentro).
//
// Si un modelo da problemas en producción, se vuelve al anterior cambiando la
// variable en Vercel, sin desplegar.

/** Motores de licitaciones (memoria, oferta, documento, libre, chat). */
export const TENDER_MODEL = process.env.TENDER_MODEL || 'claude-opus-5-5'
/** Esfuerzo del pensamiento en licitaciones: medium es el punto medio calidad/coste; «high» para memorias finas. */
export const TENDER_EFFORT = (process.env.TENDER_EFFORT || 'medium') as Esfuerzo
/** Tareas baratas y en lote (puntuar concursos del radar, clasificar). */
export const CHEAP_MODEL = process.env.CHEAP_MODEL || 'claude-sonnet-5-5'

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
 * respuesta (una memoria cortada «parece» una memoria corta).
 */
export function techoSalida(model: string, textoTokens: number): number {
  return modeloConPensamiento(model) ? Math.min(textoTokens * 2, 64_000) : textoTokens
}

/**
 * Parámetros extra de la petición según el modelo. El SDK 0.39 no tipa
 * output_config (es de 2026) pero lo manda tal cual al cuerpo: por eso el
 * resultado se fusiona con un cast en el punto de llamada.
 */
export function ajustesModelo(model: string, effort: Esfuerzo = TENDER_EFFORT): Record<string, unknown> {
  return admiteEsfuerzo(model) ? { output_config: { effort } } : {}
}
