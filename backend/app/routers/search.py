"""Search endpoints for vector and entity search."""

import math
import logging
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models import Entity, Document, Embedding
from app.services.vertex_ai import get_vertex_ai

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/search", tags=["search"])


def cosine_similarity(v1: list[float], v2: list[float]) -> float:
    if not v1 or not v2 or len(v1) != len(v2):
        return 0.0
    dot = sum(a * b for a, b in zip(v1, v2))
    norm1 = math.sqrt(sum(a * a for a in v1))
    norm2 = math.sqrt(sum(b * b for b in v2))
    if norm1 == 0 or norm2 == 0:
        return 0.0
    return max(0.0, min(1.0, dot / (norm1 * norm2)))


class SearchRequest(BaseModel):
    """Search request model."""
    query: str = Field(..., min_length=2, max_length=500)
    search_type: str = Field(default="hybrid", pattern="^(vector|entity|hybrid)$")
    limit: int = Field(default=10, ge=1, le=50)


@router.post("/")
async def search(
    request: SearchRequest,
    db: AsyncSession = Depends(get_db),
):
    """Perform hybrid (semantic vector + entity) search across research data."""
    results = {
        "query": request.query,
        "documents": [],
        "entities": [],
    }
    
    # 1. Entity search
    if request.search_type in ("entity", "hybrid"):
        query_terms = [t.strip() for t in request.query.lower().split() if len(t.strip()) > 2]
        all_entities = (await db.execute(select(Entity))).scalars().all()
        
        for entity in all_entities:
            ename = entity.normalized_name
            if any(term in ename for term in query_terms) or (request.query.lower() in ename):
                results["entities"].append({
                    "id": str(entity.id),
                    "name": entity.name,
                    "type": entity.entity_type,
                })
        results["entities"] = results["entities"][:request.limit]
    
    # 2. Vector search
    if request.search_type in ("vector", "hybrid"):
        try:
            vertex_ai = get_vertex_ai()
            embeddings = await vertex_ai.generate_embeddings([request.query])
            query_vec = embeddings[0] if embeddings else []
            
            all_embs = (await db.execute(select(Embedding))).scalars().all()
            doc_scores = {}
            
            for emb in all_embs:
                doc_id = str(emb.document_id)
                sim = cosine_similarity(query_vec, emb.embedding) if query_vec and emb.embedding else 0.0
                
                # Bonus for exact query terms in content
                if any(t in emb.content.lower() for t in request.query.lower().split() if len(t) > 3):
                    sim += 0.2
                
                if doc_id not in doc_scores or sim > doc_scores[doc_id]["score"]:
                    doc_scores[doc_id] = {
                        "score": sim,
                        "content": emb.content,
                    }
            
            sorted_docs = sorted(doc_scores.keys(), key=lambda d: doc_scores[d]["score"], reverse=True)[:request.limit]
            
            for did in sorted_docs:
                doc = await db.get(Document, did)
                if doc:
                    results["documents"].append({
                        "id": str(doc.id),
                        "title": doc.title,
                        "department": doc.department or "General",
                        "authors": doc.authors or [],
                        "content_preview": doc_scores[did]["content"][:350] + "...",
                        "similarity": round(min(1.0, doc_scores[did]["score"]), 3),
                    })
        except Exception as e:
            logger.error(f"Vector search failed: {e}", exc_info=True)
            
    # Fallback to direct title/abstract match if no vector results
    if not results["documents"]:
        all_docs = (await db.execute(select(Document).limit(request.limit))).scalars().all()
        for doc in all_docs:
            if any(term in doc.title.lower() or term in (doc.content or "").lower() for term in request.query.lower().split()):
                results["documents"].append({
                    "id": str(doc.id),
                    "title": doc.title,
                    "department": doc.department or "General",
                    "authors": doc.authors or [],
                    "content_preview": (doc.abstract or doc.content or "")[:350],
                    "similarity": 0.65,
                })
    
    return results
