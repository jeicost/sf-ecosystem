// Adapter: monthly-content-system → editorial Section[]
// Traduce al HTML editorial el diseño del deck mensual (lib/export/monthly-pptx.ts):
// portada con stats, pilares como tarjetas con DO/DON'T, tablero semanal por
// semana, prioridades numeradas, hero briefs con shot flow rodable, una tarjeta
// por caption (el activo principal — copy íntegro, nada de tabla de 10 columnas),
// calendario mensual de 7 columnas, idea bank con KPIs 30/60/90 y cierre honesto
// con open items + data gaps.
//
// Contrato defensivo: informes futuros pueden traer campos NUEVOS (el prompt
// está en ampliación en paralelo) y cualquier campo puede faltar o venir con un
// tipo inesperado. Regla: lo conocido se pinta con diseño, lo desconocido cae al
// tratamiento genérico, y ante cualquier dato raro la sección degrada — jamás
// rompe el informe entero. Las captions pueden venir en varios idiomas (EN+TH):
// el texto se respeta tal cual (esc + pre-wrap), la fuente hace fallback por
// glifo a la del sistema, que sí trae tailandés.

import type { Section, StatItem, CardItem, PhaseItem } from '../editorial-template'
import type { ToolAdapter } from './types'
import {
  asArr,
  asArrOrWrap,
  asNum,
  asObj,
  asStr,
  esc,
  genericSections,
  humanize,
  isPlainObject,
  sectionForValue,
} from './generic'

// ---------------------------------------------------------------------------
// Helpers de presentación (clases .mcs-* definidas en styleBlock)
// ---------------------------------------------------------------------------

/**
 * Estilos del adaptador, emitidos UNA vez dentro del contenido de la primera
 * sección (un <style> en <body> aplica a todo el documento). Solo clases con
 * prefijo mcs- para no pisar nada del template. Colores vía las variables del
 * template (--primary/--cream/--cream-dim/--cream-faint/--black) para que el
 * modo claro/oscuro funcione sin lógica extra; los fondos neutros usan un gris
 * translúcido que lee bien sobre ambos temas.
 */
function styleBlock(): string {
  return `<style>
  .mcs-chip { display:inline-block; font-family:'Space Mono',monospace; font-size:9px; letter-spacing:.12em; text-transform:uppercase; padding:4px 10px; border:1px solid var(--cream-faint); color:var(--cream-dim); margin:0 6px 6px 0; white-space:nowrap; }
  .mcs-chip-accent { background:var(--primary); border-color:var(--primary); color:var(--black); }
  .mcs-label { font-family:'Space Mono',monospace; font-size:9px; letter-spacing:.2em; color:var(--primary); text-transform:uppercase; margin:18px 0 6px; }
  .mcs-h { font-family:'Anton',sans-serif; font-size:20px; letter-spacing:.03em; color:var(--cream); text-transform:uppercase; margin:32px 0 14px; }
  .mcs-card { border:1px solid var(--cream-faint); border-left:3px solid var(--primary); background:rgba(128,128,128,0.05); padding:28px; margin-bottom:28px; }
  .mcs-card-hook { font-family:'Anton',sans-serif; font-size:clamp(18px,2.4vw,24px); line-height:1.15; color:var(--cream); margin:10px 0 4px; }
  .mcs-copy { white-space:pre-wrap; font-size:14px; line-height:1.85; color:var(--cream); }
  .mcs-muted { font-size:13px; line-height:1.7; color:var(--cream-dim); }
  .mcs-tags { font-family:'Space Mono',monospace; font-size:12px; color:var(--primary); line-height:1.8; word-break:break-word; }
  .mcs-do { border-left:3px solid #22C55E; background:rgba(34,197,94,0.08); padding:10px 14px; margin:12px 0 8px; font-size:12.5px; line-height:1.6; }
  .mcs-dont { border-left:3px solid #EF4444; background:rgba(239,68,68,0.08); padding:10px 14px; margin:0 0 12px; font-size:12.5px; line-height:1.6; }
  .mcs-note { border:1px solid var(--cream-faint); border-left:3px solid var(--primary); background:rgba(128,128,128,0.06); padding:16px 20px; margin:0 0 28px; font-size:13.5px; line-height:1.75; color:var(--cream-dim); }
  .mcs-note strong { color:var(--cream); }
  .mcs-warn { border-left:3px solid #EF4444; background:rgba(239,68,68,0.08); padding:10px 14px; margin:12px 0 0; font-size:12.5px; line-height:1.6; color:var(--cream); }
  .mcs-scroll { overflow-x:auto; max-width:100%; }
  .mcs-scroll table { margin-bottom:12px; }
  .mcs-cal { display:grid; grid-template-columns:repeat(7,1fr); gap:4px; min-width:640px; }
  .mcs-cal-h { font-family:'Space Mono',monospace; font-size:9px; letter-spacing:.15em; color:var(--cream-dim); text-transform:uppercase; text-align:center; padding:6px 0; }
  .mcs-cal-cell { min-height:76px; border:1px solid var(--cream-faint); padding:6px 7px; background:rgba(128,128,128,0.04); }
  .mcs-cal-on { border-color:var(--primary); background:rgba(128,128,128,0.09); }
  .mcs-cal-empty { opacity:.35; }
  .mcs-cal-day { font-family:'Space Mono',monospace; font-size:10px; color:var(--cream); margin-bottom:4px; }
  .mcs-cal-item { font-size:10px; line-height:1.35; color:var(--cream-dim); margin-bottom:3px; }
  .mcs-cal-hero { color:var(--primary); }
  .mcs-cal-more { font-size:9px; font-style:italic; color:var(--cream-dim); }
</style>`
}

function chip(text: unknown, kind: 'accent' | 'ghost' = 'ghost'): string {
  const t = asStr(text).trim()
  if (!t) return ''
  return `<span class="mcs-chip${kind === 'accent' ? ' mcs-chip-accent' : ''}">${esc(t)}</span>`
}

function miniLabel(text: string): string {
  return `<div class="mcs-label">${esc(text)}</div>`
}

/** Tabla dentro de contenido libre: hereda el CSS global del template, con scroll propio. */
function scrollTable(headers: string[], rows: string[][], minWidth = 560): string {
  if (!rows.length) return ''
  return `<div class="mcs-scroll"><table style="min-width:${minWidth}px;">
<thead><tr>${headers.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead>
<tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('\n')}</tbody>
</table></div>`
}

/** Texto compacto de una línea para celdas/chips (colapsa saltos, recorta). */
function clip(v: unknown, max: number): string {
  const t = asStr(v).replace(/\s+/g, ' ').trim()
  return t.length > max ? `${t.slice(0, max - 1)}…` : t
}

// Abreviaturas de plataforma para las celdas del calendario ("IN" por
// instagram confunde; "IG" es la abreviatura que usa la industria).
const PLATFORM_ABBR: Record<string, string> = {
  instagram: 'IG',
  tiktok: 'TT',
  facebook: 'FB',
  youtube: 'YT',
  linkedin: 'LI',
  twitter: 'X',
  x: 'X',
  threads: 'TH',
  pinterest: 'PIN',
}

function platformAbbr(v: unknown): string {
  const p = asStr(v).trim().toLowerCase()
  if (!p) return ''
  return PLATFORM_ABBR[p] ?? p.slice(0, 2).toUpperCase()
}

/** Quita el prefijo [JUDGEMENT]/[JUDGMENT] del texto (se marca con estilo propio). */
function stripJudgment(v: unknown): string {
  return asStr(v).replace(/^\s*\[JUDGE?MENT\]\s*/i, '').trim()
}

/** Caja de nota destacada con etiqueta propia (judgment calls, promo math). */
function noteBox(label: string, bodyHtml: string, extraStyle = ''): string {
  return `<div class="mcs-note"${extraStyle ? ` style="${extraStyle}"` : ''}><div class="mcs-label" style="margin-top:0;">${esc(label)}</div>${bodyHtml}</div>`
}

/** Estado del pilar como badge del template (verde=vivo, ámbar=propuesto). */
function pillarStatusBadge(status: unknown): string {
  const s = asStr(status).toUpperCase()
  if (!s) return ''
  if (s.includes('RUNNING')) return `<span class="badge badge-live">RUNNING</span>`
  if (s.includes('PROPOSED')) return `<span class="badge badge-progress">PROPOSED</span>`
  return `<span class="badge badge-pending">${esc(clip(s, 24))}</span>`
}

/**
 * Ejecuta un builder de sección; ante cualquier dato raro degrada esa clave al
 * tratamiento genérico (regla del contrato: degradar, nunca romper el informe).
 */
function safe(key: string, r: Record<string, any>, build: () => Section | null): Section | null {
  try {
    return build()
  } catch {
    try {
      return sectionForValue(key, r[key])
    } catch {
      return null
    }
  }
}

// ---------------------------------------------------------------------------
// Secciones
// ---------------------------------------------------------------------------

// 01 — El mes de un vistazo (month_label como título legible, jamás la fecha cruda)
function overviewSection(r: Record<string, any>): Section {
  const stats: StatItem[] = []
  const pillars = asArr(r.pillars)
  const captions = asArr(r.captions)
  const heroes = asArr(r.hero_briefs)
  if (pillars.length) stats.push({ value: String(pillars.length), label: 'Pillars' })
  if (captions.length) stats.push({ value: String(captions.length), label: 'Ready pieces' })
  if (heroes.length) stats.push({ value: String(heroes.length), label: 'Hero briefs' })

  const promo = asObj(r.promo_ratio)
  const contentPct = asNum(promo.content_pct)
  const promoPct = asNum(promo.promo_pct)
  if (contentPct !== null && promoPct !== null) {
    stats.push({ value: `${contentPct}/${promoPct}`, label: 'Content · Promo' })
  }

  let content = styleBlock()
  content += `<p><strong>How to use it:</strong> review the board and mark APPROVE / EDIT / PASS on every piece — nothing gets produced until it is green.</p>`
  const rule = stripJudgment(promo.rule)
  if (rule) content += `${miniLabel('Promo mix rule')}<p class="mcs-muted">${esc(rule)}</p>`

  // promo_ratio.computed: la aritmética antiesquivable — el ratio REAL contado
  // sobre las captions, junto al declarado. Ausente en informes previos.
  const computed = asObj(promo.computed)
  if (Object.keys(computed).length) {
    const promoC = asNum(computed.promo_captions)
    const totalC = asNum(computed.total_captions)
    const actual = asNum(computed.promo_pct_actual)
    const lines: string[] = []
    if (promoC !== null && totalC !== null) lines.push(`<strong>${promoC}</strong> of <strong>${totalC}</strong> captions are promo`)
    if (actual !== null) lines.push(`<strong>${actual}% actual</strong>${promoPct !== null ? ` vs ${promoPct}% declared` : ''}`)
    const days = asArrOrWrap(computed.promo_days).map((d) => asStr(d)).filter(Boolean)
    if (days.length) lines.push(`promo days: <strong>${days.map((d) => esc(d)).join(', ')}</strong>`)
    // días adyacentes: pueden venir como pares [17,18] o como valores sueltos
    const adjacent = asArrOrWrap(computed.adjacent_promo_days)
      .map((a) => (Array.isArray(a) ? a.map((x) => asStr(x)).filter(Boolean).join('–') : asStr(a)))
      .filter(Boolean)
    let body = `<p style="margin:0;">${lines.join(' &nbsp;·&nbsp; ') || '—'}</p>`
    if (adjacent.length) {
      body += `<div class="mcs-warn">⚠ Promos on adjacent days: ${adjacent.map((a) => esc(a)).join(' · ')} — breaks the "never two promos in a row" rule.</div>`
    }
    if (lines.length || adjacent.length) {
      content += noteBox('Promo math — computed, not declared', body, 'margin-top:20px;margin-bottom:0;')
    }
  }

  return {
    title: asStr(r.month_label) || asStr(r.month) || 'The Month',
    navLabel: 'Overview',
    subtitle: 'Monthly content system — everything on this board is a proposal until the client approves it.',
    stats: stats.length ? stats : undefined,
    content,
  }
}

// 02 — Marcador del mes anterior (approved/rejected/pending) + aprendizajes
function previousMonthSection(r: Record<string, any>): Section | null {
  const prev = asObj(r.previous_month_stats)
  const learnings = asArrOrWrap(r.previous_month_learnings)
    .map((l) => esc(asStr(l)))
    .filter(Boolean)
  if (!Object.keys(prev).length && !learnings.length) return null

  const stats: StatItem[] = []
  for (const [key, label] of [
    ['approved', 'Approved'],
    ['rejected', 'Rejected'],
    ['pending', 'Pending'],
  ] as const) {
    const n = asNum(prev[key])
    if (n !== null) stats.push({ value: String(n), label })
  }
  if (!stats.length && !learnings.length) return null
  return {
    title: 'Last Month Scoreboard',
    navLabel: 'Last Month',
    subtitle: 'What happened to the previous board — the system learns from every APPROVE and PASS.',
    stats: stats.length ? stats : undefined,
    listItems: learnings.length ? learnings : undefined,
  }
}

// 03 — Reparto de embudo con los 3 % bien visibles
function funnelSection(r: Record<string, any>): Section | null {
  const f = asObj(r.funnel_balance)
  if (!Object.keys(f).length) return null
  const stats: StatItem[] = []
  for (const [key, label] of [
    ['tofu_pct', 'TOFU · Discover'],
    ['mofu_pct', 'MOFU · Consider'],
    ['bofu_pct', 'BOFU · Convert'],
  ] as const) {
    const n = asNum(f[key])
    if (n !== null) stats.push({ value: `${n}%`, label })
  }
  const rationale = asStr(f.rationale)
  if (!stats.length && !rationale) return null
  return {
    title: 'Funnel Balance',
    navLabel: 'Funnel',
    stats: stats.length ? stats : undefined,
    content: rationale ? `<p>${esc(rationale)}</p>` : undefined,
  }
}

// 04 — Pilares como tarjetas: badge de estado, promesa, DO/DON'T, semillas
function pillarsSection(r: Record<string, any>): Section | null {
  const pillars = asArr(r.pillars).filter(isPlainObject)
  if (!pillars.length) return null
  const cards: CardItem[] = pillars.map((p, i): CardItem => {
    let body = `<div style="margin-bottom:10px;">${pillarStatusBadge(p.status)}${chip(p.funnel_role)}${chip(p.cadence)}</div>`
    const promise = asStr(p.promise)
    if (promise) body += `<p><strong>${esc(promise)}</strong></p>`
    const doTxt = asStr(p.do)
    const dontTxt = asStr(p.dont)
    if (doTxt) body += `<div class="mcs-do"><strong>DO</strong> — ${esc(doTxt)}</div>`
    if (dontTxt) body += `<div class="mcs-dont"><strong>DON'T</strong> — ${esc(dontTxt)}</div>`
    const seeds = asArrOrWrap(p.idea_seeds).map((x) => esc(asStr(x))).filter(Boolean)
    if (seeds.length) {
      body += `${miniLabel('Idea seeds')}<ul>${seeds.map((sd) => `<li>${sd}</li>`).join('')}</ul>`
    }
    const audience = asStr(p.audience)
    if (audience) body += `<p style="margin-top:10px;font-style:italic;">Speaks to: ${esc(audience)}</p>`
    return { title: asStr(p.name) || `Pillar ${i + 1}`, body }
  })
  // active_pillar_judgment: la justificación de cuántos pilares corren este
  // mes — nota de apertura ANTES de las tarjetas (campo nuevo, puede faltar).
  const judgment = stripJudgment(r.active_pillar_judgment)
  return {
    title: 'Content Pillars',
    navLabel: 'Pillars',
    subtitle: 'What each pillar promises, who it speaks to and the rules that keep it alive.',
    intro: judgment ? noteBox('Judgment call — why these pillars run', `<p style="margin:0;">${esc(judgment)}</p>`) : undefined,
    cards,
  }
}

// 05 — La apuesta del mes: lista numerada destacada (phases → cajas con acento)
function prioritySection(r: Record<string, any>): Section | null {
  const items = asArr(r.priority_board).filter(isPlainObject)
  if (!items.length) return null
  const phases: PhaseItem[] = items.map((it, i): PhaseItem => {
    const n = asNum(it.n) ?? i + 1
    let body = ''
    if (asStr(it.pillar)) body += `<strong>${esc(asStr(it.pillar))}</strong>`
    if (asStr(it.why_priority)) body += `${body ? ' — ' : ''}${esc(asStr(it.why_priority))}`
    return {
      title: `${String(n).padStart(2, '0')} · ${clip(it.title, 110) || 'Piece'}`,
      body: body || '—',
    }
  })
  return {
    title: 'Priority Board',
    navLabel: 'Priorities',
    subtitle: `If only ${items.length} pieces get produced this month, these are the ones. In order.`,
    phases,
  }
}

// 06 — Tablero semanal: una tabla POR SEMANA con su theme como título
function weeklyBoardSection(r: Record<string, any>): Section | null {
  const weeks = asArr(r.weekly_board).filter(isPlainObject)
  if (!weeks.length) return null
  const phases: PhaseItem[] = weeks.map((w, i): PhaseItem => {
    const weekNo = asStr(w.week) || String(i + 1)
    const theme = clip(w.theme, 90)
    const rows = asArr(w.rows)
      .filter(isPlainObject)
      .map((row) => [
        `<strong>${esc(clip(row.pillar, 30)) || '—'}</strong>`,
        esc(clip(row.format, 18)) || '—',
        esc(clip(row.platform, 16)) || '—',
        esc(clip(row.working_title, 110)) || '—',
        esc(clip(row.goal, 110)) || '—',
      ])
    const body = rows.length
      ? scrollTable(['Pillar', 'Format', 'Channel', 'Piece', 'Goal'], rows, 620)
      : `<p class="mcs-muted">No pieces assigned for this week.</p>`
    return { title: `Week ${weekNo}${theme ? ` — ${theme}` : ''}`, body }
  })
  return {
    title: 'Weekly Board',
    navLabel: 'Board',
    subtitle: 'The working view: what gets produced each week, in what format and what for.',
    phases,
  }
}

// 07 — Hero briefs: cada brief rodable tal cual (hook, objetivo, shot flow, CTA)
function heroBriefsSection(r: Record<string, any>): Section | null {
  const heroes = asArr(r.hero_briefs).filter(isPlainObject)
  if (!heroes.length) return null
  const phases: PhaseItem[] = heroes.map((h, i): PhaseItem => {
    let body = `<div style="margin-bottom:8px;">${chip(h.platform, 'accent')}${chip(h.pillar)}</div>`
    const hook = asStr(h.hook)
    if (hook) body += `${miniLabel('Hook')}<p><strong>${esc(hook)}</strong></p>`
    const objective = asStr(h.objective)
    if (objective) body += `${miniLabel('Objective')}<p>${esc(objective)}</p>`
    const flow = asArr(h.shot_flow)
      .filter(isPlainObject)
      .map((sc) => [
        `<strong>${esc(clip(sc.time, 12)) || '—'}</strong>`,
        esc(clip(sc.shot, 60)) || '—',
        esc(clip(sc.action, 160)) || '—',
        esc(clip(sc.text_overlay, 90)) || '—',
      ])
    if (flow.length) {
      body += miniLabel('Shot flow')
      body += scrollTable(['Time', 'Shot', 'Action', 'On-screen text'], flow, 620)
    }
    const closing: string[] = []
    if (asStr(h.cta)) closing.push(`<strong>CTA:</strong> ${esc(asStr(h.cta))}`)
    if (asStr(h.success_metric)) closing.push(`<strong>Success =</strong> ${esc(asStr(h.success_metric))}`)
    if (closing.length) body += `<p style="margin-top:8px;">${closing.join(' &nbsp;·&nbsp; ')}</p>`
    return { title: clip(h.title, 120) || `Hero ${i + 1}`, body }
  })
  return {
    title: 'Hero Briefs',
    navLabel: 'Heroes',
    subtitle: 'The hero pieces, ready to shoot: shot by shot, with timings and on-screen text.',
    phases,
  }
}

// 08 — EL ACTIVO PRINCIPAL: una tarjeta por caption con el copy íntegro
function captionsSection(r: Record<string, any>): Section | null {
  const captions = asArr(r.captions).filter(isPlainObject)
  if (!captions.length) return null

  const cardsHtml = captions
    .map((c) => {
      // NOTA: c.is_promo_rationale es traza interna del juicio del modelo —
      // no se lee ni se pinta jamás en la tarjeta del cliente.
      const isPromo = c.is_promo === true || asStr(c.is_promo).toLowerCase() === 'true'
      let inner = `<div>${chip(c.platform, 'accent')}${chip(c.pillar_name)}${asNum(c.suggested_day) !== null ? chip(`Day ${asNum(c.suggested_day)}`) : ''}${chip(c.language)}${isPromo ? '<span class="badge" style="background:rgba(239,68,68,0.2);color:#F87171;">PROMO</span>' : ''}</div>`
      const hook = asStr(c.hook)
      if (hook) inner += `<div class="mcs-card-hook">${esc(hook)}</div>`
      const copy = asStr(c.copy)
      // pre-wrap: respeta los saltos de línea del copy tal cual (EN, ES o TH)
      if (copy) inner += `${miniLabel('Copy')}<div class="mcs-copy">${esc(copy)}</div>`
      const caption = asStr(c.caption)
      if (caption) inner += `${miniLabel('Caption')}<div class="mcs-copy" style="font-style:italic;">${esc(caption)}</div>`
      const tags = asArrOrWrap(c.hashtags).map((t) => esc(asStr(t))).filter(Boolean)
      if (tags.length) inner += `${miniLabel('Hashtags')}<div class="mcs-tags">${tags.join(' ')}</div>`
      // first_comment_hashtags: van en el primer comentario, no en la caption —
      // línea secundaria para que el equipo no los mezcle.
      const fcTags = asArrOrWrap(c.first_comment_hashtags).map((t) => esc(asStr(t))).filter(Boolean)
      if (fcTags.length) inner += `<div class="mcs-tags" style="opacity:.7;margin-top:4px;">+ first comment: ${fcTags.join(' ')}</div>`
      const cta = asStr(c.cta)
      if (cta) inner += `${miniLabel('CTA')}<div class="mcs-muted">${esc(cta)}</div>`
      const visual = asStr(c.visual_direction)
      if (visual) inner += `${miniLabel('Visual direction')}<div class="mcs-muted">${esc(visual)}</div>`
      const reel = asObj(c.reel_script)
      const scenes = asArr(reel.scenes)
        .filter(isPlainObject)
        .map((sc) => [
          `<strong>${esc(clip(sc.time, 10)) || '—'}</strong>`,
          esc(clip(sc.action, 140)) || '—',
          esc(clip(sc.text_overlay, 90)) || '—',
        ])
      if (scenes.length) {
        inner += miniLabel(`Reel script${asStr(reel.duration) ? ` · ${esc(asStr(reel.duration))}` : ''}`)
        inner += scrollTable(['Time', 'Action', 'On-screen text'], scenes, 520)
      }
      return `<div class="mcs-card">${inner}</div>`
    })
    .join('\n')

  // caption_allocation: la distribución declarada de piezas por pilar y los
  // pilares no cubiertos con su porqué — cabecera de la sección (campo nuevo).
  let intro = ''
  const alloc = asObj(r.caption_allocation)
  const dist = asArr(alloc.distribution).filter(isPlainObject)
  if (dist.length) {
    intro += `<div style="margin-bottom:12px;">${dist
      .map((d) => chip(`${clip(d.pillar, 30)} ×${asNum(d.captions) ?? '?'}`))
      .join('')}</div>`
    intro += scrollTable(
      ['Pillar', 'Pieces', 'Why'],
      dist.map((d) => [
        `<strong>${esc(clip(d.pillar, 40)) || '—'}</strong>`,
        esc(asStr(d.captions)) || '—',
        esc(asStr(d.why)) || '—',
      ]),
      560
    )
  }
  const notCovered = asArr(alloc.not_covered).filter(isPlainObject)
  if (notCovered.length) {
    intro += miniLabel('Not covered this month')
    intro += notCovered
      .map((n) => `<div class="list-item"><strong>${esc(clip(n.pillar, 40)) || '—'}</strong> — ${esc(asStr(n.why)) || '—'}</div>`)
      .join('')
    intro += `<div style="height:24px;"></div>`
  }

  return {
    title: 'Ready to Publish',
    navLabel: 'Pieces',
    subtitle: `${captions.length} pieces with final copy. Mark APPROVE / EDIT / PASS on each one — nothing gets produced until it is green.`,
    intro: intro || undefined,
    content: cardsHtml,
  }
}

/** weekday resoluble: 0=domingo…6=sábado; si falta, se computa desde date. */
function weekdayOf(e: Record<string, any>): number | null {
  const w = Number(e?.weekday)
  if (Number.isFinite(w) && w >= 0 && w <= 6) return w
  const d = new Date(`${asStr(e?.date)}T00:00:00Z`)
  return isNaN(d.getTime()) ? null : d.getUTCDay()
}

// 09 — Calendario mensual: grid de 7 columnas (L-D) como el del PPTX
function calendarSection(r: Record<string, any>): Section | null {
  const entries = asArr(r.calendar_entries).filter(isPlainObject)
  if (!entries.length) return null

  // Ancla del grid: primer día con weekday resoluble. offset = columna (lunes=0)
  // en la que cae el día 1 del mes.
  let firstOffset: number | null = null
  for (const e of entries) {
    const wd = weekdayOf(e)
    const day = Number(e.day)
    if (wd !== null && Number.isFinite(day) && day >= 1) {
      firstOffset = (((wd - (day - 1)) % 7) + 7 + 6) % 7
      break
    }
  }

  const subtitle = 'Every piece on its day. ★ marks the hero pieces; dimmed days publish nothing.'

  // Sin ancla de weekday no hay forma honesta de posicionar el grid:
  // tabla plana de los días con contenido en vez de un grid mal colocado.
  if (firstOffset === null) {
    const rows = entries
      .filter((e) => asArr(e.items).length)
      .map((e) => [
        `<strong>${esc(asStr(e.day) || asStr(e.date) || '—')}</strong>`,
        esc(asStr(e.weekday_label)) || '—',
        asArr(e.items)
          .filter(isPlainObject)
          .map((it) => `${it.is_hero ? '★ ' : ''}${esc(clip(it.platform, 12))} · ${esc(clip(it.title, 80))}`)
          .join('<br>') || '—',
      ])
    if (!rows.length) return null
    return {
      title: 'Content Calendar',
      navLabel: 'Calendar',
      subtitle,
      table: { headers: ['Day', 'Weekday', 'Pieces'], rows },
    }
  }

  const byDay = new Map<number, Record<string, any>>()
  let maxDay = 0
  entries.forEach((e, i) => {
    const day = Number(e.day)
    const d = Number.isFinite(day) && day >= 1 && day <= 31 ? day : i + 1
    byDay.set(d, e)
    if (d > maxDay) maxDay = d
  })

  const headers = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    .map((l) => `<div class="mcs-cal-h">${l}</div>`)
    .join('')
  const blanks = Array.from({ length: firstOffset }, () => `<div></div>`).join('')

  const cells: string[] = []
  for (let d = 1; d <= maxDay; d++) {
    const e = byDay.get(d)
    const items = asArr(e?.items).filter(isPlainObject)
    let cell = `<div class="mcs-cal-day">${d}</div>`
    for (const it of items.slice(0, 2)) {
      const platform = platformAbbr(it.platform)
      cell += `<div class="mcs-cal-item">${it.is_hero ? '<span class="mcs-cal-hero">★</span> ' : ''}${platform ? `${esc(platform)} · ` : ''}${esc(clip(it.title, 42))}</div>`
    }
    if (items.length > 2) cell += `<div class="mcs-cal-more">+${items.length - 2} more</div>`
    cells.push(`<div class="mcs-cal-cell${items.length ? ' mcs-cal-on' : ' mcs-cal-empty'}">${cell}</div>`)
  }

  return {
    title: 'Content Calendar',
    navLabel: 'Calendar',
    subtitle,
    // overflow-x contenido en su propio wrapper: en móvil el grid hace scroll
    // horizontal sin desbordar la página.
    content: `<div class="mcs-scroll"><div class="mcs-cal">${headers}${blanks}${cells.join('')}</div></div>`,
  }
}

// 10 — Idea bank A: conceptos de campaña + playbook de activación
function ideaBankCampaignsSection(bank: Record<string, any>): Section | null {
  const campaigns = asArr(bank.campaign_concepts).filter(isPlainObject)
  const plays = asArr(bank.activation_playbook).filter(isPlainObject)
  if (!campaigns.length && !plays.length) return null
  const cards: CardItem[] = campaigns.map((c, i): CardItem => {
    let body = ''
    if (asStr(c.concept)) body += `<p>${esc(asStr(c.concept))}</p>`
    const meta: string[] = []
    if (asStr(c.pillar)) meta.push(`<strong>Pillar:</strong> ${esc(asStr(c.pillar))}`)
    if (asStr(c.when)) meta.push(`<strong>When:</strong> ${esc(asStr(c.when))}`)
    if (meta.length) body += `<p style="margin-top:10px;">${meta.join('<br>')}</p>`
    return { title: asStr(c.name) || `Campaign ${i + 1}`, body: body || '—' }
  })
  const table = plays.length
    ? {
        headers: ['Activation', 'How', 'Cost'],
        rows: plays.map((p) => [
          `<strong>${esc(clip(p.play, 60)) || '—'}</strong>`,
          esc(asStr(p.how)) || '—',
          esc(clip(p.cost, 20)) || '—',
        ]),
      }
    : undefined
  return {
    title: 'Idea Bank — Campaigns & Activations',
    navLabel: 'Idea Bank',
    subtitle: 'Material for the coming months: campaign concepts and zero-to-low-cost activation plays.',
    cards: cards.length ? cards : undefined,
    table,
  }
}

// 11 — Idea bank B: sistema de influencers por tiers + community engine
function ideaBankCommunitySection(bank: Record<string, any>): Section | null {
  const inf = asObj(bank.influencer_system)
  const tiers = asArr(inf.tiers).filter(isPlainObject)
  const rituals = asArr(bank.community_engine).filter(isPlainObject)
  if (!tiers.length && !rituals.length && !asStr(inf.rule)) return null

  let content = ''
  if (asStr(inf.rule)) content += `${miniLabel('Influencer rule')}<p class="mcs-muted">${esc(asStr(inf.rule))}</p>`
  if (tiers.length) {
    content += `<div class="mcs-h">Influencer tiers</div>`
    content += scrollTable(
      ['Tier', 'Who', 'Deal', 'Content'],
      tiers.map((t) => [
        `<strong>${esc(clip(t.tier, 16)) || '—'}</strong>`,
        esc(asStr(t.who)) || '—',
        esc(asStr(t.deal)) || '—',
        esc(asStr(t.content)) || '—',
      ]),
      620
    )
  }
  if (rituals.length) {
    content += `<div class="mcs-h">Community engine</div>`
    content += scrollTable(
      ['Ritual', 'Cadence', 'Why'],
      rituals.map((rt) => [
        `<strong>${esc(clip(rt.ritual, 60)) || '—'}</strong>`,
        esc(clip(rt.cadence, 30)) || '—',
        esc(asStr(rt.why)) || '—',
      ]),
      560
    )
  }
  return {
    title: 'Idea Bank — Influencers & Community',
    navLabel: 'Community',
    content,
  }
}

// 12 — KPIs 30/60/90 como 3 tarjetas visibles + pilares en pausa (on ice)
function kpisSection(bank: Record<string, any>, r: Record<string, any>): Section | null {
  const kp = asObj(bank.kpis_30_60_90)
  const dormant = asArrOrWrap(bank.dormant_pillars).map((d) => esc(asStr(d))).filter(Boolean)
  const dormantNote = asStr(r.dormant_note)
  if (!Object.keys(kp).length && !dormant.length && !dormantNote) return null

  const cards: CardItem[] = []
  for (const [key, label] of [
    ['d30', '30 days'],
    ['d60', '60 days'],
    ['d90', '90 days'],
  ] as const) {
    const items = asArrOrWrap(kp[key]).map((k) => esc(asStr(k))).filter(Boolean)
    if (items.length) cards.push({ title: label, body: `<ul>${items.map((k) => `<li>${k}</li>`).join('')}</ul>` })
  }

  // Los dormant_pillars vienen como frases completas, no etiquetas: lista del
  // template (.list-item) en vez de chips — un chip con nowrap se sale de página.
  let content = ''
  if (dormant.length) {
    content += `${miniLabel('On ice — dormant pillars')}${dormant.map((d) => `<div class="list-item">${d}</div>`).join('')}`
  }
  if (dormantNote) content += `<p class="mcs-muted" style="margin-top:16px;">${esc(dormantNote)}</p>`

  return {
    title: 'KPIs 30 / 60 / 90',
    navLabel: 'KPIs',
    subtitle: 'How the system gets measured — plus what deliberately rests this month.',
    cards: cards.length ? cards : undefined,
    content: content || undefined,
  }
}

// 13 — Plantilla de brief completa (los campos que toda pieza debe responder)
function briefTemplateSection(r: Record<string, any>): Section | null {
  const fields = asArr(r.full_brief_template).filter(isPlainObject)
  if (!fields.length) return null
  return {
    title: 'Brief Template',
    navLabel: 'Brief',
    subtitle: `The ${fields.length} fields every piece must answer before production.`,
    table: {
      headers: ['#', 'Field', 'Instruction'],
      rows: fields.map((f, i) => [
        `<strong>${esc(asStr(f.n) || String(i + 1))}</strong>`,
        `<strong>${esc(clip(f.field, 50)) || '—'}</strong>`,
        esc(asStr(f.instruction)) || '—',
      ]),
    },
  }
}

// 14 — Open items: los huecos honestos, cada uno con dueño
function openItemsSection(r: Record<string, any>): Section | null {
  const items = asArr(r.open_items).filter(isPlainObject)
  if (!items.length) return null
  return {
    title: 'Open Items',
    navLabel: 'Open Items',
    subtitle: 'Honest gaps — each one with an owner. A system with clear open items is worth more than a "complete" one padded with filler.',
    table: {
      headers: ['#', 'Item', 'Owner', 'Needed for'],
      rows: items.map((it, i) => [
        `<strong>${esc(asStr(it.n) || String(i + 1))}</strong>`,
        esc(asStr(it.item)) || '—',
        esc(clip(it.owner, 24)) || '—',
        esc(asStr(it.needed_for)) || '—',
      ]),
    },
  }
}

// 15 — Data gaps: lo que faltaba en el contexto al generar
function dataGapsSection(r: Record<string, any>): Section | null {
  const gaps = asArrOrWrap(r.data_gaps).map((g) => esc(asStr(g))).filter(Boolean)
  if (!gaps.length) return null
  return {
    title: 'Data Gaps',
    navLabel: 'Gaps',
    subtitle: 'Information missing from the context when this system was generated.',
    listItems: gaps,
  }
}

// ---------------------------------------------------------------------------
// Adaptador
// ---------------------------------------------------------------------------

export const adapter: ToolAdapter = (result) => {
  try {
    const r = asObj(result)
    const bank = asObj(r.idea_bank)
    const sections: Section[] = []

    // Claves consumidas o excluidas del render (metadatos internos que hoy se
    // le pintaban al cliente en el volcado genérico).
    const used = new Set<string>([
      'month',
      'month_label',
      'generated_with',
      'materialized_at',
      'materialized_count',
      '_pipeline',
      'active_pillar_judgment', // pintado como nota de apertura en Content Pillars
      'caption_allocation', // pintado como cabecera de Ready to Publish
      'pillars',
      'captions',
      'hero_briefs',
      'calendar_entries',
      'weekly_board',
      'priority_board',
      'full_brief_template',
      'open_items',
      'data_gaps',
      'promo_ratio',
      'funnel_balance',
      'dormant_note',
      'previous_month_stats',
      'previous_month_learnings',
      'idea_bank',
    ])

    // La primera sección siempre existe (lleva el styleBlock del adaptador).
    let overview: Section
    try {
      overview = overviewSection(r)
    } catch {
      overview = { title: 'Monthly Content System', content: styleBlock() }
    }
    sections.push(overview)

    const parts: Array<Section | null> = [
      safe('previous_month_stats', r, () => previousMonthSection(r)),
      safe('funnel_balance', r, () => funnelSection(r)),
      safe('pillars', r, () => pillarsSection(r)),
      safe('priority_board', r, () => prioritySection(r)),
      safe('weekly_board', r, () => weeklyBoardSection(r)),
      safe('hero_briefs', r, () => heroBriefsSection(r)),
      safe('captions', r, () => captionsSection(r)),
      safe('calendar_entries', r, () => calendarSection(r)),
      safe('idea_bank', r, () => ideaBankCampaignsSection(bank)),
      safe('idea_bank', r, () => ideaBankCommunitySection(bank)),
      safe('idea_bank', r, () => kpisSection(bank, r)),
      safe('full_brief_template', r, () => briefTemplateSection(r)),
      safe('open_items', r, () => openItemsSection(r)),
      safe('data_gaps', r, () => dataGapsSection(r)),
    ]
    for (const s of parts) if (s) sections.push(s)

    // Sub-claves futuras del idea_bank: volcado genérico discreto, sin perderlas.
    const knownBank = new Set([
      'campaign_concepts',
      'activation_playbook',
      'influencer_system',
      'community_engine',
      'kpis_30_60_90',
      'dormant_pillars',
    ])
    for (const [k, v] of Object.entries(bank)) {
      if (knownBank.has(k)) continue
      try {
        const s = sectionForValue(k, v)
        if (s) sections.push({ ...s, title: `Idea Bank — ${humanize(k)}` })
      } catch {
        // se pierde solo esa sub-clave, nunca el informe
      }
    }

    // Campos raíz nuevos que el prompt ampliado pueda traer: mismo trato.
    sections.push(...genericSections(r, used))
    return sections
  } catch {
    return genericSections(result)
  }
}
