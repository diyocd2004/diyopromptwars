"""Database connection and session management for Cartograph.
Supports both PostgreSQL (with pgvector on Cloud SQL / AlloyDB) and SQLite fallback for local development.
"""

import os
import logging
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import create_engine, text
from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

# Determine database URL
db_url = settings.DATABASE_URL
sync_db_url = settings.DATABASE_SYNC_URL

# Auto-detect SQLite or PostgreSQL
IS_SQLITE = "sqlite" in db_url.lower()

def create_engines(database_url: str):
    is_sqlite = "sqlite" in database_url.lower()
    if is_sqlite:
        a_engine = create_async_engine(
            database_url,
            echo=settings.DEBUG,
            connect_args={"check_same_thread": False},
        )
        s_url = database_url.replace("+aiosqlite", "")
        s_engine = create_engine(
            s_url,
            echo=settings.DEBUG,
            connect_args={"check_same_thread": False},
        )
    else:
        a_engine = create_async_engine(
            database_url,
            echo=settings.DEBUG,
            pool_size=20,
            max_overflow=10,
            pool_pre_ping=True,
        )
        try:
            s_engine = create_engine(
                settings.DATABASE_SYNC_URL,
                echo=settings.DEBUG,
                pool_pre_ping=True,
            )
        except Exception:
            s_engine = None
    return a_engine, s_engine

try:
    engine, sync_engine = create_engines(db_url)
except Exception as e:
    logger.warning(f"Failed to create engine with {db_url}: {e}. Falling back to SQLite.")
    db_url = "sqlite+aiosqlite:///./cartograph.db"
    IS_SQLITE = True
    engine, sync_engine = create_engines(db_url)

async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    """Base class for all models."""
    pass


async def get_db() -> AsyncSession:
    """Dependency for getting database sessions."""
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db():
    """Create all tables and seed with synthetic data if empty."""
    global engine, async_session, IS_SQLITE
    
    # Try PostgreSQL first if configured, else fallback to SQLite
    try:
        async with engine.begin() as conn:
            if not IS_SQLITE:
                try:
                    await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
                except Exception as ex:
                    logger.warning(f"Could not enable pgvector extension: {ex}")
            await conn.run_sync(Base.metadata.create_all)
            logger.info(f"Database tables verified/created on {db_url}")
    except Exception as e:
        logger.warning(f"Primary database connection failed: {e}. Switching to local SQLite.")
        sqlite_url = "sqlite+aiosqlite:///./cartograph.db"
        IS_SQLITE = True
        engine, sync_engine = create_engines(sqlite_url)
        async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("SQLite database tables created successfully.")

    # Check if DB needs auto-seeding
    try:
        from app.models import Document
        from sqlalchemy import select, func
        async with async_session() as session:
            count_res = await session.execute(select(func.count(Document.id)))
            doc_count = count_res.scalar() or 0
            if doc_count == 0:
                logger.info("Database is empty. Automatically running synthetic seed data...")
                from app.seed.seed_data import get_seed_documents
                from app.services.ingestion import ingest_document
                docs = get_seed_documents()
                for d in docs:
                    await ingest_document(
                        db=session,
                        filename=d["filename"],
                        content=d["content"].encode("utf-8"),
                        document_type="markdown",
                        department=d["department"],
                        title=d["title"],
                    )
                await session.commit()
                logger.info(f"Auto-seeded {len(docs)} documents successfully!")
    except Exception as seed_err:
        logger.error(f"Auto-seeding error: {seed_err}", exc_info=True)
