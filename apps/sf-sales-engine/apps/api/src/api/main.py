from contextlib import asynccontextmanager
from typing import AsyncGenerator

import structlog
from fastapi import FastAPI

from api.routers import discovery, health, leads, leads_search

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

app.include_router(health.router)
app.include_router(discovery.router, prefix="/discovery", tags=["discovery"])
app.include_router(leads.router, prefix="/leads", tags=["leads"])
app.include_router(leads_search.router, prefix="/leads", tags=["leads"])
