import type { AgentStatus, AgentPackage } from './types'
export type { AgentStatus }

export interface Agent {
  id: string
  name: string
  role: string
  tagline: string
  color: string
  gradient: string
  emoji: string
  package: AgentPackage
  capabilities: string[]
}

export const COMERCIAL_AGENTS: Agent[] = [
  {
    id: 'lead-scout',
    name: 'Rex',
    role: 'Lead Scout',
    tagline: 'I find your ideal client before anyone else.',
    color: '#EF4444',
    gradient: 'from-red-500 to-rose-700',
    emoji: '🔍',
    package: 'comercial',
    capabilities: ['Apollo/LinkedIn scraping', 'Data enrichment', 'Trigger event detection', 'Automatic deduplication'],
  },
  {
    id: 'icp-scorer',
    name: 'Vera',
    role: 'ICP Scorer',
    tagline: 'Know who deserves your time before you invest it.',
    color: '#F97316',
    gradient: 'from-orange-500 to-amber-700',
    emoji: '🎯',
    package: 'comercial',
    capabilities: ['0-100 ICP score', 'Hot/warm/cold classification', 'Sector fit analysis', 'Continuous model calibration'],
  },
  {
    id: 'icebreaker-writer',
    name: 'Finn',
    role: 'Icebreaker Writer',
    tagline: 'Every first message feels written by a human.',
    color: '#EAB308',
    gradient: 'from-yellow-400 to-orange-500',
    emoji: '✍️',
    package: 'comercial',
    capabilities: ['Ultra-personalized icebreakers', 'LinkedIn + news-based', 'A/B variants by industry', 'Tone adapted to prospect'],
  },
  {
    id: 'reply-qualifier',
    name: 'Quinn',
    role: 'Reply Qualifier',
    tagline: 'I classify replies and prepare your next move.',
    color: '#22C55E',
    gradient: 'from-green-400 to-emerald-700',
    emoji: '💬',
    package: 'comercial',
    capabilities: ['Reply classification', 'Automatic BANT score', 'Qualification call scheduling', 'Buying signal detection'],
  },
  {
    id: 'proposal-writer',
    name: 'Nova',
    role: 'Proposal Writer',
    tagline: 'Proposals that close. Every time.',
    color: '#3B82F6',
    gradient: 'from-blue-500 to-indigo-700',
    emoji: '📄',
    package: 'comercial',
    capabilities: ['Proposals from call brief', 'Industry personalization', 'Size-adapted pricing', 'Professional Word/PDF format'],
  },
]

export const AGENTS: Agent[] = [
  {
    id: 'orchestrator',
    name: 'Marco',
    role: 'Creative Director',
    tagline: 'I tell you what to do and who does it.',
    color: '#8B5CF6',
    gradient: 'from-violet-600 to-purple-800',
    emoji: '🎬',
    package: 'marketing',
    capabilities: ['Analyzes briefs', 'Coordinates the team', 'Manages approvals', 'Reports results'],
  },
  {
    id: 'content-strategist',
    name: 'Luna',
    role: 'Content Strategist',
    tagline: 'I find the angle nobody saw.',
    color: '#06B6D4',
    gradient: 'from-cyan-500 to-blue-700',
    emoji: '🔍',
    package: 'marketing',
    capabilities: ['Researches trends', 'Analyzes competition', 'Generates briefs', 'Detects viral hooks'],
  },
  {
    id: 'copywriter',
    name: 'Alex',
    role: 'Copywriter',
    tagline: 'I write like you, but better.',
    color: '#F59E0B',
    gradient: 'from-amber-400 to-orange-600',
    emoji: '✍️',
    package: 'marketing',
    capabilities: ['LinkedIn posts', 'Reels scripts', 'IG/TikTok captions', 'Ad copy'],
  },
  {
    id: 'designer',
    name: 'Zoe',
    role: 'Graphic Designer',
    tagline: 'Your brand, in every pixel.',
    color: '#EC4899',
    gradient: 'from-pink-500 to-rose-700',
    emoji: '🎨',
    package: 'marketing',
    capabilities: ['Posts & images', 'Carousels', 'Ad creatives', 'Visual templates'],
  },
  {
    id: 'video-editor',
    name: 'Kai',
    role: 'Video Editor',
    tagline: 'The first frame stops everything.',
    color: '#10B981',
    gradient: 'from-emerald-400 to-teal-700',
    emoji: '🎞️',
    package: 'marketing',
    capabilities: ['Faceless shorts', 'Instagram Reels', 'TikTok videos', 'Podcast clips'],
  },
  {
    id: 'social-media-manager',
    name: 'Noa',
    role: 'Social Media Manager',
    tagline: 'Nothing goes out without my stamp.',
    color: '#3B82F6',
    gradient: 'from-blue-500 to-indigo-700',
    emoji: '📅',
    package: 'marketing',
    capabilities: ['Schedules publications', 'Manages approvals', 'Posts across all platforms', 'Tracks metrics'],
  },
  {
    id: 'ads-manager',
    name: 'Riva',
    role: 'Ads Manager',
    tagline: 'I know what your competition does before they do.',
    color: '#EF4444',
    gradient: 'from-red-500 to-rose-700',
    emoji: '📣',
    package: 'marketing',
    capabilities: ['Spies Meta Ad Library', 'Analyzes TikTok Ads', 'Detects winning hooks', 'Generates campaign briefs'],
  },
  {
    id: 'community-manager',
    name: 'Sam',
    role: 'Community Manager',
    tagline: 'Every comment matters.',
    color: '#F97316',
    gradient: 'from-orange-400 to-amber-600',
    emoji: '💬',
    package: 'marketing',
    capabilities: ['Responds Google reviews', 'Manages Instagram DMs', 'WhatsApp Business', 'Reputation reporting'],
  },
]

export const ESTRATEGIA_AGENTS: Agent[] = [
  {
    id: 'strategos',
    name: 'Strategos',
    role: 'Chief Strategy Officer',
    tagline: 'I give you the vision you need to take control.',
    color: '#6366F1',
    gradient: 'from-indigo-500 to-violet-700',
    emoji: '🔭',
    package: 'estrategia',
    capabilities: ['90/180-day strategic plan', 'Complete business diagnosis', 'Department audit', 'Business plan with financial projections'],
  },
  {
    id: 'atlas',
    name: 'Atlas',
    role: 'Market & Competitor Analyst',
    tagline: 'I see the full board when you only see your piece.',
    color: '#0EA5E9',
    gradient: 'from-sky-500 to-blue-700',
    emoji: '🗺️',
    package: 'estrategia',
    capabilities: ['Competitive map with player profiles', 'Market positioning map', 'Sales battlecards', 'TAM/SAM/SOM estimation'],
  },
  {
    id: 'blueprint',
    name: 'Blueprint',
    role: 'Business Architect',
    tagline: 'Most problems aren\'t execution failures — they\'re design failures.',
    color: '#10B981',
    gradient: 'from-emerald-500 to-teal-700',
    emoji: '📐',
    package: 'estrategia',
    capabilities: ['Business model audit', 'Complete business plan', 'Unit economics: CAC, LTV, payback', 'Value-based pricing strategy'],
  },
  {
    id: 'kairos',
    name: 'Kairos',
    role: 'Performance Analyst',
    tagline: 'I turn metrics into decisions. Data doesn\'t lie.',
    color: '#F59E0B',
    gradient: 'from-amber-400 to-orange-600',
    emoji: '📊',
    package: 'estrategia',
    capabilities: ['Monthly executive reporting', 'Automatic early alerts', 'Cohort & retention analysis', 'KPI dashboard with traffic light'],
  },
]

export const INNOVACION_AGENTS: Agent[] = [
  {
    id: 'radar',
    name: 'Radar',
    role: 'Trend Intelligence',
    tagline: 'What appears in TechCrunch is already late. I see it first.',
    color: '#8B5CF6',
    gradient: 'from-violet-500 to-purple-700',
    emoji: '📡',
    package: 'innovacion',
    capabilities: ['Weekly trend newsletter', 'Monthly client briefing', 'Urgent alerts for critical moves', 'Trend map by time horizon'],
  },
  {
    id: 'spark',
    name: 'Spark',
    role: 'Innovation Consultant',
    tagline: 'Innovation isn\'t creativity without structure. It\'s structure that unleashes creativity.',
    color: '#F97316',
    gradient: 'from-orange-500 to-red-700',
    emoji: '✨',
    package: 'innovacion',
    capabilities: ['Design Thinking (5 phases)', 'Facilitated Design Sprint', 'Jobs-to-be-Done', 'Lean Canvas + validation plan'],
  },
  {
    id: 'scout',
    name: 'Scout',
    role: 'Open Innovation',
    tagline: '95% of innovation is outside your company. I find it.',
    color: '#06B6D4',
    gradient: 'from-cyan-500 to-blue-700',
    emoji: '🔍',
    package: 'innovacion',
    capabilities: ['Startup ecosystem map', 'Build vs. Buy vs. Partner', 'Hackathon design', 'Emerging technology scouting'],
  },
  {
    id: 'venture',
    name: 'Venture',
    role: 'Innovation PM',
    tagline: 'Ideas without execution are hallucinations.',
    color: '#22C55E',
    gradient: 'from-green-500 to-emerald-700',
    emoji: '🚀',
    package: 'innovacion',
    capabilities: ['Innovation project kickoff & management', 'Discovery → MVP → Scale', 'Innovation portfolio by horizon', 'OKRs & Innovation Accounting'],
  },
  {
    id: 'oracle',
    name: 'Oracle',
    role: 'Strategic Foresight',
    tagline: 'I don\'t predict the future. I prepare for multiple possible futures.',
    color: '#EC4899',
    gradient: 'from-pink-500 to-rose-700',
    emoji: '🔮',
    package: 'innovacion',
    capabilities: ['Future scenarios (Shell methodology)', 'Weak signal analysis (STEEP)', 'Executive futures briefing', 'Strategic option design under uncertainty'],
  },
]

export const ADMIN_AGENTS: Agent[] = [
  {
    id: 'ledger',
    name: 'Ledger',
    role: 'CFO Agent',
    tagline: 'Not a single dollar is lost to disorganization when I\'m active.',
    color: '#6366F1',
    gradient: 'from-indigo-500 to-violet-700',
    emoji: '💳',
    package: 'admin',
    capabilities: ['Billing & payment tracking', 'Monthly agency P&L', 'Late payment alerts (day 3/15/30)', 'Cost control per client'],
  },
  {
    id: 'onboard',
    name: 'Onboard',
    role: 'Client Success',
    tagline: 'The first impression determines retention.',
    color: '#10B981',
    gradient: 'from-emerald-500 to-teal-700',
    emoji: '🤝',
    package: 'admin',
    capabilities: ['Weeks 1-4 onboarding checklist', 'Churn signal detection', 'Automated client communications', 'Monthly deliverables summary'],
  },
  {
    id: 'pulse',
    name: 'Pulse',
    role: 'AI Observability',
    tagline: 'I see everything happening in the system before it becomes a problem.',
    color: '#F59E0B',
    gradient: 'from-amber-400 to-orange-600',
    emoji: '💓',
    package: 'admin',
    capabilities: ['Agent & workflow health dashboard', 'Token cost control per client', 'Error alerts by severity', 'Weekly system usage report'],
  },
  {
    id: 'herald',
    name: 'Herald',
    role: 'Internal Reporting',
    tagline: 'The only place to look to know the state of everything.',
    color: '#EC4899',
    gradient: 'from-pink-500 to-rose-700',
    emoji: '📰',
    package: 'admin',
    capabilities: ['Daily Briefing at 08:30', 'Weekly Report on Mondays at 09:00', 'Immediate critical alerts', 'Consolidates all team agents'],
  },
]

export const FINANZAS_AGENTS: Agent[] = [
  {
    id: 'midas',
    name: 'Midas',
    role: 'Personal Wealth Planner',
    tagline: 'Wealth isn\'t built by earning more — it\'s built with systems.',
    color: '#F59E0B',
    gradient: 'from-amber-400 to-yellow-600',
    emoji: '💎',
    package: 'finanzas',
    capabilities: ['Personal financial diagnosis', 'Automated savings plan', 'Expense optimization', 'Business vs. personal finance separation'],
  },
  {
    id: 'quant',
    name: 'Quant',
    role: 'Investment Analyst',
    tagline: 'Successful investing is boring. Consistency always wins.',
    color: '#6366F1',
    gradient: 'from-indigo-500 to-violet-700',
    emoji: '📈',
    package: 'finanzas',
    capabilities: ['Risk-based portfolio design', 'Low-cost ETFs & asset allocation', 'Portfolio analysis & rebalancing', 'Education: compounding & emotional management'],
  },
  {
    id: 'fiscal',
    name: 'Fiscal',
    role: 'Tax Optimizer',
    tagline: 'Pay exactly what you owe. Not a dollar more.',
    color: '#10B981',
    gradient: 'from-emerald-500 to-teal-700',
    emoji: '📋',
    package: 'finanzas',
    capabilities: ['Founder compensation optimization', 'Deductions you\'re missing', 'Investment taxation & loss harvesting', 'Year-end tax planning'],
  },
  {
    id: 'harbor',
    name: 'Harbor',
    role: 'FI & Retirement Planner',
    tagline: 'Make work a choice, not a necessity.',
    color: '#0EA5E9',
    gradient: 'from-sky-500 to-blue-700',
    emoji: '⚓',
    package: 'finanzas',
    capabilities: ['FI number & time to independence', 'FIRE plan (Lean/Fat/Coast/Barista)', 'Retirement simulations with 4% rule', 'Distribution phase planning'],
  },
]

export const ALL_AGENTS: Agent[] = [...AGENTS, ...COMERCIAL_AGENTS, ...ESTRATEGIA_AGENTS, ...INNOVACION_AGENTS, ...ADMIN_AGENTS, ...FINANZAS_AGENTS]

export const AGENT_BY_ROLE = Object.fromEntries(ALL_AGENTS.map(a => [a.id, a]))

export function getAgentByRole(role: string): Agent | undefined {
  return AGENT_BY_ROLE[role]
}

export const STATUS_LABELS: Record<AgentStatus, string> = {
  idle: 'Available',
  working: 'Working',
  completed: 'Completed',
  waiting: 'Waiting for approval',
}

export const STATUS_COLORS: Record<AgentStatus, string> = {
  idle: 'bg-surface-elevated text-muted',
  working: 'bg-emerald-500/15 text-emerald-400',
  completed: 'bg-blue-500/15 text-blue-400',
  waiting: 'bg-amber-500/15 text-amber-400',
}
