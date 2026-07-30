// Shared response shape for every archetype Workspace-tab data source
// (lib/{oracle,analyst,explorer,architect,sentinel}-data.ts + Studio's
// lib/studio-references.ts). Explicit tri-state so a failed fetch and
// "genuinely no data yet" render as two different things in the UI --
// before this, a failed API call and zero real rows looked identical.
export type WorkspaceStatus<T> =
  | { status: 'ready'; data: T }
  | { status: 'empty' }
  | { status: 'error'; message: string }

export function workspaceError(message: string): WorkspaceStatus<never> {
  console.error('Archetype workspace data error:', message)
  return { status: 'error', message }
}
