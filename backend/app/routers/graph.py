"""Graph query and visualization endpoints."""

import logging
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.services.graph_service import get_graph_data, get_entity_details

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/graph", tags=["graph"])


@router.get("/")
async def get_graph(
    entity_types: str = Query(None, description="Comma-separated entity types to filter"),
    departments: str = Query(None, description="Comma-separated departments to filter"),
    limit: int = Query(200, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
):
    """Get knowledge graph data for visualization."""
    type_filter = entity_types.split(",") if entity_types else None
    dept_filter = departments.split(",") if departments else None
    
    data = await get_graph_data(
        db=db,
        entity_types=type_filter,
        departments=dept_filter,
        limit=limit,
    )
    return data


@router.get("/entity/{entity_id}")
async def get_entity(
    entity_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Get detailed entity information."""
    try:
        result = await get_entity_details(db, entity_id)
        if not result:
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="Entity not found")
        return result
    except ValueError:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Invalid entity ID")
