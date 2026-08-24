/**
 * Canal mínimo entre el hilo y el composer del MISMO chat.
 *
 * Existe para que "editar mi último mensaje" funcione sin obligar a las 8
 * pantallas que montan un chat a cablear un ref o un estado extra: el hilo
 * publica el texto y el composer que comparte `chatKey` lo carga en el input,
 * con el cursor al final. Es lo que hace el lápiz de un mensaje en VS Code.
 */
type Listener = (text: string) => void

const listeners = new Map<string, Set<Listener>>()

export function onComposerLoad(key: string, fn: Listener): () => void {
  const set = listeners.get(key) ?? new Set<Listener>()
  set.add(fn)
  listeners.set(key, set)
  return () => { set.delete(fn) }
}

export function loadIntoComposer(key: string, text: string): void {
  listeners.get(key)?.forEach((fn) => fn(text))
}
