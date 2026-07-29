// Visual Production Foundation — feature flag, APAGADO por defecto.
// Namespaciado aparte del legacy lib/generation/feature-flags.ts (muerto,
// pendiente de borrado en la limpieza P4) para que no haya colisión.

export function isVisualProductionEnabled(): boolean {
  return process.env.VISUAL_PRODUCTION_ENABLED === '1'
}
