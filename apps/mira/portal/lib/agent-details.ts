// Rich agent details: chatOpener, recentTasks fallback, metrics for each agent role
// Ported from historical implementation (commit 29d87a7)

export interface AgentDetail {
  chatOpener: string
  toneLevel: number
  recentTasks: Array<{ id: string; task: string; status: 'completed' | 'working' | 'waiting'; timeAgo: string; platform?: string }>
  metrics: Array<{ label: string; value: string; delta: string; positive: boolean }>
}

export const DEFAULT_AGENT_DETAILS: AgentDetail = {
  chatOpener: "Hi. I'm ready to help. What do you need?",
  toneLevel: 0.5,
  recentTasks: [{ id: '1', task: 'Standby — waiting for first task', status: 'waiting', timeAgo: 'now' }],
  metrics: [
    { label: 'Tasks completed', value: '0', delta: 'getting started', positive: true },
    { label: 'Avg response time', value: '—', delta: 'no data yet', positive: true },
  ],
}

export const AGENT_DETAILS: Record<string, AgentDetail> = {
  orchestrator: {
    chatOpener: "Hi. I'm Marco. Give me a brief and I'll tell you who executes it, in what order, and when it'll be ready.",
    toneLevel: 0.6,
    recentTasks: [
      { id: '1', task: 'Coordinated "DIP NOW" campaign for Salsa Burgers', status: 'completed', timeAgo: '2h' },
      { id: '2', task: 'Assigned Reels brief: Luna → Alex → Zoe', status: 'completed', timeAgo: '4h' },
      { id: '3', task: 'Reviewing weekly team pipeline', status: 'working', timeAgo: 'now' },
    ],
    metrics: [
      { label: 'Briefs processed', value: '24', delta: '+8 this week', positive: true },
      { label: 'Avg delivery time', value: '1.8h', delta: '-22% vs previous', positive: true },
      { label: 'Approval rate', value: '91%', delta: '+3% this month', positive: true },
      { label: 'Active agents', value: '8/8', delta: 'all online', positive: true },
    ],
  },
  'content-strategist': {
    chatOpener: "Hi, I'm Luna. Tell me about your business or give me a topic and I'll return 5 angles nobody is using yet.",
    toneLevel: 0.4,
    recentTasks: [
      { id: '1', task: 'Trends analysis Bangkok F&B Q2', status: 'completed', platform: 'Research', timeAgo: '1h' },
      { id: '2', task: 'Brief "Wagyu sourcing" for LinkedIn post', status: 'completed', platform: 'LinkedIn', timeAgo: '3h' },
      { id: '3', task: 'Detecting viral hooks this week', status: 'working', timeAgo: 'now' },
    ],
    metrics: [
      { label: 'Briefs generated', value: '18', delta: '+6 this week', positive: true },
      { label: 'Hook rate', value: '73%', delta: '+11% vs previous', positive: true },
      { label: 'Trends monitored', value: '34', delta: 'active', positive: true },
      { label: 'Avg predicted engagement', value: '4.2%', delta: 'vs 2.1% industry', positive: true },
    ],
  },
  copywriter: {
    chatOpener: "Hi, I'm Alex. Give me any brief and I'll write the copy in your exact brand tone. Shall we start?",
    toneLevel: 0.3,
    recentTasks: [
      { id: '1', task: 'IG Caption "DIP NOW THINK LATER" — Salsa Burgers', status: 'completed', platform: 'Instagram', timeAgo: '30min' },
      { id: '2', task: 'Reel Script 30s "Wagyu quality check"', status: 'completed', platform: 'Reel', timeAgo: '2h' },
      { id: '3', task: 'LinkedIn founders story post', status: 'waiting', platform: 'LinkedIn', timeAgo: '4h' },
    ],
    metrics: [
      { label: 'Pieces written', value: '31', delta: '+12 this week', positive: true },
      { label: 'Direct approval', value: '84%', delta: '+7% vs previous', positive: true },
      { label: 'Avg edits', value: '0.8', delta: 'per piece', positive: true },
      { label: 'Brand voice match', value: '96%', delta: 'target: 90%', positive: true },
    ],
  },
  designer: {
    chatOpener: "Hi, I'm Zoe. Give me any brief and I'll generate complete visual direction ready for your team to execute.",
    toneLevel: 0.5,
    recentTasks: [
      { id: '1', task: 'Carousel brief "Wagyu journey" 5 slides', status: 'completed', platform: 'Instagram', timeAgo: '1h' },
      { id: '2', task: 'Selected ad creative template #3', status: 'completed', platform: 'Meta Ads', timeAgo: '3h' },
      { id: '3', task: 'Post brief "DIP NOW" — waiting for editor', status: 'waiting', timeAgo: '5h' },
    ],
    metrics: [
      { label: 'Visual briefs', value: '22', delta: '+8 this week', positive: true },
      { label: 'Reused templates', value: '67%', delta: 'high efficiency', positive: true },
      { label: 'Brand consistency', value: '99%', delta: 'color+typography', positive: true },
    ],
  },
  'lead-scout': {
    chatOpener: "Hi, I'm Rex. Give me your ICP — industry, role, company size, location — and I'll build you a qualified lead list ready to prospect.",
    toneLevel: 0.7,
    recentTasks: [
      { id: '1', task: 'Generated 25-lead list — SaaS founders Bangkok', status: 'completed', platform: 'LinkedIn', timeAgo: '2h' },
      { id: '2', task: 'Enriched 12 contacts with phone + LinkedIn URL', status: 'completed', timeAgo: '4h' },
      { id: '3', task: 'Scanning trigger events — Series A announcements', status: 'working', timeAgo: 'now' },
    ],
    metrics: [
      { label: 'Leads generated', value: '142', delta: '+38 this week', positive: true },
      { label: 'Avg ICP match', value: '81%', delta: '+6% vs last month', positive: true },
      { label: 'Trigger events found', value: '17', delta: 'this week', positive: true },
      { label: 'Enrichment rate', value: '94%', delta: 'verified contacts', positive: true },
    ],
  },
  'icp-scorer': {
    chatOpener: "Hi, I'm Vera. Give me a lead's details — role, company, sector, size — and I'll score them 0-100 and tell you exactly why.",
    toneLevel: 0.6,
    recentTasks: [
      { id: '1', task: 'Scored 25 leads — 8 hot, 11 warm, 6 cold', status: 'completed', timeAgo: '2h' },
      { id: '2', task: 'Recalibrated model after 3 closed deals', status: 'completed', timeAgo: '1d' },
      { id: '3', task: 'Scoring new batch from Rex — 15 leads', status: 'working', timeAgo: 'now' },
    ],
    metrics: [
      { label: 'Leads scored', value: '214', delta: 'total pipeline', positive: true },
      { label: 'Hot leads', value: '31%', delta: 'above 75 score', positive: true },
      { label: 'Score accuracy', value: '78%', delta: 'vs actual conversion', positive: true },
      { label: 'Avg pipeline score', value: '63', delta: 'healthy range', positive: true },
    ],
  },
  'icebreaker-writer': {
    chatOpener: "Hi, I'm Finn. Give me a prospect's name, role, company and any recent activity (post, news, promotion) and I'll write 3 icebreakers you'll actually want to send.",
    toneLevel: 0.2,
    recentTasks: [
      { id: '1', task: '3 icebreaker variants — Diego López (SaaS Madrid)', status: 'completed', platform: 'LinkedIn', timeAgo: '1h' },
      { id: '2', task: 'A/B test: casual vs direct — 40% reply rate winner', status: 'completed', timeAgo: '3h' },
      { id: '3', task: 'Icebreakers for batch of 8 hot leads', status: 'working', timeAgo: 'now' },
    ],
    metrics: [
      { label: 'Icebreakers written', value: '89', delta: '+24 this week', positive: true },
      { label: 'Open rate', value: '68%', delta: 'vs 23% industry avg', positive: true },
      { label: 'Reply rate', value: '31%', delta: 'vs 8% industry avg', positive: true },
      { label: 'Avg personalization', value: '4.7/5', delta: 'manual audit', positive: true },
    ],
  },
  'social-media-manager': {
    chatOpener: "Hi, I'm Noa. Tell me what you want to post and I'll deliver copy, visuals brief, and posting strategy.",
    toneLevel: 0.4,
    recentTasks: [
      { id: '1', task: '8 IG posts scheduled — Salsa Burgers weekly', status: 'completed', platform: 'Instagram', timeAgo: '1h' },
      { id: '2', task: '3 TikTok scripts approved', status: 'completed', timeAgo: '2h' },
      { id: '3', task: 'Community management — 23 DMs', status: 'working', timeAgo: 'now' },
    ],
    metrics: [
      { label: 'Posts created', value: '48', delta: '+12 this week', positive: true },
      { label: 'Avg engagement', value: '3.4%', delta: '+0.8% vs previous', positive: true },
      { label: 'Community replies', value: '100%', delta: 'same day', positive: true },
      { label: 'Follower growth', value: '+284', delta: 'this month', positive: true },
    ],
  },
  strategos: {
    chatOpener: "Hi, I'm Strategos. Tell me where your business is now and where you want to be in 90 days. I'll build the roadmap.",
    toneLevel: 0.8,
    recentTasks: [
      { id: '1', task: '90-day plan for MIRA launch — 3 strategic Rocks defined', status: 'completed', timeAgo: '1d' },
      { id: '2', task: 'Q2 strategy review — 2 pivots recommended', status: 'completed', timeAgo: '3d' },
      { id: '3', task: 'Pre-seed business plan — investor version', status: 'working', timeAgo: 'now' },
    ],
    metrics: [
      { label: 'Plans delivered', value: '7', delta: 'this quarter', positive: true },
      { label: 'Avg NPS', value: '82', delta: 'post-delivery', positive: true },
      { label: 'Rocks defined', value: '21', delta: 'across all clients', positive: true },
      { label: 'Implementation rate', value: '71%', delta: 'of defined actions', positive: true },
    ],
  },
  blueprint: {
    chatOpener: "Hi, I'm Blueprint. Describe your business model — what you sell, to whom, at what price, and your main costs — and I'll audit it.",
    toneLevel: 0.7,
    recentTasks: [
      { id: '1', task: 'Unit economics audit — CAC $340, LTV $4,200, payback 2.4mo', status: 'completed', timeAgo: '2h' },
      { id: '2', task: 'Pricing strategy redesign — value-based vs. hourly', status: 'completed', timeAgo: '1d' },
      { id: '3', task: 'Business model canvas for new vertical', status: 'working', timeAgo: 'now' },
    ],
    metrics: [
      { label: 'Models audited', value: '9', delta: 'this quarter', positive: true },
      { label: 'Avg margin improvement', value: '+23%', delta: 'post-redesign', positive: true },
      { label: 'Unit economics fixed', value: '6', delta: 'clients', positive: true },
      { label: 'Business plans', value: '4', delta: 'investor-ready', positive: true },
    ],
  },
  ledger: {
    chatOpener: "Hi, I'm Ledger. I handle all the numbers. Ask me about invoices, payments, P&L or financial health of any client.",
    toneLevel: 0.7,
    recentTasks: [
      { id: '1', task: 'Invoice #004 sent — Salsa Burgers $1,200', status: 'completed', timeAgo: '2d' },
      { id: '2', task: 'Alert: Wagyu House payment day 7 overdue', status: 'working', platform: 'Alert', timeAgo: 'now' },
      { id: '3', task: 'Monthly P&L — April: $4,800 revenue, $1,200 costs', status: 'completed', timeAgo: '3d' },
    ],
    metrics: [
      { label: 'MRR', value: '$4,800', delta: '+$1,200 this month', positive: true },
      { label: 'Overdue invoices', value: '1', delta: 'day 7', positive: false },
      { label: 'Collections rate', value: '94%', delta: 'on time', positive: true },
      { label: 'Profit margin', value: '75%', delta: 'after all costs', positive: true },
    ],
  },
  pulse: {
    chatOpener: "Hi, I'm Pulse. I can check the system health, show you token usage, error logs or workflow status. What do you need?",
    toneLevel: 0.6,
    recentTasks: [
      { id: '1', task: 'Health check — all 6 workflows operational ✓', status: 'completed', timeAgo: '1h' },
      { id: '2', task: 'Alert: API latency spike 4.2s avg (threshold: 3s)', status: 'waiting', platform: 'Alert', timeAgo: '30min' },
      { id: '3', task: 'Weekly token usage report — $47 this week', status: 'completed', timeAgo: '2d' },
    ],
    metrics: [
      { label: 'System uptime', value: '99.2%', delta: 'last 30 days', positive: true },
      { label: 'Avg latency', value: '2.8s', delta: 'within threshold', positive: true },
      { label: 'Errors caught', value: '3', delta: 'before reaching client', positive: true },
      { label: 'Weekly AI cost', value: '$47', delta: '$15 under budget', positive: true },
    ],
  },
  herald: {
    chatOpener: "Hi, I'm Herald. Ask me for today's briefing, last week's report, or any summary across all agents and clients.",
    toneLevel: 0.5,
    recentTasks: [
      { id: '1', task: 'Daily Briefing 08:30 — 3 approvals pending, 1 payment alert', status: 'completed', timeAgo: '2h' },
      { id: '2', task: 'Weekly Report Monday — 15 posts published, 2 new leads closed', status: 'completed', timeAgo: '2d' },
      { id: '3', task: 'Critical alert: Salsa Burgers GMB review unanswered 4h', status: 'working', timeAgo: '30min' },
    ],
    metrics: [
      { label: 'Briefings sent', value: '22', delta: 'this month', positive: true },
      { label: 'Weekly reports', value: '4', delta: 'this month', positive: true },
      { label: 'Critical alerts', value: '2', delta: 'this week', positive: false },
      { label: 'Delivery rate', value: '100%', delta: 'zero missed', positive: true },
    ],
  },

  // Stub entries for missing 18 agents (will use DEFAULT details)
  'video-editor': DEFAULT_AGENT_DETAILS,
  'ads-manager': DEFAULT_AGENT_DETAILS,
  'community-manager': DEFAULT_AGENT_DETAILS,
  'reply-qualifier': DEFAULT_AGENT_DETAILS,
  'proposal-writer': DEFAULT_AGENT_DETAILS,
  atlas: DEFAULT_AGENT_DETAILS,
  kairos: DEFAULT_AGENT_DETAILS,
  radar: DEFAULT_AGENT_DETAILS,
  spark: DEFAULT_AGENT_DETAILS,
  scout: DEFAULT_AGENT_DETAILS,
  venture: DEFAULT_AGENT_DETAILS,
  oracle: DEFAULT_AGENT_DETAILS,
  onboard: DEFAULT_AGENT_DETAILS,
  midas: DEFAULT_AGENT_DETAILS,
  quant: DEFAULT_AGENT_DETAILS,
  fiscal: DEFAULT_AGENT_DETAILS,
  harbor: DEFAULT_AGENT_DETAILS,
}
