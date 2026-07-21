// Quick prompt suggestions for each agent role
// Shown in empty chat state, helps users start conversations

export const AGENT_QUICK_PROMPTS: Record<string, string[]> = {
  orchestrator: [
    'Necesito coordinar una nueva campaña — dime quién ejecuta y en qué orden',
    'Revisa el pipeline de esta semana y prioriza por urgencia',
    'Genera un brief que distribuya el trabajo entre el equipo',
  ],
  'content-strategist': [
    'Dame 5 ángulos frescos para contenido sobre [tema]',
    'Analiza tendencias virales esta semana en nuestro sector',
    'Genera briefs de contenido para todas las plataformas',
  ],
  copywriter: [
    'Reescribe este copy en el tono de nuestra marca',
    'Escribe 3 variantes de copy para un carousel de IG',
    'Genera headlines que cumplan con nuestro brand voice',
  ],
  designer: [
    'Dame un brief visual completo para [concepto]',
    'Diseña una solución gráfica para este contenido',
    'Crea dirección de arte para una campaña',
  ],
  'lead-scout': [
    'Dame mi ICP y genera una lista de leads cualificados',
    'Encuentra 20 leads en [industria] con [criterio]',
    'Identifica oportunidades por trigger events',
  ],
  'icp-scorer': [
    'Puntúa estas 10 leads del 0-100 con justificación',
    'Segmenta nuestro pipeline por probabilidad de cierre',
    'Recalibra el modelo después de nuestros últimos cierres',
  ],
  'icebreaker-writer': [
    'Escribe 3 icebreakers para [prospect] en [industria]',
    'Genera un opener que rompa el hielo sin ser invasivo',
    'A/B test: compara estos dos icebreakers',
  ],
  'social-media-manager': [
    'Planifica el contenido de esta semana para nuestras redes',
    'Escribe 5 posts listos para programar',
    'Crea estrategia de community management para esta semana',
  ],
  strategos: [
    'Arma un plan de 90 días para [objetivo]',
    'Define 3 Strategic Rocks para nuestro Q',
    'Revisa nuestra estrategia y recomienda cambios',
  ],
  blueprint: [
    'Audita nuestro modelo de negocio actual',
    'Diseña un pricing strategy basada en valor',
    'Analiza la salud financiera de este cliente',
  ],
  pulse: [
    'Health check: dime el estado del sistema',
    'Cómo vamos en token usage esta semana?',
    'Hay alerts o logs de error que deba revisar?',
  ],
  'video-editor': [
    'Edita este video con estas instrucciones',
    'Crea una intro de 5 segundos para nuestro branding',
    'Genera 3 variantes de este video para diferentes plataformas',
  ],
  'ads-manager': [
    'Diseña una estrategia de ads para [objetivo]',
    'Optimiza esta campaña de anuncios',
    'Crea creative briefs para Meta/Google ads',
  ],
  'community-manager': [
    'Crea un plan de engagement para esta semana',
    'Responde los últimos comentarios con la voz de marca',
    'Diseña una estrategia para crecer la comunidad',
  ],
  'reply-qualifier': [
    'Clasifica estas respuestas por probabilidad de cierre',
    'Filtra leads que merecen follow-up inmediato',
    'Prioriza replies por urgencia e ICP match',
  ],
  'proposal-writer': [
    'Escribe una propuesta para [cliente] con [scope]',
    'Genera términos y condiciones estándar',
    'Crea un deck ejecutivo de propuesta',
  ],
  atlas: [
    'Mapea tendencias emergentes en [sector]',
    'Analiza el landscape competitivo actual',
    'Construye 3 escenarios futuros para nuestro negocio',
    'Identifica oportunidades de mercado no exploradas',
  ],
  onboard: [
    'Diseña un programa de onboarding para el equipo',
    'Crea training sobre [topic] para capacitación',
    'Desarrolla un plan de upskilling para [rol]',
  ],
  midas: [
    'Cómo podemos aumentar ingresos en un 30%?',
    'Optimiza nuestro pricing para maximizar LTV',
    'Identifica leaks en nuestro pipeline de ingresos',
  ],
  quant: [
    'Analiza estos datos y dame insights clave',
    'Crea un dashboard de KPIs para [área]',
    'Construye un modelo predictivo para [métrica]',
  ],
  fiscal: [
    'Audita nuestras finanzas del trimestre',
    'Revisa cumplimiento fiscal y normativo',
    'Genera reportes financieros consolidados',
  ],
  harbor: [
    'Redacta la respuesta a este ticket de cliente',
    'Crea una FAQ con las dudas más frecuentes de nuestros clientes',
    'Diseña una plantilla de respuesta para [tipo de incidencia]',
  ],
  spark: [
    'Brainstormea 10 ideas nuevas para [objetivo]',
    'Cómo podríamos innovar en [área]?',
    'Genera conceptos disruptivos para nuestro sector',
  ],
}

export function getQuickPrompts(role: string): string[] {
  return AGENT_QUICK_PROMPTS[role] || [
    'Cuéntame qué necesitas',
    'Cómo puedo ayudarte?',
    'Qué te ocupa en este momento?',
  ]
}
