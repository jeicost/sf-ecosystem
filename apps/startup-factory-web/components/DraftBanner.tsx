/**
 * Draft Mode indicator (EDUX-N4 preview). Deliberately styled as an
 * internal tool, not part of the site's brand — must never be mistaken for
 * real content by a client viewing a shared link. Only rendered when
 * draftMode().isEnabled is true.
 */
export function DraftBanner() {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        background: '#facc15',
        color: '#111',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: 14,
        fontWeight: 600,
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        flexWrap: 'wrap',
        boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
      }}
    >
      <span>🟡 Vista previa — este contenido puede no estar publicado</span>
      <a href="/api/disable-draft" style={{ color: '#111', textDecoration: 'underline', fontWeight: 700 }}>
        Salir de la vista previa
      </a>
    </div>
  )
}
