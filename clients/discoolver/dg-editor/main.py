from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings

# ── v1 routers (legacy JSON storage) ──────────────────────────────────────────
from app.api import guides, sections, recomendados, history, export, chat

# ── v2 routers (PostgreSQL) ───────────────────────────────────────────────────
from app.api.v2 import auth as auth_v2
from app.api.v2 import guides as guides_v2
from app.api.v2 import items as items_v2
from app.api.v2 import media as media_v2
from app.api.v2 import import_excel
from app.api.v2 import editorial_ai
from app.api.v2 import export as export_v2
from app.api.v2 import sections as sections_v2
from app.api.v2 import bulk_photos
from app.api.v2 import cms_bridge
from app.api.v2 import instagram as instagram_v2
from app.api.v2 import influencer as influencer_v2

# ── v3 routers (Updated guides) ────────────────────────────────────────────────
from app.api.v3 import guides as guides_v3
from app.api.v3 import items as items_v3
from app.api.v3 import media as media_v3
from app.api.v3 import export as export_v3
from app.api.v3 import sections as sections_v3
from app.middleware.rate_limit import RateLimitMiddleware


@asynccontextmanager
async def lifespan(app: FastAPI):
    env = settings.environment
    print(f"[startup] Guías Discoolver v3.0 · env={env}")

    # ── DB tables (dev auto-create, production uses alembic upgrade head) ──────
    if env == "development":
        try:
            from app.db.database import engine, AsyncSessionLocal
            from app.db.models import Base, UserRow
            from sqlalchemy import select
            from passlib.context import CryptContext
            _pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")

            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
            print("[startup] DB tables OK (dev auto-create)")

            # Seed default editor/admin users if they don't exist
            _seed_users = [
                ("editor@discoolver.com", "Editor Discoolver", "discoolver2026", "editor"),
                ("admin@discoolver.com",  "Admin Discoolver",  "admin2026",       "admin"),
            ]
            async with AsyncSessionLocal() as session:
                for email, name, password, role in _seed_users:
                    result = await session.execute(select(UserRow).where(UserRow.email == email))
                    if not result.scalar_one_or_none():
                        session.add(UserRow(
                            email=email,
                            name=name,
                            hashed_password=_pwd.hash(password),
                            role=role,
                            status="active",
                        ))
                        print(f"[startup] Seeded user: {email} ({role})")
                await session.commit()

        except Exception as e:
            print(f"[startup] WARNING: DB init skipped — {e}")
            print("[startup] → Set DATABASE_URL in .env and run: alembic upgrade head")

    # ── Excel template ─────────────────────────────────────────────────────────
    from pathlib import Path
    template_path = Path("static/discoolver-guide-template.xlsx")
    if not template_path.exists():
        try:
            from app.services.excel_template import build_template
            build_template(template_path)
            print(f"[startup] Excel template generated → {template_path}")
        except Exception as e:
            print(f"[startup] WARNING: Excel template not generated — {e}")
            print("[startup] → Run manually: python -m app.services.excel_template")
    else:
        print(f"[startup] Excel template OK → {template_path}")

    # ── Playwright check (non-blocking) ───────────────────────────────────────
    import importlib.util
    if importlib.util.find_spec("playwright") is not None:
        print("[startup] Playwright OK (PDF rendering available)")
    else:
        print("[startup] WARNING: Playwright not installed — PDF will use WeasyPrint fallback")
        print("[startup] → pip install playwright && playwright install chromium --with-deps")

    # ── CORS check ─────────────────────────────────────────────────────────────
    if settings.cors_origins == "*" and env == "production":
        print("[startup] WARNING: CORS_ORIGINS=* in production — set it to your domain")

    print(f"[startup] CORS origins: {settings.cors_origins_list}")
    print(f"[startup] AI rate limit: {settings.ai_rate_limit} calls/{settings.ai_rate_window}s")
    print("[startup] Ready ✓")

    yield


app = FastAPI(
    title="Guías Discoolver",
    description="Editor de guías de viaje Discoolver — API v2/v3",
    version="3.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(
    RateLimitMiddleware,
    limit=settings.ai_rate_limit,
    window=settings.ai_rate_window,
)

# ── v1 routes (legacy) ────────────────────────────────────────────────────────
app.include_router(guides.router,       prefix="/api/v1")
app.include_router(sections.router,     prefix="/api/v1")
app.include_router(recomendados.router, prefix="/api/v1")
app.include_router(history.router,      prefix="/api/v1")
app.include_router(export.router,       prefix="/api/v1")
app.include_router(chat.router,         prefix="/api/v1")

# ── v2 routes (PostgreSQL) ────────────────────────────────────────────────────
app.include_router(auth_v2.router,      prefix="/api")
app.include_router(guides_v2.router,    prefix="/api")
app.include_router(items_v2.router,     prefix="/api")
app.include_router(media_v2.router,     prefix="/api")
app.include_router(import_excel.router, prefix="/api")
app.include_router(editorial_ai.router, prefix="/api")
app.include_router(export_v2.router,    prefix="/api")
app.include_router(sections_v2.router,  prefix="/api")
app.include_router(bulk_photos.router,  prefix="/api")
app.include_router(cms_bridge.router,    prefix="/api")
app.include_router(instagram_v2.router,  prefix="/api")
app.include_router(influencer_v2.router, prefix="/api")

# ── v3 routes (Updated guides) ────────────────────────────────────────────────
app.include_router(guides_v3.router,    prefix="/api")
app.include_router(items_v3.router,     prefix="/api")
app.include_router(media_v3.router,     prefix="/api")
app.include_router(export_v3.router,    prefix="/api")
app.include_router(sections_v3.router,  prefix="/api")

# ── Static files ──────────────────────────────────────────────────────────────
settings.exports_dir.mkdir(parents=True, exist_ok=True)
settings.static_dir.mkdir(parents=True, exist_ok=True)

app.mount("/exports", StaticFiles(directory=settings.exports_dir), name="exports")
app.mount("/static",  StaticFiles(directory=settings.static_dir),  name="static")
app.mount("/design",  StaticFiles(directory="design", html=True),   name="design")

# design-studio compiled output — served at /studio in production (Docker)
# In dev the dist/ folder won't exist unless you run npm run build inside design-studio/
_studio_dist = Path("design-studio/dist")
if _studio_dist.exists():
    app.mount("/studio", StaticFiles(directory=str(_studio_dist), html=True), name="studio")


# ── UI routes ─────────────────────────────────────────────────────────────────
@app.get("/health", tags=["ops"])
async def health():
    """Health check for DigitalOcean App Platform."""
    from datetime import datetime
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat(), "version": "3.0.0"}


@app.get("/", include_in_schema=False)
@app.get("/login", include_in_schema=False)
async def serve_login():
    return FileResponse("ui/login.html")


@app.get("/editor", include_in_schema=False)
@app.get("/editor/{path:path}", include_in_schema=False)
async def serve_editor(path: str = ""):
    """SPA handler: sirve el archivo real si existe, si no index.html (client-side routing)."""
    from pathlib import Path
    dist = Path("editor/dist")
    # Serve the actual asset file if it exists (JS, CSS, images, etc.)
    if path:
        asset = dist / path
        if asset.is_file():
            return FileResponse(asset)
    # Fall back to index.html for all client-side routes
    index = dist / "index.html"
    if index.exists():
        return FileResponse(index)
    return FileResponse("ui/index.html")


@app.get("/portal", include_in_schema=False)
async def serve_portal():
    return FileResponse("ui/portal.html")


@app.get("/influencers", include_in_schema=False)
async def serve_influencers():
    return FileResponse("ui/influencers.html")


@app.get("/viewer/{guide_id}", include_in_schema=False)
async def serve_reader(guide_id: str):
    return FileResponse("ui/reader.html")
