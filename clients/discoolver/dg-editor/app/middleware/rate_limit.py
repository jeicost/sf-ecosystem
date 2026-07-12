"""
Simple in-memory rate limiter for the AI editorial endpoint.
Sufficient for internal team use (no Redis needed).
Limits: 20 AI calls / 60s per IP.
"""
import time
from collections import defaultdict, deque

from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

# Protected path prefixes and their limits: (max_calls, window_seconds)
RATE_RULES: list[tuple[str, int, int]] = [
    ("/api/v2/guides/", 20, 60),   # AI generate — but only for the /ai/ sub-path
]

# Tracked specifically:
AI_PATH_SUFFIX = "/ai/generate"


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, limit: int = 20, window: int = 60):
        super().__init__(app)
        self.limit  = limit
        self.window = window
        self._buckets: dict[str, deque] = defaultdict(deque)

    def _get_ip(self, request: Request) -> str:
        # Respect X-Forwarded-For from DO load balancer
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()
        return request.client.host if request.client else "unknown"

    async def dispatch(self, request: Request, call_next):
        # Only rate-limit AI generation endpoints
        if not request.url.path.endswith(AI_PATH_SUFFIX):
            return await call_next(request)

        ip  = self._get_ip(request)
        now = time.monotonic()
        q   = self._buckets[ip]

        # Remove expired timestamps
        while q and now - q[0] > self.window:
            q.popleft()

        if len(q) >= self.limit:
            retry_after = int(self.window - (now - q[0])) + 1
            return JSONResponse(
                status_code=429,
                content={
                    "detail": f"Demasiadas peticiones. Espera {retry_after}s antes de volver a generar.",
                    "retry_after": retry_after,
                },
                headers={"Retry-After": str(retry_after)},
            )

        q.append(now)
        return await call_next(request)
