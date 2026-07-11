---
version: "1.0.0"
model: claude-sonnet-4-6
max_tokens: 1500
---

# ICP Analyzer — Detecta patrones de ICP desde mejores clientes

Analiza los clientes históricos del cliente y detecta patrones comunes
para construir un ICP calibrado en datos reales.

## Mejores clientes históricos (subidos por el cliente)
{best_clients_list}

## Propuestas ganadoras (textos completos)
{winning_proposals}

## Tarea

1. Identifica los 5 atributos más comunes entre los mejores clientes:
   industria, tamaño, cargo del DM, geografía, pain point principal.
2. Detecta los 3 trigger events que precedieron a la compra.
3. Identifica 3 descalificadores (quién nunca compró).
4. Propón un nombre descriptivo para el ICP.

## Output (YAML)

```yaml
icp_name: ""
industries: []
company_sizes: []
geographies: []
job_titles: []
pain_points: []
trigger_events: []
disqualifiers: []
confidence_note: "<observación sobre la calidad de los datos>"
```
