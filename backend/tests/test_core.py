"""Tests for Cartograph backend."""

import pytest
from pathlib import Path
import io

# Test extraction module (doesn't require DB or Vertex AI)
from app.services.extraction import (
    sanitize_filename,
    validate_file_extension,
    extract_text_from_markdown,
    clean_text,
    chunk_text,
)


class TestSanitizeFilename:
    """Test filename sanitization security."""

    def test_normal_filename(self):
        assert sanitize_filename("research_paper.pdf") == "research_paper.pdf"

    def test_path_traversal_unix(self):
        result = sanitize_filename("../../etc/passwd")
        assert ".." not in result
        assert "/" not in result

    def test_path_traversal_windows(self):
        result = sanitize_filename("..\\..\\Windows\\system32\\config")
        assert ".." not in result
        assert "\\" not in result

    def test_null_bytes(self):
        result = sanitize_filename("file\x00.pdf")
        assert "\x00" not in result

    def test_empty_filename(self):
        result = sanitize_filename("")
        assert result == "uploaded_file"

    def test_dot_file(self):
        result = sanitize_filename(".htaccess")
        assert result == "uploaded_file"

    def test_nested_path(self):
        result = sanitize_filename("path/to/file.pdf")
        assert result == "file.pdf"


class TestValidateExtension:
    """Test file extension validation."""

    def test_allowed_pdf(self):
        assert validate_file_extension("test.pdf", [".pdf", ".md"]) is True

    def test_allowed_md(self):
        assert validate_file_extension("test.md", [".pdf", ".md"]) is True

    def test_disallowed_exe(self):
        assert validate_file_extension("test.exe", [".pdf", ".md"]) is False

    def test_case_insensitive(self):
        assert validate_file_extension("test.PDF", [".pdf"]) is True

    def test_no_extension(self):
        assert validate_file_extension("test", [".pdf"]) is False


class TestMarkdownExtraction:
    """Test Markdown text extraction."""

    def test_basic_markdown(self):
        content = b"# Title\n\nSome content here."
        result = extract_text_from_markdown(content)
        assert "Title" in result
        assert "Some content here" in result

    def test_utf8_content(self):
        content = "# Résumé\n\nCafé analysis".encode("utf-8")
        result = extract_text_from_markdown(content)
        assert "Résumé" in result


class TestCleanText:
    """Test text cleaning."""

    def test_excessive_newlines(self):
        text = "Line 1\n\n\n\n\nLine 2"
        result = clean_text(text)
        assert result == "Line 1\n\nLine 2"

    def test_excessive_spaces(self):
        text = "Hello    world"
        result = clean_text(text)
        assert result == "Hello world"

    def test_control_characters(self):
        text = "Hello\x00world\x07test"
        result = clean_text(text)
        assert "\x00" not in result
        assert "\x07" not in result

    def test_preserves_normal_text(self):
        text = "Normal research text with numbers 123."
        result = clean_text(text)
        assert result == text


class TestChunkText:
    """Test text chunking."""

    def test_basic_chunking(self):
        text = " ".join(["word"] * 500)
        chunks = chunk_text(text, chunk_size=100, overlap=20)
        assert len(chunks) > 1
        assert all("content" in c for c in chunks)
        assert all("chunk_id" in c for c in chunks)

    def test_empty_text(self):
        chunks = chunk_text("")
        assert chunks == []

    def test_small_text(self):
        text = "A short text"
        chunks = chunk_text(text, chunk_size=1000)
        assert len(chunks) == 1
        assert chunks[0]["content"] == text

    def test_chunk_ids_sequential(self):
        text = " ".join(["word"] * 500)
        chunks = chunk_text(text, chunk_size=50, overlap=10)
        for i, chunk in enumerate(chunks):
            assert chunk["chunk_id"] == i


class TestIngestionConfig:
    """Test configuration values."""

    def test_config_loads(self):
        from app.config import get_settings
        settings = get_settings()
        assert settings.APP_NAME == "Anveshan Research AI"
        assert settings.EMBEDDING_DIMENSION == 768
        assert 0 < settings.SIMILARITY_ALPHA < 1
        assert 0 < settings.SIMILARITY_BETA < 1
        assert settings.SIMILARITY_ALPHA + settings.SIMILARITY_BETA == pytest.approx(1.0)

    def test_allowed_extensions(self):
        from app.config import get_settings
        settings = get_settings()
        assert ".pdf" in settings.ALLOWED_EXTENSIONS
        assert ".md" in settings.ALLOWED_EXTENSIONS
        assert ".zip" in settings.ALLOWED_EXTENSIONS
        assert ".exe" not in settings.ALLOWED_EXTENSIONS


class TestOverlapLabels:
    """Test overlap label generation."""

    def test_high_overlap(self):
        from app.config import get_overlap_label
        assert get_overlap_label(0.85) == "High Overlap"

    def test_significant(self):
        from app.config import get_overlap_label
        assert get_overlap_label(0.65) == "Significant Similarity"

    def test_moderate(self):
        from app.config import get_overlap_label
        assert get_overlap_label(0.45) == "Moderate Connection"

    def test_weak(self):
        from app.config import get_overlap_label
        assert get_overlap_label(0.25) == "Weak Connection"

    def test_none(self):
        from app.config import get_overlap_label
        assert get_overlap_label(0.1) == "No Significant Connection"


class TestSeedData:
    """Test seed data integrity."""

    def test_seed_documents_exist(self):
        from app.seed.seed_data import get_seed_documents
        docs = get_seed_documents()
        assert len(docs) >= 8
        assert len(docs) <= 15

    def test_seed_departments(self):
        from app.seed.seed_data import get_seed_documents
        docs = get_seed_documents()
        departments = {d["department"] for d in docs}
        assert len(departments) >= 4  # At least 4 different departments

    def test_seed_required_fields(self):
        from app.seed.seed_data import get_seed_documents
        docs = get_seed_documents()
        for doc in docs:
            assert "title" in doc
            assert "filename" in doc
            assert "department" in doc
            assert "content" in doc
            assert len(doc["content"]) > 100


class TestZipSecurity:
    """Test ZIP file security measures."""

    def test_rejects_bad_zip(self):
        from app.services.extraction import extract_text_from_zip
        with pytest.raises(ValueError, match="Invalid ZIP"):
            extract_text_from_zip(b"not a zip file")

    def test_zip_slip_prevention(self):
        """Create a ZIP with path traversal and verify it's skipped."""
        import zipfile
        buf = io.BytesIO()
        with zipfile.ZipFile(buf, 'w') as zf:
            zf.writestr("../../../etc/passwd", "malicious content")
            zf.writestr("safe_file.py", "print('hello')")
        buf.seek(0)
        
        from app.services.extraction import extract_text_from_zip
        result = extract_text_from_zip(buf.read())
        assert "malicious content" not in result
        assert "hello" in result
