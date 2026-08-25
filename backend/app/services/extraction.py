"""Text extraction service for PDFs, Markdown, and ZIP files."""

import io
import os
import re
import zipfile
import logging
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)

# Safe filename pattern - only allow alphanumeric, dash, underscore, dot
SAFE_FILENAME_PATTERN = re.compile(r'^[\w\-. ]+$')
MAX_ZIP_FILES = 100
MAX_ZIP_TOTAL_SIZE = 100 * 1024 * 1024  # 100MB uncompressed


def sanitize_filename(filename: str) -> str:
    """Sanitize filename to prevent path traversal."""
    # Remove directory components
    filename = os.path.basename(filename)
    # Remove null bytes
    filename = filename.replace('\x00', '')
    # Remove path traversal patterns
    filename = filename.replace('..', '')
    filename = filename.replace('/', '').replace('\\', '')
    if not filename or filename.startswith('.'):
        filename = f"uploaded_file"
    return filename


def validate_file_extension(filename: str, allowed_extensions: list[str]) -> bool:
    """Validate file extension against allowed list."""
    ext = Path(filename).suffix.lower()
    return ext in allowed_extensions


def extract_text_from_pdf(content: bytes) -> str:
    """Extract text from PDF bytes."""
    try:
        from pypdf import PdfReader
        reader = PdfReader(io.BytesIO(content))
        text_parts = []
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text_parts.append(page_text)
        return "\n\n".join(text_parts)
    except Exception as e:
        logger.error(f"PDF extraction failed: {e}")
        raise ValueError(f"Failed to extract text from PDF: {e}")


def extract_text_from_markdown(content: bytes) -> str:
    """Extract text from Markdown bytes."""
    try:
        text = content.decode("utf-8", errors="replace")
        return text
    except Exception as e:
        logger.error(f"Markdown extraction failed: {e}")
        raise ValueError(f"Failed to extract text from Markdown: {e}")


def extract_text_from_zip(content: bytes) -> str:
    """Extract text from ZIP file containing code/docs.
    
    Treats all contents as untrusted. Only extracts text, never executes.
    """
    try:
        texts = []
        total_size = 0
        file_count = 0
        
        with zipfile.ZipFile(io.BytesIO(content), 'r') as zf:
            # Check for zip bombs
            for info in zf.infolist():
                total_size += info.file_size
                file_count += 1
                
                if total_size > MAX_ZIP_TOTAL_SIZE:
                    raise ValueError("ZIP file contents exceed maximum allowed size")
                if file_count > MAX_ZIP_FILES:
                    raise ValueError("ZIP file contains too many files")
            
            # Extract text from readable files
            text_extensions = {
                '.py', '.js', '.ts', '.tsx', '.jsx', '.java', '.cpp', '.c', '.h',
                '.go', '.rs', '.rb', '.php', '.md', '.txt', '.rst', '.yaml', '.yml',
                '.json', '.toml', '.cfg', '.ini', '.r', '.R', '.m', '.sql',
                '.html', '.css', '.xml', '.sh', '.bat', '.dockerfile',
            }
            
            for info in zf.infolist():
                if info.is_dir():
                    continue
                
                # Validate path - prevent zip slip
                name = info.filename
                if '..' in name or name.startswith('/') or name.startswith('\\'):
                    logger.warning(f"Skipping suspicious path in ZIP: {name}")
                    continue
                
                ext = Path(name).suffix.lower()
                if ext in text_extensions:
                    try:
                        file_content = zf.read(info.filename)
                        decoded = file_content.decode("utf-8", errors="replace")
                        texts.append(f"--- File: {name} ---\n{decoded}")
                    except Exception:
                        continue
        
        return "\n\n".join(texts)
    except zipfile.BadZipFile:
        raise ValueError("Invalid ZIP file")
    except ValueError:
        raise
    except Exception as e:
        logger.error(f"ZIP extraction failed: {e}")
        raise ValueError(f"Failed to extract text from ZIP: {e}")


def extract_text(content: bytes, filename: str) -> str:
    """Route extraction based on file type."""
    ext = Path(filename).suffix.lower()
    if ext == '.pdf':
        return extract_text_from_pdf(content)
    elif ext in ('.md', '.markdown'):
        return extract_text_from_markdown(content)
    elif ext == '.zip':
        return extract_text_from_zip(content)
    else:
        raise ValueError(f"Unsupported file type: {ext}")


def clean_text(text: str) -> str:
    """Clean and normalize extracted text."""
    # Remove excessive whitespace
    text = re.sub(r'\n{3,}', '\n\n', text)
    text = re.sub(r' {2,}', ' ', text)
    # Remove control characters except newlines/tabs
    text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', text)
    return text.strip()


def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 200) -> list[dict]:
    """Split text into overlapping chunks."""
    chunks = []
    if not text:
        return chunks
    
    words = text.split()
    current_chunk = []
    current_size = 0
    chunk_id = 0
    
    for word in words:
        current_chunk.append(word)
        current_size += len(word) + 1
        
        if current_size >= chunk_size:
            chunk_text_str = ' '.join(current_chunk)
            chunks.append({
                "chunk_id": chunk_id,
                "content": chunk_text_str,
            })
            chunk_id += 1
            
            # Keep overlap words
            overlap_words = int(overlap / (current_size / len(current_chunk)))
            current_chunk = current_chunk[-overlap_words:] if overlap_words > 0 else []
            current_size = sum(len(w) + 1 for w in current_chunk)
    
    # Add remaining text
    if current_chunk:
        chunk_text_str = ' '.join(current_chunk)
        if chunk_text_str.strip():
            chunks.append({
                "chunk_id": chunk_id,
                "content": chunk_text_str,
            })
    
    return chunks
