import os

import structlog
from arq.connections import RedisSettings

from worker.jobs.discovery_run import run_discovery
from worker.jobs.notion_sync import sync_to_notion

log = structlog.get_logger()


class WorkerSettings:
    """Arq worker configuration with Redis connection and job settings."""

    # Job functions registered with the worker
    functions = [run_discovery, sync_to_notion]

    # Redis connection configuration
    # Load from environment variable or use default
    redis_url = os.environ.get("REDIS_URL", "redis://localhost:6379")
    redis_settings = RedisSettings.from_dsn(redis_url)

    # Job execution configuration
    job_timeout = 600  # 10 minutes max per job
    max_jobs = 10  # Max concurrent jobs
    max_tries = 3  # Retry failed jobs up to 3 times

    # Job result retention
    result_ttl = 3600  # Keep job results for 1 hour

    # Logging configuration
    log_health_checks = False  # Reduce log noise from health checks


def startup() -> None:
    """Called when the worker starts."""
    log.info(
        "worker.startup",
        redis_url=WorkerSettings.redis_url,
        job_timeout=WorkerSettings.job_timeout,
        max_jobs=WorkerSettings.max_jobs,
        max_tries=WorkerSettings.max_tries,
    )


def shutdown() -> None:
    """Called when the worker shuts down."""
    log.info("worker.shutdown")
