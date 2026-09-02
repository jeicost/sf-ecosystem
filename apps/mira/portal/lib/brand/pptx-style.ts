// Estilo de marca desde un .pptx de la empresa (nota del CEO, julio: «¿se
// puede pasar una presentación de la compañía y copiar el estilo?»).
//
// Un PPTX es un zip y su identidad visual vive en ppt/theme/theme1.xml:
// clrScheme (dk/lt/accent1..6) y fontScheme (majorFont=títulos,
// minorFont=cuerpo). Se parsea DETERMINISTA (regex sobre el XML, sin LLM):
// los valores son literales del fichero, no una interpretación.
//
// El resultado se mapea a los campos que ya usan el editor del Brain y los
// motores de export: visual_identity.typography.{heading_font,body_font} y
// visual_identity.colors.{primary,secondary,accent,neutral}.

import JSZip from 'jszip'

export interface ExtractedPptxStyle {
  themeName: string | null
  fonts: { heading: string | null; body: string | null }
  /** Mapeo directo a visual_identity.colors del Brain. */
  colors: { primary: string | null; secondary: string | null; accent: string | null; neutral: string | null }
  /** La paleta completa del tema, para enseñarla en la UI. */
  palette: Array<{ role: string; hex: string }>
  /** true si huele al tema Office de serie (Calibri + 4472C4): el deck
   *  probablemente no lleva la identidad real de la empresa. */
  looksLikeOfficeDefault: boolean
}

const COLOR_ROLES = ['dk1', 'lt1', 'dk2', 'lt2', 'accent1', 'accent2', 'accent3', 'accent4', 'accent5', 'accent6'] as const

function colorOf(themeXml: string, role: string): string | null {
  // <a:accent1><a:srgbClr val="E63B2E"/></a:accent1>  ó  <a:dk1><a:sysClr val="windowText" lastClr="000000"/></a:dk1>
  // Comillas simples o dobles: los PPTX reales llevan dobles, pero algún
  // generador exótico (y nuestros propios tests) usan simples.
  const block = themeXml.match(new RegExp(`<a:${role}>([\\s\\S]*?)</a:${role}>`))?.[1]
  if (!block) return null
  const hex =
    block.match(/srgbClr val=["']([0-9A-Fa-f]{6})["']/)?.[1] ??
    block.match(/lastClr=["']([0-9A-Fa-f]{6})["']/)?.[1]
  return hex ? `#${hex.toUpperCase()}` : null
}

function fontOf(themeXml: string, which: 'majorFont' | 'minorFont'): string | null {
  const block = themeXml.match(new RegExp(`<a:${which}>([\\s\\S]*?)</a:${which}>`))?.[1]
  const typeface = block?.match(/<a:latin[^>]*typeface=["']([^"']+)["']/)?.[1]?.trim()
  return typeface || null
}

export async function extractPptxStyle(buffer: Buffer): Promise<ExtractedPptxStyle> {
  const zip = await JSZip.loadAsync(buffer)
  // theme1 es el del primer slide master; si no está, el primero que haya.
  const themeFile =
    zip.file('ppt/theme/theme1.xml') ??
    zip.file(/^ppt\/theme\/theme\d+\.xml$/)[0]
  if (!themeFile) {
    throw new Error('This file has no theme (ppt/theme/*.xml) — is it a real .pptx?')
  }
  const xml = await themeFile.async('string')

  const themeName = xml.match(/<a:theme[^>]*name=["']([^"']*)["']/)?.[1] || null
  const heading = fontOf(xml, 'majorFont')
  const body = fontOf(xml, 'minorFont')

  const palette: Array<{ role: string; hex: string }> = []
  const byRole: Record<string, string | null> = {}
  for (const role of COLOR_ROLES) {
    const hex = colorOf(xml, role)
    byRole[role] = hex
    if (hex) palette.push({ role, hex })
  }

  const looksLikeOfficeDefault =
    (heading === 'Calibri Light' || heading === 'Calibri') && byRole.accent1 === '#4472C4'

  return {
    themeName,
    fonts: { heading, body },
    // accent1 es SIEMPRE el color protagonista del tema; dk2 suele ser el
    // neutro oscuro de texto secundario.
    colors: {
      primary: byRole.accent1,
      secondary: byRole.accent2,
      accent: byRole.accent3,
      neutral: byRole.dk2,
    },
    palette,
    looksLikeOfficeDefault,
  }
}
