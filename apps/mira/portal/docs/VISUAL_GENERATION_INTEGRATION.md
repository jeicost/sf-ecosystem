# Visual Generation System — Integration Guide

**Status:** Infrastructure ready (Mock provider active)  
**For:** External Visual Production Agent team  
**Timeline:** Swap mock → real OpenAI adapter within 2-3 days  

---

## 📋 Overview

MIRA's visual generation system is **fully prepared** to integrate your Visual Production Agent. All infrastructure is in place; the only work remaining is:

1. Deliver OpenAI adapter implementation (`lib/generation/openai-visual-provider.ts`)
2. Provide updated prompt specs if needed
3. Test end-to-end with real images

**What's already built:**
- ✅ Database schema (visual_jobs, visual_assets, visual_feedback, visual_approvals)
- ✅ Storage layer (Supabase bucket + signed URLs)
- ✅ UI states (accepted → planning → rendering → qa → completed)
- ✅ Refinement flow (conversational, preserved elements, chaining)
- ✅ Quick Action types (`crear_post_visual`, `crear_carrusel_visual`, `editar_imagen_visual`)
- ✅ Feature flags (disabled by default, safe for production)
- ✅ Mock provider (for testing without your API)

---

## 🔌 Integration Points

### 1. Provider Interface

**File:** `lib/generation/visual-provider.ts`

Your adapter must implement:

```typescript
interface VisualGenerationProvider {
  createJob(input: VisualJobInput): Promise<VisualJobAccepted>
  getJob(jobId: string): Promise<VisualJobStatus>
  submitFeedback(jobId: string, feedback: VisualFeedback): Promise<void>
  cancelJob?(jobId: string): Promise<void>
}
```

### 2. Mock Provider (for reference)

**File:** `lib/generation/mock-visual-provider.ts`

Shows expected behavior:
- Job lifecycle: `accepted` → `planning` → `rendering` → `qa` → `completed`
- Asset generation with delays
- Progress tracking for carousels (X of Y slides)

### 3. Replacing the Mock

Once your adapter is ready:

```typescript
// apps/mira/portal/lib/generation/providers.ts (create this file)
import { MockVisualProvider } from './mock-visual-provider'
import { OpenAIVisualProvider } from './openai-visual-provider' // Your implementation

export function getVisualProvider(): VisualGenerationProvider {
  const flags = getVisualFeatureFlags()
  
  if (flags.visualProvider === 'openai' && flags.hasOpenAIKey) {
    return new OpenAIVisualProvider(process.env.OPENAI_API_KEY!)
  }
  
  return new MockVisualProvider()
}
```

Then update routes to use the factory.

---

## 📦 Input/Output Contracts

### Visual Job Input

User clicks "🎨 Post Visual" in Marketing department → UI sends:

```typescript
interface VisualJobInput {
  clientId: string
  actionType: 'crear_post_visual' | 'crear_carrusel_visual' | 'editar_imagen_visual'
  brandContext: {
    brandId: string
    brandName: string
    colorPalette?: ['#FF5A1F', '#00D4E0', ...] // from brand_profiles
    tone?: 'professional' | 'casual' | 'playful'
    guidelines?: 'Brand guidelines text...'
  }
  request: {
    topic?: string
    copy?: string
    imageUrl?: string // for edits
    numberOfSlides?: number
    style?: 'minimalist' | 'vibrant' | ...
  }
}
```

### Quick Action Prompts

**File:** `lib/generation/quick-action-prompts.ts` (lines ~313-390)

Generates visual **specs** (not images):

```json
{
  "post_copy": "The exact text that will appear on the post",
  "visual_direction": "Detailed visual direction for AI image generator",
  "hashtags": ["hashtag1"],
  "call_to_action": "Main CTA",
  "platform_optimized_for": "instagram|linkedin|twitter",
  "brand_guidelines_applied": "Specific brand elements/colors/fonts",
  "image_generation_prompt": "Detailed prompt for your image generator"
}
```

These specs are **input** to your generator. You can use them as-is or adapt.

### Visual Job Output

Your adapter returns:

```typescript
interface VisualJobStatus {
  jobId: string
  status: 'accepted' | 'planning' | 'rendering' | 'qa' | 'completed' | 'error'
  progress?: { current: number, total: number } // for carousels
  assets?: VisualAsset[]
  error?: string
}

interface VisualAsset {
  id: string
  jobId: string
  assetType: 'post' | 'carousel_slide' | 'image_edit'
  storageUrl: string // full public URL or signed URL
  version: number
  approvalStatus: 'pending' | 'approved' | 'rejected' | 'revision_requested'
  createdAt: string
  providerJobId?: string // your job reference (for chaining refinements)
}
```

---

## 💾 Database Layer

### visual_jobs

Stores main job record:

```sql
id, client_id, action_type, status,
brand_id, request_payload, provider, provider_job_id,
result_payload, error_message, created_at, updated_at
```

**Your adapter responsibility:**
- Read from `request_payload` (brand context + user input)
- Write to `provider_job_id` (your job reference, for polling your API)
- Update `status` field as job progresses
- Write to `result_payload` when complete (assets array)

### visual_assets

Each image/slide is a record:

```sql
id, job_id, client_id, storage_path, asset_type,
slide_index (for carousels), version, approval_status, ...
```

**Your adapter responsibility:**
- Create record per slide/image
- Set `storage_path` (path in Supabase bucket)
- Set `version` (starts at 1, incremented on refinements)

### visual_feedback

Refinement requests (conversational):

```sql
id, job_id, asset_id, refinement_prompt,
blocked_elements (array), previous_provider_job_id, status, ...
```

**For chaining refinements:** Your adapter reads `previous_provider_job_id` to know which previous job generated this asset, enabling incremental edits without full regeneration.

### visual_approvals

Audit trail (users approve/reject images):

```sql
id, asset_id, approved_by (user id), approval_status, feedback, ...
```

Read-only for your adapter; MIRA users create these via UI.

---

## 🎨 UI & Feature Flags

### Feature Flags

**File:** `lib/generation/feature-flags.ts`

Environment variables:

```bash
ENABLE_VISUAL_GENERATION=true      # Globally enable visual actions
VISUAL_PROVIDER=openai             # 'mock' | 'openai' | 'midjourney'
OPENAI_API_KEY=sk-...              # Your API key
```

**Default state (production-safe):**
- `ENABLE_VISUAL_GENERATION=false` → visual actions hidden from users
- `VISUAL_PROVIDER=mock` → fallback if key missing
- No risk of accidental API calls

**To activate:**
- Set `ENABLE_VISUAL_GENERATION=true` in Vercel env vars
- Set `VISUAL_PROVIDER=openai`
- Set `OPENAI_API_KEY`

### UI Component

**File:** `components/visual-job-progress.tsx`

Displays:
- Progress timeline (5+1 states)
- Asset grid with previews
- Download button
- Approve/Reject buttons
- Refinement panel (submit change requests)
- Progress for carousels (X of Y slides)

**Polling:** Every 2 seconds calls `GET /api/visual-jobs/{jobId}` to fetch updated status.

---

## 🔗 API Routes (To Build)

These need to be implemented by you or MIRA:

### POST /api/visual-jobs (Create Job)

```typescript
// Input: VisualJobInput
// Output: { jobId, status: 'accepted', estimatedDuration }
// 1. Insert record to visual_jobs (status='accepted')
// 2. Send to your adapter's createJob()
// 3. Store provider_job_id
// 4. Return immediately (no wait for generation)
```

### GET /api/visual-jobs/{jobId} (Poll Status)

```typescript
// Output: VisualJobStatus
// 1. Query visual_jobs by jobId
// 2. Call your adapter's getJob(provider_job_id) to get latest status
// 3. Update visual_jobs record
// 4. Return current state + assets
```

### POST /api/visual-jobs/{jobId}/feedback (Refinement)

```typescript
// Input: { assetId, refinementPrompt, blockedElements }
// 1. Call submitVisualRefinement() from visual-refinement.ts
// 2. Inserts to visual_feedback table
// 3. Marks asset version for re-gen
// 4. Your adapter reads pending refinements, queues re-gen
```

### POST /api/visual-assets/{assetId}/approve (Approval)

```typescript
// Input: { status: 'approved'|'rejected'|'revision_requested', feedback? }
// 1. Insert to visual_approvals table
// 2. Update visual_assets approval_status
// 3. (Optional) Trigger publish workflow if approved
```

---

## 🚀 Deployment Flow

### Phase 1: Disabled (Now)

```
ENABLE_VISUAL_GENERATION=false
VISUAL_PROVIDER=mock
↓
Visual action buttons visible in UI
Click triggers Mock provider (simulates 10-12s delay)
No real images, safe to merge
```

### Phase 2: Ready to Enable (When You Deliver Adapter)

```
1. You provide openai-visual-provider.ts implementation
2. PR: Add your adapter + update providers.ts factory
3. Set ENABLE_VISUAL_GENERATION=true in Vercel
4. Set VISUAL_PROVIDER=openai
5. Set OPENAI_API_KEY=sk-...
↓
Real images generated end-to-end
```

### Phase 3: Brand Personalization (Optional Future)

```
Adapt your prompts based on brand_context.brandName, colorPalette, guidelines
E.g., for Salsa Burgers: inject red/orange palette hints into your DALL-E prompts
```

---

## 🔐 Security & Constraints (Honored)

✅ **No Custom GPT scraping** — Pure API-based, no browser automation  
✅ **No hardcoded Salsa prompts** — All prompts generic + brand-injected  
✅ **No DALL-E 3 lockout** — Use any model via your OpenAI key  
✅ **Async-first design** — No <30s assumptions, polling expected  
✅ **No video (MVP)** — Static posts, carousels, image edits only  
✅ **Supabase-only memory** — No parallel visual memory system  
✅ **QA/approval gating** — No auto-publish, user approval required  
✅ **Centralized API keys** — No "bring your own key", Startup Factory OpenAI key only  

---

## 📞 Integration Checklist

- [ ] You deliver `openai-visual-provider.ts` (implements VisualGenerationProvider)
- [ ] We create `providers.ts` factory + wire into routes
- [ ] Test end-to-end with mock (no key needed)
- [ ] You provide final prompt specs (or we use generated ones)
- [ ] Set Vercel env vars: ENABLE, PROVIDER, API_KEY
- [ ] Test 1 real post (marketing) → image generated → UI shows preview
- [ ] Test approval/rejection flow
- [ ] Test refinement (submit "darker background" → new image)
- [ ] Test carousel (5 slides → 5 images in parallel or sequenced)
- [ ] Spot-check brand context injection (colors/tone in images)
- [ ] Monitor Sentry + API costs (OpenAI billing)

---

## 📂 Key Files Reference

| File | Purpose |
|------|---------|
| `lib/generation/visual-provider.ts` | Interface (you implement) |
| `lib/generation/mock-visual-provider.ts` | Reference behavior |
| `lib/generation/visual-storage.ts` | Upload/download signed URLs |
| `lib/generation/visual-refinement.ts` | Feedback conversation loop |
| `lib/generation/feature-flags.ts` | Environment gate |
| `components/visual-job-progress.tsx` | User-facing UI |
| `supabase/migrations/0028_visual_jobs.sql` | Database schema |
| `lib/generation/quick-action-prompts.ts` | Visual spec generation |

---

**Infrastructure ready. Awaiting your adapter. 🚀**
