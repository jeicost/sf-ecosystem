'use client'

import ToolRunnerPage, { ToolConfig } from '@/components/ToolRunnerPage'
import ReportTemplate from '@/components/ReportTemplate'

const TOOL_CONFIG: ToolConfig = {
  slug: 'seo-audit',
  icon: '🔍',
  title: 'SEO Audit',
  subtitle: 'Salsa Burgers',
  timing: '30-40 min',
  brandBrainNote: 'Brand Brain cargado — análisis previo completado',
  submitButtonColor: '#F87171',
  submitButtonText: 'Generar SEO Audit',
  fields: [
    {
      name: 'url_sitio',
      label: 'URL DEL SITIO A AUDITAR',
      type: 'text',
      placeholder: 'https://www.tusitio.com',
      required: true,
    },
    {
      name: 'palabras_clave_objetivo',
      label: 'PALABRAS CLAVE OBJETIVO',
      type: 'textarea',
      placeholder: 'Una por línea. Ej:\n- recetas fáciles\n- cocina casera\n- comida rápida saludable',
      hint: 'Las palabras que quieres rankear',
      required: true,
    },
    {
      name: 'competidores_top_3',
      label: 'COMPETIDORES TOP 3',
      type: 'textarea',
      placeholder: 'Sitios de competencia a analizar. Uno por línea.',
      hint: 'URLs o nombres de competidores',
      required: true,
    },
    {
      name: 'ubicacion_objetivo',
      label: 'UBICACIÓN OBJETIVO',
      type: 'text',
      placeholder: 'Ej: España, Madrid, América Latina',
      hint: 'Geografía del SEO local',
      required: true,
    },
    {
      name: 'audito_tipo',
      label: 'TIPO DE AUDITORÍA',
      type: 'select',
      options: [
        { value: 'full', label: 'Auditoría Completa' },
        { value: 'competitive', label: 'Análisis Competitivo' },
        { value: 'technical', label: 'Solo Técnico' },
      ],
      required: true,
    },
    {
      name: 'historial_trafico',
      label: 'HISTORIAL DE TRÁFICO / METAS',
      type: 'textarea',
      placeholder: 'Tráfico actual, caídas recientes, objetivos de crecimiento...',
    },
  ],
}

export default function SeoAuditPage() {
  const handleGenerate = async (formData: Record<string, any>) => {
    const res = await fetch('/api/toolkit/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool_slug: 'seo-audit',
        input_data: formData,
      }),
    })

    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || 'Failed to generate')
    }

    return await res.json()
  }

  return (
    <ToolRunnerPage
      config={TOOL_CONFIG}
      onGenerate={handleGenerate}
      resultComponent={SeoAuditResult}
    />
  )
}

function SeoAuditResult({ data }: { data?: any }) {
  // Map statCards from response or use fallback
  const statCards = data?.statCards || [
    { label: 'Pages Indexed', value: '142', color: '#22c55e' },
    { label: 'Core Web Vitals', value: 'Needs Work', color: '#f59e0b' },
    { label: 'Ranking Keywords', value: '1,247', color: '#3b82f6' },
    { label: 'Backlink Profile', value: '3.2K', color: '#a78bfa' },
  ]

  return (
    <ReportTemplate
      title="SEO Audit Report"
      subtitle="Complete technical & content analysis with competitive benchmarking"
      score={data?.overall_score || 72}
      scoreLabel={data?.scoreLabel || 'SEO Health Score'}
      statCards={statCards}
      sections={data?.sections || [
        {
          title: 'Technical SEO',
          findings: [
            {
              id: 1,
              title: 'Mobile responsiveness issues',
              severity: 'critical',
              description: 'Viewport configuration missing on 12 pages. Affects mobile ranking signal.',
              impact: '-15% mobile search traffic',
            },
            {
              id: 2,
              title: 'Page speed optimization',
              severity: 'warning',
              description: 'Average LCP is 3.2s. Target <2.5s for competitive advantage.',
              impact: '-8% conversion rate',
            },
            {
              id: 3,
              title: 'XML sitemap',
              severity: 'ok',
              description: 'Sitemap.xml configured correctly with 142 URLs.',
            },
          ],
        },
        {
          title: 'Content Strategy',
          findings: [
            {
              id: 4,
              title: 'Keyword gap analysis',
              severity: 'warning',
              description: 'Missing content for "recetas fáciles" compared to top 3 competitors.',
              impact: '+12% traffic potential',
            },
            {
              id: 5,
              title: 'Content freshness',
              severity: 'ok',
              description: '68% of pages updated in last 6 months.',
            },
          ],
        },
        {
          title: 'Competitive Analysis',
          content: `Top Competitor Benchmarks:
- salsa-restaurant.es: 187 indexed pages, 4.2K backlinks, better mobile speed
- recetas-mexican.es: Stronger in "recetas fáciles" vertical (targeting 45+ keywords)
- burgers-madrid.es: Higher DA (42 vs your 38), recent link acquisition`,
        },
      ]}
      actions={data?.actions || [
        {
          id: 1,
          title: 'Fix mobile viewport meta tag',
          priority: 'high',
          impact: '+15% mobile traffic',
          effort: '1 hour',
          owner: 'Dev team',
        },
        {
          id: 2,
          title: 'Optimize Core Web Vitals (LCP < 2.5s)',
          priority: 'high',
          impact: '+8% conversions',
          effort: '4 hours',
          owner: 'Performance engineer',
        },
        {
          id: 3,
          title: 'Create content hub for "recetas fáciles"',
          priority: 'high',
          impact: '+12% organic traffic',
          effort: '2 weeks',
          owner: 'Content team',
        },
        {
          id: 4,
          title: 'Build backlinks from food blogs',
          priority: 'medium',
          impact: '+5% DA',
          effort: '3 weeks',
          owner: 'Link builder',
        },
        {
          id: 5,
          title: 'Optimize images & lazy-load',
          priority: 'medium',
          impact: '+2% speed improvement',
          effort: '6 hours',
          owner: 'Dev team',
        },
      ]}
      accentColor="#F87171"
      generatedAt={data?.generatedAt || 'just now'}
    />
  )
}
