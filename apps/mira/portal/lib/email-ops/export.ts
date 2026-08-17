// Export de tickets al formato del "Excel de trabajo operaciones": una fila por
// ticket, columnas = excelHeader del esquema + estado, prioridad, resumen,
// remitente del correo y fecha de recepción. exceljs por import dinámico
// (patrón lib/drive-sync.ts) para no cargarlo en rutas que no exportan.

import type { FieldDef, FieldValue } from './schema'
import type { TicketRow } from './types'

const STATUS_LABEL: Record<'es' | 'en', Record<string, string>> = {
  es: { open: 'Abierto', closed: 'Cerrado', discarded: 'Descartado' },
  en: { open: 'Open', closed: 'Closed', discarded: 'Discarded' },
}

function extraHeaders(locale: 'es' | 'en'): string[] {
  return locale === 'es'
    ? ['Estado', 'Prioridad', 'Resumen', 'Departamento', 'Correo de', 'Recibido', 'Ticket']
    : ['Status', 'Priority', 'Summary', 'Department', 'From', 'Received', 'Ticket']
}

function cell(v: FieldValue | undefined): string | number {
  if (v === null || v === undefined) return ''
  return v
}

export function ticketRows(tickets: TicketRow[], schema: readonly FieldDef[], locale: 'es' | 'en'): (string | number)[][] {
  const header = [...schema.map((f) => f.excelHeader), ...extraHeaders(locale)]
  const rows = tickets.map((t) => [
    ...schema.map((f) => cell(t.fields?.[f.key])),
    STATUS_LABEL[locale][t.status] || t.status,
    Number(t.priority) || 0,
    t.summary || '',
    t.department || '',
    t.from_address || '',
    t.first_message_at ? new Date(t.first_message_at).toISOString().replace('T', ' ').slice(0, 16) : '',
    t.id,
  ])
  return [header, ...rows]
}

export function ticketsToCsv(tickets: TicketRow[], schema: readonly FieldDef[], locale: 'es' | 'en'): string {
  const esc = (v: string | number) => {
    const s = String(v)
    return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  return ticketRows(tickets, schema, locale).map((r) => r.map(esc).join(';')).join('\r\n')
}

export async function buildTicketsWorkbook(tickets: TicketRow[], schema: readonly FieldDef[], locale: 'es' | 'en'): Promise<Buffer> {
  const ExcelJS = await import('exceljs')
  const wb = new ExcelJS.Workbook()
  wb.creator = 'MIRA Email Ops'
  const ws = wb.addWorksheet(locale === 'es' ? 'Operaciones' : 'Operations')
  const rows = ticketRows(tickets, schema, locale)
  ws.addRows(rows)
  ws.getRow(1).font = { bold: true }
  ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFEFEF' } }
  ws.views = [{ state: 'frozen', ySplit: 1 }]
  ws.columns.forEach((col, i) => {
    let max = 10
    for (const r of rows) {
      const len = String(r[i] ?? '').length
      if (len > max) max = Math.min(60, len)
    }
    col.width = max + 2
  })
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: rows[0].length } }
  const out = await wb.xlsx.writeBuffer()
  return Buffer.from(out as ArrayBuffer)
}
