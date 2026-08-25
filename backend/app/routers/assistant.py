"""Research assistant endpoint using LangGraph RAG."""

import logging
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.services.langgraph_rag import get_research_assistant

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/assistant", tags=["assistant"])


class QueryRequest(BaseModel):
    """Research assistant query request."""
    query: str = Field(..., min_length=3, max_length=2000,
                       description="Research query to process")


@router.post("/query")
async def research_query(
    request: QueryRequest,
    db: AsyncSession = Depends(get_db),
):
    """Process a research question through the LangGraph RAG pipeline."""
    assistant = get_research_assistant()
    result = await assistant.query(request.query, db)
    return result
