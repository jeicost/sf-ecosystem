/**
 * Standardized report templates for each toolkit tool
 * Each template has structure compatible with ReportTemplate component
 */

const DEFAULT_ACTIONS = [
  {
    id: 1,
    title: 'Review report with stakeholders',
    priority: 'high',
    impact: 'Alignment and buy-in',
    effort: '4 hours',
  },
  {
    id: 2,
    title: 'Create action tracking dashboard',
    priority: 'medium',
    impact: 'Monitor progress',
    effort: '2 hours',
  },
]

export const TOOL_REPORT_TEMPLATES = {
  'brand-briefing': {
    title: 'Brand Briefing Report',
    subtitle: 'Complete brand intelligence with 23 strategic sections',
    score: 85,
    scoreLabel: 'Brand Clarity Score',
    statCards: [
      { label: 'Strategic Pillars', value: '4', color: '#22c55e' },
      { label: 'Brand Personas', value: '3', color: '#f59e0b' },
      { label: 'Messaging Layers', value: '12', color: '#3b82f6' },
      { label: 'Competitive Positioning', value: '5 rivals', color: '#a78bfa' },
    ],
    sections: [
      {
        title: 'Brand Foundation',
        findings: [
          { id: 1, title: 'Mission & Vision Clarity', severity: 'ok', description: 'Clear mission statement aligned with market needs.' },
          { id: 2, title: 'Core Values Definition', severity: 'ok', description: '5 core values identified and operationalized.' },
        ],
      },
    ],
    actions: DEFAULT_ACTIONS,
  },

  'content-pack': {
    title: 'Content Pack',
    subtitle: '15 ready-to-publish posts + 10 short-form scripts',
    score: 78,
    scoreLabel: 'Content Readiness',
    statCards: [
      { label: 'Posts Created', value: '15', color: '#22c55e' },
      { label: 'Reel/TikTok Scripts', value: '10', color: '#f59e0b' },
      { label: 'Platforms Optimized', value: '4', color: '#3b82f6' },
      { label: '30-Day Coverage', value: '100%', color: '#a78bfa' },
    ],
    sections: [
      {
        title: 'Content Strategy',
        findings: [
          { id: 1, title: 'Long-Form Content', severity: 'ok', description: 'Blog posts optimized for SEO.' },
          { id: 2, title: 'Short-Form Scripts', severity: 'ok', description: 'TikTok/Reel ready scripts.' },
        ],
      },
    ],
    actions: DEFAULT_ACTIONS,
  },

  'action-plan': {
    title: '30/60/90 Day Action Plan',
    subtitle: 'Week-by-week executable plan with KPIs & owners',
    score: 88,
    scoreLabel: 'Plan Feasibility',
    statCards: [
      { label: 'Total Actions', value: '42', color: '#22c55e' },
      { label: 'Week 1 Tasks', value: '8', color: '#f59e0b' },
      { label: 'Owners Assigned', value: '5', color: '#3b82f6' },
      { label: 'Budget Allocated', value: '€12.5K', color: '#a78bfa' },
    ],
    sections: [
      {
        title: 'Month 1: Foundation',
        findings: [
          { id: 1, title: 'Audit & Baseline', severity: 'ok', description: 'Establish KPI baselines.' },
          { id: 2, title: 'Quick Wins', severity: 'ok', description: 'Low-effort, high-impact optimizations.' },
        ],
      },
    ],
    actions: DEFAULT_ACTIONS,
  },

  'investor-deck': {
    title: 'Investor Pitch Deck',
    subtitle: '15-20 professional slides with financials & market analysis',
    score: 82,
    scoreLabel: 'Pitch Strength',
    statCards: [
      { label: 'Total Slides', value: '18', color: '#22c55e' },
      { label: 'Financial Projections', value: '5Y Forecast', color: '#f59e0b' },
      { label: 'TAM/SAM/SOM', value: '$450M TAM', color: '#3b82f6' },
      { label: 'Ask Amount', value: '$2.5M Series A', color: '#a78bfa' },
    ],
    sections: [
      {
        title: 'Market Opportunity',
        findings: [
          { id: 1, title: 'Market Problem Well-Defined', severity: 'ok', description: 'Clear $450M TAM identified.' },
          { id: 2, title: 'Competitive Landscape', severity: 'ok', description: '3 competitors mapped with differentiation.' },
        ],
      },
    ],
    actions: DEFAULT_ACTIONS,
  },

  'competitive-analysis': {
    title: 'Competitive Analysis Report',
    subtitle: 'Mapping of 5-7 competitors with strengths/weaknesses',
    score: 79,
    scoreLabel: 'Market Intelligence',
    statCards: [
      { label: 'Competitors Mapped', value: '6', color: '#22c55e' },
      { label: 'Feature Comparison', value: '24 Features', color: '#f59e0b' },
      { label: 'Pricing Models', value: '5 Models', color: '#3b82f6' },
      { label: 'Positioning Gaps', value: '3 Opportunities', color: '#a78bfa' },
    ],
    sections: [
      {
        title: 'Competitive Landscape',
        findings: [
          { id: 1, title: 'Competitor A: Feature-Rich', severity: 'warning', description: 'Strong feature set, high price.' },
          { id: 2, title: 'Competitor B: Emerging', severity: 'ok', description: 'Mobile-first, growing 25% MoM.' },
        ],
      },
    ],
    actions: DEFAULT_ACTIONS,
  },

  'brandbook-content-system': {
    title: 'Brand Book & Content System',
    subtitle: 'Tone guides, templates, archetypes, calendars & playbooks',
    score: 90,
    scoreLabel: 'Content System Maturity',
    statCards: [
      { label: 'Tone Variations', value: '4', color: '#22c55e' },
      { label: 'Content Templates', value: '12', color: '#f59e0b' },
      { label: 'Character Archetypes', value: '3', color: '#3b82f6' },
      { label: 'Channel Playbooks', value: '5', color: '#a78bfa' },
    ],
    sections: [
      {
        title: 'Brand Architecture',
        findings: [
          { id: 1, title: 'Tone Guide Defined', severity: 'ok', description: '4 tone variations for different contexts.' },
          { id: 2, title: 'Template Library', severity: 'ok', description: '12 reusable templates across channels.' },
        ],
      },
    ],
    actions: DEFAULT_ACTIONS,
  },

  'marketing-campaign-generator': {
    title: 'Marketing Campaign Strategy',
    subtitle: 'Monthly campaign plan with channel distribution & KPIs',
    score: 81,
    scoreLabel: 'Campaign Strength',
    statCards: [
      { label: 'Campaign Themes', value: '4', color: '#22c55e' },
      { label: 'Channels Active', value: '6', color: '#f59e0b' },
      { label: 'Content Assets', value: '24', color: '#3b82f6' },
      { label: 'Budget Allocated', value: '€8,500', color: '#a78bfa' },
    ],
    sections: [
      {
        title: 'Campaign Themes',
        findings: [
          { id: 1, title: 'Month 1: Launch Campaign', severity: 'ok', description: 'Awareness-focused with influencer partnerships.' },
          { id: 2, title: 'Month 2: Engagement Campaign', severity: 'ok', description: 'Community-building with UGC.' },
        ],
      },
    ],
    actions: DEFAULT_ACTIONS,
  },

  'community-growth-blueprint': {
    title: 'Community Growth Strategy',
    subtitle: '90-day roadmap with engagement playbook & influencer sourcing',
    score: 84,
    scoreLabel: 'Community Potential',
    statCards: [
      { label: '90-Day Goals', value: '+5K Members', color: '#22c55e' },
      { label: 'Engagement Tactics', value: '8', color: '#f59e0b' },
      { label: 'Influencers to Source', value: '15', color: '#3b82f6' },
      { label: 'Success Metric', value: '3x Activity', color: '#a78bfa' },
    ],
    sections: [
      {
        title: 'Community Foundations',
        findings: [
          { id: 1, title: 'Platform Strategy', severity: 'ok', description: 'Discord + LinkedIn with clear roles.' },
          { id: 2, title: 'Member Onboarding', severity: 'ok', description: 'Welcome sequence + cohort programs.' },
        ],
      },
    ],
    actions: DEFAULT_ACTIONS,
  },

  'seo-audit': {
    title: 'SEO Audit Report',
    subtitle: 'Complete technical & content analysis',
    score: 72,
    scoreLabel: 'SEO Health',
    statCards: [
      { label: 'Pages Indexed', value: '142', color: '#22c55e' },
      { label: 'Core Web Vitals', value: 'Needs Work', color: '#f59e0b' },
      { label: 'Ranking Keywords', value: '1,247', color: '#3b82f6' },
      { label: 'Backlinks', value: '3.2K', color: '#a78bfa' },
    ],
    sections: [
      {
        title: 'Technical SEO',
        findings: [
          { id: 1, title: 'Mobile Responsiveness', severity: 'critical', description: 'Viewport config missing on 12 pages.' },
          { id: 2, title: 'Page Speed', severity: 'warning', description: 'Average LCP is 3.2s. Target <2.5s.' },
        ],
      },
    ],
    actions: DEFAULT_ACTIONS,
  },

  'marketing-audit': {
    title: 'Marketing Audit Report',
    subtitle: 'Analysis of channels, conversion & positioning',
    score: 68,
    scoreLabel: 'Marketing Health',
    statCards: [
      { label: 'Active Channels', value: '6', color: '#22c55e' },
      { label: 'Quarterly Reach', value: '125K', color: '#f59e0b' },
      { label: 'Campaign ROI', value: '2.8x', color: '#3b82f6' },
      { label: 'Team Efficiency', value: '65%', color: '#a78bfa' },
    ],
    sections: [
      {
        title: 'Channel Performance',
        findings: [
          { id: 1, title: 'Email Marketing', severity: 'ok', description: '28% open rate, strong engagement.' },
          { id: 2, title: 'Paid Ads Efficiency', severity: 'warning', description: 'CPA trending upward 12% QoQ.' },
        ],
      },
    ],
    actions: DEFAULT_ACTIONS,
  },
}

export type ToolSlug = keyof typeof TOOL_REPORT_TEMPLATES

export const getToolReportTemplate = (slug: string) => {
  return TOOL_REPORT_TEMPLATES[slug as ToolSlug] || null
}
