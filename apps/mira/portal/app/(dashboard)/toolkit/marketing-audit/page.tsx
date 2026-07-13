'use client'

import ToolRunnerPage, { ToolConfig } from '@/components/ToolRunnerPage'
import ReportTemplate from '@/components/ReportTemplate'

const TOOL_CONFIG: ToolConfig = {
  slug: 'marketing-audit',
  icon: '📊',
  title: 'Marketing Audit',
  subtitle: 'Salsa Burgers',
  timing: '25-35 min',
  brandBrainNote: 'Brand Brain cargado — estrategia anual compilada',
  submitButtonColor: '#60A5FA',
  submitButtonText: 'Generar Marketing Audit',
  fields: [
    {
      name: 'url_sitio',
      label: 'URL DEL SITIO WEB',
      type: 'text',
      placeholder: 'https://www.tusitio.com',
      required: true,
    },
    {
      name: 'canales_actuales',
      label: 'CANALES DE MARKETING ACTUALES',
      type: 'textarea',
      placeholder: 'Uno por línea. Ej:\n- Instagram\n- Email marketing\n- Google Ads\n- SEO orgánico',
      hint: 'Canales que estás usando ahora',
      required: true,
    },
    {
      name: 'presupuesto_anual',
      label: 'PRESUPUESTO ANUAL DE MARKETING',
      type: 'text',
      placeholder: 'Ej: €25.000 o $30.000',
      hint: 'Presupuesto total anual',
      required: true,
    },
    {
      name: 'metricas_clave',
      label: 'MÉTRICAS CLAVE QUE MIDES',
      type: 'textarea',
      placeholder: 'Ej:\n- Tráfico web\n- Tasa de conversión\n- Costo por adquisición\n- ROI',
      required: true,
    },
    {
      name: 'objetivos_trim',
      label: 'OBJETIVOS DEL TRIMESTRE',
      type: 'textarea',
      placeholder: 'Metas específicas para los próximos 3 meses.',
      required: true,
    },
    {
      name: 'competencia_directa',
      label: 'COMPETENCIA DIRECTA',
      type: 'textarea',
      placeholder: 'Nombres o URLs de competidores directos. Uno por línea.',
      required: true,
    },
    {
      name: 'recursos_team',
      label: 'RECURSOS Y EQUIPO',
      type: 'textarea',
      placeholder: 'Ej: 1 social manager, 1 SEO specialist, herramientas disponibles...',
      required: true,
    },
  ],
}

export default function MarketingAuditPage() {
  const handleGenerate = async (formData: Record<string, any>) => {
    const res = await fetch('/api/toolkit/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool_slug: 'marketing-audit',
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
      resultComponent={MarketingAuditResult}
    />
  )
}

function MarketingAuditResult({ data }: { data?: any }) {
  return (
    <ReportTemplate
      title="Marketing Audit Report"
      subtitle="Comprehensive channel analysis, competitor benchmarking & quarterly roadmap"
      score={data?.score || 68}
      scoreLabel="Marketing Health Score"
      statCards={[
        { label: 'Active Channels', value: data?.channels || '4', color: '#22c55e' },
        { label: 'Quarterly Reach', value: data?.reach || '145K', color: '#3b82f6' },
        { label: 'Campaign ROI', value: data?.roi || '3.2x', color: '#a78bfa' },
        { label: 'Team Efficiency', value: data?.efficiency || '78%', color: '#f59e0b' },
      ]}
      sections={[
        {
          title: 'Channel Performance',
          findings: [
            {
              id: 1,
              title: 'Instagram underperforming on engagement',
              severity: 'critical',
              description: 'Engagement rate dropped 35% YoY. Posting frequency too low (1x/week vs competitors 4x/week).',
              impact: '-€8.5K quarterly revenue',
            },
            {
              id: 2,
              title: 'Email list decay',
              severity: 'warning',
              description: 'Unsubscribe rate 2.1% (industry avg 0.5%). No re-engagement campaigns in 6 months.',
              impact: '-12K engaged subscribers',
            },
            {
              id: 3,
              title: 'Google Ads optimization',
              severity: 'ok',
              description: 'ROAS 3.8x, CPA €12. Competitive bid strategy well-tuned.',
            },
            {
              id: 4,
              title: 'Organic search growth',
              severity: 'ok',
              description: 'Ranking for 127 keywords (+48 YoY). Top 10 positions for 23 high-intent keywords.',
            },
          ],
        },
        {
          title: 'Competitive Landscape',
          findings: [
            {
              id: 5,
              title: 'Competitor content velocity',
              severity: 'warning',
              description: 'Top competitor (salsa-central.es) publishing 12 pieces/month vs your 4. Winning share-of-voice.',
              impact: '-18% social reach',
            },
            {
              id: 6,
              title: 'Email list size gap',
              severity: 'warning',
              description: 'Your list: 24K. Competitor: 78K. They capture emails via 3 lead magnets you lack.',
              impact: 'Lower customer LTV',
            },
          ],
        },
        {
          title: 'Budget Allocation Analysis',
          content: `Current spend (€25,000/year):
- Google Ads: 45% (€11,250) → ROAS 3.8x ✓ Continue
- Social media tools & ads: 25% (€6,250) → Engagement declining
- Email platform & automation: 15% (€3,750) → List decaying
- SEO & content: 15% (€3,750) → Best organic growth

Recommended reallocation:
- Reduce Ads (over-optimized) → 35% (€8,750)
- Increase content production → 25% (€6,250)
- Email nurture system → 20% (€5,000)
- Influencer partnerships (new) → 20% (€5,000)`,
        },
      ]}
      actions={[
        {
          id: 1,
          title: 'Implement Instagram content calendar (3x/week minimum)',
          priority: 'high',
          impact: '+35% engagement rate (restore to baseline)',
          effort: '4 hours setup, 6h/week ongoing',
          owner: 'Social manager',
        },
        {
          id: 2,
          title: 'Launch email re-engagement campaign + weekly newsletter',
          priority: 'high',
          impact: '+5K active subscribers, +€4K quarterly revenue',
          effort: '8 hours setup, 2h/week ongoing',
          owner: 'Email specialist',
        },
        {
          id: 3,
          title: 'Build 3 lead magnets (guide, template, webinar)',
          priority: 'high',
          impact: '+18K emails captured annually, close competitive gap',
          effort: '2 weeks',
          owner: 'Content + Design team',
        },
        {
          id: 4,
          title: 'Hire freelance content writer (2 posts/week)',
          priority: 'medium',
          impact: '+8 pieces/month, +48% social reach',
          effort: 'Hiring: 1 week, ongoing 6h/week',
          owner: 'Marketing lead',
        },
        {
          id: 5,
          title: 'Pilot influencer partnerships (micro, 3 influencers)',
          priority: 'medium',
          impact: '+45K reach, +€2K revenue',
          effort: 'Outreach & management: 6h/week',
          owner: 'Growth team',
        },
        {
          id: 6,
          title: 'Optimize Google Ads for lower-funnel keywords',
          priority: 'low',
          impact: '+0.3x ROAS (modest, budget-dependent)',
          effort: '2 hours/month optimization',
          owner: 'PPC specialist',
        },
      ]}
      accentColor="#60A5FA"
      generatedAt="just now"
    />
  )
}
