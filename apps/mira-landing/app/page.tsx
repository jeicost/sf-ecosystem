'use client'
import { useState } from 'react'

const PORTAL_URL = 'https://mira.startupsfactory.es/login'

// ── Department visuals ────────────────────────────────────────────────────────
const TEAM_VISUALS: Record<string, React.ReactNode> = {
  MKT: (
    <svg viewBox="0 0 560 220" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <defs>
        <linearGradient id="mkt-bg" x1="0" y1="0" x2="560" y2="220" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1a0a2e"/>
          <stop offset="1" stopColor="#0a0a1a"/>
        </linearGradient>
        <linearGradient id="mkt-wave1" x1="0" y1="0" x2="560" y2="0" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8B5CF6" stopOpacity="0"/>
          <stop offset="0.4" stopColor="#8B5CF6" stopOpacity="0.8"/>
          <stop offset="1" stopColor="#c4b5fd" stopOpacity="0.2"/>
        </linearGradient>
        <filter id="mkt-blur"><feGaussianBlur stdDeviation="12"/></filter>
      </defs>
      <rect width="560" height="220" fill="url(#mkt-bg)"/>
      <ellipse cx="280" cy="110" rx="200" ry="100" fill="#7c3aed" fillOpacity="0.12" filter="url(#mkt-blur)"/>
      {[
        { x: 60, y: 50, w: 110, h: 70, op: 0.9 },
        { x: 200, y: 30, w: 130, h: 55, op: 0.7 },
        { x: 360, y: 60, w: 100, h: 80, op: 0.8 },
        { x: 100, y: 140, w: 120, h: 50, op: 0.5 },
        { x: 260, y: 120, w: 90, h: 65, op: 0.6 },
        { x: 420, y: 150, w: 110, h: 45, op: 0.4 },
      ].map((c, i) => (
        <g key={i}>
          <rect x={c.x} y={c.y} width={c.w} height={c.h} rx="8" fill="rgba(139,92,246,0.08)" stroke="rgba(139,92,246,0.25)" strokeWidth="1" opacity={c.op}/>
          <rect x={c.x + 10} y={c.y + 12} width={c.w * 0.6} height="6" rx="3" fill="#8B5CF6" fillOpacity="0.5" opacity={c.op}/>
          <rect x={c.x + 10} y={c.y + 24} width={c.w * 0.85} height="4" rx="2" fill="rgba(255,255,255,0.15)" opacity={c.op}/>
          <rect x={c.x + 10} y={c.y + 34} width={c.w * 0.7} height="4" rx="2" fill="rgba(255,255,255,0.1)" opacity={c.op}/>
        </g>
      ))}
      <path d="M170 85 Q200 60 200 57" stroke="#8B5CF6" strokeWidth="1" strokeOpacity="0.3" strokeDasharray="3 3"/>
      <path d="M330 57 Q360 70 360 100" stroke="#8B5CF6" strokeWidth="1" strokeOpacity="0.3" strokeDasharray="3 3"/>
      <path d="M0 180 Q140 140 280 160 Q420 180 560 140" stroke="url(#mkt-wave1)" strokeWidth="1.5" fill="none"/>
      <rect width="560" height="60" y="160" fill="url(#fade-bottom)"/>
    </svg>
  ),
  SLS: (
    <svg viewBox="0 0 560 220" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <defs>
        <linearGradient id="sls-bg" x1="0" y1="0" x2="560" y2="220" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1a0808"/>
          <stop offset="1" stopColor="#0a0a0f"/>
        </linearGradient>
        <filter id="sls-blur"><feGaussianBlur stdDeviation="14"/></filter>
      </defs>
      <rect width="560" height="220" fill="url(#sls-bg)"/>
      <ellipse cx="280" cy="110" rx="180" ry="80" fill="#EF4444" fillOpacity="0.1" filter="url(#sls-blur)"/>
      {[
        { x: 30, y: 30, w: 500, h: 38, label: 'Prospects' },
        { x: 70, y: 82, w: 420, h: 34, label: 'Contacted' },
        { x: 120, y: 130, w: 320, h: 30, label: 'Qualified' },
        { x: 180, y: 174, w: 200, h: 26, label: 'Proposal' },
      ].map((row, i) => (
        <g key={i}>
          <rect x={row.x} y={row.y} width={row.w} height={row.h} rx="6"
            fill={`rgba(239,68,68,${0.07 - i * 0.01})`}
            stroke={`rgba(239,68,68,${0.35 - i * 0.05})`} strokeWidth="1"/>
          {Array.from({ length: Math.max(2, 6 - i * 1) }).map((_, j) => (
            <circle key={j} cx={row.x + 18 + j * 24} cy={row.y + row.h / 2} r="4"
              fill="#EF4444" fillOpacity={0.7 - j * 0.05}/>
          ))}
          <text x={row.x + row.w - 10} y={row.y + row.h / 2 + 4} textAnchor="end"
            fill="rgba(239,68,68,0.5)" fontSize="9" fontFamily="monospace">{row.label}</text>
        </g>
      ))}
      {[{ x: 480, y: 42, score: 94 }, { x: 480, y: 94, score: 78 }, { x: 480, y: 142, score: 61 }].map((b, i) => (
        <g key={i}>
          <rect x={b.x} y={b.y} width={46} height={18} rx="9" fill="rgba(239,68,68,0.15)" stroke="rgba(239,68,68,0.3)" strokeWidth="1"/>
          <text x={b.x + 23} y={b.y + 12} textAnchor="middle" fill="#EF4444" fontSize="9" fontWeight="700" fontFamily="monospace">{b.score}</text>
        </g>
      ))}
    </svg>
  ),
  STR: (
    <svg viewBox="0 0 560 220" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <defs>
        <linearGradient id="str-bg" x1="0" y1="0" x2="560" y2="220" gradientUnits="userSpaceOnUse">
          <stop stopColor="#080814"/>
          <stop offset="1" stopColor="#0a0a18"/>
        </linearGradient>
        <filter id="str-blur"><feGaussianBlur stdDeviation="16"/></filter>
      </defs>
      <rect width="560" height="220" fill="url(#str-bg)"/>
      <ellipse cx="280" cy="110" rx="160" ry="100" fill="#6366F1" fillOpacity="0.1" filter="url(#str-blur)"/>
      {[0,1,2,3,4,5,6].map(i => (
        <line key={`v${i}`} x1={80 * i} y1="0" x2={80 * i} y2="220" stroke="rgba(99,102,241,0.08)" strokeWidth="1"/>
      ))}
      {[0,1,2,3,4].map(i => (
        <line key={`h${i}`} x1="0" y1={55 * i} x2="560" y2={55 * i} stroke="rgba(99,102,241,0.08)" strokeWidth="1"/>
      ))}
      {[
        { x: 40, y: 40, w: 130, label: 'Diagnosis', fill: '#6366F1' },
        { x: 200, y: 40, w: 140, label: 'Initiatives', fill: '#8B5CF6' },
        { x: 370, y: 40, w: 140, label: 'Execution', fill: '#a78bfa' },
      ].map((block, i) => (
        <g key={i}>
          <rect x={block.x} y={block.y} width={block.w} height={130} rx="10"
            fill={`${block.fill}10`} stroke={`${block.fill}30`} strokeWidth="1.5"/>
          <rect x={block.x} y={block.y} width={block.w} height={6} rx="3" fill={block.fill} fillOpacity="0.6"/>
          <text x={block.x + block.w / 2} y={block.y + 24} textAnchor="middle"
            fill={block.fill} fontSize="9" fontWeight="700" fontFamily="monospace" letterSpacing="0.08em">{block.label}</text>
          {[0,1,2].map(j => (
            <rect key={j} x={block.x + 12} y={block.y + 38 + j * 22} width={block.w - 24} height="14" rx="4"
              fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.07)" strokeWidth="1"/>
          ))}
          {i < 2 && <path d={`M ${block.x + block.w + 2} ${block.y + 65} L ${block.x + block.w + 16} ${block.y + 65}`}
            stroke={block.fill} strokeWidth="1.5" strokeOpacity="0.5" markerEnd="url(#arrow)"/>}
        </g>
      ))}
      <circle cx="280" cy="190" r="12" fill="none" stroke="rgba(99,102,241,0.3)" strokeWidth="1"/>
      <circle cx="280" cy="190" r="3" fill="#6366F1" fillOpacity="0.8"/>
    </svg>
  ),
  INN: (
    <svg viewBox="0 0 560 220" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <defs>
        <linearGradient id="inn-bg" x1="0" y1="0" x2="560" y2="220" gradientUnits="userSpaceOnUse">
          <stop stopColor="#100a04"/>
          <stop offset="1" stopColor="#0a0a0f"/>
        </linearGradient>
        <filter id="inn-blur"><feGaussianBlur stdDeviation="12"/></filter>
        <filter id="inn-node-glow"><feGaussianBlur stdDeviation="4"/></filter>
      </defs>
      <rect width="560" height="220" fill="url(#inn-bg)"/>
      {[
        { cx: 280, cy: 110, r: 18, main: true },
        { cx: 160, cy: 60, r: 10, main: false },
        { cx: 400, cy: 60, r: 10, main: false },
        { cx: 100, cy: 155, r: 8, main: false },
        { cx: 220, cy: 175, r: 8, main: false },
        { cx: 340, cy: 175, r: 8, main: false },
        { cx: 460, cy: 150, r: 9, main: false },
        { cx: 80, cy: 90, r: 6, main: false },
        { cx: 480, cy: 95, r: 6, main: false },
        { cx: 200, cy: 35, r: 5, main: false },
        { cx: 360, cy: 35, r: 5, main: false },
      ].map((node, i) => (
        <g key={i}>
          {node.main && <circle cx={node.cx} cy={node.cy} r={node.r + 8} fill="#F97316" fillOpacity="0.08" filter="url(#inn-node-glow)"/>}
          <circle cx={node.cx} cy={node.cy} r={node.r}
            fill={node.main ? 'rgba(249,115,22,0.15)' : 'rgba(249,115,22,0.07)'}
            stroke={node.main ? 'rgba(249,115,22,0.6)' : 'rgba(249,115,22,0.25)'}
            strokeWidth={node.main ? 1.5 : 1}/>
          {node.main && <circle cx={node.cx} cy={node.cy} r="5" fill="#F97316" fillOpacity="0.9"/>}
        </g>
      ))}
      {[
        [280,110,160,60],[280,110,400,60],[280,110,100,155],[280,110,220,175],
        [280,110,340,175],[280,110,460,150],[160,60,80,90],[160,60,200,35],
        [400,60,480,95],[400,60,360,35],[100,155,80,90],
      ].map(([x1,y1,x2,y2], i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(249,115,22,0.15)" strokeWidth="1" strokeDasharray="4 4"/>
      ))}
      <circle cx="280" cy="110" r="50" stroke="rgba(249,115,22,0.08)" strokeWidth="1" strokeDasharray="3 6"/>
      <circle cx="280" cy="110" r="100" stroke="rgba(249,115,22,0.05)" strokeWidth="1" strokeDasharray="2 8"/>
    </svg>
  ),
  ADM: (
    <svg viewBox="0 0 560 220" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <defs>
        <linearGradient id="adm-bg" x1="0" y1="0" x2="560" y2="220" gradientUnits="userSpaceOnUse">
          <stop stopColor="#041210"/>
          <stop offset="1" stopColor="#040f0f"/>
        </linearGradient>
        <filter id="adm-blur"><feGaussianBlur stdDeviation="14"/></filter>
      </defs>
      <rect width="560" height="220" fill="url(#adm-bg)"/>
      <ellipse cx="280" cy="110" rx="170" ry="80" fill="#10B981" fillOpacity="0.08" filter="url(#adm-blur)"/>
      {[
        { x: 30, y: 25, w: 230, h: 80, label: 'Agent Health', status: 'ok' },
        { x: 300, y: 25, w: 230, h: 80, label: 'Cost Monitor', status: 'ok' },
        { x: 30, y: 120, w: 150, h: 80, label: 'P&L', status: 'warn' },
        { x: 200, y: 120, w: 160, h: 80, label: 'Onboarding', status: 'ok' },
        { x: 380, y: 120, w: 150, h: 80, label: 'Briefing', status: 'ok' },
      ].map((panel, i) => (
        <g key={i}>
          <rect x={panel.x} y={panel.y} width={panel.w} height={panel.h} rx="8"
            fill="rgba(16,185,129,0.05)" stroke="rgba(16,185,129,0.2)" strokeWidth="1"/>
          <rect x={panel.x} y={panel.y} width={panel.w} height={4} rx="2"
            fill={panel.status === 'warn' ? 'rgba(245,158,11,0.6)' : 'rgba(16,185,129,0.5)'}/>
          <text x={panel.x + 10} y={panel.y + 20} fill="rgba(255,255,255,0.4)" fontSize="8" fontFamily="monospace">{panel.label}</text>
          <circle cx={panel.x + panel.w - 14} cy={panel.y + 14}
            r="4" fill={panel.status === 'warn' ? '#F59E0B' : '#10B981'} fillOpacity="0.8"/>
          {[0.9, 0.7, 0.85].map((pct, j) => (
            <g key={j}>
              <rect x={panel.x + 10} y={panel.y + 32 + j * 14} width={panel.w - 50} height="6" rx="3"
                fill="rgba(255,255,255,0.05)"/>
              <rect x={panel.x + 10} y={panel.y + 32 + j * 14} width={(panel.w - 50) * pct} height="6" rx="3"
                fill={panel.status === 'warn' && j === 0 ? 'rgba(245,158,11,0.4)' : 'rgba(16,185,129,0.3)'}/>
            </g>
          ))}
        </g>
      ))}
    </svg>
  ),
  FIN: (
    <svg viewBox="0 0 560 220" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <defs>
        <linearGradient id="fin-bg" x1="0" y1="0" x2="560" y2="220" gradientUnits="userSpaceOnUse">
          <stop stopColor="#10090a"/>
          <stop offset="1" stopColor="#0a0a0f"/>
        </linearGradient>
        <linearGradient id="fin-fill" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#F59E0B" stopOpacity="0.3"/>
          <stop offset="1" stopColor="#F59E0B" stopOpacity="0"/>
        </linearGradient>
        <filter id="fin-blur"><feGaussianBlur stdDeviation="14"/></filter>
      </defs>
      <rect width="560" height="220" fill="url(#fin-bg)"/>
      <ellipse cx="380" cy="120" rx="150" ry="80" fill="#F59E0B" fillOpacity="0.08" filter="url(#fin-blur)"/>
      <path d="M40 180 L100 155 L170 140 L240 118 L310 100 L380 75 L450 55 L520 35 L520 195 L40 195 Z"
        fill="url(#fin-fill)"/>
      <path d="M40 180 L100 155 L170 140 L240 118 L310 100 L380 75 L450 55 L520 35"
        stroke="#F59E0B" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      {[[40,180],[100,155],[170,140],[240,118],[310,100],[380,75],[450,55],[520,35]].map(([x,y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="4" fill="#F59E0B" fillOpacity="0.9"/>
          <circle cx={x} cy={y} r="8" fill="#F59E0B" fillOpacity="0.1"/>
        </g>
      ))}
      {[50,90,130,170].map((y, i) => (
        <g key={i}>
          <line x1="30" y1={y} x2="540" y2={y} stroke="rgba(245,158,11,0.08)" strokeWidth="1"/>
          <text x="22" y={y + 4} textAnchor="end" fill="rgba(245,158,11,0.3)" fontSize="9" fontFamily="monospace">
            {['FI', '80%', '60%', '40%'][i]}
          </text>
        </g>
      ))}
      <line x1="30" y1="40" x2="540" y2="40" stroke="rgba(245,158,11,0.3)" strokeWidth="1" strokeDasharray="4 4"/>
      <rect x="360" y="18" width="80" height="18" rx="4" fill="rgba(245,158,11,0.15)" stroke="rgba(245,158,11,0.3)" strokeWidth="1"/>
      <text x="400" y="30" textAnchor="middle" fill="#F59E0B" fontSize="9" fontWeight="700" fontFamily="monospace">FI TARGET</text>
      {['Jan','Mar','Jun','Sep','Dec'].map((m, i) => (
        <text key={m} x={40 + i * 120} y="210" textAnchor="middle" fill="rgba(245,158,11,0.25)" fontSize="8" fontFamily="monospace">{m}</text>
      ))}
    </svg>
  ),
}

function MiraIcon({ size = 40, glow = false }: { size?: number; glow?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none"
      style={glow ? { filter: 'drop-shadow(0 0 24px rgba(124,58,237,0.8))' } : {}}>
      <path d="M16,82 L16,26 C16,12 24,10 35,10 C46,10 55,24 50,42 C40,56 40,66 50,72"
        stroke="#f4f4f8" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <path d="M84,82 L84,26 C84,12 76,10 65,10 C54,10 45,24 50,42 C60,56 60,66 50,72"
        stroke="#f4f4f8" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <circle cx="50" cy="57" r="2" fill="#7c3aed"/>
      <circle cx="49.2" cy="56.2" r="0.6" fill="rgba(255,255,255,0.8)"/>
    </svg>
  )
}

const TEAMS = [
  {
    key: 'MKT', name: 'Marketing', agents: 8, color: '#8B5CF6',
    tagline: 'Your marketing team, without the payroll.',
    detail: 'Marco coordinates 7 specialists — Luna researches, Alex writes, Zoe designs, Kai edits, Noa publishes, Riva monitors competitors, Sam manages community.',
    capabilities: ['AI content in your brand voice', 'Brief-to-approval pipeline', 'Paid ads competitive intel', 'Community & reputation management'],
  },
  {
    key: 'SLS', name: 'Sales', agents: 5, color: '#EF4444',
    tagline: 'Your sales team, closing while you build.',
    detail: 'Rex prospects, Vera scores, Finn writes icebreakers that sound human, Quinn qualifies replies, Nova closes with tailored proposals.',
    capabilities: ['Apollo & LinkedIn prospecting', 'ICP scoring 0–100', 'Ultra-personalized first messages', 'Proposal generation from call notes'],
  },
  {
    key: 'STR', name: 'Strategy', agents: 4, color: '#6366F1',
    tagline: 'Your strategic partner, always one step ahead.',
    detail: 'Strategos sets the 90-day plan, Atlas maps competitors, Blueprint audits your model & unit economics, Kairos tracks KPIs and alerts you early.',
    capabilities: ['90/180-day strategic plans', 'Business model & pricing audit', 'Competitive landscape mapping', 'Executive KPI reporting'],
  },
  {
    key: 'INN', name: 'Innovation', agents: 5, color: '#F97316',
    tagline: 'Your innovation radar, watching the market for you.',
    detail: 'Radar spots trends before they go mainstream, Spark facilitates Design Sprints, Scout maps open innovation, Venture runs projects, Oracle builds future scenarios.',
    capabilities: ['Weekly trend intelligence', 'Design Sprint facilitation', 'Open innovation scouting', 'Future scenario planning'],
  },
  {
    key: 'ADM', name: 'Admin', agents: 4, color: '#10B981',
    tagline: 'Your ops backbone, so nothing falls through the cracks.',
    detail: 'Ledger tracks P&L and late payments, Onboard manages client success week by week, Pulse monitors all agents in real time, Herald delivers your daily briefing at 08:30.',
    capabilities: ['Daily 08:30 briefing', 'P&L & payment tracking', 'AI cost & health monitoring', 'Automated client onboarding'],
  },
  {
    key: 'FIN', name: 'Finance', agents: 4, color: '#F59E0B',
    tagline: 'Your financial brain, from runway to exit.',
    detail: 'Midas builds your personal financial system, Quant designs your ETF portfolio, Fiscal optimizes your taxes, Harbor maps your FIRE plan.',
    capabilities: ['Personal financial diagnosis', 'Risk-based ETF portfolio', 'Tax optimization', 'FIRE & retirement planning'],
  },
]

const STEPS = [
  { n: '01', who: 'You', title: 'Set the direction', desc: 'A goal, a brief, a question — or a standing instruction. MIRA understands strategic intent, not just tasks.' },
  { n: '02', who: 'MIRA', title: 'Picks the right specialists', desc: 'The system selects the agents, sequences their work and coordinates them — without you managing anything.' },
  { n: '03', who: 'MIRA', title: 'Delivers structured output', desc: 'Content, leads, plans, reports — ready in your portal for review.' },
  { n: '04', who: 'You', title: 'Approve or redirect', desc: 'One click to approve. Nothing ships without your sign-off.' },
]

const FAQS = [
  { q: 'How is this different from ChatGPT?', a: "ChatGPT is a blank slate every session. MIRA is 30 agents that know your business, coordinate without being told, and deliver work ready to approve. It's the difference between a tool and a team." },
  { q: 'What does "one-time payment" mean exactly?', a: 'You buy MIRA once and own it. No monthly fee unless you want ongoing updates and new agents ($9.99/mo, optional and cancellable anytime). The core product — agents, portal, Brand Brain — is yours permanently.' },
  { q: 'What is the Brand Brain?', a: "MIRA's memory for your business. It stores your brand identity, tone of voice, content pillars, banned phrases and past performance. Every agent reads it before acting — so output always sounds like you, not generic AI." },
  { q: 'Do I need technical knowledge?', a: 'Zero. Submit a brief, review the output, approve it. No prompts, no configuration, no setup beyond a 24-hour onboarding session.' },
  { q: 'What happens after I buy?', a: "We run a 24-hour onboarding to configure your Brand Brain — brand identity, tone, pillars. After that, your team is operational. MIRA Marketing is ready in 24 hours. Full Stack in 48." },
  { q: 'Can I upgrade from Marketing to Full Stack later?', a: 'Yes. Pay the difference ($200) anytime. Your Brand Brain and history carry over automatically.' },
  { q: 'I already have a small team. Does MIRA work alongside them?', a: "Yes — and that's where MIRA is most powerful. Your team sets direction, MIRA handles execution. Your designers brief, MIRA writes. Your strategy lead decides, MIRA runs the research. Every department gets 4-8 extra specialists without adding to payroll." },
  { q: 'Do I need to be in Bangkok?', a: '100% remote. Brand Brain setup happens over a short video call or async form — you can be anywhere. MIRA works across timezones 24/7.' },
  { q: 'Is MIRA for me if I\'m building a personal brand, not a startup?', a: "Yes. MIRA's Marketing and Strategy departments work the same for a personal brand as for a startup. Your Brand Brain captures your voice, your values and your standards — whether the brand is a company or you." },
]

export default function Page() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [activeTeam, setActiveTeam] = useState<string>('MKT')

  const team = TEAMS.find(t => t.key === activeTeam)!

  return (
    <main style={{ overflowX: 'hidden' }}>

      {/* ── NAV ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: 'rgba(10,10,15,0.8)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', height: 58, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <MiraIcon size={26} />
            <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: '-0.04em', color: '#f4f4f8' }}>MIRA</span>
            <span className="nav-tagline" style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', marginLeft: 2 }}>by Startup Factory</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <a href="#pricing" className="nav-pricing-link" style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', textDecoration: 'none', padding: '6px 14px' }}>Pricing</a>
            <a href="#cta-form" className="nav-cta-mobile" onClick={(e) => { e.preventDefault(); document.getElementById('cta-form')?.scrollIntoView({ behavior: 'smooth' }); }} style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', textDecoration: 'none', padding: '6px 14px' }}>Get MIRA</a>
            <a href={PORTAL_URL} style={{
              fontSize: 13, fontWeight: 600, color: '#fff', textDecoration: 'none',
              padding: '8px 18px', borderRadius: 10, background: 'linear-gradient(135deg,#7c3aed,#5b21b6)',
              boxShadow: '0 0 20px rgba(124,58,237,0.35)',
            }}>Sign in →</a>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="hero-section" style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', paddingTop: 58, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%,-50%)', width: 900, height: 700, background: 'radial-gradient(circle, rgba(124,58,237,0.14) 0%, transparent 65%)', filter: 'blur(40px)' }} />
          <div style={{ position: 'absolute', inset: 0, opacity: 0.025, backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)', backgroundSize: '64px 64px' }} />
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg,transparent,rgba(124,58,237,0.5) 50%,transparent)' }} />
        </div>

        {[
          { name: 'Marco', role: 'Creative Director', x: 4, y: 12 },
          { name: 'Strategos', role: 'Chief Strategy Officer', x: 68, y: 8 },
          { name: 'Rex', role: 'Lead Scout', x: 70, y: 72 },
          { name: 'Midas', role: 'Wealth Planner', x: 3, y: 70 },
          { name: 'Radar', role: 'Trend Intelligence', x: 30, y: 4 },
          { name: 'Quant', role: 'Investment Analyst', x: 12, y: 45 },
          { name: 'Nova', role: 'Proposal Writer', x: 72, y: 42 },
        ].map((a, i) => (
          <div key={a.name} className="agent-float" style={{
            position: 'absolute', left: `${a.x}%`, top: `${a.y}%`, zIndex: 2,
            animation: `agentFloat ${5 + i * 0.4}s ease-in-out ${i * 0.5}s infinite`,
          }}>
            <div style={{
              padding: '8px 14px', borderRadius: 10,
              background: 'rgba(14,14,22,0.9)', border: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(8px)',
            }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.85)', lineHeight: 1 }}>{a.name}</p>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', lineHeight: 1, marginTop: 3 }}>{a.role}</p>
            </div>
          </div>
        ))}

        <div className="hero-content" style={{ position: 'relative', maxWidth: 1100, margin: '0 auto', padding: '80px 24px', textAlign: 'center', zIndex: 3 }}>
          {/* Eyebrow */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 16px', borderRadius: 100, border: '1px solid rgba(124,58,237,0.3)', marginBottom: 36 }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#7c3aed', animation: 'pulse-glow 2s infinite' }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(124,58,237,0.8)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>The team built for founders · 2026</span>
          </div>

          {/* Animated logo */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 36 }}>
            <div style={{ position: 'relative', width: 120, height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '1px solid rgba(124,58,237,0.35)', animation: 'ripple1 3s ease-out infinite' }} />
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '1px solid rgba(124,58,237,0.2)', animation: 'ripple1 3s ease-out 1s infinite' }} />
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '1px solid rgba(124,58,237,0.1)', animation: 'ripple1 3s ease-out 2s infinite' }} />
              <div style={{ position: 'absolute', width: 80, height: 80, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.45) 0%, rgba(124,58,237,0.1) 50%, transparent 75%)', animation: 'coreGlow 2.8s ease-in-out infinite' }} />
              <svg width="72" height="72" viewBox="0 0 100 100" fill="none" style={{ position: 'relative', zIndex: 1 }}>
                <path d="M16,82 L16,26 C16,12 24,10 35,10 C46,10 55,24 50,42 C40,56 40,66 50,72"
                  stroke="#f4f4f8" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" fill="none"
                  style={{ animation: 'strokeBrighten 2.8s ease-in-out infinite' }}/>
                <path d="M84,82 L84,26 C84,12 76,10 65,10 C54,10 45,24 50,42 C60,56 60,66 50,72"
                  stroke="#f4f4f8" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" fill="none"
                  style={{ animation: 'strokeBrighten 2.8s ease-in-out infinite' }}/>
                <circle cx="50" cy="57" r="5" fill="#7c3aed" fillOpacity="0.25" style={{ animation: 'pupilGlow 2.8s ease-in-out infinite' }}/>
                <circle cx="50" cy="57" r="2.2" fill="#7c3aed" style={{ animation: 'pupilGlow 2.8s ease-in-out infinite' }}/>
                <circle cx="49" cy="56" r="0.8" fill="rgba(255,255,255,0.95)"/>
              </svg>
            </div>
          </div>

          <h1 className="hero-h1" style={{ fontSize: 'clamp(40px,7vw,88px)', fontWeight: 800, lineHeight: 0.96, letterSpacing: '-0.05em', marginBottom: 20 }}>
            <span style={{ display: 'block', color: '#f4f4f8' }}>Stop operating your startup.</span>
            <span style={{ display: 'block', background: 'linear-gradient(135deg,#a78bfa 0%,#7c3aed 50%,#c4b5fd 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Start directing it.</span>
          </h1>

          <p style={{ fontSize: 'clamp(15px,2vw,20px)', color: 'rgba(255,255,255,0.4)', maxWidth: 560, margin: '24px auto 44px', lineHeight: 1.65, fontWeight: 400 }}>
            MIRA is the AI team that knows your brand, runs your departments and gets smarter every week. You direct the strategy — your team does the rest. Marketing, Sales, Strategy, Innovation, Admin and Finance, coordinated from day one.
          </p>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 64 }}>
            <a href="#pricing" style={{
              fontSize: 15, fontWeight: 700, color: '#fff', textDecoration: 'none', padding: '14px 32px', borderRadius: 12,
              background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', boxShadow: '0 0 36px rgba(124,58,237,0.45)',
              display: 'inline-flex', alignItems: 'center', gap: 8, transition: 'all 0.2s',
            }}>Complete my startup →</a>
            <a href="#how-it-works" style={{
              fontSize: 15, fontWeight: 600, color: 'rgba(255,255,255,0.6)', textDecoration: 'none', padding: '14px 32px', borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)',
              display: 'inline-flex', alignItems: 'center', gap: 8,
            }}>See what&apos;s inside</a>
          </div>

          <div className="hero-stats" style={{ display: 'flex', justifyContent: 'center', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 40, marginBottom: 56 }}>
            {[{ n: '30', l: 'Agents' }, { n: '6', l: 'Departments' }, { n: '24/7', l: 'Available' }, { n: '$99', l: 'To start' }].map(({ n, l }, i) => (
              <div key={l} className="hero-stat-item" style={{ padding: '0 32px', textAlign: 'center', borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.08)' : 'none' }}>
                <p style={{ fontSize: 34, fontWeight: 800, color: '#f4f4f8', letterSpacing: '-0.04em', lineHeight: 1 }}>{n}</p>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 6, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{l}</p>
              </div>
            ))}
          </div>

          {/* Agent preview grid */}
          <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 8, maxWidth: 680, margin: '0 auto' }}>
            {[
              { e: '🎬', n: 'Marco', c: '#8B5CF6' }, { e: '✍️', n: 'Alex', c: '#8B5CF6' },
              { e: '🔍', n: 'Rex', c: '#EF4444' }, { e: '🎯', n: 'Vera', c: '#EF4444' },
              { e: '🔭', n: 'Strategos', c: '#6366F1' }, { e: '📊', n: 'Kairos', c: '#6366F1' },
              { e: '📡', n: 'Radar', c: '#F97316' }, { e: '✨', n: 'Spark', c: '#F97316' },
              { e: '📰', n: 'Herald', c: '#10B981' }, { e: '💳', n: 'Ledger', c: '#10B981' },
              { e: '💎', n: 'Midas', c: '#F59E0B' }, { e: '📈', n: 'Quant', c: '#F59E0B' },
            ].map((a, i) => (
              <div key={a.n} className={`animate-float-delay-${i % 6}`} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 14px', borderRadius: 10, background: `${a.c}0d`, border: `1px solid ${a.c}28`, backdropFilter: 'blur(8px)' }}>
                <span style={{ fontSize: 16, lineHeight: 1 }}>{a.e}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.75)' }}>{a.n}</span>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: a.c, boxShadow: `0 0 6px ${a.c}` }} />
              </div>
            ))}
            <div style={{ width: '100%', textAlign: 'center', marginTop: 12 }}>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.06em' }}>+ 18 more specialists across all departments</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── BUILT BY FOUNDERS ── */}
      <section style={{ background: '#0c0c14', padding: '64px 24px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 80 }} className="resp-grid-founders">
          <div style={{ flexShrink: 0 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 14 }}>Why us</p>
            <h2 style={{ fontSize: 'clamp(22px,3vw,36px)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1, whiteSpace: 'nowrap' }}>
              By founders.<br />For founders.
            </h2>
          </div>
          <div style={{ width: 1, alignSelf: 'stretch', background: 'rgba(255,255,255,0.07)', flexShrink: 0 }} className="founders-divider" />
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.45)', lineHeight: 1.75, maxWidth: 600 }}>
            MIRA is built by Startup Factory — a team that has launched, scaled and broken its head over the same problems you&apos;re facing right now. Every agent, every workflow, every pricing decision comes from someone who has sat in your chair.
          </p>
        </div>
      </section>

      {/* ── PROBLEM ── */}
      <section style={{ background: '#0a0a0f', padding: '80px 24px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ marginBottom: 48 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 20 }}>The problem</p>
            <h2 style={{ fontSize: 'clamp(28px,3.5vw,46px)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 20, maxWidth: 620 }}>
              You don&apos;t need more tools.<br />You need a team.
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 16, lineHeight: 1.75, maxWidth: 680 }}>
              You&apos;ve already tried the AI stack. ChatGPT for content, Apollo for leads, Notion for ops, a new tool for every gap. Connecting them is a job. Maintaining them is another. Training each one to know your brand is a third. You wanted leverage. You got another part-time job.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 24 }} className="resp-grid-problem-cards">
            {[
              { title: 'Stacking tools isn\'t a team', body: 'Twelve subscriptions don\'t coordinate. Every prompt starts blank. Nothing remembers your brand.' },
              { title: 'Building agents is another full-time job', body: 'Connecting APIs, writing prompts, training models, keeping it all updated — you end up doing IT instead of building your company.' },
              { title: 'Hiring isn\'t an option yet', body: 'A real team costs $500k/year and six months to assemble. You need the output today, without the burden.' },
            ].map((item, i) => (
              <div key={i} style={{ padding: '24px 28px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 14, color: '#ef4444', lineHeight: 1 }}>×</span>
                </div>
                <p style={{ fontSize: 15, fontWeight: 700, color: '#f4f4f8' }}>{item.title}</p>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>{item.body}</p>
              </div>
            ))}
          </div>

          <div style={{ padding: '18px 28px', borderRadius: 12, background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.25)', textAlign: 'center' }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#c4b5fd' }}>MIRA is the team you don&apos;t have to build.</span>
          </div>
        </div>
      </section>

      {/* ── BRAND BRAIN ── */}
      <section style={{ background: '#0c0c14', padding: '80px 24px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="resp-grid-brain" style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 20 }}>The differentiator</p>
            <h2 style={{ fontSize: 'clamp(28px,3.5vw,46px)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 20 }}>
              It knows your startup.<br />And learns more every week.
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 16, lineHeight: 1.75, marginBottom: 32 }}>
              Most AI tools start blank every time. MIRA reads your <strong style={{ color: '#f4f4f8', fontWeight: 600 }}>Brand Brain</strong> before every task — and gets sharper with every piece you approve, edit or reject.
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['Brand identity', 'Tone of voice', 'Content pillars', 'Banned phrases', 'Competitors', 'Post history'].map(tag => (
                <span key={tag} style={{ fontSize: 12, padding: '5px 14px', borderRadius: 100, background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)', color: '#a78bfa', fontWeight: 500 }}>{tag}</span>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {[
              { n: '01', title: 'Your startup profile, loaded once', desc: "Define your mission, model, tone, competitors and priorities. MIRA maps it all — and every agent reads it before acting. No repeating yourself." },
              { n: '02', title: 'Every agent uses it', desc: 'Before any agent acts, it queries your Brand Brain. Output matches your identity automatically.' },
              { n: '03', title: "It gets smarter", desc: 'Every approved piece feeds back. The more MIRA works for you, the better it gets.' },
              { n: '04', title: 'You shape it interactively', desc: "Every approval, edit and rejection trains MIRA's taste. The more you direct, the more it sounds like you — without any prompting." },
            ].map((item, i) => (
              <div key={i} style={{
                padding: '24px 28px', borderRadius: 12, display: 'flex', gap: 20, alignItems: 'flex-start',
                background: i === 1 ? 'rgba(124,58,237,0.07)' : 'rgba(255,255,255,0.02)',
                border: i === 1 ? '1px solid rgba(124,58,237,0.2)' : '1px solid rgba(255,255,255,0.06)',
              }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.1em', flexShrink: 0, paddingTop: 3 }}>{item.n}</span>
                <div>
                  <h4 style={{ fontSize: 16, fontWeight: 700, color: '#f4f4f8', marginBottom: 6 }}>{item.title}</h4>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.65 }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TEAMS ── */}
      <section id="teams" style={{ padding: '80px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 16 }}>Your complete startup</p>
            <h2 style={{ fontSize: 'clamp(28px,4vw,52px)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.05 }}>
              Every department your startup needs.<br />
              <span style={{ background: 'linear-gradient(135deg,#a78bfa,#7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>All 30 specialists. Day one.</span>
            </h2>
          </div>

          <div className="teams-tabs-bar" style={{ display: 'flex', gap: 2, marginBottom: 2, borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: 4 }}>
            {TEAMS.map(t => (
              <button key={t.key}
                onClick={() => setActiveTeam(t.key)}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 10, border: 'none', cursor: 'pointer', transition: 'all 0.18s',
                  background: activeTeam === t.key ? 'rgba(255,255,255,0.08)' : 'transparent',
                  fontFamily: 'inherit',
                }}>
                <span style={{ display: 'block', fontSize: 10, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: activeTeam === t.key ? '#f4f4f8' : 'rgba(255,255,255,0.35)', marginBottom: 2 }}>{t.name}</span>
                <span style={{ display: 'block', fontSize: 10, color: activeTeam === t.key ? t.color : 'rgba(255,255,255,0.2)', fontWeight: 600 }}>{t.agents} agents</span>
                {activeTeam === t.key && <div style={{ width: '40%', height: 2, borderRadius: 2, background: t.color, margin: '6px auto 0', boxShadow: `0 0 8px ${t.color}` }} />}
              </button>
            ))}
          </div>

          <div className="teams-panel" style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0,
            border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, overflow: 'hidden',
          }}>
            <div className="teams-panel-left" style={{ borderRight: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ position: 'relative', height: 200, overflow: 'hidden', borderBottom: `1px solid ${team.color}18` }}>
                {TEAM_VISUALS[team.key]}
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 60, background: 'linear-gradient(to bottom, transparent, rgba(12,12,20,0.95))' }} />
              </div>
              <div className="teams-panel-info" style={{ padding: '32px 40px 40px' }}>
                <div style={{ display: 'inline-flex', padding: '4px 12px', borderRadius: 100, background: `${team.color}15`, border: `1px solid ${team.color}25`, marginBottom: 20 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: team.color, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{team.agents} agents · {team.name}</span>
                </div>
                <h3 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em', color: '#f4f4f8', marginBottom: 14, lineHeight: 1.2 }}>{team.tagline}</h3>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.75, marginBottom: 28 }}>{team.detail}</p>
                <a href={PORTAL_URL} style={{
                  fontSize: 13, fontWeight: 600, color: team.color, textDecoration: 'none',
                  padding: '10px 20px', borderRadius: 10, border: `1px solid ${team.color}30`,
                  background: `${team.color}10`, display: 'inline-flex', alignItems: 'center', gap: 6,
                }}>Meet the {team.name} team →</a>
              </div>
            </div>
            <div className="teams-panel-right" style={{ padding: '48px', background: 'rgba(255,255,255,0.015)' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 28 }}>What they deliver</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {team.capabilities.map((cap, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderRadius: 10, background: i === 0 ? `${team.color}08` : 'transparent', border: `1px solid ${i === 0 ? team.color + '20' : 'rgba(255,255,255,0.05)'}` }}>
                    <div style={{ width: 20, height: 20, borderRadius: 6, background: `${team.color}18`, border: `1px solid ${team.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M2 5l2 2 4-4" stroke={team.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', fontWeight: 500 }}>{cap}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Agents in this team</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {({
                    MKT: ['Marco', 'Luna', 'Alex', 'Zoe', 'Kai', 'Noa', 'Riva', 'Sam'],
                    SLS: ['Rex', 'Vera', 'Finn', 'Quinn', 'Nova'],
                    STR: ['Strategos', 'Atlas', 'Blueprint', 'Kairos'],
                    INN: ['Radar', 'Spark', 'Scout', 'Venture', 'Oracle'],
                    ADM: ['Ledger', 'Onboard', 'Pulse', 'Herald'],
                    FIN: ['Midas', 'Quant', 'Fiscal', 'Harbor'],
                  } as Record<string, string[]>)[team.key].map(name => (
                    <span key={name} style={{ fontSize: 12, padding: '4px 12px', borderRadius: 100, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>{name}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" style={{ padding: '80px 24px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 16 }}>The workflow</p>
            <h2 style={{ fontSize: 'clamp(28px,4vw,48px)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.1 }}>
              You direct.<br />MIRA executes.
            </h2>
          </div>

          <div className="resp-grid-workflow" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
            {STEPS.map((step, i) => (
              <div key={i} style={{
                padding: '32px', borderRadius: 12, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)',
                borderTopColor: i < 2 ? 'rgba(255,255,255,0.07)' : 'transparent',
                borderLeftColor: i % 2 === 0 ? 'rgba(255,255,255,0.07)' : 'transparent',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.15)', letterSpacing: '0.08em' }}>{step.n}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.3)', padding: '3px 10px', borderRadius: 100, border: '1px solid rgba(255,255,255,0.08)' }}>{step.who}</span>
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', color: '#f4f4f8', marginBottom: 10 }}>{step.title}</h3>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', lineHeight: 1.65 }}>{step.desc}</p>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 16, padding: '20px 28px', borderRadius: 12, background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.18)', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#7c3aed', flexShrink: 0, animation: 'pulse-glow 2s infinite' }} />
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6 }}>
              And while you sleep, MIRA&apos;s always-on agents bring you briefings, signals and opportunities — without you asking.
            </p>
          </div>
        </div>
      </section>

      {/* ── USE CASES ── */}
      <section style={{ padding: '80px 0', borderTop: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', marginBottom: 48 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 16 }}>Real use cases</p>
          <h2 style={{ fontSize: 'clamp(28px,4vw,48px)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.05 }}>
            What your startup gets<br />
            <span style={{ background: 'linear-gradient(135deg,#a78bfa,#7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>from day one.</span>
          </h2>
        </div>
        <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingLeft: 24, paddingRight: 24, paddingBottom: 8, scrollbarWidth: 'none', msOverflowStyle: 'none' }} className="use-cases-scroll">
          {[
            {
              n: '01', color: '#8B5CF6', team: 'Marketing',
              command: '"Write 3 pieces of content this week in my brand voice — LinkedIn, Reel, and a newsletter."',
              agents: ['Marco', 'Luna', 'Alex', 'Noa'],
              output: '3 pieces in your approval queue in under 20 minutes. Each written in your exact tone, pillar-aligned, ready to publish.',
            },
            {
              n: '02', color: '#EF4444', team: 'Sales',
              command: '"Find 30 SaaS founders in Southeast Asia and write a personalized icebreaker for each."',
              agents: ['Rex', 'Vera', 'Finn'],
              output: '30 leads scored by ICP fit. 30 personalized first messages referencing their latest LinkedIn posts and company news.',
            },
            {
              n: '03', color: '#6366F1', team: 'Strategy',
              command: '"I\'m a solo founder at €5k MRR. What should I focus on this quarter to reach €20k?"',
              agents: ['Strategos', 'Atlas', 'Kairos'],
              output: 'Startup diagnosis, 3 priority initiatives, weekly KPI cadence and risk map — delivered as a structured plan in 10 minutes.',
            },
            {
              n: '04', color: '#F97316', team: 'Innovation',
              command: '"What AI trends should I be watching this month? I\'m in the agency business."',
              agents: ['Radar', 'Oracle'],
              output: 'Weekly briefing with short-term signals, mid-term opportunities, and one weak signal nobody is talking about yet.',
            },
            {
              n: '05', color: '#10B981', team: 'Admin',
              command: '"My startup has 3 clients. Set up a weekly briefing so I know exactly where everything stands."',
              agents: ['Herald', 'Ledger', 'Pulse'],
              output: 'Daily 08:30 briefing with client status, P&L summary, pipeline health and agent performance — delivered every morning automatically.',
            },
            {
              n: '06', color: '#a78bfa', team: 'Always on',
              command: '"Keep me informed on what matters this week."',
              agents: ['Herald', 'Radar', 'Pulse'],
              output: 'Every Monday at 08:30 — a 5-line briefing on your pipeline, your content performance, your competitors\' moves and one strategic opportunity Radar surfaced overnight. Every week. Without asking.',
            },
          ].map((uc, i) => (
            <div key={i} style={{
              minWidth: 340, maxWidth: 340, padding: '32px 28px', borderRadius: 18, flexShrink: 0,
              border: `1px solid ${uc.color}22`,
              background: `linear-gradient(160deg, ${uc.color}08 0%, rgba(10,10,15,0) 60%)`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: uc.color, letterSpacing: '0.1em' }}>USE CASE {uc.n}</span>
                <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 100, background: `${uc.color}12`, border: `1px solid ${uc.color}25`, color: uc.color, fontWeight: 600 }}>{uc.team}</span>
              </div>
              <div style={{ padding: '16px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 20 }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>You set:</p>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.6, fontStyle: 'italic' }}>{uc.command}</p>
              </div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
                {uc.agents.map((a, j) => (
                  <span key={j} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 100, background: `${uc.color}10`, border: `1px solid ${uc.color}20`, color: uc.color, fontWeight: 600 }}>{a}</span>
                ))}
                <span style={{ fontSize: 11, padding: '3px 8px', color: 'rgba(255,255,255,0.2)' }}>activate</span>
              </div>
              <div style={{ padding: '14px', borderRadius: 10, background: `${uc.color}08`, border: `1px solid ${uc.color}18` }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: uc.color, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Result:</p>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.65 }}>{uc.output}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="use-cases-hint" style={{ display: 'none', justifyContent: 'center', alignItems: 'center', gap: 6, paddingTop: 20, paddingBottom: 4 }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.08em' }}>swipe</span>
          <div style={{ display: 'flex', gap: 4 }}>
            {[0,1,2,3,4,5].map(i => (
              <div key={i} style={{ width: i === 0 ? 16 : 6, height: 4, borderRadius: 2, background: i === 0 ? 'rgba(124,58,237,0.6)' : 'rgba(255,255,255,0.15)' }} />
            ))}
          </div>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.08em' }}>→</span>
        </div>
      </section>

      {/* ── WHAT YOU STOP DOING ── */}
      <section style={{ background: '#0c0c14', padding: '80px 24px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 16 }}>The real promise</p>
            <h2 style={{ fontSize: 'clamp(28px,4vw,48px)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.1 }}>
              What you stop doing<br />on day one.
            </h2>
          </div>

          <div className="resp-grid-before-after" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 32 }}>
            {/* Before */}
            <div style={{ padding: '32px', borderRadius: 16, background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.15)' }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: 'rgba(239,68,68,0.6)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 24 }}>Before MIRA</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  'Connecting tools and APIs',
                  'Writing prompts for every task',
                  'Re-explaining your brand to every model',
                  'Maintaining a 12-tool stack',
                  'Training your assistants',
                  'Keeping everything updated',
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 20, height: 20, borderRadius: 6, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: 12, color: '#ef4444', lineHeight: 1 }}>×</span>
                    </div>
                    <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)' }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* After */}
            <div style={{ padding: '32px', borderRadius: 16, background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.2)' }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: 'rgba(167,139,250,0.7)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 24 }}>With MIRA</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  'One portal',
                  'One Brand Brain',
                  'One team',
                  'Coordinated output',
                  'Continuous improvement',
                  'Zero stack maintenance',
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 20, height: 20, borderRadius: 6, background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M2 5l2 2 4-4" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'center', padding: '20px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}>
              You went from operator to director. That was the whole point.
            </p>
          </div>
        </div>
      </section>

      {/* ── MIRA VS YOUR STACK ── */}
      <section style={{ padding: '80px 24px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 16 }}>Why MIRA</p>
            <h2 style={{ fontSize: 'clamp(28px,4vw,48px)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.1 }}>
              MIRA vs your current stack.
            </h2>
          </div>

          <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
            {/* Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1.1fr', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ padding: '16px 24px' }} />
              {[
                { label: 'Generic AI', sub: 'ChatGPT' },
                { label: 'Current stack', sub: '12 tools' },
                { label: 'MIRA', sub: '', highlight: true },
              ].map((col, i) => (
                <div key={i} style={{
                  padding: '16px 20px', textAlign: 'center',
                  background: col.highlight ? 'rgba(124,58,237,0.1)' : 'transparent',
                  borderLeft: '1px solid rgba(255,255,255,0.07)',
                }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: col.highlight ? '#c4b5fd' : 'rgba(255,255,255,0.6)' }}>{col.label}</p>
                  {col.sub && <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{col.sub}</p>}
                </div>
              ))}
            </div>
            {/* Rows */}
            {[
              { label: 'Knows your brand', vals: ['No', 'Partial', 'Yes — Brand Brain'] },
              { label: 'Coordinates departments', vals: ['No', 'No', 'Yes — 30 agents, 1 system'] },
              { label: 'Setup time', vals: ['Per prompt', 'Months', '24 hours'] },
              { label: 'Maintenance', vals: ['Yours', 'Yours', 'None'] },
              { label: 'Gets better with use', vals: ['No', 'No', 'Yes'] },
              { label: 'Cost', vals: ['Per seat / month', 'Multiple subscriptions', '$99–$299 one-time'] },
            ].map((row, ri) => (
              <div key={ri} style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1.1fr', borderBottom: ri < 5 ? '1px solid rgba(255,255,255,0.05)' : 'none', background: ri % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent' }}>
                <div style={{ padding: '16px 24px', display: 'flex', alignItems: 'center' }}>
                  <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)' }}>{row.label}</span>
                </div>
                {row.vals.map((val, vi) => (
                  <div key={vi} style={{
                    padding: '16px 20px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: vi === 2 ? 'rgba(124,58,237,0.05)' : 'transparent',
                    borderLeft: '1px solid rgba(255,255,255,0.07)',
                  }}>
                    <span style={{
                      fontSize: 13,
                      color: vi === 2 ? '#c4b5fd' : (val === 'No' || val === 'Yours' ? 'rgba(239,68,68,0.55)' : 'rgba(255,255,255,0.35)'),
                      fontWeight: vi === 2 ? 600 : 400,
                    }}>{val}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MEET YOUR TEAM ── */}
      <section id="team-roster" style={{ background: '#07070f', padding: '96px 24px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(124,58,237,0.7)', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 16 }}>Your complete team</p>
            <h2 style={{ fontSize: 'clamp(30px,4.5vw,54px)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.05, marginBottom: 16, color: '#f4f4f8' }}>
              30 specialists.<br />
              <span style={{ background: 'linear-gradient(135deg,#a78bfa 0%,#7c3aed 60%,#c4b5fd 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>One team. Yours forever.</span>
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 16, maxWidth: 480, margin: '0 auto' }}>
              Each agent is a specialist. All coordinated by MIRA. All learning your brand from day one.
            </p>
          </div>

          {/* Department rows */}
          {[
            { dept: 'Marketing', color: '#8B5CF6', agents: [{ e: '🎬', n: 'Marco', r: 'Creative Director' }, { e: '🔍', n: 'Luna', r: 'Strategist' }, { e: '✍️', n: 'Alex', r: 'Copywriter' }, { e: '🎨', n: 'Zoe', r: 'Designer' }, { e: '🎞️', n: 'Kai', r: 'Video Editor' }, { e: '📅', n: 'Noa', r: 'Social Manager' }, { e: '📣', n: 'Riva', r: 'Ads Manager' }, { e: '💬', n: 'Sam', r: 'Community' }] },
            { dept: 'Sales', color: '#EF4444', agents: [{ e: '🔍', n: 'Rex', r: 'Lead Scout' }, { e: '🎯', n: 'Vera', r: 'ICP Scorer' }, { e: '✍️', n: 'Finn', r: 'Icebreaker' }, { e: '💬', n: 'Quinn', r: 'Qualifier' }, { e: '📄', n: 'Nova', r: 'Proposals' }] },
            { dept: 'Strategy', color: '#6366F1', agents: [{ e: '🔭', n: 'Strategos', r: 'Chief Strategy' }, { e: '🗺️', n: 'Atlas', r: 'Market Analyst' }, { e: '📐', n: 'Blueprint', r: 'Biz Architect' }, { e: '📊', n: 'Kairos', r: 'Performance' }] },
            { dept: 'Innovation', color: '#F97316', agents: [{ e: '📡', n: 'Radar', r: 'Trends' }, { e: '✨', n: 'Spark', r: 'Design Thinking' }, { e: '🔍', n: 'Scout', r: 'Open Innovation' }, { e: '🚀', n: 'Venture', r: 'Innovation PM' }, { e: '🔮', n: 'Oracle', r: 'Foresight' }] },
            { dept: 'Admin', color: '#10B981', agents: [{ e: '💳', n: 'Ledger', r: 'CFO Agent' }, { e: '🤝', n: 'Onboard', r: 'Client Success' }, { e: '💓', n: 'Pulse', r: 'Observability' }, { e: '📰', n: 'Herald', r: 'Daily Briefing' }] },
            { dept: 'Finance', color: '#F59E0B', agents: [{ e: '💎', n: 'Midas', r: 'Wealth Planner' }, { e: '📈', n: 'Quant', r: 'Investments' }, { e: '📋', n: 'Fiscal', r: 'Tax Optimizer' }, { e: '⚓', n: 'Harbor', r: 'FI & FIRE' }] },
          ].map(({ dept, color, agents }) => (
            <div key={dept} style={{ display: 'flex', alignItems: 'flex-start', gap: 20, marginBottom: 20, padding: '24px 28px', borderRadius: 20, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
              {/* Dept label */}
              <div style={{ flexShrink: 0, width: 100, paddingTop: 8 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 8, background: `${color}15`, border: `1px solid ${color}30` }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />
                  <span style={{ fontSize: 10, fontWeight: 700, color, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{dept}</span>
                </div>
              </div>
              {/* Agent chips */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, flex: 1 }}>
                {agents.map(a => (
                  <div key={a.n} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 12, background: `${color}0a`, border: `1px solid ${color}22`, transition: 'all 0.15s' }}>
                    <span style={{ fontSize: 18, lineHeight: 1 }}>{a.e}</span>
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 600, color: '#f4f4f8', lineHeight: 1.2, margin: 0 }}>{a.n}</p>
                      <p style={{ fontSize: 10, color: `${color}99`, margin: 0, lineHeight: 1.3 }}>{a.r}</p>
                    </div>
                  </div>
                ))}
              </div>
              {/* Agent count */}
              <div style={{ flexShrink: 0, paddingTop: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: `${color}70` }}>{agents.length} agents</span>
              </div>
            </div>
          ))}

          {/* Bottom CTA */}
          <div style={{ textAlign: 'center', marginTop: 48 }}>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)', marginBottom: 24 }}>
              All 30 agents included in MIRA Full Stack — yours forever, no monthly fee.
            </p>
            <a href="#pricing" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '14px 36px', borderRadius: 14, background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', color: '#fff', textDecoration: 'none', fontSize: 15, fontWeight: 700, boxShadow: '0 0 36px rgba(124,58,237,0.4)', transition: 'all 0.2s' }}>
              Get the full team — $299 →
            </a>
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" style={{ background: '#0c0c14', padding: '80px 24px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 16 }}>Pricing</p>
            <h2 style={{ fontSize: 'clamp(28px,4vw,48px)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: 12 }}>
              Own your team. Forever.
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 15, maxWidth: 500, margin: '0 auto' }}>
              Your Brand Brain, your agents and your workflows are yours from day one — forever. Engine updates and new agents are optional, $9.99/month if you want them.
            </p>
          </div>

          <div className="resp-grid-pricing" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            {/* MIRA Marketing */}
            <div style={{ padding: '40px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 20 }}>MIRA Marketing</p>
              <div style={{ marginBottom: 6 }}>
                <span style={{ fontSize: 56, fontWeight: 800, letterSpacing: '-0.05em', color: '#f4f4f8' }}>$99</span>
              </div>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', marginBottom: 28 }}>One-time · 8 agents · Marketing team</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 36 }}>
                {['8 specialized marketing agents', 'Brand Brain setup', 'Brief → Content pipeline', 'Approval workflow', 'Performance dashboard', 'Yours forever — no monthly fee', 'Your data and Brand Brain are always yours.'].map(f => (
                  <div key={f} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
                      <circle cx="7" cy="7" r="6" stroke="rgba(255,255,255,0.15)" strokeWidth="1"/>
                      <path d="M4 7l2 2 4-4" stroke="#8B5CF6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>{f}</span>
                  </div>
                ))}
              </div>
              <a href="#cta-form" onClick={(e) => { e.preventDefault(); const s = document.querySelector<HTMLSelectElement>('#cta-form select[name="plan"]'); if (s) s.value = 'MIRA Marketing — $99'; document.getElementById('cta-form')?.scrollIntoView({ behavior: 'smooth' }); }} style={{
                display: 'block', textAlign: 'center', padding: '13px', borderRadius: 12,
                fontWeight: 600, fontSize: 14, textDecoration: 'none', color: '#f4f4f8',
                background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
              }}>Buy MIRA Marketing →</a>
            </div>

            {/* MIRA Full Stack */}
            <div style={{ padding: '40px', borderRadius: 20, border: '1px solid rgba(124,58,237,0.4)', background: 'rgba(124,58,237,0.06)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,transparent,#7c3aed,transparent)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(167,139,250,0.7)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>MIRA Full Stack</p>
                <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 100, background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.35)', color: '#a78bfa', fontWeight: 700 }}>Best value</span>
              </div>
              <div style={{ marginBottom: 6 }}>
                <span style={{ fontSize: 56, fontWeight: 800, letterSpacing: '-0.05em', color: '#f4f4f8' }}>$299</span>
              </div>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginBottom: 28 }}>One-time · 30 agents · All 6 teams</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 36 }}>
                {['All 30 agents · 6 full departments', 'Marketing, Sales, Strategy, Innovation', 'Admin & Finance teams included', 'Priority onboarding in 24–48h', 'First 3 months of updates included', 'Upgrade from Marketing: pay $200 difference', 'Your data and Brand Brain are always yours.'].map(f => (
                  <div key={f} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
                      <circle cx="7" cy="7" r="6" stroke="rgba(124,58,237,0.3)" strokeWidth="1"/>
                      <path d="M4 7l2 2 4-4" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{f}</span>
                  </div>
                ))}
              </div>
              <a href="#cta-form" onClick={(e) => { e.preventDefault(); const s = document.querySelector<HTMLSelectElement>('#cta-form select[name="plan"]'); if (s) s.value = 'MIRA Full Stack — $299'; document.getElementById('cta-form')?.scrollIntoView({ behavior: 'smooth' }); }} style={{
                display: 'block', textAlign: 'center', padding: '13px', borderRadius: 12,
                fontWeight: 700, fontSize: 14, textDecoration: 'none', color: '#fff',
                background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', boxShadow: '0 0 28px rgba(124,58,237,0.4)',
              }}>Buy MIRA Full Stack →</a>
            </div>
          </div>

          {/* Updates add-on */}
          <div style={{ padding: '20px 32px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#f4f4f8' }}>+ Updates & new agents</span>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginLeft: 12 }}>Optional · cancel anytime</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{ fontSize: 24, fontWeight: 800, color: '#f4f4f8', letterSpacing: '-0.03em' }}>$9.99</span>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>/month</span>
            </div>
          </div>

          <p style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.2)', marginTop: 24 }}>No contracts. No SaaS lock-in. Own your AI team.</p>
        </div>
      </section>

      {/* ── SOCIAL PROOF ── */}
      <section style={{ padding: '80px 24px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 48, textAlign: 'center' }}>Early adopters</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 48 }}>
            {[
              {
                quote: "I used to spend every Sunday planning the week. Now MIRA handles marketing, tracks the sales pipeline and sends me a briefing every morning. I finally feel like I have a full team behind me.",
                name: 'Carlos Jacoste', role: 'Founder, Salsa Burgers · Bangkok',
                initials: 'CJ', color: '#EF4444',
                metric: '5× content output', metricLabel: 'with zero extra hires',
              },
              {
                quote: "MIRA built our entire B2B outreach system in 48 hours. Rex found 200 leads, Finn wrote the icebreakers, and Quinn qualified the replies. Our pipeline went from empty to 14 hot leads in week one.",
                name: 'Diego Docavo', role: 'Business Development, Discoolver',
                initials: 'DD', color: '#8B5CF6',
                metric: '14 hot leads', metricLabel: 'in the first week',
              },
            ].map((t, i) => (
              <div key={i} style={{ padding: '32px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.09)', background: 'rgba(255,255,255,0.02)', display: 'flex', flexDirection: 'column', gap: 24 }}>
                <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)', lineHeight: 1.75, fontStyle: 'italic', flex: 1 }}>
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${t.color}20`, border: `1px solid ${t.color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: t.color }}>
                      {t.initials}
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#f4f4f8' }}>{t.name}</p>
                      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{t.role}</p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 18, fontWeight: 800, color: t.color, letterSpacing: '-0.02em', lineHeight: 1 }}>{t.metric}</p>
                    <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 3 }}>{t.metricLabel}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 48, flexWrap: 'wrap', paddingTop: 32, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <img src="/logo-salsa.png" alt="Salsa Burgers" style={{ height: 28, objectFit: 'contain', opacity: 0.35, filter: 'brightness(0) invert(1)' }} />
            <img src="/logo-discoolver.png" alt="Discoolver" style={{ height: 22, objectFit: 'contain', opacity: 0.35, filter: 'brightness(0) invert(1)' }} />
            <img src="/logo-nc.jpg" alt="NC Global Assets" style={{ height: 28, objectFit: 'contain', opacity: 0.3, filter: 'brightness(0) invert(1)' }} />
            <img src="/logo-sf.svg" alt="Startup Factory" style={{ height: 22, objectFit: 'contain', opacity: 0.35, filter: 'brightness(0) invert(1)' }} />
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ background: '#0c0c14', padding: '80px 24px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(24px,3.5vw,40px)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 40, textAlign: 'center' }}>Questions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {FAQS.map((faq, i) => (
              <div key={i} style={{ borderRadius: 14, border: `1px solid ${openFaq === i ? 'rgba(124,58,237,0.25)' : 'rgba(255,255,255,0.07)'}`, overflow: 'hidden', transition: 'border-color 0.2s', background: openFaq === i ? 'rgba(124,58,237,0.04)' : 'transparent' }}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '22px 26px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', gap: 20, fontFamily: 'inherit' }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: openFaq === i ? '#f4f4f8' : 'rgba(255,255,255,0.75)', lineHeight: 1.4 }}>{faq.q}</span>
                  <span style={{ fontSize: 20, color: openFaq === i ? '#a78bfa' : 'rgba(255,255,255,0.2)', flexShrink: 0, transition: 'all 0.2s', transform: openFaq === i ? 'rotate(45deg)' : 'none', fontWeight: 300 }}>+</span>
                </button>
                {openFaq === i && (
                  <div style={{ padding: '0 26px 24px', fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.8 }}>{faq.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER CTA ── */}
      <section style={{ padding: '100px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 50% 70% at 50% 50%, rgba(124,58,237,0.12), transparent)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', maxWidth: 640, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
            <MiraIcon size={60} glow />
          </div>
          <h2 style={{ fontSize: 'clamp(32px,5vw,60px)', fontWeight: 800, letterSpacing: '-0.05em', lineHeight: 1.0, marginBottom: 20 }}>
            Stop operating.<br />Start directing.
          </h2>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.4)', marginBottom: 44, lineHeight: 1.6 }}>
            Marketing, Sales, Strategy, Innovation, Admin and Finance —<br />coordinated, learning your brand, ready in 24 hours.
          </p>
          <form
            action="https://formsubmit.co/ajax/jacostech@gmail.com"
            method="POST"
            id="cta-form"
            onSubmit={async (e) => {
              e.preventDefault()
              const form = e.currentTarget
              const data = new FormData(form)
              try {
                await fetch('https://formsubmit.co/ajax/jacostech@gmail.com', {
                  method: 'POST',
                  headers: { 'Accept': 'application/json' },
                  body: data,
                })
                window.location.href = '/thank-you'
              } catch {
                window.location.href = '/thank-you'
              }
            }}
            style={{ display: 'flex', gap: 8, maxWidth: 420, margin: '0 auto 20px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <input type="hidden" name="_subject" value="New MIRA interest from landing"/>
            <input type="hidden" name="_captcha" value="false"/>
            <input type="hidden" name="_template" value="table"/>
            <select name="plan" required style={{
              flex: '0 0 auto', padding: '13px 16px', borderRadius: 12, fontSize: 14, fontWeight: 500,
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)',
              color: 'rgba(255,255,255,0.7)', fontFamily: 'inherit', cursor: 'pointer', outline: 'none',
            }}>
              <option value="" disabled>Plan</option>
              <option value="MIRA Marketing — $99">Marketing $99</option>
              <option value="MIRA Full Stack — $299">Full Stack $299</option>
            </select>
            <input type="email" name="email" placeholder="your@email.com" required style={{
              flex: 1, minWidth: 200, padding: '13px 18px', borderRadius: 12, fontSize: 14,
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)',
              color: '#f4f4f8', fontFamily: 'inherit', outline: 'none',
            }}/>
            <button type="submit" style={{
              width: '100%', padding: '14px', borderRadius: 12, fontSize: 14, fontWeight: 700,
              background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', color: '#fff', border: 'none',
              cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 0 32px rgba(124,58,237,0.45)',
            }}>Get MIRA →</button>
          </form>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>We&apos;ll reach out within 24 hours to get you started.</p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <MiraIcon size={18} />
            <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '-0.02em', color: '#f4f4f8' }}>MIRA</span>
            <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: 13 }}>·</span>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>© MIRA 2026</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <a href="/terms" style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', textDecoration: 'none' }}>Terms</a>
            <a href="/privacy" style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', textDecoration: 'none' }}>Privacy</a>
            <a href="/cookies" style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', textDecoration: 'none' }}>Cookies</a>
            <a href={PORTAL_URL} style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', textDecoration: 'none' }}>Sign in →</a>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes agentFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes pulse-glow { 0%,100%{opacity:0.6} 50%{opacity:1} }

        @keyframes ripple1 {
          0%   { transform: scale(0.85); opacity: 1; }
          100% { transform: scale(2.2);  opacity: 0; }
        }
        @keyframes coreGlow {
          0%,100% { transform: scale(0.85); opacity: 0.6; }
          50%     { transform: scale(1.15); opacity: 1; }
        }
        @keyframes strokeBrighten {
          0%,100% { stroke-opacity: 0.65; }
          50%     { stroke-opacity: 1; }
        }
        @keyframes pupilGlow {
          0%,100% { r: 2;   fill-opacity: 0.7; }
          50%     { r: 3;   fill-opacity: 1; }
        }

        section div::-webkit-scrollbar { display: none; }

        @media (max-width: 900px) {
          .agent-float { display: none !important; }
        }

        @media (max-width: 640px) {
          .nav-tagline { display: none !important; }

          .hero-content { padding: 40px 20px 56px !important; }
          .hero-h1 { font-size: clamp(32px, 9vw, 64px) !important; }

          .hero-stats {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 0 !important;
            padding-top: 28px !important;
          }
          .hero-stat-item {
            padding: 16px 0 !important;
            border-left: none !important;
            border-top: 1px solid rgba(255,255,255,0.08) !important;
          }
          .hero-stat-item:nth-child(2) { border-left: 1px solid rgba(255,255,255,0.08) !important; }
          .hero-stat-item:nth-child(4) { border-left: 1px solid rgba(255,255,255,0.08) !important; }

          .resp-grid-founders {
            flex-direction: column !important;
            gap: 24px !important;
          }
          .founders-divider { display: none !important; }

          .resp-grid-problem-cards {
            grid-template-columns: 1fr !important;
          }

          .teams-tabs-bar {
            overflow-x: auto !important;
            scrollbar-width: none !important;
            -ms-overflow-style: none !important;
          }
          .teams-tabs-bar::-webkit-scrollbar { display: none !important; }
          .teams-tabs-bar button {
            flex: 0 0 auto !important;
            min-width: 68px !important;
            padding: 10px 8px !important;
          }

          .teams-panel { grid-template-columns: 1fr !important; }
          .teams-panel-left {
            border-right: none !important;
            border-bottom: 1px solid rgba(255,255,255,0.08) !important;
          }

          .resp-grid-brain {
            grid-template-columns: 1fr !important;
            gap: 40px !important;
          }

          .resp-grid-workflow > div { padding: 24px !important; }

          .resp-grid-before-after {
            grid-template-columns: 1fr !important;
          }

          .resp-grid-pricing {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }

          section { padding-top: 52px !important; padding-bottom: 52px !important; }

          .hero-section { min-height: auto !important; padding-top: 80px !important; padding-bottom: 24px !important; }

          .teams-panel-info { padding: 24px !important; }
          .teams-panel-right { padding: 24px !important; }

          .nav-pricing-link { display: none !important; }
          .nav-cta-mobile { display: block !important; }

          .use-cases-hint { display: flex !important; }
        }

        .nav-cta-mobile { display: none; }

        .faq-item:hover { border-color: rgba(255,255,255,0.12) !important; }

        #cta-form input:focus, #cta-form select:focus {
          border-color: rgba(124,58,237,0.5) !important;
          box-shadow: 0 0 0 3px rgba(124,58,237,0.1);
        }
        #cta-form input::placeholder { color: rgba(255,255,255,0.3); }
        #cta-form select option { background: #0a0a0f; color: #f4f4f8; }
      `}</style>
    </main>
  )
}
