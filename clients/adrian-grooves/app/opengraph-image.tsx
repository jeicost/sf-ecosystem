import { ImageResponse } from 'next/og'
import { site } from '@/lib/site'

/**
 * La imagen que sale al compartir la página (WhatsApp, Instagram, anuncios).
 *
 * Existe porque la anterior no existía: los metadatos apuntaban a
 * `/og-default.jpg`, un fichero que nunca se subió, así que cada enlace salía
 * sin foto y nada avisaba — la etiqueta estaba bien formada, el 404 no se veía.
 * Se genera en build con la misma paleta de la web; cuando haya un fotograma
 * real de Adrian en rodaje, lo mejor es sustituir esto por esa foto.
 */
export const alt = `${site.name} — Haz vídeos que parecen profesionales con el equipo que ya tienes`
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#131313',
          padding: '64px 72px',
          color: '#ffffff',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 24, letterSpacing: 6, color: '#7cff6b' }}>
          <div style={{ width: 14, height: 14, borderRadius: 7, background: '#7cff6b' }} />
          {`REC · ${site.name.toUpperCase()} · FILMMAKER`}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', fontSize: 76, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2 }}>
            <span>Haz vídeos que parecen&nbsp;</span>
            <span style={{ color: '#7cff6b' }}>profesionales</span>
          </div>
          <div style={{ display: 'flex', marginTop: 22, fontSize: 36, color: '#b3b3b3' }}>
            con el móvil o la cámara que ya tienes
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '2px solid #2c2e2c',
            paddingTop: 26,
            fontSize: 24,
            color: '#b3b3b3',
          }}
        >
          <span>{`Videoclips para ${site.artists.join(' · ')}`}</span>
          <span style={{ color: '#7cff6b' }}>{`Curso online · ${site.price} €`}</span>
        </div>
      </div>
    ),
    { ...size },
  )
}
