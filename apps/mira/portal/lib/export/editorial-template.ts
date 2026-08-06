import { editorialPalette, rgbaOf, type DocMode } from './doc-theme'
// Editorial HTML template for toolkit reports — sf-reports design language.
// Generates standalone, self-contained HTML: dark #1A1A1A / cream #F5F0E8,
// Anton + Space Mono + Inter, side nav dots, reveal animations, brand color accents.

export interface StatItem {
  value: string
  label: string
}

export interface CardItem {
  title: string
  body: string // HTML allowed
}

export interface TableData {
  headers: string[]
  rows: string[][] // cell HTML allowed
}

export interface PhaseItem {
  title: string
  body: string // HTML allowed
}

export interface ChartSpec {
  type: 'bar' | 'line' | 'doughnut' | 'radar'
  labels: string[]
  data: number[]
  label?: string
}

export interface Section {
  id?: string
  navLabel?: string
  label?: string // eyebrow above the title, e.g. "02 — Executive Summary"
  title: string
  subtitle?: string
  type?: 'text' | 'cards' | 'stats' | 'table' | 'list' | 'phases' | 'chart'
  // Structured content (preferred — renders native editorial components)
  stats?: StatItem[]
  cards?: CardItem[]
  table?: TableData
  listItems?: string[] // item HTML allowed
  phases?: PhaseItem[]
  chart?: ChartSpec
  // Free-form HTML fallback / additional body below structured content
  content?: string
}

export interface ReportOptions {
  /** Tema del documento (P3): dark = look histórico, light = papel (default dark) */
  mode?: DocMode
  clientName: string
  brandColor: string
  toolTitle: string
  sections: Section[]
  subtitle?: string
  tagline?: string
  tickerItems?: string[]
  logoUrl?: string
}

function esc(s: string): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function renderStats(stats: StatItem[]): string {
  const cols = stats.length <= 2 ? 'cards-2' : stats.length === 3 ? 'cards-3' : 'cards-4'
  return `<div class="${cols} reveal reveal-delay-2" style="margin-bottom:48px;">
    ${stats
      .map(
        (s) => `<div class="stat-card">
      <div class="stat-num">${esc(s.value)}</div>
      <div class="stat-label">${esc(s.label)}</div>
    </div>`
      )
      .join('\n')}
  </div>`
}

function renderCards(cards: CardItem[]): string {
  const cols = cards.length === 2 ? 'cards-2' : cards.length === 4 ? 'cards-4' : 'cards-3'
  return `<div class="${cols} reveal reveal-delay-2">
    ${cards
      .map(
        (c) => `<div class="card">
      <div class="card-title">${esc(c.title)}</div>
      <div class="card-body">${c.body}</div>
    </div>`
      )
      .join('\n')}
  </div>`
}

function renderTable(table: TableData): string {
  return `<div class="reveal reveal-delay-2" style="overflow-x:auto;">
  <table>
    <thead><tr>${table.headers.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead>
    <tbody>
      ${table.rows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join('')}</tr>`).join('\n')}
    </tbody>
  </table></div>`
}

function renderList(items: string[]): string {
  return `<div class="reveal reveal-delay-2">
    ${items.map((item) => `<div class="list-item">${item}</div>`).join('\n')}
  </div>`
}

function renderPhases(phases: PhaseItem[]): string {
  return `<div class="reveal reveal-delay-2">
    ${phases
      .map(
        (p) => `<div class="phase-box">
      <div class="phase-title">${esc(p.title)}</div>
      <div class="phase-body">${p.body}</div>
    </div>`
      )
      .join('\n')}
  </div>`
}

function renderChart(chart: ChartSpec, chartId: string, brandColor: string): string {
  const spec = JSON.stringify({
    type: chart.type,
    labels: chart.labels,
    data: chart.data,
    label: chart.label || '',
  })
  const specAttr = spec
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/'/g, '&#39;')
  return `<div class="chart-wrap reveal reveal-delay-2">
    <canvas id="${chartId}" data-chart='${specAttr}' data-color="${brandColor}"></canvas>
  </div>`
}

export function generateEditorialHTML(options: ReportOptions): string {
  const P = editorialPalette(options.mode ?? 'dark')
  const { r: inkR, g: inkG, b: inkB } = ((h) => { const n = parseInt(h.replace('#',''), 16); return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 } })(P.ink)
  const { clientName, brandColor, toolTitle, sections, subtitle, tagline, tickerItems } = options

  const year = new Date().getFullYear()
  const dateStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  const ticker = tickerItems?.length
    ? tickerItems
    : sections.map((s) => s.title.toUpperCase()).slice(0, 6)
  const tickerHtml = [...ticker, ...ticker]
    .map((t) => `<span class="ticker-item">${esc(t)}</span>`)
    .join('\n')

  // Resolve ids + nav
  const resolved = sections.map((s, i) => ({
    ...s,
    _id: s.id || slugify(s.title) || `section-${i + 2}`,
    _num: String(i + 2).padStart(2, '0'),
  }))

  const navDots = [
    `<a class="nav-dot active" href="#cover" data-label="01 COVER"></a>`,
    ...resolved.map(
      (s) =>
        `<a class="nav-dot" href="#${s._id}" data-label="${s._num} ${esc((s.navLabel || s.title).toUpperCase())}"></a>`
    ),
  ].join('\n')

  let chartCount = 0
  const hasCharts = sections.some((s) => s.chart)

  const sectionsHTML = resolved
    .map((s) => {
      let body = ''
      if (s.stats?.length) body += renderStats(s.stats)
      if (s.chart) body += renderChart(s.chart, `chart-${chartCount++}`, brandColor)
      if (s.cards?.length) body += renderCards(s.cards)
      if (s.table?.rows?.length) body += renderTable(s.table)
      if (s.listItems?.length) body += renderList(s.listItems)
      if (s.phases?.length) body += renderPhases(s.phases)
      if (s.content) body += `<div class="section-body reveal reveal-delay-3">${s.content}</div>`
      if (!body) body = `<div class="section-body reveal reveal-delay-2"><p>—</p></div>`

      return `<section id="${s._id}">
  <div class="section-label reveal">${esc(s.label || `${s._num} — ${s.title}`)}</div>
  <div class="section-title reveal reveal-delay-1">${esc(s.title.toUpperCase())}</div>
  ${s.subtitle ? `<div class="section-subtitle reveal reveal-delay-1">${esc(s.subtitle)}</div>` : ''}
  <div class="divider reveal reveal-delay-1"></div>
  ${body}
</section>`
    })
    .join('\n\n')

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(clientName.toUpperCase())} — ${esc(toolTitle)} ${year}</title>
<link href="https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
${hasCharts ? '<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>' : ''}
<style>
  :root {
    --primary: ${brandColor};
    --black: ${P.bg};
    --cream: ${P.ink};
    --cream-dim: ${rgbaOf(P.ink, 0.7)};
    --cream-faint: ${rgbaOf(P.ink, 0.12)};
    --nav-w: 56px;
  }

  *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
  html { scroll-behavior: smooth; }
  body { background: var(--black); color: var(--cream); font-family: 'Inter', sans-serif; overflow-x: hidden; }

  .nav { position: fixed; left: 0; top: 0; bottom: 0; width: var(--nav-w); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 20px; z-index: 100; padding: 0 12px; background: linear-gradient(to right, ${rgbaOf(P.bg, 0.98)} 80%, transparent); }
  .nav-dot { position: relative; width: 8px; height: 8px; border-radius: 50%; background: ${rgbaOf(P.ink, 0.25)}; cursor: pointer; transition: all 0.3s ease; text-decoration: none; }
  .nav-dot:hover, .nav-dot.active { background: var(--primary); transform: scale(1.4); }
  .nav-dot::after { content: attr(data-label); position: absolute; left: 18px; top: 50%; transform: translateY(-50%); white-space: nowrap; font-family: 'Space Mono', monospace; font-size: 9px; letter-spacing: 0.08em; color: var(--cream); background: var(--black); padding: 3px 8px; border-left: 2px solid var(--primary); opacity: 0; pointer-events: none; transition: opacity 0.2s; }
  .nav-dot:hover::after { opacity: 1; }

  main { padding-left: var(--nav-w); }
  section { padding: 100px 80px 100px 60px; min-height: 100vh; display: flex; flex-direction: column; justify-content: center; position: relative; }

  .reveal { opacity: 0; transform: translateY(32px); transition: opacity 0.7s ease, transform 0.7s ease; }
  .reveal.visible { opacity: 1; transform: translateY(0); }
  .reveal-delay-1 { transition-delay: 0.1s; }
  .reveal-delay-2 { transition-delay: 0.2s; }
  .reveal-delay-3 { transition-delay: 0.3s; }
  .reveal-delay-4 { transition-delay: 0.4s; }

  .section-label { font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 0.2em; color: var(--primary); text-transform: uppercase; margin-bottom: 12px; }
  .section-title { font-family: 'Anton', sans-serif; font-size: clamp(42px, 6vw, 80px); line-height: 0.95; letter-spacing: 0.01em; color: var(--cream); text-transform: uppercase; margin-bottom: 48px; }
  .section-subtitle { font-size: 14px; color: var(--cream-dim); letter-spacing: 0.06em; margin-top: -36px; margin-bottom: 48px; }
  .section-body { font-size: 14px; line-height: 1.9; color: var(--cream-dim); max-width: 860px; }
  .section-body p { margin-bottom: 16px; }
  .section-body strong { color: var(--cream); }

  #cover { min-height: 100vh; background: var(--black); align-items: flex-start; justify-content: center; padding: 0 80px; overflow: hidden; }
  .hero-glow { position: absolute; left: 50%; top: 45%; transform: translate(-50%, -50%); width: 600px; height: 300px; background: radial-gradient(ellipse, ${brandColor}2E 0%, transparent 70%); animation: pulse 4s ease-in-out infinite; pointer-events: none; }
  @keyframes pulse { 0%, 100% { opacity: 0.6; transform: translate(-50%, -50%) scale(1); } 50% { opacity: 1; transform: translate(-50%, -50%) scale(1.12); } }
  .hero-content { position: relative; z-index: 2; padding-top: 28vh; }
  .hero-eyebrow { font-family: 'Space Mono', monospace; font-size: 11px; letter-spacing: 0.3em; color: var(--primary); text-transform: uppercase; margin-bottom: 16px; }
  .hero-title { font-family: 'Anton', sans-serif; font-size: clamp(64px, 11vw, 150px); line-height: 0.88; letter-spacing: 0.01em; color: var(--primary); text-transform: uppercase; margin-bottom: 20px; }
  .hero-sub { font-family: 'Anton', sans-serif; font-size: clamp(20px, 3vw, 36px); color: var(--cream); letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 36px; }
  .hero-tagline { font-family: 'Space Mono', monospace; font-size: clamp(12px, 1.4vw, 16px); letter-spacing: 0.35em; color: var(--cream-dim); text-transform: uppercase; }
  .hero-ticker { position: absolute; bottom: 0; left: 0; right: 0; background: var(--primary); padding: 12px 0; overflow: hidden; }
  .ticker-track { display: flex; gap: 60px; animation: ticker 20s linear infinite; white-space: nowrap; }
  .ticker-item { font-family: 'Anton', sans-serif; font-size: 13px; letter-spacing: 0.12em; color: var(--black); text-transform: uppercase; flex-shrink: 0; }
  @keyframes ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }

  .cards-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; width: 100%; }
  .cards-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; width: 100%; }
  .cards-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; width: 100%; }
  .card { background: ${rgbaOf(P.ink, 0.04)}; border-top: 3px solid var(--primary); padding: 32px 28px; transition: background 0.3s; }
  .card:hover { background: ${rgbaOf(P.ink, 0.08)}; }
  .card-title { font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 0.2em; color: var(--primary); text-transform: uppercase; margin-bottom: 20px; }
  .card-body { font-size: 14px; line-height: 1.8; color: var(--cream-dim); }
  .card-body strong { color: var(--cream); }
  .card-body ul { list-style: none; }
  .card-body li { padding-left: 16px; position: relative; margin-bottom: 8px; }
  .card-body li::before { content: '—'; position: absolute; left: 0; color: var(--primary); }

  .stat-card { padding: 32px 24px; background: ${rgbaOf(P.ink, 0.04)}; text-align: center; border-bottom: 3px solid var(--primary); transition: all 0.3s; }
  .stat-card:hover { background: ${rgbaOf(P.ink, 0.08)}; }
  .stat-num { font-family: 'Anton', sans-serif; font-size: clamp(36px, 5vw, 60px); color: var(--primary); line-height: 1; margin-bottom: 8px; }
  .stat-label { font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 0.12em; color: var(--cream-dim); text-transform: uppercase; }

  .phase-box { background: ${rgbaOf(P.ink, 0.04)}; border-left: 3px solid var(--primary); padding: 32px 28px; margin-bottom: 20px; transition: all 0.3s; }
  .phase-box:hover { background: ${rgbaOf(P.ink, 0.07)}; }
  .phase-title { font-family: 'Anton', sans-serif; font-size: 16px; letter-spacing: 0.06em; color: var(--primary); text-transform: uppercase; margin-bottom: 12px; }
  .phase-body { font-size: 13px; line-height: 1.8; color: var(--cream-dim); }
  .phase-body strong { color: var(--cream); }

  .list-item { padding: 18px 0 18px 24px; border-bottom: 1px solid ${rgbaOf(P.ink, 0.07)}; font-size: 14px; line-height: 1.7; color: var(--cream-dim); position: relative; }
  .list-item::before { content: '→'; position: absolute; left: 0; color: var(--primary); font-family: 'Space Mono', monospace; }
  .list-item strong { color: var(--cream); }

  table { width: 100%; border-collapse: collapse; margin-bottom: 28px; }
  th { background: ${rgbaOf(P.ink, 0.06)}; color: var(--primary); font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase; padding: 12px 16px; text-align: left; }
  td { padding: 12px 16px; font-size: 13px; color: var(--cream-dim); border-bottom: 1px solid ${rgbaOf(P.ink, 0.05)}; }
  td:first-child { color: var(--cream); }
  tr:hover td { background: ${rgbaOf(P.ink, 0.02)}; }

  .badge { font-family: 'Space Mono', monospace; font-size: 9px; letter-spacing: 0.12em; padding: 4px 10px; white-space: nowrap; display: inline-block; text-transform: uppercase; margin-right: 6px; margin-bottom: 6px; }
  .badge-live { background: rgba(34,197,94,0.2); color: #4ADE80; }
  .badge-progress { background: rgba(251,191,36,0.2); color: #FBBF24; }
  .badge-pending { background: ${rgbaOf(P.ink, 0.08)}; color: var(--cream-dim); }

  .divider { width: 48px; height: 3px; background: var(--primary); margin-bottom: 32px; }

  .chart-wrap { max-width: 720px; margin-bottom: 40px; background: ${rgbaOf(P.ink, 0.03)}; padding: 28px; }

  .final-cta { background: var(--primary); padding: 56px 60px; text-align: center; margin: 0 -80px 0 -60px; }
  .final-cta-title { font-family: 'Anton', sans-serif; font-size: clamp(36px, 5vw, 64px); color: var(--black); letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 12px; }
  .final-cta-sub { font-family: 'Anton', sans-serif; font-size: 18px; color: ${rgbaOf(P.bg, 0.7)}; letter-spacing: 0.04em; text-transform: uppercase; }

  .footer { background: ${P.footerBg}; padding: 24px 80px; display: flex; justify-content: space-between; align-items: center; }
  .footer p { font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 0.1em; color: ${rgbaOf(P.ink, 0.2)}; }
  .sf-badge { display: inline-flex; align-items: center; gap: 6px; font-family: 'Space Mono', monospace; font-size: 9px; letter-spacing: 0.18em; color: ${rgbaOf(P.ink, 0.35)}; text-transform: uppercase; border: 1px solid ${rgbaOf(P.ink, 0.12)}; padding: 5px 10px; }
  .sf-badge span { color: var(--primary); font-weight: 700; }

  @media (max-width: 1024px) { section { padding: 80px 60px 80px 50px; } .cards-3, .cards-2, .cards-4 { grid-template-columns: 1fr; } }
  @media (max-width: 768px) { .nav { width: 40px; } main { padding-left: 40px; } section { padding: 60px 40px; } .hero-title { font-size: clamp(48px, 10vw, 80px); } .section-title { font-size: clamp(32px, 5vw, 48px); } .final-cta { margin: 0 -40px; } }
  @media (max-width: 480px) { .nav { width: 30px; } main { padding-left: 30px; } section { padding: 40px 20px; } .nav-dot::after { display: none; } .hero-title { font-size: clamp(36px, 8vw, 64px); } .section-title { font-size: clamp(24px, 4vw, 36px); } table { font-size: 12px; } th, td { padding: 8px 12px; } .final-cta { margin: 0 -20px; padding: 32px 20px; } }

  @media print {
    .nav { display: none; }
    main { padding-left: 0; }
    section { min-height: auto; page-break-inside: avoid; padding: 40px; }
    .reveal { opacity: 1; transform: none; }
  }
</style>
</head>
<body>

<nav class="nav" id="sideNav">
${navDots}
</nav>

<main>

<section id="cover">
  <div class="hero-glow"></div>
  <div class="hero-content">
    <div class="hero-eyebrow reveal">${esc(toolTitle.toUpperCase())} · ${year}</div>
    <div class="hero-title reveal reveal-delay-1">${esc(toolTitle.toUpperCase())}</div>
    <div class="hero-sub reveal reveal-delay-2">${esc((subtitle || clientName).toUpperCase())}</div>
    <div class="hero-tagline reveal reveal-delay-3">${esc((tagline || `GENERATED WITH MIRA · ${dateStr}`).toUpperCase())}</div>
    <div style="margin-top:32px;" class="reveal reveal-delay-4">
      <div class="sf-badge">POWERED BY <span>STARTUP FACTORY</span></div>
    </div>
  </div>
  <div class="hero-ticker">
    <div class="ticker-track">
${tickerHtml}
    </div>
  </div>
</section>

${sectionsHTML}

<div class="final-cta">
  <div class="final-cta-title">${esc(clientName.toUpperCase())}</div>
  <div class="final-cta-sub">READY TO EXECUTE</div>
</div>

<div class="footer">
  <p>${esc(clientName.toUpperCase())} · ${esc(toolTitle.toUpperCase())} · ${year}</p>
  <div class="sf-badge">POWERED BY <span>STARTUP FACTORY</span></div>
</div>

</main>

<script>
document.querySelectorAll('.nav-dot').forEach(dot => {
  dot.addEventListener('click', (e) => {
    e.preventDefault();
    const section = document.querySelector(dot.getAttribute('href'));
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
      document.querySelectorAll('.nav-dot').forEach(d => d.classList.remove('active'));
      dot.classList.add('active');
    }
  });
});

window.addEventListener('scroll', () => {
  let currentSection = '';
  document.querySelectorAll('section').forEach(section => {
    if (section.offsetTop <= window.scrollY + 100) currentSection = section.getAttribute('id');
  });
  document.querySelectorAll('.nav-dot').forEach(dot => {
    dot.classList.toggle('active', dot.getAttribute('href') === '#' + currentSection);
  });
});

const revealElements = document.querySelectorAll('.reveal');
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });
revealElements.forEach(el => observer.observe(el));

${
  hasCharts
    ? `document.querySelectorAll('canvas[data-chart]').forEach(canvas => {
  const spec = JSON.parse(canvas.getAttribute('data-chart'));
  const color = canvas.getAttribute('data-color');
  new Chart(canvas, {
    type: spec.type,
    data: {
      labels: spec.labels,
      datasets: [{
        label: spec.label,
        data: spec.data,
        backgroundColor: spec.type === 'doughnut' ? spec.labels.map((_, i) => i === 0 ? color : 'rgba(${inkR},${inkG},${inkB},' + Math.max(0.1, 0.35 - i * 0.06) + ')') : color + 'CC',
        borderColor: color,
        borderWidth: spec.type === 'line' ? 3 : 1,
        tension: 0.35,
        fill: spec.type === 'line',
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: !!spec.label, labels: { color: '${rgbaOf(P.ink, 0.7)}', font: { family: "'Space Mono', monospace", size: 10 } } } },
      scales: spec.type === 'doughnut' || spec.type === 'radar' ? {} : {
        x: { ticks: { color: '${rgbaOf(P.ink, 0.5)}', font: { family: "'Space Mono', monospace", size: 10 } }, grid: { color: '${rgbaOf(P.ink, 0.06)}' } },
        y: { ticks: { color: '${rgbaOf(P.ink, 0.5)}', font: { family: "'Space Mono', monospace", size: 10 } }, grid: { color: '${rgbaOf(P.ink, 0.06)}' } }
      }
    }
  });
});`
    : ''
}
</script>

</body>
</html>`
}
