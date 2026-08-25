"""Ingestion pipeline orchestrating the full document processing flow."""

import math
import uuid
import logging
from datetime import datetime
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import (
    Document, Entity, Relationship, Embedding, DocumentEntity,
    IngestionJob, Researcher, ResearchInsight
)
from app.services.extraction import extract_text, clean_text, chunk_text, sanitize_filename
from app.services.vertex_ai import get_vertex_ai
from app.config import get_settings, get_overlap_label

logger = logging.getLogger(__name__)
settings = get_settings()


def cosine_sim(v1: list[float], v2: list[float]) -> float:
    """Calculate cosine similarity between two float vectors."""
    if not v1 or not v2 or len(v1) != len(v2):
        return 0.0
    dot = sum(a * b for a, b in zip(v1, v2))
    norm1 = math.sqrt(sum(a * a for a in v1))
    norm2 = math.sqrt(sum(b * b for b in v2))
    if norm1 == 0 or norm2 == 0:
        return 0.0
    return max(0.0, min(1.0, dot / (norm1 * norm2)))


async def ingest_document(
    db: AsyncSession,
    filename: str,
    content: bytes,
    document_type: str,
    department: str = "",
    source: str = "",
    title: str = "",
) -> dict:
    """Full ingestion pipeline for a document."""
    safe_filename = sanitize_filename(filename)
    
    # Create document record
    doc = Document(
        title=title or safe_filename,
        filename=safe_filename,
        document_type=document_type,
        source=source,
        department=department,
        authors=[],
    )
    db.add(doc)
    await db.flush()
    
    # Create ingestion job
    job = IngestionJob(
        document_id=doc.id,
        status="processing",
        stage="extraction",
    )
    db.add(job)
    await db.flush()
    
    try:
        # Stage 1: Text extraction
        raw_text = extract_text(content, safe_filename)
        cleaned_text = clean_text(raw_text)
        doc.content = cleaned_text
        doc.abstract = cleaned_text[:600] if cleaned_text else ""
        
        # Stage 2: Entity and relationship extraction
        job.stage = "entity_extraction"
        await db.flush()
        
        vertex_ai = get_vertex_ai()
        extraction_result = await vertex_ai.extract_entities_and_relationships(
            cleaned_text, doc.title
        )
        
        # Store entities
        entity_map = {}
        for ent_data in extraction_result.get("entities", []):
            name = ent_data.get("name", "").strip()
            if not name:
                continue
            normalized = name.lower().strip()
            
            existing = await db.execute(
                select(Entity).where(Entity.normalized_name == normalized)
            )
            entity = existing.scalar_one_or_none()
            
            if not entity:
                entity = Entity(
                    name=name,
                    normalized_name=normalized,
                    entity_type=ent_data.get("type", "Unknown"),
                    metadata_={"confidence": ent_data.get("confidence", 0.9)},
                )
                db.add(entity)
                await db.flush()
            
            entity_map[name] = entity
            
            # Link entity to document
            doc_entity_link = await db.execute(
                select(DocumentEntity).where(
                    DocumentEntity.document_id == doc.id,
                    DocumentEntity.entity_id == entity.id
                )
            )
            if not doc_entity_link.scalar_one_or_none():
                doc_entity = DocumentEntity(
                    document_id=doc.id,
                    entity_id=entity.id,
                )
                db.add(doc_entity)
            
            # Create researcher record if entity is an Author/Researcher
            if ent_data.get("type") in ("Author", "Researcher"):
                existing_researcher = await db.execute(
                    select(Researcher).where(Researcher.name == name)
                )
                if not existing_researcher.scalar_one_or_none():
                    researcher = Researcher(
                        name=name,
                        department=department or "General",
                    )
                    db.add(researcher)
                    
                current_authors = list(doc.authors or [])
                if name not in current_authors:
                    current_authors.append(name)
                    doc.authors = current_authors
        
        # Store relationships
        for rel_data in extraction_result.get("relationships", []):
            source_name = rel_data.get("source", "").strip()
            target_name = rel_data.get("target", "").strip()
            
            source_entity = entity_map.get(source_name)
            target_entity = entity_map.get(target_name)
            
            if source_entity and target_entity:
                rel = Relationship(
                    source_entity_id=source_entity.id,
                    target_entity_id=target_entity.id,
                    relationship_type=rel_data.get("type", "RELATED_TO"),
                    confidence=rel_data.get("confidence", 0.8),
                    evidence=rel_data.get("evidence", ""),
                    document_id=doc.id,
                )
                db.add(rel)
        
        await db.flush()
        
        # Stage 3: Embedding generation
        job.stage = "embedding"
        await db.flush()
        
        chunks = chunk_text(cleaned_text, settings.CHUNK_SIZE, settings.CHUNK_OVERLAP)
        if not chunks and cleaned_text:
            chunks = [{"chunk_id": 0, "content": cleaned_text[:1000]}]

        if chunks:
            chunk_texts = [c["content"] for c in chunks]
            embeddings = await vertex_ai.generate_embeddings(chunk_texts)
            
            for chunk, emb_vec in zip(chunks, embeddings):
                emb = Embedding(
                    document_id=doc.id,
                    chunk_id=chunk["chunk_id"],
                    content=chunk["content"],
                    embedding=emb_vec,
                )
                db.add(emb)
        
        await db.flush()
        
        # Stage 4: Similarity & Hidden Connection discovery
        job.stage = "similarity"
        await db.flush()
        
        await discover_similarities(db, doc)
        
        # Mark completed
        job.status = "completed"
        job.stage = "done"
        job.completed_at = datetime.utcnow()
        await db.commit()
        
        return {
            "document_id": str(doc.id),
            "title": doc.title,
            "entities_extracted": len(entity_map),
            "relationships_found": len(extraction_result.get("relationships", [])),
            "chunks_created": len(chunks),
            "status": "completed",
        }
        
    except Exception as e:
        logger.error(f"Ingestion failed for {safe_filename}: {e}", exc_info=True)
        job.status = "failed"
        job.error = str(e)[:1000]
        await db.commit()
        raise


async def discover_similarities(db: AsyncSession, doc: Document):
    """Find similar documents and surface hidden cross-disciplinary connections."""
    try:
        # Get document's entities
        result = await db.execute(
            select(Entity).join(DocumentEntity, DocumentEntity.entity_id == Entity.id).where(DocumentEntity.document_id == doc.id)
        )
        doc_entities = result.scalars().all()
        doc_entity_names = {e.normalized_name for e in doc_entities}
        
        # Get this document's embedding
        doc_emb_res = await db.execute(
            select(Embedding).where(Embedding.document_id == doc.id, Embedding.chunk_id == 0)
        )
        doc_emb = doc_emb_res.scalar_one_or_none()
        doc_vec = doc_emb.embedding if doc_emb else []

        # Get all other documents
        other_docs_res = await db.execute(
            select(Document).where(Document.id != doc.id)
        )
        other_docs = other_docs_res.scalars().all()
        
        vertex_ai = get_vertex_ai()
        
        for other_doc in other_docs:
            other_result = await db.execute(
                select(Entity).join(DocumentEntity, DocumentEntity.entity_id == Entity.id).where(DocumentEntity.document_id == other_doc.id)
            )
            other_entities = other_result.scalars().all()
            other_entity_names = {e.normalized_name for e in other_entities}
            
            # Shared entities
            shared = doc_entity_names & other_entity_names
            max_entities = max(len(doc_entity_names), len(other_entity_names), 1)
            entity_overlap = len(shared) / max_entities
            
            # Embedding similarity
            other_emb_res = await db.execute(
                select(Embedding).where(Embedding.document_id == other_doc.id, Embedding.chunk_id == 0)
            )
            other_emb = other_emb_res.scalar_one_or_none()
            other_vec = other_emb.embedding if other_emb else []
            
            embedding_sim = cosine_sim(doc_vec, other_vec) if (doc_vec and other_vec) else 0.0
            
            # Formula: alpha * embedding_sim + beta * entity_overlap
            combined_score = round(
                settings.SIMILARITY_ALPHA * embedding_sim +
                settings.SIMILARITY_BETA * entity_overlap,
                4
            )
            
            if combined_score >= settings.WEAK_THRESHOLD or len(shared) >= 1:
                connection_type = _determine_connection_type(
                    doc, other_doc, shared, doc_entities, other_entities
                )
                
                # Check if insight exists already
                existing = await db.execute(
                    select(ResearchInsight).where(
                        ((ResearchInsight.source_document_id == doc.id) & (ResearchInsight.target_document_id == other_doc.id)) |
                        ((ResearchInsight.source_document_id == other_doc.id) & (ResearchInsight.target_document_id == doc.id))
                    )
                )
                if existing.scalar_one_or_none():
                    continue
                
                shared_entity_list = [
                    {"name": e.name, "type": e.entity_type}
                    for e in doc_entities if e.normalized_name in shared
                ]
                
                explanation = await vertex_ai.explain_connection(
                    {"title": doc.title, "department": doc.department, "abstract": doc.abstract, "content": doc.content},
                    {"title": other_doc.title, "department": other_doc.department, "abstract": other_doc.abstract, "content": other_doc.content},
                    shared_entity_list,
                )
                
                insight = ResearchInsight(
                    source_document_id=doc.id,
                    target_document_id=other_doc.id,
                    similarity_score=max(combined_score, 0.25 if len(shared) > 0 else 0.1),
                    connection_type=connection_type,
                    explanation=explanation,
                    shared_entities=shared_entity_list,
                    confidence=combined_score,
                )
                db.add(insight)
        
        await db.flush()
    except Exception as e:
        logger.error(f"Similarity discovery failed: {e}", exc_info=True)


def _determine_connection_type(
    doc_a: Document, doc_b: Document,
    shared_entities: set, entities_a: list, entities_b: list
) -> str:
    """Determine connection classification."""
    shared_entity_types = set()
    for e in entities_a:
        if e.normalized_name in shared_entities:
            shared_entity_types.add(e.entity_type)
    
    if doc_a.department and doc_b.department and doc_a.department != doc_b.department:
        return "cross_department"
    if "Dataset" in shared_entity_types:
        return "shared_dataset"
    if "Algorithm" in shared_entity_types or "Model" in shared_entity_types:
        return "shared_algorithm"
    if "Methodology" in shared_entity_types:
        return "shared_methodology"
    if "Research_Topic" in shared_entity_types or "Domain" in shared_entity_types:
        return "same_domain"
    
    return "general_similarity"
