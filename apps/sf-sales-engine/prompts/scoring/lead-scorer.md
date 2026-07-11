---
version: "1.0.0"
model: claude-haiku-4-5-20251001
max_tokens: 256
---

# Lead Scorer — ICP Fit 0-100

Evalúa si este prospect encaja con el ICP dado y devuelve un score JSON.

## ICP del cliente
{icp_json}

## Prospect a evaluar
{prospect_json}

## Output (JSON estricto, sin markdown)

```json
{
  "score": <0-100>,
  "classification": "<hot|warm|cold|disqualify>",
  "reason": "<máximo 2 líneas>",
  "confidence": <0.0-1.0>
}
```

**Criterios**: hot ≥75 · warm 50-74 · cold 20-49 · disqualify <20 o tiene descalificador.
