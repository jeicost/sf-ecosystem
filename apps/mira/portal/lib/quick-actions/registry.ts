// Registro declarativo de las quick actions: ÚNICO origen de verdad para el
// formulario (QuickActionForm), el chat guiado (/api/quick-actions/guided) y
// la generación (generate.ts). Datos puros — sin JSX ni imports de cliente —
// para que sea importable igual desde server y client.
//
// REGLA DE ORO: field.name == la clave de input_data que el prompt de
// lib/generation/quick-action-prompts.ts espera. Cambiar un name aquí sin
// tocar el prompt rompe la paridad silenciosamente.

export type QAFieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'select'
  | 'checkbox_group'
  | 'toggle'
  | 'lead_picker'

export type QAAutofillSource = 'tone' | 'audience' | 'industry' | 'brand_colors' | 'company_name'

export interface QAFieldOption {
  value: string
  labelKey?: string // sin labelKey, el value se muestra tal cual (p.ej. "Instagram")
}

export interface QAField {
  name: string
  type: QAFieldType
  labelKey: string
  placeholderKey?: string
  required?: boolean
  options?: QAFieldOption[]
  defaultValue?: string | number | boolean
  min?: number
  max?: number
  /** Precarga desde Brand Brain/ICP — no preguntar lo que ya sabemos */
  autofill?: QAAutofillSource
  /** Visibilidad dependiente de otro campo (p.ej. style solo si with_image) */
  visibleWhen?: { field: string; equals: string | number | boolean }
  /** Instrucción extra para el entrevistador del modo guiado */
  guidedHint?: string
}

export interface QuickActionDef {
  id: string // == action_type (branch del prompt)
  department: 'marketing' | 'strategy' | 'comercial' | 'finanzas' | 'admin'
  titleKey: string
  descriptionKey: string
  outputType: 'social_post' | 'newsletter' | 'video' | 'image' | 'text' | 'structured'
  /** Output type dependiente del input (toggles con imagen) */
  resolveOutputType?: (input: Record<string, unknown>) => string
  fields: QAField[]
  /** default true; false solo si adjuntar no aporta nada a la acción */
  acceptsAttachments?: boolean
  /** La acción NECESITA un adjunto de este tipo (editar_imagen_visual) */
  requiredAttachment?: 'image'
  resultActions?: {
    openInDiscovery?: boolean
    saveToLead?: boolean
  }
}

const PLATFORM_OPTIONS: QAFieldOption[] = [
  { value: 'instagram' },
  { value: 'linkedin' },
  { value: 'twitter' },
]

export const QUICK_ACTIONS: QuickActionDef[] = [
  // ── MARKETING ──────────────────────────────────────────────────────────
  {
    id: 'crear_post',
    department: 'marketing',
    titleKey: 'actions.marketing.crear_post',
    descriptionKey: 'actions.marketing.crear_post.desc',
    outputType: 'social_post',
    resolveOutputType: (input) => (input.with_image ? 'image' : 'social_post'),
    fields: [
      { name: 'topic', type: 'text', labelKey: 'qa.field.topic', required: true },
      { name: 'platform', type: 'select', labelKey: 'qa.field.platform', required: true, options: PLATFORM_OPTIONS },
      {
        name: 'tone', type: 'select', labelKey: 'qa.field.tone', required: true,
        options: [
          { value: 'professional', labelKey: 'qa.opt.professional' },
          { value: 'casual', labelKey: 'qa.opt.casual' },
          { value: 'humorous', labelKey: 'qa.opt.humorous' },
        ],
        guidedHint: 'Propón el tono según el tone_of_voice del Brand Brain en vez de preguntar.',
      },
      { name: 'with_image', type: 'toggle', labelKey: 'qa.field.with_image', defaultValue: false },
      { name: 'style', type: 'text', labelKey: 'qa.field.image_style', visibleWhen: { field: 'with_image', equals: true } },
    ],
  },
  {
    id: 'crear_newsletter',
    department: 'marketing',
    titleKey: 'actions.marketing.crear_newsletter',
    descriptionKey: 'actions.marketing.crear_newsletter.desc',
    outputType: 'newsletter',
    fields: [
      { name: 'theme', type: 'text', labelKey: 'qa.field.theme', required: true },
      { name: 'tone', type: 'text', labelKey: 'qa.field.tone_free', autofill: 'tone' },
      { name: 'article_count', type: 'number', labelKey: 'qa.field.article_count', defaultValue: 5, min: 1, max: 10 },
    ],
  },
  {
    id: 'crear_video_brief',
    department: 'marketing',
    titleKey: 'actions.marketing.crear_video_brief',
    descriptionKey: 'actions.marketing.crear_video_brief.desc',
    outputType: 'video',
    fields: [
      { name: 'product', type: 'text', labelKey: 'qa.field.product', required: true },
      {
        name: 'duration', type: 'select', labelKey: 'qa.field.duration', required: true,
        options: [{ value: '15s' }, { value: '30s' }, { value: '60s' }],
      },
      {
        name: 'style', type: 'select', labelKey: 'qa.field.video_style', required: true,
        options: [
          { value: 'educational', labelKey: 'qa.opt.educational' },
          { value: 'entertaining', labelKey: 'qa.opt.entertaining' },
          { value: 'testimonial', labelKey: 'qa.opt.testimonial' },
        ],
      },
    ],
  },
  {
    id: 'crear_carousel',
    department: 'marketing',
    titleKey: 'actions.marketing.crear_carousel',
    descriptionKey: 'actions.marketing.crear_carousel.desc',
    outputType: 'structured',
    resolveOutputType: (input) => (input.with_image ? 'image' : 'structured'),
    fields: [
      { name: 'idea', type: 'textarea', labelKey: 'qa.field.idea', required: true },
      { name: 'brand_colors', type: 'text', labelKey: 'qa.field.brand_colors', autofill: 'brand_colors' },
      { name: 'slide_count', type: 'number', labelKey: 'qa.field.slide_count', defaultValue: 5, min: 2, max: 10 },
      { name: 'with_image', type: 'toggle', labelKey: 'qa.field.with_image', defaultValue: false },
      { name: 'style', type: 'text', labelKey: 'qa.field.image_style', visibleWhen: { field: 'with_image', equals: true } },
    ],
  },
  {
    id: 'crear_campaña_ads',
    department: 'marketing',
    titleKey: 'actions.marketing.crear_campaña_ads',
    descriptionKey: 'actions.marketing.crear_campaña_ads.desc',
    outputType: 'structured',
    fields: [
      {
        name: 'goal', type: 'select', labelKey: 'qa.field.goal', required: true,
        options: [
          { value: 'awareness', labelKey: 'qa.opt.awareness' },
          { value: 'conversion', labelKey: 'qa.opt.conversion' },
          { value: 'retention', labelKey: 'qa.opt.retention' },
        ],
      },
      { name: 'budget', type: 'number', labelKey: 'qa.field.budget', required: true, min: 0 },
      { name: 'audience', type: 'text', labelKey: 'qa.field.audience', autofill: 'audience' },
    ],
  },
  {
    id: 'editar_imagen_visual',
    department: 'marketing',
    titleKey: 'actions.marketing.editar_imagen_visual',
    descriptionKey: 'actions.marketing.editar_imagen_visual.desc',
    outputType: 'image',
    requiredAttachment: 'image',
    fields: [
      { name: 'refinement', type: 'textarea', labelKey: 'qa.field.refinement', required: true },
      {
        name: 'preserveElements', type: 'select', labelKey: 'qa.field.preserve_elements',
        options: [
          { value: '', labelKey: 'qa.opt.none' },
          { value: 'text', labelKey: 'qa.opt.preserve_text' },
          { value: 'logo', labelKey: 'qa.opt.preserve_logo' },
          { value: 'layout', labelKey: 'qa.opt.preserve_layout' },
        ],
      },
    ],
  },

  // ── STRATEGY ───────────────────────────────────────────────────────────
  {
    id: 'generar_reporte',
    department: 'strategy',
    titleKey: 'actions.strategy.generar_reporte',
    descriptionKey: 'actions.strategy.generar_reporte.desc',
    outputType: 'structured',
    fields: [
      {
        name: 'period', type: 'select', labelKey: 'qa.field.period', required: true,
        options: [
          { value: 'weekly', labelKey: 'qa.opt.weekly' },
          { value: 'monthly', labelKey: 'qa.opt.monthly' },
          { value: 'quarterly', labelKey: 'qa.opt.quarterly' },
        ],
      },
      {
        name: 'metrics', type: 'checkbox_group', labelKey: 'qa.field.metrics',
        options: [{ value: 'revenue' }, { value: 'mrr' }, { value: 'churn' }],
      },
      {
        name: 'datos_reales', type: 'textarea', labelKey: 'qa.field.datos_reales',
        guidedHint: 'Sin datos reales el informe queda en recomendaciones — sugiere adjuntar un export o pegar cifras.',
      },
    ],
  },
  // (analizar_competencia eliminada 2026-07-28: fusionada en el report
  //  competitive-analysis — /strategy/plan tab Competencia, modo 'Radar rápido'.
  //  Históricos: unified-history renderiza action_type crudo, sin registry.)
  {
    id: 'analizar_tendencias',
    department: 'strategy',
    titleKey: 'actions.strategy.tendencias_analisis',
    descriptionKey: 'actions.strategy.tendencias_analisis.desc',
    outputType: 'structured',
    fields: [
      { name: 'sector', type: 'text', labelKey: 'qa.field.sector', required: true, autofill: 'industry' },
      {
        name: 'region', type: 'select', labelKey: 'qa.field.region', required: true,
        options: [
          { value: 'españa', labelKey: 'qa.opt.spain' },
          { value: 'europa', labelKey: 'qa.opt.europe' },
          { value: 'global', labelKey: 'qa.opt.global' },
        ],
      },
    ],
  },
  {
    id: 'roadmap_innovacion',
    department: 'strategy',
    titleKey: 'actions.strategy.plan_innovacion',
    descriptionKey: 'actions.strategy.plan_innovacion.desc',
    outputType: 'structured',
    fields: [
      { name: 'current_state', type: 'textarea', labelKey: 'qa.field.current_state', required: true },
      { name: 'strategic_goal', type: 'text', labelKey: 'qa.field.strategic_goal', required: true },
      {
        name: 'timeline', type: 'select', labelKey: 'qa.field.timeline', required: true,
        options: [
          { value: '3', labelKey: 'qa.opt.months3' },
          { value: '6', labelKey: 'qa.opt.months6' },
          { value: '12', labelKey: 'qa.opt.months12' },
        ],
      },
    ],
  },

  // ── COMERCIAL ──────────────────────────────────────────────────────────
  {
    id: 'crear_campaña',
    department: 'comercial',
    titleKey: 'actions.comercial.crear_campaña',
    descriptionKey: 'actions.comercial.crear_campaña.desc',
    outputType: 'structured',
    resultActions: { openInDiscovery: true },
    fields: [
      { name: 'client_name', type: 'text', labelKey: 'qa.field.client_name', required: true, autofill: 'company_name' },
      { name: 'industry', type: 'text', labelKey: 'qa.field.target_industry', autofill: 'industry' },
      { name: 'target_count', type: 'number', labelKey: 'qa.field.target_count', required: true, defaultValue: 10, min: 1, max: 50 },
    ],
  },
  {
    id: 'responder_objecion',
    department: 'comercial',
    titleKey: 'actions.comercial.responder_objecion',
    descriptionKey: 'actions.comercial.responder_objecion.desc',
    outputType: 'text',
    resultActions: { saveToLead: true },
    fields: [
      {
        name: 'objection', type: 'textarea', labelKey: 'qa.field.objection', required: true,
        placeholderKey: 'qa.field.objection.ph',
        guidedHint: 'Si el usuario adjunta el hilo de email, extrae la objeción de ahí.',
      },
      { name: 'lead_id', type: 'lead_picker', labelKey: 'qa.lead.label' },
    ],
  },
  {
    id: 'email_seguimiento',
    department: 'comercial',
    titleKey: 'actions.comercial.email_seguimiento',
    descriptionKey: 'actions.comercial.email_seguimiento.desc',
    outputType: 'text',
    resultActions: { saveToLead: true },
    fields: [
      {
        name: 'context', type: 'textarea', labelKey: 'qa.field.followup_context', required: true,
        placeholderKey: 'qa.field.followup_context.ph',
        guidedHint: 'Si el usuario adjunta el hilo, deduce el contexto (qué se envió, hace cuánto, respuesta previa).',
      },
      { name: 'lead_id', type: 'lead_picker', labelKey: 'qa.lead.label' },
    ],
  },
  {
    id: 'preparar_llamada',
    department: 'comercial',
    titleKey: 'actions.comercial.preparar_llamada',
    descriptionKey: 'actions.comercial.preparar_llamada.desc',
    outputType: 'structured',
    resultActions: { saveToLead: true },
    fields: [
      { name: 'call_goal', type: 'text', labelKey: 'qa.field.call_goal', required: true, placeholderKey: 'qa.field.call_goal.ph' },
      {
        name: 'lead_id', type: 'lead_picker', labelKey: 'qa.lead.label',
        guidedHint: 'Ofrece los leads calientes del pipeline — el brief mejora mucho con lead elegido.',
      },
    ],
  },

  // ── FINANZAS ───────────────────────────────────────────────────────────
  {
    id: 'proyeccion_financiera',
    department: 'finanzas',
    titleKey: 'actions.finanzas.proyeccion_financiera',
    descriptionKey: 'actions.finanzas.proyeccion_financiera.desc',
    outputType: 'structured',
    fields: [
      { name: 'current_revenue', type: 'number', labelKey: 'qa.field.current_revenue', required: true, min: 0 },
      { name: 'growth_rate', type: 'number', labelKey: 'qa.field.growth_rate' },
      {
        name: 'scenario', type: 'select', labelKey: 'qa.field.scenario', required: true,
        options: [
          { value: 'conservative', labelKey: 'qa.opt.conservative' },
          { value: 'realistic', labelKey: 'qa.opt.realistic' },
          { value: 'optimistic', labelKey: 'qa.opt.optimistic' },
        ],
      },
    ],
  },
  {
    id: 'analisis_cashflow',
    department: 'finanzas',
    titleKey: 'actions.finanzas.analisis_cash_flow',
    descriptionKey: 'actions.finanzas.analisis_cash_flow.desc',
    outputType: 'structured',
    fields: [
      { name: 'period', type: 'text', labelKey: 'qa.field.cashflow_period', required: true },
      {
        name: 'expenses', type: 'textarea', labelKey: 'qa.field.expenses', required: true,
        guidedHint: 'Sugiere adjuntar el export del banco o el P&L en vez de teclear los gastos.',
      },
    ],
  },
  {
    id: 'optimizar_costos',
    department: 'finanzas',
    titleKey: 'actions.finanzas.optimizacion_costos',
    descriptionKey: 'actions.finanzas.optimizacion_costos.desc',
    outputType: 'structured',
    fields: [
      {
        name: 'current_expenses', type: 'textarea', labelKey: 'qa.field.current_expenses', required: true,
        guidedHint: 'Sugiere adjuntar el desglose real de gastos (CSV/PDF) — el análisis gana mucho.',
      },
      { name: 'target_savings', type: 'number', labelKey: 'qa.field.target_savings' },
    ],
  },

  // ── ADMIN / OPERATIONS ─────────────────────────────────────────────────
  {
    id: 'responder_ticket',
    department: 'admin',
    titleKey: 'actions.admin.responder_ticket',
    descriptionKey: 'actions.admin.responder_ticket.desc',
    outputType: 'text',
    fields: [
      { name: 'issue', type: 'textarea', labelKey: 'qa.field.issue', required: true },
      {
        name: 'customer_type', type: 'select', labelKey: 'qa.field.customer_type',
        options: [
          { value: '', labelKey: 'qa.opt.none' },
          { value: 'enterprise', labelKey: 'qa.opt.enterprise' },
          { value: 'startup', labelKey: 'qa.opt.startup' },
          { value: 'individual', labelKey: 'qa.opt.individual' },
        ],
      },
    ],
  },
  {
    id: 'crear_faq',
    department: 'admin',
    titleKey: 'actions.admin.crear_faq',
    descriptionKey: 'actions.admin.crear_faq.desc',
    outputType: 'structured',
    fields: [
      { name: 'topic', type: 'text', labelKey: 'qa.field.faq_topic', required: true },
      { name: 'product_area', type: 'text', labelKey: 'qa.field.product_area' },
    ],
  },
  {
    id: 'crear_tutorial',
    department: 'admin',
    titleKey: 'actions.admin.crear_tutorial',
    descriptionKey: 'actions.admin.crear_tutorial.desc',
    outputType: 'structured',
    fields: [
      { name: 'feature', type: 'text', labelKey: 'qa.field.feature', required: true },
      {
        name: 'skill_level', type: 'select', labelKey: 'qa.field.skill_level', required: true,
        options: [
          { value: 'beginner', labelKey: 'qa.opt.beginner' },
          { value: 'intermediate', labelKey: 'qa.opt.intermediate' },
          { value: 'advanced', labelKey: 'qa.opt.advanced' },
        ],
      },
    ],
  },
]

export function getQuickAction(id: string): QuickActionDef | undefined {
  return QUICK_ACTIONS.find((a) => a.id === id)
}

export function getQuickActionsByDepartment(
  department: QuickActionDef['department']
): QuickActionDef[] {
  return QUICK_ACTIONS.filter((a) => a.department === department)
}
