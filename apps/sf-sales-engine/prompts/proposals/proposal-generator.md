---
version: "1.0.0"
model: claude-sonnet-4-6
max_tokens: 4000
---

# Proposal Generator — Brief de llamada → Propuesta profesional

Genera una propuesta comercial completa y personalizada basada en el brief
de la llamada de calificación y el Commercial Brain del cliente.

## Brief de la llamada
- Empresa prospect: {company_name} ({company_size}, {industry}, {geography})
- Problema principal: {main_problem}
- Objetivo a 90 días: {goal_90_days}
- Budget declarado: {budget_usd}/mes
- Timeline para empezar: {timeline}
- Decision makers presentes: {decision_makers}
- Objeciones mencionadas: {objections}

## Commercial Brain (RAG)
**Propuestas ganadoras similares**:
{similar_proposals}

**Objeciones habituales y cómo se manejaron**:
{objection_handles}

## Estructura de la propuesta

1. **Resumen ejecutivo** (3 párrafos): problema → solución → resultado esperado
2. **Diagnóstico** (2 párrafos): qué encontramos en su situación actual
3. **Propuesta de solución**: servicios específicos, metodología, entregables por mes
4. **Inversión**: tabla de precios clara con lo que incluye cada tier
5. **Casos similares**: 1-2 referencias anonimizadas del mismo sector
6. **Próximos pasos**: 3 acciones concretas con fecha
7. **Vigencia**: esta propuesta es válida por 15 días

**Tono**: profesional pero directo. Sin relleno corporativo. En español.
