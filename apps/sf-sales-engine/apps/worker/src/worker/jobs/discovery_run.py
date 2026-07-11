import asyncio
import os
from datetime import datetime
from typing import Any
from uuid import UUID, uuid4

import anthropic
import httpx
import structlog
from supabase import AsyncClient, create_async_client

log = structlog.get_logger()

# Retry configuration
MAX_RETRIES = 3
INITIAL_BACKOFF = 1.0  # seconds
MAX_BACKOFF = 30.0  # seconds


async def _get_supabase_client() -> AsyncClient:
    """Create a Supabase client from environment variables."""
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_SERVICE_KEY")
    if not supabase_url or not supabase_key:
        raise ValueError("SUPABASE_URL or SUPABASE_SERVICE_KEY not configured")
    return await create_async_client(supabase_url, supabase_key)


async def _exponential_backoff_retry(
    func: Any,
    *args: Any,
    **kwargs: Any,
) -> Any:
    """Execute function with exponential backoff retry logic."""
    backoff = INITIAL_BACKOFF
    last_error: Exception | None = None

    for attempt in range(MAX_RETRIES):
        try:
            return await func(*args, **kwargs)
        except asyncio.TimeoutError as e:
            last_error = e
            if attempt < MAX_RETRIES - 1:
                log.warning(
                    "exponential_backoff.timeout",
                    attempt=attempt + 1,
                    max_retries=MAX_RETRIES,
                    backoff_seconds=backoff,
                )
                await asyncio.sleep(backoff)
                backoff = min(backoff * 2, MAX_BACKOFF)
            continue
        except httpx.RequestError as e:
            last_error = e
            if attempt < MAX_RETRIES - 1:
                log.warning(
                    "exponential_backoff.request_error",
                    attempt=attempt + 1,
                    max_retries=MAX_RETRIES,
                    backoff_seconds=backoff,
                    error=str(e),
                )
                await asyncio.sleep(backoff)
                backoff = min(backoff * 2, MAX_BACKOFF)
            continue
        except Exception as e:
            last_error = e
            if attempt < MAX_RETRIES - 1:
                log.warning(
                    "exponential_backoff.error",
                    attempt=attempt + 1,
                    max_retries=MAX_RETRIES,
                    error_type=type(e).__name__,
                    error=str(e),
                )
                await asyncio.sleep(backoff)
                backoff = min(backoff * 2, MAX_BACKOFF)
            continue

    if last_error:
        raise last_error
    raise RuntimeError("Unexpected error in exponential backoff retry")


async def _record_run_metadata(
    db: AsyncClient,
    run_id: str,
    client_id: str,
    icp_id: str,
    start_time: datetime,
    status: str,
    metadata: dict[str, Any] | None = None,
    error: str | None = None,
) -> None:
    """Record discovery run metadata to Supabase."""
    finish_time = datetime.utcnow()
    duration = int((finish_time - start_time).total_seconds())

    record = {
        "id": run_id,
        "client_id": client_id,
        "icp_id": icp_id,
        "status": status,
        "duration_seconds": duration,
        "started_at": start_time.isoformat(),
        "finished_at": finish_time.isoformat(),
    }

    if metadata:
        record.update(metadata)
    if error:
        record["error"] = error

    try:
        await db.table("discovery_runs").upsert([record], ignore_duplicates=False).execute()
        log.info("discovery_run.metadata_recorded", run_id=run_id, status=status)
    except Exception as e:
        log.error(
            "discovery_run.metadata_failed",
            run_id=run_id,
            status=status,
            error=str(e),
        )


async def run_discovery(ctx: dict, client_id: str, icp_id: str, geo_filter: str | None = None) -> dict:
    """
    Arq job: Execute full discovery pipeline.

    Calls the API discovery endpoint asynchronously with retry logic and comprehensive logging.
    Phase: scrape → enrich → score → upsert to Supabase → sync to Notion.

    Args:
        ctx: Arq job context (contains request, app, redis)
        client_id: Client UUID (str)
        icp_id: ICP profile UUID (str)
        geo_filter: Optional geography filter (e.g., "España", "LATAM")

    Returns:
        dict with job status, run_id, and summary statistics
    """
    run_id = str(uuid4())
    start_time = datetime.utcnow()

    # Build structured logging context
    log_context = {
        "run_id": run_id,
        "client_id": client_id,
        "icp_id": icp_id,
        "geo_filter": geo_filter or "all",
    }

    log.info("discovery_run.job_started", **log_context)

    db: AsyncClient | None = None
    try:
        # Initialize Supabase client
        db = await _get_supabase_client()

        # Call the API endpoint to run discovery
        api_url = os.environ.get("SF_SALES_API_URL", "http://localhost:8000")
        discovery_endpoint = f"{api_url}/discovery/run"

        payload = {
            "client_id": client_id,
            "icp_id": icp_id,
            "geo_filter": geo_filter,
        }

        # Async HTTP request with retry logic
        async def _call_discovery_endpoint() -> dict:
            async with httpx.AsyncClient(timeout=600) as client:  # 10 min timeout
                log.info(
                    "discovery_run.calling_endpoint",
                    **log_context,
                    endpoint=discovery_endpoint,
                )
                response = await client.post(discovery_endpoint, json=payload)
                response.raise_for_status()
                return response.json()

        # Execute with exponential backoff
        api_response = await _exponential_backoff_retry(_call_discovery_endpoint)

        log.info(
            "discovery_run.api_response",
            **log_context,
            status=api_response.get("status"),
            message=api_response.get("message"),
        )

        # Extract response data
        response_status = api_response.get("status", "completed")
        run_id_from_api = api_response.get("run_id", run_id)

        # Build success response
        result = {
            "status": response_status,
            "run_id": run_id_from_api,
            "client_id": client_id,
            "icp_id": icp_id,
            "message": api_response.get("message", "Discovery run completed"),
        }

        log.info("discovery_run.job_completed", **log_context, **result)

        # Record metadata asynchronously
        if db:
            try:
                metadata = {
                    "status": response_status,
                    "leads_found": api_response.get("leads_found", 0),
                    "hot_count": api_response.get("hot_count", 0),
                    "warm_count": api_response.get("warm_count", 0),
                }
                await _record_run_metadata(
                    db,
                    run_id_from_api,
                    client_id,
                    icp_id,
                    start_time,
                    response_status,
                    metadata=metadata,
                )
            except Exception as e:
                log.warning("discovery_run.metadata_recording_failed", **log_context, error=str(e))

        return result

    except asyncio.TimeoutError as e:
        error_msg = f"Discovery run timeout after {MAX_RETRIES} attempts"
        log.error(
            "discovery_run.timeout",
            **log_context,
            error=error_msg,
            exc_info=True,
        )
        if db:
            await _record_run_metadata(
                db,
                run_id,
                client_id,
                icp_id,
                start_time,
                "failed",
                error=error_msg,
            )
        return {
            "status": "failed",
            "run_id": run_id,
            "client_id": client_id,
            "error": error_msg,
        }

    except httpx.RequestError as e:
        error_msg = f"HTTP request failed: {str(e)}"
        log.error(
            "discovery_run.request_error",
            **log_context,
            error=error_msg,
            exc_info=True,
        )
        if db:
            await _record_run_metadata(
                db,
                run_id,
                client_id,
                icp_id,
                start_time,
                "failed",
                error=error_msg,
            )
        return {
            "status": "failed",
            "run_id": run_id,
            "client_id": client_id,
            "error": error_msg,
        }

    except Exception as e:
        error_msg = f"Discovery run failed: {str(e)}"
        log.error(
            "discovery_run.failed",
            **log_context,
            error=error_msg,
            exc_info=True,
        )
        if db:
            try:
                await _record_run_metadata(
                    db,
                    run_id,
                    client_id,
                    icp_id,
                    start_time,
                    "failed",
                    error=error_msg,
                )
            except Exception as db_error:
                log.error(
                    "discovery_run.error_recording_failed",
                    **log_context,
                    db_error=str(db_error),
                )
        return {
            "status": "failed",
            "run_id": run_id,
            "client_id": client_id,
            "error": error_msg,
        }

    finally:
        # Cleanup database connection
        if db:
            try:
                await db.aclose()
            except Exception as e:
                log.warning("discovery_run.db_close_failed", **log_context, error=str(e))
