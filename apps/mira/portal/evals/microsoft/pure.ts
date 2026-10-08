/**
 * Pruebas puras (sin red, sin BD) del conector Microsoft 365: codificación de
 * enlaces compartidos, lectura del id_token, rutas relativas, inventario,
 * conversión de mensajes de Graph al correo que entiende Email Ops y claves
 * de idempotencia.
 *
 *   npx tsx evals/microsoft/pure.ts
 */
import {
  encodeShareUrl, decodeIdToken, relativePath, folderPathOf, looksLikeMicrosoftLink,
  scopesFor, hasScopesFor, headersToRecord, formatRecipient, authorizeUrl, adminConsentUrl,
} from '../../lib/microsoft/graph'
import { construirInventario, contentHashOf } from '../../lib/microsoft/sync'
import { graphMessageId, parseGraphMessageId, toReceived, attachmentMetasOf } from '../../lib/microsoft/mail'
import { mimeFromFileName, isReadableMime, extensionOf, parseCsv, rowsToLabelledText } from '../../lib/extract-text'

let failures = 0
function check(name: string, cond: boolean, detail?: unknown) {
  if (cond) console.log(`✅ ${name}`)
  else { failures++; console.log(`❌ ${name}`, detail !== undefined ? JSON.stringify(detail) : '') }
}

// ── enlaces compartidos ──────────────────────────────────────────────────
const share = encodeShareUrl('https://contoso.sharepoint.com/sites/Comercial/Documentos/Clientes?web=1')
check('encodeShareUrl empieza por u!', share.startsWith('u!'))
check('encodeShareUrl es base64url sin relleno', !/[+/=]/.test(share.slice(2)))
check('encodeShareUrl reversible', Buffer.from(share.slice(2).replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString() === 'https://contoso.sharepoint.com/sites/Comercial/Documentos/Clientes?web=1')
check('looksLikeMicrosoftLink sharepoint', looksLikeMicrosoftLink('https://aldea.sharepoint.com/sites/x/Shared%20Documents/Forms/AllItems.aspx'))
check('looksLikeMicrosoftLink 1drv', looksLikeMicrosoftLink('https://1drv.ms/f/s!AbCd'))
check('looksLikeMicrosoftLink rechaza Drive', !looksLikeMicrosoftLink('https://drive.google.com/drive/folders/abc'))

// ── id_token ─────────────────────────────────────────────────────────────
const payload = Buffer.from(JSON.stringify({ tid: 'tenant-1', oid: 'user-1', preferred_username: 'local@albasanzexpress.es', name: 'Local Albasanz' })).toString('base64url')
const claims = decodeIdToken(`header.${payload}.sig`)
check('decodeIdToken lee tid/upn/name', claims.tid === 'tenant-1' && claims.preferredUsername === 'local@albasanzexpress.es' && claims.name === 'Local Albasanz')
check('decodeIdToken tolera basura', decodeIdToken('no-es-un-jwt').tid === null && decodeIdToken(null).preferredUsername === null)

// ── permisos ─────────────────────────────────────────────────────────────
check('scopesFor files incluye Files.Read.All y no Mail.Read', scopesFor('files').includes('Files.Read.All') && !scopesFor('files').includes('Mail.Read'))
check('scopesFor mail incluye Mail.Read y offline_access', scopesFor('mail').includes('Mail.Read') && scopesFor('mail').includes('offline_access'))
check('hasScopesFor con prefijo de Graph', hasScopesFor(['https://graph.microsoft.com/Mail.Read', 'openid'], 'mail'))
check('hasScopesFor falta', !hasScopesFor(['Files.Read.All'], 'mail'))
const cfg = { clientId: 'app', clientSecret: 's', redirectUri: 'https://mira.startupsfactory.es/api/integrations/microsoft/callback' }
const auth = new URL(authorizeUrl({ config: cfg, state: 'st', codeChallenge: 'ch', scopes: scopesFor('files') }))
check('authorizeUrl usa organizations + PKCE S256', auth.pathname.startsWith('/organizations/') && auth.searchParams.get('code_challenge_method') === 'S256' && auth.searchParams.get('state') === 'st')
const single = new URL(authorizeUrl({ config: { ...cfg, tenantId: 'tenant-albasanz' }, state: 'st', codeChallenge: 'ch', scopes: scopesFor('mail') }))
check('authorizeUrl con MS_TENANT_ID habla con el inquilino del cliente', single.pathname.startsWith('/tenant-albasanz/oauth2/v2.0/authorize'))
const consent = new URL(adminConsentUrl(cfg, scopesFor('mail'), 'st'))
check('adminConsentUrl lleva scope con prefijo y sin openid', consent.searchParams.get('scope')!.includes('https://graph.microsoft.com/Mail.Read') && !consent.searchParams.get('scope')!.includes('openid'))

// ── rutas ────────────────────────────────────────────────────────────────
const rootPath = '/drive/root:/Comercial'
check('relativePath dentro de la carpeta', relativePath({ name: 'Oferta 2025.docx', parentReference: { path: '/drive/root:/Comercial/Clientes/ACME' } }, rootPath) === 'Clientes/ACME/Oferta 2025.docx')
check('relativePath en la raíz conectada', relativePath({ name: 'Tarifas.xlsx', parentReference: { path: '/drive/root:/Comercial' } }, rootPath) === 'Tarifas.xlsx')
check('relativePath con espacios codificados', relativePath({ name: 'a.pdf', parentReference: { path: '/drive/root:/Comercial/Clientes/Museo%20Reina%20Sof%C3%ADa' } }, rootPath) === 'Clientes/Museo Reina Sofía/a.pdf')
check('relativePath sin rootPath cae a root:', relativePath({ name: 'a.pdf', parentReference: { path: '/drives/b!x/root:/X/Y' } }, null) === 'X/Y/a.pdf')
check('folderPathOf', folderPathOf({ id: '1', name: 'Comercial', parentReference: { path: '/drive/root:' } }) === '/drive/root:/Comercial')
check('folderPathOf raíz', folderPathOf({ id: 'root', name: 'root', root: {} }) === '/drive/root:')

// ── MIME ─────────────────────────────────────────────────────────────────
check('mimeFromFileName docx con octet-stream', mimeFromFileName('Oferta.DOCX', 'application/octet-stream') === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
check('mimeFromFileName eml', mimeFromFileName('correo.eml') === 'message/rfc822' && isReadableMime('message/rfc822'))
check('mimeFromFileName msg no legible', !isReadableMime(mimeFromFileName('correo.msg')))
check('extensionOf', extensionOf('a.b.PDF') === 'pdf' && extensionOf('sinext') === '')
check('parseCsv respeta comillas', parseCsv('a,b\n"1,290",x').length === 2 && parseCsv('a,b\n"1,290",x')[1][0] === '1,290')
check('rowsToLabelledText etiqueta', rowsToLabelledText([['Cliente', 'Precio'], ['ACME', '12']]).includes('Cliente: ACME | Precio: 12'))

// ── inventario ───────────────────────────────────────────────────────────
const inv = construirInventario([
  { path: 'Clientes/ACME/Oferta 2024.docx', name: 'Oferta 2024.docx', isFolder: false, size: 1000, modified: '2024-03-01T00:00:00Z', mime: mimeFromFileName('Oferta 2024.docx') },
  { path: 'Clientes/ACME/Tarifa.xls', name: 'Tarifa.xls', isFolder: false, size: 500, modified: '2019-01-01T00:00:00Z', mime: mimeFromFileName('Tarifa.xls') },
  { path: 'Clientes/Beta/Contrato.pdf', name: 'Contrato.pdf', isFolder: false, size: 2000, modified: '2025-06-01T00:00:00Z', mime: 'application/pdf' },
  { path: 'Clientes', name: 'Clientes', isFolder: true, size: 0, modified: null, mime: 'folder' },
  { path: 'Clientes/ACME', name: 'ACME', isFolder: true, size: 0, modified: null, mime: 'folder' },
], new Date('2026-10-08T00:00:00Z'))
check('inventario cuenta ficheros y carpetas', inv.files === 3 && inv.folders === 2)
check('inventario legibles y antiguos', inv.readable === 2 && inv.legacy === 1)
check('inventario por año', inv.by_year['2024'] === 1 && inv.by_year['2019'] === 1 && inv.by_year['2025'] === 1)
check('inventario top_folders', inv.top_folders[0].name === 'Clientes' && inv.top_folders[0].files === 3)
check('inventario rango', inv.oldest === '2019-01-01T00:00:00Z' && inv.newest === '2025-06-01T00:00:00Z')
check('inventario bytes', inv.total_bytes === 3500)

// ── huella ───────────────────────────────────────────────────────────────
const h1 = contentHashOf({ id: '1', name: 'a', file: { hashes: { quickXorHash: 'Q==' } }, cTag: 'c1' })
const h2 = contentHashOf({ id: '1', name: 'a', file: { hashes: { quickXorHash: 'Q==' } }, cTag: 'c2' })
const h3 = contentHashOf({ id: '1', name: 'a', cTag: 'c2' })
check('contentHashOf manda el quickXorHash sobre el cTag', h1 === h2 && h1 !== h3 && !!h1)
check('contentHashOf sin nada → null', contentHashOf({ id: '1', name: 'a' }) === null)

// ── correo ───────────────────────────────────────────────────────────────
const id = graphMessageId('inbox-1', 'AAMkAGI2=')
check('graphMessageId/parse', JSON.stringify(parseGraphMessageId(id)) === JSON.stringify({ inboxId: 'inbox-1', messageId: 'AAMkAGI2=' }))
check('parseGraphMessageId rechaza imap/resend', parseGraphMessageId('imap:x:1') === null && parseGraphMessageId('re_abc') === null)
const received = toReceived({
  id: 'm1', subject: 'RECOGEME EL DÍA 2026/10/08', internetMessageId: '<abc@outlook.com>', conversationId: 'conv1', hasAttachments: true,
  from: { emailAddress: { name: 'María Funes', address: 'maria@museo.es' } },
  toRecipients: [{ emailAddress: { address: 'local@albasanzexpress.es' } }],
  ccRecipients: [{ emailAddress: { name: 'Ops', address: 'ops@albasanzexpress.es' } }],
  body: { contentType: 'text', content: 'Hola, recoged 3 bultos mañana.' }, receivedDateTime: '2026-10-08T07:00:00Z',
}, { 'in-reply-to': '<prev@x>', references: '<a@x> <b@x>' }, attachmentMetasOf([
  { id: 'att1', name: 'albaran.pdf', contentType: 'application/pdf', size: 10 },
  { id: 'att2', name: 'logo.png', contentType: 'image/png', size: 5, isInline: true },
]))
check('toReceived texto plano', received.text === 'Hola, recoged 3 bultos mañana.' && received.html === '')
check('toReceived remitente con nombre', received.from === 'María Funes <maria@museo.es>' && formatRecipient({ emailAddress: { address: 'x@y.es', name: 'x@y.es' } }) === 'x@y.es')
check('toReceived destinatarios', received.to[0] === 'local@albasanzexpress.es' && received.cc[0] === 'Ops <ops@albasanzexpress.es>')
check('toReceived cabeceras de hilo', received.headers['in-reply-to'] === '<prev@x>' && received.headers.references === '<a@x> <b@x>' && received.messageId === '<abc@outlook.com>')
check('toReceived adjuntos sin inline', received.attachments.length === 1 && received.attachments[0].id === 'att1' && received.attachments[0].content_type === 'application/pdf')
const html = toReceived({ id: 'm2', body: { contentType: 'html', content: '<p>Hola</p>' } }, {}, [])
check('toReceived html va a html', html.html === '<p>Hola</p>' && html.text === '')
check('headersToRecord junta repetidas', headersToRecord([{ name: 'References', value: '<a>' }, { name: 'references', value: '<b>' }]).references === '<a> <b>')

console.log(failures ? `\n${failures} fallos` : '\nTodo correcto')
process.exit(failures ? 1 : 0)
