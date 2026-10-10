import io
import os
import re
import uuid
import logging
from typing import Tuple, Dict, Any
from fastapi import UploadFile, HTTPException, status
from pypdf import PdfReader
from docx import Document
from backend.app.core.config import get_settings
from backend.app.schemas.resume import ParsedProfile
from backend.app.prompts.resume_analysis import (
    RESUME_EXTRACTION_SYSTEM_PROMPT,
    build_resume_extraction_prompt
)
from backend.app.services.gemini_service import gemini_service

logger = logging.getLogger(__name__)
settings = get_settings()

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt"}

def sanitize_filename(filename: str) -> str:
    cleaned = re.sub(r"[^\w\s.-]", "", filename).strip()
    return cleaned if cleaned else "resume"

def extract_text_from_file(content_bytes: bytes, extension: str) -> str:
    text = ""
    try:
        if extension == ".pdf":
            reader = PdfReader(io.BytesIO(content_bytes))
            for page in reader.pages:
                extracted = page.extract_text()
                if extracted:
                    text += extracted + "\n"
        elif extension == ".docx":
            doc = Document(io.BytesIO(content_bytes))
            for para in doc.paragraphs:
                if para.text:
                    text += para.text + "\n"
        elif extension == ".txt":
            text = content_bytes.decode("utf-8", errors="ignore")
    except Exception as e:
        logger.error(f"Error extracting text from file ({extension}): {e}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Failed to extract text from {extension} file: {str(e)}"
        )
    return text.strip()

async def process_resume_upload(file: UploadFile, user_id: str) -> Tuple[str, str, ParsedProfile]:
    """
    Validates, securely stores, extracts text, and parses structured candidate profile with Gemini.
    Returns: (sanitized_filename, storage_path, parsed_profile)
    """
    filename = file.filename or "resume.pdf"
    name, ext = os.path.splitext(filename)
    ext = ext.lower()

    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{ext}'. Allowed formats: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    content = await file.read()
    max_bytes = settings.MAX_UPLOAD_MB * 1024 * 1024
    if len(content) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum allowed size of {settings.MAX_UPLOAD_MB}MB"
        )

    sanitized_name = sanitize_filename(name)

    # Reject files that contain no usable extracted text instead of inventing a profile.
    raw_text = extract_text_from_file(content, ext)
    if len(raw_text) < 20:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="No usable text could be extracted from this resume. Please upload a readable PDF, DOCX, or TXT file."
        )

    prompt = build_resume_extraction_prompt(raw_text)
    try:
        extracted_data = await gemini_service.generate_structured_json(
            system_prompt=RESUME_EXTRACTION_SYSTEM_PROMPT,
            user_prompt=prompt,
            temperature=0.1
        )
        parsed_profile = ParsedProfile(**extracted_data)
    except Exception as e:
        logger.error("Resume analysis failed (%s).", type(e).__name__)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Resume analysis failed. Please retry the upload."
        ) from e

    # Store only after extraction and real Gemini analysis both succeed.
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    stored_filename = f"{user_id}_{uuid.uuid4().hex[:8]}_{sanitized_name}{ext}"
    storage_path = os.path.join(settings.UPLOAD_DIR, stored_filename)
    with open(storage_path, "wb") as f:
        f.write(content)

    return sanitized_name + ext, storage_path, parsed_profile
