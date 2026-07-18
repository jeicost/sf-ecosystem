// Editorial HTML template for toolkit reports
// Generates standalone, self-contained HTML with embedded CSS

export interface Section {
  title: string
  subtitle?: string
  number?: string
  content: string | React.ReactNode
  type?: 'text' | 'table' | 'cards' | 'list'
}

export interface ReportOptions {
  clientName: string
  brandColor: string
  toolTitle: string
  sections: Section[]
  logoUrl?: string
}

export function generateEditorialHTML(options: ReportOptions): string {
  const { clientName, brandColor, toolTitle, sections, logoUrl } = options

  const sectionsHTML = sections
    .map(
      (section, idx) => `
    <section class="report-section">
      ${section.number ? `<p class="section-number">${section.number}</p>` : ''}
      <h2 class="section-title">${section.title}</h2>
      ${section.subtitle ? `<p class="section-subtitle">${section.subtitle}</p>` : ''}
      <div class="section-content ${section.type || 'text'}">
        ${typeof section.content === 'string' ? section.content : String(section.content)}
      </div>
    </section>
  `
    )
    .join('')

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${toolTitle} — ${clientName}</title>
  <style>
    :root {
      --primary: ${brandColor};
      --primary-10: ${brandColor}10;
      --primary-20: ${brandColor}20;
      --primary-40: ${brandColor}40;
      --bg-dark: #0f0f0f;
      --bg-light: #1a1a1a;
      --text-primary: #ffffff;
      --text-secondary: #a0a0a0;
      --border: rgba(255,255,255,0.05);
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(to bottom, var(--bg-dark), var(--bg-light));
      color: var(--text-primary);
      line-height: 1.6;
      font-size: 16px;
    }

    .report {
      max-width: 1200px;
      margin: 0 auto;
      padding: 60px 40px;
    }

    .report-header {
      border-bottom: 1px solid var(--border);
      padding-bottom: 60px;
      margin-bottom: 60px;
    }

    .report-header h1 {
      font-family: 'Anton', sans-serif;
      font-size: clamp(48px, 8vw, 72px);
      font-weight: 900;
      letter-spacing: -2px;
      margin-bottom: 16px;
      text-transform: uppercase;
      line-height: 1.1;
    }

    .report-header p {
      color: var(--text-secondary);
      font-size: 14px;
      line-height: 1.8;
      max-width: 600px;
    }

    .report-meta {
      display: flex;
      gap: 40px;
      margin-top: 32px;
      font-size: 12px;
      color: var(--text-secondary);
      font-family: 'Space Mono', monospace;
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }

    .report-section {
      margin-bottom: 80px;
      padding-bottom: 80px;
      border-bottom: 1px solid var(--border);
    }

    .report-section:last-child {
      border-bottom: none;
      margin-bottom: 0;
      padding-bottom: 0;
    }

    .section-number {
      font-family: 'Space Mono', monospace;
      font-size: 12px;
      letter-spacing: 0.2em;
      color: var(--primary);
      text-transform: uppercase;
      margin-bottom: 12px;
      font-weight: 600;
    }

    .section-title {
      font-family: 'Anton', sans-serif;
      font-size: 42px;
      font-weight: 900;
      letter-spacing: -1px;
      margin-bottom: 24px;
      text-transform: uppercase;
      color: var(--text-primary);
      line-height: 1.1;
    }

    .section-subtitle {
      color: var(--text-secondary);
      font-size: 14px;
      line-height: 1.8;
      margin-bottom: 24px;
    }

    .section-content {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .section-content.text p {
      font-size: 15px;
      line-height: 1.8;
      color: var(--text-primary);
    }

    .section-content.cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px;
    }

    .card {
      padding: 24px;
      background: rgba(255,255,255,0.02);
      border: 1px solid var(--border);
      border-top: 3px solid var(--primary);
      border-radius: 4px;
    }

    .card-label {
      font-family: 'Space Mono', monospace;
      font-size: 11px;
      letter-spacing: 0.15em;
      color: var(--primary);
      text-transform: uppercase;
      margin-bottom: 8px;
      font-weight: 600;
    }

    .card-value {
      font-family: 'Anton', sans-serif;
      font-size: 32px;
      color: var(--primary);
      margin-bottom: 8px;
      line-height: 1;
    }

    .card-detail {
      font-size: 13px;
      color: var(--text-secondary);
      line-height: 1.6;
    }

    .section-content.list ul {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .section-content.list li {
      display: flex;
      gap: 12px;
      align-items: flex-start;
    }

    .section-content.list li::before {
      content: '◆';
      color: var(--primary);
      flex-shrink: 0;
      margin-top: 2px;
    }

    .section-content.list li span {
      font-size: 15px;
      line-height: 1.6;
      color: var(--text-primary);
    }

    .section-content.table table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
    }

    .section-content.table thead th {
      background: var(--primary-10);
      border-bottom: 2px solid var(--primary-40);
      padding: 12px 16px;
      text-align: left;
      font-family: 'Space Mono', monospace;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.1em;
      color: var(--primary);
      text-transform: uppercase;
    }

    .section-content.table tbody td {
      padding: 12px 16px;
      border-bottom: 1px solid var(--border);
      color: var(--text-primary);
    }

    .section-content.table tbody tr:hover {
      background: rgba(255,255,255,0.02);
    }

    .divider {
      height: 3px;
      width: 48px;
      background: var(--primary);
      margin: 24px 0 0 0;
    }

    .report-footer {
      margin-top: 80px;
      padding-top: 40px;
      border-top: 1px solid var(--border);
      font-size: 12px;
      color: var(--text-secondary);
      font-family: 'Space Mono', monospace;
      letter-spacing: 0.05em;
    }

    @media (max-width: 768px) {
      .report {
        padding: 40px 20px;
      }

      .report-header h1 {
        font-size: 32px;
      }

      .section-title {
        font-size: 28px;
      }

      .section-content.cards {
        grid-template-columns: 1fr;
      }

      .report-meta {
        flex-direction: column;
        gap: 12px;
      }
    }
  </style>
</head>
<body>
  <div class="report">
    <div class="report-header">
      <h1>${toolTitle}</h1>
      <p>${clientName}</p>
      <div class="report-meta">
        <span>Generado el ${new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
        <span>Confidencial</span>
      </div>
    </div>

    ${sectionsHTML}

    <div class="report-footer">
      <p>© 2026 MIRA. Todos los derechos reservados.</p>
    </div>
  </div>
</body>
</html>`
}
