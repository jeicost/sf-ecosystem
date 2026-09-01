import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'node:crypto'

// Cifrado de secretos de cliente en reposo (BYO API keys en tool_connections).
// F1 de la auditoría 2026-08-10: las keys de Anthropic/OpenAI/Apollo/Hunter de
// terceros se guardaban en CLARO. Se cifra ahora porque hay 0 keys en uso
// (mira_usage_log): la ventana en la que cifrar no exige migrar nada.
//
// AES-256-GCM (cifrado + autenticación). Formato del valor almacenado:
//   enc:v1:<iv_b64>:<authTag_b64>:<ciphertext_b64>
// Cualquier valor SIN ese prefijo se trata como texto plano legacy y se
// devuelve tal cual — así el sistema nunca se rompe durante la transición.

const PREFIX = 'enc:v1:'

/**
 * Clave de 32 bytes desde MIRA_ENCRYPTION_KEY (hex de 64 chars, base64, o
 * cualquier cadena — en el último caso se deriva por SHA-256). Devuelve null
 * si no hay clave configurada: entonces el cifrado es un passthrough (dev).
 */
function getKey(): Buffer | null {
  const raw = process.env.MIRA_ENCRYPTION_KEY
  if (!raw) return null
  if (/^[0-9a-f]{64}$/i.test(raw)) return Buffer.from(raw, 'hex')
  try {
    const b64 = Buffer.from(raw, 'base64')
    if (b64.length === 32) return b64
  } catch { /* no era base64 */ }
  // Cualquier otra cosa: derivar 32 bytes deterministas por hash.
  return createHash('sha256').update(raw).digest()
}

export function isEncryptionConfigured(): boolean {
  return getKey() !== null
}

export function isEncrypted(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.startsWith(PREFIX)
}

/**
 * Cifra un secreto. Sin clave configurada: en producción LANZA (fail-closed);
 * en dev devuelve el texto plano avisando, para no bloquear el trabajo local.
 */
export function encryptSecret(plaintext: string): string {
  const key = getKey()
  if (!key) {
    // Guardar la API key de un cliente EN CLARO con solo un console.warn era
    // un incidente esperando a ocurrir: nadie lee los logs de Vercel y el
    // cliente cree que su clave está protegida. Mejor un 500 visible que un
    // secreto expuesto en silencio (auditoría go-live 01-sep).
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'MIRA_ENCRYPTION_KEY is not configured — refusing to store a client secret unencrypted'
      )
    }
    console.warn('MIRA_ENCRYPTION_KEY no configurada: el secreto se guarda sin cifrar (solo dev)')
    return plaintext
  }
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const ct = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${PREFIX}${iv.toString('base64')}:${tag.toString('base64')}:${ct.toString('base64')}`
}

/**
 * Descifra un valor. Si no lleva el prefijo, es texto plano legacy y se
 * devuelve intacto. Si el descifrado falla (clave equivocada, dato corrupto),
 * devuelve null — nunca lanza.
 */
export function decryptSecret(value: string | null | undefined): string | null {
  if (!value) return null
  if (!value.startsWith(PREFIX)) return value // texto plano legacy
  const key = getKey()
  if (!key) {
    console.error('Valor cifrado pero MIRA_ENCRYPTION_KEY no está configurada')
    return null
  }
  try {
    const [ivB64, tagB64, ctB64] = value.slice(PREFIX.length).split(':')
    const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(ivB64, 'base64'))
    decipher.setAuthTag(Buffer.from(tagB64, 'base64'))
    const pt = Buffer.concat([decipher.update(Buffer.from(ctB64, 'base64')), decipher.final()])
    return pt.toString('utf8')
  } catch (e) {
    console.error('Fallo al descifrar el secreto:', e instanceof Error ? e.message : e)
    return null
  }
}
