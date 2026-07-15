'use client'
import { useState, useRef, useEffect } from 'react'
import { useParams } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import { ALL_AGENTS } from '@/lib/agents'
import { AGENT_PROMPTS } from '@/lib/agent-prompts'
import {
  ArrowLeft, Zap, BarChart2, MessageSquare, Settings,
  Send, CheckCircle, Clock, AlertCircle, TrendingUp, TrendingDown,
  Shield, Zap as ZapIcon, Hand, Copy, Check,
} from 'lucide-react'
import Link from 'next/link'
import { clsx } from 'clsx'
import { useActiveClient } from '@/lib/client-context'
import { createClient } from '@/lib/supabase'
import { CLIENT_ID } from '@/lib/constants'
import type { AgentPackage } from '@/lib/types'

type TaskStatus = 'completed' | 'working' | 'waiting'
type AutonomyLevel = 'always_ask' | 'ask_if_unsure' | 'full_auto'

const AUTONOMY_OPTIONS: { id: AutonomyLevel; label: string; description: string; icon: typeof Shield }[] = [
  { id: 'always_ask', label: 'Always ask', description: 'Nothing goes out without your explicit ok.', icon: Hand },
  { id: 'ask_if_unsure', label: 'Only when unsure', description: 'Acts confidently, escalates sensitive matters.', icon: Shield },
  { id: 'full_auto', label: 'Autonomous mode', description: 'Executes and notifies. No interruptions.', icon: ZapIcon },
]

const DEFAULT_AUTONOMY: Record<string, AutonomyLevel> = {
  orchestrator: 'ask_if_unsure',
  'content-strategist': 'full_auto',
  copywriter: 'ask_if_unsure',
  designer: 'ask_if_unsure',
  'video-editor': 'ask_if_unsure',
  'social-media-manager': 'always_ask',
  'ads-manager': 'full_auto',
  'community-manager': 'always_ask',
}

const IMPROVEMENT_AREAS: Record<AgentPackage, { label: string; pct: number }[]> = {
  marketing: [
    { label: 'Brand voice accuracy', pct: 94 },
    { label: 'Direct approval rate', pct: 84 },
    { label: 'Execution speed', pct: 78 },
  ],
  comercial: [
    { label: 'ICP match accuracy', pct: 87 },
    { label: 'Pipeline conversion', pct: 72 },
    { label: 'Personalization score', pct: 91 },
  ],
  estrategia: [
    { label: 'Analysis depth', pct: 88 },
    { label: 'Actionability', pct: 82 },
    { label: 'Framework accuracy', pct: 90 },
  ],
  innovacion: [
    { label: 'Trend accuracy', pct: 73 },
    { label: 'Framework application', pct: 85 },
    { label: 'Signal detection', pct: 79 },
  ],
  admin: [
    { label: 'Alert accuracy', pct: 96 },
    { label: 'System coverage', pct: 88 },
    { label: 'Response time', pct: 92 },
  ],
  finanzas: [
    { label: 'Calculation accuracy', pct: 97 },
    { label: 'Plan personalization', pct: 83 },
    { label: 'Risk assessment', pct: 89 },
  ],
}
interface AgentDetails {
  systemPromptPreview: string
  toneLevel: number
  recentTasks: { id: string; task: string; status: TaskStatus; platform?: string; timeAgo: string }[]
  metrics: { label: string; value: string; delta: string; positive: boolean }[]
  chatOpener: string
}

const DEFAULT_AGENT_DETAILS: AgentDetails = {
  systemPromptPreview: 'System prompt will load from Supabase when your instance is connected.',
  toneLevel: 0.5,
  recentTasks: [{ id: '1', task: 'Standby — waiting for first task', status: 'waiting', timeAgo: 'now' }],
  metrics: [
    { label: 'Tasks completed', value: '0', delta: 'getting started', positive: true },
    { label: 'Avg response time', value: '—', delta: 'no data yet', positive: true },
  ],
  chatOpener: "Hi. I'm ready to help. What do you need?",
}

const AGENT_DETAILS: Record<string, AgentDetails> = {
  orchestrator: {
    systemPromptPreview: "You are the Creative Director of an AI marketing agency. Your job is to coordinate a team of 12 specialized agents to deliver high-quality results. You think in systems, not individual tasks.",
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
    chatOpener: "Hi. I'm Marco. Give me a brief and I'll tell you who executes it, in what order, and when it'll be ready.",
  },
  'content-strategist': {
    systemPromptPreview: "You are the content strategist. Your job is to research trends, analyze competitors and generate actionable briefs for the creative team.",
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
    chatOpener: "Hi, I'm Luna. Tell me about your business or give me a topic and I'll return 5 angles nobody is using yet.",
  },
  copywriter: {
    systemPromptPreview: "You are the team copywriter. You write in the client's exact tone, with the voice built by the Brand Brain. Every word has a purpose.",
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
    chatOpener: "Hi, I'm Alex. Give me any brief and I'll write the copy in your exact brand tone. Shall we start?",
  },
  designer: {
    systemPromptPreview: "You are the graphic designer. You generate complete visual briefs so the human editor can produce content that respects the brand identity.",
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
      { label: 'Brief→delivery time', value: '45min', delta: '-15min vs previous', positive: true },
    ],
    chatOpener: "Hi, I'm Zoe. Describe what you want to communicate and I'll give you the complete visual brief: format, palette, references and text.",
  },
  'video-editor': {
    systemPromptPreview: "You are the video editor. You generate scripts and production briefs ready for the human editor to mount the video with the client's identity.",
    toneLevel: 0.2,
    recentTasks: [
      { id: '1', task: 'Reel Script 21s "Burger assembly ASMR"', status: 'completed', platform: 'Instagram', timeAgo: '2h' },
      { id: '2', task: 'Faceless short brief "Bangkok vs Salsa"', status: 'completed', platform: 'TikTok', timeAgo: '4h' },
      { id: '3', task: 'TikTok loop ending script — in production', status: 'working', platform: 'TikTok', timeAgo: 'now' },
    ],
    metrics: [
      { label: 'Scripts produced', value: '14', delta: '+5 this week', positive: true },
      { label: 'Completion rate', value: '78%', delta: 'finished videos', positive: true },
      { label: 'Avg retention', value: '68%', delta: 'vs 45% benchmark', positive: true },
      { label: 'Avg duration', value: '24s', delta: 'optimal zone', positive: true },
    ],
    chatOpener: "Hi, I'm Kai. Give me the concept or Alex's copy and I'll prepare the full script with cuts, transitions and first-frame hook.",
  },
  'social-media-manager': {
    systemPromptPreview: "You are the social media manager. You coordinate approval, scheduling and publishing of all content. Nothing goes out without your stamp.",
    toneLevel: 0.5,
    recentTasks: [
      { id: '1', task: 'Scheduled 3 posts for next week — Salsa Burgers', status: 'completed', timeAgo: '1h' },
      { id: '2', task: 'Sent IG post "DIP NOW" for approval', status: 'completed', platform: 'Instagram', timeAgo: '2h' },
      { id: '3', task: 'Waiting for LinkedIn founders post approval', status: 'waiting', platform: 'LinkedIn', timeAgo: '4h' },
    ],
    metrics: [
      { label: 'Published posts', value: '0', delta: 'this week', positive: true },
      { label: 'In approval', value: '2', delta: 'pending today', positive: false },
      { label: 'In scheduled queue', value: '3', delta: 'next 7 days', positive: true },
      { label: 'Consistency score', value: '100%', delta: '0 posts missed', positive: true },
    ],
    chatOpener: "Hi, I'm Noa. I can show you the calendar, check what's in approval or schedule a new post. What do you need?",
  },
  'ads-manager': {
    systemPromptPreview: "You are the ads manager. You monitor competitors, analyze winning ads and generate campaign briefs based on real market signals.",
    toneLevel: 0.7,
    recentTasks: [
      { id: '1', task: 'Meta Ad Library analysis — Bangkok competitors', status: 'completed', timeAgo: '3h' },
      { id: '2', task: 'Retargeting campaign brief "Lost wagyu lovers"', status: 'completed', platform: 'Meta Ads', timeAgo: '5h' },
      { id: '3', task: 'Monitoring TikTok Ads signals this week', status: 'working', timeAgo: 'now' },
    ],
    metrics: [
      { label: 'Monitored ads', value: '147', delta: 'active competitors', positive: false },
      { label: 'Campaign briefs', value: '6', delta: '+3 this week', positive: true },
      { label: 'Detected hooks', value: '23', delta: 'winners', positive: true },
      { label: 'Estimated ROAS', value: '4.2x', delta: 'target: 3x', positive: true },
    ],
    chatOpener: "Hi, I'm Riva. Give me a competitor or product and I'll tell you exactly what they're doing in ads and how to beat them.",
  },
  'community-manager': {
    systemPromptPreview: "You are the community manager. You reply to reviews, DMs and comments in the client's exact tone. Every interaction builds reputation.",
    toneLevel: 0.2,
    recentTasks: [
      { id: '1', task: 'Negative review response GMB — awaiting approval', status: 'waiting', platform: 'GMB', timeAgo: '5min' },
      { id: '2', task: 'Replied to 8 IG comments', status: 'completed', platform: 'Instagram', timeAgo: '1h' },
      { id: '3', task: 'Qualified DM → sales agent', status: 'completed', timeAgo: '2h' },
    ],
    metrics: [
      { label: 'Interactions today', value: '12', delta: '+4 vs yesterday', positive: true },
      { label: 'Response time', value: '8min', delta: 'vs 2h industry avg', positive: true },
      { label: 'Reviews replied', value: '100%', delta: 'since launch', positive: true },
      { label: 'GMB reputation', value: '4.8★', delta: 'no drops', positive: true },
    ],
    chatOpener: "Hi, I'm Sam. Give me any comment, review or DM and I'll write the perfect reply for your brand. No delays.",
  },

  // ── COMERCIAL ──────────────────────────────────────────────────────────────
  'lead-scout': {
    systemPromptPreview: "You are Rex, the Lead Scout. You build qualified lead lists from scratch. You research LinkedIn, Apollo, company databases and trigger events to find the perfect prospects for your client's ICP.",
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
    chatOpener: "Hi, I'm Rex. Give me your ICP — industry, role, company size, location — and I'll build you a qualified lead list ready to prospect.",
  },
  'icp-scorer': {
    systemPromptPreview: "You are Vera, the ICP Scorer. You score each lead from 0 to 100 based on fit with the ideal customer profile. Hot (75+), Warm (50-74), Cold (<50). You explain every score.",
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
    chatOpener: "Hi, I'm Vera. Give me a lead's details — role, company, sector, size — and I'll score them 0-100 and tell you exactly why.",
  },
  'icebreaker-writer': {
    systemPromptPreview: "You are Finn, the Icebreaker Writer. Every first message you write sounds human, specific and hard to ignore. You base each icebreaker on LinkedIn activity, recent news, company milestones and the prospect's role.",
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
    chatOpener: "Hi, I'm Finn. Give me a prospect's name, role, company and any recent activity (post, news, promotion) and I'll write 3 icebreakers you'll actually want to send.",
  },
  'reply-qualifier': {
    systemPromptPreview: "You are Quinn, the Reply Qualifier. You read every prospect reply and classify it: interested / objection / not now / unsubscribe. You score BANT and tell the rep exactly what to do next.",
    toneLevel: 0.5,
    recentTasks: [
      { id: '1', task: 'Classified 14 replies — 4 interested, 6 objections, 4 not now', status: 'completed', timeAgo: '2h' },
      { id: '2', task: 'BANT scored: Carlos García — Budget confirmed, Authority yes', status: 'completed', timeAgo: '3h' },
      { id: '3', task: 'Monitoring new replies from LinkedIn outreach batch', status: 'working', timeAgo: 'now' },
    ],
    metrics: [
      { label: 'Replies classified', value: '178', delta: '+41 this week', positive: true },
      { label: 'Interested rate', value: '24%', delta: 'of total replies', positive: true },
      { label: 'BANT scored', value: '52', delta: 'leads qualified', positive: true },
      { label: 'Classification accuracy', value: '91%', delta: 'verified manually', positive: true },
    ],
    chatOpener: "Hi, I'm Quinn. Paste any prospect reply and I'll classify it, score BANT, and tell you exactly what your next move should be.",
  },
  'proposal-writer': {
    systemPromptPreview: "You are Nova, the Proposal Writer. You generate personalized commercial proposals that close. Structure: Executive Summary → Diagnosis → Solution → Work Plan → Investment → CTA. Each one adapted to the client's industry, size and specific pain points.",
    toneLevel: 0.6,
    recentTasks: [
      { id: '1', task: 'Full proposal — Wagyu House Bangkok ($1,200/mo)', status: 'completed', platform: 'PDF', timeAgo: '3h' },
      { id: '2', task: 'Proposal revision after discovery call feedback', status: 'completed', timeAgo: '5h' },
      { id: '3', task: 'Proposal for F&B chain — 3 locations', status: 'waiting', timeAgo: '1h' },
    ],
    metrics: [
      { label: 'Proposals sent', value: '18', delta: '+5 this month', positive: true },
      { label: 'Close rate', value: '44%', delta: '+12% vs manual', positive: true },
      { label: 'Avg deal size', value: '$1,380', delta: 'mo recurring', positive: true },
      { label: 'Time to send', value: '18min', delta: 'from call brief', positive: true },
    ],
    chatOpener: "Hi, I'm Nova. Give me the brief from your discovery call — company type, their problem, what you're offering, budget range — and I'll generate a proposal ready to send.",
  },

  // ── ESTRATEGIA ─────────────────────────────────────────────────────────────
  strategos: {
    systemPromptPreview: "You are Strategos, Chief Strategy Officer. You design 90/180-day strategic plans for founders and leadership teams. You diagnose, prioritize, and give a concrete action roadmap. You speak in OKRs, Rocks, and clear priorities.",
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
    chatOpener: "Hi, I'm Strategos. Tell me where your business is now and where you want to be in 90 days. I'll build the roadmap.",
  },
  atlas: {
    systemPromptPreview: "You are Atlas, Market & Competitor Analyst. You map the competitive landscape, identify positioning gaps and build battlecards. You help founders see where they fit and how to win.",
    toneLevel: 0.7,
    recentTasks: [
      { id: '1', task: 'Competitive map — AI marketing agencies Spain (8 players)', status: 'completed', timeAgo: '4h' },
      { id: '2', task: 'Battlecard vs. HubSpot — 5 key differentiators', status: 'completed', timeAgo: '1d' },
      { id: '3', task: 'TAM/SAM/SOM estimation for MIRA LATAM', status: 'working', timeAgo: 'now' },
    ],
    metrics: [
      { label: 'Competitors mapped', value: '34', delta: 'across 6 sectors', positive: true },
      { label: 'Battlecards built', value: '11', delta: '+4 this quarter', positive: true },
      { label: 'Markets analyzed', value: '5', delta: 'ES, TH, MX, CO, US', positive: true },
      { label: 'Win rate impact', value: '+18%', delta: 'with battlecards', positive: true },
    ],
    chatOpener: "Hi, I'm Atlas. Give me your sector and main competitors and I'll map the full competitive landscape with positioning opportunities.",
  },
  blueprint: {
    systemPromptPreview: "You are Blueprint, Business Architect. You audit business models, calculate unit economics and design pricing strategies. You find the design failures that look like execution problems.",
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
    chatOpener: "Hi, I'm Blueprint. Describe your business model — what you sell, to whom, at what price, and your main costs — and I'll audit it.",
  },
  kairos: {
    systemPromptPreview: "You are Kairos, Performance Analyst. You design KPI dashboards, analyze cohorts and turn raw metrics into decisions. You speak in leading indicators, not lagging ones.",
    toneLevel: 0.6,
    recentTasks: [
      { id: '1', task: 'KPI dashboard designed — 12 metrics, 3 traffic lights', status: 'completed', timeAgo: '3h' },
      { id: '2', task: 'Churn cohort analysis — Month 3 is the danger zone', status: 'completed', timeAgo: '1d' },
      { id: '3', task: 'Monthly executive report — Q1 vs Q2 comparison', status: 'working', timeAgo: 'now' },
    ],
    metrics: [
      { label: 'Dashboards built', value: '8', delta: 'operational', positive: true },
      { label: 'Alerts triggered', value: '14', delta: 'early warnings', positive: true },
      { label: 'Decisions influenced', value: '22', delta: 'tracked outcomes', positive: true },
      { label: 'Avg report time', value: '12min', delta: 'vs 4h manual', positive: true },
    ],
    chatOpener: "Hi, I'm Kairos. Tell me what you're trying to measure — business stage, key goals, current metrics — and I'll design your KPI dashboard.",
  },

  // ── INNOVACIÓN ─────────────────────────────────────────────────────────────
  radar: {
    systemPromptPreview: "You are Radar, Trend Intelligence. You monitor emerging signals across technology, business models, culture and regulation. You turn signals into strategic implications for your client's specific industry.",
    toneLevel: 0.5,
    recentTasks: [
      { id: '1', task: 'Weekly trend brief — AI agents disrupting B2B SaaS', status: 'completed', platform: 'Report', timeAgo: '2d' },
      { id: '2', task: 'Alert: EU AI Act enforcement timeline confirmed', status: 'completed', timeAgo: '3d' },
      { id: '3', task: 'Scanning signals: AI + hospitality emerging plays', status: 'working', timeAgo: 'now' },
    ],
    metrics: [
      { label: 'Signals monitored', value: '340', delta: 'weekly average', positive: true },
      { label: 'Briefs delivered', value: '12', delta: 'this quarter', positive: true },
      { label: 'Critical alerts', value: '3', delta: 'this month', positive: false },
      { label: 'Trend accuracy', value: '73%', delta: '6-month validation', positive: true },
    ],
    chatOpener: "Hi, I'm Radar. Tell me your industry and I'll scan what's happening right now — trends, disruptions, and opportunities you should know about.",
  },
  spark: {
    systemPromptPreview: "You are Spark, Innovation Consultant. You facilitate Design Thinking, Design Sprints and Jobs-to-be-Done frameworks. You help teams go from problem definition to testable concepts in structured sessions.",
    toneLevel: 0.3,
    recentTasks: [
      { id: '1', task: 'Design Sprint facilitated — 5-day, 6 participants, MVP defined', status: 'completed', timeAgo: '1w' },
      { id: '2', task: 'JTBD analysis — 4 core jobs identified for new product', status: 'completed', timeAgo: '3d' },
      { id: '3', task: 'Innovation workshop design for Q3 offsite', status: 'working', timeAgo: 'now' },
    ],
    metrics: [
      { label: 'Sprints facilitated', value: '5', delta: 'this year', positive: true },
      { label: 'Ideas to prototype', value: '23', delta: 'from workshops', positive: true },
      { label: 'JTBD mapped', value: '31', delta: 'across 4 clients', positive: true },
      { label: 'Lean Canvas built', value: '9', delta: 'validated concepts', positive: true },
    ],
    chatOpener: "Hi, I'm Spark. Describe the problem you want to solve and I'll guide you through a structured innovation framework to find the right solution.",
  },
  scout: {
    systemPromptPreview: "You are Scout, Open Innovation specialist. You map startup ecosystems, find partners and emerging technologies relevant to your client. You answer: Should we build, buy or partner?",
    toneLevel: 0.5,
    recentTasks: [
      { id: '1', task: 'Startup map — AI tools for F&B industry (18 players)', status: 'completed', timeAgo: '2d' },
      { id: '2', task: 'Build vs. Buy analysis — reservation system', status: 'completed', timeAgo: '4d' },
      { id: '3', task: 'Scouting AI voice agents for restaurant ops', status: 'working', timeAgo: 'now' },
    ],
    metrics: [
      { label: 'Startups scouted', value: '87', delta: 'this quarter', positive: true },
      { label: 'Partnership leads', value: '12', delta: 'identified', positive: true },
      { label: 'Build/Buy/Partner', value: '6', delta: 'decisions made', positive: true },
      { label: 'Tech radars built', value: '3', delta: 'client-specific', positive: true },
    ],
    chatOpener: "Hi, I'm Scout. Tell me what capability you're looking for and I'll map the startup ecosystem and tell you whether to build, buy or partner.",
  },
  venture: {
    systemPromptPreview: "You are Venture, Innovation PM. You manage innovation projects from Discovery to Scale. You work with OKRs, Innovation Accounting and portfolio management by time horizon (H1/H2/H3).",
    toneLevel: 0.6,
    recentTasks: [
      { id: '1', task: 'Innovation roadmap Q3-Q4 — 3 horizons mapped', status: 'completed', timeAgo: '1d' },
      { id: '2', task: 'MVP scoped: AI review responder — 2-week sprint', status: 'completed', timeAgo: '3d' },
      { id: '3', task: 'OKR review — 2 projects advancing to Scale phase', status: 'working', timeAgo: 'now' },
    ],
    metrics: [
      { label: 'Projects managed', value: '6', delta: 'active initiatives', positive: true },
      { label: 'MVPs launched', value: '3', delta: 'this year', positive: true },
      { label: 'Ideas killed early', value: '8', delta: 'saved resources', positive: true },
      { label: 'Innovation velocity', value: '2.3x', delta: 'vs pre-MIRA', positive: true },
    ],
    chatOpener: "Hi, I'm Venture. Give me your idea or hypothesis and I'll help you scope the MVP, define success metrics and build the innovation roadmap.",
  },
  oracle: {
    systemPromptPreview: "You are Oracle, Strategic Foresight specialist. You build future scenarios using Shell methodology and STEEP analysis. You help leaders prepare for multiple possible futures, not just the most likely one.",
    toneLevel: 0.8,
    recentTasks: [
      { id: '1', task: '3 scenarios 2027 — AI regulation, 2 built, 1 conservative', status: 'completed', timeAgo: '4d' },
      { id: '2', task: 'Weak signal report — sovereign AI infrastructure emerging', status: 'completed', timeAgo: '1w' },
      { id: '3', task: 'Futures briefing: AI agents in SMB market by 2026', status: 'working', timeAgo: 'now' },
    ],
    metrics: [
      { label: 'Scenarios built', value: '9', delta: 'this year', positive: true },
      { label: 'STEEP analyses', value: '5', delta: 'sectors covered', positive: true },
      { label: 'Weak signals tracked', value: '42', delta: 'active monitoring', positive: true },
      { label: 'Strategic options', value: '18', delta: 'designed under uncertainty', positive: true },
    ],
    chatOpener: "Hi, I'm Oracle. Tell me your business context and what uncertainties keep you up at night, and I'll build the future scenarios you need to prepare for.",
  },

  // ── ADMIN ──────────────────────────────────────────────────────────────────
  ledger: {
    systemPromptPreview: "You are Ledger, CFO Agent. You track all billing, payments and financial health of the agency. You alert before problems happen — day 3, day 15, day 30 of late payments. You maintain the monthly P&L.",
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
    chatOpener: "Hi, I'm Ledger. I handle all the numbers. Ask me about invoices, payments, P&L or financial health of any client.",
  },
  onboard: {
    systemPromptPreview: "You are Onboard, Client Success manager. You guide new clients through weeks 1-4 with a structured checklist. You detect early churn signals and act before the client disengages.",
    toneLevel: 0.4,
    recentTasks: [
      { id: '1', task: 'Week 1 checklist — Wagyu House: Brand Brain 80% complete', status: 'working', timeAgo: 'now' },
      { id: '2', task: 'Month 1 summary sent — Salsa Burgers 12 posts, 3.4% avg engagement', status: 'completed', timeAgo: '3d' },
      { id: '3', task: 'Churn risk alert — client not opened portal in 8 days', status: 'waiting', platform: 'Alert', timeAgo: '2d' },
    ],
    metrics: [
      { label: 'Active onboardings', value: '2', delta: 'clients in weeks 1-4', positive: true },
      { label: 'Churn rate', value: '0%', delta: 'last 6 months', positive: true },
      { label: 'NPS score', value: '76', delta: '+11 vs industry avg', positive: true },
      { label: 'Activation rate', value: '100%', delta: 'Brand Brain complete', positive: true },
    ],
    chatOpener: "Hi, I'm Onboard. Tell me about your new client — name, business type, goals — and I'll build their weeks 1-4 onboarding plan.",
  },
  pulse: {
    systemPromptPreview: "You are Pulse, AI Observability agent. You monitor the health of all MIRA agents and workflows. You track token usage, error rates and latency. You alert before small issues become outages.",
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
    chatOpener: "Hi, I'm Pulse. I can check the system health, show you token usage, error logs or workflow status. What do you need?",
  },
  herald: {
    systemPromptPreview: "You are Herald, Internal Reporting agent. Every morning at 08:30 you deliver the daily briefing. Every Monday at 09:00 the weekly report. You consolidate data from all agents into one clear, actionable summary.",
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
    chatOpener: "Hi, I'm Herald. Ask me for today's briefing, last week's report, or any summary across all agents and clients.",
  },

  // ── FINANZAS ───────────────────────────────────────────────────────────────
  midas: {
    systemPromptPreview: "You are Midas, Personal Wealth Planner. You help founders build real wealth — not just grow revenue. You separate business and personal finances, design savings systems and optimize cash flow.",
    toneLevel: 0.4,
    recentTasks: [
      { id: '1', task: 'Personal finance diagnosis — 3 immediate priorities identified', status: 'completed', timeAgo: '3d' },
      { id: '2', task: 'Business vs personal separation — 2 accounts opened', status: 'completed', timeAgo: '1w' },
      { id: '3', task: 'Monthly savings plan designed — 30% net income', status: 'working', timeAgo: 'now' },
    ],
    metrics: [
      { label: 'Diagnoses done', value: '4', delta: 'founders this quarter', positive: true },
      { label: 'Avg savings rate', value: '28%', delta: 'clients post-plan', positive: true },
      { label: 'Business/personal', value: '100%', delta: 'separated clients', positive: true },
      { label: 'Emergency funds', value: '3', delta: 'founders fully funded', positive: true },
    ],
    chatOpener: "Hi, I'm Midas. Tell me your monthly income, expenses and savings — I'll give you a personal wealth plan that actually works.",
  },
  quant: {
    systemPromptPreview: "You are Quant, Investment Analyst. You design risk-appropriate portfolios using low-cost ETFs, explain compounding and help founders invest intelligently — not emotionally.",
    toneLevel: 0.7,
    recentTasks: [
      { id: '1', task: 'Portfolio designed — 60/30/10 global ETF allocation', status: 'completed', timeAgo: '2d' },
      { id: '2', task: 'Rebalancing recommendation — tech overweight detected', status: 'completed', timeAgo: '5d' },
      { id: '3', task: 'Monthly portfolio review — 3 clients', status: 'working', timeAgo: 'now' },
    ],
    metrics: [
      { label: 'Portfolios designed', value: '6', delta: 'this quarter', positive: true },
      { label: 'Avg allocation cost', value: '0.18%', delta: 'TER (ultra low)', positive: true },
      { label: 'Rebalancing alerts', value: '4', delta: 'this quarter', positive: true },
      { label: 'Client satisfaction', value: '4.9/5', delta: 'post onboarding', positive: true },
    ],
    chatOpener: "Hi, I'm Quant. Tell me your investable capital, time horizon and risk tolerance, and I'll design your portfolio.",
  },
  fiscal: {
    systemPromptPreview: "You are Fiscal, Tax Optimizer. You help founders and freelancers legally minimize their tax burden. You know compensation structures, deductions, timing strategies and how to set up optimally.",
    toneLevel: 0.7,
    recentTasks: [
      { id: '1', task: 'Tax diagnosis — €8,400 annual savings identified', status: 'completed', timeAgo: '1d' },
      { id: '2', task: 'Optimal salary vs dividends ratio designed', status: 'completed', timeAgo: '3d' },
      { id: '3', task: 'Deduction review — Q2 receipts, 14 missed items', status: 'working', timeAgo: 'now' },
    ],
    metrics: [
      { label: 'Tax diagnosed', value: '5', delta: 'founders this year', positive: true },
      { label: 'Avg savings found', value: '€6,200', delta: 'annual per client', positive: true },
      { label: 'Deductions identified', value: '47', delta: 'missed by clients', positive: true },
      { label: 'Optimization plans', value: '5', delta: 'implemented', positive: true },
    ],
    chatOpener: "Hi, I'm Fiscal. Tell me your country, legal structure, income level and main expenses — I'll find where you're overpaying taxes.",
  },
  harbor: {
    systemPromptPreview: "You are Harbor, Financial Independence & Retirement Planner. You calculate FI numbers, design FIRE plans and run retirement simulations. You help founders make work a choice, not a necessity.",
    toneLevel: 0.5,
    recentTasks: [
      { id: '1', task: 'FI number calculated — $1.4M at 4% withdrawal rate', status: 'completed', timeAgo: '2d' },
      { id: '2', task: 'Lean FIRE plan — FI by age 42 with $1,200/mo savings', status: 'completed', timeAgo: '4d' },
      { id: '3', task: 'Retirement simulation — 20 years, 7% avg return, 3 scenarios', status: 'working', timeAgo: 'now' },
    ],
    metrics: [
      { label: 'FI numbers calculated', value: '6', delta: 'founders this year', positive: true },
      { label: 'Avg FI timeline', value: '14yrs', delta: 'from diagnosis', positive: true },
      { label: 'FIRE plans built', value: '4', delta: 'Lean/Fat/Coast', positive: true },
      { label: 'Simulations run', value: '18', delta: 'scenario planning', positive: true },
    ],
    chatOpener: "Hi, I'm Harbor. Tell me your current savings rate, investable assets and target lifestyle cost — I'll calculate when you can achieve financial independence.",
  },
}

const TABS = [
  { id: 'about',   label: 'About me',     icon: Settings },
  { id: 'history', label: 'What I do',      icon: Zap },
  { id: 'metrics', label: 'How I improve',   icon: BarChart2 },
  { id: 'chat',    label: 'Talk to me', icon: MessageSquare },
]

const TASK_STATUS_CONFIG: Record<TaskStatus, { icon: typeof CheckCircle; color: string; label: string }> = {
  completed: { icon: CheckCircle, color: 'text-emerald-400', label: 'Completado' },
  working:   { icon: Clock,       color: 'text-amber-400',   label: 'En progreso' },
  waiting:   { icon: AlertCircle, color: 'text-blue-400',    label: 'Esperando aprobación' },
}

export default function AgentPage() {
  const params = useParams()
  const role = params.role as string
  const agent = ALL_AGENTS.find(a => a.id === role)

  const { activeClient } = useActiveClient()
  const clientId = activeClient?.id ?? CLIENT_ID

  const [activeTab, setActiveTab] = useState('chat')
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'agent'; content: string }>>([])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [autonomy, setAutonomy] = useState<AutonomyLevel>(
    (agent ? DEFAULT_AUTONOMY[agent.id] : 'ask_if_unsure') ?? 'ask_if_unsure'
  )
  const [copied, setCopied] = useState(false)
  const [liveActivity, setLiveActivity] = useState<{ id: string; task: string; status: TaskStatus; timeAgo: string; platform?: string }[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const agentPrompt = agent ? (AGENT_PROMPTS[agent.id] ?? `Agente especializado de MIRA: ${agent.id}`) : ''

  const copyPrompt = () => {
    navigator.clipboard.writeText(agentPrompt).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  useEffect(() => {
    if (!agent) return
    const storageKey = `mira_chat_${clientId}_${agent.id}`
    const saved = localStorage.getItem(storageKey)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setChatMessages(parsed)
          return
        }
      } catch { /* fallback al opener */ }
    }
    const details = AGENT_DETAILS[agent.id] ?? DEFAULT_AGENT_DETAILS
    if (details?.chatOpener) {
      setChatMessages([{ role: 'agent', content: details.chatOpener }])
    }
  }, [agent?.id, clientId])

  // Carga historial real desde agent_activity
  useEffect(() => {
    if (!agent) return
    const db = createClient()
    db.from('agent_activity')
      .select('id,task_type,status,started_at')
      .eq('client_id', clientId)
      .eq('agent_role', agent.id)
      .order('started_at', { ascending: false })
      .limit(5)
      .then(({ data }) => {
        if (!data?.length) return
        const now = Date.now()
        setLiveActivity(data.map(row => {
          const diff = now - new Date(row.started_at).getTime()
          const m = Math.floor(diff / 60000)
          const timeAgo = m < 1 ? 'ahora' : m < 60 ? `${m} min` : `${Math.floor(m / 60)}h`
          const status: TaskStatus = row.status === 'completed' ? 'completed'
            : row.status === 'working' ? 'working' : 'waiting'
          return { id: row.id, task: row.task_type, status, timeAgo }
        }))
      })
  }, [agent?.id, clientId])

  // Persiste el historial de chat en localStorage
  useEffect(() => {
    if (!agent || chatMessages.length === 0) return
    const storageKey = `mira_chat_${clientId}_${agent.id}`
    localStorage.setItem(storageKey, JSON.stringify(chatMessages))
  }, [chatMessages, agent?.id, clientId])

  const clearChat = () => {
    if (!agent) return
    const storageKey = `mira_chat_${clientId}_${agent.id}`
    localStorage.removeItem(storageKey)
    const details = AGENT_DETAILS[agent.id] ?? DEFAULT_AGENT_DETAILS
    setChatMessages(details?.chatOpener ? [{ role: 'agent', content: details.chatOpener }] : [])
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages, isTyping])

  if (!agent) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-[#555] text-sm mb-3">Agente no encontrado.</p>
          <Link href="/roster" className="text-xs text-white underline">Volver al equipo</Link>
        </div>
      </div>
    )
  }

  const details = AGENT_DETAILS[agent.id] ?? DEFAULT_AGENT_DETAILS

  const sendMessage = async () => {
    if (!inputValue.trim() || isTyping || !agent) return
    const userMsg = inputValue.trim()
    setInputValue('')
    setChatMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setIsTyping(true)

    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: agent.id, message: userMsg, clientId, autonomy }),
      })

      if (!res.ok || !res.body) throw new Error('Error del agente')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let fullText = ''

      // Añadir mensaje vacío del agente que se irá rellenando
      setChatMessages(prev => [...prev, { role: 'agent', content: '' }])
      setIsTyping(false)

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        fullText += decoder.decode(value, { stream: true })
        setChatMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: 'agent', content: fullText }
          return updated
        })
      }
    } catch {
      setIsTyping(false)
      setChatMessages(prev => [...prev, {
        role: 'agent',
        content: 'Lo siento, hubo un error al conectar con el agente. Inténtalo de nuevo.',
      }])
    }
  }

  return (
    <div className="px-8 py-8 max-w-3xl">
      <Link href="/roster" className="flex items-center gap-2 text-[#555] hover:text-white text-sm mb-6 transition-colors w-fit">
        <ArrowLeft size={14} />
        Tu Equipo
      </Link>

      {/* Header */}
      <div className="flex items-center gap-5 mb-8">
        <div
          className={clsx('w-20 h-20 rounded-3xl flex items-center justify-center text-4xl bg-gradient-to-br', agent.gradient)}
          style={{ boxShadow: `0 12px 32px ${agent.color}40` }}
        >
          {agent.emoji}
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-white">{agent.name}</h1>
          <p className="text-[#666] text-sm mt-0.5">{agent.role}</p>
          <p className="text-[#444] text-xs mt-2 italic">&ldquo;{agent.tagline}&rdquo;</p>
        </div>
      </div>

      {/* Capabilities */}
      <div className="flex flex-wrap gap-2 mb-8">
        {agent.capabilities.map(cap => (
          <span
            key={cap}
            className="text-xs px-3 py-1.5 rounded-full border"
            style={{ borderColor: `${agent.color}40`, color: agent.color, backgroundColor: `${agent.color}10` }}
          >
            {cap}
          </span>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b border-[#1E1E1E] flex gap-0 mb-8">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={clsx(
              'flex items-center gap-2 px-4 py-3 text-sm border-b-2 transition-colors',
              activeTab === id
                ? 'border-white text-white'
                : 'border-transparent text-[#555] hover:text-white'
            )}
          >
            <Icon size={13} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab: About me */}
      {activeTab === 'about' && (
        <div className="card p-6 space-y-6">
          <div>
            <h3 className="text-sm font-medium text-white mb-1">Communication tone</h3>
            <p className="text-xs text-[#555] mb-3">How formal or casual is {agent.name}?</p>
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-[#555]">Casual</span>
              <div className="flex-1 h-1.5 bg-[#1E1E1E] rounded-full">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${details.toneLevel * 100}%`, background: agent.color }}
                />
              </div>
              <span className="text-[11px] text-[#555]">Formal</span>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-white mb-1">Identity</h3>
            <p className="text-sm text-[#888] leading-relaxed">{details.systemPromptPreview}</p>
          </div>

          {/* Autonomy dial */}
          <div>
            <h3 className="text-sm font-medium text-white mb-1">Autonomy level</h3>
            <p className="text-xs text-[#555] mb-3">
              When does {agent.name} need your approval before acting?
            </p>
            <div className="grid grid-cols-3 gap-2">
              {AUTONOMY_OPTIONS.map(opt => {
                const Icon = opt.icon
                const selected = autonomy === opt.id
                return (
                  <button
                    key={opt.id}
                    onClick={() => setAutonomy(opt.id)}
                    className={clsx(
                      'p-3 rounded-xl border text-left transition-all',
                      selected
                        ? 'border-white/20 bg-white/6'
                        : 'border-[#1E1E1E] hover:border-[#2E2E2E]'
                    )}
                    style={selected ? { borderColor: `${agent.color}50`, background: `${agent.color}10` } : {}}
                  >
                    <Icon
                      size={14}
                      className="mb-2"
                      style={{ color: selected ? agent.color : '#555' }}
                    />
                    <p className={clsx('text-xs font-medium mb-0.5', selected ? 'text-white' : 'text-[#666]')}>
                      {opt.label}
                    </p>
                    <p className="text-[10px] text-[#444] leading-snug">{opt.description}</p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* System prompt */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-medium text-white">System Prompt</h3>
              <span
                className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                style={{ background: `${agent.color}25`, color: agent.color }}
              >
                v3.1 · active
              </span>
            </div>
            <p className="text-xs text-[#555] mb-3">
              Active instructions that define how {agent.name} thinks and responds.
            </p>
            <div className="bg-[#0A0A0A] rounded-lg p-4 font-mono text-xs text-[#555] leading-relaxed max-h-40 overflow-y-auto border border-[#1A1A1A] whitespace-pre-wrap">
              {agentPrompt}
            </div>
          </div>

          <button
            onClick={copyPrompt}
            className="flex items-center justify-center gap-2 text-sm px-4 py-2 rounded-lg border transition-all w-full hover:opacity-80"
            style={{ borderColor: `${agent.color}40`, color: copied ? '#22c55e' : agent.color }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copied!' : 'Copy system prompt'}
          </button>
        </div>
      )}

      {/* Tab: What I do */}
      {activeTab === 'history' && (
        <div className="space-y-3">
          <p className="text-xs text-[#555] mb-4">Latest tasks executed by {agent.name}.</p>
          {(liveActivity.length > 0 ? liveActivity : details.recentTasks).map(task => {
            const cfg = TASK_STATUS_CONFIG[task.status]
            const StatusIcon = cfg.icon
            return (
              <div key={task.id} className="card p-4 flex items-start gap-3">
                <StatusIcon size={16} className={clsx('mt-0.5 shrink-0', cfg.color)} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#ccc] leading-snug">{task.task}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    {task.platform && (
                      <span className="text-[10px] bg-[#1A1A1A] text-[#555] px-2 py-0.5 rounded-full">
                        {task.platform}
                      </span>
                    )}
                    <span className={clsx('text-[10px] px-2 py-0.5 rounded-full', {
                      'bg-emerald-500/10 text-emerald-400': task.status === 'completed',
                      'bg-amber-500/10 text-amber-400': task.status === 'working',
                      'bg-blue-500/10 text-blue-400': task.status === 'waiting',
                    })}>
                      {cfg.label}
                    </span>
                  </div>
                </div>
                <span className="text-[11px] text-[#444] shrink-0">{task.timeAgo}</span>
              </div>
            )
          })}

          <div className="card p-4 border-dashed border-[#1E1E1E] text-center mt-4">
            <p className="text-xs text-[#444]">
              Full history will connect to <span className="text-[#555]">agent_activity</span> in Supabase.
            </p>
          </div>
        </div>
      )}

      {/* Tab: How I improve */}
      {activeTab === 'metrics' && (
        <div className="space-y-4">
          <p className="text-xs text-[#555] mb-4">Performance metrics for {agent.name} this month.</p>
          <div className="grid grid-cols-2 gap-3">
            {details.metrics.map(metric => (
              <div key={metric.label} className="card p-4">
                <p className="text-[11px] text-[#555] uppercase tracking-wider mb-2">{metric.label}</p>
                <p className="text-2xl font-semibold text-white mb-1">{metric.value}</p>
                <div className="flex items-center gap-1">
                  {metric.positive
                    ? <TrendingUp size={11} className="text-emerald-400" />
                    : <TrendingDown size={11} className="text-red-400" />
                  }
                  <p className={clsx('text-[11px]', metric.positive ? 'text-emerald-400' : 'text-red-400')}>
                    {metric.delta}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="card p-4 mt-2">
            <h3 className="text-xs font-medium text-white mb-3">Improvement areas</h3>
            <div className="space-y-2">
              {(IMPROVEMENT_AREAS[agent.package] ?? IMPROVEMENT_AREAS.marketing).map(item => (
                <div key={item.label} className="flex items-center gap-3">
                  <span className="text-[11px] text-[#555] w-44 shrink-0">{item.label}</span>
                  <div className="flex-1 h-1.5 bg-[#1E1E1E] rounded-full">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${item.pct}%`, background: agent.color }}
                    />
                  </div>
                  <span className="text-[11px] text-[#555] w-8 text-right">{item.pct}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-4 border-dashed border-[#1E1E1E]">
            <p className="text-xs text-[#444] text-center">
              Real metrics will connect to <span className="text-[#555]">agent_activity</span> y post analytics in Supabase.
            </p>
          </div>
        </div>
      )}

      {/* Tab: Talk to me */}
      {activeTab === 'chat' && (
        <div className="flex flex-col h-[460px]">
          {chatMessages.length > 1 && (
            <div className="flex justify-end mb-2">
              <button
                onClick={clearChat}
                className="text-[10px] text-[#444] hover:text-[#666] transition-colors px-2 py-1 rounded border border-[#1E1E1E] hover:border-[#2E2E2E]"
              >
                Clear history
              </button>
            </div>
          )}
          <div className="flex-1 overflow-y-auto space-y-3 pb-4">
            {chatMessages.map((msg, i) => (
              <div key={i} className={clsx('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                {msg.role === 'agent' && (
                  <div
                    className={clsx('w-7 h-7 rounded-xl flex items-center justify-center text-sm mr-2 shrink-0 mt-0.5 bg-gradient-to-br', agent.gradient)}
                  >
                    {agent.emoji}
                  </div>
                )}
                <div
                  className={clsx(
                    'rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                    msg.role === 'user'
                      ? 'max-w-[78%] bg-white text-black rounded-tr-sm'
                      : 'max-w-[92%] bg-[#161616] text-[#ccc] border border-[#1E1E1E] rounded-tl-sm'
                  )}
                >
                  {msg.role === 'user' ? msg.content : (
                    <ReactMarkdown
                      components={{
                        h1: ({children}) => <h1 className="text-base font-bold text-white mb-2 mt-1">{children}</h1>,
                        h2: ({children}) => <h2 className="text-sm font-semibold text-white mb-1.5 mt-3 first:mt-0">{children}</h2>,
                        h3: ({children}) => <h3 className="text-xs font-semibold text-[#aaa] mb-1 mt-2">{children}</h3>,
                        p:  ({children}) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                        strong: ({children}) => <strong className="text-white font-semibold">{children}</strong>,
                        em: ({children}) => <em className="text-[#aaa] italic">{children}</em>,
                        ul: ({children}) => <ul className="list-disc list-inside mb-2 space-y-0.5 text-[#bbb]">{children}</ul>,
                        ol: ({children}) => <ol className="list-decimal list-inside mb-2 space-y-0.5 text-[#bbb]">{children}</ol>,
                        li: ({children}) => <li className="leading-relaxed">{children}</li>,
                        code: ({children}) => <code className="bg-[#0a0a0a] text-[#a78bfa] px-1.5 py-0.5 rounded text-xs font-mono">{children}</code>,
                        pre: ({children}) => <pre className="bg-[#0a0a0a] border border-[#222] rounded-lg p-3 overflow-x-auto text-xs font-mono text-[#aaa] mb-2">{children}</pre>,
                        blockquote: ({children}) => <blockquote className="border-l-2 border-[#333] pl-3 text-[#888] italic mb-2">{children}</blockquote>,
                        hr: () => <hr className="border-[#222] my-3" />,
                        table: ({children}) => <div className="overflow-x-auto mb-2"><table className="text-xs w-full border-collapse">{children}</table></div>,
                        th: ({children}) => <th className="text-left px-2 py-1 text-[#888] border-b border-[#222] font-medium">{children}</th>,
                        td: ({children}) => <td className="px-2 py-1 border-b border-[#1a1a1a] text-[#bbb]">{children}</td>,
                        a: ({href, children}) => <a href={href} className="text-[#a78bfa] underline underline-offset-2 hover:opacity-80" target="_blank" rel="noopener noreferrer">{children}</a>,
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  )}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div
                  className={clsx('w-7 h-7 rounded-xl flex items-center justify-center text-sm mr-2 shrink-0 mt-0.5 bg-gradient-to-br', agent.gradient)}
                >
                  {agent.emoji}
                </div>
                <div className="bg-[#161616] border border-[#1E1E1E] rounded-2xl rounded-tl-sm px-4 py-2.5 flex items-center gap-1">
                  {[0, 1, 2].map(i => (
                    <span
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-[#444] animate-pulse"
                      style={{ animationDelay: `${i * 150}ms` }}
                    />
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="flex gap-2 pt-3 border-t border-[#1E1E1E]">
            <input
              type="text"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder={`Message ${agent.name}...`}
              className="flex-1 bg-[#111] border border-[#1E1E1E] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#444] outline-none focus:border-[#333] transition-colors"
            />
            <button
              onClick={sendMessage}
              disabled={!inputValue.trim() || isTyping}
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all disabled:opacity-30"
              style={{ background: agent.color }}
            >
              <Send size={15} className="text-white" />
            </button>
          </div>

          <p className="text-[10px] text-[#333] text-center mt-2">
            Powered by claude-sonnet-4-6 · Brand Brain active
          </p>
        </div>
      )}
    </div>
  )
}
