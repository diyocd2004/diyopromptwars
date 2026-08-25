"""Centralized configuration for Cartograph backend."""

import os
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Application
    APP_NAME: str = "Anveshan Research AI"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    PORT: int = 8080
    FRONTEND_URL: str = "http://localhost:3000"

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/cartograph"
    DATABASE_SYNC_URL: str = "postgresql://postgres:postgres@localhost:5432/cartograph"

    # Google Cloud
    GCP_PROJECT_ID: str = ""
    GCP_REGION: str = "us-central1"
    GCS_BUCKET_NAME: str = "cartograph-uploads"

    # Vertex AI
    VERTEX_AI_MODEL: str = "gemini-2.0-flash"
    VERTEX_AI_EMBEDDING_MODEL: str = "text-embedding-005"
    EMBEDDING_DIMENSION: int = 768

    # Ingestion
    MAX_UPLOAD_SIZE_MB: int = 50
    ALLOWED_EXTENSIONS: list[str] = [".pdf", ".md", ".markdown", ".zip"]
    CHUNK_SIZE: int = 1000
    CHUNK_OVERLAP: int = 200

    # Similarity
    SIMILARITY_ALPHA: float = 0.6  # Weight for embedding cosine similarity
    SIMILARITY_BETA: float = 0.4   # Weight for entity overlap
    HIGH_OVERLAP_THRESHOLD: float = 0.8
    SIGNIFICANT_THRESHOLD: float = 0.6
    MODERATE_THRESHOLD: float = 0.4
    WEAK_THRESHOLD: float = 0.2

    # Rate limiting
    RATE_LIMIT_INGESTION: int = 10  # per minute
    RATE_LIMIT_SEARCH: int = 30     # per minute

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


def get_overlap_label(score: float) -> str:
    """Convert similarity score to human-readable label."""
    s = get_settings()
    if score >= s.HIGH_OVERLAP_THRESHOLD:
        return "High Overlap"
    elif score >= s.SIGNIFICANT_THRESHOLD:
        return "Significant Similarity"
    elif score >= s.MODERATE_THRESHOLD:
        return "Moderate Connection"
    elif score >= s.WEAK_THRESHOLD:
        return "Weak Connection"
    return "No Significant Connection"

