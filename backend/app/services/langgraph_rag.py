"""LangGraph RAG workflow for the research assistant.
5 nodes: classify_query -> vector_retrieve -> graph_retrieve -> analyze_relationships -> synthesize_answer
"""

import math
import logging
from typing import TypedDict, List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import Document, Entity, Relationship, Embedding, DocumentEntity
from app.services.vertex_ai import get_vertex_ai
from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


def calc_cosine_sim(v1: list[float], v2: list[float]) -> float:
    """Calculate cosine similarity."""
    if not v1 or not v2 or len(v1) != len(v2):
        return 0.0
    dot = sum(a * b for a, b in zip(v1, v2))
    norm1 = math.sqrt(sum(a * a for a in v1))
    norm2 = math.sqrt(sum(b * b for b in v2))
    if norm1 == 0 or norm2 == 0:
        return 0.0
    return max(0.0, min(1.0, dot / (norm1 * norm2)))


class RAGState(TypedDict):
    """State for the RAG workflow."""
    query: str
    query_type: str
    query_embedding: list[float]
    retrieved_docs: list[dict]
    retrieved_entities: list[dict]
    retrieved_relationships: list[dict]
    analysis: dict
    answer: dict
    error: str


async def classify_query(state: RAGState, db: AsyncSession) -> RAGState:
    """Node 1: Classify query intent and generate query embedding."""
    query = state["query"]
    vertex_ai = get_vertex_ai()
    
    query_lower = query.lower()
    if any(kw in query_lower for kw in ["overlap", "redundant", "duplicate", "similar"]):
        query_type = "overlap_detection"
    elif any(kw in query_lower for kw in ["connection", "link", "relate", "cross", "bridge"]):
        query_type = "connection_discovery"
    elif any(kw in query_lower for kw in ["dataset", "data", "method", "algorithm", "model"]):
        query_type = "entity_search"
    elif any(kw in query_lower for kw in ["who", "researcher", "author", "professor"]):
        query_type = "researcher_search"
    else:
        query_type = "general_research"
    
    embeddings = await vertex_ai.generate_embeddings([query])
    query_embedding = embeddings[0] if embeddings else []
    
    return {
        **state,
        "query_type": query_type,
        "query_embedding": query_embedding,
    }


async def vector_retrieve(state: RAGState, db: AsyncSession) -> RAGState:
    """Node 2: Semantic vector similarity search over document chunks."""
    query_vec = state.get("query_embedding")
    query_text = state["query"].lower()
    
    try:
        # Fetch all embeddings with documents
        emb_res = await db.execute(select(Embedding))
        all_embeddings = emb_res.scalars().all()
        
        doc_scores = {}
        for emb in all_embeddings:
            doc_id = str(emb.document_id)
            score = 0.0
            if query_vec and emb.embedding:
                score = calc_cosine_sim(query_vec, emb.embedding)
            
            # Keyword bonus
            if any(term in emb.content.lower() for term in query_text.split() if len(term) > 3):
                score += 0.15
            
            if doc_id not in doc_scores or score > doc_scores[doc_id]["score"]:
                doc_scores[doc_id] = {
                    "score": score,
                    "content": emb.content,
                    "chunk_id": emb.chunk_id,
                }
        
        # Sort documents by score
        sorted_doc_ids = sorted(doc_scores.keys(), key=lambda d: doc_scores[d]["score"], reverse=True)[:8]
        
        retrieved_docs = []
        for did in sorted_doc_ids:
            doc = await db.get(Document, did)
            if doc:
                retrieved_docs.append({
                    "document_id": str(doc.id),
                    "title": doc.title,
                    "department": doc.department or "General",
                    "authors": doc.authors or [],
                    "abstract": doc.abstract or doc.content[:400],
                    "content": doc_scores[did]["content"],
                    "similarity": round(min(1.0, doc_scores[did]["score"]), 4),
                    "document_type": doc.document_type,
                })
        
        # If no vector match, fallback to text search
        if not retrieved_docs:
            all_docs = await db.execute(select(Document).limit(6))
            for doc in all_docs.scalars().all():
                retrieved_docs.append({
                    "document_id": str(doc.id),
                    "title": doc.title,
                    "department": doc.department or "General",
                    "authors": doc.authors or [],
                    "abstract": doc.abstract or doc.content[:400],
                    "content": doc.content[:600],
                    "similarity": 0.5,
                    "document_type": doc.document_type,
                })
        
        return {**state, "retrieved_docs": retrieved_docs}
    except Exception as e:
        logger.error(f"Vector retrieval error: {e}", exc_info=True)
        return {**state, "retrieved_docs": [], "error": str(e)}


async def graph_retrieve(state: RAGState, db: AsyncSession) -> RAGState:
    """Node 3: Graph-based entity and relationship retrieval."""
    query = state["query"]
    
    try:
        terms = [t.strip() for t in query.lower().split() if len(t.strip()) > 2]
        matched_entities = []
        relationships = []
        
        ent_res = await db.execute(select(Entity))
        all_entities = ent_res.scalars().all()
        
        for entity in all_entities:
            ename = entity.name.lower()
            if any(term in ename for term in terms) or any(d["title"] == entity.name for d in state.get("retrieved_docs", [])):
                matched_entities.append({
                    "id": str(entity.id),
                    "name": entity.name,
                    "type": entity.entity_type,
                })
        
        # Get relationships for matched entities
        matched_ids = [e["id"] for e in matched_entities[:15]]
        if matched_ids:
            rel_res = await db.execute(
                select(Relationship).where(
                    (Relationship.source_entity_id.in_(matched_ids)) |
                    (Relationship.target_entity_id.in_(matched_ids))
                ).limit(30)
            )
            for rel in rel_res.scalars().all():
                source_ent = await db.get(Entity, rel.source_entity_id)
                target_ent = await db.get(Entity, rel.target_entity_id)
                if source_ent and target_ent:
                    relationships.append({
                        "source": source_ent.name,
                        "target": target_ent.name,
                        "type": rel.relationship_type,
                        "confidence": rel.confidence,
                        "evidence": rel.evidence,
                    })
        
        return {
            **state,
            "retrieved_entities": matched_entities[:20],
            "retrieved_relationships": relationships[:25],
        }
    except Exception as e:
        logger.error(f"Graph retrieval failed: {e}")
        return {**state, "retrieved_entities": [], "retrieved_relationships": []}


async def analyze_relationships(state: RAGState, db: AsyncSession) -> RAGState:
    """Node 4: Cross-reference and structural analysis."""
    docs = state.get("retrieved_docs", [])
    entities = state.get("retrieved_entities", [])
    relationships = state.get("retrieved_relationships", [])
    
    depts = list(set(d.get("department", "") for d in docs if d.get("department")))
    
    analysis = {
        "total_docs": len(docs),
        "total_entities": len(entities),
        "total_relationships": len(relationships),
        "departments_involved": depts,
    }
    
    return {**state, "analysis": analysis}


async def synthesize_answer(state: RAGState, db: AsyncSession) -> RAGState:
    """Node 5: AI synthesis grounded in retrieved graph and document evidence."""
    vertex_ai = get_vertex_ai()
    
    answer = await vertex_ai.synthesize_answer(
        query=state["query"],
        context_docs=state.get("retrieved_docs", []),
        entities=state.get("retrieved_entities", []),
        relationships=state.get("retrieved_relationships", []),
    )
    
    answer["analysis"] = state.get("analysis", {})
    return {**state, "answer": answer}


class ResearchAssistant:
    """LangGraph-driven research assistant."""
    
    async def query(self, query: str, db: AsyncSession) -> dict:
        state: RAGState = {
            "query": query,
            "query_type": "",
            "query_embedding": [],
            "retrieved_docs": [],
            "retrieved_entities": [],
            "retrieved_relationships": [],
            "analysis": {},
            "answer": {},
            "error": "",
        }
        
        try:
            state = await classify_query(state, db)
            state = await vector_retrieve(state, db)
            state = await graph_retrieve(state, db)
            state = await analyze_relationships(state, db)
            state = await synthesize_answer(state, db)
            
            return {
                "query": state["query"],
                "query_type": state["query_type"],
                "answer": state.get("answer", {}),
                "retrieved_documents": [
                    {"title": d["title"], "department": d.get("department"), "similarity": d.get("similarity", 0)}
                    for d in state.get("retrieved_docs", [])
                ],
                "entities_found": len(state.get("retrieved_entities", [])),
                "relationships_found": len(state.get("retrieved_relationships", [])),
            }
        except Exception as e:
            logger.error(f"Research assistant error: {e}", exc_info=True)
            return {
                "query": query,
                "error": str(e),
                "answer": {
                    "answer": f"Unable to process query: {e}. Please ensure data is loaded.",
                    "cited_documents": [],
                    "discovered_connections": [],
                    "confidence": 0.0,
                },
                "retrieved_documents": [],
                "entities_found": 0,
                "relationships_found": 0,
            }


_assistant: ResearchAssistant | None = None

def get_research_assistant() -> ResearchAssistant:
    global _assistant
    if _assistant is None:
        _assistant = ResearchAssistant()
    return _assistant
