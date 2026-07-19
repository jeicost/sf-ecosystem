import asyncio
import os
from datetime import datetime
from typing import Any
from uuid import uuid4

import structlog
from notion_sync import NotionSyncClient
from notion_sync.models import NotionLead

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
        except TimeoutError as e:
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


async def _fetch_leads_from_supabase(
    db: AsyncClient,
    lead_ids: list[str],
) -> list[dict]:
    """Fetch lead records from Supabase by IDs."""
    if not lead_ids:
        return []

    log.info("notion_sync.fetching_leads", count=len(lead_ids))

    try:
        result = (
            await db.table("leads")
            .select("*")
            .in_("id", lead_ids)
            .execute()
        )
        log.info("notion_sync.leads_fetched", count=len(result.data))
        return result.data
    except Exception as e:
        log.error("notion_sync.fetch_failed", count=len(lead_ids), error=str(e))
        raise


def _lead_to_notion_model(lead: dict) -> NotionLead:
    """Convert Supabase lead record to NotionLead model."""
    return NotionLead(
        first_name=lead.get("first_name"),
        last_name=lead.get("last_name"),
        title=lead.get("title"),
        email=lead.get("email"),
        company_name=lead.get("company_name"),
        company_website=lead.get("company_website"),
        industry=lead.get("industry"),
        geography=lead.get("geography"),
        stage=lead.get("stage", "prospected"),
        hot_score=lead.get("hot_score", 0),
        source=lead.get("source"),
        notes=lead.get("notes"),
        linkedin_url=lead.get("linkedin_url"),
    )


async def _sync_batch_to_notion(
    notion_client: NotionSyncClient,
    notion_leads: list[NotionLead],
) -> dict:
    """Sync a batch of leads to Notion and return stats."""
    log.info("notion_sync.syncing_batch", count=len(notion_leads))

    result = await notion_client.sync_batch(notion_leads)

    log.info(
        "notion_sync.batch_synced",
        total=result.total,
        created=result.created,
        updated=result.updated,
        errors=result.errors,
    )

    return {
        "total": result.total,
        "created": result.created,
        "updated": result.updated,
        "errors": result.errors,
        "error_details": result.error_details,
    }


async def _record_sync_metadata(
    db: AsyncClient,
    sync_id: str,
    client_id: str,
    lead_ids: list[str],
    start_time: datetime,
    status: str,
    result_stats: dict[str, Any] | None = None,
    error: str | None = None,
) -> None:
    """Record notion sync metadata to Supabase."""
    finish_time = datetime.utcnow()
    duration = int((finish_time - start_time).total_seconds())

    record = {
        "id": sync_id,
        "client_id": client_id,
        "lead_ids": lead_ids,
        "status": status,
        "duration_seconds": duration,
        "started_at": start_time.isoformat(),
        "finished_at": finish_time.isoformat(),
    }

    if result_stats:
        record.update(result_stats)
    if error:
        record["error"] = error

    try:
        # Create custom table for notion sync logs if needed
        # For now, just log to structlog
        log.info("notion_sync.metadata_recorded", sync_id=sync_id, status=status, **record)
    except Exception as e:
        log.error(
            "notion_sync.metadata_failed",
            sync_id=sync_id,
            status=status,
            error=str(e),
        )


async def sync_to_notion(
    ctx: dict,
    client_id: str,
    lead_ids: list[str],
) -> dict:
    """
    Arq job: Sync leads from Supabase → client's Notion CRM.

    Fetches lead records from Supabase, maps them to Notion schema, and syncs
    with retry logic and comprehensive structured logging.

    Only executes if notion_sync.enabled=true in the client's sources.yaml.

    Args:
        ctx: Arq job context (contains request, app, redis)
        client_id: Client UUID (str)
        lead_ids: List of lead UUIDs to sync (str list)

    Returns:
        dict with job status and sync statistics
    """
    sync_id = str(uuid4())
    start_time = datetime.utcnow()

    # Build structured logging context
    log_context = {
        "sync_id": sync_id,
        "client_id": client_id,
        "lead_count": len(lead_ids),
    }

    log.info("notion_sync.job_started", **log_context)

    db: AsyncClient | None = None
    notion_client: NotionSyncClient | None = None

    try:
        # Validate input
        if not lead_ids:
            log.warning("notion_sync.no_leads_provided", **log_context)
            return {
                "status": "skipped",
                "sync_id": sync_id,
                "client_id": client_id,
                "message": "No leads provided for sync",
                "synced": 0,
            }

        # Initialize Supabase client
        db = await _get_supabase_client()

        # Fetch Notion credentials from environment
        # Format: NOTION_API_KEY_<CLIENT_ID> and NOTION_DATABASE_ID_<CLIENT_ID>
        notion_api_key = os.environ.get(f"NOTION_API_KEY_{client_id}")
        notion_db_id = os.environ.get(f"NOTION_DATABASE_ID_{client_id}")

        # Fallback to generic keys if client-specific ones not found
        if not notion_api_key:
            notion_api_key = os.environ.get("NOTION_API_KEY")
        if not notion_db_id:
            notion_db_id = os.environ.get("NOTION_VBS_DATABASE_ID")

        if not notion_api_key or not notion_db_id:
            log.warning(
                "notion_sync.credentials_missing",
                **log_context,
                has_api_key=bool(notion_api_key),
                has_db_id=bool(notion_db_id),
            )
            return {
                "status": "skipped",
                "sync_id": sync_id,
                "client_id": client_id,
                "message": "Notion credentials not configured",
                "synced": 0,
            }

        # Initialize Notion client
        notion_client = NotionSyncClient(notion_api_key, notion_db_id)

        # Fetch leads from Supabase
        async def _fetch_leads() -> list[dict]:
            return await _fetch_leads_from_supabase(db, lead_ids)

        leads = await _exponential_backoff_retry(_fetch_leads)

        if not leads:
            log.warning("notion_sync.no_leads_found", **log_context)
            return {
                "status": "completed",
                "sync_id": sync_id,
                "client_id": client_id,
                "message": "No leads found in Supabase",
                "synced": 0,
            }

        # Map to Notion models
        notion_leads = [_lead_to_notion_model(lead) for lead in leads]
        log.info("notion_sync.mapped_leads", **log_context, mapped=len(notion_leads))

        # Sync to Notion with retry logic
        async def _sync_batch() -> dict:
            return await _sync_batch_to_notion(notion_client, notion_leads)

        result_stats = await _exponential_backoff_retry(_sync_batch)

        log.info(
            "notion_sync.job_completed",
            **log_context,
            **result_stats,
        )

        # Record metadata asynchronously
        if db:
            try:
                await _record_sync_metadata(
                    db,
                    sync_id,
                    client_id,
                    lead_ids,
                    start_time,
                    "completed",
                    result_stats=result_stats,
                )
            except Exception as e:
                log.warning("notion_sync.metadata_recording_failed", **log_context, error=str(e))

        return {
            "status": "completed",
            "sync_id": sync_id,
            "client_id": client_id,
            "synced": result_stats.get("created", 0) + result_stats.get("updated", 0),
            "errors": result_stats.get("errors", 0),
            "message": f"Synced {result_stats.get('created', 0)} new, "
            f"updated {result_stats.get('updated', 0)}, "
            f"errors {result_stats.get('errors', 0)}",
        }

    except TimeoutError:
        error_msg = f"Notion sync timeout after {MAX_RETRIES} attempts"
        log.error(
            "notion_sync.timeout",
            **log_context,
            error=error_msg,
            exc_info=True,
        )
        if db:
            await _record_sync_metadata(
                db,
                sync_id,
                client_id,
                lead_ids,
                start_time,
                "failed",
                error=error_msg,
            )
        return {
            "status": "failed",
            "sync_id": sync_id,
            "client_id": client_id,
            "error": error_msg,
            "synced": 0,
        }

    except Exception as e:
        error_msg = f"Notion sync failed: {str(e)}"
        log.error(
            "notion_sync.failed",
            **log_context,
            error=error_msg,
            exc_info=True,
        )
        if db:
            try:
                await _record_sync_metadata(
                    db,
                    sync_id,
                    client_id,
                    lead_ids,
                    start_time,
                    "failed",
                    error=error_msg,
                )
            except Exception as db_error:
                log.error(
                    "notion_sync.error_recording_failed",
                    **log_context,
                    db_error=str(db_error),
                )
        return {
            "status": "failed",
            "sync_id": sync_id,
            "client_id": client_id,
            "error": error_msg,
            "synced": 0,
        }

    finally:
        # Cleanup resources
        if notion_client:
            try:
                await notion_client.close()
            except Exception as e:
                log.warning("notion_sync.client_close_failed", **log_context, error=str(e))
        if db:
            try:
                await db.aclose()
            except Exception as e:
                log.warning("notion_sync.db_close_failed", **log_context, error=str(e))
