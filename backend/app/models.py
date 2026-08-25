"""SQLAlchemy ORM models for Cartograph.
Cross-compatible with both PostgreSQL (pgvector on Cloud SQL / AlloyDB) and SQLite.
"""

import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Text, Float, Integer, DateTime, ForeignKey,
    JSON, Index
)
from sqlalchemy.orm import relationship
from app.database import Base
from app.config import get_settings

settings = get_settings()


class Document(Base):
    """Research documents ingested into the system."""
    __tablename__ = "documents"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(500), nullable=False, index=True)
    filename = Column(String(255), nullable=False)
    document_type = Column(String(50), nullable=False)  # pdf, markdown, code_repo
    source = Column(String(500), default="")
    department = Column(String(200), index=True)
    authors = Column(JSON, default=list)
    content = Column(Text, default="")
    abstract = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    entities = relationship("Entity", secondary="document_entities", back_populates="documents")
    ingestion_jobs = relationship("IngestionJob", back_populates="document", cascade="all, delete-orphan")
    embeddings = relationship("Embedding", back_populates="document", cascade="all, delete-orphan")


class Entity(Base):
    """Extracted entities from research documents."""
    __tablename__ = "entities"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(500), nullable=False)
    normalized_name = Column(String(500), nullable=False, index=True)
    entity_type = Column(String(100), nullable=False, index=True)
    metadata_ = Column("metadata", JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    documents = relationship("Document", secondary="document_entities", back_populates="entities")
    source_relationships = relationship(
        "Relationship", foreign_keys="Relationship.source_entity_id", back_populates="source_entity"
    )
    target_relationships = relationship(
        "Relationship", foreign_keys="Relationship.target_entity_id", back_populates="target_entity"
    )


class DocumentEntity(Base):
    """Association table for documents and entities."""
    __tablename__ = "document_entities"

    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), primary_key=True)
    entity_id = Column(String(36), ForeignKey("entities.id", ondelete="CASCADE"), primary_key=True)


class Relationship(Base):
    """Relationships between entities."""
    __tablename__ = "relationships"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    source_entity_id = Column(String(36), ForeignKey("entities.id", ondelete="CASCADE"), nullable=False, index=True)
    target_entity_id = Column(String(36), ForeignKey("entities.id", ondelete="CASCADE"), nullable=False, index=True)
    relationship_type = Column(String(100), nullable=False, index=True)
    confidence = Column(Float, default=0.0)
    evidence = Column(Text, default="")
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="SET NULL"), nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    source_entity = relationship("Entity", foreign_keys=[source_entity_id])
    target_entity = relationship("Entity", foreign_keys=[target_entity_id])
    document = relationship("Document")


class Embedding(Base):
    """Vector embeddings for document chunks."""
    __tablename__ = "embeddings"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    chunk_id = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    embedding = Column(JSON, nullable=False)  # List of floats
    metadata_ = Column("metadata", JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    document = relationship("Document", back_populates="embeddings")


class Researcher(Base):
    """Research personnel."""
    __tablename__ = "researchers"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(300), nullable=False, index=True)
    department = Column(String(200), index=True)
    metadata_ = Column("metadata", JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)


class IngestionJob(Base):
    """Tracks document ingestion pipeline status."""
    __tablename__ = "ingestion_jobs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(50), default="pending", index=True)  # pending, processing, completed, failed
    stage = Column(String(100), default="queued")  # extraction, entity_extraction, embedding, similarity, done
    error = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    # Relationships
    document = relationship("Document", back_populates="ingestion_jobs")


class ResearchInsight(Base):
    """Discovered connections between documents."""
    __tablename__ = "research_insights"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    source_document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    target_document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    similarity_score = Column(Float, nullable=False)
    connection_type = Column(String(100), default="cross_department")  # cross_department, shared_method, shared_dataset, etc.
    explanation = Column(Text, default="")
    shared_entities = Column(JSON, default=list)
    confidence = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    source_document = relationship("Document", foreign_keys=[source_document_id])
    target_document = relationship("Document", foreign_keys=[target_document_id])
