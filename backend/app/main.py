"""Cartograph — FastAPI Application Entry Point.

Google Maps for university research. Ingests research documents, builds
a knowledge graph, and surfaces hidden cross-disciplinary connections.
"""

import logging
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.config import get_settings
from app.database import init_db
from app.routers import documents, graph, assistant, insights, stats, search

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle manager."""
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    
    # Initialize database
    try:
        await init_db()
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        # Continue — the app can serve health checks even without DB
    
    # Initialize Vertex AI
    try:
        if settings.GCP_PROJECT_ID:
            from app.services.vertex_ai import get_vertex_ai
            get_vertex_ai()
            logger.info("Vertex AI initialized successfully")
        else:
            logger.warning("GCP_PROJECT_ID not set — Vertex AI features disabled")
    except Exception as e:
        logger.warning(f"Vertex AI initialization failed: {e}")
    
    yield
    
    logger.info("Shutting down Cartograph")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Google Maps for university research — surface hidden cross-disciplinary connections",
    lifespan=lifespan,
)

# CORS middleware - scoped to frontend origin
allowed_origins = [
    settings.FRONTEND_URL,
    "http://localhost:3000",
    "http://localhost:3001",
]

# Add Cloud Run URLs if deployed
if os.environ.get("CLOUD_RUN_FRONTEND_URL"):
    allowed_origins.append(os.environ["CLOUD_RUN_FRONTEND_URL"])

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)


# Global exception handler — no stack traces in responses
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Catch unhandled exceptions and return safe error messages."""
    logger.error(f"Unhandled error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal error occurred. Please try again."},
    )


# Health endpoint
@app.get("/health")
async def health_check():
    """Health check for Cloud Run."""
    status = {"status": "healthy", "version": settings.APP_VERSION}
    
    # Check database connectivity
    try:
        from app.database import async_session
        from sqlalchemy import text
        async with async_session() as session:
            await session.execute(text("SELECT 1"))
        status["database"] = "connected"
    except Exception:
        status["database"] = "disconnected"
    
    # Check Vertex AI
    status["vertex_ai"] = "configured" if settings.GCP_PROJECT_ID else "not_configured"
    
    return status


@app.get("/api")
async def api_root():
    """API root with available endpoints."""
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "endpoints": {
            "health": "/health",
            "dashboard": "/api/stats/dashboard",
            "documents": "/api/documents/",
            "upload": "/api/documents/upload",
            "graph": "/api/graph/",
            "search": "/api/search/",
            "assistant": "/api/assistant/query",
            "connections": "/api/insights/connections",
            "overlap": "/api/insights/overlap",
        },
    }


# Register routers
app.include_router(documents.router)
app.include_router(graph.router)
app.include_router(assistant.router)
app.include_router(insights.router)
app.include_router(stats.router)
app.include_router(search.router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=int(os.environ.get("PORT", settings.PORT)),
        reload=settings.DEBUG,
    )
