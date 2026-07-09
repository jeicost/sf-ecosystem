# 🤖 MIRA Test Agent — Proof of Concept

Este es un agente de prueba que **realmente usa el Brand Brain** de Dadybox.

## Cómo Funciona

```javascript
// 1. Test Agent que consume Brand Brain API
async function dadyboxAgent(userQuery) {
  const clientId = 'e664873b-034d-48cd-9a45-8631672ef375'; // Dadybox
  
  // PASO 1: Fetch Brand Brain (fresh, no cache)
  const brandBrainRes = await fetch(
    `https://portal-six-kappa-22.vercel.app/api/brand-brain/${clientId}`
  );
  const brandBrain = await brandBrainRes.json();
  
  // PASO 2: Construir system prompt con Brand Brain
  const systemPrompt = `
You are a customer service agent for ${brandBrain.client_name}.

BRAND MISSION: ${brandBrain.identity.mission}
BRAND PROPOSITION: ${brandBrain.identity.proposition}
TONE: ${brandBrain.identity.tone_of_voice}
VALUES: ${brandBrain.identity.values.join(', ')}

KEY EXPERTISE AREAS:
${brandBrain.content_pillars.map(p => `- ${p.name}: ${p.description}`).join('\n')}

Respond as this brand with their voice and values.
  `;

  // PASO 3: Llamar a Anthropic (o cualquier LLM)
  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1024,
    system: systemPrompt,
    messages: [
      { role: 'user', content: userQuery }
    ]
  });

  const agentResponse = response.content[0].text;

  // PASO 4: Log interaction (cuando tabla esté lista)
  // POST /api/agent-interactions
  //   client_id, agent_name, user_query, agent_response, outcome

  return agentResponse;
}
```

## Test Real — Ejecutar Ahora

```bash
# Node.js script
node -e "
const https = require('https');

// Fetch Brand Brain
https.get('https://portal-six-kappa-22.vercel.app/api/brand-brain/e664873b-034d-48cd-9a45-8631672ef375', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const brain = JSON.parse(data);
    console.log('✅ Brand Brain Fetched:');
    console.log('Client:', brain.client_name);
    console.log('Mission:', brain.identity.mission);
    console.log('Pillars:', brain.content_pillars.length);
    console.log('\nSystem Prompt Injection Ready:');
    console.log(brain.system_prompt_injection.substring(0, 200) + '...');
  });
});
"
```

## Integration Pattern Para Todos Los Agentes

```javascript
// Patrón reutilizable para los 30 agentes

class MiraAgent {
  constructor(clientId, agentName) {
    this.clientId = clientId;
    this.agentName = agentName;
  }

  async getBrandBrain() {
    const res = await fetch(
      \`/api/brand-brain/\${this.clientId}\`
    );
    return res.json();
  }

  async respond(userQuery) {
    // 1. Get fresh Brand Brain
    const brain = await this.getBrandBrain();

    // 2. Build system prompt
    const system = brain.system_prompt_injection;

    // 3. Call LLM
    const response = await this.llm.generate({
      system,
      message: userQuery
    });

    // 4. Log interaction (async, no wait)
    this.logInteraction(userQuery, response, 'pending');

    return response;
  }

  async logInteraction(query, response, outcome) {
    fetch('/api/agent-interactions', {
      method: 'POST',
      body: JSON.stringify({
        client_id: this.clientId,
        agent_name: this.agentName,
        user_query: query,
        agent_response: response,
        outcome: outcome
      })
    }).catch(err => console.log('Interaction log failed (ok):', err.message));
  }
}

// Usage
const dadyboxSalesAgent = new MiraAgent(
  'e664873b-034d-48cd-9a45-8631672ef375',
  'Sales Agent'
);

const response = await dadyboxSalesAgent.respond(
  'Tell me about your SGA service'
);
console.log(response);
```

## Test Flow (Ejecutar Ahora)

1. **Endpoint check**: `curl https://portal-six-kappa-22.vercel.app/api/brand-brain/e664873b-034d-48cd-9a45-8631672ef375`
   
2. **Should return**:
   ```json
   {
     "client_name": "Dadybox",
     "identity": {...},
     "content_pillars": [...],
     "system_prompt_injection": "You are an AI assistant representing Dadybox..."
   }
   ```

3. **Agent can then**:
   - Inject system prompt
   - Call Claude/GPT
   - Get Dadybox-specific response
   - Log interaction for feedback loop

---

## Status

✅ **Brand Brain API**: Live & Responding  
✅ **Endpoints**: Deployed to Vercel  
✅ **System Prompt Injection**: Ready  
⏳ **agent_interactions table**: Need SQL execution  
✅ **Integration pattern**: Documented  

**Next 30 minutes**: Execute SQL → Test endpoint → Confirm agent works

---

## Para Los 30 Agentes

Cada agente usa el mismo patrón:

```
1. GET /api/brand-brain/{clientId}
2. Inject response.system_prompt_injection
3. Generate LLM response
4. POST /api/agent-interactions
```

**Esto significa**: Todos los agentes automáticamente usan Brand Brain, y cualquier edit en Brand Brain → agentes responden diferente next time. ⚡

---

**Ready to test?** Ejecuta la SQL y luego:

```bash
curl https://portal-six-kappa-22.vercel.app/api/brand-brain/e664873b-034d-48cd-9a45-8631672ef375
```

Debe devolver el Brand Brain completo de Dadybox con system_prompt_injection.
