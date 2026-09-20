import type { Json } from '@/types/database.generated'

/**
 * Puente entre las columnas `jsonb` y el código que las usa.
 *
 * Desde que el cliente de servicio está tipado con el esquema real
 * (20-sep-2026), una columna jsonb llega como `Json` — que puede ser string,
 * número, booleano, array, objeto o null. El código casi siempre da por hecho
 * que es un objeto y hace `result_data.slides`. Esto lo convierte en una
 * comprobación de verdad en vez de un cast: si la fila trae otra cosa (o
 * null), se devuelve un objeto vacío en lugar de reventar al leer la
 * propiedad.
 */
export function jsonObject(value: Json | null | undefined): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

/** Igual, para columnas jsonb que guardan una lista. */
export function jsonArray(value: Json | null | undefined): unknown[] {
  return Array.isArray(value) ? (value as unknown[]) : []
}

/**
 * Valor de la app hacia una columna `jsonb`.
 *
 * `Record<string, unknown>` no es asignable a `Json` (un `unknown` podría ser
 * una función), aunque en la práctica todo lo que guardamos viene de JSON o va
 * a serializarse. El contrato es de runtime: si el valor no es serializable,
 * supabase-js falla al enviarlo. Esta función marca esos puntos de forma
 * explícita en vez de esparcir casts sueltos.
 */
export function toJson(value: unknown): Json {
  return value as Json
}

/**
 * Payload de escritura hacia una tabla tipada.
 *
 * Muchas rutas construyen el parche condicionalmente (`if (x) patch.y = z`),
 * lo que produce un `Record<string, unknown>` que el cliente tipado rechaza.
 * Esto deja pasar ese objeto SIN renunciar al resto de la consulta: tabla,
 * filtros y columnas del select siguen comprobados.
 *
 * Devuelve `never` (tipo fondo, asignable a cualquier parámetro) en vez de
 * `any`: no contamina el resultado de la consulta. No intentar convertirlo en
 * genérico `<T>` — el tipo condicional de supabase-js no propaga el contexto
 * y T se resuelve a `unknown`, que no compila.
 *
 * Es una vía de escape acotada: donde el parche sea fijo, escribirlo con el
 * tipo de la tabla (`Database['public']['Tables']['x']['Update']`) da mejor
 * protección — un nombre de columna mal escrito se ve al compilar.
 */
export function writable(patch: Record<string, unknown> | Record<string, unknown>[]): never {
  return patch as never
}
