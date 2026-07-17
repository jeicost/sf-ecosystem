import asyncio
import structlog
from typing import Callable, TypeVar, Coroutine

log = structlog.get_logger()

T = TypeVar("T")


async def with_retry(
    fn: Callable[..., Coroutine[None, None, T]],
    retriable_exceptions: tuple[type[Exception], ...],
    max_retries: int = 3,
    base_delay: float = 1.0,
    context: dict | None = None,
) -> T:
    """
    Execute an async function with exponential backoff retry on specific exceptions.

    Args:
        fn: Async function to execute
        retriable_exceptions: Tuple of exception types that trigger retry
        max_retries: Maximum retry attempts (default 3)
        base_delay: Base delay in seconds for exponential backoff (default 1.0)
        context: Dict with logging context (operation name, identifiers, etc.)

    Returns:
        Result of fn() on success

    Raises:
        Last exception if all retries exhausted
    """
    context = context or {}
    last_exception = None

    for attempt in range(max_retries):
        try:
            return await fn()

        except retriable_exceptions as e:
            last_exception = e
            if attempt < max_retries - 1:
                delay = base_delay * (2**attempt)
                log.warning(
                    "retry.attempt",
                    attempt=attempt + 1,
                    max_retries=max_retries,
                    delay_seconds=delay,
                    exception=type(e).__name__,
                    **context,
                )
                await asyncio.sleep(delay)
            else:
                log.error(
                    "retry.exhausted",
                    attempts=max_retries,
                    exception=type(e).__name__,
                    **context,
                )

    raise last_exception
