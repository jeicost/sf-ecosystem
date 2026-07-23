"""Lead search via Apollo with enrichment, caching, and cost tracking."""
from uuid import UUID

import structlog
import yaml
from enrichment import cache
from enrichment.core import EnrichmentEngine
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from scrapers.apollo import ApolloScraper
from scrapers.hunter import HunterScraper
from scrapers.models import RawLead

from api.client_registry import CLIENTS_ROOT, resolve_client_slug
from api.deps import get_supabase
from supabase import AsyncClient

log = structlog.get_logger()
router = APIRouter()


def load_client_sources(client_slug: str) -> dict:
    """Load sources.yaml for a client to get API limits and settings."""
    sources_path = CLIENTS_ROOT / client_slug / "sources.yaml"
    if not sources_path.exists():
        log.warning("sources_yaml_not_found", client_slug=client_slug)
        return {}
    with open(sources_path) as f:
        return yaml.safe_load(f) or {}


class LeadSearchRequest(BaseModel):
    """Request to search for leads by ICP criteria."""
    client_id: UUID
    industries: list[str] | None = None
    job_titles: list[str] | None = None
    company_sizes: list[str] | None = None
    geographies: list[str] | None = None
    company_domain: str | None = None
    limit: int = 25
    # Apollo/Hunter keys are per-client (each client connects and pays for
    # their own account, see tool_connections in MIRA) -- callers that omit
    # these (e.g. sf-internal's own scripts) fall back to APOLLO_API_KEY /
    # HUNTER_API_KEY env vars.
    apollo_api_key: str | None = None
    hunter_api_key: str | None = None


class LeadSearchResult(BaseModel):
    """Single lead result from search."""
    first_name: str | None
    last_name: str | None
    email: str | None
    email_verified: bool = False
    title: str | None
    company_name: str | None
    company_website: str | None
    company_size: str | None
    industry: str | None
    geography: str | None
    linkedin_url: str | None


class LeadSearchResponse(BaseModel):
    """Response from lead search endpoint."""
    leads: list[LeadSearchResult]
    total: int
    cost_usd: float
    monthly_spend_usd: float
    monthly_limit_usd: float
    hits_limit: bool


def get_apollo_scraper(api_key: str | None) -> ApolloScraper:
    """Get an Apollo scraper for the given key, preferring the client's own key
    (passed per-request) over the shared APOLLO_API_KEY env var (sf-internal only)."""
    resolved_key = api_key or os.getenv("APOLLO_API_KEY")
    if not resolved_key:
        raise HTTPException(status_code=400, detail="apollo_key_missing")
    return ApolloScraper(resolved_key)


def get_hunter_scraper(api_key: str | None) -> HunterScraper:
    """Get a Hunter scraper for the given key, preferring the client's own key
    (passed per-request) over the shared HUNTER_API_KEY env var (sf-internal only)."""
    resolved_key = api_key or os.getenv("HUNTER_API_KEY")
    if not resolved_key:
        raise HTTPException(status_code=400, detail="hunter_key_missing")
    return HunterScraper(resolved_key)


@router.post("/search", response_model=LeadSearchResponse)
async def search_leads(
    payload: LeadSearchRequest,
    db: AsyncClient = Depends(get_supabase),
) -> LeadSearchResponse:
    """
    Search for leads matching ICP criteria via Apollo, enrich with Hunter, apply caching.

    Query parameters:
    - client_id: UUID of the client (for cost tracking)
    - industries: override ICP industries filter
    - job_titles: override ICP job titles
    - geographies: override ICP geographies
    - company_sizes: override ICP company sizes
    - company_domain: if provided, search specific company instead of ICP criteria
    - limit: max results (default 25, max 100)
    - apollo_api_key / hunter_api_key: the client's own connected keys; falls
      back to the shared env vars only when omitted (sf-internal's scripts)

    Response includes:
    - leads: enriched lead records
    - cost_usd: API cost of this search
    - monthly_spend_usd: client's total spend this month
    - monthly_limit_usd: client's configured limit
    - hits_limit: true if approaching/at limit

    Rate limit: check monthly_limit_usd before calling this endpoint.
    """
    apollo = get_apollo_scraper(payload.apollo_api_key)
    hunter = get_hunter_scraper(payload.hunter_api_key)

    if payload.limit > 100:
        payload.limit = 100

    client_id = payload.client_id
    log.info("leads_search.start", client_id=str(client_id), limit=payload.limit)

    try:
        # Load client configuration -- client_slug is None for clients that only
        # exist in Supabase (MIRA/sf-crm), which is normal; they always send
        # explicit industries/geographies/company_sizes in the payload instead.
        client_slug = resolve_client_slug(client_id)
        sources = load_client_sources(client_slug) if client_slug else {}
        apollo_config = sources.get("apollo", {})
        monthly_limit = apollo_config.get("monthly_lead_limit", 500) * 0.015  # convert lead count to USD

        # Check monthly spend limit
        allowed, current_spend = await cache.check_monthly_limit(db, str(client_id), monthly_limit)
        if not allowed:
            log.warning(
                "leads_search.limit_exceeded",
                client_id=str(client_id),
                current_usd=current_spend,
                limit_usd=monthly_limit,
            )
            raise HTTPException(
                status_code=402,
                detail=f"Monthly API limit exceeded: ${current_spend:.2f} / ${monthly_limit:.2f}",
            )

        # Build search criteria (use overrides if provided, else use config)
        industries = payload.industries or apollo_config.get("filters", {}).get("industries", [])
        job_titles = payload.job_titles or apollo_config.get("filters", {}).get("job_titles", [])
        geographies = payload.geographies or apollo_config.get("filters", {}).get("geographies", [])
        company_sizes = payload.company_sizes or apollo_config.get("filters", {}).get("company_sizes", [])

        log.info(
            "leads_search.criteria",
            client_id=str(client_id),
            industries=industries,
            job_titles=job_titles,
        )

        # If company_domain provided, use single-domain search
        if payload.company_domain:
            log.info("leads_search.domain_search", domain=payload.company_domain)
            results = await apollo.search(payload.company_domain, limit=payload.limit)
            raw_leads = [
                RawLead(
                    first_name=r.get("first_name"),
                    last_name=r.get("last_name"),
                    email=r.get("email"),
                    title=r.get("title"),
                    company_name=r.get("company_name"),
                    company_website=payload.company_domain,
                    company_size=None,
                    industry=None,
                    geography=None,
                    linkedin_url=r.get("linkedin_url"),
                    source="apollo_domain_search",
                    raw_data=r,
                )
                for r in results
            ]
        else:
            # Use ICP-based search via fetch_leads
            log.info("leads_search.icp_search", industries=industries[:3], job_titles=job_titles[:3])
            result = await apollo.fetch_leads(
                job_titles=job_titles,
                industries=industries,
                geographies=geographies,
                company_sizes=company_sizes,
                limit=payload.limit,
            )
            raw_leads = result.leads
            search_cost = result.estimated_cost_usd
            log.info("leads_search.apollo_result", count=len(raw_leads), cost_usd=search_cost)

        # Enrich via EnrichmentEngine with cache + Hunter
        engine = EnrichmentEngine(
            scrapers={
                "apollo": apollo,
                "hunter": hunter,
                "tavily": None,
                "apify": None,
            },
            db=db,
            client_id=str(client_id),
        )

        enriched_leads, costs = await engine.enrich_batch(raw_leads)

        # Convert to response model
        lead_results = [
            LeadSearchResult(
                first_name=el.first_name,
                last_name=el.last_name,
                email=el.email,
                email_verified=el.email_verified,
                title=el.title,
                company_name=el.company_name,
                company_website=el.company_website,
                company_size=el.company_size,
                industry=el.industry,
                geography=el.geography,
                linkedin_url=el.linkedin_url,
            )
            for el in enriched_leads
        ]

        # Calculate totals
        total_cost = sum(costs.values())
        updated_spend = current_spend + total_cost
        hits_limit = updated_spend >= monthly_limit * 0.9  # warn at 90%

        log.info(
            "leads_search.complete",
            client_id=str(client_id),
            leads_count=len(lead_results),
            cost_usd=total_cost,
            monthly_spend_usd=updated_spend,
            monthly_limit_usd=monthly_limit,
        )

        return LeadSearchResponse(
            leads=lead_results,
            total=len(lead_results),
            cost_usd=total_cost,
            monthly_spend_usd=updated_spend,
            monthly_limit_usd=monthly_limit,
            hits_limit=hits_limit,
        )

    except HTTPException:
        raise
    except Exception as e:
        log.error("leads_search.error", client_id=str(client_id), error=str(e))
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")
    finally:
        await apollo.close()
        await hunter.close()


import os  # import at end to avoid circular deps
