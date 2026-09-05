"""
Async Database Session & Engine Configuration (SQLite).
CBS3002 Information Security Project - Kaviselvaram & Aniesh S
"""

import os
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
from app.core.config import settings

# Ensure data directory exists
os.makedirs("./data", exist_ok=True)

engine = create_async_engine(
    settings.DB_URL,
    echo=False,
    future=True
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)

Base = declarative_base()


async def get_db():
    """Dependency that provides an async database session per request."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db():
    """Initializes SQLite database tables."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
