"""Graph query service for knowledge graph operations."""

import logging
from sqlalchemy import select, func, text as sql_text
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import (
    Document, Entity, Relationship, DocumentEntity,
    ResearchInsight, Researcher
)

logger = logging.getLogger(__name__)


async def get_graph_data(
    db: AsyncSession,
    entity_types: list[str] | None = None,
    departments: list[str] | None = None,
    limit: int = 200,
) -> dict:
    """Get knowledge graph data for visualization.
    
    Returns nodes and edges filtered by entity types and departments.
    """
    # Build entity query with filters
    entity_query = select(Entity)
    if entity_types:
        entity_query = entity_query.where(Entity.entity_type.in_(entity_types))
    entity_query = entity_query.limit(limit)
    
    result = await db.execute(entity_query)
    entities = result.scalars().all()
    entity_ids = {e.id for e in entities}
    
    # Build nodes
    nodes = []
    for entity in entities:
        # Get linked documents for department info
        doc_result = await db.execute(
            select(Document).join(DocumentEntity).where(
                DocumentEntity.entity_id == entity.id
            ).limit(1)
        )
        doc = doc_result.scalar_one_or_none()
        department = doc.department if doc else None
        
        if departments and department and department not in departments:
            continue
        
        nodes.append({
            "id": str(entity.id),
            "label": entity.name,
            "type": entity.entity_type,
            "department": department,
        })
    
    # Get relationships between included entities
    node_ids = {n["id"] for n in nodes}
    
    rel_result = await db.execute(
        select(Relationship).where(
            Relationship.source_entity_id.in_([e.id for e in entities]),
            Relationship.target_entity_id.in_([e.id for e in entities]),
        ).limit(limit * 2)
    )
    
    edges = []
    for rel in rel_result.scalars().all():
        src = str(rel.source_entity_id)
        tgt = str(rel.target_entity_id)
        if src in node_ids and tgt in node_ids:
            edges.append({
                "id": str(rel.id),
                "source": src,
                "target": tgt,
                "label": rel.relationship_type,
                "confidence": rel.confidence,
            })
    
    return {"nodes": nodes, "edges": edges}


async def get_entity_details(db: AsyncSession, entity_id: str) -> dict:
    """Get detailed information about an entity."""
    entity = await db.get(Entity, str(entity_id))
    if not entity:
        return None
    
    # Get documents
    doc_result = await db.execute(
        select(Document).join(DocumentEntity).where(
            DocumentEntity.entity_id == entity.id
        )
    )
    documents = doc_result.scalars().all()
    
    # Get relationships
    rel_result = await db.execute(
        select(Relationship).where(
            (Relationship.source_entity_id == entity.id) |
            (Relationship.target_entity_id == entity.id)
        ).limit(50)
    )
    relationships = rel_result.scalars().all()
    
    rels_data = []
    for rel in relationships:
        source = await db.get(Entity, rel.source_entity_id)
        target = await db.get(Entity, rel.target_entity_id)
        rels_data.append({
            "source": source.name if source else "Unknown",
            "target": target.name if target else "Unknown",
            "type": rel.relationship_type,
            "confidence": rel.confidence,
        })
    
    return {
        "id": str(entity.id),
        "name": entity.name,
        "type": entity.entity_type,
        "documents": [
            {"id": str(d.id), "title": d.title, "department": d.department}
            for d in documents
        ],
        "relationships": rels_data,
    }


async def get_dashboard_stats(db: AsyncSession) -> dict:
    """Get statistics for the dashboard."""
    doc_count = await db.execute(select(func.count(Document.id)))
    entity_count = await db.execute(select(func.count(Entity.id)))
    rel_count = await db.execute(select(func.count(Relationship.id)))
    researcher_count = await db.execute(select(func.count(Researcher.id)))
    insight_count = await db.execute(select(func.count(ResearchInsight.id)))
    
    # Distinct departments
    dept_result = await db.execute(
        select(func.count(func.distinct(Document.department))).where(
            Document.department.isnot(None),
            Document.department != "",
        )
    )
    
    # Entity types distribution
    type_dist = await db.execute(
        select(Entity.entity_type, func.count(Entity.id)).group_by(Entity.entity_type)
    )
    
    # Recent ingestions
    from app.models import IngestionJob
    recent_jobs = await db.execute(
        select(IngestionJob).order_by(IngestionJob.created_at.desc()).limit(5)
    )
    
    # Connection types distribution
    conn_dist = await db.execute(
        select(
            ResearchInsight.connection_type,
            func.count(ResearchInsight.id)
        ).group_by(ResearchInsight.connection_type)
    )
    
    return {
        "total_documents": doc_count.scalar() or 0,
        "total_entities": entity_count.scalar() or 0,
        "total_relationships": rel_count.scalar() or 0,
        "total_researchers": researcher_count.scalar() or 0,
        "total_insights": insight_count.scalar() or 0,
        "total_departments": dept_result.scalar() or 0,
        "entity_type_distribution": {
            row[0]: row[1] for row in type_dist.fetchall()
        },
        "connection_type_distribution": {
            row[0]: row[1] for row in conn_dist.fetchall() if row[0]
        },
        "recent_ingestions": [
            {
                "id": str(job.id),
                "document_id": str(job.document_id),
                "status": job.status,
                "stage": job.stage,
                "created_at": job.created_at.isoformat() if job.created_at else None,
            }
            for job in recent_jobs.scalars().all()
        ],
    }


async def get_insights(
    db: AsyncSession,
    min_score: float = 0.0,
    connection_type: str | None = None,
    limit: int = 50,
) -> list[dict]:
    """Get research insights/connections."""
    query = select(ResearchInsight)
    
    if min_score > 0:
        query = query.where(ResearchInsight.similarity_score >= min_score)
    if connection_type:
        query = query.where(ResearchInsight.connection_type == connection_type)
    
    query = query.order_by(ResearchInsight.similarity_score.desc()).limit(limit)
    
    result = await db.execute(query)
    insights = result.scalars().all()
    
    from app.config import get_overlap_label
    
    data = []
    for insight in insights:
        source_doc = await db.get(Document, insight.source_document_id)
        target_doc = await db.get(Document, insight.target_document_id)
        
        data.append({
            "id": str(insight.id),
            "source_document": {
                "id": str(source_doc.id) if source_doc else "",
                "title": source_doc.title if source_doc else "Unknown",
                "department": source_doc.department if source_doc else "",
            },
            "target_document": {
                "id": str(target_doc.id) if target_doc else "",
                "title": target_doc.title if target_doc else "Unknown",
                "department": target_doc.department if target_doc else "",
            },
            "similarity_score": insight.similarity_score,
            "overlap_label": get_overlap_label(insight.similarity_score),
            "connection_type": insight.connection_type,
            "explanation": insight.explanation,
            "shared_entities": insight.shared_entities,
            "confidence": insight.confidence,
        })
    
    return data
