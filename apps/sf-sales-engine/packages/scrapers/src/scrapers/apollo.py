import structlog
import httpx
from scrapers.models import RawLead, ScraperResult

log = structlog.get_logger()

APOLLO_BASE_URL = "https://api.apollo.io/v1"

# Apollo pricing: ~$0.01-0.02 per person search
APOLLO_COST_PER_SEARCH = 0.015


class ApolloRateLimitError(Exception):
    """Raised when Apollo API rate limit is hit (429)."""
    pass


class ApolloAuthError(Exception):
    """Raised when API key is invalid or unauthorized (401)."""
    pass


class ApolloScraper:
    """Extrae leads desde Apollo según un dominio de empresa."""

    def __init__(self, api_key: str) -> None:
        self._api_key = api_key
        self._client = httpx.AsyncClient(
            base_url=APOLLO_BASE_URL,
            headers={"x-api-key": api_key, "Content-Type": "application/json"},
            timeout=30,
        )

    async def search(
        self,
        company_domain: str,
        limit: int = 5,
    ) -> list[dict]:
        """
        Busca personas en una empresa por dominio.

        Args:
            company_domain: Dominio de la empresa (ej. "acme.com")
            limit: Máximo número de personas a retornar (default 5)

        Returns:
            Lista de dict con {email, name, title, company_name, linkedin_url}

        Raises:
            ApolloAuthError: Si la API key es inválida (401)
            ApolloRateLimitError: Si se excede el rate limit (429)
            httpx.HTTPError: Para otros errores HTTP
        """
        if not company_domain:
            log.warning("apollo.search.empty_domain")
            return []

        payload = {
            "domain": company_domain,
            "per_page": min(limit, 10),  # Apollo max 10 per page
            "page": 1,
        }

        try:
            r = await self._client.post(
                "/people/search",
                json=payload,
            )

            if r.status_code == 401:
                log.error("apollo.auth_error", domain=company_domain)
                raise ApolloAuthError("Invalid Apollo API key")

            if r.status_code == 429:
                log.warning("apollo.rate_limit", domain=company_domain)
                raise ApolloRateLimitError(
                    "Apollo API rate limit exceeded. Retry after a few seconds."
                )

            r.raise_for_status()

            data = r.json()
            people = data.get("people", [])

            log.info(
                "apollo.search.success",
                domain=company_domain,
                count=len(people),
                limit=limit,
            )

            # Mapear respuesta Apollo a formato estándar
            results = []
            for person in people[:limit]:
                result = {
                    "email": person.get("email"),
                    "name": person.get("name"),
                    "title": person.get("title"),
                    "company_name": person.get("company_name"),
                    "linkedin_url": person.get("linkedin_url"),
                }
                results.append(result)

            return results

        except (ApolloAuthError, ApolloRateLimitError):
            raise
        except httpx.HTTPError as e:
            log.error("apollo.http_error", domain=company_domain, error=str(e))
            raise

    async def fetch_leads(
        self,
        job_titles: list[str],
        industries: list[str],
        geographies: list[str],
        company_sizes: list[str],
        limit: int = 100,
    ) -> ScraperResult:
        """
        Busca leads en Apollo que coinciden con criterios ICP.

        Nota: Apollo People Search API requiere domain para búsqueda.
        Para búsquedas por ICP, usar Apollo Prospects API (parámetros adicionales).
        Esta implementación soporta ambos patrones.

        Args:
            job_titles: Lista de títulos a buscar
            industries: Lista de industrias
            geographies: Lista de geografías
            company_sizes: Tamaños de empresa
            limit: Máximo de resultados

        Returns:
            ScraperResult con leads extraídos
        """
        leads = []
        error_msg = None

        try:
            # Construir query para Prospects API
            # Apollo soporta: job_titles, industries, seniority_level, company_size, etc.
            payload = {
                "per_page": min(limit, 50),  # Apollo max 50 per page
                "page": 1,
            }

            if job_titles:
                payload["job_titles"] = job_titles
            if industries:
                payload["industries"] = industries
            if company_sizes:
                payload["company_size"] = company_sizes
            # geographies se mapea a "state" o "country" en Apollo
            if geographies:
                payload["states"] = geographies

            r = await self._client.post(
                "/prospects/search",
                json=payload,
            )

            if r.status_code == 401:
                log.error("apollo.fetch_leads.auth_error")
                error_msg = "Invalid Apollo API key"
                raise ApolloAuthError(error_msg)

            if r.status_code == 429:
                log.warning("apollo.fetch_leads.rate_limit")
                error_msg = "Rate limit exceeded"
                raise ApolloRateLimitError(error_msg)

            r.raise_for_status()

            data = r.json()
            prospects = data.get("prospects", [])

            log.info(
                "apollo.fetch_leads.success",
                count=len(prospects),
                job_titles=job_titles,
                industries=industries,
            )

            # Mapear a RawLead
            for prospect in prospects[:limit]:
                lead = RawLead(
                    first_name=prospect.get("first_name"),
                    last_name=prospect.get("last_name"),
                    email=prospect.get("email"),
                    title=prospect.get("title"),
                    company_name=prospect.get("company_name"),
                    company_website=prospect.get("company_website"),
                    company_size=prospect.get("company_size"),
                    industry=prospect.get("industry"),
                    geography=prospect.get("state") or prospect.get("country"),
                    linkedin_url=prospect.get("linkedin_url"),
                    source="apollo",
                    raw_data=prospect,
                )
                leads.append(lead)

        except ApolloAuthError as e:
            error_msg = str(e)
            log.error("apollo.fetch_leads.auth_error", error=error_msg)
        except ApolloRateLimitError as e:
            error_msg = str(e)
            log.warning("apollo.fetch_leads.rate_limit", error=error_msg)
        except httpx.HTTPError as e:
            error_msg = f"HTTP error: {str(e)}"
            log.error("apollo.fetch_leads.http_error", error=error_msg)
        except Exception as e:
            error_msg = f"Unexpected error: {str(e)}"
            log.error("apollo.fetch_leads.unexpected", error=error_msg)

        estimated_cost = len(leads) * APOLLO_COST_PER_SEARCH

        return ScraperResult(
            leads=leads,
            source="apollo",
            records_fetched=len(leads),
            estimated_cost_usd=estimated_cost,
            error=error_msg,
        )

    async def close(self) -> None:
        await self._client.aclose()
