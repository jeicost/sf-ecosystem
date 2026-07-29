// Visual Production Foundation — helper puro de rutas de storage.
// Bucket PRIVADO (el handoff prohíbe público). Aislamiento por client_id
// resuelto server-side — nunca del body de la request.

export const VISUAL_PRODUCTION_BUCKET = 'generated-assets' // privado, signed URLs

export type VisualAssetFolder = 'inputs' | 'references' | 'candidates' | 'final' | 'exports'

function sanitize(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(-80) || 'file'
}

export function visualJobPath(
  clientId: string,
  jobId: string,
  folder: VisualAssetFolder,
  filename: string
): string {
  return `clients/${clientId}/visual-jobs/${jobId}/${folder}/${sanitize(filename)}`
}

export function brandModulePath(clientId: string, moduleId: string, filename: string): string {
  return `clients/${clientId}/visual-modules/${moduleId}/${sanitize(filename)}`
}
