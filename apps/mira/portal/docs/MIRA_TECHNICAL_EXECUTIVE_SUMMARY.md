# MIRA — Technical Executive Summary

**For:** Custom GPT Visual Content Generator Team  
**From:** Startup Factory (Carlos)  
**Date:** 2026-07-15  
**Purpose:** Integration context + technical alignment

---

## 1. Who We Are

**Startup Factory** is a venture builder + AI agency (Madrid-based). We design, build, and scale startups. Part of our service: MIRA, an AI Agency SaaS platform we offer to clients.

**MIRA** (our flagship product):
- **Customers:** Brands, SMBs, growth companies (e.g., Salsa Burgers food chain, Discoolver discovery platform, NC Global Assets ecommerce)
- **Core value:** "30 AI agents at your fingertips" — specialized for Sales, Marketing, Strategy, Finance, Innovation, Operations
- **Revenue model:** SaaS subscription (tiered by department access / agent count)
- **Deployment:** Vercel (serverless), multi-tenant (Supabase PostgreSQL with RLS per customer)

---

## 2. What MIRA Does

### **Agents (30 total)**
Specialized AI workers across 6 departments:
- **Sales** (7): Lead discovery, ICP profiling, scoring, proposal generation, icebreaker copy
- **Marketing** (8): Content briefs, copy generation, video scripts, campaign planning, community engagement
- **Strategy** (7): 90-day plans, competitive analysis, business audits, revenue forecasting
- **Finance** (3): Revenue projections, cash flow analysis, cost optimization
- **Innovation** (1): Trend forecasting
- **Admin/Ops** (4): Billing, client onboarding, system monitoring, support ticket response

Each agent has:
- Chat interface (context-aware from client's Brand Brain — uploaded docs, guidelines, past work)
- Real-time knowledge of client's brand, projects, market position
- Integration with external tools (Apollo for leads, Tavily for research, Stripe for billing, Google Drive for storage)

### **Tools (Toolkit, 10 AI-powered generators)**
Each produces a structured report:
1. **SEO Audit** → site analysis + action plan
2. **Marketing Audit** → channel performance + messaging gaps
3. **Action Plan** → 30/60/90-day milestones + KPIs
4. **Competitive Analysis** → market position + SWOT
5. **Investor Deck** → 17-slide presentation for fundraising
6. **Brand Briefing** → positioning + promise + storytelling
7. **Content Pack** → 14+ content pillars + calendar
8. **Brandbook Content System** → visual + content guidelines
9. **Marketing Campaign Generator** → brief + creative assets + timeline
10. **Community Growth Blueprint** → engagement playbook + tactics

### **Quick Actions (16+ one-click generators)**
Distributed across departments:
- **Sales:** Generate campaign brief, ICP profile, proposal, qualify lead response
- **Marketing:** Generate social post, newsletter, video brief, carousel, ads copy
- **Strategy:** Generate report, competitor analysis, brainstorm ideas, revenue projection
- **Finance:** Project revenue, analyze cash flow, optimize costs
- **Innovation:** Detect trends, audit design, create roadmap
- **Admin:** Respond to ticket, create FAQ, create tutorial

---

## 3. Current Gap (Why We Need You)

### **Problem**
Marketing Quick Actions "Social Post" & "Carousel" today:
- ✅ **Generate:** Copy, hashtags, call-to-action
- ❌ **Do NOT generate:** Actual image/video

Output example:
```json
{
  "platform": "instagram",
  "copy": "Introducing [product]...",
  "hashtags": ["#launch", "#newproduct"],
  "call_to_action": "Tap link in bio",
  "media_brief": "Image should show product on white background with vibrant lighting"
  // ^ THIS IS JUST TEXT. No actual image.
}
```

UI claims **"Generate social media post with AI image"** but delivers no image.

### **Solution**
Your GPT fills this gap:
- **Input:** Topic, platform (Instagram/TikTok/Reels), brand tone, optional client brand guidelines
- **Output:** Actual image or video asset (PNG/JPG/MP4) branded for the client + copy/metadata
- **Integration point:** Marketing Quick Action → calls your GPT → returns visual + text → stored in client's project memory

**Impact:** MIRA clients go from "text brief that our designer must execute" → "Finished, publication-ready asset in 30 seconds"

---

## 4. Full Stack (What You'll Integrate With)

### **Frontend**
- **Framework:** Next.js 15 (React 19, edge runtime support)
- **Styling:** Tailwind CSS (dark theme, responsive)
- **State management:** React hooks + context API (no Redux/Redux-like)
- **i18n:** Custom ES/EN toggle (no external lib, 240+ translation keys)
- **Components:** TypeScript, strict mode

### **Backend**
- **API:** Next.js API routes (serverless functions on Vercel)
- **Database:** Supabase PostgreSQL
  - Row-Level Security (RLS) policies per `client_id` → multi-tenant security
  - Tables: `clients`, `mira_projects`, `generation_queue`, `project_memory`, `tool_connections`, `agent_sessions`, etc.
- **Auth:** Supabase Auth (JWT + server-side session via cookies)
- **Storage:** Supabase Storage (PDFs, images, client uploads)

### **AI / Generation**
- **Primary LLM:** Claude Opus (Anthropic API, via `@ai-sdk/anthropic`)
- **OpenAI:** Planned for connectable integrations (clients bring own API key)
- **Async workflows:** n8n webhooks (optional, for long-running tasks)
- **Prompt engineering:** Jinja2-style templates + Brand Brain context injection

### **Deployment**
- **Hosting:** Vercel (serverless, auto-scaling, edge middleware)
- **Monorepo:** Turborepo + pnpm
- **Package sharing:** Workspaces (@sf/auth, @sf/supabase, @sf/ui, @sf/config)
- **Environment:** Node.js 18+, edge runtime compatible

### **External Integrations (Today)**
- **Apollo** → lead data (Sales department)
- **Tavily** → research (Strategy department)
- **Stripe** → billing (Admin)
- **Google Drive** → document storage (all departments)
- **Canva** → design templates (Marketing)
- **Buffer** → social posting (Marketing)
- **LinkedIn Navigator** → prospect research (Sales)
- **Salesforce** → CRM (Sales)

All follow the same pattern: `tool_connections` table (generic auth token + metadata storage).

---

## 5. Integration Architecture (How You'll Fit In)

### **Quick Action Flow (How MIRA Calls External Tools)**

```typescript
// 1. User clicks "Generate Social Post" in Marketing
// Frontend sends:
POST /api/quick-actions
{
  "actionType": "crear_post",              // unique identifier
  "clientId": "client-uuid-123",           // multi-tenancy
  "formData": {
    "topic": "Product launch",
    "platform": "instagram",
    "tone": "professional",
    "brandGuide": {                        // optional, from Brand Brain
      "colors": ["#FF6B35", "#004E89"],
      "logoUrl": "https://...",
      "fontFamily": "Montserrat",
      "voiceTone": "Energetic, inclusive"
    }
  }
}

// 2. Backend routes to your GPT API
const result = await callYourGPT({
  prompt: "Generate Instagram post about...",
  brandGuide: formData.brandGuide,
  aspectRatio: "1:1",  // 1080x1080 for IG feed
  format: "PNG"
});

// 3. Backend returns:
{
  "status": "complete",
  "result": {
    "platform": "instagram",
    "copy": "Introducing...",
    "hashtags": ["#launch", "#newproduct"],
    "call_to_action": "Tap link in bio",
    "imageUrl": "https://cdn.mira/client-123/post-456.png",  // ← FROM YOU
    "mediaSize": "1080x1080",
    "generatedAt": "2026-07-15T10:30:00Z"
  }
}

// 4. Stored in Supabase project_memory for:
//    - Client download/iteration
//    - Future AI refinement ("make it brighter", "add logo")
//    - Usage analytics
```

### **Key Integration Points for Your GPT**

| Point | Requirement | Notes |
|-------|-------------|-------|
| **Invocation** | API endpoint (or schema) | How do we call you? OpenAPI Actions? Assistants API? Direct backend? |
| **Auth** | API key or OAuth | Startup Factory central key, or per-client? |
| **Input format** | JSON prompt + brand metadata | Topic, platform, tone, optional brand guide (colors, logo, fonts, voice) |
| **Output format** | Image/video URL or binary blob | PNG/JPG/MP4, specific aspect ratio (1:1, 4:5, 9:16) |
| **Brand consistency** | Per-client memory or per-call inputs | How do you maintain visual consistency across multiple posts for same brand? |
| **Rate limits** | Concurrent requests, throttling | 5 users generating simultaneously = 5 concurrent calls to your GPT |
| **Iteration** | One-shot or conversation-based | Can users refine ("make it brighter")? If yes, how is state tracked? |
| **Multilingual** | Spanish + English | Can you generate image with Spanish text embedded? |
| **Cost model** | Per-generation billing | Pass-through to OpenAI? Fixed per-MIRA-subscription? |

---

## 6. Integration Timeline & Layers

### **Layer 1: Quick Action Integration (This Sprint, ~1-2 weeks)**
- Wire your GPT into Marketing Quick Actions
- "Social Post" & "Carousel" actions call your API
- Return real images + copy
- Deploy to production
- Gather client feedback

**Deliverable:** Marketing users see actual images, not text briefs.

### **Layer 2: Connectable OpenAI (Next Sprint, ~2-3 weeks)**
- Extend MIRA's `/integrations` UI to support "openai" tool
- Clients can bring their own OpenAI API key or custom GPT
- Same pattern as Apollo/Tavily today
- Use your learnings from Layer 1 to design generically

**Deliverable:** Any MIRA customer can connect their own GPT or OpenAI account. No custom wiring needed.

---

## 7. Technical Questions Already Shared

We've sent you a detailed 14-question doc covering:
1. **Access & invocation method** (blocker question)
2. **Generation engine** (DALL-E 3? External service? Video?)
3. **Input/output spec** (formats, aspect ratios, batch vs single)
4. **Brand consistency** (per-client memory?)
5. **Iteration support** (conversation-based refinement?)
6. **Operational constraints** (cost, rate limits, multilingual)
7. **Authentication** (central key vs per-client?)

Reference: `docs/gpt_visual_content_integration_questions.md`

---

## 8. Tech Contact & Alignment

**Your counterpart:** Carlos (product/engineering lead, Startup Factory)  
**MIRA deployment:** https://mira-portal-nu.vercel.app  
**Repo structure:** `apps/mira/portal/` (inside Turborepo monorepo)  
**Stack repo:** GitHub — `Startup Factory / Claude` (private)

**Expected response time:** Async, iterative (you answer questions → we design → we build → we test → we deploy)

---

## 9. Why This Matters

**For your GPT team:**
- Real production users (5-10 brands initially, scaling to 50+)
- Direct feedback loop (MIRA captures what clients do with generated images)
- Opportunity to optimize prompts based on real engagement metrics
- Potential to become the "visual content standard" for AI-powered marketing platforms

**For MIRA:**
- Closes the final gap: agents generate strategy, copy, media briefs → your GPT generates actual assets
- Competitive differentiation: "From plan to published asset in 30 seconds"
- Client satisfaction: professional-grade visuals, not placeholder text

**For Startup Factory:**
- Upsell: "Premium visual generation" tier (your processing costs + margin)
- Cross-sell: eventually bring your GPT to other clients (Salsa Burgers, Discoolver, etc.)

---

## 10. Next Steps

1. **Review this doc** + the 14-question doc we shared
2. **Answer the questions** (focus on #1: how do we invoke you?)
3. **We design** integration API + contract
4. **You provide** endpoint/schema or Assistants API config
5. **We integrate** (1-2 days of development)
6. **We test** together in staging
7. **We deploy** to production

**Timeline:** 1 week from answers → production live

---

**Questions?** Reach out to Carlos. Looking forward to building this with you.

---

## Appendix: MIRA at a Glance

| Aspect | Detail |
|--------|--------|
| **Product** | AI Agency SaaS for clients |
| **Customers** | Brands, SMBs, growth companies |
| **Core:** 30 agents + 10 tools + 16+ quick actions |
| **Tech stack** | Next.js 15 + Supabase + Vercel + Claude Opus |
| **Multi-tenancy** | RLS per client_id (PostgreSQL) |
| **Integration pattern** | REST API + JWT auth + tool_connections table |
| **Your role** | Visual content generator (Instagram/TikTok/Reels) |
| **Success metric** | "Clients generate publication-ready assets in <1 minute" |

---

**Document generated:** 2026-07-15  
**For:** GPT Visual Content Integration  
**Status:** Ready to share
