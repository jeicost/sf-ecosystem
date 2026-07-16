# Memory Template — Client Brand Brain Profile

**Purpose:** Standardized structure for storing and updating client Brand Brain data across MIRA agents. This template is populated via the Brand Brain Chatbot and updated as client context evolves.

**Where it lives:** Supabase tables (`brand_profiles`, `content_pillars`, `agent_documents`, `project_memory`), accessible to all agents via `lib/brand-brain.ts` and `lib/client-memory.ts`.

---

## 1. Brand Identity & Positioning

**Table:** `brand_profiles`

### Core Positioning
- **Unique Value Proposition** — What makes this client fundamentally different from competitors? (Not a feature list, but a positioning statement: "We are the only [category] that [core difference]")
  - *Example: "We are the only meal-delivery service that sources 100% from local restaurants within 5 miles."*
  
- **Target Customer Profile** — Who is the ideal customer? (Role, company size, pain points, buying criteria)
  - *Example: "Busy professionals, 25-45, in urban areas, earning $80k+, who value convenience and local quality over cost."*

- **Key Differentiators** — 3-5 specific ways the client wins (not generic, specific to this brand)
  - *Example: "Local sourcing, 2-hour guarantee, AI personalization, carbon-neutral delivery, local chef partnerships"*

- **Primary Business Model** — How do they make money? (SaaS, subscription, per-transaction, etc.)
  - *Example: "Subscription (monthly + delivery fees) + premium restaurant partnerships + advertising"*

- **Stage & Ambition** — Current stage (MVP, growth, scale) and 12-month goal
  - *Example: "Series A, growing from 2 cities to 8 cities in 12 months"*

### Market Context
- **Competitive Landscape** — 3-5 main competitors and why the client beats them
  - *Example: "vs. DoorDash (scale but no local focus), vs. Uber Eats (corporate chain bias), vs. local options (no tech)"*

- **Market Size & Opportunity** — TAM/SAM, growth rate, timing
  - *Example: "US meal delivery $30B market, growing 15% YoY; local delivery segment (our focus) growing 35% YoY"*

### Brand Voice
- **Tone** — How should the brand speak? (Professional / casual / funny / authoritative, etc.)
  - *Example: "Casual, friendly, confident. We're the friendly local expert, not a corporate chain."*

- **Key Message Pillars** — 3-4 core themes (separate from content pillars; these are for brand voice, not content)
  - *Example: "Support local businesses, instant access, sustainability, community"*

- **Personality Traits** — 3-5 words describing the brand
  - *Example: "Approachable, innovative, community-focused, reliable, local-first"*

---

## 2. Content Strategy & Pillars

**Table:** `content_pillars`

Three to five major themes the client consistently creates content around. Each pillar should:
- Be specific to the client's positioning (not generic)
- Have a 6-month content roadmap
- Map to customer journey (awareness / consideration / decision)

### Content Pillar #1: [Pillar Name]
- **Purpose** — Why does the client create content in this pillar? (What customer problem does it solve?)
- **Topics & Formats** — 5-10 specific topics + preferred formats (blog / video / email / carousel, etc.)
- **Frequency** — How often? (2x/week, 1x/week, bi-weekly, etc.)
- **Examples** — 2-3 specific content pieces already created or planned

*Example Pillar: "Supporting Local Restaurants"*
- *Purpose: Show how we help small restaurants compete with chains*
- *Topics: Restaurant stories, small business tips, local sourcing challenges, partnership success*
- *Formats: Blog + Instagram carousel + weekly email interview*
- *Frequency: 1 blog + 2 carousels + 1 email per week*
- *Examples: "How Pasta King grew from 1 to 3 locations" (blog), "5 ways local restaurants save costs" (carousel)*

### Content Pillar #2: [Pillar Name]
[Same structure]

### Content Pillar #3: [Pillar Name]
[Same structure]

---

## 3. Sales & Customer Context

**Table:** `agent_documents` (type: sales_context)

### ICP (Ideal Customer Profile)
- **Role** — Who in the organization makes the buying decision? (Title, seniority)
- **Buying Committee** — Who else influences? (Finance, ops, end-user, etc.)
- **Typical Deal Cycle** — How long from first touch to close? (Discovery → proposal → negotiation → close)
- **Deal Size & Frequency** — Average contract value? Annual vs. multi-year?

### Sales Process
- **Discovery Question** — What one question unlocks everything in discovery calls?
- **Common Objections** — Top 3 concerns prospects raise + how the client overcomes them
- **Proof Points** — What does the client use to build trust? (Testimonials, case studies, ROI calculator, trial)
- **Sales Collateral** — What materials does the sales team use? (One-pager, pitch deck, ROI model, etc.)

### Customer Success Context
- **Onboarding Timeline** — How long until first value?
- **Typical Success Metrics** — How do customers measure success? (Revenue, efficiency, speed, satisfaction, etc.)
- **Common Churn Reasons** — Why do customers leave?
- **Expansion Opportunities** — How do customers typically grow their usage or spend?

---

## 4. Agent-Specific Context

**Table:** `agent_documents` (type: agent_context)

Per agent type, what do they need to know? Stored as separate documents, one per agent or per agent family.

### Commercial Agents (Sales, Partnerships, Revenue)
- **Key Metrics** — Revenue, MRR, customer acquisition cost, LTV, churn rate (share numbers if possible)
- **Sales Playbook** — Specific steps, talk tracks, objection handlers the sales team uses
- **Partner Landscape** — Who are key partners? How do partnerships work?
- **Pricing Model** — Price points, packaging, discounts policy

### Marketing Agents (Demand Gen, Social, SEO)
- **Brand Assets** — Logo usage, color palette hex codes, font stack, approved imagery style
- **Competitor Monitoring** — Specific competitors to track, their messaging, positioning
- **Marketing Metrics** — CAC, CPL, LTV:CAC ratio, brand awareness %, website traffic patterns
- **Campaign Playbook** — Proven campaign types, channels, creatives, messaging angles

### Strategy Agents (GTM, Planning, Analytics)
- **Annual OKRs** — What are the top 3-5 goals for the year?
- **Customer Insights** — Biggest unsolved problems customers mention; feature requests; emerging trends in the customer base
- **Product Roadmap** — Q1/Q2/Q3 priorities (if planning content around them)
- **Market Dynamics** — Seasonality, regulatory changes, competitive threats on the horizon

### Operational Agents (System Health, Efficiency)
- **Key Operations** — What are the critical processes? (Customer support, delivery, fulfillment, etc.)
- **Metrics Dashboard** — SLAs, uptime targets, key operational metrics to track
- **Common Incidents** — What breaks most often? How is it handled?
- **Team Structure** — Who owns what? Key contacts for each function

### Innovation Agents (Experiments, New Ideas)
- **Innovation Framework** — How does the client evaluate new ideas? (Lean canvas, scoring matrix, voting, etc.)
- **Past Experiments** — 3-5 previous experiments: hypothesis, result, learnings
- **Resources Available** — R&D budget? Time allocation? What can be tested vs. what's blocked?

---

## 5. Project Memory & Quick Wins

**Table:** `project_memory`

Non-structural data: decisions made, quick wins to replicate, known pitfalls to avoid.

### Recent Decisions
- **Decision** + **Why** + **Owner** + **Date**
  - *Example: "Removed subscription tier; moved to pay-per-order. Reason: 70% of customers were single-use. Owner: CEO. Date: July 2026"*

### Quick Wins to Replicate
- **What Worked** — Specific tactic or campaign that outperformed
- **Metrics** — The numbers (CTR, engagement, leads, revenue, etc.)
- **Recipe** — Exact steps to repeat it
  - *Example: "Local restaurant takeover posts. Metrics: 3x engagement vs. generic posts. Recipe: Partner with restaurant, shoot behind-the-scenes, tag restaurant + followers in caption, post Friday 5pm"*

### Known Pitfalls
- **What Failed** — Tactic or campaign that didn't work
- **Why** — Root cause
- **What to Do Instead** — What worked better
  - *Example: "Generic product benefits copy. Why: Customers care about local support, not product specs. Instead: Story-driven content about real restaurants + real impact"*

### Client Preferences & Quirks
- **Approval Process** — Who reviews content before publish? How long does it take?
- **Style Preferences** — Any specific styles to avoid or prefer? (Fonts, colors, length, format)
- **Communication Style** — How should you interact with them? (Formal, casual, via email, Slack, calls)
- **Timezone & Availability** — When are they typically available?

---

## 6. Asset & Document Registry

**Table:** `project_memory` (type: asset_registry)

Pointers to key external resources agents should reference.

- **Brand Guidelines** — Link to brand book, style guide, asset library
- **Content Calendar** — Link to shared calendar or doc with planned content
- **Sales Playbook** — Link to sales deck, talk tracks, case study library
- **Product Docs** — Link to feature list, API docs, knowledge base
- **Customer Data** — Link to CRM, customer success platform, analytics dashboard (if agents can access)

---

## 7. Versioning & Updates

**Auto-tracked in Supabase:**
- `created_at` — When this profile was first created
- `updated_at` — Last modification
- `updated_by` — Which agent or user made the change
- `version` — Incremental version number

**Manual notes** (in `project_memory`):
- When significant strategic shifts happen (positioning change, new market, new product), add a dated entry explaining the shift and any implications for agent behavior.

---

## How to Use This Template

1. **Initial Population** — Brand Brain Chatbot walks client through sections 1-3 in a conversational way. The client answers 15-20 questions; structured data is extracted and saved.

2. **Agent Access** — When an agent initializes, it calls `fetchBrandBrain(clientId)` which pulls all tables and formats them into the agent's system prompt. The agent always has the latest version.

3. **Ongoing Updates** — As the client's business evolves:
   - Marketing agent notices new competitor: updates section 2.1 (Competitive Landscape)
   - Sales team closes a new customer segment: updates section 3.1 (ICP) with new buying committee insight
   - Client launches a new product: updates section 1.2 (Positioning) and section 4 (Agent Context)
   - Each update automatically increments the version and timestamps

4. **Chatbot Re-engagement** — Periodically (monthly or quarterly), the Brand Brain Chatbot can re-run the questionnaire on specific sections to refresh and deepen the profile.

---

## Template Usage Example

**For Salsa Burgers (example client):**

### 1. Brand Identity
- **UVP:** "The only meal delivery service that guarantees local restaurant freshness in 2 hours, not chains, not CPG"
- **Target:** Busy professionals, 25-45, in urban areas, earning $80k+, sustainability-conscious
- **Differentiators:** Local-only sourcing, 2-hour guarantee, AI personalization, carbon-neutral delivery, restaurant partnership
- **Model:** Subscription (free tier + $9.99/month) + per-order delivery fee ($2-5) + restaurant affiliate commission (8%)
- **Stage:** Series A, growing from 2 cities (SF, LA) to 8 cities in 12 months

### 2. Content Strategy
- **Pillar 1: Supporting Local Restaurants** — Blog, carousel, email. 1 blog + 2 carousels + 1 email/week
- **Pillar 2: Sustainability & Community** — Video, blog, social. 2 videos + 1 blog/month + 4 posts/week
- **Pillar 3: Convenience Hacks for Busy Professionals** — Carousel, email. 3 carousels + 2 emails/week

### 3. Sales Context
- **ICP:** Marketing/Ops managers at restaurants, 1-3 locations, considering delivery tech
- **Objection #1:** "We're already on DoorDash." Answer: "You lose 30% margin + customer data. We're 8% commission + you own the relationship."
- **Proof:** Case study: "Pasta King grew from 1 to 3 locations after joining Salsa" (revenue, customer growth metrics)

### 4. Agent Context (Commercial)
- **Key Metrics:** $50k MRR (target $200k by EOY), $45 CAC, $900 LTV, 92% retention
- **Sales Playbook:** Discovery (pain points) → Demo (margin impact + customer data) → Trial (2 weeks free) → Close

### 5. Project Memory
- **Quick Win:** Local restaurant takeover posts get 3x engagement. Recipe: Partner with restaurant, shoot behind-the-scenes, tag in caption, post Friday 5pm.
- **Pitfall:** Generic "order food fast" messaging doesn't resonate. Customers care about local support + sustainability.
- **Approval:** CEO reviews all major messaging (2-4 hours turnaround). Marketing manager can approve day-to-day social posts.

---

## Maintenance Checklist

- [ ] Brand Identity (section 1) reviewed quarterly
- [ ] Content Pillars (section 2) reviewed bi-weekly (teams adjust strategy)
- [ ] Sales Context (section 3) reviewed whenever sales cycle changes (new segment, pricing change)
- [ ] Agent Context (section 4) updated whenever a new feature ships or strategy pivots
- [ ] Quick Wins (section 5.1) updated after each successful campaign
- [ ] Pitfalls (section 5.2) updated after failures (learning mode)
- [ ] Asset Registry (section 6) kept up-to-date as docs move or new tools adopted
