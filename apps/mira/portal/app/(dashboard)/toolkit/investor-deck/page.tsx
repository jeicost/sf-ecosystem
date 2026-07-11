'use client'

import ToolRunnerPage, { ToolConfig } from '@/components/ToolRunnerPage'

const TOOL_CONFIG: ToolConfig = {
  slug: 'investor-deck',
  icon: '📈',
  title: 'Investor Deck',
  subtitle: 'Salsa Burgers',
  timing: '60-90 min',
  brandBrainNote: 'Brand Brain cargado — datos de empresa integrados',
  submitButtonColor: '#34D399',
  submitButtonText: 'Generar Investor Deck',
  fields: [
    {
      name: 'nombre_empresa',
      label: 'NOMBRE DE LA EMPRESA',
      type: 'text',
      placeholder: 'Ej: Salsa Burgers',
      required: true,
    },
    {
      name: 'descripcion_breve',
      label: 'DESCRIPCIÓN BREVE (PITCH DE UNA LÍNEA)',
      type: 'textarea',
      placeholder: 'La propuesta de valor más concisa. Ej: "Comida rápida premium entregada en menos de 20 minutos".',
      required: true,
    },
    {
      name: 'problema_solved',
      label: 'PROBLEMA QUE RESUELVES',
      type: 'textarea',
      placeholder: 'Qué problema del mercado soluciona tu empresa.',
      required: true,
    },
    {
      name: 'mercado_tam',
      label: 'MERCADO TOTAL ALCANZABLE (TAM)',
      type: 'text',
      placeholder: 'Ej: $500M o €400M',
      hint: 'Total Addressable Market en tu segmento',
      required: true,
    },
    {
      name: 'traccion_actual',
      label: 'TRACCIÓN ACTUAL',
      type: 'textarea',
      placeholder: 'Ingresos, usuarios activos, clientes, métricas de crecimiento...',
      required: true,
    },
    {
      name: 'equipo_description',
      label: 'DESCRIPCIÓN DEL EQUIPO',
      type: 'textarea',
      placeholder: 'Fundadores, experiencias clave, especialidades del equipo.',
      required: true,
    },
    {
      name: 'ronda_size',
      label: 'TAMAÑO DE LA RONDA',
      type: 'text',
      placeholder: 'Ej: $500K o €400K',
      hint: 'Cuánto capital buscas',
      required: true,
    },
    {
      name: 'uso_fondos',
      label: 'USO DE FONDOS',
      type: 'textarea',
      placeholder: 'Cómo vas a usar el dinero. Ej: 40% producto, 30% marketing, 20% equipo, 10% ops...',
      required: true,
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
      resultComponent={<InvestorDeckResult />}
    />
  )
}

function InvestorDeckResult() {
  return (
    <div className="card p-6 space-y-6">
      <div>
        <p className="text-xs uppercase tracking-widest font-semibold mb-4" style={{ color: '#34D399' }}>
          ✓ Investor Deck Generado
        </p>
        <p className="text-sm text-gray-400">Tu presentación para inversores está lista con análisis de mercado y financiero.</p>
      </div>
    </div>
  )
}
