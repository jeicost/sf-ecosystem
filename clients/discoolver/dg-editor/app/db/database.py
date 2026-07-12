from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from app.config import settings


def _make_engine():
    url = settings.database_url
    is_sqlite = url.startswith("sqlite")

    kwargs = {"echo": settings.environment == "development"}

    if not is_sqlite:
        # PostgreSQL — connection pool settings
        kwargs.update(pool_pre_ping=True, pool_size=10, max_overflow=20)

    return create_async_engine(url, **kwargs)


engine = _make_engine()

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
