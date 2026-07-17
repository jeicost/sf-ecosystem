"""Cache and usage tracking for enrichment API calls."""
import structlog
from datetime import datetime, timedelta
from typing import Any
from supabase import AsyncClient

log = structlog.get_logger()


async def get_cached(db: AsyncClient, domain: str) -> dict | None:
    """
    Retrieve cached lead data from lead_cache table.

    Args:
        db: Supabase async client
        domain: Company domain to look up

    Returns:
        Cached lead data if exists and not expired, None otherwise
    """
    try:
        # Query lead_cache for domain, checking expiry
        response = await db.table("lead_cache").select("*").eq("domain", domain).execute()

        if not response.data or len(response.data) == 0:
            log.debug("cache.miss", domain=domain)
            return None

        cache_entry = response.data[0]
        expires_at = cache_entry.get("expires_at")

        # Check if expired
        if expires_at:
            expires_dt = datetime.fromisoformat(expires_at)
            if expires_dt < datetime.utcnow():
                log.debug("cache.expired", domain=domain, expired_at=expires_at)
                return None

        log.info("cache.hit", domain=domain)
        return cache_entry.get("raw_data", {})

    except Exception as e:
        log.warning("cache.get_error", domain=domain, error=str(e))
        return None


async def set_cached(
    db: AsyncClient,
    domain: str,
    raw_data: dict,
    sources: list[str] | None = None,
    ttl_days: int = 7,
) -> bool:
    """
    Cache lead data in lead_cache table.

    Args:
        db: Supabase async client
        domain: Company domain
        raw_data: Raw API response to cache
        sources: List of sources that contributed to this cache (e.g., ["apollo", "hunter"])
        ttl_days: Time to live in days (default 7)

    Returns:
        True if successful, False otherwise
    """
    try:
        expires_at = (datetime.utcnow() + timedelta(days=ttl_days)).isoformat()

        data = {
            "domain": domain,
            "raw_data": raw_data,
            "sources": sources or [],
            "expires_at": expires_at,
        }

        # Upsert (insert or update if exists)
        response = await db.table("lead_cache").upsert(data, on_conflict="domain").execute()

        log.info("cache.set", domain=domain, ttl_days=ttl_days, sources=sources)
        return True

    except Exception as e:
        log.warning("cache.set_error", domain=domain, error=str(e))
        return False


async def log_usage(
    db: AsyncClient,
    client_id: str,
    source: str,
    records_fetched: int,
    api_cost_usd: float,
    run_id: str | None = None,
) -> bool:
    """
    Log API usage and cost to usage_log table.

    Args:
        db: Supabase async client
        client_id: UUID of the client
        source: Source name (e.g., "apollo", "hunter", "tavily")
        records_fetched: Number of records returned
        api_cost_usd: Estimated cost in USD
        run_id: Optional discovery run ID for correlation

    Returns:
        True if successful, False otherwise
    """
    try:
        data = {
            "client_id": client_id,
            "source": source,
            "records_fetched": records_fetched,
            "api_cost_usd": api_cost_usd,
            "run_id": run_id,
        }

        await db.table("usage_log").insert(data).execute()

        log.info(
            "usage.logged",
            client_id=client_id,
            source=source,
            records=records_fetched,
            cost_usd=api_cost_usd,
        )
        return True

    except Exception as e:
        log.warning("usage.log_error", client_id=client_id, source=source, error=str(e))
        return False


async def get_monthly_spend(db: AsyncClient, client_id: str) -> float:
    """
    Get total API spend for current month (UTC).

    Args:
        db: Supabase async client
        client_id: UUID of the client

    Returns:
        Total spend in USD for current calendar month
    """
    try:
        now = datetime.utcnow()
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        response = await (
            db.table("usage_log")
            .select("api_cost_usd")
            .eq("client_id", client_id)
            .gte("created_at", month_start.isoformat())
            .execute()
        )

        if not response.data:
            return 0.0

        total = sum(row.get("api_cost_usd", 0.0) for row in response.data)
        log.info("usage.monthly_spend", client_id=client_id, total_usd=total)
        return total

    except Exception as e:
        log.warning("usage.spend_query_error", client_id=client_id, error=str(e))
        return 0.0


async def check_monthly_limit(
    db: AsyncClient,
    client_id: str,
    monthly_limit_usd: float,
) -> tuple[bool, float]:
    """
    Check if client has exceeded monthly API spend limit.

    Args:
        db: Supabase async client
        client_id: UUID of the client
        monthly_limit_usd: Maximum spend allowed per month

    Returns:
        Tuple of (allowed: bool, current_spend: float)
        - allowed = True if under limit, False if exceeded
        - current_spend = total USD spent this month
    """
    current_spend = await get_monthly_spend(db, client_id)
    allowed = current_spend < monthly_limit_usd

    if not allowed:
        log.warning(
            "usage.limit_exceeded",
            client_id=client_id,
            current_usd=current_spend,
            limit_usd=monthly_limit_usd,
        )

    return allowed, current_spend
