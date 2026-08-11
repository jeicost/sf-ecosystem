import { adminClient } from '@/lib/supabase'

// Few-shot dinámico (Pilar 2.2 del plan del asesor — "la técnica de mayor
// impacto en 'suena a mí'"). Ahora es posible gracias al raíl: usamos como
// ejemplos el contenido que el cliente APROBÓ TAL CUAL, sin editar una palabra
// (status 'approved', NO 'approved_with_edits' — ese significa que tuvo que
// corregirlo). El Brand Brain dice cómo debe sonar; estos ejemplos lo
// DEMUESTRAN con piezas reales que el propio cliente firmó. Se auto-mejora:
// cuanto más aprueba sin tocar, mejor genera.
export async function getApprovedExamplesBlock(clientId: string): Promise<string> {
  try {
    const admin = adminClient()
    const { data, error } = await admin
      .from('approval_queue')
      .select('platform, copy')
      .eq('client_id', clientId)
      .eq('status', 'approved')
      .order('reviewed_at', { ascending: false })
      .limit(3)
    if (error || !data?.length) return ''
    const samples = data
      .map((r) => {
        // Quitar el prefijo [Pilar: ...] que materialize embebe en el copy.
        const s = String(r.copy ?? '').replace(/^\[Pilar:[^\]]*\]\s*/, '').trim().slice(0, 240)
        return s ? `- [${r.platform ?? 'post'}] "${s}"` : null
      })
      .filter(Boolean)
    if (!samples.length) return ''
    return `APPROVED AS-IS BY THIS CLIENT (match this exact voice and level — they signed off on these without changing a word):\n${samples.join('\n')}`
  } catch {
    return ''
  }
}
