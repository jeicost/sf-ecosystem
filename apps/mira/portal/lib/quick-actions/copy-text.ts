// Render de un output de quick action a texto plano legible/copiable.
// Lo usan el botón Copiar, "Enviar a Aprobaciones" (extracción de copy para
// todos los tipos) y "Guardar en Documentos" (cuerpo del markdown).

function flatten(value: unknown, indent = ''): string[] {
  if (value == null) return []
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return [`${indent}${value}`]
  }
  if (Array.isArray(value)) {
    return value.flatMap((item) => {
      if (item && typeof item === 'object' && !Array.isArray(item)) {
        const inner = Object.entries(item)
          .filter(([, v]) => v != null && v !== '')
          .map(([k, v]) => `${prettyKey(k)}: ${typeof v === 'object' ? JSON.stringify(v) : v}`)
          .join(' · ')
        return [`${indent}- ${inner}`]
      }
      return [`${indent}- ${item}`]
    })
  }
  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>)
      .filter(([k, v]) => v != null && v !== '' && !INTERNAL_KEYS.has(k))
      .flatMap(([k, v]) => {
        if (typeof v === 'object') {
          return [`${indent}${prettyKey(k)}:`, ...flatten(v, indent + '  ')]
        }
        return [`${indent}${prettyKey(k)}: ${v}`]
      })
  }
  return []
}

const INTERNAL_KEYS = new Set(['image_path', 'image_error', 'attachments'])

function prettyKey(key: string): string {
  const s = key.replace(/_/g, ' ')
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function buildCopyText(outputType: string, out: Record<string, any>): string {
  if (!out || typeof out !== 'object') return String(out ?? '')

  switch (outputType) {
    case 'social_post': {
      const parts = [
        out.copy,
        Array.isArray(out.hashtags) && out.hashtags.length
          ? out.hashtags.map((h: string) => (h.startsWith('#') ? h : `#${h}`)).join(' ')
          : null,
        out.call_to_action,
      ]
      return parts.filter(Boolean).join('\n\n')
    }
    case 'newsletter': {
      const sections = Array.isArray(out.sections)
        ? out.sections.map((s: any) => [s?.title, s?.content, s?.cta].filter(Boolean).join('\n'))
        : []
      return [out.subject, out.preview_text, ...sections, out.footer].filter(Boolean).join('\n\n')
    }
    case 'video': {
      const scenes = Array.isArray(out.scene_breakdown)
        ? out.scene_breakdown.map((s: any) => `${s?.scene ?? ''}: ${s?.description ?? ''}`)
        : []
      return [out.title, out.objective, out.script, scenes.join('\n'), out.call_to_action]
        .filter(Boolean)
        .join('\n\n')
    }
    case 'image': {
      const parts = [
        out.post_copy ?? out.copy,
        Array.isArray(out.hashtags) && out.hashtags.length
          ? out.hashtags.map((h: string) => (h.startsWith('#') ? h : `#${h}`)).join(' ')
          : null,
        out.call_to_action,
      ]
      const text = parts.filter(Boolean).join('\n\n')
      return text || flatten(out).join('\n')
    }
    case 'text': {
      const parts = [out.subject, out.body ?? out.text ?? out.suggested_response]
      const text = parts.filter(Boolean).join('\n\n')
      return text || flatten(out).join('\n')
    }
    case 'structured':
    default:
      return flatten(out).join('\n')
  }
}
