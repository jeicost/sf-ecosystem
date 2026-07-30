// lib/safe-lookup.ts
// Acceso seguro a catálogos declarados como objeto literal (AGENT_METADATA,
// PLAN_FEATURES, *_MAP, etc.) cuando la key viene de input no confiable (un
// parámetro de ruta dinámica, un campo de body/query). `key in objeto` y
// `objeto[key]` heredan de Object.prototype -- para keys como 'constructor',
// 'toString', '__proto__', 'valueOf', 'hasOwnProperty', 'isPrototypeOf',
// 'propertyIsEnumerable', 'toLocaleString', ambas formas devuelven la
// propiedad heredada (una función, truthy) en vez de undefined, saltándose
// cualquier guard tipo `if (!catalogo[key])`.
//
// Encontrado en producción 2026-07-30 (lib/department-meta.ts,
// lib/department-prompt.ts) y confirmado en una auditoría posterior en 8
// sitios más, incluida la ruta de chat más usada de la app
// (app/api/agent/route.ts) -- ver docs/DEBT.md.

/** Devuelve catalogo[key] solo si es una propiedad PROPIA del objeto; undefined en cualquier otro caso (incluidas las heredadas de Object.prototype). */
export function safeLookup<T>(catalogo: Record<string, T>, key: string): T | undefined {
  return Object.hasOwn(catalogo, key) ? catalogo[key] : undefined
}

/** Igual que safeLookup pero con un valor por defecto explícito en vez de undefined. */
export function safeLookupOr<T>(catalogo: Record<string, T>, key: string, fallback: T): T {
  return Object.hasOwn(catalogo, key) ? catalogo[key] : fallback
}

/** true solo si key es una propiedad PROPIA del objeto (reemplazo seguro de `key in objeto`). */
export function hasOwnKey(catalogo: Record<string, unknown>, key: string): boolean {
  return Object.hasOwn(catalogo, key)
}
