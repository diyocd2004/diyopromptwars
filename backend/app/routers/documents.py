"""Document upload, public link ingestion, comparison, and management endpoints for Anveshan Research AI."""

import os
import re
import logging
from pathlib import Path
from urllib.parse import urlparse
import httpx
from pydantic import BaseModel, Field, HttpUrl
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, Query
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models import (
    Document, IngestionJob, Entity, Relationship,
    Embedding, DocumentEntity, ResearchInsight
)
from app.services.extraction import sanitize_filename, validate_file_extension
from app.services.ingestion import ingest_document
from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()
router = APIRouter(prefix="/api/documents", tags=["documents"])


class LinkIngestRequest(BaseModel):
    """Request to ingest a public research document link."""
    url: str = Field(..., description="Public document URL (PDF, Markdown, HTML, or raw text)")
    title: str = Field(default="", description="Optional custom document title")
    department: str = Field(default="Computer Science", description="Target academic department")
    source: str = Field(default="", description="Optional source or repository tag")


class CompareLinksRequest(BaseModel):
    """Request to ingest and compare multiple public document links."""
    urls: list[str] = Field(..., min_length=2, max_length=10, description="List of public URLs to compare")
    department: str = Field(default="Cross-Disciplinary", description="Department category")


@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    title: str = Form(""),
    department: str = Form(""),
    source: str = Form(""),
    db: AsyncSession = Depends(get_db),
):
    """Upload and ingest a research document (PDF, Markdown, or ZIP repo)."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")
    
    safe_filename = sanitize_filename(file.filename)
    if not validate_file_extension(safe_filename, settings.ALLOWED_EXTENSIONS):
        raise HTTPException(
            status_code=400,
            detail=f"File type not allowed. Supported: {', '.join(settings.ALLOWED_EXTENSIONS)}"
        )
    
    content = await file.read()
    max_size = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if len(content) > max_size:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size: {settings.MAX_UPLOAD_SIZE_MB}MB"
        )
    
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Empty file")
    
    ext = Path(safe_filename).suffix.lower()
    if ext == '.pdf' and not content[:5] == b'%PDF-':
        raise HTTPException(status_code=400, detail="File content does not match PDF signature")
    if ext == '.zip' and not content[:2] == b'PK':
        raise HTTPException(status_code=400, detail="File content does not match ZIP signature")
    
    doc_type = "pdf" if ext == ".pdf" else "markdown" if ext in (".md", ".markdown") else "code_repo"
    
    try:
        result = await ingest_document(
            db=db,
            filename=safe_filename,
            content=content,
            document_type=doc_type,
            department=department or "General",
            source=source or "Local Upload",
            title=title or safe_filename,
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Upload failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Document processing error: {e}")


@router.post("/ingest-url")
async def ingest_url(
    req: LinkIngestRequest,
    db: AsyncSession = Depends(get_db),
):
    """Ingest a publicly accessible document link without requiring login."""
    parsed = urlparse(req.url)
    if not parsed.scheme or not parsed.netloc:
        raise HTTPException(status_code=400, detail="Invalid URL format. Must include http:// or https://")
    
    try:
        async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
            headers = {"User-Agent": "Anveshan-Research-Bot/1.0 (Public Academic Parser)"}
            resp = await client.get(req.url, headers=headers)
            if resp.status_code != 200:
                raise HTTPException(
                    status_code=400,
                    detail=f"Unable to access URL (HTTP {resp.status_code}). Ensure link is publicly available without login."
                )
            
            content = resp.content
            if len(content) == 0:
                raise HTTPException(status_code=400, detail="The specified URL returned empty content.")
            
            # Detect file type from URL or Content-Type
            content_type = resp.headers.get("content-type", "").lower()
            url_path = parsed.path.lower()
            
            if "pdf" in content_type or url_path.endswith(".pdf"):
                doc_type = "pdf"
                filename = os.path.basename(parsed.path) or "document.pdf"
                if not filename.endswith(".pdf"):
                    filename += ".pdf"
            elif "markdown" in content_type or url_path.endswith(".md") or "github" in parsed.netloc:
                doc_type = "markdown"
                filename = os.path.basename(parsed.path) or "document.md"
                if not filename.endswith(".md"):
                    filename += ".md"
            else:
                # Text / HTML conversion
                doc_type = "markdown"
                filename = (os.path.basename(parsed.path) or "web_document") + ".md"
                # Strip basic HTML tags if HTML
                text_str = resp.text
                text_clean = re.sub(r'<script.*?</script>', '', text_str, flags=re.DOTALL | re.IGNORECASE)
                text_clean = re.sub(r'<style.*?</style>', '', text_clean, flags=re.DOTALL | re.IGNORECASE)
                text_clean = re.sub(r'<[^>]+>', ' ', text_clean)
                content = text_clean.encode("utf-8")

            derived_title = req.title or os.path.splitext(filename)[0].replace("-", " ").replace("_", " ").title()

            result = await ingest_document(
                db=db,
                filename=sanitize_filename(filename),
                content=content,
                document_type=doc_type,
                department=req.department,
                source=req.url,
                title=derived_title,
            )
            return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"URL ingestion failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=400,
            detail=f"Failed to fetch public document from URL: {e}. Please ensure document is publicly accessible without login."
        )


@router.post("/compare-links")
async def compare_links(
    req: CompareLinksRequest,
    db: AsyncSession = Depends(get_db),
):
    """Ingest multiple public links and immediately discover cross-document connections."""
    results = []
    errors = []
    
    for i, url in enumerate(req.urls):
        try:
            res = await ingest_url(
                LinkIngestRequest(
                    url=url,
                    title=f"Compared Doc {i+1} ({urlparse(url).netloc})",
                    department=req.department,
                    source=url,
                ),
                db=db,
            )
            results.append(res)
        except Exception as e:
            errors.append({"url": url, "error": str(e)})
            
    return {
        "status": "completed",
        "ingested_count": len(results),
        "results": results,
        "errors": errors,
    }


@router.delete("/{document_id}")
async def delete_document(
    document_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Remove an uploaded document and its associated embeddings and connections."""
    doc = await db.get(Document, str(document_id))
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    doc_title = doc.title
    
    try:
        # Delete associations
        await db.execute(delete(DocumentEntity).where(DocumentEntity.document_id == doc.id))
        await db.execute(delete(Embedding).where(Embedding.document_id == doc.id))
        await db.execute(delete(IngestionJob).where(IngestionJob.document_id == doc.id))
        await db.execute(
            delete(ResearchInsight).where(
                (ResearchInsight.source_document_id == doc.id) |
                (ResearchInsight.target_document_id == doc.id)
            )
        )
        await db.delete(doc)
        await db.commit()
        
        return {
            "status": "deleted",
            "document_id": document_id,
            "title": doc_title,
            "message": f"Document '{doc_title}' and its graph links were successfully removed."
        }
    except Exception as e:
        await db.rollback()
        logger.error(f"Error deleting document {document_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to delete document: {e}")


@router.get("/")
async def list_documents(
    department: str = None,
    doc_type: str = None,
    limit: int = 100,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
):
    """List all stored documents with optional filters."""
    query = select(Document)
    if department and department != "All":
        query = query.where(Document.department == department)
    if doc_type and doc_type != "All":
        query = query.where(Document.document_type == doc_type)
    query = query.order_by(Document.created_at.desc()).limit(limit).offset(offset)
    
    result = await db.execute(query)
    documents = result.scalars().all()
    
    return [
        {
            "id": str(d.id),
            "title": d.title,
            "filename": d.filename,
            "document_type": d.document_type,
            "department": d.department or "General",
            "source": d.source or "Upload",
            "authors": d.authors or [],
            "created_at": d.created_at.isoformat() if d.created_at else None,
        }
        for d in documents
    ]


@router.get("/{document_id}")
async def get_document(document_id: str, db: AsyncSession = Depends(get_db)):
    """Get a specific document."""
    doc = await db.get(Document, str(document_id))
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    return {
        "id": str(doc.id),
        "title": doc.title,
        "filename": doc.filename,
        "document_type": doc.document_type,
        "department": doc.department,
        "authors": doc.authors,
        "abstract": doc.abstract,
        "source": doc.source,
        "content": doc.content[:3000] if doc.content else None,
        "created_at": doc.created_at.isoformat() if doc.created_at else None,
    }


@router.get("/jobs/status")
async def list_ingestion_jobs(
    status: str = None,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
):
    """List ingestion job statuses."""
    query = select(IngestionJob)
    if status:
        query = query.where(IngestionJob.status == status)
    query = query.order_by(IngestionJob.created_at.desc()).limit(limit)
    
    result = await db.execute(query)
    jobs = result.scalars().all()
    
    return [
        {
            "id": str(j.id),
            "document_id": str(j.document_id),
            "status": j.status,
            "stage": j.stage,
            "error": j.error,
            "created_at": j.created_at.isoformat() if j.created_at else None,
            "completed_at": j.completed_at.isoformat() if j.completed_at else None,
        }
        for j in jobs
    ]
