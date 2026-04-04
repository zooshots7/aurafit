from __future__ import annotations

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.config import settings
from app.models.db import Base

_db_available = False

try:
    engine = create_async_engine(settings.database_url, echo=False)
    async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
except Exception:
    engine = None
    async_session = None


async def init_db():
    global _db_available
    if engine is None:
        return
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    _db_available = True


def is_db_available() -> bool:
    return _db_available


async def get_db() -> AsyncSession:
    if not _db_available or async_session is None:
        yield None
        return
    async with async_session() as session:
        yield session
