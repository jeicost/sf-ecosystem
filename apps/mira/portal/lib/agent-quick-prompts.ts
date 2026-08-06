// Quick prompt suggestions for each agent role
// Shown in empty chat state, helps users start conversations

import { safeLookup } from './safe-lookup'

export const AGENT_QUICK_PROMPTS: Record<string, string[]> = {
  orchestrator: [
    'I need to coordinate a new campaign — tell me who executes and in what order',
    "Review this week's pipeline and prioritize by urgency",
    'Generate a brief that distributes the work across the team',
  ],
  'content-strategist': [
    'Give me 5 fresh angles for content about [topic]',
    "Analyze this week's viral trends in our sector",
    'Generate content briefs for every platform',
  ],
  copywriter: [
    'Rewrite this copy in our brand tone',
    'Write 3 copy variants for an Instagram carousel',
    'Generate headlines that match our brand voice',
  ],
  designer: [
    'Give me a complete visual brief for [concept]',
    'Design a graphic solution for this content',
    'Create art direction for a campaign',
  ],
  'lead-scout': [
    'Give me my ICP and generate a list of qualified leads',
    'Find 20 leads in [industry] matching [criteria]',
    'Identify opportunities from trigger events',
  ],
  'icp-scorer': [
    'Score these 10 leads from 0-100 with justification',
    'Segment our pipeline by likelihood to close',
    'Recalibrate the model based on our latest closed deals',
  ],
  'icebreaker-writer': [
    'Write 3 icebreakers for [prospect] in [industry]',
    'Generate an opener that breaks the ice without being invasive',
    'A/B test: compare these two icebreakers',
  ],
  'social-media-manager': [
    "Plan this week's content for our social channels",
    'Write 5 posts ready to schedule',
    'Create a community management strategy for this week',
  ],
  strategos: [
    'Build a 90-day plan for [goal]',
    'Define 3 Strategic Rocks for this quarter',
    'Review our strategy and recommend changes',
  ],
  blueprint: [
    'Audit our current business model',
    'Design a value-based pricing strategy',
    "Analyze this client's financial health",
  ],
  pulse: [
    'Health check: tell me the system status',
    'How is our token usage this week?',
    'Are there any alerts or error logs I should review?',
  ],
  'video-editor': [
    'Edit this video with these instructions',
    'Create a 5-second intro for our branding',
    'Generate 3 variants of this video for different platforms',
  ],
  'ads-manager': [
    'Design an ads strategy for [goal]',
    'Optimize this ad campaign',
    'Create creative briefs for Meta/Google ads',
  ],
  'community-manager': [
    'Create an engagement plan for this week',
    'Reply to the latest comments in our brand voice',
    'Design a strategy to grow the community',
  ],
  'reply-qualifier': [
    'Classify these replies by likelihood to close',
    'Filter the leads that deserve immediate follow-up',
    'Prioritize replies by urgency and ICP match',
  ],
  'proposal-writer': [
    'Write a proposal for [client] with [scope]',
    'Generate standard terms and conditions',
    'Create an executive proposal deck',
  ],
  atlas: [
    'Map emerging trends in [sector]',
    'Analyze the current competitive landscape',
    'Build 3 future scenarios for our business',
    'Identify untapped market opportunities',
  ],
  onboard: [
    'Design an onboarding program for the team',
    'Create training material on [topic]',
    'Develop an upskilling plan for [role]',
  ],
  midas: [
    'How can we increase revenue by 30%?',
    'Optimize our pricing to maximize LTV',
    'Identify leaks in our revenue pipeline',
  ],
  quant: [
    'Analyze this data and give me the key insights',
    'Create a KPI dashboard for [area]',
    'Build a predictive model for [metric]',
  ],
  fiscal: [
    "Audit this quarter's finances",
    'Review our tax and regulatory compliance',
    'Generate consolidated financial reports',
  ],
  harbor: [
    'Draft the reply to this customer ticket',
    "Create an FAQ with our customers' most common questions",
    'Design a response template for [issue type]',
  ],
  spark: [
    'Brainstorm 10 new ideas for [goal]',
    'How could we innovate in [area]?',
    'Generate disruptive concepts for our sector',
  ],
}

export function getQuickPrompts(role: string): string[] {
  return safeLookup(AGENT_QUICK_PROMPTS, role) || [
    'Tell me what you need',
    'How can I help you?',
    "What's on your mind right now?",
  ]
}
