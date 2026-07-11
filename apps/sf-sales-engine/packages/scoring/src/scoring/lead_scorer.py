import anthropic
import structlog
from scoring.models import LeadScore, ScoringInput

log = structlog.get_logger()

HAIKU_MODEL = "claude-haiku-4-5-20251001"

SCORE_PROMPT = """\
Eres un experto en calificación de leads B2B. Evalúa si este prospect encaja con el ICP dado.

ICP del cliente:
- Industrias: {industries}
- Tamaños de empresa: {company_sizes}
- Geografías: {geographies}
- Cargos objetivo: {job_titles}
- Pain points que resolvemos: {pain_points}
- Señales de trigger: {trigger_events}
- Descalificadores: {disqualifiers}

Prospect a evaluar:
- Cargo: {title}
- Empresa: {company_name} ({company_size} empleados)
- Industria: {industry}
- Geografía: {geography}
- Resumen LinkedIn: {linkedin_summary}
- Señales detectadas: {trigger_signals}

Responde SOLO con este JSON (sin markdown):
{{
  "score": <0-100>,
  "classification": "<hot|warm|cold|disqualify>",
  "reason": "<máximo 2 líneas explicando el score>",
  "confidence": <0.0-1.0>
}}

Criterios: hot=75+, warm=50-74, cold=20-49, disqualify=<20 o tiene descalificador.
"""


class LeadScorer:
    """Scorea leads contra el ICP usando Claude Haiku (barato y rápido)."""

    def __init__(self) -> None:
        self._client = anthropic.AsyncAnthropic()

    async def score(self, input: ScoringInput) -> LeadScore:
        prompt = SCORE_PROMPT.format(
            industries=", ".join(input.icp.industries),
            company_sizes=", ".join(input.icp.company_sizes),
            geographies=", ".join(input.icp.geographies),
            job_titles=", ".join(input.icp.job_titles),
            pain_points=", ".join(input.icp.pain_points),
            trigger_events=", ".join(input.icp.trigger_events),
            disqualifiers=", ".join(input.icp.disqualifiers),
            title=input.title or "Desconocido",
            company_name=input.company_name or "Desconocida",
            company_size=input.company_size or "Desconocido",
            industry=input.industry or "Desconocida",
            geography=input.geography or "Desconocida",
            linkedin_summary=input.linkedin_summary or "No disponible",
            trigger_signals=", ".join(input.trigger_signals) or "Ninguna",
        )

        message = await self._client.messages.create(
            model=HAIKU_MODEL,
            max_tokens=256,
            messages=[{"role": "user", "content": prompt}],
        )

        import json
        raw = json.loads(message.content[0].text)  # type: ignore[index]
        log.info("lead.scored", lead_id=str(input.lead_id), score=raw["score"])

        return LeadScore(
            lead_id=input.lead_id,
            score=raw["score"],
            classification=raw["classification"],
            reason=raw["reason"],
            confidence=raw["confidence"],
        )
