'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * ─── POR QUÉ EXISTE ESTE HOOK ────────────────────────────────────────────
 *
 * Los campos de lista del portal estaban escritos con el patrón
 * "deriva el valor del textarea del dato ya parseado":
 *
 *     value={lista.join('\n')}
 *     onChange={(v) => setLista(v.split('\n').filter(l => l.trim()))}
 *
 * Eso hace que el textarea sea INEDITABLE en la práctica, y por tres motivos
 * distintos que se notan todos a la vez:
 *
 *  1. Pulsar Intro crea una línea vacía → `filter` la borra en el mismo
 *     keystroke → React vuelve a pintar el valor SIN el salto de línea. El
 *     usuario ve que "el Intro no hace nada". Es literalmente lo reportado
 *     en la checklist de QA y en las listas del onboarding.
 *  2. `map(s => s.trim())` recorta mientras escribes: no puedes teclear un
 *     espacio al final de una palabra, ni sangrar una línea.
 *  3. Cualquier normalización (ordenar, deduplicar, rellenar huecos) reescribe
 *     el texto bajo el cursor y lo manda al final.
 *
 * La solución es la estándar en editores: el control posee su propio BORRADOR
 * de texto y solo se re-siembra desde fuera cuando el valor externo cambia por
 * algo que NO fue este mismo control (carga inicial, un agente escribiendo en
 * el Brain, cambiar de cliente). Mientras tú escribes, nadie te toca el texto.
 */
export function useDraftSync<TExternal, TDraft>({
  external,
  toDraft,
  isSame,
}: {
  /** Valor que vive en el estado del padre */
  external: TExternal
  /** Cómo se siembra el borrador editable a partir del valor externo */
  toDraft: (external: TExternal) => TDraft
  /** Igualdad por contenido del valor externo (no por referencia) */
  isSame: (a: TExternal, b: TExternal) => boolean
}) {
  const [draft, setDraft] = useState<TDraft>(() => toDraft(external))

  // Lo último que ESTE control emitió hacia arriba. Si el `external` que llega
  // coincide, el cambio es nuestro propio eco y no hay que re-sembrar nada.
  const lastEmitted = useRef<TExternal | null>(null)
  // El último `external` ya procesado. Hace falta porque el padre construye el
  // valor derivado en su JSX (`lista.map(...)`), así que en CADA render del
  // padre llega un array nuevo por referencia aunque el contenido sea idéntico:
  // sin esta comparación por contenido, un render del padre por un motivo
  // cualquiera re-sembraría el borrador y te movería el cursor.
  const lastSeen = useRef<TExternal>(external)
  // Refs para no re-disparar el efecto cuando el padre pasa lambdas nuevas.
  const toDraftRef = useRef(toDraft)
  const isSameRef = useRef(isSame)
  toDraftRef.current = toDraft
  isSameRef.current = isSame

  useEffect(() => {
    if (isSameRef.current(lastSeen.current, external)) return
    lastSeen.current = external
    // Nuestro propio eco: el padre acaba de aplicar lo que emitimos.
    if (lastEmitted.current !== null && isSameRef.current(lastEmitted.current, external)) return
    // Cambio de verdad desde fuera (carga inicial, cambio de cliente, un agente
    // escribiendo en el Brain): ahí sí se re-siembra.
    lastEmitted.current = null
    setDraft(toDraftRef.current(external))
  }, [external])

  /** Marca lo que se acaba de emitir para reconocer el eco en el próximo render. */
  const markEmitted = (value: TExternal) => {
    lastEmitted.current = value
  }

  return { draft, setDraft, markEmitted }
}

export function sameStringList(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i])
}
