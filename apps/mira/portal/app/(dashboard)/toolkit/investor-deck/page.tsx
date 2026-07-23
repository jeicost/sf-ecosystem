'use client'

import ToolRunnerPage, { ToolConfig } from '@/components/ToolRunnerPage'
import { getStoredProjectId } from '@/lib/project-context'
import { InvestorDeckResult } from './investor-deck-result'

const TOOL_CONFIG: ToolConfig = {
  slug: 'investor-deck',
  icon: '💰',
  title: 'Investor Deck',
  subtitle: 'Salsa Burgers',
  timing: '45-60 min',
  brandBrainNote: 'Brand Brain cargado — mercado y posicionamiento analizados',
  submitButtonColor: '#10B981',
  submitButtonText: 'Generar Investor Deck',
  fields: [
    {
      name: 'company_name',
      label: 'NOMBRE DE LA EMPRESA',
      type: 'text',
      placeholder: 'Ej: Salsa Burgers',
      required: true,
    },
    {
      name: 'stage',
      label: 'ETAPA DE LA EMPRESA',
      type: 'select',
      options: [
        { value: 'pre-seed', label: 'Pre-Seed' },
        { value: 'seed', label: 'Seed' },
        { value: 'series-a', label: 'Series A' },
        { value: 'series-b', label: 'Series B' },
      ],
      required: true,
    },
    {
      name: 'problem_market_size',
      label: 'PROBLEMA Y TAMAÑO DE MERCADO',
      type: 'textarea',
      placeholder: 'Describe el problema que resuelves y el tamaño del mercado (TAM/SAM/SOM)',
      required: true,
    },
    {
      name: 'solution_traction',
      label: 'SOLUCIÓN Y TRACIÓN',
      type: 'textarea',
      placeholder: 'Qué estás construyendo y qué tración has alcanzado (usuarios, MRR, etc.)',
      required: true,
    },
    {
      name: 'team_background',
      label: 'EQUIPO',
      type: 'textarea',
      placeholder: 'Nombres, roles y background relevante de los fundadores',
      required: true,
    },
    {
      name: 'funding_ask',
      label: 'CANTIDAD SOLICITADA',
      type: 'text',
      placeholder: 'Ej: $500K, $2M, etc.',
      required: true,
    },
    {
      name: 'use_of_funds',
      label: 'CÓMO USARÁS LOS FONDOS',
      type: 'textarea',
      placeholder: 'En qué gastarás el dinero (% a cada área)',
      required: true,
    },
    {
      name: 'valuation_terms',
      label: 'VALORACIÓN / TÉRMINOS',
      type: 'text',
      placeholder: 'Ej: $5M pre-money, o "aún por definir"',
    },
    {
      name: 'board_advisors',
      label: 'BOARD / ADVISORS',
      type: 'textarea',
      placeholder: 'Nombres y background de board members o advisors, si ya los tienes. Déjalo en blanco si no aplica.',
    },
  ],
}

export default function InvestorDeckPage() {
  const handleGenerate = async (formData: Record<string, any>) => {
    const res = await fetch('/api/toolkit/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool_slug: 'investor-deck',
        input_data: formData,
        project_id: getStoredProjectId(),
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
      resultComponent={InvestorDeckResult}
    />
  )
}
