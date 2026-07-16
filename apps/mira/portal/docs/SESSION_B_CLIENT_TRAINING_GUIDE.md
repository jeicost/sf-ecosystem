# SESSION B — Client Brand Brain Training Guide

**Objective:** Train 4 active clients (Salsa Burgers, Startup Factory, Dadybox, Discoolver) to 100% Brand Brain completeness via API.

**Duration:** ~2 hours (30 min per client)  
**Date:** 2026-07-16 (continuation from Session A)

---

## Pre-Training Checklist

- ✅ Session A complete: Admin Panel v2 deployed
- ✅ Brand Brain Chatbot API routes deployed to Vercel (mira-portal-nu.vercel.app)
- ✅ Supabase tables created: brand_profiles, content_pillars, agent_documents, project_memory
- ✅ RLS policies active (each user can only modify their own client data)

---

## Step 1: Get Client IDs

Query Supabase to get the 4 client IDs:

```sql
SELECT id, name, slug 
FROM clients 
WHERE slug IN ('salsa-burgers', 'startup-factory', 'dadybox', 'discoolver')
ORDER BY name;
```

Expected output:
```
id                                   | name            | slug
-------------------------------------|-----------------|---------------------
[uuid-1]                             | Salsa Burgers   | salsa-burgers
[uuid-2]                             | Startup Factory | startup-factory
[uuid-3]                             | Dadybox         | dadybox
[uuid-4]                             | Discoolver      | discoolver
```

Save these IDs for use below.

---

## Step 2: Training Responses Per Client

Each client will go through 4-5 conversation turns. The chatbot asks questions; we provide realistic answers.

### Client 1: Salsa Burgers

**Turn 1** (Brand Identity)
```
Q: "What's your biggest differentiator — what makes you unique compared to competitors?"
A: "We are the only meal-delivery service that guarantees local restaurant freshness in 2 hours, not chains, not CPG. Our key differentiators: local-only sourcing (within 5 miles), 2-hour delivery guarantee, AI personalization, carbon-neutral delivery, and direct restaurant partnerships that give us margin advantages."
```

**Turn 2** (Content Pillars)
```
Q: "What are your 3-5 main content themes?"
A: "Our three core content pillars: 1) Supporting Local Restaurants - how we help small restaurants compete with chains, 2) Sustainability & Community - our environmental impact and local community partnerships, 3) Convenience Hacks for Busy Professionals - saving time for urban professionals."
```

**Turn 3** (Sales Context)
```
Q: "Tell me about your ideal customer and how you sell to them."
A: "Our ICP: busy professionals aged 25-45 in urban areas (SF, LA), earning $80k+, who value convenience and local quality over cost. We sell through the app with freemium model ($0 tier + $9.99/month premium). Customer acquisition via social proof and restaurant partnerships. Average user spends $200/month."
```

**Turn 4** (Agent Context)
```
Q: "What key documents or resources should AI agents know about?"
A: "Critical docs: restaurant partnership agreements (margins, exclusivity), sustainability certifications (carbon-neutral claim validation), customer testimonials and NPS scores (92), pricing model and financial projections, competitive analysis vs DoorDash/Uber Eats."
```

### Client 2: Startup Factory

**Turn 1** (Brand Identity)
```
Q: "What's your biggest differentiator?"
A: "We are a climate tech venture builder for early-stage startups. Our unique value: we provide $500k-$2M seed funding, executive mentorship from climate leaders, go-to-market strategy for climate solutions, and access to our network of sustainability officers at Fortune 500 companies. We focus on founders solving real climate problems, not greenwashing."
```

**Turn 2** (Content Pillars)
```
Q: "What are your 3-5 main content themes?"
A: "Our content strategy: 1) Climate Tech Market Insights - trends, investment patterns, emerging tech, 2) Founder Stories - deep dives with our portfolio companies, 3) Fundraising Guide - cap tables, valuation methods, pitch deck templates, 4) Policy & Regulation - climate regulations affecting startups."
```

**Turn 3** (Sales Context)
```
Q: "Tell me about your ideal customer."
A: "Our ICP: climate tech founders pre-seed to Series A with $50k-$500k raised. They have strong technical teams but lack go-to-market expertise. Sales cycle: 4-6 weeks from first call to term sheet. Key decision makers: founder + lead VC. We close ~15% of inbounds."
```

**Turn 4** (Agent Context)
```
Q: "What key documents should agents know?"
A: "Essential docs: investment thesis (sustainability + impact focus), portfolio company list with metrics (funding, revenue, headcount), fundraising playbook template, climate market TAM research, policy brief library (EU taxonomy, carbon credits market), successful pitch examples from our companies."
```

### Client 3: Dadybox

**Turn 1** (Brand Identity)
```
Q: "What's your biggest differentiator?"
A: "Dadybox is a 3PL fulfillment service specialized in sustainable e-commerce. Our differentiator: we combine fulfillment efficiency with sustainability compliance. We offer carbon-neutral delivery, recyclable packaging, supply chain transparency, and help DTC brands meet ESG reporting requirements. We're not just logistics — we're sustainability infrastructure."
```

**Turn 2** (Content Pillars)
```
Q: "What are your 3-5 main content themes?"
A: "Content pillars: 1) Logistics Automation - how to scale without hiring, warehouse best practices, 2) Sustainability Compliance - regulations (EU, California), certifications, carbon accounting, 3) E-commerce Growth - DTC strategies, conversion optimization, 4) Supply Chain Visibility - real-time tracking, customer transparency tools."
```

**Turn 3** (Sales Context)
```
Q: "Tell me about your ideal customer."
A: "Our ICP: DTC brands with $1M-$50M revenue. They need fulfillment + sustainability credentials (investors/consumers want ESG). Average deal: $5k/month, 2-3 year contracts. Sales cycle: 6-8 weeks. Decision makers: ops + sustainability/ESG lead. We convert 25% of qualified leads."
```

**Turn 4** (Agent Context)
```
Q: "What key documents?"
A: "Critical docs: sustainability certifications (B Corp, ISO 14001), fulfillment SLAs (98% on-time accuracy, <24h processing), carbon offset program details, integration guides (Shopify, WooCommerce), customer success playbooks, competitive positioning vs 3PLs/Shopify Fulfillment."
```

### Client 4: Discoolver

**Turn 1** (Brand Identity)
```
Q: "What's your biggest differentiator?"
A: "Discoolver is a music discovery platform for independent artists and music fans. Our differentiator: our AI algorithm surfaces emerging talent across all genres with 95% accuracy (better than Spotify's algo for indie music). We operate on 'fans power discovery' model where the community votes on ranking, creating a meritocratic alternative to playlist gatekeeping."
```

**Turn 2** (Content Pillars)
```
Q: "What are your 3-5 main content themes?"
A: "Content strategy: 1) Artist Spotlights - interviews with emerging musicians, 2) Music Trends - genre deep-dives, listening pattern analysis, 3) Playlist Curation - algorithmic recommendations, mood-based collections, 4) Artist Tools - promotion strategies, analytics for DIY musicians, distribution guidance."
```

**Turn 3** (Sales Context)
```
Q: "Tell me about your ideal customer."
A: "ICP: music enthusiasts 18-40 (Gen Z + younger millennials) + independent musicians (DIY artists). B2C: freemium model (free tier = limited skips, $4.99/mo ad-free). B2B: independent labels partner for promotional playlists. Target: 100k MAU by EOY, 50% engagement rate, 2M songs in catalog."
```

**Turn 4** (Agent Context)
```
Q: "What key documents?"
A: "Essential docs: music genre taxonomy (500+ subcategories), recommendation algorithm white paper, artist onboarding flow + retention metrics, competitive analysis (Spotify vs YouTube Music vs Bandcamp), music licensing agreements, brand guidelines (visual identity for artist partnerships)."
```

---

## Step 3: Execute Training API Calls

### Template for Each Turn

```bash
# Initialize chatbot
curl -X POST https://mira-portal-nu.vercel.app/api/brand-brain/chatbot/init \
  -H "Content-Type: application/json" \
  -d '{"clientId": "[CLIENT_ID]"}'

# Send training response (turn 1, 2, 3, 4)
curl -X POST https://mira-portal-nu.vercel.app/api/brand-brain/chatbot \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "[CLIENT_ID]",
    "message": "[TRAINING_RESPONSE]",
    "conversationHistory": [
      {"role": "bot", "content": "[INITIAL_GREETING]"},
      ... (prior turns)
    ]
  }'
```

### Expected Response Format

```json
{
  "botMessage": "Wow! Got your positioning. Now tell me about...",
  "structuredData": {
    "section": "brand_profiles",
    "updates": {
      "value_prop": "We are the only...",
      "target_customer": "Busy professionals 25-45...",
      "differentiators": ["Local sourcing", "2-hour guarantee", ...]
    },
    "completeness_percent": 50
  },
  "conversationComplete": false
}
```

On the final turn:
```json
{
  "conversationComplete": true,
  "botMessage": "✓ Brand Brain updated successfully!"
}
```

---

## Step 4: Validation — Check 100% Completeness

After training each client, run these queries to verify:

```sql
-- Brand Profile (should have 1 row)
SELECT COUNT(*) FROM brand_profiles WHERE client_id = '[CLIENT_ID]';
-- Expected: 1

-- Content Pillars (should have 3+ rows)
SELECT COUNT(*) FROM content_pillars WHERE client_id = '[CLIENT_ID]';
-- Expected: >= 3

-- Agent Documents (should have 2+ rows)
SELECT COUNT(*) FROM agent_documents WHERE client_id = '[CLIENT_ID]';
-- Expected: >= 2

-- Project Memory (should have 5+ rows for quick wins, pitfalls, decisions)
SELECT COUNT(*) FROM project_memory WHERE client_id = '[CLIENT_ID]';
-- Expected: >= 5
```

**Completion Status:**
- ✅ 100% Complete: All 4 tables have data for the client
- 🟡 75% Complete: 3 tables have data
- 🟠 50% Complete: 2 tables have data
- 🔴 Incomplete: 1 or 0 tables have data

---

## Step 5: Final Validation Query

Run this to see completion across all 4 clients:

```sql
SELECT 
  c.name,
  CASE WHEN bp.id IS NOT NULL THEN 1 ELSE 0 END as has_brand,
  COUNT(DISTINCT cp.id) as pillar_count,
  COUNT(DISTINCT ad.id) as agent_doc_count,
  COUNT(DISTINCT pm.id) as memory_count,
  (
    (CASE WHEN bp.id IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN COUNT(DISTINCT cp.id) > 0 THEN 1 ELSE 0 END) +
    (CASE WHEN COUNT(DISTINCT ad.id) > 0 THEN 1 ELSE 0 END) +
    (CASE WHEN COUNT(DISTINCT pm.id) > 0 THEN 1 ELSE 0 END)
  ) * 25 as completion_percent
FROM clients c
LEFT JOIN brand_profiles bp ON bp.client_id = c.id
LEFT JOIN content_pillars cp ON cp.client_id = c.id
LEFT JOIN agent_documents ad ON ad.client_id = c.id
LEFT JOIN project_memory pm ON pm.client_id = c.id
WHERE c.slug IN ('salsa-burgers', 'startup-factory', 'dadybox', 'discoolver')
GROUP BY c.id, c.name, bp.id
ORDER BY c.name;
```

Expected output:
```
name            | has_brand | pillar_count | agent_doc_count | memory_count | completion_percent
----------------|-----------|--------------|-----------------|--------------|-------------------
Dadybox         | 1         | 4            | 2               | 5            | 100
Discoolver      | 1         | 4            | 2               | 5            | 100
Salsa Burgers   | 1         | 3            | 2               | 5            | 100
Startup Factory | 1         | 4            | 2               | 6            | 100
```

---

## Step 6: Agent Test — Verify Brand Brain is Used

Pick one client and one agent to verify the Brand Brain context is actually being used:

1. Go to `/agent/comercial-lead-gen` (Commercial agent)
2. Ask: "What's our ideal customer profile and how should we target them?"
3. **Expected:** Response should mention specifics from that client's Brand Brain (ICP, differentiation, pricing model, etc.)
4. **NOT expected:** Generic response about lead generation without client context

If successful, the agent is reading Brand Brain data correctly.

---

## Step 7: Deploy + Monitoring

Once all 4 clients are trained:

1. **Smoke test on Vercel:**
   - Navigate to `mira-portal-nu.vercel.app/admin/clients`
   - Verify all 4 clients appear
   - Click "Brand Brain" on one client → modal shows "Brand Brain updated successfully!"

2. **Monitor for errors:**
   - Check Vercel Function logs for any 500 errors in `/api/brand-brain/chatbot`
   - Check Supabase query performance (no timeout errors)

3. **Readiness for production:**
   - All 4 clients at 100% completion ✅
   - Agents using Brand Brain data ✅
   - No deployment errors ✅
   - → **Ready to announce to clients**

---

## Session B Completion Checklist

- [ ] All 4 clients trained (4/4 conversation flows completed)
- [ ] Validation query shows 100% completion for all 4 clients
- [ ] Agent test successful (one agent uses Brand Brain data)
- [ ] Vercel deployment verified and stable
- [ ] Documentation generated (this guide)
- [ ] Team handoff completed

---

## Troubleshooting

### API Returns 400: "clientId is required"
- Verify the clientId is being passed in the request body
- Check that the client ID format is a valid UUID

### API Returns 500: "Failed to process message"
- Check ANTHROPIC_API_KEY env var is set in Vercel
- Check Supabase connection (network issues)
- Review function logs in Vercel dashboard

### Chatbot extraction fails (structuredData is null)
- Claude may have failed to extract structured format
- The bot message will still be returned; move to next turn
- If persists: check that system prompt formatting is correct

### Supabase validation shows 0 rows
- Verify RLS policies are active (shouldn't block inserts from API)
- Check that Supabase migrations have been applied
- Verify `client_id` column exists in all 4 tables

---

## Next Steps After Session B

Once all clients are trained:

1. **Announce to clients:** "Your Brand Brain is now complete! Your AI agents have full context about your brand."
2. **Monitor agent quality:** Track if client satisfaction improves with agents using Brand Brain
3. **Iterate:** Update Brand Brain quarterly as clients evolve strategy
4. **Scale:** Once process is proven with these 4, onboard new clients via same chatbot flow
