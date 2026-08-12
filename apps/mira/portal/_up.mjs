import { google } from 'googleapis'
import { readFileSync } from 'fs'
const key = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY)
const auth = new google.auth.JWT({ email: key.client_email, key: key.private_key, scopes: ['https://www.googleapis.com/auth/drive'] })
const drive = google.drive({ version: 'v3', auth })
const FOLDER = '1gM6bJppTpkH_Q_8LROeXf8eVJiwa-sBD'
const DIR = '/private/tmp/claude-501/-Users-carlosjacoste/f7fd55ea-7d6b-458b-ba4e-ddb2fa8514f0/scratchpad/d360'
const DOCS = [
  ['destinos', '360 — Vertical Destinos (ayuntamientos, patronatos, DMO)'],
  ['alojamientos', '360 — Vertical Alojamientos (hoteles y apartamentos)'],
  ['agencias', '360 — Vertical Agencias y grupos'],
  ['demo', '360 — Proceso de demo y contacto'],
]
for (const [slug, name] of DOCS) {
  try {
    const body = readFileSync(`${DIR}/${slug}.txt`, 'utf8')
    const res = await drive.files.create({
      requestBody: { name, parents: [FOLDER], mimeType: 'application/vnd.google-apps.document' },
      media: { mimeType: 'text/plain', body },
      fields: 'id,name,size',
      supportsAllDrives: true,
    })
    console.log('✅', res.data.name, res.data.id)
  } catch (e) {
    console.log('❌', slug, '→', e.message.slice(0, 160))
  }
}
