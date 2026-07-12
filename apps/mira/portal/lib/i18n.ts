// Centralized i18n translations for MIRA Portal
// Usage: t('key', locale) — locale: 'es' | 'en'

type Locale = 'es' | 'en'

const translations: Record<Locale, Record<string, string>> = {
  es: {
    // UI
    'nav.home': 'Inicio',
    'nav.brand-brain': 'Brand Brain',
    'nav.toolkit': 'Toolkit',
    'nav.quick-actions': 'Acciones Rápidas',
    'nav.integrations': 'Integraciones',
    'nav.admin': 'Admin',
    'nav.logout': 'Cerrar sesión',
    'nav.language': 'Idioma',

    // Brand Brain
    'brain.title': 'Mi Brand Brain',
    'brain.subtitle': 'Perfil de marca, pilares de contenido y voz',
    'brain.identity': 'Tu Identidad',
    'brain.edit-profile': 'Editar Perfil',
    'brain.content-pillars': 'Pilares de Contenido',
    'brain.configure-pillars': 'Configurar Pilares',
    'brain.no-configured': 'No configurado',
    'brain.status': 'Estado Actual',

    // Toolkit
    'toolkit.title': 'Centro de Herramientas',
    'toolkit.generate': 'Generar',
    'toolkit.download-pdf': 'Descargar PDF',
    'toolkit.save-to-drive': 'Guardar en Google Drive',
    'toolkit.result': 'Resultado',

    // Quick Actions
    'actions.title': 'Acciones Rápidas',
    'actions.generating': 'Generando...',
    'actions.complete': 'Completado',
    'actions.save-to-memory': 'Guardar en Memoria',
    'actions.copy': 'Copiar',

    // Agents (30)
    'agent.orchestrator': 'Marco — Orquestador',
    'agent.strategos': 'Strategos — Arquitecto Estratégico',
    'agent.atlas': 'Atlas — Cartógrafo de Sistemas',
    'agent.content-strategist': 'Luna — Estratega de Contenido',
    'agent.copywriter': 'Alex — Copywriter',
    'agent.herald': 'Herald — Anunciador',
    'agent.designer': 'Zoe — Diseñador',
    'agent.video-editor': 'Kai — Editor de Video',
    'agent.social-media-manager': 'Noa — Estratega Social',
    'agent.community-manager': 'Sam — Community Manager',
    'agent.ads-manager': 'Riva — Gestor de Anuncios',
    'agent.lead-scout': 'Rex — Cazador de Leads',
    'agent.icp-scorer': 'Vera — Calificador ICP',
    'agent.icebreaker-writer': 'Finn — Escritor de Icebreakers',
    'agent.reply-qualifier': 'Quinn — Calificador de Respuestas',
    'agent.proposal-writer': 'Nova — Arquitecta de Propuestas',
    'agent.blueprint': 'Blueprint — Planificador',
    'agent.kairos': 'Kairos — Experto en Timing',
    'agent.radar': 'Radar — Oficial de Inteligencia',
    'agent.pulse': 'Pulse — Guardián de Métricas',
    'agent.ledger': 'Ledger — Guardián de Datos',
    'agent.spark': 'Spark — Motor de Ideación',
    'agent.venture': 'Venture — Cazador de Oportunidades',
    'agent.scout': 'Scout — Explorador',
    'agent.oracle': 'Oracle — Predictor',
    'agent.quant': 'Quant — Analista Cuantitativo',
    'agent.fiscal': 'Fiscal — Estratega Financiero',
    'agent.midas': 'Midas — Especialista en Monetización',
    'agent.onboard': 'Onboard — Arquitecto de Onboarding',
    'agent.harbor': 'Harbor — Fortaleza Estratégica',

    // Common
    'common.loading': 'Cargando...',
    'common.error': 'Error',
    'common.success': 'Éxito',
    'common.cancel': 'Cancelar',
    'common.save': 'Guardar',
    'common.delete': 'Eliminar',
    'common.edit': 'Editar',
  },

  en: {
    // UI
    'nav.home': 'Home',
    'nav.brand-brain': 'Brand Brain',
    'nav.toolkit': 'Toolkit',
    'nav.quick-actions': 'Quick Actions',
    'nav.integrations': 'Integrations',
    'nav.admin': 'Admin',
    'nav.logout': 'Logout',
    'nav.language': 'Language',

    // Brand Brain
    'brain.title': 'My Brand Brain',
    'brain.subtitle': 'Brand profile, content pillars, and voice',
    'brain.identity': 'Your Identity',
    'brain.edit-profile': 'Edit Profile',
    'brain.content-pillars': 'Content Pillars',
    'brain.configure-pillars': 'Configure Pillars',
    'brain.no-configured': 'Not configured',
    'brain.status': 'Current Status',

    // Toolkit
    'toolkit.title': 'Toolkit',
    'toolkit.generate': 'Generate',
    'toolkit.download-pdf': 'Download PDF',
    'toolkit.save-to-drive': 'Save to Google Drive',
    'toolkit.result': 'Result',

    // Quick Actions
    'actions.title': 'Quick Actions',
    'actions.generating': 'Generating...',
    'actions.complete': 'Complete',
    'actions.save-to-memory': 'Save to Memory',
    'actions.copy': 'Copy',

    // Agents (30)
    'agent.orchestrator': 'Marco — Orchestrator',
    'agent.strategos': 'Strategos — Strategic Architect',
    'agent.atlas': 'Atlas — System Mapper',
    'agent.content-strategist': 'Luna — Content Strategist',
    'agent.copywriter': 'Alex — Copywriter',
    'agent.herald': 'Herald — Announcer',
    'agent.designer': 'Zoe — Designer',
    'agent.video-editor': 'Kai — Video Editor',
    'agent.social-media-manager': 'Noa — Social Strategist',
    'agent.community-manager': 'Sam — Community Builder',
    'agent.ads-manager': 'Riva — Ads Strategist',
    'agent.lead-scout': 'Rex — Lead Scout',
    'agent.icp-scorer': 'Vera — ICP Scorer',
    'agent.icebreaker-writer': 'Finn — Icebreaker Writer',
    'agent.reply-qualifier': 'Quinn — Reply Qualifier',
    'agent.proposal-writer': 'Nova — Proposal Architect',
    'agent.blueprint': 'Blueprint — Planner',
    'agent.kairos': 'Kairos — Timing Expert',
    'agent.radar': 'Radar — Intelligence Officer',
    'agent.pulse': 'Pulse — Metrics Guardian',
    'agent.ledger': 'Ledger — Data Keeper',
    'agent.spark': 'Spark — Ideation Engine',
    'agent.venture': 'Venture — Opportunity Hunter',
    'agent.scout': 'Scout — Explorer',
    'agent.oracle': 'Oracle — Predictor',
    'agent.quant': 'Quant — Quantitative Analyst',
    'agent.fiscal': 'Fiscal — Finance Strategist',
    'agent.midas': 'Midas — Monetization Specialist',
    'agent.onboard': 'Onboard — Onboarding Architect',
    'agent.harbor': 'Harbor — Strategy Fortress',

    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
  },
}

export function t(key: string, locale: Locale = 'es'): string {
  return translations[locale]?.[key] ?? translations['en']?.[key] ?? key
}

export const locales: Locale[] = ['es', 'en']
export const defaultLocale: Locale = 'es'
