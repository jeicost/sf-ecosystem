import structlog
import httpx
from scrapers.models import RawLead, ScraperResult

log = structlog.get_logger()

APIFY_BASE_URL = "https://api.apify.com/v2"


class ApifyLinkedInScraper:
    """Enriquece perfiles LinkedIn usando Apify actor."""

    def __init__(self, api_token: str, actor_id: str) -> None:
        self._client = httpx.AsyncClient(
            base_url=APIFY_BASE_URL,
            headers={"Authorization": f"Bearer {api_token}"},
            timeout=120,
        )
        self.actor_id = actor_id

    async def enrich_profile(self, linkedin_url: str) -> dict:
        """Scrapea un perfil LinkedIn y devuelve datos estructurados."""
        # TODO Semana 2: POST /acts/{actor_id}/runs → esperar resultado
        log.info("apify.linkedin.stub", url=linkedin_url)
        raise NotImplementedError("LinkedIn scraper — Semana 2")

    async def close(self) -> None:
        await self._client.aclose()
