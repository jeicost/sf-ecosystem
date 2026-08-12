// Cabeceras de caché para las rutas públicas de la API.
//
// EL FALLO QUE ARREGLA (encontrado 2026-08-12, corregido 2026-08-13):
// las cuatro rutas de /api/public devolvían `Cache-Control: public, s-maxage=60`.
// La red de Vercel guarda una respuesta compartida indexada POR URL, y la
// `x-api-key` viaja en una CABECERA, que no entra en esa clave. Resultado: en
// cuanto un cliente legítimo pedía una página, durante los 60 segundos
// siguientes cualquiera que acertara la URL —y el slug del proyecto se
// adivina— recibía el contenido SIN presentar ninguna clave. La comprobación
// de `verifyProjectApiKey` seguía ahí y era correcta; simplemente no llegaba a
// ejecutarse, porque la respuesta salía de la caché antes.
//
// Arreglo: la caché deja de ser COMPARTIDA y pasa a ser del navegador que sí
// se autenticó (`private`). Se mantiene `max-age` para que un cliente que pide
// varias páginas seguidas no machaque la API, pero ya no hay copia en la CDN
// que servir a un tercero.
//
// `Vary: x-api-key` va además como segunda barrera: si algún intermediario sí
// respeta Vary, indexará por clave en vez de solo por URL. No se confía en
// ello —de ahí `private`—, pero es correcto declararlo.
//
// Coste real de rendimiento: ninguno digno de mención. Las rutas ya son
// `force-dynamic`, así que la función se ejecutaba en cada petición de todas
// formas, y las landings hornean el contenido en tiempo de BUILD: esta API no
// está en el camino caliente de ningún visitante.

/** Respuesta que depende de la api-key: caché solo en el cliente que la presentó. */
export function privateCache(seconds: number): Record<string, string> {
  return {
    'Cache-Control': `private, max-age=${seconds}, stale-while-revalidate=${seconds * 5}`,
    Vary: 'x-api-key',
    'Content-Type': 'application/json',
  }
}

/** Borradores y vistas previas: nunca se guardan en ningún sitio. */
export function noCache(): Record<string, string> {
  return {
    'Cache-Control': 'private, no-store',
    Vary: 'x-api-key, x-preview-secret',
    'Content-Type': 'application/json',
  }
}
