"""Lead search via Apollo with enrichment, caching, and cost tracking."""
from pathlib import Path
from typing import Any
from uuid import UUID

import structlog
import yaml
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from supabase import AsyncClient

from api.deps import get_supabase, get_settings
from enrichment.core import EnrichmentEngine
from enrichment import cache
from scrapers.apollo import ApolloScraper
from scrapers.hunter import HunterScraper
from scrapers.models import RawLead

log = structlog.get_logger()
router = APIRouter()


def get_client_root() -> Path:
    """Get root path to clients directory."""
    return Path(__file__).resolve().parent.parent.parent.parent / "clients"


def load_client_sources(client_slug: str) -> dict:
    """Load sources.yaml for a client to get API limits and settings."""
    root = get_client_root()
    sources_path = root / client_slug / "sources.yaml"
    if not sources_path.exists():
        log.warning("sources_yaml_not_found", client_slug=client_slug)
        return {}
    with open(sources_path) as f:
        return yaml.safe_load(f) or {}


def get_client_slug_from_db(client_id: UUID, db: AsyncClient) -> str:
    """Fetch client_slug from Supabase by client_id (for later enhancement)."""
    # For now, assuming client_id is known or passed separately
    # TODO: query Supabase to map client_id → client_slug
    return "sf-internal"  # hardcoded for MVP


class LeadSearchRequest(BaseModel):
    """Request to search for leads by ICP criteria."""
    client_id: UUID
    industries: list[str] | None = None
    job_titles: list[str] | None = None
    company_sizes: list[str] | None = None
    geographies: list[str] | None = None
    company_domain: str | None = None
    limit: int = 25


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


async def get_apollo_scraper(settings=Depends(get_settings)) -> ApolloScraper:
    """Get configured Apollo scraper."""
    api_key = os.getenv("APOLLO_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="Apollo API key not configured")
    return ApolloScraper(api_key)


async def get_hunter_scraper(settings=Depends(get_settings)) -> HunterScraper:
    """Get configured Hunter scraper."""
    api_key = os.getenv("HUNTER_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="Hunter API key not configured")
    return HunterScraper(api_key)


@router.post("/search", response_model=LeadSearchResponse)
async def search_leads(
    payload: LeadSearchRequest,
    db: AsyncClient = Depends(get_supabase),
    apollo: ApolloScraper = Depends(get_apollo_scraper),
    hunter: HunterScraper = Depends(get_hunter_scraper),
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

    Response includes:
    - leads: enriched lead records
    - cost_usd: API cost of this search
    - monthly_spend_usd: client's total spend this month
    - monthly_limit_usd: client's configured limit
    - hits_limit: true if approaching/at limit

    Rate limit: check monthly_limit_usd before calling this endpoint.
    """
    if payload.limit > 100:
        payload.limit = 100

    client_id = payload.client_id
    log.info("leads_search.start", client_id=str(client_id), limit=payload.limit)

    try:
        # Load client configuration
        client_slug = get_client_slug_from_db(client_id, db)
        sources = load_client_sources(client_slug)
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
