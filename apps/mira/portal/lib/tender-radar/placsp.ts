// Radar de concursos v0 — lector del open data de la PLACSP (Plataforma de
// Contratación del Sector Público). Feed ATOM de sindicación con CODICE embebido,
// gratis y oficial. NO requiere ningún servicio de pago.
//
// Semántica del radar: surface de lo RECIENTE (concursos publicados en los últimos
// N días) cuyo CPV encaja con lo del cliente y cuyo plazo sigue abierto. No es una
// base de datos de "todo lo abierto" — es lo nuevo desde la última mirada, que es
// justo lo que un radar debe enseñar. El encaje real lo decide luego el Cerebro.
//
// El feed se pagina de 500 en 500 vía <link rel="next"> (cronológico por
// publicación). Caminamos hacia atrás hasta agotar páginas o superar la antigüedad.

const FEED_HEAD =
  'https://contrataciondelsectorpublico.gob.es/sindicacion/sindicacion_643/licitacionesPerfilesContratanteCompleto3.atom'

// CPV por defecto para mensajería / paquetería / transporte / servicios postales.
// Red amplia a propósito: el filtro fino de relevancia lo hace el scorer con el Cerebro.
export const DEFAULT_CPV_PREFIXES = ['641', '601', '6016', '6010', '795', '6413']

export interface RadarCandidate {
  id: string
  expediente: string
  title: string
  org: string
  cpv: string[]
  amount: number | null
  deadline: string | null // ISO
  statusCode: string
  link: string
  publishedAt: string | null // ISO
}

function decode(s: string): string {
  return s
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
    .replace(/\s+/g, ' ').trim()
}

// Tolerante a prefijo de namespace: <cbc:Foo>, <cbc-place-ext:Foo>, <Foo>.
function tag(name: string): RegExp {
  return new RegExp(`<(?:[\\w-]+:)?${name}[^>]*>([\\s\\S]*?)</(?:[\\w-]+:)?${name}>`, 'i')
}
function first(block: string, name: string): string | null {
  const m = block.match(tag(name))
  return m ? decode(m[1]) : null
}
function all(block: string, name: string): string[] {
  const re = new RegExp(`<(?:[\\w-]+:)?${name}[^>]*>([\\s\\S]*?)</(?:[\\w-]+:)?${name}>`, 'gi')
  const out: string[] = []
  let m: RegExpExecArray | null
  while ((m = re.exec(block))) out.push(decode(m[1]))
  return out
}

function parseEntry(xml: string): RadarCandidate | null {
  const title = first(xml, 'title')
  if (!title) return null

  // Órgano: dentro de LocatedContractingParty/Party/PartyName/Name
  const partyBlock = xml.match(/<(?:[\w-]+:)?PartyName>[\s\S]*?<\/(?:[\w-]+:)?PartyName>/i)?.[0] || ''
  const org = first(partyBlock, 'Name') || first(xml, 'Name') || ''

  // Plazo de presentación: dentro de TenderSubmissionDeadlinePeriod
  const dl = xml.match(/<(?:[\w-]+:)?TenderSubmissionDeadlinePeriod>[\s\S]*?<\/(?:[\w-]+:)?TenderSubmissionDeadlinePeriod>/i)?.[0] || ''
  const endDate = first(dl, 'EndDate')
  const endTime = first(dl, 'EndTime')
  const deadline = endDate ? `${endDate}T${(endTime || '23:59:59').slice(0, 8)}` : null

  // Enlace al detalle (primer <link href>)
  const link = xml.match(/<link[^>]*href="([^"]+)"/i)?.[1] || ''

  const amountRaw = first(xml, 'TaxExclusiveAmount') || first(xml, 'TotalAmount')
  const amount = amountRaw ? Number(amountRaw.replace(',', '.')) : null

  return {
    id: first(xml, 'ContractFolderID') || link || title.slice(0, 40),
    expediente: first(xml, 'ContractFolderID') || '',
    title,
    org,
    cpv: all(xml, 'ItemClassificationCode'),
    amount: Number.isFinite(amount as number) ? amount : null,
    deadline,
    statusCode: first(xml, 'ContractFolderStatusCode') || '',
    link: decode(link),
    publishedAt: first(xml, 'updated') || first(xml, 'published') || null,
  }
}

async function fetchPage(url: string, signal?: AbortSignal): Promise<{ entries: string[]; next: string | null }> {
  const res = await fetch(url, {
    signal,
    headers: { 'User-Agent': 'MIRA-radar/0.1 (licitaciones)', Accept: 'application/atom+xml, application/xml' },
  })
  if (!res.ok) throw new Error(`PLACSP ${res.status}`)
  const xml = await res.text()
  const entries = xml.match(/<entry>[\s\S]*?<\/entry>/gi) || []
  const next = xml.match(/<link[^>]*rel="next"[^>]*href="([^"]+)"/i)?.[1] || null
  return { entries, next: next ? decode(next) : null }
}

export interface RadarOptions {
  cpvPrefixes?: string[]
  maxPages?: number
  maxAgeDays?: number
  nowIso: string // inyectado (Date.now no está disponible en workflows; en API sí, pero mantenemos la firma explícita)
}

/** Camina el feed hacia atrás y devuelve los candidatos recientes, en CPV y con plazo abierto. */
export async function fetchPlacspCandidates(opts: RadarOptions): Promise<{ candidates: RadarCandidate[]; pagesRead: number; stopReason: string }> {
  const prefixes = opts.cpvPrefixes?.length ? opts.cpvPrefixes : DEFAULT_CPV_PREFIXES
  const maxPages = Math.min(opts.maxPages ?? 6, 12)
  const maxAgeDays = opts.maxAgeDays ?? 7
  const now = new Date(opts.nowIso).getTime()
  const minPublished = now - maxAgeDays * 86400_000

  const seen = new Set<string>()
  const candidates: RadarCandidate[] = []
  let url: string | null = FEED_HEAD
  let pagesRead = 0
  let stopReason = 'max-pages'

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 240_000)
  try {
    while (url && pagesRead < maxPages) {
      const { entries, next } = await fetchPage(url, controller.signal)
      pagesRead++
      let oldestOnPage = now
      for (const raw of entries) {
        const c = parseEntry(raw)
        if (!c) continue
        if (c.publishedAt) oldestOnPage = Math.min(oldestOnPage, new Date(c.publishedAt).getTime())
        if (seen.has(c.id)) continue
        seen.add(c.id)
        const cpvMatch = c.cpv.some((code) => prefixes.some((p) => code.startsWith(p)))
        if (!cpvMatch) continue
        const open = c.deadline ? new Date(c.deadline).getTime() > now : true // sin fecha → lo mostramos igual
        if (!open) continue
        candidates.push(c)
      }
      // Parada temprana: si esta página ya es más vieja que la ventana, no seguimos.
      if (oldestOnPage < minPublished) { stopReason = 'age-window'; break }
      url = next
      if (!url) stopReason = 'feed-end'
    }
  } finally {
    clearTimeout(timer)
  }

  // Orden: por plazo más próximo primero (los que urgen), sin fecha al final.
  candidates.sort((a, b) => {
    const da = a.deadline ? new Date(a.deadline).getTime() : Infinity
    const db = b.deadline ? new Date(b.deadline).getTime() : Infinity
    return da - db
  })
  return { candidates, pagesRead, stopReason }
}
