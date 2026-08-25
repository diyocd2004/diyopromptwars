"""Seed runner script — processes synthetic documents through the real ingestion pipeline."""

import asyncio
import logging
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import init_db, async_session
from app.services.ingestion import ingest_document
from app.seed.seed_data import get_seed_documents

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def run_seed():
    """Process all seed documents through the ingestion pipeline."""
    logger.info("Initializing database...")
    await init_db()
    
    documents = get_seed_documents()
    logger.info(f"Processing {len(documents)} seed documents...")
    
    async with async_session() as db:
        for i, doc_data in enumerate(documents):
            logger.info(f"[{i+1}/{len(documents)}] Ingesting: {doc_data['title'][:60]}...")
            
            try:
                content = doc_data["content"].encode("utf-8")
                result = await ingest_document(
                    db=db,
                    filename=doc_data["filename"],
                    content=content,
                    document_type="markdown",
                    department=doc_data["department"],
                    title=doc_data["title"],
                )
                logger.info(
                    f"  ✓ Entities: {result['entities_extracted']}, "
                    f"Relationships: {result['relationships_found']}, "
                    f"Chunks: {result['chunks_created']}"
                )
            except Exception as e:
                logger.error(f"  ✗ Failed: {e}")
                continue
    
    logger.info("Seed data processing complete!")


if __name__ == "__main__":
    asyncio.run(run_seed())
