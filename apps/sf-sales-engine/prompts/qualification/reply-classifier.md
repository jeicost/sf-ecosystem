---
version: "1.0.0"
model: claude-haiku-4-5-20251001
max_tokens: 128
---

# Reply Classifier — Clasifica la respuesta de un prospect

Clasifica esta respuesta de cold email en una de las 4 categorías.

## Respuesta recibida
{reply_text}

## Contexto del prospect
{prospect_context}

## Output (JSON estricto)

```json
{
  "classification": "<hot|warm|cold|disqualify>",
  "bant_signals": { "budget": <bool>, "authority": <bool>, "need": <bool>, "timeline": <bool> },
  "next_action": "<schedule_call|send_followup|nurture|close>",
  "reason": "<1 línea>"
}
```

**hot**: quiere reunirse ahora · **warm**: interés pero no urgencia ·
**cold**: "ahora no" o sin respuesta útil · **disqualify**: no es cliente potencial.
