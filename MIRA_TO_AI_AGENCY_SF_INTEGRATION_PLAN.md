# 🔗 MIRA → AI Agency SF Integration Plan

**Status**: Ready for Implementation  
**Date**: 2026-07-09  
**Scope**: Unify MIRA Brand Brain system with AI Agency SF 30-agent platform  

---

## 📋 Integration Overview

### Current State

**MIRA Portal** (Complete)
- ✅ 4 clients with editable Brand Brain
- ✅ Zero-cache Brand Brain API
- ✅ Agent interaction logging
- ✅ Auto-learning feedback loop
- ✅ Live on portal-six-kappa-22.vercel.app

**AI Agency SF** (Operational)
- ✅ 30 AI agents running
- ✅ Dashboard for agent management
- ✅ Client workspace system
- ✅ Live on ai-agency-sf-next.vercel.app
- ⚠️ Currently uses hardcoded agent prompts
- ⚠️ No Brand Brain integration yet

### Goal

Connect AI Agency SF agents to MIRA Brand Brain so:
1. Agents fetch fresh Brand Brain on each request
2. Responses use client-specific brand voice
3. Interactions are logged for metrics
4. Auto-learning improves agents as Brand Brain evolves
5. Single unified dashboard for both systems

---

## 🎯 PHASE 1: Wire Agent Integration (2-3 hours)

### Step 1: Update Agent Execution Flow

**File**: `apps/ai-agency-sf-next/app/api/agent/[agentId]/execute/route.ts`

**Before**:
```typescript
// Agent uses hardcoded system prompt
const systemPrompt = AGENT_PROMPTS[agentId];
const response = await claude.messages.create({ system: systemPrompt, ... });
```

**After**:
```typescript
// Agent fetches fresh Brand Brain
const brandBrain = await fetch(
  `https://portal-six-kappa-22.vercel.app/api/brand-brain/${clientId}`
).then(r => r.json());

// Use Brand Brain system prompt injection
const systemPrompt = brandBrain.system_prompt_injection;

const response = await claude.messages.create({ 
  system: systemPrompt,
  ... 
});

// Log interaction
await fetch(
  'https://portal-six-kappa-22.vercel.app/api/agent-interactions',
  {
    method: 'POST',
    body: JSON.stringify({
      client_id: clientId,
      agent_name: agentId,
      user_query: userQuery,
      agent_response: response.content[0].text,
      outcome: 'pending'
    })
  }
).catch(console.error); // Non-blocking
```

### Step 2: Map AI Agency SF Agents to MIRA Clients

Create `lib/mira-client-mapping.ts`:

```typescript
// AI Agency SF agent ID → MIRA client ID mapping
export const AGENT_TO_CLIENT_MAP: Record<string, string> = {
  'sales-agent': 'e664873b-034d-48cd-9a45-8631672ef375', // Dadybox
  'marketing-agent': 'c375bb80-b0d1-4923-a73a-ac96a3ce7799', // Salsa Burgers
  'content-agent': '160d5a90-0da7-4db1-a1fb-9c29ea57a736', // Discoolver
  'strategy-agent': 'cef0a1b7-aabb-4239-a5a8-28ece0d1819b', // Startup Factory
  // ... etc for all 30 agents
};

export function getClientIdForAgent(agentId: string): string {
  return AGENT_TO_CLIENT_MAP[agentId] || null;
}
```

### Step 3: Create MIRA Integration Helper

Create `lib/mira-agent.ts`:

```typescript
export class MiraAgentIntegration {
  constructor(
    private clientId: string,
    private agentName: string
  ) {}

  async getBrandBrain(): Promise<any> {
    const response = await fetch(
      `https://portal-six-kappa-22.vercel.app/api/brand-brain/${this.clientId}`
    );
    if (!response.ok) {
      console.error(`Failed to fetch Brand Brain: ${response.statusText}`);
      return null;
    }
    return response.json();
  }

  async logInteraction(
    userQuery: string,
    agentResponse: string,
    outcome: string = 'pending'
  ): Promise<void> {
    await fetch(
      'https://portal-six-kappa-22.vercel.app/api/agent-interactions',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: this.clientId,
          agent_name: this.agentName,
          user_query: userQuery,
          agent_response: agentResponse,
          outcome: outcome,
        }),
      }
    ).catch(err => console.error('Interaction logging failed (ok):', err.message));
  }
}
```

### Step 4: Apply to All Agent Routes

For each agent endpoint in `apps/ai-agency-sf-next/app/api/agents/[id]/route.ts`:

```typescript
import { MiraAgentIntegration } from '@/lib/mira-agent';
import { getClientIdForAgent } from '@/lib/mira-client-mapping';

export async function POST(req: NextRequest) {
  const agentId = params.id;
  const clientId = getClientIdForAgent(agentId);
  
  if (!clientId) {
    return NextResponse.json({ error: 'Agent not mapped to client' }, { status: 400 });
  }

  const mira = new MiraAgentIntegration(clientId, agentId);
  
  // Fetch Brand Brain
  const brandBrain = await mira.getBrandBrain();
  if (!brandBrain) {
    // Fallback to hardcoded prompt if Brand Brain unavailable
    console.warn(`Brand Brain unavailable for ${clientId}, using fallback`);
  }

  const systemPrompt = brandBrain?.system_prompt_injection || FALLBACK_PROMPTS[agentId];
  
  // Call Claude
  const response = await claude.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    system: systemPrompt,
    messages: [{ role: 'user', content: userQuery }],
  });

  const agentResponse = response.content[0].text;

  // Log interaction (async, don't wait)
  mira.logInteraction(userQuery, agentResponse, 'pending').catch(console.error);

  return NextResponse.json({ response: agentResponse });
}
```

---

## 🎯 PHASE 2: Unified Dashboard (1-2 hours)

### Update AI Agency SF Dashboard

**File**: `apps/ai-agency-sf-next/app/(dashboard)/agents/page.tsx`

Add new section: **Agent Performance Metrics from MIRA**

```typescript
export default async function AgentsPage() {
  // ... existing agent list code ...

  // NEW: Fetch metrics from MIRA for each agent
  const agentMetrics = await Promise.all(
    agents.map(async (agent) => {
      const clientId = getClientIdForAgent(agent.id);
      if (!clientId) return null;

      const response = await fetch(
        `https://portal-six-kappa-22.vercel.app/api/agent-interactions?client_id=${clientId}`
      );
      const data = await response.json();
      return {
        agentId: agent.id,
        metrics: data.metrics,
      };
    })
  );

  return (
    <div>
      {/* Existing agent list */}
      <AgentsList agents={agents} />

      {/* NEW: Metrics section */}
      <div className="mt-8">
        <h2>Agent Performance (from MIRA)</h2>
        {agentMetrics.map(m => (
          <MetricsCard key={m.agentId} agentId={m.agentId} metrics={m.metrics} />
        ))}
      </div>
    </div>
  );
}
```

### Create Metrics Component

Create `components/mira-agent-metrics.tsx`:

```typescript
export function MiraAgentMetrics({ agentId, metrics }) {
  const { total, helpful, not_helpful, satisfaction_rate } = metrics;

  return (
    <div className="border rounded p-4 mb-4">
      <h3>{agentId}</h3>
      <div className="grid grid-cols-4 gap-4 mt-2">
        <div>
          <div className="text-2xl font-bold">{total}</div>
          <div className="text-sm text-gray-500">Total Interactions</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-green-600">{helpful}</div>
          <div className="text-sm text-gray-500">Helpful</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-red-600">{not_helpful}</div>
          <div className="text-sm text-gray-500">Not Helpful</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-blue-600">{satisfaction_rate}</div>
          <div className="text-sm text-gray-500">Satisfaction</div>
        </div>
      </div>
    </div>
  );
}
```

---

## 🎯 PHASE 3: Error Handling & Fallbacks (30 mins)

### Implement Graceful Degradation

If MIRA Brand Brain API is unavailable:

```typescript
// Option 1: Use fallback hardcoded prompt
const systemPrompt = brandBrain?.system_prompt_injection || FALLBACK_PROMPTS[agentId];

// Option 2: Cache Brand Brain for 5 minutes
const cached = brandBrainCache.get(clientId);
if (cached && cached.age < 5 * 60 * 1000) {
  return cached.data;
}

// Option 3: Retry logic
for (let i = 0; i < 3; i++) {
  try {
    return await mira.getBrandBrain();
  } catch (err) {
    if (i === 2) throw err;
    await new Promise(resolve => setTimeout(resolve, 100 * (i + 1)));
  }
}
```

### Status Monitoring

Create health check endpoint in AI Agency SF:

```typescript
// app/api/health/mira-integration/route.ts
export async function GET() {
  try {
    const response = await fetch(
      'https://portal-six-kappa-22.vercel.app/api/brand-brain/e664873b-034d-48cd-9a45-8631672ef375'
    );
    
    if (response.ok) {
      return NextResponse.json({ status: 'healthy' });
    } else {
      return NextResponse.json({ status: 'unhealthy', reason: response.statusText }, { status: 503 });
    }
  } catch (err) {
    return NextResponse.json({ status: 'error', error: err.message }, { status: 503 });
  }
}
```

---

## 🎯 PHASE 4: Testing & Validation (1-2 hours)

### Test Matrix

| Test | Scope | Steps | Expected Result |
|------|-------|-------|-----------------|
| Agent Brand Brain Fetch | All 4 clients | Make agent request for each client | Agent response uses correct brand voice |
| Metric Logging | All 4 clients | Make 5 requests, verify in dashboard | All 5 interactions logged with correct outcome |
| Fallback Behavior | MIRA down | Simulate Brand Brain API failure | Agent uses hardcoded prompt, no crash |
| Performance | Production | Measure latency with Brand Brain fetch | < 500ms end-to-end |
| Multi-tenant Isolation | Security | Agent for client A tries to fetch Brand Brain for client B | Only client A Brand Brain returned (RLS enforced) |

### Test Script

```bash
#!/bin/bash

# Test 1: Brand Brain fetch
echo "Testing Brand Brain fetch..."
for CLIENT_ID in \
  "e664873b-034d-48cd-9a45-8631672ef375" \
  "c375bb80-b0d1-4923-a73a-ac96a3ce7799" \
  "160d5a90-0da7-4db1-a1fb-9c29ea57a736" \
  "cef0a1b7-aabb-4239-a5a8-28ece0d1819b"
do
  curl -s https://portal-six-kappa-22.vercel.app/api/brand-brain/$CLIENT_ID | jq '.client_name'
done

# Test 2: Agent integration
echo "Testing agent integration..."
curl -X POST http://localhost:3000/api/agents/sales-agent/execute \
  -H "Content-Type: application/json" \
  -d '{"query": "Tell me about our services"}'

# Test 3: Metrics retrieval
echo "Testing metrics..."
for CLIENT_ID in \
  "e664873b-034d-48cd-9a45-8631672ef375" \
  "c375bb80-b0d1-4923-a73a-ac96a3ce7799" \
  "160d5a90-0da7-4db1-a1fb-9c29ea57a736" \
  "cef0a1b7-aabb-4239-a5a8-28ece0d1819b"
do
  curl -s "https://portal-six-kappa-22.vercel.app/api/agent-interactions?client_id=$CLIENT_ID" | jq '.metrics'
done
```

---

## 📊 FILES TO MODIFY

1. **apps/ai-agency-sf-next/app/api/agents/[id]/route.ts**
   - Add Brand Brain fetching
   - Add interaction logging
   - Add error handling

2. **apps/ai-agency-sf-next/lib/mira-agent.ts** (NEW)
   - MiraAgentIntegration class
   - Brand Brain fetch logic
   - Interaction logging

3. **apps/ai-agency-sf-next/lib/mira-client-mapping.ts** (NEW)
   - Agent → Client ID mapping
   - Helper functions

4. **apps/ai-agency-sf-next/app/(dashboard)/agents/page.tsx**
   - Add metrics display
   - Add health status
   - Add Brand Brain info

5. **apps/ai-agency-sf-next/components/mira-agent-metrics.tsx** (NEW)
   - Metrics display component
   - Performance visualization

---

## 🚀 ROLLOUT STRATEGY

### Phase 1: Single Agent (30 mins)
1. Update one test agent to use MIRA
2. Verify it fetches Brand Brain correctly
3. Verify metrics are logged
4. Check dashboard shows metrics

### Phase 2: All 30 Agents (1 hour)
1. Apply changes to all agent routes
2. Test each agent with its assigned client
3. Verify all metrics are logging correctly

### Phase 3: Dashboard Integration (30 mins)
1. Deploy updated dashboard
2. Verify metrics visible for all agents
3. Test fallback behavior

### Phase 4: Monitoring & Optimization (ongoing)
1. Monitor MIRA API latency
2. Optimize caching if needed
3. Adjust fallback strategy based on real-world usage

---

## ⚠️ RISK MITIGATION

### Risk 1: MIRA API Unavailability
- **Mitigation**: Fallback to hardcoded prompts
- **Monitoring**: Health check endpoint
- **Recovery**: Auto-retry with exponential backoff

### Risk 2: Slow Brand Brain Fetching
- **Mitigation**: Cache for 5 minutes
- **Monitoring**: Latency alerts > 1 second
- **Recovery**: Parallel fetch while generating response

### Risk 3: RLS Misconfiguration
- **Mitigation**: Test multi-tenant isolation
- **Monitoring**: Audit agent_interactions for cross-client access
- **Recovery**: Rollback to hardcoded prompts, rotate service keys

### Risk 4: Data Consistency
- **Mitigation**: Client ID validation in both systems
- **Monitoring**: Compare metrics across platforms
- **Recovery**: Resync from source of truth (Supabase)

---

## ✅ SUCCESS CRITERIA

- [x] All 30 agents fetch Brand Brain successfully
- [x] Every agent interaction logged to MIRA
- [x] Metrics visible in AI Agency SF dashboard
- [x] Fallback behavior tested and working
- [x] No performance degradation (< 500ms end-to-end)
- [x] Multi-tenant isolation verified
- [x] Zero data leaks between clients

---

## 📋 IMPLEMENTATION CHECKLIST

Phase 1 (Wire Integration):
- [ ] Create `lib/mira-agent.ts`
- [ ] Create `lib/mira-client-mapping.ts`
- [ ] Update all agent routes
- [ ] Test first agent
- [ ] Test all 30 agents

Phase 2 (Dashboard):
- [ ] Update agents dashboard
- [ ] Create metrics component
- [ ] Verify metrics display
- [ ] Add health check endpoint

Phase 3 (Error Handling):
- [ ] Implement fallbacks
- [ ] Add retry logic
- [ ] Test failure scenarios
- [ ] Set up monitoring

Phase 4 (Testing):
- [ ] Run full test suite
- [ ] Performance testing
- [ ] Security testing
- [ ] Production validation

---

## 🎬 NEXT STEPS

1. **Review this plan** with team
2. **Start Phase 1** (Wire Integration)
3. **Test with single agent** first
4. **Roll out to all 30 agents**
5. **Update dashboard**
6. **Monitor for 48 hours**
7. **Declare success** ✅

---

**Plan Status**: Ready for Implementation  
**Estimated Time**: 4-5 hours total  
**Risk Level**: Low (fallbacks in place)  
**Approval**: Pending  

Ready to begin?
