# MIRA — GPT Visual Content Generator Integration

**For:** Custom GPT that generates images/video for Instagram posts, Reels, TikTok  
**Date:** 2026-07-15  
**Status:** Pre-integration discovery phase  
**Urgency:** High (blocks Marketing toolkit enhancement)

---

## 1. MIRA Product Context (30-second read)

**MIRA** is an AI Agency SaaS platform for clients (brands, SMBs) to access 30 specialized AI agents across 6 departments:
- **Sales** (7 agents): Lead discovery, scoring, proposal generation, icebreakers
- **Marketing** (8 agents): Content briefs, copy, visual strategy, campaigns, community
- **Strategy** (7 agents): 90-day plans, competitive analysis, audits
- **Finance** (3 agents): Revenue projections, analytics, cost optimization
- **Innovation** (1 agent): Trend forecasting
- **Admin/Operations** (4 agents): Billing, onboarding, observability

Each client has:
- **Toolkit** (10 tools): Generate reports (SEO Audit, Marketing Audit, Investor Deck, etc.)
- **Quick Actions** (16+): One-click generators (16 across 6 departments, e.g., "Generate social post," "Analyze competitor")
- **Agent workspace**: Chat with any of 30 agents, context-aware from client's brand/docs
- **Integrations**: Connect external tools (Apollo, Tavily, Stripe, Google Drive, Canva, Buffer, etc.)

**Tech Stack:**
- **Frontend:** Next.js 15 (React 19), TypeScript, Tailwind CSS
- **Backend:** Next.js API routes + PostgreSQL via Supabase (RLS policies per client)
- **Gen AI:** Claude Opus via Anthropic API (for most agents), OpenAI APIs planned for connectable integrations
- **Deployment:** Vercel (serverless)
- **Database:** Supabase PostgreSQL (with Row-Level Security per client)
- **State:** Server-side session via Supabase Auth (JWT + serverless storage), i18n (ES/EN)
- **Monorepo:** Turborepo + pnpm (shared packages: @sf/auth, @sf/supabase, @sf/ui, @sf/config)

**Current Architecture:**
- All AI generation flows through Claude Opus (via `app/api/quick-actions/route.ts`, `app/api/toolkit/*` routes)
- Integrations registered in database table `tool_connections(client_id, tool_id, status, auth_token, metadata)`
- Quick Actions trigger n8n webhooks (async generators) or direct Claude calls (sync)
- Results stored in `project_memory` JSON blobs (Supabase) for retrieval/iteration

---

## 2. Current Gap (Why We Need This GPT)

**Marketing Quick Action "Social Post" & "Carousel"** today generate **text-only output**:
- Input: topic, platform, tone
- Output: `{platform, copy, hashtags, call_to_action, media_brief}` — where `media_brief` is just a text description ("post should show product on white background with...")
- **No actual image/video** is generated

UI falsely claims "Generate social media post **with AI image**" but delivers only text.

**This GPT solves it:** Generate actual images (Instagram feed, Reels cover, TikTok thumb) branded for the client, directly from Marketing Quick Actions.

---

## 3. Integration Strategy — Two Layers

### **Layer 1: Quick Action Integration (Immediate, This Sprint)**
Replace/enhance Marketing's "Social Post" + "Carousel" quick actions with:
1. Client inputs: Platform (Instagram/TikTok), brief, brand tone
2. Call the GPT to generate image/video
3. Return visual asset + copy to the user
4. Store result in `project_memory` for iteration/download

**Requirement:** Understand how to call the GPT (API vs. manual vs. Assistants API).

### **Layer 2: Connectable OpenAI (Medium-term, Later Sprint)**
Extend MIRA's `/integrations` page so clients can:
- Bring their own OpenAI API key or custom GPT
- Register "openai" or "openai-gpt" as a new `tool_id` in `tool_connections` table
- Use the Integrations UI (already exists) to authenticate
- Reference it in Quick Actions / Toolkit tools

This follows the exact pattern for Apollo, Tavily, Stripe (which clients can connect). Requires generic OpenAI tooling (model list API, GPT selector, auth flow).

**Status:** Blocked until we understand Layer 1.

---

## 4. Critical Technical Questions for the GPT

### **A. Access & Invocation Method** (Blocker)

1. **Is the GPT exposed via API or only via ChatGPT UI?**
   - Option A: Custom GPT with OpenAPI Actions configured (has a schema, can be called from backend)
   - Option B: Custom GPT without Actions (lives in ChatGPT only, no direct API)
   - Option C: OpenAI Assistant with the same logic (replicable via Assistants API)
   - Option D: Standalone backend service with its own API

   **What we need:** If A or C, share the schema/endpoint + auth. If B or D, suggest alternative.

2. **If API exists (A or C):**
   - Endpoint base URL?
   - Authentication method (API key, OAuth, Bearer token)?
   - Is there an `openapi.json` or schema doc we can see?
   - Response format (JSON, binary image data, URL to asset)?

3. **If no API (B or D):**
   - Can we replicate it via OpenAI Assistants API + system prompt?
   - Or is the only path user → ChatGPT → download → upload to MIRA?

---

### **B. Generation Engine** (Requirements)

4. **Image generation:**
   - Uses DALL-E 3 natively from OpenAI, or external service (Midjourney, Ideogram, Stable Diffusion)?
   - If external, does it require separate auth/API keys?

5. **Video generation:**
   - Generates video (MP4, MOV) or only static images?
   - If video, what resolution/aspect ratio? FPS? Max duration?
   - If external, what tool (Runway, Descript, custom)?

---

### **C. Input/Output Spec** (Integration Design)

6. **Minimum inputs required:**
   - Text brief/prompt only, or also visual refs (brand logo, previous post examples)?
   - How is brand consistency maintained (colors, fonts, logo placement)? Passed per-call or stored in GPT config?
   - Does it accept brand guidelines as JSONB (colors hex, logo URL, font names)?

7. **Exact output format:**
   - PNG/JPG/MP4/MOV? Multiple formats?
   - Fixed aspect ratios (1:1 for feed, 4:5 for post, 9:16 for story/reel/TikTok), or flexible?
   - Resolution (e.g., 1080×1080 for IG feed, 1920×1080 for TikTok)?
   - Is output a direct binary blob, or a signed URL to CDN storage?

8. **Batch output:**
   - One image per call, or can it generate a full carousel (5 coordinated slides) in one invocation?
   - If carousel, are slides visually coherent (same brand, style, layout)?

9. **Metadata return:**
   - Returns JSON metadata (prompt used, model version, generation time) alongside the asset?
   - Or just the asset blob/URL?

---

### **D. Brand Consistency & Iteration** (UX Requirements)

10. **Brand continuity across clients:**
    - How does it maintain visual consistency for a single brand over time (same client, different posts)?
    - Is brand memory per-client (stored in GPT config), or per-call (passed as input)?
    - Can clients build a "style library" (e.g., "always use our brand purple #7C3AED in CTA buttons")?

11. **Iteration loop:**
    - Can a user ask for tweaks ("make the background bluer", "add more motion") on a generated image?
    - Or is it one-shot generation (no conversation/refinement)?
    - If iteration exists, how is state tracked (version history)?

---

### **E. Operational Constraints** (Cost & Limits)

12. **Billing & rate limits:**
    - Cost per generation (in $ or OpenAI credits)?
    - Is it bundled in a ChatGPT Plus/Team subscription, or separate API billing?
    - Rate limits: max generations/minute? /hour? /day?
    - Can we handle concurrent requests (e.g., 5 users generating simultaneously)?

13. **Multilingual support:**
    - Can it generate images with text/copy in Spanish + English?
    - Or generation prompt/OCR only in English?

---

### **F. Authentication & Account Model** (Integration Scope)

14. **Auth account ownership:**
    - Is there a single "Startup Factory" OpenAI account/API key that the GPT lives under?
    - Or does each MIRA client need their own OpenAI account to authenticate?
    - Can clients bring their own API keys (for cost control / compliance)?

    **Impact on Layer 2 architecture:** If (A) we can centralize, design is simpler. If (B), each client needs their own key → connectable pattern. If (C) preferred, plan client-driven API key management in MIRA's Integrations.

---

## 5. Next Steps

1. **Share the GPT docs** with us (system prompt, API schema if exists, example usage)
2. **Answer the 14 questions above** — even "unknown, let's research" is valuable
3. **We design the integration** based on your answers
4. **Implement Layer 1** (Marketing Quick Action) — 1-2 days
5. **Then design Layer 2** (connectable OpenAI) if layer 1 succeeds

---

## 6. Timeline & Dependencies

- **Today (2026-07-15):** You share GPT docs + answers
- **Tomorrow (2026-07-16):** We design Layer 1 integration spec
- **Day 3-4:** Implement + test Layer 1 in staging
- **Week 2:** Deploy to production, gather feedback
- **Week 3+:** Design + implement Layer 2 (connectable OpenAI for all clients)

---

## 7. MIRA Endpoints & Patterns (Ref for Integration)

If you need to understand how MIRA currently wires AI tools:

### **Quick Action Flow (Template)**
```
POST /api/quick-actions
{
  "actionType": "crear_post",  // unique identifier
  "clientId": "uuid",           // multitenancy
  "formData": {
    "topic": "product launch",
    "platform": "instagram",
    "tone": "professional"
  }
}

Response:
{
  "id": "queue-uuid",
  "status": "processing" | "complete" | "error",
  "result": {
    "platform": "instagram",
    "copy": "...",
    "hashtags": [...],
    "media_brief": "..."  // ← TODAY: just text. WE NEED: actual image URL or blob
  },
  "memory": "stored in Supabase project_memory JSONB for this client"
}
```

### **Toolkit Tool Flow (Template)**
```
POST /api/toolkit/seo-audit
{
  "clientId": "uuid",
  "brandBrainId": "uuid",       // client's brand doc
  "inputs": { ... }
}

Response:
{
  "result": { "score": 75, "findings": [...] },
  "visualUrl": "/toolkit/seo-audit/123",  // rendered React component
  "downloadPdf": "..."  // future: html-to-pdf
}
```

### **Integrations Pattern (Template)**
```
GET /api/integrations/tools?clientId=uuid

Response:
{
  "connectedTools": ["apollo", "tavily", "google-drive"],
  "userSubscriptionPlan": "scale"
}

POST /api/integrations/tools
{
  "clientId": "uuid",
  "toolId": "openai",        // ← what we'd add for Layer 2
  "authToken": "sk-...",     // client's API key
  "metadata": {
    "model": "gpt-4o",
    "customGptId": "..."
  }
}
```

---

## 8. Contact & Alignment

**Startup Factory team:** Carlos (product/tech lead)  
**MIRA deployment:** https://mira-portal-nu.vercel.app  
**Documentation:** https://github.com/[repo]/apps/mira/portal  

Questions? We'll iterate on the design async.

---

**Generated:** 2026-07-15 | **For:** GPT Visual Content Generator Integration  
**Next:** Await answers to section 4 → proceed with Layer 1 design
