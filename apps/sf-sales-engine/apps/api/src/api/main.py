from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

import structlog
from fastapi import Depends, FastAPI

from api.deps import require_api_key
from api.routers import discovery, health, icebreaker, leads, leads_search, outreach, webhooks

log = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    log.info("sf_sales_engine.api.startup")
    yield
    log.info("sf_sales_engine.api.shutdown")


app = FastAPI(
    title="SF Sales Engine API",
    version="0.1.0",
    lifespan=lifespan,
)

# Health is public; webhooks validate their own X-Webhook-Secret; every other
# router requires X-API-Key (see require_api_key — fail-closed in production).
_auth = [Depends(require_api_key)]

app.include_router(health.router)
app.include_router(discovery.router, prefix="/discovery", tags=["discovery"], dependencies=_auth)
app.include_router(leads.router, prefix="/leads", tags=["leads"], dependencies=_auth)
app.include_router(leads_search.router, prefix="/leads", tags=["leads"], dependencies=_auth)
app.include_router(icebreaker.router, prefix="/icebreaker", tags=["icebreaker"], dependencies=_auth)
app.include_router(outreach.router, prefix="/outreach", tags=["outreach"], dependencies=_auth)
app.include_router(webhooks.router, prefix="/webhooks", tags=["webhooks"])
