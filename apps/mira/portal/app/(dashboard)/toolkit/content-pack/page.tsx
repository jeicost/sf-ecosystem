'use client'

import ToolRunnerPage, { ToolConfig } from '@/components/ToolRunnerPage'

const TOOL_CONFIG: ToolConfig = {
  slug: 'content-pack',
  icon: '📝',
  title: 'Content Pack',
  subtitle: 'Salsa Burgers',
  timing: '45-60 min',
  brandBrainNote: 'Brand Brain cargado — pilares y audiencia definidos',
  submitButtonColor: '#FBBF24',
  submitButtonText: 'Generar Content Pack',
  fields: [
    {
      name: 'tema_principal',
      label: 'TEMA PRINCIPAL DEL CONTENIDO',
      type: 'text',
      placeholder: 'Ej: Recetas de comida rápida saludable',
      required: true,
    },
    {
      name: 'formatos_deseados',
      label: 'FORMATOS DESEADOS',
      type: 'select',
      options: [
        { value: 'blog', label: 'Blog Posts' },
        { value: 'social', label: 'Social Media' },
        { value: 'videos', label: 'Video Scripts' },
        { value: 'whitepapers', label: 'Whitepapers' },
        { value: 'email', label: 'Email Campaigns' },
        { value: 'infografías', label: 'Infografías' },
      ],
      required: true,
    },
    {
      name: 'frecuencia',
      label: 'FRECUENCIA DE PUBLICACIÓN',
      type: 'select',
      options: [
        { value: 'semanal', label: 'Semanal' },
        { value: 'quincenal', label: 'Quincenal' },
        { value: 'mensual', label: 'Mensual' },
        { value: 'trimestral', label: 'Trimestral' },
      ],
      required: true,
    },
    {
      name: 'audiencia_description',
      label: 'DESCRIPCIÓN DE AUDIENCIA',
      type: 'textarea',
      placeholder: 'Quién es tu audiencia objetivo. Edad, intereses, comportamiento...',
      required: true,
    },
    {
      name: 'tono_voz',
      label: 'TONO DE VOZ',
      type: 'select',
      options: [
        { value: 'profesional', label: 'Profesional' },
        { value: 'casual', label: 'Casual / Amigable' },
        { value: 'humorous', label: 'Humorístico' },
        { value: 'educativo', label: 'Educativo' },
      ],
      required: true,
    },
    {
      name: 'casos_uso',
      label: 'CASOS DE USO / ESCENARIOS',
      type: 'textarea',
      placeholder: 'Cómo y dónde se consume tu contenido. Ej: lectura en el almuerzo, consumo en redes sociales...',
      required: true,
    },
    {
      name: 'palabras_clave',
      label: 'PALABRAS CLAVE OBJETIVO',
      type: 'textarea',
      placeholder: 'Una por línea. Términos SEO y temáticos.',
    },
  ],
}

export default function ContentPackPage() {
  const handleGenerate = async (formData: Record<string, any>) => {
    const res = await fetch('/api/toolkit/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool_slug: 'content-pack',
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
      resultComponent={<ContentPackResult />}
    />
  )
}

function ContentPackResult() {
  return (
    <div className="card p-6 space-y-6">
      <div>
        <p className="text-xs uppercase tracking-widest font-semibold mb-4" style={{ color: '#FBBF24' }}>
          ✓ Content Pack Generado
        </p>
        <p className="text-sm text-gray-400">Tu pack de contenido está listo con temas, formatos y calendario editorial.</p>
      </div>
    </div>
  )
}
