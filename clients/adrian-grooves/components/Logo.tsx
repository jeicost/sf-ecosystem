import Image from 'next/image'
import { site } from '@/lib/site'

/**
 * Brand lockup: the FG monogram (Adrian's existing logo, inverted to white
 * for the dark UI) + wordmark. Swap logo-grooves.jpg for a transparent SVG
 * when available. The wordmark says «Groves» (one o) since 22-sep-2026; the
 * file keeps its old name on purpose — it is an asset path, not copy.
 */
export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <Image
        src="/logo-grooves.jpg"
        alt={`${site.name} logo`}
        width={28}
        height={28}
        className="logo-invert h-7 w-7 object-contain"
        priority
      />
      {!compact && (
        <span
          className="text-[0.95rem] font-semibold uppercase tracking-[0.18em]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Adrian&nbsp;Groves
        </span>
      )}
    </span>
  )
}
