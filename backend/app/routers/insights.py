"""Research insights and connection discovery endpoints."""

import logging
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.services.graph_service import get_insights

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/insights", tags=["insights"])


@router.get("/connections")
async def get_connections(
    min_score: float = Query(0.2, ge=0.0, le=1.0),
    connection_type: str = None,
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    """Get discovered hidden connections between research documents."""
    return await get_insights(
        db=db,
        min_score=min_score,
        connection_type=connection_type,
        limit=limit,
    )


@router.get("/overlap")
async def get_overlap(
    min_score: float = Query(0.4, ge=0.0, le=1.0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    """Get potential research overlap/redundancy between documents."""
    return await get_insights(
        db=db,
        min_score=min_score,
        limit=limit,
    )
