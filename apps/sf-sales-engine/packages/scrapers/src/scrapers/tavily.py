import structlog
import httpx

log = structlog.get_logger()

TAVILY_BASE_URL = "https://api.tavily.com"


class TavilyScraper:
    """Busca leads y noticias de empresa usando Tavily Search API."""

    def __init__(self, api_key: str) -> None:
        self._api_key = api_key
        self._client = httpx.AsyncClient(
            base_url=TAVILY_BASE_URL,
            timeout=25,
        )

    async def search(self, query: str, max_results: int = 10, depth: str = "advanced") -> list[dict]:
        """Búsqueda general. Retorna lista de {title, url, content}."""
        payload = {
            "api_key": self._api_key,
            "query": query,
            "search_depth": depth,
            "max_results": max_results,
            "include_answer": False,
            "include_raw_content": False,
        }
        r = await self._client.post("/search", json=payload)
        r.raise_for_status()
        data = r.json()
        results = data.get("results", [])
        log.info("tavily.search", query=query[:60], results=len(results))
        return results

    async def search_company_news(self, company_name: str, days: int = 30) -> list[dict]:
        """Retorna noticias recientes de la empresa como señales de trigger."""
        query = f"{company_name} noticias funding inversión expansión 2025 2026"
        results = await self.search(query, max_results=5, depth="basic")
        return results

    async def close(self) -> None:
        await self._client.aclose()
